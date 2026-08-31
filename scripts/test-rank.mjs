#!/usr/bin/env node
/* The streak, medal and level rules. Run: node scripts/test-rank.mjs */
import { runsFrom, medalsFrom, levelFrom, rankOf, analyse, dayKey } from '../src/rank.js';

let pass = 0, fail = 0;
const is = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++; else { fail++; console.log(`  FAIL ${name}\n    got  ${JSON.stringify(got)}\n    want ${JSON.stringify(want)}`); }
};

const DAY = 86400000;
// a fixed Monday so week boundaries are predictable
const MON = new Date(2026, 0, 5);
const on = (n) => dayKey(new Date(MON.getTime() + n * DAY));
const span = (a, b) => { const o = []; for (let i = a; i <= b; i++) o.push(on(i)); return o; };

console.log('runs and the weekly rest day');
is('nothing yet', runsFrom([], on(0)).current, 0);
is('one day', runsFrom([on(0)], on(0)).current, 1);
is('five in a row', runsFrom(span(0, 4), on(4)).current, 5);

// Mon-Fri trained, Sat missed (the week's rest), Sun trained -> unbroken
is('one rest day is forgiven',
  runsFrom(span(0, 4).concat([on(6)]), on(6)).current, 7);
is('rest day is marked used',
  runsFrom(span(0, 4).concat([on(6)]), on(6)).restUsedThisWeek, true);

// two missed days in the same week -> the run ends
is('second miss in a week breaks it',
  runsFrom([on(0), on(1), on(4)], on(4)).current, 1);

// a miss in each of two weeks is fine — one each
is('one miss per week is fine',
  runsFrom(span(0, 4).concat(span(6, 11)), on(11)).current, 12);

// today untrained never breaks a run
is('today does not count against you',
  runsFrom(span(0, 4), on(5)).current, 5);

console.log('medals');
is('7 days -> one block at the 7 tier', medalsFrom([7])[7], 1);
is('7 days -> nothing at 15', medalsFrom([7])[15], 0);
is('28 days -> diamond at 7', medalsFrom([28])[7], 4);
is('capped at 4', medalsFrom([700])[7], 4);
is('two separate weeks count twice', medalsFrom([7, 7])[7], 2);
is('360 -> diamond at 90', medalsFrom([360])[90], 4);

console.log('levels');
is('under 30 is level 1', levelFrom(29), 1);
is('30 is level 2', levelFrom(30), 2);
is('90 is level 3', levelFrom(90), 3);
is('360 is level 4', levelFrom(360), 4);

console.log('rank label');
is('no medals -> unranked', rankOf(medalsFrom([])).label, 'Unranked');
is('one week -> bronze at 7', rankOf(medalsFrom([7])).label, 'Bronze · 7 day');
is('best tier wins', rankOf(medalsFrom([30])).label, 'Bronze · 30 day');

console.log('end to end');
const a = analyse(span(0, 29), on(29));
is('30 unbroken -> level 2', a.level, 2);
is('30 unbroken -> diamond at 7', a.medals[7], 4);
is('30 unbroken -> bronze at 30', a.medals[30], 1);
is('30 unbroken -> current is 30', a.current, 30);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
