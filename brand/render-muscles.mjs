#!/usr/bin/env node
/* Renders the muscle icons to transparent PNGs.
     node brand/render-muscles.mjs
   Drop your own PNGs into assets/muscles/ with the same names to
   replace them; nothing in the app needs changing. */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { muscleSvg, MUSCLE_KEYS } from './muscles.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets', 'muscles');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'reppo-muscles-'));
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

fs.mkdirSync(OUT, { recursive: true });

// White, so the app can tint each one to its muscle colour.
for (const key of MUSCLE_KEYS) {
  const html = path.join(TMP, key + '.html');
  fs.writeFileSync(html, `<!doctype html><meta charset="utf-8"><style>
    html,body{margin:0;width:512px;height:512px;background:transparent}
    svg{display:block}</style>${muscleSvg(key, '#FFFFFF', 512)}`);
  const out = path.join(OUT, key + '.png');
  execFileSync(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars',
    '--default-background-color=00000000',
    '--force-device-scale-factor=1',
    '--window-size=512,512', `--screenshot=${out}`, 'file://' + html,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  console.log('  assets/muscles/' + key + '.png');
}
fs.rmSync(TMP, { recursive: true, force: true });
console.log(`\n${MUSCLE_KEYS.length} muscle icons written`);
