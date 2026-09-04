#!/usr/bin/env node
/* Downloads two photographs per exercise — the start of the movement
   and the end — from free-exercise-db, which is public domain.
   Alternating them is the animation.

     node brand/match-exercises.mjs      (writes the pairing)
     node brand/fetch-exercise-photos.mjs

   These used to be cut to 340px and compressed hard, which was a
   mistake: the demonstration is shown full-width, so on a 1080px
   phone every one of them was being blown up three times over and
   looked it. They now ship exactly as the database has them —
   800 × 533, untouched, no second JPEG generation. It costs about
   17 MB across three hundred files, which the app loads one at a
   time.

   800px is the ceiling, not a choice: it is what free-exercise-db
   serves, verified against the raw URLs. Nothing here can make
   them sharper, and upscaling would only make them bigger. Real
   HD demonstrations mean a different source — licensed stock, or
   filming them. */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/* Downloaded into a staging folder and only swapped in once every
   file has arrived. Emptying the real folder first and then fetching
   three hundred files over a network means one dropped connection
   leaves the app with no photographs at all. */
const OUT = path.join(ROOT, 'assets', 'exercises');
const STAGE = OUT + '.new';
const BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
const map = JSON.parse(fs.readFileSync(path.join(ROOT, 'brand', 'exercise-photos.json'), 'utf8'));

fs.rmSync(STAGE, { recursive: true, force: true });
fs.mkdirSync(STAGE, { recursive: true });

const slug = (n) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const index = {};
let bytes = 0;

for (const [name, images] of Object.entries(map)) {
  const key = slug(name);
  const frames = [];
  for (let i = 0; i < Math.min(2, images.length); i++) {
    const file = path.join(STAGE, `${key}-${i}.jpg`);
    execFileSync('curl', ['-sS', '-m', '60', '-o', file, BASE + images[i]]);
    if (fs.statSync(file).size < 3000) throw new Error('too small: ' + images[i]);
    bytes += fs.statSync(file).size;
    frames.push(`${key}-${i}.jpg`);
  }
  index[name] = frames;
}

const want = Object.values(index).flat().length;
const got = fs.readdirSync(STAGE).filter((f) => f.endsWith('.jpg')).length;
if (got !== want) {
  throw new Error(`only ${got} of ${want} files arrived — the old photographs are untouched, run it again`);
}

/* everything is here: swap it in */
fs.rmSync(OUT, { recursive: true, force: true });
fs.renameSync(STAGE, OUT);

fs.writeFileSync(path.join(ROOT, 'brand', 'exercise-index.json'), JSON.stringify(index, null, 1));
console.log(`${Object.keys(index).length} exercises, ${got} files, ${Math.round(bytes / 1024 / 1024)} MB total`);
