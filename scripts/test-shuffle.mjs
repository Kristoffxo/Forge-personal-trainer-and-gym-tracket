/* Shuffling a workout. Run: node scripts/test-shuffle.mjs */
import { buildRoutine, patternOf, poolFor, SPLIT_TARGETS, HOME_KIT } from '../src/routines.js';

let pass = 0; let fail = 0;
const is = (what, got, want) => {
  const a = JSON.stringify(got); const b = JSON.stringify(want);
  if (a === b) { pass += 1; return; }
  fail += 1;
  console.log(`  FAIL ${what}\n    got  ${a}\n    want ${b}`);
};
const ok = (what, cond) => is(what, !!cond, true);

const LEVELS = ['beginner', 'intermediate', 'advanced'];
const KEYS = SPLIT_TARGETS.map((t) => t.key);

/* every session this suite reasons about */
function every(place, fn) {
  for (const target of KEYS) {
    for (const level of LEVELS) {
      for (let seed = 0; seed < 25; seed++) {
        const r = buildRoutine({ target, place, level, seed });
        if (r.exercises.length) fn(r, { target, level, seed });
      }
    }
  }
}

console.log('a session is not the same move twice');
{
  /* The rule is not "never repeat a pattern" — an advanced core day
     is seven exercises and there are only six ways to load a
     midsection, so the seventh has to double up on something. The
     rule is that it never repeats one while an unused pattern is
     still sitting in the pool. */
  let worst = null;
  every('gym', (r, at) => {
    const byMuscle = {};
    r.exercises.forEach((x) => { (byMuscle[x.m] = byMuscle[x.m] || []).push(x); });

    for (const m of Object.keys(byMuscle)) {
      const chosen = byMuscle[m];
      const used = new Set(chosen.map(patternOf));
      const available = new Set(poolFor(m, 'gym', 'men').map(patternOf));
      const best = Math.min(chosen.length, available.size);
      if (used.size < best && !worst) {
        worst = `${at.target}/${at.level}/${at.seed}: ${m} used ${used.size} of ${best} `
          + `patterns — ${chosen.map((e) => e.n).join(', ')}`;
      }
    }
  });
  is('every muscle spreads across as many patterns as it can', worst, null);
}

console.log('\nand not two of the same pull or hinge');
{
  let worst = null;
  every('gym', (r, at) => {
    for (const p of ['vertical', 'hinge']) {
      const n = r.exercises.filter((x) => patternOf(x) === p).length;
      if (n > 1 && !worst) {
        worst = `${at.target}/${at.seed}: ${n} × ${p} — ${r.exercises.map((e) => e.n).join(', ')}`;
      }
    }
  });
  is('at most one of each, in a gym', worst, null);

  /* At home the pool is a tenth the size. Seven back moves out of
     six usable ones has to repeat something, and a short session is
     the worse answer — so the rule there is that it does not turn
     into the same pattern over and over. */
  let home = null;
  every('home', (r, at) => {
    for (const p of ['vertical', 'hinge']) {
      const n = r.exercises.filter((x) => patternOf(x) === p).length;
      if (n > 2 && !home) home = `${at.target}/${at.seed}: ${n} × ${p}`;
    }
  });
  is('and never more than two at home', home, null);
}

console.log('\nheavy work first');
{
  /* Within a muscle, no isolation may come before a compound — that
     is the whole reason the order is not alphabetical. */
  let worst = null;
  every('gym', (r, at) => {
    const byMuscle = {};
    r.exercises.forEach((x) => { (byMuscle[x.m] = byMuscle[x.m] || []).push(x); });
    for (const m of Object.keys(byMuscle)) {
      const types = byMuscle[m].map((x) => x.t).join('');
      if (/i.*c/.test(types) && !worst) {
        worst = `${at.target}/${at.seed}: ${m} went ${types} — ${byMuscle[m].map((e) => e.n).join(', ')}`;
      }
    }
  });
  is('compounds come before isolations', worst, null);
}

console.log('\na gym session uses the gym');
{
  /* Not a hard rule — a chin-up is a fine pull and a push-up is a
     fine finisher — but a barbell day should not come back mostly
     bodyweight when the racks are right there. */
  let bad = 0; let total = 0;
  every('gym', (r, at) => {
    /* Core is bodyweight almost all the way down — a plank does not
       have a barbell version worth doing, and asking for one would
       make the session worse rather than heavier. */
    if (at.target === 'corework') return;
    total += 1;
    const loaded = r.exercises.filter((x) => ['Barbell', 'Dumbbell', 'Machine', 'Cable'].includes(x.e));
    if (loaded.length < Math.ceil(r.exercises.length / 2)) bad += 1;
  });
  ok(`at least half is loaded kit in ${total - bad}/${total} lifting sessions`, bad === 0);
}

console.log('\nhome stays at home');
{
  let worst = null;
  every('home', (r, at) => {
    const off = r.exercises.find((x) => !HOME_KIT.includes(x.e));
    if (off && !worst) worst = `${at.target}/${at.seed}: ${off.n} needs ${off.e}`;
  });
  is('nothing needs a machine or a cable', worst, null);
}

console.log('\nshuffling actually shuffles');
{
  const seen = new Set();
  for (let seed = 0; seed < 12; seed++) {
    seen.add(buildRoutine({ target: 'push', place: 'gym', level: 'intermediate', seed })
      .exercises.map((x) => x.n).join('|'));
  }
  ok(`twelve shuffles gave ${seen.size} different push days`, seen.size >= 6);

  const a = buildRoutine({ target: 'pull', place: 'gym', level: 'advanced', seed: 5 });
  const b = buildRoutine({ target: 'pull', place: 'gym', level: 'advanced', seed: 5 });
  is('the same seed is the same session',
    a.exercises.map((x) => x.n), b.exercises.map((x) => x.n));
}

console.log('\nthe size is still the size');
{
  const sizes = { beginner: 4, intermediate: 5, advanced: 7 };
  let worst = null;
  every('gym', (r, at) => {
    if (r.exercises.length !== sizes[at.level] && !worst) {
      worst = `${at.target}/${at.level}/${at.seed}: ${r.exercises.length} moves`;
    }
  });
  is('shuffling never changes how many moves you get', worst, null);
}

console.log('\nno duplicates, ever');
{
  let worst = null;
  for (const place of ['gym', 'home']) {
    every(place, (r, at) => {
      const names = r.exercises.map((x) => x.n);
      if (new Set(names).size !== names.length && !worst) {
        worst = `${place}/${at.target}/${at.seed}: ${names.join(', ')}`;
      }
    });
  }
  is('the same exercise never appears twice', worst, null);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
