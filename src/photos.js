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
  calm: require('../assets/photos/calm.jpg'),
};

/* A session's photo. Split targets borrow the muscle they lead with. */
const FOR_TARGET = {
  push: 'chest', pull: 'back', legday: 'legs', corework: 'core',
  chest: 'chest', back: 'back', shoulders: 'shoulders',
  arms: 'arms', legs: 'legs', core: 'core',
  /* the women's side */
  lower: 'legs', glutethigh: 'legs', toned: 'hero', upperlight: 'back',
  glutes: 'legs', thighs: 'legs', hamstrings: 'legs', calves: 'legs',
  upper: 'back',
  /* and the period-pain sessions, which are the calmest photo we have */
  relief10: 'calm', relief15: 'calm', relief20: 'calm',
};

export function photoForTarget(key) {
  return PHOTO[FOR_TARGET[key] || 'gym'];
}

/* And one for a single exercise, chosen by the muscle it trains. */
const FOR_MUSCLE = {
  Chest: 'chest', Back: 'back', Shoulders: 'shoulders',
  Biceps: 'arms', Triceps: 'arms',
  Quads: 'legs', Hamstrings: 'legs', Glutes: 'legs', Calves: 'legs',
  Thighs: 'legs', Core: 'core',
  /* the period-pain sessions */
  'Lower back': 'calm', Hips: 'calm', 'Inner thigh': 'calm',
  'Upper back': 'calm', Ribs: 'calm',
};

export function photoForMuscle(m) {
  return PHOTO[FOR_MUSCLE[m] || 'gym'];
}

/* ---------------------------------------------------------------
   The muscle-group cards.

   A real photograph of the lift that muscle is known for, from
   free-exercise-db. They are studio-lit against a plain wall, which
   is why they still read at 110px where a gym snapshot turns to mud.
   --------------------------------------------------------------- */
export const GROUP_PHOTO = {
  chest: require('../assets/groups/chest.jpg'),
  back: require('../assets/groups/back.jpg'),
  shoulders: require('../assets/groups/shoulders.jpg'),
  arms: require('../assets/groups/arms.jpg'),
  legs: require('../assets/groups/legs.jpg'),
  core: require('../assets/groups/core.jpg'),
  glutes: require('../assets/groups/glutes.jpg'),
  thighs: require('../assets/groups/thighs.jpg'),
  hamstrings: require('../assets/groups/hamstrings.jpg'),
  calves: require('../assets/groups/calves.jpg'),
  relief: require('../assets/groups/relief.jpg'),
  upperw: require('../assets/groups/upperw.jpg'),
};

/* Split targets borrow the card of the muscle they lead with. */
const GROUP_BY_TARGET = {
  push: 'chest', pull: 'back', legday: 'legs', corework: 'core',
  lower: 'glutes', glutethigh: 'glutes', toned: 'legs', upperlight: 'back',
  upper: 'upperw',
  upperlight: 'upperw',
  relief10: 'relief', relief15: 'relief', relief20: 'relief',
};

export function groupPhoto(key) {
  return GROUP_PHOTO[key] || GROUP_PHOTO[GROUP_BY_TARGET[key]] || GROUP_PHOTO.chest;
}
