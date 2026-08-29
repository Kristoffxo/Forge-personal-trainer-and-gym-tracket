/* ============================================================
   Turns "how do you want to train?" into an actual week.
   ============================================================ */
import { EX } from './exercises';

const D = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

/* Every ready-made split, described in plain words. */
export const SPLITS = [
  { id:'ppl6', name:'Push · Pull · Legs', tag:'6 days a week',
    blurb:'The classic. Every muscle trained twice a week. Best results if you can commit.',
    week:[ ['Chest','Shoulders','Triceps'], ['Back','Biceps'],
           ['Quads','Hamstrings','Glutes','Calves'], ['Chest','Shoulders','Triceps'],
           ['Back','Biceps'], ['Quads','Hamstrings','Glutes','Calves'], [] ] },

  { id:'ppl3', name:'Push · Pull · Legs', tag:'3 days a week',
    blurb:'Same idea, half the time. Good if you train Monday, Wednesday, Friday.',
    week:[ ['Chest','Shoulders','Triceps'], [], ['Back','Biceps'], [],
           ['Quads','Hamstrings','Glutes','Calves'], [], [] ] },

  { id:'ul4', name:'Upper · Lower', tag:'4 days a week',
    blurb:'Two upper days, two lower days. The easiest split to stick to.',
    week:[ ['Chest','Back','Shoulders','Biceps','Triceps'],
           ['Quads','Hamstrings','Glutes','Calves'], [],
           ['Chest','Back','Shoulders','Biceps','Triceps'],
           ['Quads','Hamstrings','Glutes','Calves'], [], [] ] },

  { id:'fb3', name:'Full Body', tag:'3 days a week',
    blurb:'Everything, every session. Best if you are new or short on days.',
    week:[ ['Chest','Back','Quads','Shoulders','Core'], [],
           ['Chest','Back','Hamstrings','Glutes','Core'], [],
           ['Back','Quads','Shoulders','Biceps','Core'], [], [] ] },

  { id:'bro5', name:'One Muscle a Day', tag:'5 days a week',
    blurb:'Chest day, back day, leg day, shoulder day, arm day. Simple to follow.',
    week:[ ['Chest'], ['Back'], ['Quads','Hamstrings','Glutes','Calves'],
           ['Shoulders'], ['Biceps','Triceps'], [], [] ] },

  { id:'custom', name:'Build My Own', tag:'you choose',
    blurb:'Pick which muscles you train on each day of the week.',
    week:[ [], [], [], [], [], [], [] ] },
];

export const DAY_NAMES = D;

export function splitById(id) { return SPLITS.find((s) => s.id === id) || SPLITS[0]; }

/* A day's title, written the way a coach would say it. */
export function dayTitle(muscles) {
  if (!muscles || muscles.length === 0) return 'Rest';
  const set = new Set(muscles);
  const has = (...m) => m.every((x) => set.has(x));
  if (has('Chest','Shoulders','Triceps')) return 'Push';
  if (has('Back','Biceps') && set.size <= 3) return 'Pull';
  if (has('Quads','Hamstrings','Glutes')) return 'Legs';
  if (set.size >= 5) return 'Full Body';
  if (has('Biceps','Triceps') && set.size === 2) return 'Arms';
  return muscles.join(' + ');
}

/*
  Build one session.
  Exercises are shared out across the day's muscles as evenly as possible,
  and each muscle leads with its compound lifts before its isolation work —
  the heavy movement first is the whole point.
*/
export function buildSession(muscles, perSession, kit) {
  if (!muscles || muscles.length === 0) return [];
  const n = Math.max(1, perSession || 5);

  const quota = {};
  muscles.forEach((m) => { quota[m] = Math.floor(n / muscles.length); });
  let left = n - muscles.length * Math.floor(n / muscles.length);
  for (let i = 0; left > 0; i++, left--) quota[muscles[i % muscles.length]] += 1;

  const out = [];
  muscles.forEach((m) => {
    let pool = EX.filter((x) => x.m === m);
    if (kit === 'None') {
      const home = pool.filter((x) => x.e === 'None');
      if (home.length) pool = home;
    }
    const compounds  = pool.filter((x) => x.t === 'c');
    const isolations = pool.filter((x) => x.t === 'i');
    const want = quota[m];
    const picked = [];
    for (let i = 0; i < want; i++) {
      const from = (i < Math.ceil(want / 2) && compounds.length) ? compounds : isolations;
      const src = from.length ? from : (compounds.length ? compounds : isolations);
      if (!src.length) break;
      picked.push(src.shift());
    }
    out.push(...picked);
  });
  return out;
}

/* The whole week, ready to render. */
export function buildWeek(splitId, customWeek, perSession, kit) {
  const base = splitId === 'custom' ? (customWeek || SPLITS[5].week) : splitById(splitId).week;
  return base.map((muscles, i) => ({
    day: D[i],
    muscles,
    title: dayTitle(muscles),
    exercises: buildSession(muscles, perSession, kit),
  }));
}

/* Monday = 0 … Sunday = 6 */
export function todayIndex() {
  const js = new Date().getDay();      // Sunday = 0
  return (js + 6) % 7;
}
