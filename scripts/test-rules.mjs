#!/usr/bin/env node
/* Checks on the challenge rules — the ones that decide whether a
   ninety-day streak survives. Run with: node scripts/test-rules.mjs */
import { progress, dayKey } from '../src/challengeRules.js';
import {
  buildRoutine, buildInstant, sizeFor, poolFor,
  TARGETS, SPLIT_TARGETS, WOMEN_TARGETS, WOMEN_SPLIT_TARGETS,
  targetsFor, splitTargetsFor, HOME_KIT, FLOOR_ONLY,
} from '../src/routines.js';
import { EX } from '../src/exercises.js';
import { RELIEF } from '../src/menstrual.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/* src/exercisePhotos.js is a list of require() calls, which Metro
   resolves and node cannot. Reading it as text is enough to answer
   the only question asked of it here: is this exercise in there? */
const PHOTOS_SRC = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'exercisePhotos.js'),
  'utf8',
);
const hasPhoto = (name) => PHOTOS_SRC.includes(JSON.stringify(name));
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
  home.exercises.every((x) => HOME_KIT.includes(x.e)), true);
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

/* ---------------------------------------------------------------
   The women's side.

   Two things have to hold at once and they pull against each other:
   a woman's session must genuinely lead with the lower body, and the
   men's side must come out of this change bit-identical.
   --------------------------------------------------------------- */
console.log('the women’s side');

const LOWER = ['Glutes', 'Thighs', 'Quads', 'Hamstrings', 'Calves'];
const lowerCount = (r) => r.exercises.filter((x) => LOWER.includes(x.m)).length;

is('women get their own targets', targetsFor('women') === WOMEN_TARGETS, true);
is('men keep theirs', targetsFor('men') === TARGETS, true);
is('women get their own splits', splitTargetsFor('women') === WOMEN_SPLIT_TARGETS, true);
is('men keep theirs', splitTargetsFor('men') === SPLIT_TARGETS, true);

/* the men's side is untouched — same target, same level, same list */
for (const tg of SPLIT_TARGETS.concat(TARGETS)) {
  const before = buildRoutine({ target: tg, place: 'gym', level: 'intermediate' });
  const after = buildRoutine({ target: tg, place: 'gym', level: 'intermediate', side: 'men' });
  is(`men unchanged: ${tg.key}`,
    before.exercises.map((x) => x.n), after.exercises.map((x) => x.n));
}

/* every women's target fills up, at every level */
for (const lvl of ['beginner', 'intermediate', 'advanced']) {
  for (const tg of WOMEN_SPLIT_TARGETS.concat(WOMEN_TARGETS)) {
    const r = buildRoutine({ target: tg, place: 'gym', level: lvl, side: 'women' });
    is(`${tg.key} ${lvl} is full`, r.exercises.length, sizeFor(lvl));
  }
}

/* "Full Body" has to actually include the upper body — the bug this
   catches is a weighted share giving the back zero slots */
const wFull = buildRoutine({ target: 'toned', place: 'gym', level: 'intermediate', side: 'women' });
is('full body reaches the upper body',
  wFull.exercises.some((x) => ['Back', 'Shoulders', 'Chest'].includes(x.m)), true);

/* the lower body leads */
const wLower = buildRoutine({ target: 'lower', place: 'gym', level: 'advanced', side: 'women' });
is('lower body day is all lower body', lowerCount(wLower), wLower.exercises.length);
is('women’s instant work is lower-body heavy',
  lowerCount(buildInstant(20, 'women')) > lowerCount(buildInstant(20, 'men')), true);

/* tagged-out lifts stay out, and nothing vanishes that should not */
is('no men-only lifts in a women’s pool',
  poolFor('Chest', 'gym', 'women').some((x) => x.x), false);
is('a women’s chest day still exists',
  buildRoutine({ target: 'upperlight', place: 'gym', level: 'intermediate', side: 'women' })
    .exercises.length > 0, true);

/* home has to stay home */
for (const tg of WOMEN_TARGETS) {
  const h = buildRoutine({ target: tg, place: 'home', level: 'beginner', side: 'women' });
  is(`${tg.key} at home needs no gym`,
    h.exercises.every((x) => HOME_KIT.includes(x.e)), true);
  is(`${tg.key} at home is not empty`, h.exercises.length > 0, true);
}

console.log('period pain');
is('three sessions', RELIEF.length, 3);
is('all between ten and twenty minutes',
  RELIEF.every((r) => r.mins >= 10 && r.mins <= 20), true);
is('every move has a photograph',
  RELIEF.every((r) => r.exercises.every((x) => hasPhoto(x.n))), true);
is('nothing needs equipment',
  RELIEF.every((r) => r.exercises.every((x) => x.e === 'None')), true);
is('every move is marked as a hold, not a lift',
  RELIEF.every((r) => r.exercises.every((x) => x.r === 1)), true);

/* ---------------------------------------------------------------
   Home has to mean home.

   This is the one that would have caught the original bug: a home
   session opening with a hanging knee raise, because bodyweight was
   being read as "needs nothing".
   --------------------------------------------------------------- */
console.log('home is home');

const NOT_AT_HOME = ['Bar', 'Wheel', 'Partner', 'Barbell', 'Machine', 'Cable'];
is('the two lists do not overlap',
  HOME_KIT.some((k) => NOT_AT_HOME.includes(k)), false);
is('floor-only is a subset of home',
  FLOOR_ONLY.every((k) => HOME_KIT.includes(k)), true);

for (const side of ['men', 'women']) {
  for (const tg of splitTargetsFor(side).concat(targetsFor(side))) {
    for (const level of ['beginner', 'intermediate', 'advanced']) {
      const h = buildRoutine({ target: tg, place: 'home', level, side });
      const bad = h.exercises.filter((x) => !HOME_KIT.includes(x.e));
      is(`${side} ${tg.key} ${level} at home needs nothing you lack`,
        bad.map((x) => `${x.n} (${x.e})`), []);
    }
    is(`${side} ${tg.key} at home is not empty`,
      buildRoutine({ target: tg, place: 'home', level: 'beginner', side }).exercises.length > 0,
      true);
  }
}

for (const mins of [10, 15, 20, 30]) {
  for (const side of ['men', 'women']) {
    const i = buildInstant(mins, side);
    is(`${side} ${mins}-minute needs only a floor`,
      i.exercises.filter((x) => !FLOOR_ONLY.includes(x.e)).map((x) => x.n), []);
    is(`${side} ${mins}-minute is not empty`, i.exercises.length > 0, true);
  }
}

console.log('the library itself');

/* The database has no honest picture of these three, and the near
   matches are a standing squat, a leg press and a handstand. They
   fall back to a photograph of the muscle on purpose. */
const NO_PHOTO = ['Wall Sit', 'Calf Raise', 'Pike Push-up'];

is('every exercise has a photograph, or is a known exception',
  EX.filter((x) => !hasPhoto(x.n) && !NO_PHOTO.includes(x.n)).map((x) => x.n), []);
is('the exception list has not gone stale',
  NO_PHOTO.filter((n) => hasPhoto(n)), []);
is('nothing is both preferred and excluded',
  EX.filter((x) => x.w && x.x).map((x) => x.n), []);
is('no two exercises share a name',
  EX.map((x) => x.n).filter((n, i, a) => a.indexOf(n) !== i), []);

const KNOWN_KIT = ['None', 'Chair', 'Band', 'Dumbbell', 'Bar', 'Wheel', 'Partner',
  'Barbell', 'Machine', 'Cable'];
is('every exercise names kit we understand',
  EX.filter((x) => !KNOWN_KIT.includes(x.e)).map((x) => `${x.n} (${x.e})`), []);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
