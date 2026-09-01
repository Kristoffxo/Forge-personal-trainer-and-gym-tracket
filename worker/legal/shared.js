/* ---------------------------------------------------------------
   The legal pages, served by the Worker.

   Real HTML at real URLs rather than the app shell, because Google
   Play checks that a privacy policy loads at the address you give
   it — and it will not run JavaScript to find one. The account
   deletion page exists for the same reason: Play requires a way to
   ask for deletion from a browser, without installing the app.

   They are plain, wide-margin, and readable at 200% zoom.
   --------------------------------------------------------------- */

export const UPDATED = '2 September 2026';

export function page(title, body) {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — Reppo</title>
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

export const CONTACT = 'thearyanbasantani@gmail.com';
