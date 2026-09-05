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
const SENIORS = 'seniors';
const isWomen = (side) => side === WOMEN;
const isSenior = (side) => side === SENIORS;

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

/* The seniors side has no muscle-group menu at all: it has five
   written sessions in src/seniors.js and nothing to pick between.
   These still answer, so anything that asks does not crash — it
   answers with the home-shaped lists. */
export function targetsFor(side) {
  if (isSenior(side)) return TARGETS.filter((t) => t.key !== 'chest');
  return isWomen(side) ? WOMEN_TARGETS : TARGETS;
}

export function splitTargetsFor(side) {
  if (isSenior(side)) return SPLIT_TARGETS.filter((t) => t.key === 'corework');
  return isWomen(side) ? WOMEN_SPLIT_TARGETS : SPLIT_TARGETS;
}

/* Nothing fast, nothing loaded, nothing that ends with you on the
   floor by accident. Used to keep the seniors side out of the rest
   of the library even where a screen reaches for it. */
const TOO_MUCH = /jump|plyo|handstand|nordic|deadlift|snatch|clean|sprint|burpee|dip|pull-?up|chin-?up|hanging|ab wheel|wall sit|inverted|bulgarian|skull/i;

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

     HOME_KIT     the floor, the furniture already in the room, and
                  one dumbbell — which can be a water can
     FLOOR_ONLY   the floor and nothing else, for a hotel room

   A bar, an ab wheel and a partner to hold your ankles are none of
   those, however bodyweight the movement is. That distinction is the
   whole of this file's contribution to "home workouts are home
   workouts".

   Resistance bands are out. A chair is in the room already and a
   water can stands in for a dumbbell, but a band is a thing you have
   to have gone out and bought — and a home workout that opens with
   kit you do not own is not a home workout. */
export const HOME_KIT = ['None', 'Chair', 'Dumbbell'];
export const FLOOR_ONLY = ['None'];

/* Least kit first, so a home session opens with something you can
   start right now and only reaches for the dumbbell further down. */
const KIT_ORDER = { None: 0, Chair: 1, Dumbbell: 2 };

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

  if (isSenior(side)) {
    all = all.filter((x) => HOME_KIT.includes(x.e) && !TOO_MUCH.test(x.n) && !x.x);
  }

  if (place === 'instant') return all.filter((x) => FLOOR_ONLY.includes(x.e));
  if (place !== 'home' && !isSenior(side)) return all;

  return all
    .filter((x) => HOME_KIT.includes(x.e))
    .sort((a, b) => KIT_ORDER[a.e] - KIT_ORDER[b.e]);
}

function usable(x, place, side) {
  if (isSenior(side)) {
    return HOME_KIT.includes(x.e) && !TOO_MUCH.test(x.n) && !x.x;
  }
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

/* And the same table for everybody else.

   Every muscle counted the same before, which meant an advanced
   pull day handed the biceps three of its seven slots — three
   curls, after five sets of rowing that had already worked them.
   Big movers take the session, arms and calves finish it.
   --------------------------------------------------------------- */
const WEIGHT_MEN = {
  Chest: 3, Back: 3, Quads: 3, Glutes: 3,
  Shoulders: 2, Hamstrings: 2, Core: 2,
  Biceps: 1, Triceps: 1, Calves: 1, Thighs: 2,
};

function weightsFor(muscles, side) {
  const table = isWomen(side) ? WEIGHT_WOMEN : WEIGHT_MEN;
  const w = {};
  muscles.forEach((m) => { w[m] = table[m] || 1; });
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

/* ---------------------------------------------------------------
   Movement patterns.

   Two chest presses in one session is a worse hour than a press and
   a fly, even though both are "chest, compound". What makes a
   session good is covering the ways a muscle can be loaded rather
   than repeating the strongest one — so every exercise is sorted
   into a pattern, and a session takes at most one of each.

   Read in order, first match wins, and scoped per muscle: "Incline
   Dumbbell Curl" must be a curl, not an incline press. Anything
   unmatched falls to the muscle's last rule, which is always its
   most common pattern.
   --------------------------------------------------------------- */
const PATTERNS = {
  Chest: [
    [/fly|pec deck/i, 'fly'],
    [/incline/i, 'incline'],
    [/decline|dip/i, 'decline'],
    [/./, 'press'],
  ],
  Back: [
    [/face pull|pull apart|rear fly/i, 'rear'],
    [/deadlift|superman|back extension/i, 'hinge'],
    /* a straight-arm pulldown is a lat isolation with the elbows
       locked, not a vertical pull — it belongs beside a pull-up in
       a session rather than instead of one */
    [/straight-?arm|pullover/i, 'pullover'],
    [/pull-?up|chin-?up|pulldown/i, 'vertical'],
    [/./, 'row'],
  ],
  Shoulders: [
    [/lateral/i, 'lateral'],
    [/rear delt/i, 'rear'],
    [/front raise/i, 'front'],
    [/./, 'press'],
  ],
  Triceps: [
    [/overhead|skull/i, 'overhead'],
    [/pushdown|kickback/i, 'pushdown'],
    [/./, 'press'],
  ],
  Biceps: [
    [/hammer/i, 'hammer'],
    [/chin-?up/i, 'vertical'],
    [/./, 'curl'],
  ],
  Quads: [
    [/lunge|split squat|step/i, 'lunge'],
    [/extension/i, 'extension'],
    [/wall sit/i, 'isometric'],
    [/leg press/i, 'press'],
    [/./, 'squat'],
  ],
  Hamstrings: [
    [/curl/i, 'curl'],
    [/good ?morning/i, 'goodmorning'],
    [/./, 'hinge'],
  ],
  Glutes: [
    [/kickback|hip extension|rear leg/i, 'kickback'],
    [/step/i, 'step'],
    [/deadlift|kneeling squat/i, 'hinge'],
    [/flutter|leg lift|leg raise/i, 'raise'],
    [/./, 'bridge'],
  ],
  Thighs: [
    [/lunge|split squat|step/i, 'lunge'],
    [/adduct|inner|outer|abduct/i, 'adduction'],
    [/./, 'squat'],
  ],
  Calves: [[/./, 'raise']],
  Core: [
    [/plank|butt-?ups/i, 'plank'],
    [/twist|russian|cross-?body|bicycle|air bike/i, 'rotation'],
    [/dead bug|ab wheel|rollout/i, 'antiextension'],
    [/raise|pull-?in|scissor|flutter|knee/i, 'raise'],
    [/climber/i, 'dynamic'],
    [/./, 'crunch'],
  ],
};

export function patternOf(x) {
  const rules = PATTERNS[x && x.m] || [[/./, 'other']];
  for (const [re, name] of rules) if (re.test(x.n)) return name;
  return 'other';
}

/* A deterministic shuffle. The same seed gives the same session, so
   a workout does not rearrange itself under you between one render
   and the next; a different seed gives a genuinely different one. */
function shuffled(list, seed) {
  const out = list.slice();
  let n = out.length;
  let s = (seed * 2654435761) % 2147483647 || 1;
  const next = () => { s = (s * 48271) % 2147483647; return s / 2147483647; };
  while (n > 1) {
    const k = Math.floor(next() * n);
    n -= 1;
    const tmp = out[n]; out[n] = out[k]; out[k] = tmp;
  }
  return out;
}

/* In a gym, use the gym.

   Shuffling the whole pool evenly is how a bench-press day comes
   back holding a push-up and a resistance band. Loaded kit goes
   first where it is available, bodyweight last — and the shuffle
   happens inside each tier, so a session still varies without
   trading a barbell for a band. At home the filter has already
   removed everything that is not there, so the order stands.
   --------------------------------------------------------------- */
const GYM_TIER = { Barbell: 0, Dumbbell: 0, Machine: 0, Cable: 0, Bar: 1, Chair: 2, Wheel: 2, Band: 3, None: 3 };

function ranked(list, place, seed) {
  if (place === 'home' || place === 'instant') return shuffled(list, seed);
  const tiers = [[], [], [], []];
  list.forEach((x) => { tiers[GYM_TIER[x.e] === undefined ? 2 : GYM_TIER[x.e]].push(x); });
  return tiers.reduce((all, t, i) => all.concat(shuffled(t, seed + i * 13)), []);
}

/* A few patterns are worth avoiding twice in a session even across
   different muscles. A lat pulldown and then a chin-up is two
   vertical pulls whatever the library files them under, and a
   deadlift followed by a sumo deadlift is one hinge too many.

   Deliberately short. Chest press and shoulder press are both
   "press" and belong together — most repeats are fine, and only
   these read as doing the same thing twice.
   --------------------------------------------------------------- */
const ONCE_PER_SESSION = ['vertical', 'hinge'];

/* Kit somebody else might be standing on. */
const CONTESTED = ['Barbell', 'Machine', 'Cable', 'Bar', 'Wheel'];

/* Pick `n` exercises for one muscle.

   Compounds first — the heavy work belongs where you are freshest —
   then the finishing work. Within each half, no two of the same
   pattern unless the pool has nothing else left, and equipment is
   spread where there is a choice so a session is not five moves
   queueing for the same machine. */
function pickFor(pool, n, seed, place, sessionPatterns) {
  if (n <= 0 || !pool.length) return [];

  const wantHeavy = Math.ceil(n / 2);
  const compounds = ranked(pool.filter((x) => x.t === 'c'), place, seed);
  const isolations = ranked(pool.filter((x) => x.t === 'i'), place, seed + 7);

  const chosen = [];
  const patterns = new Set();
  const kit = {};

  /* `strict` is the pass that cares: a new pattern, nothing this
     session already did, and no third exercise on the same piece of
     kit. The relaxed pass runs only once every source has had a
     strict look, so a muscle whose only compound is a repeat falls
     through to isolation instead of forcing the repeat. */
  const take = (from, howMany, strict) => {
    for (const x of from) {
      if (chosen.length >= howMany) break;
      if (chosen.indexOf(x) !== -1) continue;
      const p = patternOf(x);
      if (strict) {
        if (patterns.has(p)) continue;
        if (ONCE_PER_SESSION.indexOf(p) !== -1 && sessionPatterns && sessionPatterns.has(p)) continue;
        /* Spreading the kit is about not queueing for one machine
           for half an hour. Nobody queues for the floor — capping
           bodyweight the same way was blocking a plank out of a core
           session that had a pattern going spare. */
        if (CONTESTED.indexOf(x.e) !== -1 && (kit[x.e] || 0) >= 2) continue;
      }
      chosen.push(x);
      patterns.add(p);
      if (sessionPatterns) sessionPatterns.add(p);
      kit[x.e] = (kit[x.e] || 0) + 1;
    }
  };

  take(compounds, Math.min(wantHeavy, n), true);
  take(isolations, n, true);
  take(compounds, n, true);
  take(isolations, n, false);
  take(compounds, n, false);

  /* The later passes can append a compound after an isolation — a
     lat pulldown landing behind a face pull. Sort it back so the
     heavy work is always first, which is the only reason this list
     has an order at all. */
  return chosen.slice().sort((a, b) => (a.t === 'c' ? 0 : 1) - (b.t === 'c' ? 0 : 1));
}

export function buildRoutine({ target, place = 'gym', level = 'intermediate', side = 'men', seed = 0 }) {
  const t = typeof target === 'string' ? targetByKey(target) : target;
  const want = sizeFor(level);

  const live = t.muscles.filter((m) => EX.some((x) => x.m === m && usable(x, place, side)));
  if (!live.length) return { ...t, exercises: [] };

  const per = share(live, want, side);

  const out = [];
  const sessionPatterns = new Set();
  live.forEach((m, mi) => {
    /* the muscle index goes into the seed so shuffling a session
       moves every muscle, not the first one only */
    out.push(...pickFor(poolFor(m, place, side), per[m], seed * 31 + mi, place, sessionPatterns));
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
