/* ---------------------------------------------------------------
   Ready-made sessions.

   The planner writes you a week. This is the other way in: you
   already know you want to train chest today, so pick chest and go.

   Nothing here is a new exercise list — it filters src/exercises.js
   by what the muscle is and what you have to train with, then puts
   the compound movements first, which is the only ordering rule
   that really matters.

   `place` is 'gym' or 'home'. Home means bodyweight or a single
   dumbbell — and a dumbbell can be a water can, a filled bag, or
   anything else with a handle and some weight in it.
   --------------------------------------------------------------- */
import { EX } from './exercises.js';

/* What each target actually trains. */
export const TARGETS = [
  { key: 'chest', name: 'Chest', muscles: ['Chest'], icon: '◐' },
  { key: 'back', name: 'Back', muscles: ['Back'], icon: '◑' },
  { key: 'shoulders', name: 'Shoulders', muscles: ['Shoulders'], icon: '△' },
  { key: 'arms', name: 'Arms', muscles: ['Biceps', 'Triceps'], icon: '◈' },
  { key: 'legs', name: 'Legs', muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'], icon: '▽' },
  { key: 'core', name: 'Core', muscles: ['Core'], icon: '◍' },
];

/* The three-way split, plus core on its own. */
export const SPLIT_TARGETS = [
  {
    key: 'push', name: 'Push', muscles: ['Chest', 'Shoulders', 'Triceps'], icon: '▲',
    sub: 'Chest, shoulders and triceps',
  },
  {
    key: 'pull', name: 'Pull', muscles: ['Back', 'Biceps'], icon: '▼',
    sub: 'Back and biceps',
  },
  {
    key: 'legday', name: 'Legs', muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'], icon: '▽',
    sub: 'Quads, hamstrings, glutes and calves',
  },
  {
    key: 'corework', name: 'Core', muscles: ['Core'], icon: '◍',
    sub: 'Everything through the middle',
  },
];

export function allTargets() {
  return SPLIT_TARGETS.concat(TARGETS);
}

export function targetByKey(key) {
  return allTargets().find((t) => t.key === key) || SPLIT_TARGETS[0];
}

/* How much work each level gets. A beginner doing seven exercises
   is a beginner who does not come back on Thursday. */
const VOLUME = { beginner: 4, intermediate: 5, advanced: 7 };

export function sizeFor(level) {
  return VOLUME[level] || VOLUME.intermediate;
}

/* Home is bodyweight first.

   Allowing a dumbbell alongside meant every home session filled up
   with dumbbell work and looked exactly like the gym one. So the
   pool is bodyweight only, and a dumbbell is brought in for a muscle
   only when the floor genuinely cannot cover it. */
function poolFor(muscle, place) {
  const all = EX.filter((x) => x.m === muscle);
  if (place !== 'home') return all;

  const floor = all.filter((x) => x.e === 'None');
  if (floor.length >= 3) return floor;
  return floor.concat(all.filter((x) => x.e === 'Dumbbell'));
}

function usable(x, place) {
  if (place !== 'home') return true;
  return x.e === 'None' || x.e === 'Dumbbell';
}

/* ---------------------------------------------------------------
   Build one session.

   Work is shared across the target's muscles as evenly as it
   divides, and each muscle leads with its compounds. A muscle with
   nothing available at home is skipped rather than padded.
   --------------------------------------------------------------- */
export function buildRoutine({ target, place = 'gym', level = 'intermediate' }) {
  const t = typeof target === 'string' ? targetByKey(target) : target;
  const want = sizeFor(level);

  const live = t.muscles.filter((m) => EX.some((x) => x.m === m && usable(x, place)));
  if (!live.length) return { ...t, exercises: [] };

  const per = {};
  live.forEach((m) => { per[m] = Math.floor(want / live.length); });
  let spare = want - live.length * Math.floor(want / live.length);
  for (let i = 0; spare > 0; i++, spare--) per[live[i % live.length]] += 1;

  const out = [];
  live.forEach((m) => {
    const pool = poolFor(m, place);
    const compounds = pool.filter((x) => x.t === 'c');
    const isolations = pool.filter((x) => x.t === 'i');
    const n = per[m];

    for (let i = 0; i < n; i++) {
      // heavy first, then the finishing work
      const from = i < Math.ceil(n / 2) && compounds.length ? compounds : isolations;
      const src = from.length ? from : (compounds.length ? compounds : isolations);
      if (!src.length) break;
      out.push(src.shift());
    }
  });

  return { ...t, exercises: out };
}

/* Roughly how long it takes, for the card. */
export function minutesFor(count) {
  return 10 + count * 6;
}

/* ---------------------------------------------------------------
   Instant workouts.

   No equipment, no plan, no thinking — say how long you have and
   get a full-body circuit that fits. Everything is bodyweight, so
   these work in a hotel room.

   Exercises are spread across the whole body rather than piled onto
   one muscle, because a ten-minute session is the only training
   somebody might do that day.
   --------------------------------------------------------------- */
export const INSTANT = [
  { mins: 10, name: '10 minutes', blurb: 'Four moves. No excuse fits in less than this.' },
  { mins: 15, name: '15 minutes', blurb: 'Six moves, whole body. The everyday one.' },
  { mins: 20, name: '20 minutes', blurb: 'Eight moves. Enough to feel it tomorrow.' },
  { mins: 30, name: '30 minutes', blurb: 'Twelve moves. A full session on the floor.' },
];

/* Round-robin across the body so nothing is trained twice before
   everything is trained once. */
const INSTANT_ORDER = ['Quads', 'Chest', 'Back', 'Core', 'Glutes',
                       'Shoulders', 'Hamstrings', 'Triceps', 'Calves', 'Biceps'];

/* "No equipment" has to mean it. These are bodyweight but still need
   a bar, a bench or a partner, so they are no use in a hotel room. */
const NEEDS_A_BAR = /pull-?up|chin-?up|dip|inverted row|hanging|nordic|ab wheel/i;

export function buildInstant(mins) {
  const want = Math.max(4, Math.round(mins / 2.6));
  const pools = {};
  INSTANT_ORDER.forEach((m) => {
    pools[m] = EX.filter((x) => x.m === m && x.e === 'None' && !NEEDS_A_BAR.test(x.n));
  });

  const out = [];
  let round = 0;
  while (out.length < want && round < 6) {
    for (const m of INSTANT_ORDER) {
      if (out.length >= want) break;
      const pool = pools[m];
      if (pool && pool.length) out.push(pool.shift());
    }
    round += 1;
  }

  return {
    key: 'instant' + mins,
    name: mins + ' minute workout',
    sub: 'Full body, no equipment',
    mins,
    exercises: out,
  };
}

/* ---------------------------------------------------------------
   Challenges
   --------------------------------------------------------------- */
export const CHALLENGES = [
  {
    days: 7, name: '7 days',
    blurb: 'One week. Long enough to prove you can start.',
  },
  {
    days: 15, name: '15 days',
    blurb: 'A fortnight. This is where it stops feeling like effort.',
  },
  {
    days: 30, name: '30 days',
    blurb: 'A month. By the end it is just something you do.',
  },
  {
    days: 90, name: '90 days',
    blurb: 'Three months. This is the one people see the difference from.',
  },
];
