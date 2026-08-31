#!/usr/bin/env node
/* Checks on the challenge rules — the ones that decide whether a
   ninety-day streak survives. Run with: node scripts/test-rules.mjs */
import { progress, dayKey } from '../src/challengeRules.js';
import { buildRoutine, sizeFor } from '../src/routines.js';
import { dailyTarget, bmr } from '../src/tdee.js';

let pass = 0, fail = 0;
const is = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++; else { fail++; console.log(`  FAIL ${name}\n    got  ${JSON.stringify(got)}\n    want ${JSON.stringify(want)}`); }
};

const D = 86400000;
const ago = (n) => dayKey(new Date(Date.now() - n * D));

console.log('challenge rules');

// day one, nothing logged yet — today is never a miss
is('day 1, untouched', progress({ days: 7, started_on: ago(0), grace_used: false }, []).state, 'on');
is('day 1, day number', progress({ days: 7, started_on: ago(0), grace_used: false }, []).dayNumber, 1);

// trained every day so far
is('3 days, all trained',
  progress({ days: 7, started_on: ago(2), grace_used: false }, [ago(2), ago(1), ago(0)]).state, 'on');

// missed exactly one finished day -> forgiven, and the grace is spent now
const g = progress({ days: 7, started_on: ago(2), grace_used: false }, [ago(2), ago(0)]);
is('one miss -> grace', g.state, 'grace');
is('one miss -> spend the free one', g.spend, true);

// same miss, already forgiven -> not spent twice
is('grace already used, still one miss',
  progress({ days: 7, started_on: ago(2), grace_used: true }, [ago(2), ago(0)]).spend, false);

// two misses -> over
is('two misses -> broken',
  progress({ days: 7, started_on: ago(3), grace_used: false }, [ago(3)]).state, 'broken');

// one miss after the free one is gone -> over
is('miss with no grace left -> broken',
  progress({ days: 7, started_on: ago(2), grace_used: true }, [ago(2), ago(0)]).state, 'broken');

// made it to the end
is('7 of 7 -> done',
  progress({ days: 7, started_on: ago(7), grace_used: false },
    [ago(7), ago(6), ago(5), ago(4), ago(3), ago(2), ago(1), ago(0)]).state, 'done');

// today counts once logged
is('trained today', progress({ days: 7, started_on: ago(0), grace_used: false }, [ago(0)]).trainedToday, true);

console.log('routines');
is('beginner gets 4', sizeFor('beginner'), 4);
is('advanced gets 7', sizeFor('advanced'), 7);
const gym = buildRoutine({ target: 'push', place: 'gym', level: 'intermediate' });
is('push, gym, 5 moves', gym.exercises.length, 5);
const home = buildRoutine({ target: 'push', place: 'home', level: 'intermediate' });
is('push, home, 5 moves', home.exercises.length, 5);
is('home uses no machines or cables',
  home.exercises.every((x) => x.e === 'None' || x.e === 'Dumbbell'), true);
is('legs at home still works',
  buildRoutine({ target: 'legday', place: 'home', level: 'beginner' }).exercises.length > 0, true);

console.log('calorie target');
// 10*70 + 6.25*175 - 5*24 + 5 = 1678.75
is('bmr, 70kg 175cm 24y male', bmr({ sex: 'male', kg: 70, cm: 175, age: 24 }), 1679);
const t1 = dailyTarget({ sex: 'male', kg: 70, cm: 175, age: 24, experience: 'intermediate', goal: 'keep' });
is('maintenance is sane', t1 > 2300 && t1 < 2800, true);
const t2 = dailyTarget({ sex: 'male', kg: 70, cm: 175, age: 24, experience: 'intermediate', goal: 'lose' });
is('cutting is lower', t2 < t1, true);
is('never below the floor',
  dailyTarget({ sex: 'female', kg: 40, cm: 140, age: 70, experience: 'beginner', goal: 'lose' }) >= 1200, true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
