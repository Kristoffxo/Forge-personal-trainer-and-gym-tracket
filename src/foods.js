/* ---------------------------------------------------------------
   Food lookup — USDA FoodData Central, all public domain.

     sr     SR Legacy   generic and raw ingredients
     fndds  FNDDS       prepared dishes, restaurant and takeaway items
     fnd    Foundation  lab-analysed staples
     br     Branded     packaged supermarket products

   Short keys keep the bundled JSON small:
     i id · n name · c category · k kcal · p protein · ch carbs · f fat
     fb fibre · sg sugar · na sodium · s servings [{l,a,g}] · src dataset
   --------------------------------------------------------------- */
import GENERIC from '../data/foods.json';
import BRANDED from '../data/foods_branded.json';
import INDIAN from '../data/foods_indian.json';
import EXTRA from '../data/foods_extra.json';
import { POPULAR } from './popular';

/* USDA writes brands in caps ("TACO BELL, ..."). Soften them. */
function prettify(name) {
  return name.replace(/\b[A-Z][A-Z'&.]{2,}\b/g, (w) => w.charAt(0) + w.slice(1).toLowerCase());
}

function shape(f) {
  return {
    id: f.i, name: prettify(f.n), cat: f.c, src: f.src || 'sr',
    kcal: f.k, protein: f.p, carbs: f.ch, fat: f.f,
    fiber: f.fb, sugar: f.sg, sodium: f.na,
    servings: f.s || [],
    alias: f.al || '',
    // aliases join the search text, so "arhar", "chane ki dal" or "bhindi"
    // find the food even though the entry is titled in English
    _s: (f.n + (f.al ? ' ' + f.al : '')).toLowerCase(),
  };
}

export const FOODS = GENERIC.map(shape)
  .concat(EXTRA.map(shape))
  .concat(INDIAN.map(shape))
  .concat(BRANDED.map(shape));
export const COUNT = FOODS.length;

/* Generic foods outrank packaged ones when scores tie — logging "chicken
   breast" should not surface forty frozen ready-meals first. */
const SRC_WEIGHT = { nem: 0, indb: 0, ifct: 0, fndds: 1, sr: 1, fnd: 2, br: 3 };

/* ---------------------------------------------------------------
   The staples people actually log, pinned by id. Each gets a plain
   name ("Boiled egg") shown instead of the USDA description, and a
   rank so the order below is the order on screen.
   --------------------------------------------------------------- */
const BY_ID = new Map(FOODS.map((f) => [f.id, f]));

export const STAPLES = POPULAR.map(([id, label], i) => {
  const f = BY_ID.get(id);
  if (!f) return null;
  const copy = Object.assign({}, f, { name: label, usda: f.name, pop: i });
  copy._s = (label + ' ' + f.name).toLowerCase();   // match either wording
  return copy;
}).filter(Boolean);

/* id -> rank, so a staple that also turns up in a search floats to the top */
const POP_RANK = new Map(STAPLES.map((f) => [f.id, f.pop]));
const POP_BY_ID = new Map(STAPLES.map((f) => [f.id, f]));

/*
  Ranked search, best first:
    · a pinned staple whose plain name matches wins outright
    · then: name starts with the query
    · then: a word inside the name starts with it
    · then: it appears anywhere
  Ties break on generic-before-branded, then the shorter (plainer) name.
*/
export function searchFoods(query, limit) {
  const q = String(query || '').trim().toLowerCase();
  if (q.length < 2) return STAPLES.slice(0, limit || 40);

  const hits = [];
  const seen = new Set();

  // staples first, in their curated order
  STAPLES.forEach((f) => {
    const at = f._s.indexOf(q);
    if (at === -1) return;
    seen.add(f.id);
    // curated order wins inside the pinned tier, not letter position
    hits.push({ f, tier: 0, score: 0, w: f.pop, len: f.name.length });
  });

  // "arhar ki dal" must find an entry aliased "arhar dal" — so if the phrase
  // itself is absent, accept a food that contains every word of the query.
  const words = q.split(/\s+/).filter((w) => w.length > 1);

  for (let i = 0; i < FOODS.length; i++) {
    const f = FOODS[i];
    if (seen.has(f.id)) continue;

    let score;
    const at = f._s.indexOf(q);
    if (at !== -1) {
      score = 2;
      if (at === 0) score = 0;
      else if (' ,('.indexOf(f._s.charAt(at - 1)) !== -1) score = 1;
    } else if (words.length > 1 && words.every((w) => f._s.indexOf(w) !== -1)) {
      score = 3;                       // every word present, just not adjacent
    } else {
      continue;
    }

    // a branded packet should never outrank the real food: "roti" must find
    // chapati, not ROTINI pasta, even though the pasta matches at position 0
    const w = SRC_WEIGHT[f.src] || 0;
    hits.push({ f, tier: 1, score: score + (f.src === 'br' ? 2 : 0), w, len: f._s.length });
    if (hits.length > 4000) break;
  }

  hits.sort((a, b) =>
    (a.tier - b.tier) || (a.score - b.score) || (a.w - b.w) || (a.len - b.len));
  return hits.slice(0, limit || 60).map((h) => h.f);
}

export function macrosFor(food, grams) {
  const r = grams / 100;
  return { kcal: food.kcal * r, protein: food.protein * r, carbs: food.carbs * r, fat: food.fat * r };
}

/* Labels that describe one whole thing — how people actually log food.
   "1 large egg" beats "cup, chopped"; "1 tablespoon" beats "1 cup" of oil. */
const ITEMISH = /\b(large|medium|small|item|piece|slice|breast|thigh|whole|each|egg|fillet|scoop|container|bar|packet|serving|tablespoon|tbsp)\b/i;

/*
  Servings, most-likely first.

  Ranking by gram weight alone gave nonsense: olive oil opened on "1 cup"
  (1,900 kcal) and a boiled egg on "cup, chopped". Rank by the calories the
  serving actually delivers, favouring whole-item wording, so the default is
  something a person would really eat in one go.
*/
export function portionsFor(food) {
  const list = food.servings.map((s) => ({
    label: (s.a !== 1 ? s.a + ' ' : '') + s.l,
    grams: s.g,
    kcal: food.kcal * s.g / 100,
  }));

  list.sort((a, b) => {
    const tier = (x) => {
      const sane = x.kcal >= 20 && x.kcal <= 600;
      if (sane && ITEMISH.test(x.label)) return 0;
      if (sane) return 1;
      return 2;
    };
    const t = tier(a) - tier(b);
    if (t) return t;
    return Math.abs(a.kcal - 160) - Math.abs(b.kcal - 160);
  });

  list.push({ label: '100 g', grams: 100 });
  list.push({ label: '1 g', grams: 1 });
  return list;
}
