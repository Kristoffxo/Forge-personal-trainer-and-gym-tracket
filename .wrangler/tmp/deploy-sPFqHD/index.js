var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker/legal/shared.js
var UPDATED = "2 September 2026";
function page(title, body) {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} \u2014 Reppo</title>
<style>
  :root { color-scheme: dark; }
  body { margin:0; background:#0B0B0E; color:#E7E7EA;
         font:16px/1.65 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; }
  main { max-width: 44rem; margin: 0 auto; padding: 3rem 1.25rem 6rem; }
  .mark { display:flex; align-items:center; gap:.7rem; margin-bottom:2.5rem; }
  .mark img { width:38px; height:38px; }
  .mark span { font-weight:600; letter-spacing:.28em; text-transform:uppercase; font-size:.9rem; }
  h1 { font-size:2rem; line-height:1.2; margin:0 0 .4rem; }
  .when { color:#8A8A93; font-size:.9rem; margin:0 0 2.5rem; }
  h2 { font-size:1.15rem; margin:2.5rem 0 .6rem; color:#fff; }
  p, li { color:#C9C9CF; }
  ul { padding-left:1.2rem; }
  li { margin:.35rem 0; }
  a { color:#FE4E02; }
  code { background:#16161B; padding:.15em .4em; border-radius:4px; font-size:.9em; }
  footer { margin-top:4rem; padding-top:1.5rem; border-top:1px solid #26262E;
           color:#7A7A83; font-size:.9rem; }
  footer a { margin-right:1.2rem; }
</style>
</head><body><main>
  <div class="mark"><img src="/icons/icon-192.png?v=reppo" alt=""><span>Reppo</span></div>
  <h1>${title}</h1>
  <p class="when">Last updated ${UPDATED}</p>
  ${body}
  <footer>
    <a href="/privacy">Privacy</a><a href="/terms">Terms</a>
    <a href="/delete-account">Delete your account</a><a href="/">Open Reppo</a>
  </footer>
</main></body></html>`;
}
__name(page, "page");
var CONTACT = "thearyanbasantani@gmail.com";

// worker/legal/privacy.js
var privacy = /* @__PURE__ */ __name(() => page("Privacy Policy", `
<p>Reppo is a training and nutrition app. This policy says what it collects, why,
and what you can do about it. It is short because the app does little.</p>

<h2>Who runs it</h2>
<p>Reppo is run by an individual developer, Aryan Basantani, in India.
Contact: <a href="mailto:${CONTACT}">${CONTACT}</a>.</p>

<h2>What is collected</h2>
<ul>
  <li><strong>Your email address and password.</strong> Handled by Supabase Auth.
      The password is hashed by them; this app never sees or stores it.</li>
  <li><strong>Your name.</strong> Only the first word of it is ever shown to
      other people.</li>
  <li><strong>What you told the app about your body</strong> \u2014 height, weight,
      age, sex, experience and calorie goal. Used to work out a daily calorie
      target and to size your sessions.</li>
  <li><strong>What you log</strong> \u2014 the days you trained, the food you added,
      and your weight over time.</li>
  <li><strong>Photographs you choose to post</strong> to Discover, and any
      caption you write with them.</li>
  <li><strong>Which mode you use</strong> \u2014 men, women or seniors \u2014 and, on the
      women's side, that you opened the menstrual-pain sessions. This is health
      information and is treated as such: it is stored against your account and
      shown to nobody else.</li>
  <li><strong>A notification token</strong>, only if you turn reminders on.</li>
</ul>

<h2>What is not collected</h2>
<ul>
  <li>No location, ever. Photographs are re-encoded before upload, which strips
      the GPS coordinates a phone camera writes into them.</li>
  <li>No contacts, no call logs, no microphone.</li>
  <li>No advertising identifier. There are no ads and no ad networks.</li>
  <li>No analytics or tracking SDK of any kind.</li>
  <li>Nothing is sold or shared with anyone for advertising.</li>
</ul>

<h2>The camera</h2>
<p>The camera is used in two places. Posting a photograph to Discover uses it
once, when you press the button, and the photograph is uploaded only after you
press Post. On the website, the rep counter watches the camera to count
push-ups and squats \u2014 that video is processed on your own device, frame by
frame, and never leaves it. No video is recorded, stored or uploaded by either.</p>

<h2>Where it goes</h2>
<p>Everything is stored with <a href="https://supabase.com/privacy">Supabase</a>,
which hosts the database and the photograph storage. The app is served through
<a href="https://www.cloudflare.com/privacypolicy/">Cloudflare</a>. Push
notifications, on the website, go through the browser maker's push service \u2014
Google, Apple or Mozilla depending on your browser \u2014 and carry no content: the
message is chosen on your own device after the notification arrives.</p>

<h2>Who can see what</h2>
<ul>
  <li>Your food diary, your weight, your workouts, your numbers and your health
      information: only you. This is enforced by the database itself, not only
      by the app.</li>
  <li>Photographs you post to Discover, and your first name: anyone signed in.
      They delete themselves after seven days.</li>
  <li>Nobody can see who liked a post, including the person who posted it.</li>
</ul>

<h2>How long it is kept</h2>
<p>Discover photographs are deleted automatically seven days after they are
posted. Everything else is kept until you delete your account, at which point it
goes with it.</p>

<h2>Deleting everything</h2>
<p>In the app: the three dots at the top left, then Delete my account. It removes
the account and everything attached to it, and cannot be undone.
Or ask from a browser at <a href="/delete-account">reppo.app/delete-account</a>.</p>

<h2>Children</h2>
<p>Reppo is not directed at children and is not intended for anyone under 13.
If you believe a child has an account, write to
<a href="mailto:${CONTACT}">${CONTACT}</a> and it will be removed.</p>

<h2>Your rights</h2>
<p>You can see, correct, export or delete your data. Ask at
<a href="mailto:${CONTACT}">${CONTACT}</a> and it will be dealt with within
30 days.</p>

<h2>Changes</h2>
<p>If this policy changes in a way that matters, the app will say so the next
time you open it. The date at the top always reflects the current version.</p>
`), "privacy");

// worker/legal/terms.js
var terms = /* @__PURE__ */ __name(() => page("Terms of Use", `
<p>By using Reppo you agree to these terms. They are deliberately short.</p>

<h2>Reppo is not medical advice</h2>
<p>It is a training and nutrition app, not a doctor, a physiotherapist or a
dietitian. The workouts, the calorie targets and the period-pain sessions are
general information. They are not a diagnosis and not a treatment.</p>
<p>Speak to a doctor before starting if you are pregnant, recovering from
surgery or an injury, have a heart condition, or have been told to be careful
with a joint. Stop and get help if you feel chest pain, dizziness or sudden
shortness of breath. You exercise at your own risk.</p>

<h2>Your account</h2>
<p>One account per person. Keep your password to yourself. Tell us if someone
else gets into your account.</p>

<h2>What you post</h2>
<p>You keep ownership of your photographs. By posting one to Discover you allow
Reppo to show it to other signed-in users for the seven days before it deletes
itself.</p>
<p>Do not post: anyone else's photograph without their agreement, nudity or
sexual content, anything hateful or harassing, anything illegal, or anything
that is not yours to post. Posts can be removed and accounts can be closed for
breaking this, without notice.</p>
<p>Every post can be reported and every person can be blocked, from the dots on
the post itself. Reports are read.</p>

<h2>Ending it</h2>
<p>Delete your account whenever you like, from the app or from
<a href="/delete-account">reppo.app/delete-account</a>. We can close an account
that breaks these terms.</p>

<h2>No promises about uptime</h2>
<p>Reppo is provided as it is. It may be unavailable, it may lose data, and it
is free. To the extent the law allows, there is no liability for loss arising
from using it.</p>

<h2>Law</h2>
<p>These terms are governed by the laws of India.</p>

<h2>Contact</h2>
<p><a href="mailto:${CONTACT}">${CONTACT}</a></p>
`), "terms");

// worker/legal/deleteAccount.js
var deleteAccount = /* @__PURE__ */ __name(() => page("Delete your account", `
<p>Deleting your Reppo account removes the account itself and everything
attached to it: your workouts, your food diary, your weight history, your
photographs on Discover, and anything you told the app about your body. It
cannot be undone and there is no grace period.</p>

<h2>The fastest way \u2014 in the app</h2>
<ol>
  <li>Open Reppo and sign in.</li>
  <li>Tap the three dots at the top left.</li>
  <li>Scroll to <strong>Delete your account</strong>.</li>
  <li>Confirm twice. It happens immediately.</li>
</ol>

<h2>Without the app</h2>
<p>Email <a href="mailto:${CONTACT}?subject=Delete%20my%20Reppo%20account">${CONTACT}</a>
from the address you signed up with, with the subject
<em>Delete my Reppo account</em>. It will be done within 30 days, usually the
same week, and you will get a note when it is finished.</p>
<p>The email has to come from the address on the account. It is the only way to
be sure the request is really yours.</p>

<h2>What is deleted</h2>
<ul>
  <li>Your account and sign-in details</li>
  <li>Your name, height, weight, age, sex, goals and calorie target</li>
  <li>Every workout, food entry and weight you logged</li>
  <li>Your Discover photographs and captions, and your likes and comments</li>
  <li>Your notification token, if you had reminders on</li>
</ul>

<h2>What is kept, and for how long</h2>
<p>Nothing is kept about you after deletion. Ordinary server logs kept by our
hosting providers may hold an IP address for up to 30 days before they rotate
out; those are not linked to your account once it is gone.</p>
`), "deleteAccount");

// worker/index.js
var JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };
var HTML = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "public, max-age=600"
};
var json = /* @__PURE__ */ __name((body, status = 200) => new Response(JSON.stringify(body), { status, headers: JSON_HEADERS }), "json");
var index_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/send-daily") {
      if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
      const key = request.headers.get("x-admin-key") || "";
      if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) return json({ error: "unauthorised" }, 401);
      const asked = url.searchParams.get("hour");
      const hour = asked === null || asked === "" ? null : Number(asked);
      if (hour !== null && !(Number.isInteger(hour) && hour >= 0 && hour <= 23)) {
        return json({ error: "hour must be 0-23" }, 400);
      }
      const result = await sendDaily(env, hour);
      return json(result);
    }
    if (url.pathname === "/api/delete-account") {
      if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
      return deleteAccount2(request, env).catch((err) => {
        console.error("delete failed", err && err.stack);
        return json({ error: "failed" }, 500);
      });
    }
    if (url.pathname === "/privacy") return new Response(privacy(), { headers: HTML });
    if (url.pathname === "/terms") return new Response(terms(), { headers: HTML });
    if (url.pathname === "/delete-account") return new Response(deleteAccount(), { headers: HTML });
    if (url.pathname === "/api/pay-config") return payConfig(env);
    if (url.pathname === "/api/create-order") {
      if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
      return createOrder(request, env).catch((err) => {
        console.error("create-order failed", err && err.stack);
        return json({ error: "failed" }, 500);
      });
    }
    if (url.pathname === "/api/razorpay-webhook") {
      if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
      return razorpayWebhook(request, env).catch((err) => {
        console.error("webhook failed", err && err.stack);
        return json({ error: "failed" }, 500);
      });
    }
    if (url.pathname.startsWith("/api/")) return json({ error: "not_found" }, 404);
    return env.ASSETS.fetch(request);
  },
  /* Every hour, at half past UTC — which is on the hour in India.
     Whoever asked for this hour hears from us; nobody else does.
     Without that filter an hourly cron would push twenty-four times
     a day to everybody, so it is the one line here worth reading
     twice. See the cron in wrangler.jsonc. */
  async scheduled(event, env, ctx) {
    ctx.waitUntil(sendDaily(env, istHour(event && event.scheduledTime)));
  }
};
var IST_OFFSET_MS = 5.5 * 60 * 60 * 1e3;
function istHour(scheduledTime) {
  const at = new Date(scheduledTime || Date.now());
  return new Date(at.getTime() + IST_OFFSET_MS).getUTCHours();
}
__name(istHour, "istHour");
async function sendDaily(env, hour = null) {
  if (!env.VAPID_PRIVATE_JWK) return { error: "VAPID_PRIVATE_JWK is not set" };
  const subs = await fetchSubs(env, hour);
  if (!subs.length) {
    return { sent: 0, gone: 0, failed: 0, hour, note: "nobody subscribed for this hour" };
  }
  const key = await importVapidKey(env.VAPID_PRIVATE_JWK);
  let sent = 0, gone = 0, failed = 0;
  const dead = [];
  for (let i = 0; i < subs.length; i += 10) {
    const batch = subs.slice(i, i + 10);
    const results = await Promise.all(batch.map(async (s) => {
      try {
        const res = await fetch(s.endpoint, {
          method: "POST",
          headers: {
            TTL: "43200",
            Authorization: await vapidHeader(s.endpoint, key, env),
            "Content-Length": "0"
          }
        });
        if (res.status === 404 || res.status === 410) return "gone";
        return res.ok ? "sent" : "failed";
      } catch (e) {
        return "failed";
      }
    }));
    results.forEach((r, j) => {
      if (r === "sent") sent++;
      else if (r === "gone") {
        gone++;
        dead.push(batch[j].endpoint);
      } else failed++;
    });
  }
  if (dead.length) await dropSubs(env, dead);
  return { sent, gone, failed, hour, total: subs.length };
}
__name(sendDaily, "sendDaily");
var PACKS = {
  p10: { credits: 10, paise: 3900 }
  // ten credits, thirty-nine rupees
};
function payConfig(env) {
  const on = !!(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
  return json({
    enabled: on,
    keyId: on ? env.RAZORPAY_KEY_ID : null,
    packs: Object.entries(PACKS).map(([id, p]) => ({
      id,
      credits: p.credits,
      rupees: p.paise / 100
    }))
  });
}
__name(payConfig, "payConfig");
async function createOrder(request, env) {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    return json({ error: "not_configured" }, 503);
  }
  const user = await whoIsAsking(request, env);
  if (!user) return json({ error: "unauthorised" }, 401);
  let body = {};
  try {
    body = await request.json();
  } catch (e) {
  }
  const pack = PACKS[body.pack] || PACKS.p10;
  const auth = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
  const made = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { authorization: "Basic " + auth, "content-type": "application/json" },
    body: JSON.stringify({
      amount: pack.paise,
      currency: "INR",
      receipt: "reppo-" + user.id.slice(0, 8) + "-" + Date.now(),
      notes: { user_id: user.id, credits: String(pack.credits) }
    })
  });
  if (!made.ok) {
    console.error("razorpay refused the order", made.status, await made.text());
    return json({ error: "gateway" }, 502);
  }
  const order = await made.json();
  const saved = await fetch(env.SUPABASE_URL + "/rest/v1/payments", {
    method: "POST",
    headers: { ...adminHeaders(env), prefer: "return=minimal" },
    body: JSON.stringify({
      order_id: order.id,
      user_id: user.id,
      credits: pack.credits,
      paise: pack.paise
    })
  });
  if (!saved.ok) {
    console.error("could not record the order", saved.status, await saved.text());
    return json({ error: "failed" }, 500);
  }
  return json({
    orderId: order.id,
    amount: pack.paise,
    currency: "INR",
    keyId: env.RAZORPAY_KEY_ID,
    credits: pack.credits
  });
}
__name(createOrder, "createOrder");
async function razorpayWebhook(request, env) {
  const secret = env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return json({ error: "not_configured" }, 503);
  const raw = await request.text();
  const sent = request.headers.get("x-razorpay-signature") || "";
  const ok = await validSignature(raw, sent, secret);
  if (!ok) {
    console.error("webhook signature did not match");
    return json({ error: "bad_signature" }, 401);
  }
  const event = JSON.parse(raw);
  const kind = event && event.event;
  if (kind !== "payment.captured" && kind !== "order.paid") {
    return json({ ignored: kind });
  }
  const payment = event.payload && event.payload.payment && event.payload.payment.entity;
  const orderId = payment && payment.order_id || event.payload && event.payload.order && event.payload.order.entity && event.payload.order.entity.id;
  const paymentId = payment && payment.id || orderId;
  if (!orderId) return json({ ignored: "no order id" });
  const settled = await fetch(env.SUPABASE_URL + "/rest/v1/rpc/settle_payment", {
    method: "POST",
    headers: adminHeaders(env),
    body: JSON.stringify({ p_order: orderId, p_payment: paymentId })
  });
  if (!settled.ok) {
    console.error("settle_payment failed", settled.status, await settled.text());
    return json({ error: "failed" }, 500);
  }
  const balance = await settled.json();
  console.log("settled", orderId, "balance now", balance);
  return json({ ok: true });
}
__name(razorpayWebhook, "razorpayWebhook");
async function validSignature(raw, sent, secret) {
  if (!sent) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  if (hex.length !== sent.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ sent.charCodeAt(i);
  return diff === 0;
}
__name(validSignature, "validSignature");
async function whoIsAsking(request, env) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token || !env.SUPABASE_SERVICE_KEY) return null;
  const who = await fetch(env.SUPABASE_URL + "/auth/v1/user", {
    headers: { authorization: "Bearer " + token, apikey: env.SUPABASE_SERVICE_KEY }
  });
  if (!who.ok) return null;
  const user = await who.json();
  return user && user.id ? user : null;
}
__name(whoIsAsking, "whoIsAsking");
async function deleteAccount2(request, env) {
  if (!env.SUPABASE_SERVICE_KEY) return json({ error: "not_configured" }, 503);
  const user = await whoIsAsking(request, env);
  if (!user) return json({ error: "unauthorised" }, 401);
  await fetch(
    `${env.SUPABASE_URL}/storage/v1/object/posts/${user.id}`,
    { method: "DELETE", headers: adminHeaders(env) }
  ).catch(() => {
  });
  const gone = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
    method: "DELETE",
    headers: adminHeaders(env)
  });
  if (!gone.ok) {
    console.error("admin delete refused", gone.status, await gone.text());
    return json({ error: "failed" }, 500);
  }
  return json({ deleted: true });
}
__name(deleteAccount2, "deleteAccount");
async function fetchSubs(env, hour = null) {
  const where = hour === null ? "" : `&send_hour=eq.${hour}`;
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/push_subs?select=endpoint${where}`,
    { headers: adminHeaders(env) }
  );
  if (!res.ok) {
    const body = await res.text();
    if (hour !== null && /send_hour/.test(body)) {
      console.warn("push_subs has no send_hour yet \u2014 run supabase-v6.sql");
      return hour === 18 ? fetchSubs(env, null) : [];
    }
    console.error("could not read push_subs", res.status, body);
    return [];
  }
  return res.json();
}
__name(fetchSubs, "fetchSubs");
async function dropSubs(env, endpoints) {
  const list = endpoints.map((e) => '"' + e.replace(/"/g, '\\"') + '"').join(",");
  await fetch(
    `${env.SUPABASE_URL}/rest/v1/push_subs?endpoint=in.(${encodeURIComponent(list)})`,
    { method: "DELETE", headers: adminHeaders(env) }
  ).catch(() => {
  });
}
__name(dropSubs, "dropSubs");
function adminHeaders(env) {
  return {
    apikey: env.SUPABASE_SERVICE_KEY,
    authorization: "Bearer " + env.SUPABASE_SERVICE_KEY,
    "content-type": "application/json"
  };
}
__name(adminHeaders, "adminHeaders");
async function importVapidKey(jwkText) {
  const jwk = typeof jwkText === "string" ? JSON.parse(jwkText) : jwkText;
  return crypto.subtle.importKey(
    "jwk",
    { ...jwk, key_ops: ["sign"], ext: true },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
}
__name(importVapidKey, "importVapidKey");
var b64url = /* @__PURE__ */ __name((bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""), "b64url");
var b64urlText = /* @__PURE__ */ __name((s) => b64url(new TextEncoder().encode(s)), "b64urlText");
async function vapidHeader(endpoint, key, env) {
  const aud = new URL(endpoint).origin;
  const header = b64urlText(JSON.stringify({ typ: "JWT", alg: "ES256" }));
  const claims = b64urlText(JSON.stringify({
    aud,
    // twelve hours; push services reject anything longer than 24
    exp: Math.floor(Date.now() / 1e3) + 12 * 3600,
    sub: env.VAPID_SUBJECT || "mailto:admin@reppo.app"
  }));
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(`${header}.${claims}`)
  );
  const jwt = `${header}.${claims}.${b64url(signature)}`;
  return `vapid t=${jwt}, k=${env.VAPID_PUBLIC}`;
}
__name(vapidHeader, "vapidHeader");
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
