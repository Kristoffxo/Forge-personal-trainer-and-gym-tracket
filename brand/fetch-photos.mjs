#!/usr/bin/env node
/* Downloads the photographs listed in brand/photos.mjs.
     node brand/fetch-photos.mjs
   Unsplash's licence allows free use, commercial included, with no
   attribution required. Re-run to rebuild the set from scratch. */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PHOTOS } from './photos.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets', 'photos');
fs.mkdirSync(OUT, { recursive: true });

let total = 0;
for (const [name, [id, aspect, note, crop, tune]] of Object.entries(PHOTOS)) {
  /* Sized for the screen these land on, not for the file size. A
     phone is three device pixels to the point, so a photograph shown
     full width needs about 1100px before it stops looking soft; the
     terrain panels on the journey map are the full width of a tall
     phone and need more. Unsplash serves the original, so asking for
     more costs nothing but bytes. */
  const w = aspect > 1.5 ? 1800 : 1120;
  const h = Math.round(w / aspect);
  /* A tall crop of a landscape photograph defaults to the middle,
     which on a hillside shot is all sky. `crop` biases it. */
  const url = `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=82`
    + (crop ? `&crop=${crop}` : '')
    /* The place badges are shown at about 60pt across. A moody wide
       shot that is lovely full-bleed is a dark smudge that small, so
       they get pushed for exposure and contrast on the way down. */
    + (tune || '');
  const file = path.join(OUT, name + '.jpg');

  execFileSync('curl', ['-sS', '-m', '30', '-A', 'Mozilla/5.0', '-o', file, url]);
  const size = fs.statSync(file).size;
  if (size < 6000) throw new Error(`${name} came back too small (${size}B) — is the id still right?`);

  // strip metadata and re-compress; these ship inside the bundle
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '80', file, '--out', file],
    { stdio: 'ignore' });

  const kb = Math.round(fs.statSync(file).size / 1024);
  total += kb;
  console.log(`  ${name.padEnd(10)} ${String(kb).padStart(4)} kB  ${w}x${h}`);
}
console.log(`\n${Object.keys(PHOTOS).length} photographs, ${total} kB total`);
