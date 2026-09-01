/* ---------------------------------------------------------------
   Ready-made sessions.

   The planner writes you a week. This is the other way in: you
   already know you want to train chest today, so pick chest and go.

   Nothing here is a new exercise list — it filters src/exercises.js
   by what the muscle is and what you have to train with, then puts
   the compound movements first, which is the only ordering rule
   that really matters.

   `place` is 'gym', 'home' or 'instant', and it is enforced by what
   each exercise actually needs rather than by whether it happens to
   be bodyweight. A pull-up needs a bar; a dip needs something to dip
   on; an ab wheel needs an ab wheel. None of those belong in a home
   session, and all of them used to be in one.

   `side` is 'men' or 'women'. It changes three things and nothing
   else: which targets are offered, how the work is shared out
   between the muscles in one, and which exercises come out of the
   drawer first. The men's side is exactly what it was.
   --------------------------------------------------------------- */
import { EX } from './exercises.js';

/* The string, not an import of it. src/side.js holds React and this
   file is loaded by the test scripts under plain node, which cannot
   parse JSX. One word is not worth a module boundary. */
const WOMEN = 'women';
const isWomen = (side) => side === WOMEN;

/* ---------------------------------------------------------------
   What each target trains — the men's side, unchanged.
   --------------------------------------------------------------- */
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

/* ---------------------------------------------------------------
   And the women's side.

   The lower body is broken up rather than lumped into one "Legs",
   because that is where most of the training goes and one tile
   cannot hold it. The upper body goes the other way: one target
   for the lot, trained properly but not four days a week.
   --------------------------------------------------------------- */
export const WOMEN_TARGETS = [
  { key: 'glutes', name: 'Glutes', muscles: ['Glutes'], icon: '◗' },
  { key: 'thighs', name: 'Thighs', muscles: ['Thighs', 'Quads'], icon: '▽' },
  { key: 'hamstrings', name: 'Hamstrings', muscles: ['Hamstrings'], icon: '◺' },
  { key: 'calves', name: 'Calves', muscles: ['Calves'], icon: '◡' },
  { key: 'core', name: 'Core', muscles: ['Core'], icon: '◍' },
  { key: 'upper', name: 'Arms & Back', muscles: ['Back', 'Biceps', 'Triceps'], icon: '◈' },
];

export const WOMEN_SPLIT_TARGETS = [
  {
    key: 'lower', name: 'Lower Body',
    muscles: ['Glutes', 'Thighs', 'Quads', 'Hamstrings', 'Calves'], icon: '▼',
    sub: 'Glutes, thighs, hamstrings and calves',
  },
  {
    key: 'glutethigh', name: 'Glutes & Thighs',
    muscles: ['Glutes', 'Thighs'], icon: '◗',
    sub: 'The one most people come here for',
  },
  {
    key: 'toned', name: 'Full Body',
    muscles: ['Glutes', 'Thighs', 'Core', 'Back', 'Shoulders'], icon: '✦',
    sub: 'Everything, lower body first',
  },
  {
    key: 'upperlight', name: 'Upper Body',
    muscles: ['Back', 'Shoulders', 'Triceps', 'Biceps', 'Chest'], icon: '▲',
    sub: 'Back, shoulders and arms — lighter',
  },
  {
    key: 'corework', name: 'Core', muscles: ['Core'], icon: '◍',
    sub: 'Everything through the middle',
  },
];

export function targetsFor(side) {
  return isWomen(side) ? WOMEN_TARGETS : TARGETS;
}

export function splitTargetsFor(side) {
  return isWomen(side) ? WOMEN_SPLIT_TARGETS : SPLIT_TARGETS;
}

export function allTargets() {
  return SPLIT_TARGETS.concat(TARGETS, WOMEN_SPLIT_TARGETS, WOMEN_TARGETS);
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

/* ---------------------------------------------------------------
   What you can actually do, where you are.

     HOME_KIT     the floor, the furniture already in the room, a
                  band, and one dumbbell — which can be a water can
     FLOOR_ONLY   the floor and nothing else, for a hotel room

   A bar, an ab wheel and a partner to hold your ankles are none of
   those, however bodyweight the movement is. That distinction is the
   whole of this file's contribution to "home workouts are home
   workouts".
   --------------------------------------------------------------- */
export const HOME_KIT = ['None', 'Chair', 'Band', 'Dumbbell'];
export const FLOOR_ONLY = ['None'];

/* Least kit first, so a home session opens with something you can
   start right now and only reaches for the dumbbell further down. */
const KIT_ORDER = { None: 0, Chair: 1, Band: 2, Dumbbell: 3 };

export function poolFor(muscle, place, side) {
  let all = EX.filter((x) => x.m === muscle);

  if (isWomen(side)) {
    /* the tagged-out lifts leave, and the ones the women's side
       leads with come to the front. Sorting rather than filtering
       means nothing disappears — a light chest day still finds
       press-ups underneath. */
    all = all.filter((x) => !x.x);
    all = all.slice().sort((a, b) => (b.w ? 1 : 0) - (a.w ? 1 : 0));
  }

  if (place === 'instant') return all.filter((x) => FLOOR_ONLY.includes(x.e));
  if (place !== 'home') return all;

  return all
    .filter((x) => HOME_KIT.includes(x.e))
    .sort((a, b) => KIT_ORDER[a.e] - KIT_ORDER[b.e]);
}

function usable(x, place) {
  if (place === 'instant') return FLOOR_ONLY.includes(x.e);
  if (place !== 'home') return true;
  return HOME_KIT.includes(x.e);
}

/* ---------------------------------------------------------------
   How the work is shared out.

   Evenly, on the men's side. On the women's side the lower body
   gets roughly twice the slots of the upper — which is the whole
   of "focus less on the top half" in one table.
   --------------------------------------------------------------- */
const WEIGHT_WOMEN = {
  Glutes: 3, Thighs: 3, Quads: 2, Hamstrings: 2, Calves: 2, Core: 2,
  Back: 1, Shoulders: 1, Biceps: 1, Triceps: 1, Chest: 1,
};

function weightsFor(muscles, side) {
  const w = {};
  muscles.forEach((m) => { w[m] = isWomen(side) ? (WEIGHT_WOMEN[m] || 1) : 1; });
  return w;
}

/* Hand out `want` slots in proportion to the weights.

   Everything named in a target gets at least one slot before any
   muscle gets a second, or "Full Body" quietly stops including the
   back. Only what is left over is shared by weight, heaviest first. */
function share(muscles, want, side) {
  const w = weightsFor(muscles, side);
  const order = muscles.slice().sort((a, b) => w[b] - w[a]);

  const per = {};
  muscles.forEach((m) => { per[m] = 0; });

  /* not enough slots to go round: the heaviest muscles take them */
  if (want <= muscles.length) {
    order.slice(0, want).forEach((m) => { per[m] = 1; });
    return per;
  }

  muscles.forEach((m) => { per[m] = 1; });
  let left = want - muscles.length;

  const total = muscles.reduce((sum, m) => sum + w[m], 0) || 1;
  muscles.forEach((m) => {
    const extra = Math.floor((left * w[m]) / total);
    per[m] += extra;
  });

  let given = muscles.reduce((sum, m) => sum + per[m], 0);
  for (let i = 0; given < want; i++, given++) per[order[i % order.length]] += 1;
  return per;
}

/* ---------------------------------------------------------------
   Build one session.

   Work is shared across the target's muscles as evenly as it
   divides, and each muscle leads with its compounds. A muscle with
   nothing available at home is skipped rather than padded.
   --------------------------------------------------------------- */
export function buildRoutine({ target, place = 'gym', level = 'intermediate', side = 'men' }) {
  const t = typeof target === 'string' ? targetByKey(target) : target;
  const want = sizeFor(level);

  const live = t.muscles.filter((m) => EX.some((x) => x.m === m && usable(x, place)));
  if (!live.length) return { ...t, exercises: [] };

  const per = share(live, want, side);

  const out = [];
  live.forEach((m) => {
    const pool = poolFor(m, place, side);
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

/* Same idea, different order. The lower body comes round twice
   before the upper body comes round once. */
const INSTANT_ORDER_WOMEN = ['Glutes', 'Thighs', 'Core', 'Quads', 'Calves',
                             'Hamstrings', 'Back', 'Glutes', 'Thighs', 'Shoulders',
                             'Core', 'Biceps', 'Chest', 'Triceps'];

export function buildInstant(mins, side = 'men') {
  const want = Math.max(4, Math.round(mins / 2.6));
  const order = isWomen(side) ? INSTANT_ORDER_WOMEN : INSTANT_ORDER;

  const pools = {};
  order.forEach((m) => {
    if (pools[m]) return;
    pools[m] = poolFor(m, 'instant', side).slice();
  });

  const out = [];
  let round = 0;
  while (out.length < want && round < 6) {
    for (const m of order) {
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
