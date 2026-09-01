import { parseDuration, clock } from '../src/duration.js';
import { EX } from '../src/exercises.js';
import { RELIEF } from '../src/menstrual.js';

let pass = 0, fail = 0;
const is = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++; else { fail++; console.log(`  FAIL ${name}\n    got  ${JSON.stringify(got)}\n    want ${JSON.stringify(want)}`); }
};

is('3 × 45 s', parseDuration('3 × 45 s'), { seconds: 45, sets: 3, eachSide: false });
is('3 × 30 s each', parseDuration('3 × 30 s each'), { seconds: 30, sets: 3, eachSide: true });
is('90 seconds', parseDuration('90 seconds'), { seconds: 90, sets: 1, eachSide: false });
is('60 seconds each', parseDuration('60 seconds each'), { seconds: 60, sets: 1, eachSide: true });
is('2 minutes', parseDuration('2 minutes'), { seconds: 120, sets: 1, eachSide: false });
is('45 seconds each', parseDuration('45 seconds each'), { seconds: 45, sets: 1, eachSide: true });

/* rep schemes must not be read as time */
is('4 × 6–8 is reps', parseDuration('4 × 6–8'), null);
is('3 × 12 each is reps', parseDuration('3 × 12 each'), null);
is('4 × max is reps', parseDuration('4 × max'), null);
is('10 slow rounds is reps', parseDuration('10 slow rounds'), null);
is('3 × 20 steps is reps', parseDuration('3 × 20 steps'), null);
is('empty', parseDuration(''), null);
is('null', parseDuration(null), null);

is('clock 90', clock(90), '1:30');
is('clock 45', clock(45), '0:45');
is('clock 0', clock(0), '0:00');
is('clock 120', clock(120), '2:00');

/* and against the real library */
const all = [...EX, ...RELIEF.flatMap((r) => r.exercises)];
const timed = all.filter((x) => parseDuration(x.s));
/* Not every relief move is a hold — Cat Cow is ten slow rounds and
   should not grow a countdown. What matters is that the ones written
   in seconds are found and the ones written in reps are left alone. */
const reliefMoves = RELIEF.flatMap((r) => r.exercises);
is('holds are timed',
  reliefMoves.filter((x) => /second|minute/.test(x.s)).every((x) => parseDuration(x.s)), true);
is('slow reps are not timed',
  reliefMoves.filter((x) => /slow (rep|round)/.test(x.s)).every((x) => !parseDuration(x.s)), true);
is('a plausible number of timed moves', timed.length >= 25 && timed.length <= 40, true);
is('nothing absurd', timed.every((x) => parseDuration(x.s).seconds >= 10 && parseDuration(x.s).seconds <= 300), true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
