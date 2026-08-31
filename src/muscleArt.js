/* ---------------------------------------------------------------
   Muscle artwork.

   Drawn in brand/muscles.mjs and rendered to transparent PNGs by
   `node brand/render-muscles.mjs`. They are white, so every screen
   tints them to the muscle's own colour.

   To use different artwork: replace the six files in
   assets/muscles/ with transparent PNGs of the same names. Nothing
   else has to change.
   --------------------------------------------------------------- */
export const MUSCLE_ART = {
  chest: require('../assets/muscles/chest.png'),
  back: require('../assets/muscles/back.png'),
  shoulders: require('../assets/muscles/shoulders.png'),
  arms: require('../assets/muscles/arms.png'),
  legs: require('../assets/muscles/legs.png'),
  core: require('../assets/muscles/core.png'),
};

/* The exercise library talks in individual muscles; the artwork is
   per group. This maps one onto the other. */
const OF_MUSCLE = {
  Chest: 'chest',
  Back: 'back',
  Shoulders: 'shoulders',
  Biceps: 'arms', Triceps: 'arms',
  Quads: 'legs', Hamstrings: 'legs', Glutes: 'legs', Calves: 'legs',
  Core: 'core',
};

export function artForMuscle(m) {
  return MUSCLE_ART[OF_MUSCLE[m] || 'core'];
}

export function artForTarget(key) {
  if (MUSCLE_ART[key]) return MUSCLE_ART[key];
  /* the split targets borrow the muscle they are named for */
  const byKey = { push: 'chest', pull: 'back', legday: 'legs', corework: 'core' };
  return MUSCLE_ART[byKey[key]] || MUSCLE_ART.core;
}
