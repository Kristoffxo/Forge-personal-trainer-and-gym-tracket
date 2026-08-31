/* ---------------------------------------------------------------
   The photographs.

   Fetched by `node brand/fetch-photos.mjs` from Unsplash, whose
   licence allows free commercial use with no attribution. The ids
   live in brand/photos.mjs so the set can be rebuilt or swapped.
   --------------------------------------------------------------- */
export const PHOTO = {
  chest: require('../assets/photos/chest.jpg'),
  back: require('../assets/photos/back.jpg'),
  shoulders: require('../assets/photos/shoulders.jpg'),
  arms: require('../assets/photos/arms.jpg'),
  legs: require('../assets/photos/legs.jpg'),
  core: require('../assets/photos/core.jpg'),
  hero: require('../assets/photos/hero.jpg'),
  gym: require('../assets/photos/gym.jpg'),
  home: require('../assets/photos/home.jpg'),
  rest: require('../assets/photos/rest.jpg'),
  bench: require('../assets/photos/bench.jpg'),
  kit: require('../assets/photos/kit.jpg'),
};

/* A session's photo. Split targets borrow the muscle they lead with. */
const FOR_TARGET = {
  push: 'chest', pull: 'back', legday: 'legs', corework: 'core',
  chest: 'chest', back: 'back', shoulders: 'shoulders',
  arms: 'arms', legs: 'legs', core: 'core',
};

export function photoForTarget(key) {
  return PHOTO[FOR_TARGET[key] || 'gym'];
}

/* And one for a single exercise, chosen by the muscle it trains. */
const FOR_MUSCLE = {
  Chest: 'chest', Back: 'back', Shoulders: 'shoulders',
  Biceps: 'arms', Triceps: 'arms',
  Quads: 'legs', Hamstrings: 'legs', Glutes: 'legs', Calves: 'legs',
  Core: 'core',
};

export function photoForMuscle(m) {
  return PHOTO[FOR_MUSCLE[m] || 'gym'];
}
