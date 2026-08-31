/* ---------------------------------------------------------------
   Working out how much you should eat.

   Until now the Food tab opened on 2,200 kcal and expected you to
   type over it, which nobody can do honestly — almost no one knows
   their own number. This works it out from what we ask at sign-up.

   Mifflin-St Jeor for the resting rate, because it is the one that
   holds up best against measured data. Then an activity multiplier
   from training experience, then an adjustment for the goal.

   Every number here is an estimate. The app says so on the screen
   where it appears, and the number stays editable.
   --------------------------------------------------------------- */

/* Resting energy — what you would burn asleep all day. */
export function bmr({ sex, kg, cm, age }) {
  if (!(kg > 0 && cm > 0 && age > 0)) return 0;
  const base = 10 * kg + 6.25 * cm - 5 * age;
  return Math.round(sex === 'female' ? base - 161 : base + 5);
}

/* How much you move, inferred from how long you have been training.
   Someone who calls themselves advanced is training hard most days;
   a beginner, by definition, is not yet. */
const ACTIVITY = {
  beginner: 1.375,        // light — a few sessions a week
  intermediate: 1.55,     // moderate — most days
  advanced: 1.725,        // hard — most days, and harder sessions
};

/* What the goal does to the number. Deliberately gentle: a 20%
   deficit is sustainable, a 40% one is how people quit in March. */
const GOAL = {
  lose: -0.20,
  keep: 0,
  gain: +0.12,
};

export function dailyTarget({ sex, kg, cm, age, experience, goal }) {
  const rest = bmr({ sex, kg, cm, age });
  if (!rest) return 0;
  const moved = rest * (ACTIVITY[experience] || ACTIVITY.intermediate);
  const adjusted = moved * (1 + (GOAL[goal] !== undefined ? GOAL[goal] : 0));

  /* Never recommend below the floor where people stop getting the
     vitamins and minerals they need, whatever the arithmetic says. */
  const floor = sex === 'female' ? 1200 : 1500;
  return Math.max(floor, Math.round(adjusted / 10) * 10);
}

/* A protein target, since it is the one macro worth aiming at.
   1.6 g/kg is where the evidence stops improving much. */
export function proteinTarget(kg) {
  return kg > 0 ? Math.round(kg * 1.6) : 0;
}

export const EXPERIENCE = [
  { key: 'beginner', name: 'Beginner', sub: 'New to this, or coming back after a long break' },
  { key: 'intermediate', name: 'Intermediate', sub: 'Been training on and off for a while' },
  { key: 'advanced', name: 'Advanced', sub: 'Training hard, most weeks, for years' },
];

export const GOALS = [
  { key: 'lose', name: 'Lose fat', sub: 'Eat a little under what you burn' },
  { key: 'keep', name: 'Stay the same', sub: 'Hold your weight, get stronger' },
  { key: 'gain', name: 'Build muscle', sub: 'Eat a little over what you burn' },
];

export const SEXES = [
  { key: 'male', name: 'Male' },
  { key: 'female', name: 'Female' },
];
