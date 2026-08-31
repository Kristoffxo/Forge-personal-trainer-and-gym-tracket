#!/usr/bin/env node
/* The women's muscle-group cards and the period-pain card.
     node brand/fetch-group-photos.mjs
   Unsplash, whose licence allows commercial use with no attribution.
   Cut to the shape the card is (110x118) at four times over, because
   these are only ever seen small. */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GROUP_PHOTOS } from './photos.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets', 'groups');
fs.mkdirSync(OUT, { recursive: true });

for (const [name, [id, what]] of Object.entries(GROUP_PHOTOS)) {
  const url = `https://images.unsplash.com/photo-${id}?w=440&h=472&fit=crop&q=68`;
  const file = path.join(OUT, name + '.jpg');
  execFileSync('curl', ['-sS', '-m', '30', '-A', 'Mozilla/5.0', '-o', file, url]);
  const size = fs.statSync(file).size;
  if (size < 6000) throw new Error(`${name} came back too small (${size}B) — is the id still right?`);
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '62', file, '--out', file],
    { stdio: 'ignore' });
  console.log(`  ${name.padEnd(11)} ${String(Math.round(fs.statSync(file).size / 1024)).padStart(3)} kB  ${what}`);
}
