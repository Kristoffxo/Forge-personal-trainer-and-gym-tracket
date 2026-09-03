/* ---------------------------------------------------------------
   The diet planner.

   A day of food, not a week. A week of meals is ignored by the third
   day, and printing one is how diet apps end up being screenshots
   nobody opens twice. One day, re-rollable, and every meal can be
   logged into the diary with a tap — which is the whole point: the
   plan and the food diary are the same system, so following the plan
   is one press rather than a transcription exercise.

   Three things shape it.

     What they eat      veg, non-veg, or both
     What they weigh    the calorie target already worked out in tdee.js
     What they want     lose fat, stay the same, build muscle

   Every meal here is something somebody in India actually eats:
   poha, roti and dal, rajma chawal, chicken curry and rice. Macros
   come from the Indian Nutrient Databank numbers bundled with the
   app, per 100g, and the grams are chosen to be plausible portions
   rather than scaled to make a number come out round.

   Nothing here imports React or touches the network, so the tests
   can run it under Node.
   --------------------------------------------------------------- */

/* What somebody eats. "Both" is not the same as non-vegetarian in
   India, and pretending otherwise is how you show mutton to somebody
   who eats it twice a month. Both means a mostly-vegetarian week
   with meat in it; non-veg means meat most days. */
export const DIETS = [
  { key: 'veg', name: 'Vegetarian', sub: 'No meat, no fish, no egg' },
  { key: 'both', name: 'Both', sub: 'Mostly vegetarian, meat and egg some days' },
  { key: 'nonveg', name: 'Non-vegetarian', sub: 'Meat, fish or egg most days' },
];

export const MEALS = [
  { key: 'breakfast', name: 'Breakfast', share: 0.25 },
  { key: 'lunch', name: 'Lunch', share: 0.33 },
  { key: 'snack', name: 'Snack', share: 0.12 },
  { key: 'dinner', name: 'Dinner', share: 0.30 },
];

/* Per 100g, from the Indian Nutrient Databank set bundled with the
   app: [name, kcal, protein, carbs, fat]. Kept here rather than
   looked up by id so the planner cannot be broken by a change to the
   food database, and so the tests do not need to load 10MB of JSON
   to check a number. */
const F = {
  roti:      ['Roti', 202, 5.9, 35.6, 3.6],
  rice:      ['Rice', 117, 2.6, 25.7, 0.2],
  dal:       ['Dal', 50, 2.7, 5.9, 1.7],
  thickdal:  ['Moong dal, thick', 120, 7.0, 16.0, 2.5],
  rajma:     ['Rajma curry', 144, 6.0, 16.4, 5.8],
  chole:     ['Chole', 163, 6.1, 20.0, 6.8],
  soya:      ['Soya chunk curry', 163, 10.4, 6.8, 10.2],
  paneer:    ['Paneer', 258, 18.9, 12.4, 14.8],
  curd:      ['Curd', 60, 3.1, 4.4, 3.3],
  sabzi:     ['Mixed vegetable sabzi', 85, 2.4, 9.0, 4.4],
  salad:     ['Salad', 25, 1.1, 4.5, 0.2],
  poha:      ['Vegetable poha', 180, 4.9, 21.5, 8.1],
  upma:      ['Suji upma', 148, 3.3, 16.3, 7.5],
  idli:      ['Idli', 138, 4.6, 28.2, 0.3],
  sambar:    ['Sambar', 97, 3.4, 10.6, 4.4],
  dosa:      ['Masala dosa', 165, 3.3, 19.6, 7.8],
  chilla:    ['Besan chilla', 178, 8.4, 17.0, 8.2],
  oats:      ['Oats porridge', 73, 2.6, 8.8, 3.2],
  khichdi:   ['Khichdi', 120, 4.4, 19.0, 2.8],
  banana:    ['Banana', 106, 1.5, 23.4, 0.3],
  milk:      ['Milk', 73, 3.3, 4.9, 4.5],
  sprouts:   ['Moong sprouts chaat', 95, 6.4, 14.0, 1.0],
  chana:     ['Roasted chana', 329, 21.6, 46.7, 5.3],
  peanuts:   ['Peanuts', 567, 25.8, 16.1, 49.2],
  almond:    ['Almonds', 609, 18.4, 3.0, 58.5],
  toast:     ['Brown toast', 280, 11.0, 48.0, 3.5],
  pbutter:   ['Peanut butter', 588, 25.0, 20.0, 50.0],
  egg:       ['Boiled egg', 155, 13.0, 1.1, 10.6],
  bhurji:    ['Egg bhurji', 156, 10.3, 1.4, 12.2],
  chicken:   ['Chicken curry', 129, 11.8, 3.4, 7.6],
  tandoori:  ['Tandoori chicken', 145, 16.3, 2.3, 7.9],
  fish:      ['Fish curry', 111, 8.8, 3.8, 6.7],
  eggcurry:  ['Egg curry', 138, 8.9, 4.2, 9.4],
  raita:     ['Cucumber raita', 59, 4.0, 6.3, 2.1],
  chai:      ['Chai', 65, 2.0, 8.0, 2.6],
};

/* An item is [food key, grams]. */
function item(key, g) {
  const f = F[key];
  return {
    key,
    name: f[0],
    grams: Math.round(g),
    kcal: Math.round((f[1] * g) / 100),
    protein: Math.round((f[2] * g) / 100 * 10) / 10,
    carbs: Math.round((f[3] * g) / 100 * 10) / 10,
    fat: Math.round((f[4] * g) / 100 * 10) / 10,
  };
}

/* ---------------------------------------------------------------
   The meals.

   `diet` is what the meal *contains*, not who it is for: 'veg' is
   safe for everybody, 'egg' has egg in it, 'nonveg' has meat or
   fish. A vegetarian is only ever shown 'veg'.
   --------------------------------------------------------------- */
const OPTIONS = [
  /* ---------- breakfast ---------- */
  { slot: 'breakfast', diet: 'veg', name: 'Poha and chai',
    base: [['poha', 200], ['peanuts', 12], ['chai', 150]] },
  { slot: 'breakfast', diet: 'veg', name: 'Upma and curd',
    base: [['upma', 220], ['curd', 100]] },
  { slot: 'breakfast', diet: 'veg', name: 'Idli and sambar',
    base: [['idli', 150], ['sambar', 180]] },
  { slot: 'breakfast', diet: 'veg', name: 'Besan chilla',
    base: [['chilla', 180], ['curd', 100]] },
  { slot: 'breakfast', diet: 'veg', name: 'Oats with banana',
    base: [['oats', 300], ['banana', 100], ['almond', 12]] },
  { slot: 'breakfast', diet: 'veg', name: 'Masala dosa',
    base: [['dosa', 220], ['sambar', 150]] },
  { slot: 'breakfast', diet: 'veg', name: 'Paneer bhurji and roti',
    base: [['paneer', 100], ['roti', 70], ['salad', 80]] },
  { slot: 'breakfast', diet: 'egg', name: 'Boiled eggs and toast',
    base: [['egg', 100], ['toast', 60], ['banana', 100]] },
  { slot: 'breakfast', diet: 'egg', name: 'Egg bhurji and roti',
    base: [['bhurji', 150], ['roti', 70]] },
  { slot: 'breakfast', diet: 'egg', name: 'Omelette and toast',
    base: [['bhurji', 130], ['toast', 60], ['chai', 150]] },

  /* ---------- lunch ---------- */
  { slot: 'lunch', diet: 'veg', name: 'Roti, dal and sabzi',
    base: [['roti', 105], ['thickdal', 200], ['sabzi', 150], ['curd', 100]] },
  { slot: 'lunch', diet: 'veg', name: 'Rajma chawal',
    base: [['rice', 250], ['rajma', 200], ['salad', 100]] },
  { slot: 'lunch', diet: 'veg', name: 'Chole chawal',
    base: [['rice', 250], ['chole', 180], ['curd', 100]] },
  { slot: 'lunch', diet: 'veg', name: 'Paneer and roti',
    base: [['roti', 105], ['paneer', 120], ['salad', 100]] },
  { slot: 'lunch', diet: 'veg', name: 'Khichdi and curd',
    base: [['khichdi', 350], ['curd', 120], ['salad', 80]] },
  { slot: 'lunch', diet: 'nonveg', name: 'Chicken curry and rice',
    base: [['rice', 250], ['chicken', 200], ['salad', 100]] },
  { slot: 'lunch', diet: 'nonveg', name: 'Chicken and roti',
    base: [['roti', 105], ['chicken', 200], ['curd', 100]] },
  { slot: 'lunch', diet: 'nonveg', name: 'Fish curry and rice',
    base: [['rice', 250], ['fish', 200], ['sabzi', 120]] },
  { slot: 'lunch', diet: 'egg', name: 'Egg curry and rice',
    base: [['rice', 250], ['eggcurry', 200], ['salad', 100]] },

  /* ---------- snack ---------- */
  { slot: 'snack', diet: 'veg', name: 'Roasted chana and chai',
    base: [['chana', 40], ['chai', 150]] },
  { slot: 'snack', diet: 'veg', name: 'Banana and peanuts',
    base: [['banana', 120], ['peanuts', 25]] },
  { slot: 'snack', diet: 'veg', name: 'Sprouts chaat',
    base: [['sprouts', 180]] },
  { slot: 'snack', diet: 'veg', name: 'Curd and almonds',
    base: [['curd', 200], ['almond', 15]] },
  { slot: 'snack', diet: 'veg', name: 'Peanut butter toast',
    base: [['toast', 60], ['pbutter', 20], ['milk', 200]] },
  { slot: 'snack', diet: 'egg', name: 'Two boiled eggs',
    base: [['egg', 110], ['chai', 150]] },

  /* ---------- dinner ---------- */
  { slot: 'dinner', diet: 'veg', name: 'Roti, dal and sabzi',
    base: [['roti', 105], ['thickdal', 200], ['sabzi', 150]] },
  { slot: 'dinner', diet: 'veg', name: 'Paneer and roti',
    base: [['roti', 70], ['paneer', 130], ['salad', 100]] },
  { slot: 'dinner', diet: 'veg', name: 'Soya curry and rice',
    base: [['rice', 200], ['soya', 180], ['salad', 100]] },
  { slot: 'dinner', diet: 'veg', name: 'Khichdi and raita',
    base: [['khichdi', 350], ['raita', 120]] },
  { slot: 'dinner', diet: 'nonveg', name: 'Tandoori chicken and roti',
    base: [['tandoori', 180], ['roti', 70], ['salad', 120]] },
  { slot: 'dinner', diet: 'nonveg', name: 'Chicken curry and roti',
    base: [['roti', 105], ['chicken', 200], ['salad', 100]] },
  { slot: 'dinner', diet: 'nonveg', name: 'Fish curry and rice',
    base: [['rice', 200], ['fish', 200], ['sabzi', 120]] },
  { slot: 'dinner', diet: 'egg', name: 'Egg curry and roti',
    base: [['roti', 105], ['eggcurry', 180], ['salad', 100]] },
];

/* What a diet is allowed to see. A vegetarian never sees anything
   else; this is the one rule in the file with no exceptions. */
function allowed(diet) {
  if (diet === 'veg') return ['veg'];
  if (diet === 'nonveg') return ['veg', 'egg', 'nonveg'];
  return ['veg', 'egg', 'nonveg'];         // both
}

/* How much a diet wants to see meat. "Both" is mostly vegetarian,
   so a meat option has to beat a vegetarian one by a clear margin
   to be picked; "non-veg" leans the other way. */
function appetite(diet, mealDiet) {
  if (mealDiet === 'veg') return diet === 'nonveg' ? 0.8 : 1;
  if (diet === 'nonveg') return 1.35;
  if (diet === 'both') return 0.75;
  return 0;
}

/* A small deterministic shuffle. Seeded so the plan is the same all
   day and different tomorrow — a plan that changes every time the
   screen is opened is not a plan. */
function rand(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/* Days since epoch, so "today" is the same number all day. */
export function today(now) {
  const d = now ? new Date(now) : new Date();
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
}

function totals(items) {
  return items.reduce((a, i) => ({
    kcal: a.kcal + i.kcal,
    protein: Math.round((a.protein + i.protein) * 10) / 10,
    carbs: Math.round((a.carbs + i.carbs) * 10) / 10,
    fat: Math.round((a.fat + i.fat) * 10) / 10,
  }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
}

/* Build one meal at a target calorie count.

   Portions are scaled to hit the target, but only so far: below 0.6
   the plate looks mean and above 1.6 it stops being a portion
   anybody would serve. Where the clamp bites, the day's total misses
   its target — which is honest, and better than telling somebody to
   eat nine rotis. */
function build(option, kcal, goal) {
  const base = option.base.map(([k, g]) => item(k, g));
  const baseKcal = totals(base).kcal;
  const wanted = baseKcal > 0 ? kcal / baseKcal : 1;
  const scale = Math.max(0.6, Math.min(1.6, wanted));

  /* Building muscle: keep the protein and cut the rest, rather than
     scaling the whole plate up and eating a mountain of rice. */
  const items = option.base.map(([k, g]) => {
    const f = F[k];
    const proteinDense = f[2] >= 8;
    const s = goal === 'gain' && proteinDense ? Math.min(1.6, scale * 1.15) : scale;
    return item(k, g * s);
  });

  return {
    id: `${option.slot}:${option.name}`,
    slot: option.slot,
    name: option.name,
    diet: option.diet,
    items,
    ...totals(items),
  };
}

/* ---------------------------------------------------------------
   A day of food.

     kcal     the daily target from tdee.js
     protein  the protein target from tdee.js
     diet     veg | both | nonveg
     goal     lose | keep | gain
     seed     bump it to get a different day

   Returns { meals, kcal, protein, carbs, fat, target, hitsProtein }.
   --------------------------------------------------------------- */
export function planFor({ kcal = 2000, protein = 0, diet = 'both', goal = 'keep', seed = 0 } = {}) {
  const target = Math.max(1200, Math.round(Number(kcal) || 2000));
  const ok = allowed(diet);
  const s = Number(seed) || 0;

  const meals = MEALS.map((m, mi) => {
    const pool = OPTIONS.filter((o) => o.slot === m.key && ok.indexOf(o.diet) !== -1);
    if (!pool.length) return null;

    /* Score every option, then take the best. The score is mostly
       the seed, so the choice moves day to day, nudged by how much
       this diet wants meat and — when building muscle — by how much
       protein the meal carries. */
    const scored = pool.map((o, oi) => {
      const built = build(o, target * m.share, goal);
      const noise = rand(s * 97 + mi * 31 + oi * 7);
      const wantsMeat = appetite(diet, o.diet);
      const proteinPull = goal === 'gain' ? built.protein / 40 : 0;
      return { o, built, score: noise * wantsMeat + proteinPull };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0].built;
  }).filter(Boolean);

  const day = totals(meals);

  return {
    meals,
    ...day,
    target,
    proteinTarget: protein,
    hitsProtein: protein > 0 ? day.protein >= protein * 0.9 : true,
  };
}

/* One line for the top of the screen. */
export function summarise(plan) {
  if (!plan) return '';
  const over = plan.kcal - plan.target;
  if (Math.abs(over) <= plan.target * 0.06) return 'About right for today';
  return over > 0 ? `${over} kcal over target` : `${-over} kcal under target`;
}
