/* ---------------------------------------------------------------
   Mesamorfit service worker.

   The two placeholders below are filled in by scripts/build-web.mjs
   after `expo export` runs, so every build ships a service worker
   with different bytes. That is what makes the browser notice a new
   version and re-precache the new bundle.

     navigations  network first, 4s timeout, cached shell as fallback
     static       cache first, they carry a content hash in the name
     Supabase     never touched, it is cross-origin and always live
   --------------------------------------------------------------- */

const BUILD = '__BUILD_ID__';
const CACHE = 'mesamorfit-' + BUILD;

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
        names.filter((n) => n.startsWith('mesamorfit-') && n !== CACHE).map((n) => caches.delete(n))
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
            '<!doctype html><meta charset="utf-8"><title>Mesamorfit</title>' +
              '<body style="margin:0;background:#12110F;color:#A9A29A;font:16px -apple-system,sans-serif;' +
              'display:flex;align-items:center;justify-content:center;height:100vh">' +
              'Offline. Open Mesamorfit once with a connection and it will work without one.</body>',
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
