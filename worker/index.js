/* ---------------------------------------------------------------
   The Cloudflare Worker.

   Two jobs:

     serve      everything that is not /api/ comes from the static
                build, exactly as before
     six p.m.   a cron trigger fans a push out to every subscribed
                device, once a day

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

    /* A manual trigger, so the nightly job can be tested without
       waiting until six. Needs the same secret the cron uses. */
    if (url.pathname === '/api/send-daily') {
      if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
      const key = request.headers.get('x-admin-key') || '';
      if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) return json({ error: 'unauthorised' }, 401);
      const result = await sendDaily(env);
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

    if (url.pathname.startsWith('/api/')) return json({ error: 'not_found' }, 404);
    return env.ASSETS.fetch(request);
  },

  /* 12:30 UTC = 18:00 India. See the cron in wrangler.jsonc. */
  async scheduled(event, env, ctx) {
    ctx.waitUntil(sendDaily(env));
  },
};

/* ---------------------------------------------------------------
   Send one empty push to every subscription we hold.

   A 404 or 410 from a push service means the browser threw the
   subscription away — uninstalled, cleared, permission revoked — so
   we delete our copy too rather than retrying it every evening
   forever.
   --------------------------------------------------------------- */
async function sendDaily(env) {
  if (!env.VAPID_PRIVATE_JWK) return { error: 'VAPID_PRIVATE_JWK is not set' };

  const subs = await fetchSubs(env);
  if (!subs.length) return { sent: 0, gone: 0, failed: 0, note: 'nobody subscribed' };

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
  return { sent, gone, failed, total: subs.length };
}

/* ---------------------------------------------------------------
   Deleting an account.

   The caller proves who they are with their own access token, and
   only ever deletes themselves — the id comes from Supabase's answer
   about the token, never from the request body. Everything else
   cascades off auth.users.
   --------------------------------------------------------------- */
async function deleteAccount(request, env) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return json({ error: 'unauthorised' }, 401);
  if (!env.SUPABASE_SERVICE_KEY) return json({ error: 'not_configured' }, 503);

  const who = await fetch(env.SUPABASE_URL + '/auth/v1/user', {
    headers: { authorization: 'Bearer ' + token, apikey: env.SUPABASE_SERVICE_KEY },
  });
  if (!who.ok) return json({ error: 'unauthorised' }, 401);
  const user = await who.json();
  if (!user || !user.id) return json({ error: 'unauthorised' }, 401);

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
async function fetchSubs(env) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/push_subs?select=endpoint`,
    { headers: adminHeaders(env) },
  );
  if (!res.ok) {
    console.error('could not read push_subs', res.status, await res.text());
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
