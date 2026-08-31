#!/usr/bin/env node
/* Downloads two photographs per exercise — the start of the movement
   and the end — from free-exercise-db, which is public domain.
   Alternating them is the animation.

     node brand/match-exercises.mjs      (writes the pairing)
     node brand/fetch-exercise-photos.mjs

   They ship inside the bundle, so they are cut to 340px and
   compressed hard. Quality past that is wasted on a phone. */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets', 'exercises');
const BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
const map = JSON.parse(fs.readFileSync(path.join(ROOT, 'brand', 'exercise-photos.json'), 'utf8'));

fs.mkdirSync(OUT, { recursive: true });

const slug = (n) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const index = {};
let bytes = 0;

for (const [name, images] of Object.entries(map)) {
  const key = slug(name);
  const frames = [];
  for (let i = 0; i < Math.min(2, images.length); i++) {
    const file = path.join(OUT, `${key}-${i}.jpg`);
    execFileSync('curl', ['-sS', '-m', '40', '-o', file, BASE + images[i]]);
    if (fs.statSync(file).size < 3000) throw new Error('too small: ' + images[i]);
    execFileSync('sips', ['-Z', '340', '-s', 'format', 'jpeg', '-s', 'formatOptions', '55',
      file, '--out', file], { stdio: 'ignore' });
    bytes += fs.statSync(file).size;
    frames.push(`${key}-${i}.jpg`);
  }
  index[name] = frames;
}

fs.writeFileSync(path.join(ROOT, 'brand', 'exercise-index.json'), JSON.stringify(index, null, 1));
console.log(`${Object.keys(index).length} exercises, ${Math.round(bytes / 1024)} kB total`);
