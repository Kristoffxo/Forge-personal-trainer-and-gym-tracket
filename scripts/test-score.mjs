/* The Reppo Score. Run: node scripts/test-score.mjs */
import { idleDays, scoreFrom, PER_WORKOUT, PER_POST, PER_WIN, LEAGUE_STEP } from '../src/score.js';

let pass = 0; let fail = 0;
const is = (what, got, want) => {
  const a = JSON.stringify(got); const b = JSON.stringify(want);
  if (a === b) { pass += 1; return; }
  fail += 1;
  console.log(`  FAIL ${what}\n    got  ${a}\n    want ${b}`);
};

/* days counted from a fixed Monday so the arithmetic is readable */
const d = (n) => new Date(Date.UTC(2026, 0, 5 + n)).toISOString().slice(0, 10);

console.log('what things are worth');
is('a workout', PER_WORKOUT, 5);
is('a photo', PER_POST, 2);
is('a win', PER_WIN, 2);
is('a league', LEAGUE_STEP, 50);

console.log('\nrest days');
{
  is('nothing trained, nothing owed', idleDays([], d(10)), 0);
  is('trained today, nothing owed', idleDays([d(0)], d(0)), 0);

  /* the point of the whole rule */
  is('one day off is free', idleDays([d(0), d(2)], d(2)), 0);
  is('two in a row costs one', idleDays([d(0), d(3)], d(3)), 1);
  is('three in a row costs two', idleDays([d(0), d(4)], d(4)), 2);

  is('every other day forever costs nothing',
    idleDays([d(0), d(2), d(4), d(6), d(8), d(10)], d(10)), 0);
  is('every day costs nothing',
    idleDays([d(0), d(1), d(2), d(3)], d(3)), 0);

  /* two separate gaps, each with its own free day */
  is('each gap gets its own free day', idleDays([d(0), d(3), d(6)], d(6)), 2);
}

console.log('\nthe gap you are in right now');
{
  /* Not training is costing you today, not once you come back. */
  is('a week away, so far', idleDays([d(0)], d(7)), 6);
  is('yesterday off is still free', idleDays([d(0)], d(1)), 0);
  is('the day before that is not', idleDays([d(0)], d(2)), 1);
}

console.log('\nbefore you start');
{
  /* Somebody who signed up this morning owes nothing, however long
     the list of days they have not trained. */
  is('an empty history owes nothing', idleDays([], d(400)), 0);
  is('and days before the first one are not counted',
    idleDays([d(100)], d(100)), 0);
}

console.log('\nadding it up');
{
  const s = scoreFrom({ trained: [d(0), d(1)], posts: 1, wins: 1, today: d(1) });
  is('two workouts, a photo and a win', s.score, 10 + 2 + 2);
  is('and it shows its working', [s.fromWorkouts, s.fromPosts, s.fromWins, s.idle],
    [10, 2, 2, 0]);

  const gap = scoreFrom({ trained: [d(0)], posts: 0, wins: 0, today: d(4) });
  is('one workout, three days of it going cold', gap.score, 5 - 3);
}

console.log('\nit never goes below nought');
{
  const s = scoreFrom({ trained: [d(0)], posts: 0, wins: 0, today: d(40) });
  is('a month away does not go negative', s.score, 0);
  is('and it says the sum was clamped', s.floored, true);
  const ok = scoreFrom({ trained: [d(0), d(1)], posts: 0, wins: 0, today: d(1) });
  is('a healthy score is not marked as clamped', ok.floored, false);
}

console.log('\nnonsense in');
{
  is('no arguments at all', scoreFrom({}).score, 0);
  /* only d(0) survives, so d(1)–d(3) is a run of three: one free,
     two charged */
  is('rubbish dates are ignored',
    idleDays(['', null, 'yesterday', d(0)], d(3)), 2);
  is('days in the future are ignored',
    idleDays([d(0), d(90)], d(1)), 0);
  is('duplicates are still one day',
    idleDays([d(0), d(0), d(0), d(3)], d(3)), 1);
  is('out of order is fine', idleDays([d(3), d(0)], d(3)), 1);
}

console.log('\nthe rule, stated the way the app states it');
{
  /* "train every other day and you hold steady" — five points for
     the workout, nothing for the single rest day between. */
  const fortnight = [];
  for (let k = 0; k <= 14; k += 2) fortnight.push(d(k));
  const s = scoreFrom({ trained: fortnight, posts: 0, wins: 0, today: d(14) });
  is('eight workouts, alternate days, nothing lost', s.idle, 0);
  is('and the score is just the workouts', s.score, 8 * PER_WORKOUT);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
