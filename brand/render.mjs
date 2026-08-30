#!/usr/bin/env node
/* ---------------------------------------------------------------
   Cuts every icon, favicon and launch screen the app ships out of
   one source file: brand/nemea-logo-source.png.

     node brand/render.mjs

   The source is the full lockup — ring-and-N mark, NEMEA wordmark,
   FUEL · TRACK · PROGRESS strap — on its cream field. Different
   slots want different parts of it, so everything here is a crop of
   that one artwork placed on a canvas. Nothing is redrawn.

   Measured once out of the source (see BOX below); re-measure if the
   artwork is ever replaced.

   Headless Chrome does the compositing because it is the only
   image-capable thing on this machine — there is no ImageMagick.
   `sips` then does the down-scaling, which is also what gives the
   small sizes their anti-aliasing.
   --------------------------------------------------------------- */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'brand', 'nemea-logo-source.png');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'nemea-brand-'));

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if (!fs.existsSync(CHROME)) throw new Error('Google Chrome is required, not found at ' + CHROME);
if (!fs.existsSync(SRC)) throw new Error('missing ' + SRC);

/* The cream the artwork sits on, sampled from its own top-left pixel. */
export const CREAM = '#F9F4EF';

/* Regions of the source, in source pixels. The source is 1254 square. */
const BOX = {
  //  the ring, the N and the dumbbell — everything above the wordmark
  mark: { x: 397, y: 247, w: 460, h: 460 },
  //  mark + wordmark + strapline
  lockup: { x: 180, y: 243, w: 894, h: 694 },
};

/* ---------------------------------------------------------------
   Place a region of the source on a canvas.

     fill        how much of the canvas width the artwork spans
     bg          canvas colour, or 'none' for transparency
     knockout    make the cream field transparent as well, so the
                 mark can sit on the app's dark surfaces
   --------------------------------------------------------------- */
let seq = 0;
function compose(region, size, out, { fill = 0.74, bg = CREAM, knockout = false, height } = {}) {
  const H = height || size;
  const w = size * fill;
  const h = (w * region.h) / region.w;
  const scale = w / region.w;
  const id = 'c' + seq++;
  const html = path.join(TMP, id + '.html');

  fs.writeFileSync(html, `<!doctype html><meta charset="utf-8"><style>
  html,body{margin:0;padding:0;width:${size}px;height:${H}px;overflow:hidden;
    background:${bg === 'none' ? 'transparent' : bg};}
  #stage{position:absolute;left:${(size - w) / 2}px;top:${(H - h) / 2}px;
    width:${w}px;height:${h}px;overflow:hidden;}
  #stage img{position:absolute;
    left:${-region.x * scale}px;top:${-region.y * scale}px;
    width:${1254 * scale}px;height:${1254 * scale}px;
    image-rendering:auto;}
  canvas{position:absolute;left:0;top:0;}
  </style>
  <div id="stage">${knockout ? '' : `<img src="${SRC}">`}</div>
  ${knockout ? `<script>
    // Chroma-key the cream away. The artwork's own strokes are gold and
    // taupe, both far from the background, so a generous tolerance is
    // safe and it keeps the anti-aliased edges from fringing.
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = ${Math.round(w)}; c.height = ${Math.round(h)};
      const g = c.getContext('2d');
      g.drawImage(img, ${-region.x * scale}, ${-region.y * scale},
                       ${1254 * scale}, ${1254 * scale});
      const d = g.getImageData(0, 0, c.width, c.height);
      const p = d.data;
      for (let i = 0; i < p.length; i += 4) {
        const dist = Math.max(Math.abs(p[i]-249), Math.abs(p[i+1]-244), Math.abs(p[i+2]-239));
        if (dist < 10) p[i+3] = 0;
        else if (dist < 34) p[i+3] = Math.round(255 * (dist - 10) / 24);
      }
      g.putImageData(d, 0, 0);
      document.getElementById('stage').appendChild(c);
      document.title = 'ready';
    };
    img.src = '${SRC}';
  </script>` : ''}`);

  fs.mkdirSync(path.dirname(out), { recursive: true });
  execFileSync(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars',
    '--allow-file-access-from-files', '--force-device-scale-factor=1',
    '--virtual-time-budget=4000',
    ...(bg === 'none' ? ['--default-background-color=00000000'] : []),
    `--window-size=${size},${H}`,
    `--screenshot=${out}`,
    'file://' + html,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  if (!fs.existsSync(out)) throw new Error('Chrome produced nothing for ' + out);
  return out;
}

/* A plain rectangle of colour. Android composites its adaptive icon
   from a foreground over one of these. */
function flat(w, h, colour, out) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const html = path.join(TMP, 'flat' + (seq++) + '.html');
  fs.writeFileSync(html, `<!doctype html><style>html,body{margin:0;width:${w}px;height:${h}px;background:${colour}}</style>`);
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars',
    `--window-size=${w},${h}`, `--screenshot=${out}`, 'file://' + html],
    { stdio: ['ignore', 'ignore', 'pipe'] });
  return out;
}

function resize(src, size, out) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.copyFileSync(src, out);
  execFileSync('sips', ['-z', String(size), String(size), out], { stdio: 'ignore' });
  return out;
}

function toJpeg(src, out, quality = 82) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', String(quality),
    src, '--out', out], { stdio: 'ignore' });
  fs.rmSync(src, { force: true });
  return out;
}

const made = [];
const note = (p) => { made.push(path.relative(ROOT, p)); return p; };
const A = (f) => path.join(ROOT, 'assets', f);
const I = (f) => path.join(ROOT, 'public', 'icons', f);

/* =================================================================
   1. Masters
   ================================================================= */
console.log('compositing masters…');

//  the home-screen icon: mark on cream, with the breathing room a
//  rounded app tile needs so the ring is not clipped by the corners
const ICON = compose(BOX.mark, 1024, path.join(TMP, 'icon.png'), { fill: 0.76, knockout: true });

//  small sizes cannot afford the padding — at 16 px it would leave
//  about nine pixels of actual logo
const ICON_TIGHT = compose(BOX.mark, 512, path.join(TMP, 'icon-tight.png'), { fill: 0.94, knockout: true });

//  maskable / adaptive: Android crops to a circle or a squircle, so
//  the art has to survive inside the middle 80%
const MASK = compose(BOX.mark, 1024, path.join(TMP, 'mask.png'), { fill: 0.56, knockout: true });
const FG = compose(BOX.mark, 1024, path.join(TMP, 'fg.png'),
  { fill: 0.54, bg: 'none', knockout: true });

//  the mark alone, no field — this is the one the app itself renders,
//  so it can sit on either palette
const MARK_T = compose(BOX.mark, 512, path.join(TMP, 'mark-t.png'),
  { fill: 1, bg: 'none', knockout: true });

//  the full lockup, for the launch screen and the sign-in header
const LOCKUP_T = compose(BOX.lockup, 1200, path.join(TMP, 'lockup-t.png'),
  { fill: 1, bg: 'none', knockout: true, height: Math.round((1200 * BOX.lockup.h) / BOX.lockup.w) });

/* =================================================================
   2. Expo's asset slots
   ================================================================= */
console.log('writing assets/…');
resize(ICON, 1024, note(A('icon.png')));
resize(ICON_TIGHT, 48, note(A('favicon.png')));
resize(FG, 1024, note(A('android-icon-foreground.png')));

//  a flat cream plate behind the adaptive foreground
flat(1024, 1024, CREAM, note(A('android-icon-background.png')));

//  Android 13 themed icons want a single-colour silhouette. The mark
//  knocked out of its field is exactly that once the system tints it.
resize(FG, 1024, note(A('android-icon-monochrome.png')));

//  Expo's splash image, drawn over splash.backgroundColor
fs.copyFileSync(LOCKUP_T, note(A('splash-icon.png')));

//  the mark the app renders in its own chrome
fs.mkdirSync(A('brand'), { recursive: true });
fs.copyFileSync(MARK_T, note(A('brand/mark.png')));

//  and again at a stable, unhashed path, because the boot screen in
//  public/index.html is plain HTML and cannot reach Expo's asset map
fs.copyFileSync(MARK_T, note(I('mark.png')));
fs.copyFileSync(LOCKUP_T, note(A('brand/lockup.png')));

/* =================================================================
   3. Web icons
   ================================================================= */
console.log('writing public/icons/…');
for (const s of [96, 120, 144, 152, 180, 192, 384, 512, 1024]) resize(ICON, s, note(I(`icon-${s}.png`)));
for (const s of [16, 32]) resize(ICON_TIGHT, s, note(I(`icon-${s}.png`)));
for (const s of [192, 512]) resize(MASK, s, note(I(`maskable-${s}.png`)));

/* =================================================================
   4. iOS launch screens — one per iPhone listed in public/index.html
   ================================================================= */
console.log('writing public/splash/…');
const DEVICES = [
  ['375x667-2x', 750, 1334], ['414x736-3x', 1242, 2208],
  ['375x812-3x', 1125, 2436], ['414x896-2x', 828, 1792],
  ['390x844-3x', 1170, 2532], ['393x852-3x', 1179, 2556],
  ['402x874-3x', 1206, 2622],
];
for (const [name, w, h] of DEVICES) {
  const tmp = compose(BOX.lockup, w, path.join(TMP, `s-${name}.png`),
    { fill: 0.68, height: h, knockout: true });
  toJpeg(tmp, note(path.join(ROOT, 'public', 'splash', `launch-${name}.jpg`)));
}

/* =================================================================
   5. Loose copies, for a store listing or a landing page
   ================================================================= */
compose(BOX.lockup, 1600, note(path.join(ROOT, 'brand', 'nemea-lockup.png')),
  { fill: 0.9, knockout: true, height: Math.round((1600 * 0.9 * BOX.lockup.h) / BOX.lockup.w) + 160 });
compose(BOX.mark, 1024, note(path.join(ROOT, 'brand', 'nemea-mark.png')),
  { fill: 0.9, knockout: true });

fs.rmSync(TMP, { recursive: true, force: true });
console.log('\n' + made.length + ' files written:');
made.forEach((f) => console.log('  ' + f));
