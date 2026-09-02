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
  /* The muscle groups. Chosen by looking at them at 110x118 —
     the size they are actually shown — because a photograph that
     works full-bleed is often an unreadable smudge on a card. */
  chest: ['1598971639058-fab3c3109a00', 1.0, 'press-up'],
  back: ['1532029837206-abbe2b7620e3', 1.0, 'pull-up'],
  shoulders: ['1584464491033-06628f3a6b7b', 1.0, 'dumbbell press'],
  arms: ['1581009146145-b5ef050c2e1e', 1.0, 'barbell curl'],
  legs: ['1517838277536-f5f99be501cd', 1.0, 'legs under a bar'],
  core: ['1594381898411-846e7d193883', 1.0, 'sit-ups'],

  /* the wide ones */
  hero: ['1534438327276-14e5300c3a48', 1.9, 'dumbbell rack'],
  gym: ['1526506118085-60ce8714f8c5', 1.9, 'squat rack'],
  home: ['1594737625785-a6cbdabd333c', 1.9, 'press-ups at home'],
  rest: ['1532384748853-8f54a8f476e2', 1.9, 'between sets'],
  bench: ['1546483875-ad9014c88eba', 1.9, 'bench, dark'],
  kit: ['1584735935682-2f2b69dff9d2', 1.9, 'dumbbells and bands'],

  /* The period-pain screens. The rest of the wide set is somebody
     straining at a machine, which is the wrong photograph to open a
     screen about cramp with. */
  calm: ['1590104872666-01ac8796ab87', 1.9, 'stretching at home'],

  /* The four stretches of the Journey map. Portrait, because each
     band is about 650pt tall on a phone and a landscape crop has to
     be blown up three times over to fill one — which turns a
     photograph into a smear of sky. */
  't_meadow': ['1785268593240-c90cc929b1ca', 0.56, 'a footpath up a green hill', 'bottom'],
  't_forest': ['1783410299649-90cc2defc4b7', 0.56, 'a fogged wood'],
  't_ember':  ['1639152930550-4b18e9e461b6', 0.56, 'volcanic ash', 'bottom'],
  't_frost':  ['1554176259-aa961fc32671', 0.56, 'a snow peak at night'],
};

/* ---------------------------------------------------------------
   The women's side, and the period-pain sessions.

   The muscle-group cards on the men's side come from free-exercise-db,
   which is almost entirely male models — fine there, wrong here. These
   are Unsplash, same licence as everything above, and every one was
   checked at 110x118 (the size the card actually is) before it was
   kept. A photograph that looks good full-bleed is often a smudge on
   a card, which is how the last set went wrong.

     node brand/fetch-group-photos.mjs
   --------------------------------------------------------------- */
export const GROUP_PHOTOS = {
  glutes: ['1662385930032-d9286e02325f', 'deep squat'],
  thighs: ['1784819482937-cab89c3b8309', 'legs at the rack'],
  hamstrings: ['1434608519344-49d77a699e1d', 'leg press'],
  calves: ['1467818488384-3a21f2b79959', 'lower legs on the machine'],
  relief: ['1590104872666-01ac8796ab87', 'stretching at home'],
  upperw: ['1571731956672-f2b94d7dd0cb', 'lat pulldown'],
};

/* Which photo stands in for a session, so the exercise screens all
   have something behind them. */
export const FOR_TARGET = {
  push: 'chest', pull: 'back', legday: 'legs', corework: 'core',
  chest: 'chest', back: 'back', shoulders: 'shoulders',
  arms: 'arms', legs: 'legs', core: 'core',
};
