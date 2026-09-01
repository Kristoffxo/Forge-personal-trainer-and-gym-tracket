/* ---------------------------------------------------------------
   The Cloudflare Worker.

   Two jobs:

     serve      everything that is not /api/ comes from the static
                build, exactly as before
     the hour   a cron trigger runs every hour and fans a push out to
                the devices that asked to hear from us at that hour

   The push carries no payload. It is a bare "wake up" — the service
   worker in public/sw.js picks the day's quote itself. That is a
   deliberate choice: a payload would have to be encrypted with the
   subscriber's own keys (aes128gcm over ECDH), which is a lot of
   fragile crypto to hand-roll, and it would mean the quote travels
   through a push service that has no business seeing it. This way
   the only thing on the wire is a signed, empty poke.

   All that leaves is the VAPID signature: an ES256 JWT saying who
   is sending. WebCrypto does that natively.

     npx wrangler secret put VAPID_PRIVATE_JWK
   --------------------------------------------------------------- */

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    /* A manual trigger, so the job can be tested without waiting for
       the hour to come round. Needs the same secret the cron uses.

         ?hour=18   only the six o'clock subscribers, as the cron does
         (no hour)  everybody, which is only ever what you want when
                    testing — say it out loud rather than by omission */
    if (url.pathname === '/api/send-daily') {
      if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
      const key = request.headers.get('x-admin-key') || '';
      if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) return json({ error: 'unauthorised' }, 401);
      const asked = url.searchParams.get('hour');
      const hour = asked === null || asked === '' ? null : Number(asked);
      if (hour !== null && !(Number.isInteger(hour) && hour >= 0 && hour <= 23)) {
        return json({ error: 'hour must be 0-23' }, 400);
      }
      const result = await sendDaily(env, hour);
      return json(result);
    }

    /* Both stores require a way to delete an account, and it has to
       remove the auth row — not just the profile. That needs the
       service key, which only exists here. */
    if (url.pathname === '/api/delete-account') {
      if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
      return deleteAccount(request, env).catch((err) => {
        console.error('delete failed', err && err.stack);
        return json({ error: 'failed' }, 500);
      });
    }

    /* ---- payments ---- */
    if (url.pathname === '/api/pay-config') return payConfig(env);

    if (url.pathname === '/api/create-order') {
      if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
      return createOrder(request, env).catch((err) => {
        console.error('create-order failed', err && err.stack);
        return json({ error: 'failed' }, 500);
      });
    }

    if (url.pathname === '/api/razorpay-webhook') {
      if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
      return razorpayWebhook(request, env).catch((err) => {
        console.error('webhook failed', err && err.stack);
        /* 500 makes Razorpay retry, which is what we want if our own
           side broke — the settle step is safe to repeat. */
        return json({ error: 'failed' }, 500);
      });
    }

    if (url.pathname.startsWith('/api/')) return json({ error: 'not_found' }, 404);
    return env.ASSETS.fetch(request);
  },

  /* Every hour, at half past UTC — which is on the hour in India.
     Whoever asked for this hour hears from us; nobody else does.
     Without that filter an hourly cron would push twenty-four times
     a day to everybody, so it is the one line here worth reading
     twice. See the cron in wrangler.jsonc. */
  async scheduled(event, env, ctx) {
    ctx.waitUntil(sendDaily(env, istHour(event && event.scheduledTime)));
  },
};

/* ---------------------------------------------------------------
   Send one empty push to every subscription we hold.

   A 404 or 410 from a push service means the browser threw the
   subscription away — uninstalled, cleared, permission revoked — so
   we delete our copy too rather than retrying it every evening
   forever.
   --------------------------------------------------------------- */
/* India runs at UTC+5:30 and Cloudflare crons are UTC only, so the
   cron fires at half past every UTC hour, which is on the hour here. */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function istHour(scheduledTime) {
  const at = new Date(scheduledTime || Date.now());
  return new Date(at.getTime() + IST_OFFSET_MS).getUTCHours();
}

/* `hour` null means everybody, which only the manual trigger ever
   asks for. The cron always names an hour. */
async function sendDaily(env, hour = null) {
  if (!env.VAPID_PRIVATE_JWK) return { error: 'VAPID_PRIVATE_JWK is not set' };

  const subs = await fetchSubs(env, hour);
  if (!subs.length) {
    return { sent: 0, gone: 0, failed: 0, hour, note: 'nobody subscribed for this hour' };
  }

  const key = await importVapidKey(env.VAPID_PRIVATE_JWK);

  let sent = 0, gone = 0, failed = 0;
  const dead = [];

  /* Push services rate-limit; a few at a time is plenty for a
     once-a-day job and keeps the Worker well inside its limits. */
  for (let i = 0; i < subs.length; i += 10) {
    const batch = subs.slice(i, i + 10);
    const results = await Promise.all(batch.map(async (s) => {
      try {
        const res = await fetch(s.endpoint, {
          method: 'POST',
          headers: {
            TTL: '43200',
            Authorization: await vapidHeader(s.endpoint, key, env),
            'Content-Length': '0',
          },
        });
        if (res.status === 404 || res.status === 410) return 'gone';
        return res.ok ? 'sent' : 'failed';
      } catch (e) {
        return 'failed';
      }
    }));
    results.forEach((r, j) => {
      if (r === 'sent') sent++;
      else if (r === 'gone') { gone++; dead.push(batch[j].endpoint); }
      else failed++;
    });
  }

  if (dead.length) await dropSubs(env, dead);
  return { sent, gone, failed, hour, total: subs.length };
}

/* ---------------------------------------------------------------
   Payments.

   The rule that shapes all of this: the app is never believed about
   whether money moved. It can ask for an order, and it can open the
   checkout, but credits are only ever added by the webhook, after
   Razorpay's signature over the raw body has been verified here.

   Three secrets:
     npx wrangler secret put RAZORPAY_KEY_ID
     npx wrangler secret put RAZORPAY_KEY_SECRET
     npx wrangler secret put RAZORPAY_WEBHOOK_SECRET
   --------------------------------------------------------------- */

/* What a pack is. Kept on the server so the price cannot be edited
   in a browser and then honoured. */
const PACKS = {
  p10: { credits: 10, paise: 3900 },     // ten credits, thirty-nine rupees
};

function payConfig(env) {
  const on = !!(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
  return json({
    enabled: on,
    keyId: on ? env.RAZORPAY_KEY_ID : null,
    packs: Object.entries(PACKS).map(([id, p]) => ({
      id, credits: p.credits, rupees: p.paise / 100,
    })),
  });
}

async function createOrder(request, env) {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    return json({ error: 'not_configured' }, 503);
  }

  const user = await whoIsAsking(request, env);
  if (!user) return json({ error: 'unauthorised' }, 401);

  let body = {};
  try { body = await request.json(); } catch (e) { /* defaults below */ }
  const pack = PACKS[body.pack] || PACKS.p10;

  const auth = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
  const made = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { authorization: 'Basic ' + auth, 'content-type': 'application/json' },
    body: JSON.stringify({
      amount: pack.paise,
      currency: 'INR',
      receipt: 'nemea-' + user.id.slice(0, 8) + '-' + Date.now(),
      notes: { user_id: user.id, credits: String(pack.credits) },
    }),
  });

  if (!made.ok) {
    console.error('razorpay refused the order', made.status, await made.text());
    return json({ error: 'gateway' }, 502);
  }
  const order = await made.json();

  /* Record it before handing the id back, so the webhook always has
     a row to settle even if it arrives before the app returns. */
  const saved = await fetch(env.SUPABASE_URL + '/rest/v1/payments', {
    method: 'POST',
    headers: { ...adminHeaders(env), prefer: 'return=minimal' },
    body: JSON.stringify({
      order_id: order.id, user_id: user.id,
      credits: pack.credits, paise: pack.paise,
    }),
  });
  if (!saved.ok) {
    console.error('could not record the order', saved.status, await saved.text());
    return json({ error: 'failed' }, 500);
  }

  return json({
    orderId: order.id, amount: pack.paise, currency: 'INR',
    keyId: env.RAZORPAY_KEY_ID, credits: pack.credits,
  });
}

/* ---------------------------------------------------------------
   The webhook. The only thing that can add credits.

   Razorpay signs the raw body with the webhook secret, so the body
   is read as text and verified before it is parsed — parsing first
   and re-serialising would change the bytes and break the check.
   --------------------------------------------------------------- */
async function razorpayWebhook(request, env) {
  const secret = env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return json({ error: 'not_configured' }, 503);

  const raw = await request.text();
  const sent = request.headers.get('x-razorpay-signature') || '';
  const ok = await validSignature(raw, sent, secret);
  if (!ok) {
    console.error('webhook signature did not match');
    return json({ error: 'bad_signature' }, 401);
  }

  const event = JSON.parse(raw);
  const kind = event && event.event;
  if (kind !== 'payment.captured' && kind !== 'order.paid') {
    return json({ ignored: kind });     // 200, so Razorpay stops retrying
  }

  const payment = event.payload && event.payload.payment && event.payload.payment.entity;
  const orderId = (payment && payment.order_id)
    || (event.payload && event.payload.order && event.payload.order.entity
        && event.payload.order.entity.id);
  const paymentId = (payment && payment.id) || orderId;

  if (!orderId) return json({ ignored: 'no order id' });

  const settled = await fetch(env.SUPABASE_URL + '/rest/v1/rpc/settle_payment', {
    method: 'POST',
    headers: adminHeaders(env),
    body: JSON.stringify({ p_order: orderId, p_payment: paymentId }),
  });

  if (!settled.ok) {
    console.error('settle_payment failed', settled.status, await settled.text());
    return json({ error: 'failed' }, 500);   // let Razorpay retry
  }

  const balance = await settled.json();
  console.log('settled', orderId, 'balance now', balance);
  return json({ ok: true });
}

/* Constant-time-ish compare of the HMAC, hex encoded. */
async function validSignature(raw, sent, secret) {
  if (!sent) return false;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
  if (hex.length !== sent.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ sent.charCodeAt(i);
  return diff === 0;
}

/* ---------------------------------------------------------------
   Who is asking.

   The caller proves who they are with their own Supabase access
   token. The id comes back from Supabase's answer about that token,
   never from the request body — otherwise anyone could buy credits
   into somebody else's account, or delete it.
   --------------------------------------------------------------- */
async function whoIsAsking(request, env) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token || !env.SUPABASE_SERVICE_KEY) return null;

  const who = await fetch(env.SUPABASE_URL + '/auth/v1/user', {
    headers: { authorization: 'Bearer ' + token, apikey: env.SUPABASE_SERVICE_KEY },
  });
  if (!who.ok) return null;

  const user = await who.json();
  return user && user.id ? user : null;
}

/* ---------------------------------------------------------------
   Deleting an account.

   The caller proves who they are with their own access token, and
   only ever deletes themselves — the id comes from Supabase's answer
   about the token, never from the request body. Everything else
   cascades off auth.users.
   --------------------------------------------------------------- */
async function deleteAccount(request, env) {
  if (!env.SUPABASE_SERVICE_KEY) return json({ error: 'not_configured' }, 503);

  const user = await whoIsAsking(request, env);
  if (!user) return json({ error: 'unauthorised' }, 401);

  // their feed photographs are not covered by the cascade
  await fetch(
    `${env.SUPABASE_URL}/storage/v1/object/posts/${user.id}`,
    { method: 'DELETE', headers: adminHeaders(env) },
  ).catch(() => {});

  const gone = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
    method: 'DELETE',
    headers: adminHeaders(env),
  });
  if (!gone.ok) {
    console.error('admin delete refused', gone.status, await gone.text());
    return json({ error: 'failed' }, 500);
  }
  return json({ deleted: true });
}

/* ---------------------------------------------------------------
   Supabase, with the service role key — this runs with nobody
   signed in, so row-level security has to be stepped around by a
   credential that only ever lives here.
   --------------------------------------------------------------- */
async function fetchSubs(env, hour = null) {
  const where = hour === null ? '' : `&send_hour=eq.${hour}`;
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/push_subs?select=endpoint${where}`,
    { headers: adminHeaders(env) },
  );
  if (!res.ok) {
    const body = await res.text();
    /* Before supabase-v6.sql there is no send_hour column. Sending
       everybody the six o'clock push is the right thing to fall back
       on — it is what the app did before any of this. */
    if (hour !== null && /send_hour/.test(body)) {
      console.warn('push_subs has no send_hour yet — run supabase-v6.sql');
      return hour === 18 ? fetchSubs(env, null) : [];
    }
    console.error('could not read push_subs', res.status, body);
    return [];
  }
  return res.json();
}

async function dropSubs(env, endpoints) {
  const list = endpoints.map((e) => '"' + e.replace(/"/g, '\\"') + '"').join(',');
  await fetch(
    `${env.SUPABASE_URL}/rest/v1/push_subs?endpoint=in.(${encodeURIComponent(list)})`,
    { method: 'DELETE', headers: adminHeaders(env) },
  ).catch(() => {});
}

function adminHeaders(env) {
  return {
    apikey: env.SUPABASE_SERVICE_KEY,
    authorization: 'Bearer ' + env.SUPABASE_SERVICE_KEY,
    'content-type': 'application/json',
  };
}

/* ---------------------------------------------------------------
   VAPID: an ES256 JWT that says who is sending, and to which push
   service, signed with the private half of the key pair whose
   public half the browser subscribed with.
   --------------------------------------------------------------- */
async function importVapidKey(jwkText) {
  const jwk = typeof jwkText === 'string' ? JSON.parse(jwkText) : jwkText;
  return crypto.subtle.importKey(
    'jwk',
    { ...jwk, key_ops: ['sign'], ext: true },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
}

const b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const b64urlText = (s) => b64url(new TextEncoder().encode(s));

async function vapidHeader(endpoint, key, env) {
  const aud = new URL(endpoint).origin;
  const header = b64urlText(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const claims = b64urlText(JSON.stringify({
    aud,
    // twelve hours; push services reject anything longer than 24
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: env.VAPID_SUBJECT || 'mailto:admin@nemea.app',
  }));

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(`${header}.${claims}`),
  );

  const jwt = `${header}.${claims}.${b64url(signature)}`;
  return `vapid t=${jwt}, k=${env.VAPID_PUBLIC}`;
}
