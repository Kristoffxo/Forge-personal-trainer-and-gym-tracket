/* ---------------------------------------------------------------
   Menstrual exercises.

   Ten to twenty minutes of movement for period pain. Not a workout
   — nothing here raises a heart rate, and it is meant to be done on
   the day you least want to train.

   Why these and not others: gentle hip and lower-back movement is
   the one non-drug thing with reasonable evidence behind it for
   cramp. Everything below is a hold or a slow movement you can do on
   a floor, in bed, or on a chair, and every one of them has a real
   photograph from the same public-domain database as the rest of
   the app.

   It says plainly, on the screen, that pain bad enough to stop your
   day is worth seeing a doctor about. An app that implies stretching
   is the answer to endometriosis would be doing harm, and no amount
   of good intent makes that acceptable.
   --------------------------------------------------------------- */

/* Same shape as an exercise, so the session runner, the photo
   animation and the preview screen all work untouched.
     m: what it is for, shown under the name
     s: how long to hold it */
const m = (n, about, hold) => ({ n, m: about, t: 'i', e: 'None', s: hold, r: 1 });

export const RELIEF = [
  {
    key: 'relief10',
    name: 'Cramp Relief',
    mins: 10,
    sub: 'For the worst day. All of it on the floor.',
    blurb:
      'Six positions, all lying or kneeling. Breathe out slowly into each one — '
      + 'the breath does as much as the position does.',
    exercises: [
      m('Child’s Pose', 'Lower back', '90 seconds'),
      m('Cat Cow', 'Lower back', '10 slow rounds'),
      m('One Knee To Chest', 'Hips', '60 seconds each'),
      m('Reclined Butterfly', 'Inner thigh', '2 minutes'),
      m('Supine Spinal Twist', 'Lower back', '60 seconds each'),
      m('Pelvic Tilt Into Bridge', 'Lower back', '10 slow reps'),
    ],
  },
  {
    key: 'relief15',
    name: 'Lower Back & Hips',
    mins: 15,
    sub: 'For the ache that sits in your back rather than your front.',
    blurb:
      'Cramp is often felt in the lower back and the hips before it is felt anywhere '
      + 'else. This one opens both, slowly, and finishes lying down.',
    exercises: [
      m('Standing Pelvic Tilt', 'Lower back', '12 slow reps'),
      m('Cat Cow', 'Lower back', '10 slow rounds'),
      m('Kneeling Hip Flexor Stretch', 'Hips', '60 seconds each'),
      m('Seated Glute Stretch', 'Hips', '60 seconds each'),
      m('Groin and Back Stretch', 'Inner thigh', '90 seconds'),
      m('Side Lying Groin Stretch', 'Inner thigh', '60 seconds each'),
      m('Lying Glute Stretch', 'Hips', '60 seconds each'),
      m('Child’s Pose', 'Lower back', '2 minutes'),
    ],
  },
  {
    key: 'relief20',
    name: 'Whole Body Ease',
    mins: 20,
    sub: 'For the heavy, bloated, worn-out days.',
    blurb:
      'Longer and gentler. Half of it is the back and hips, the rest is everything '
      + 'that goes stiff from a day spent curled up.',
    exercises: [
      m('Overhead Stretch', 'Ribs', '45 seconds'),
      m('Standing Side Stretch', 'Ribs', '45 seconds each'),
      m('Cat Cow', 'Lower back', '12 slow rounds'),
      m('Child’s Pose', 'Lower back', '90 seconds'),
      m('One Knee To Chest', 'Hips', '60 seconds each'),
      m('Reclined Butterfly', 'Inner thigh', '2 minutes'),
      m('Supine Spinal Twist', 'Lower back', '90 seconds each'),
      m('Seated Hamstring Stretch', 'Hamstrings', '60 seconds each'),
      m('Lower Back Curl', 'Lower back', '60 seconds'),
      m('Upper Back Stretch', 'Upper back', '45 seconds'),
      m('Middle Back Stretch', 'Upper back', '45 seconds'),
      m('Chair Lower Back Stretch', 'Lower back', '60 seconds'),
    ],
  },
];

export function reliefByKey(key) {
  return RELIEF.find((r) => r.key === key) || null;
}

/* Said once on the menu screen, and it is not boilerplate. */
export const RELIEF_NOTE =
  'Movement helps most ordinary period pain. It is not a treatment. '
  + 'Pain that stops your day, pain that is getting worse, or bleeding that '
  + 'soaks a pad in an hour is worth seeing a doctor about — that is not '
  + 'something to stretch through.';
