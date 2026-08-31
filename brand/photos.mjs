/* ---------------------------------------------------------------
   Photography.

   Real photographs, not illustrations — the app is about lifting
   things and it should look like it.

   Every one is from Unsplash, whose licence allows free use
   including commercially and without attribution. The ids are kept
   here so the set is reproducible: `node brand/fetch-photos.mjs`
   downloads them again from scratch.

   Each is fetched at 900px, cropped to the shape it is used at, and
   compressed — the whole set is well under a megabyte, because
   these ship inside the bundle.
   --------------------------------------------------------------- */

/* name -> [unsplash id, crop aspect, what it is] */
export const PHOTOS = {
  /* the muscle groups, as cards. Each one has to read at 110px
     wide, so the subject is centred and doing the obvious thing. */
  chest: ['1598971639058-fab3c3109a00', 1.0, 'press-up'],
  back: ['1532029837206-abbe2b7620e3', 1.0, 'pull-up'],
  shoulders: ['1567013127542-490d757e51fc', 1.0, 'delts, gym floor'],
  arms: ['1581009146145-b5ef050c2e1e', 1.0, 'barbell curl'],
  legs: ['1517836357463-d25dfeac3438', 1.0, 'barbell, feet set'],
  core: ['1571019613454-1cb2f99b2d8b', 1.0, 'sit-ups'],

  /* the wide ones */
  hero: ['1534438327276-14e5300c3a48', 1.9, 'dumbbell rack'],
  gym: ['1526506118085-60ce8714f8c5', 1.9, 'squat rack'],
  home: ['1594737625785-a6cbdabd333c', 1.9, 'press-ups at home'],
  rest: ['1532384748853-8f54a8f476e2', 1.9, 'between sets'],
  bench: ['1546483875-ad9014c88eba', 1.9, 'bench, dark'],
  kit: ['1584735935682-2f2b69dff9d2', 1.9, 'dumbbells and bands'],
};

/* Which photo stands in for a session, so the exercise screens all
   have something behind them. */
export const FOR_TARGET = {
  push: 'chest', pull: 'back', legday: 'legs', corework: 'core',
  chest: 'chest', back: 'back', shoulders: 'shoulders',
  arms: 'arms', legs: 'legs', core: 'core',
};
