/* ---------------------------------------------------------------
   The trainer.

   A real person reads these and replies. There is no model on the
   other end of it, and the screen says so plainly — an app that
   quietly answered with a bot while charging for a human would be
   lying about the only thing it is selling.

   A question costs one credit per line, so ten credits buys a
   ten-line question. Spending is done in one statement on the
   database so two questions asked at once cannot both pass the
   same balance check.
   --------------------------------------------------------------- */
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { api } from './api';

/* What a pack costs. Nothing here takes the money — see buyCredits. */
export const PACK = { credits: 10, rupees: 39 };

export const MAX_LINES = 10;

/* Credits are lines. An empty line is not a line. */
export function linesIn(text) {
  return String(text || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .length;
}

/* A long single line is still more than one line of reading, so it
   counts as one per 90 characters — otherwise one credit buys an
   essay with no line breaks in it. */
export function costOf(text) {
  const t = String(text || '').trim();
  if (!t) return 0;
  const byLine = linesIn(t);
  const byLength = Math.ceil(t.length / 90);
  return Math.min(MAX_LINES, Math.max(1, byLine, byLength));
}

export async function myCredits(userId) {
  const { data, error } = await supabase
    .from('profiles').select('credits').eq('id', userId).single();
  return error ? 0 : (data.credits || 0);
}

export async function loadThread(userId) {
  const { data, error } = await supabase
    .from('messages')
    .select('id, sender, body, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(200);
  return error ? [] : (data || []);
}

/* ---------------------------------------------------------------
   Asking.

   The credits and the message move together, in one database
   function, so the two cannot come apart. Either the question is
   saved and paid for, or nothing happened at all — there is no
   window in which someone has been charged for a question that was
   never stored.

   The price is worked out on the server as well. costOf() below is
   only so the screen can show what a question will cost before it
   is sent; it is not what anybody is charged.
   --------------------------------------------------------------- */
export async function ask(userId, text) {
  const body = String(text || '').trim();
  if (!body) return { error: 'Write your question first.' };

  const cost = costOf(body);

  const { data, error } = await supabase.rpc('ask_trainer', { p_body: body });

  if (error) {
    if (/not enough/i.test(error.message)) return { error: 'notEnough', cost };
    if (/schema cache|does not exist|function/i.test(error.message)) {
      return { error: 'The trainer is not set up on the database yet — run supabase-v5.sql.' };
    }
    return { error: error.message };
  }

  return { message: data.message, cost: data.cost, left: data.left };
}

/* ---------------------------------------------------------------
   Buying.

   The app never tells the server that money moved — it cannot be
   trusted about that, and neither can anything running in a browser.
   All it does is ask for an order, open Razorpay's checkout, and
   then wait for the balance to change. The credits are added by the
   webhook in worker/index.js, after Razorpay's signature has been
   verified.

   That is why there is a wait at the end of buy(): the payment
   finishes on the phone a second or two before the webhook reaches
   us, so the screen watches the balance rather than assuming.
   --------------------------------------------------------------- */

const CHECKOUT_JS = 'https://checkout.razorpay.com/v1/checkout.js';

export async function payConfig() {
  try {
    const res = await fetch(api('/api/pay-config'));
    if (!res.ok) return { enabled: false };
    return res.json();
  } catch (e) {
    return { enabled: false };
  }
}

/* Razorpay's checkout is a script tag on a page. React Native has a
   `window` (it is the global object) but no `document`, so the old
   guard let this through and then threw on createElement. Checking
   the platform is the honest test. */
function loadCheckout() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return Promise.reject(new Error(
      'Credits can be bought on the website — open Reppo in a browser and sign in.',
    ));
  }
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const tag = document.createElement('script');
    tag.src = CHECKOUT_JS;
    tag.onload = () => resolve();
    tag.onerror = () => reject(new Error('Could not reach the payment page.'));
    document.head.appendChild(tag);
  });
}

async function token() {
  const { data } = await supabase.auth.getSession();
  return data && data.session && data.session.access_token;
}

/* Resolves { credits } once the webhook has landed, or
   { pending: true } if it is taking longer than it should. */
export async function buy({ userId, pack = 'p10', name, email }) {
  const cfg = await payConfig();
  if (!cfg.enabled) return { error: 'off' };

  try {
    await loadCheckout();
  } catch (e) {
    return { error: e.message };
  }

  const jwt = await token();
  if (!jwt) return { error: 'Sign in first.' };

  const made = await fetch(api('/api/create-order'), {
    method: 'POST',
    headers: { authorization: 'Bearer ' + jwt, 'content-type': 'application/json' },
    body: JSON.stringify({ pack }),
  });
  if (!made.ok) return { error: 'Could not start the payment. Try again.' };
  const order = await made.json();

  const before = await myCredits(userId);

  const paid = await new Promise((resolve) => {
    const rzp = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: 'Reppo',
      description: order.credits + ' credits',
      prefill: { name: name || '', email: email || '' },
      theme: { color: '#FF6B1A' },
      handler: () => resolve(true),
      modal: { ondismiss: () => resolve(false) },
    });
    rzp.on('payment.failed', () => resolve(false));
    rzp.open();
  });

  if (!paid) return { cancelled: true };

  /* Wait for the webhook. Usually a second; give it fifteen. */
  for (let i = 0; i < 15; i++) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 1000));
    // eslint-disable-next-line no-await-in-loop
    const now = await myCredits(userId);
    if (now > before) return { credits: now };
  }
  return { pending: true };
}
