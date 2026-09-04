#!/usr/bin/env node
/* ---------------------------------------------------------------
   Builds the installable web app.

     1. expo export --platform web  ->  web-build/
     2. stamps web-build/sw.js with this build's id and the real,
        content-hashed filenames it should precache

   Run it with `npm run build:web`. Deploy the web-build folder.
   --------------------------------------------------------------- */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'web-build');

/* ---------- 1. export ---------- */
console.log('\n> expo export --platform web --output-dir web-build\n');
execFileSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', 'web-build'], {
  cwd: ROOT,
  stdio: 'inherit',
});

/* ---------- 2. stamp the service worker ---------- */
const swPath = path.join(OUT, 'sw.js');
if (!fs.existsSync(swPath)) {
  throw new Error('web-build/sw.js is missing — is public/sw.js still there?');
}

const html = fs.readFileSync(path.join(OUT, 'index.html'), 'utf8');

// Whatever the export put in the page: the bundle, any css it split out.
const fromHtml = [...html.matchAll(/(?:src|href)="(\/[^"]+)"/g)].map((m) => m[1]);

// The three fonts the app actually asks for. The @expo-google-fonts packages
// ship every weight, and precaching all of them would cost 3 MB for nothing.
// Forum was dropped from the design and 600SemiBold — which every heading on
// every screen is set in — was never in this list.
const usedFonts = ['WorkSans_400Regular', 'WorkSans_500Medium', 'WorkSans_600SemiBold'];
const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });

const assets = fs.existsSync(path.join(OUT, 'assets')) ? walk(path.join(OUT, 'assets')) : [];
const rel = (p) => '/' + path.relative(OUT, p).split(path.sep).join('/');

const fonts = assets
  .filter((p) => p.endsWith('.ttf'))
  .filter((p) => usedFonts.some((f) => path.basename(p).startsWith(f + '.')))
  .map(rel);

/* Photographs, in two tiers.

   Everything used to go in here, which meant installing the service
   worker downloaded every one of the three hundred exercise frames —
   fifteen megabytes — before the app had finished starting, on a
   connection the app was also trying to use. On Indian mobile data
   that is the difference between a fast app and a slow one.

   So: the pictures the first screens actually show are precached, and
   the exercise frames are left to the runtime cache in public/sw.js,
   which stores each one the first time it is looked at. The cost is
   that an exercise you have never opened is not available offline.
   That is a fair trade for not spending fifteen megabytes on a
   library most people will see a tenth of.
   assets/photos goes the same way. Those are the wide scene shots and
   the four terrain panels behind the journey map, and they were sized
   up to stop looking soft on a 3x screen — which took them from one
   and a half megabytes to five and a half. Worth it on screen, not
   worth it before the app has started. */
const isImage = (p) => /\.(webp|png|jpg|jpeg|gif|svg)$/i.test(p);
const LATER = ['exercises', 'photos'];
const later = (p) => LATER.some((d) => p.includes(`${path.sep}${d}${path.sep}`));
const images = assets.filter(isImage).filter((p) => !later(p)).map(rel);
const lazyImages = assets.filter(isImage).filter(later).map(rel);

const precache = [
  ...new Set([
    '/',
    '/index.html',
    '/manifest.webmanifest',
    /* the same ?v= the page and the manifest ask for, or these get
       downloaded twice on install — once here, once under the query */
    '/icons/icon-180.png?v=reppo',
    '/icons/icon-192.png?v=reppo',
    '/icons/icon-512.png?v=reppo',
    '/icons/maskable-192.png?v=reppo',
    '/icons/maskable-512.png?v=reppo',
    ...fromHtml,
    ...fonts,
    ...images,
  ]),
]
  .filter((u) => !u.startsWith('/splash/'))
  /* The icon URLs carry a ?v= so a phone that cached the old mark has
     to go and fetch the new one. Check the file without it, but keep
     the query in the list — that is the URL the page will ask for. */
  .filter((u) => u === '/' || fs.existsSync(path.join(OUT, u.split('?')[0].slice(1))));

// The build id changes whenever the precached set changes, which is what makes
// the browser fetch a new service worker and drop the old cache.
/* MediaPipe's WASM and the pose model, served from our own origin so
   the rep counter has no CDN in its path. Both are left out of the
   precache: five megabytes of model has no business being downloaded
   by somebody who never opens Compete. */
const mpRoot = path.join(ROOT, 'node_modules', '@mediapipe', 'tasks-vision');
if (fs.existsSync(mpRoot)) {
  const dest = path.join(OUT, 'mediapipe');
  fs.mkdirSync(dest, { recursive: true });
  const wasm = path.join(mpRoot, 'wasm');
  for (const f of fs.readdirSync(wasm)) fs.copyFileSync(path.join(wasm, f), path.join(dest, f));
  // the library itself, loaded at runtime by src/ui/poseCam.js
  fs.copyFileSync(path.join(mpRoot, 'vision_bundle.mjs'), path.join(dest, 'vision_bundle.mjs'));
  console.log(`  mediapipe  ${fs.readdirSync(dest).length} files`);
}

const buildId = createHash('sha256').update(precache.join('\n')).digest('hex').slice(0, 12);

let sw = fs.readFileSync(swPath, 'utf8');
const before = sw;
sw = sw.replace('__BUILD_ID__', buildId);
sw = sw.replace('__PRECACHE__', JSON.stringify(precache, null, 2));

// A silent no-op here would ship a service worker that throws on install.
if (sw === before || sw.includes('__BUILD_ID__') || sw.includes('__PRECACHE__')) {
  throw new Error('failed to stamp web-build/sw.js — placeholders not found');
}
fs.writeFileSync(swPath, sw);

const bytes = precache.reduce((n, u) => {
  const p = path.join(OUT, u.slice(1));
  return n + (fs.existsSync(p) && fs.statSync(p).isFile() ? fs.statSync(p).size : 0);
}, 0);

console.log(`\n  service worker stamped`);
console.log(`  build      ${buildId}`);
const lazyBytes = lazyImages.reduce((n2, u) => {
  const p = path.join(OUT, u.slice(1));
  return n2 + (fs.existsSync(p) ? fs.statSync(p).size : 0);
}, 0);

console.log(`  precaching ${precache.length} files, ${(bytes / 1024 / 1024).toFixed(1)} MB`);
console.log(`  on demand  ${lazyImages.length} photographs, ${(lazyBytes / 1024 / 1024).toFixed(1)} MB`);
console.log(`\n  deploy:  ${path.relative(process.cwd(), OUT) || 'web-build'}\n`);
