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
import { supabase } from './supabase';

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

   Credits come off first. If the message then fails to save they
   are put back, because taking someone's credit and losing their
   question is the one outcome that must not happen.
   --------------------------------------------------------------- */
export async function ask(userId, text) {
  const body = String(text || '').trim();
  if (!body) return { error: 'Write your question first.' };

  const cost = costOf(body);

  const { data: left, error: spend } = await supabase
    .rpc('spend_credits', { n: cost, why: 'question' });

  if (spend) {
    if (/not enough/i.test(spend.message)) {
      return { error: 'notEnough', cost };
    }
    if (/schema cache|does not exist/i.test(spend.message)) {
      return { error: 'The trainer is not set up on the database yet — run supabase-v4.sql.' };
    }
    return { error: spend.message };
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({ user_id: userId, sender: 'client', body })
    .select()
    .single();

  if (error) {
    // give the credits back rather than losing both
    await supabase.rpc('spend_credits', { n: -cost, why: 'refund' }).catch(() => {});
    return { error: 'Could not send that. Your credits are untouched.' };
  }

  return { message: data, cost, left };
}

/* ---------------------------------------------------------------
   Buying.

   Deliberately not implemented. Wiring a real gateway means keys,
   a webhook that credits the account only after the provider
   confirms, and a refund path — none of which should be faked with
   a button that looks like it charges you.

   Until then the honest version is: you pay however you already
   take money, and grant the credits with
   `select public.grant_credits('them@example.com', 10, 'paid');`
   --------------------------------------------------------------- */
export const PAYMENTS_CONNECTED = false;
