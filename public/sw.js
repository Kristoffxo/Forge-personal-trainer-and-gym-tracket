/* ---------------------------------------------------------------
   Reppo service worker.

   The two placeholders below are filled in by scripts/build-web.mjs
   after `expo export` runs, so every build ships a service worker
   with different bytes. That is what makes the browser notice a new
   version and re-precache the new bundle.

     navigations  network first, 4s timeout, cached shell as fallback
     static       cache first, they carry a content hash in the name
     Supabase     never touched, it is cross-origin and always live
   --------------------------------------------------------------- */

const BUILD = '__BUILD_ID__';
const CACHE = 'reppo-' + BUILD;

/* Filled in at build time with the real, hashed filenames. */
const PRECACHE = __PRECACHE__;

const SHELL = '/index.html';
const NAV_TIMEOUT = 4000;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // One bad URL must not fail the whole install, so add them one by one.
      await Promise.all(
        PRECACHE.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch((e) => {
            console.warn('[sw] could not precache', url, e);
          })
        )
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => n.startsWith('reppo-') && n !== CACHE).map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

function timedFetch(request, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    fetch(request).then(
      (res) => { clearTimeout(timer); resolve(res); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Anything that writes, and anything that is not ours, goes straight to the
  // network. That covers every Supabase call.
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // The app is a single page, so every navigation resolves to the same shell.
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await timedFetch(req, NAV_TIMEOUT);
          if (fresh && fresh.ok) {
            const cache = await caches.open(CACHE);
            cache.put(SHELL, fresh.clone());
          }
          return fresh;
        } catch (e) {
          const cached = (await caches.match(SHELL)) || (await caches.match('/'));
          if (cached) return cached;
          return new Response(
            '<!doctype html><meta charset="utf-8"><title>Reppo</title>' +
              '<body style="margin:0;background:#12110F;color:#A9A29A;font:16px -apple-system,sans-serif;' +
              'display:flex;align-items:center;justify-content:center;height:100vh">' +
              'Offline. Open Reppo once with a connection and it will work without one.</body>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 503 }
          );
        }
      })()
    );
    return;
  }

  // Static assets. Their names carry a content hash, so a hit is always correct.
  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res && res.ok && res.type === 'basic') {
          const cache = await caches.open(CACHE);
          cache.put(req, res.clone());
        }
        return res;
      } catch (e) {
        const shell = await caches.match(SHELL);
        if (req.destination === 'document' && shell) return shell;
        throw e;
      }
    })()
  );
});

/* ---------------------------------------------------------------
   The six o'clock quote.

   The push arrives with no payload at all — the server only says
   "wake up". The worker picks the line itself from the list below,
   keyed on the date, so everybody gets the same quote on the same
   evening and nothing personal ever travels over the wire.

   Keep this list in step with src/quotes.js.
   --------------------------------------------------------------- */
const DAILY = [
  ['It is a shame for a man to grow old without seeing the beauty and strength of which his body is capable.', 'Socrates'],
  ['The first wealth is health.', 'Ralph Waldo Emerson'],
  ['Difficulties strengthen the mind, as labour does the body.', 'Seneca'],
  ['The impediment to action advances action. What stands in the way becomes the way.', 'Marcus Aurelius'],
  ['You have power over your mind \u2014 not outside events. Realise this, and you will find strength.', 'Marcus Aurelius'],
  ['Waste no more time arguing what a good man should be. Be one.', 'Marcus Aurelius'],
  ['First say to yourself what you would be; and then do what you have to do.', 'Epictetus'],
  ['No man is free who is not master of himself.', 'Epictetus'],
  ['Well-being is realised by small steps, but is truly no small thing.', 'Zeno of Citium'],
  ['Walking is man\u2019s best medicine.', 'Hippocrates'],
  ['A sound mind in a sound body.', 'Juvenal'],
  ['The greatest wealth is health.', 'Virgil'],
  ['A feeble body weakens the mind.', 'Jean-Jacques Rousseau'],
  ['He who has a why to live can bear almost any how.', 'Friedrich Nietzsche'],
  ['That which does not kill us makes us stronger.', 'Friedrich Nietzsche'],
  ['We are what we repeatedly do. Excellence, then, is not an act, but a habit.', 'Will Durant'],
  ['The body is the servant of the mind.', 'James Allen'],
  ['Begin at once to live, and count each separate day as a separate life.', 'Seneca'],
  ['It is not that we have a short time to live, but that we waste much of it.', 'Seneca'],
  ['The wish for healing has always been half of health.', 'Seneca'],
  ['No man has the right to be an amateur in the matter of physical training.', 'Socrates'],
  ['Know thyself.', 'Inscription at Delphi'],
  ['The unexamined life is not worth living.', 'Socrates'],
  ['Happiness is the highest good, and it is an activity of the soul.', 'Aristotle'],
  ['Patience is bitter, but its fruit is sweet.', 'Aristotle'],
  ['Energy and persistence conquer all things.', 'Benjamin Franklin'],
  ['To keep the body in good health is a duty, for otherwise we shall not be able to keep our mind strong and clear.', 'The Buddha'],
  ['Health is the greatest gift, contentment the greatest wealth.', 'The Buddha'],
];

function quoteToday() {
  const n = Math.floor(Date.now() / 86400000);
  return DAILY[((n % DAILY.length) + DAILY.length) % DAILY.length];
}

self.addEventListener('push', (event) => {
  const [line, who] = quoteToday();
  event.waitUntil(
    self.registration.showNotification('Reppo', {
      body: line + '\n\u2014 ' + who,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-96.png',
      tag: 'reppo-daily',
      renotify: false,
      data: { url: '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) {
      if (c.url.includes(self.location.origin)) return c.focus();
    }
    return self.clients.openWindow('/');
  })());
});
