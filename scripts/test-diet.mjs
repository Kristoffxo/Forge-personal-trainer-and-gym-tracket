/* The diet planner. Run: node scripts/test-diet.mjs */
import { planFor, summarise, DIETS, MEALS, today } from '../src/diet.js';

let pass = 0; let fail = 0;
const is = (what, got, want) => {
  const a = JSON.stringify(got); const b = JSON.stringify(want);
  if (a === b) { pass += 1; return; }
  fail += 1;
  console.log(`  FAIL ${what}\n    got  ${a}\n    want ${b}`);
};
const ok = (what, cond) => is(what, !!cond, true);

console.log('the shape of a day');
{
  const p = planFor({ kcal: 2200, protein: 110, diet: 'both', goal: 'keep' });
  is('four meals', p.meals.length, 4);
  is('in order', p.meals.map((m) => m.slot), ['breakfast', 'lunch', 'snack', 'dinner']);
  ok('every meal has food in it', p.meals.every((m) => m.items.length > 0));
  ok('every item has grams', p.meals.every((m) => m.items.every((i) => i.grams > 0)));
  ok('every item has calories', p.meals.every((m) => m.items.every((i) => i.kcal > 0)));
  is('the day adds up', p.kcal, p.meals.reduce((n, m) => n + m.kcal, 0));
  is('three diets offered', DIETS.map((d) => d.key), ['veg', 'both', 'nonveg']);
  is('the meal shares add to one',
    Math.round(MEALS.reduce((n, m) => n + m.share, 0) * 100), 100);
}

console.log('\na vegetarian is never shown meat');
{
  /* The one rule with no exceptions. Every seed, every goal, every
     calorie target — if this ever fails, somebody opens the app and
     is told to eat a chicken. */
  let checked = 0;
  for (let seed = 0; seed < 400; seed++) {
    for (const goal of ['lose', 'keep', 'gain']) {
      for (const kcal of [1200, 1800, 2600, 3400]) {
        const p = planFor({ kcal, protein: 100, diet: 'veg', goal, seed });
        for (const m of p.meals) {
          checked += 1;
          if (m.diet !== 'veg') {
            fail += 1;
            console.log(`  FAIL seed ${seed} ${goal} ${kcal}: ${m.slot} was "${m.name}" (${m.diet})`);
            seed = 1e9; break;
          }
        }
      }
    }
  }
  ok(`${checked} vegetarian meals, none with meat or egg`, checked > 4000);
  pass += 1;
}

console.log('\nnon-vegetarians get meat, and both get some');
{
  const count = (diet) => {
    let meat = 0; let all = 0;
    for (let seed = 0; seed < 200; seed++) {
      const p = planFor({ kcal: 2400, protein: 110, diet, seed });
      p.meals.forEach((m) => { all += 1; if (m.diet !== 'veg') meat += 1; });
    }
    return meat / all;
  };
  const nv = count('nonveg');
  const bo = count('both');
  ok(`non-veg is mostly meat or egg (${Math.round(nv * 100)}%)`, nv > 0.35);
  ok(`both has some, but less than non-veg (${Math.round(bo * 100)}%)`, bo > 0.05 && bo < nv);
}

console.log('\nit lands near the calorie target');
{
  for (const kcal of [1500, 2000, 2500, 3000]) {
    let worst = 0;
    for (let seed = 0; seed < 60; seed++) {
      const p = planFor({ kcal, protein: 100, diet: 'both', seed });
      worst = Math.max(worst, Math.abs(p.kcal - kcal) / kcal);
    }
    ok(`${kcal} kcal: never more than 18% out (worst ${Math.round(worst * 100)}%)`, worst < 0.18);
  }
}

console.log('\nportions stay believable');
{
  /* The clamp exists so nobody is told to eat nine rotis. At the
     extremes the day misses its target instead, which is the honest
     failure. */
  let biggestRoti = 0;
  for (let seed = 0; seed < 200; seed++) {
    const p = planFor({ kcal: 4000, protein: 160, diet: 'both', seed });
    p.meals.forEach((m) => m.items.forEach((i) => {
      if (i.key === 'roti') biggestRoti = Math.max(biggestRoti, i.grams);
    }));
  }
  ok(`the most roti ever suggested is ${biggestRoti}g, under 180g`, biggestRoti <= 180);
}

console.log('\nbuilding muscle pushes protein up');
{
  let gain = 0; let lose = 0;
  for (let seed = 0; seed < 120; seed++) {
    gain += planFor({ kcal: 2500, protein: 120, diet: 'both', goal: 'gain', seed }).protein;
    lose += planFor({ kcal: 2500, protein: 120, diet: 'both', goal: 'lose', seed }).protein;
  }
  ok(`gain averages more protein than lose (${Math.round(gain / 120)}g vs ${Math.round(lose / 120)}g)`,
    gain > lose);
}

console.log('\nthe same day twice is the same plan');
{
  const a = planFor({ kcal: 2200, protein: 110, diet: 'both', seed: 42 });
  const b = planFor({ kcal: 2200, protein: 110, diet: 'both', seed: 42 });
  is('same seed, same meals', a.meals.map((m) => m.name), b.meals.map((m) => m.name));
  const c = planFor({ kcal: 2200, protein: 110, diet: 'both', seed: 43 });
  ok('a different seed is usually a different day',
    c.meals.map((m) => m.name).join() !== a.meals.map((m) => m.name).join());
  /* Local calendar day, not UTC — somebody in India starting
     breakfast at 7am should get today's plan, not yesterday's. So
     these are compared as local times. */
  const morning = new Date(2026, 8, 4, 7, 0, 0);
  const night = new Date(2026, 8, 4, 23, 0, 0);
  const tomorrow = new Date(2026, 8, 5, 7, 0, 0);
  is('today is stable from morning to night', today(morning), today(night));
  ok('and moves on tomorrow', today(tomorrow) === today(morning) + 1);
}

console.log('\nnonsense in');
{
  const p = planFor();
  is('no arguments still makes a day', p.meals.length, 4);
  is('a silly low target is floored', planFor({ kcal: 10 }).target, 1200);
  is('rubbish calories fall back', planFor({ kcal: 'abc' }).target, 2000);
  is('an unknown diet is treated as both', planFor({ diet: 'martian' }).meals.length, 4);
  ok('summarise says something', summarise(planFor({ kcal: 2000 })).length > 0);
  is('summarise survives nothing', summarise(null), '');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
