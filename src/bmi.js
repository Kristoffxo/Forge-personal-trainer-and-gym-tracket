/* ---------------------------------------------------------------
   Body mass index, and what it means in words.

   The number on its own tells almost nobody anything — 26.4 is not
   a fact most people can act on, and it certainly is not a verdict.
   Every screen that shows a BMI shows the band with it, from this
   one table, so the app cannot say "Healthy" in one place and
   "Overweight" in another for the same person.
   --------------------------------------------------------------- */

export const BANDS = [
  { max: 18.5, label: 'Underweight', color: '#5C9BE8',
    note: 'Below the healthy range. Eating more is the priority, not training harder.' },
  { max: 25, label: 'Healthy', color: '#8BC34A',
    note: 'Right where you want to be. Keep doing what you are doing.' },
  { max: 30, label: 'Overweight', color: '#F5A623',
    note: 'A little above. A small daily calorie deficit is the lever.' },
  { max: 1e9, label: 'Obese', color: '#E4453A',
    note: 'Well above the healthy range. Structured coaching matters most here.' },
];

/* Sanity bounds, not politeness: a height of 3cm or a weight of
   900kg is a typo, and computing a BMI from it produces a confident
   number that is nonsense. */
export function bmiFrom(heightCm, weightKg) {
  const h = Number(String(heightCm).replace(',', '.')) / 100;
  const w = Number(String(weightKg).replace(',', '.'));
  if (!(h > 0.5 && h < 2.6 && w > 20 && w < 400)) return null;
  return w / (h * h);
}

export function bandOf(bmi) {
  if (bmi == null || !isFinite(bmi)) return null;
  return BANDS.find((b) => bmi < b.max) || BANDS[BANDS.length - 1];
}

/* The weight range that would put somebody in the healthy band, at
   their height. More use than the index itself, because it is in
   the unit their scales are in. */
export function healthyRange(heightCm) {
  const h = Number(heightCm) / 100;
  if (!(h > 0.5 && h < 2.6)) return null;
  return { lo: 18.5 * h * h, hi: 24.9 * h * h };
}

/* 0-1 along a 14-40 scale, for drawing a marker. */
export function scalePos(bmi) {
  if (bmi == null) return 0;
  return Math.max(0, Math.min(1, (bmi - 14) / 26));
}
