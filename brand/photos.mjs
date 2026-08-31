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
  /* The muscle groups. Each has to read at 110px, so the subject
     fills the frame and is doing the movement that names it. */
  chest: ['1534368959876-26bf04f2c947', 1.0, 'bench press'],
  back: ['1532029837206-abbe2b7620e3', 1.0, 'pull-up'],
  shoulders: ['1571731956672-f2b94d7dd0cb', 1.0, 'bar across the shoulders'],
  arms: ['1530822847156-5df684ec5ee1', 1.0, 'arm under load'],
  legs: ['1605296867304-46d5465a13f1', 1.0, 'squat, silhouetted'],
  core: ['1594381898411-846e7d193883', 1.0, 'sit-ups'],

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
