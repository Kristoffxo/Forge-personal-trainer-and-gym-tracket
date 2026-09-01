/* ---------------------------------------------------------------
   Yoga.

   Three flows, on every side of the app. Not a separate discipline
   bolted on — the same session runner, the same photographs, the
   same timer that the held exercises already use.

   Named in English rather than Sanskrit. Somebody who knows what
   Adho Mukha Svanasana is does not need this app to tell them, and
   somebody who does not is helped by "Downward Dog" and a picture.

   The seniors flow is the short one and every pose in it can be done
   from a chair or with a hand on a wall.
   --------------------------------------------------------------- */

const pose = (n, about, hold, note) => ({
  n, m: about, t: 'i', e: 'None', s: hold, r: 1, care: note,
});

export const YOGA = [
  {
    key: 'yoga-wake',
    name: 'Morning Flow',
    mins: 10,
    sub: 'Ten minutes before anything else.',
    blurb: 'Slow, on the floor, nothing upside down.',
    for: ['men', 'women', 'seniors'],
    exercises: [
      pose('Cat Cow', 'Spine', '10 slow rounds', 'Let the breath set the pace.'),
      pose('Child’s Pose', 'Lower back', '90 seconds', 'Knees wide if that is easier.'),
      pose('Overhead Stretch', 'Ribs', '45 seconds', 'Only as far as is comfortable.'),
      pose('Standing Pelvic Tilt', 'Lower back', '10 slow', 'A small movement.'),
      pose('Kneeling Hip Flexor Stretch', 'Hips', '45 seconds each', 'A towel under the knee helps.'),
      pose('Seated Hamstring Stretch', 'Hamstrings', '45 seconds each', 'Lean from the hip, not the back.'),
    ],
  },
  {
    key: 'yoga-unwind',
    name: 'Evening Unwind',
    mins: 15,
    sub: 'For the end of a long day.',
    blurb: 'All of it lying down or sitting. Good before bed.',
    for: ['men', 'women', 'seniors'],
    exercises: [
      pose('Child’s Pose', 'Lower back', '2 minutes', 'Breathe out slowly into it.'),
      pose('Supine Spinal Twist', 'Spine', '60 seconds each', 'Both shoulders stay on the floor.'),
      pose('Reclined Butterfly', 'Hips', '2 minutes', 'A cushion under each knee if the hips are tight.'),
      pose('One Knee To Chest', 'Lower back', '60 seconds each', 'Hold behind the thigh, not the kneecap.'),
      pose('Lying Glute Stretch', 'Hips', '60 seconds each', 'Stop before it becomes sharp.'),
      pose('Hug Knees To Chest', 'Lower back', '60 seconds', 'One knee at a time is fine.'),
      pose('Side Neck Stretch', 'Neck', '30 seconds each', 'No hands. Let the head do it.'),
    ],
  },
  {
    key: 'yoga-open',
    name: 'Deep Stretch',
    mins: 20,
    sub: 'For hips and shoulders that have been sitting.',
    blurb: 'The longest one. Hold each for a full two minutes if you can.',
    for: ['men', 'women'],
    exercises: [
      pose('Cat Cow', 'Spine', '12 slow rounds', 'Slow.'),
      pose('Groiners', 'Hips', '8 each side', 'Move into it, do not bounce.'),
      pose('Kneeling Hip Flexor Stretch', 'Hips', '90 seconds each', 'Squeeze the backside to feel it properly.'),
      pose('Side Lying Groin Stretch', 'Inner thigh', '90 seconds each', 'Let gravity do the work.'),
      pose('Seated Glute Stretch', 'Hips', '90 seconds each', 'Sit tall before you lean.'),
      pose('Supine Spinal Twist', 'Spine', '2 minutes each', 'Look away from the knees.'),
      pose('Chair Upper Body Stretch', 'Chest', '60 seconds', 'Chest lifts, chin stays level.'),
      pose('Child’s Pose', 'Lower back', '2 minutes', 'Finish here.'),
    ],
  },
];

/* Seniors get the two gentle ones. Deep Stretch asks for two minutes
   on a hip and the floor to get down to, which is not a fair ask. */
export function yogaFor(side) {
  return YOGA.filter((y) => y.for.includes(side === 'seniors' ? 'seniors' : side));
}

export function yogaByKey(key) {
  return YOGA.find((y) => y.key === key) || null;
}
