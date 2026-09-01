/* ---------------------------------------------------------------
   Working out what a senior should actually be given.

   "Senior" starts at forty-five and covers somebody who has not
   stood up in three hours and somebody who still plays badminton on
   Sundays. Handing both of them chair squats is useless to one and
   dangerous to neither — which is a polite way of saying it wastes
   the second person's time and teaches them the app is not for them.

   So it asks two things, in examples rather than adjectives:

     how much do you move        because that sets where to start
     what is it for              because that sets what to train

   and then every muscle group has a ladder, three rungs, and the
   answers pick the rung. Nobody is shown a press-up at the bottom
   rung; they are shown the same movement against a wall.

   Every step of every movement carries the same reminder, because
   the person reading it is the person most likely to push through
   something they should not.
   --------------------------------------------------------------- */

/* ---------------------------------------------------------------
   The two questions
   --------------------------------------------------------------- */
export const ACTIVITY = [
  {
    key: 'still',
    rung: 0,
    name: 'I do not move much during the day',
    sub: 'Mostly sitting — a desk, a chair, the car.',
  },
  {
    key: 'busy',
    rung: 1,
    name: 'I move a lot and do many tasks during the day',
    sub: 'On my feet, stairs, shopping, housework, walking.',
  },
  {
    key: 'sporty',
    rung: 2,
    name: 'I can play sports and even run when I want to',
    sub: 'Still fit. A game or a run is not a problem.',
  },
];

export const AIM = [
  {
    key: 'health',
    name: 'To stay healthy',
    sub: 'Move well, sleep well, keep doing everything I do now.',
    /* what gets the most work */
    focus: ['Legs', 'Balance', 'Back', 'Core'],
  },
  {
    key: 'jog',
    name: 'To be able to jog',
    sub: 'Get the legs and the wind back.',
    focus: ['Legs', 'Calves', 'Core', 'Balance'],
  },
  {
    key: 'muscle',
    name: 'To build muscle',
    sub: 'Get stronger and hold on to what I have.',
    focus: ['Legs', 'Chest', 'Back', 'Arms', 'Shoulders'],
  },
];

/* Said under every single step. It is repetition on purpose: the
   person most likely to push through a warning is the person reading
   the third step of the fourth exercise. */
export const STEP_NOTE =
  'Stop if it hurts. Sore the next day is fine; sharp, now, is not.';

/* A rung on a ladder. */
const ex = (n, about, amount, steps, care) => ({
  n, m: about, t: 'i', e: 'None', s: amount, steps, care, senior: 1,
});

/* ---------------------------------------------------------------
   The ladders.

   Three rungs per group, easiest first. The same movement gets
   harder rather than being swapped for a different one, so nothing
   has to be learnt twice.
   --------------------------------------------------------------- */
export const LADDERS = {
  Chest: [
    ex('Wall Push-up', 'Chest and arms', '2 rounds of 10',
      [
        'Stand an arm’s length from a wall, hands flat on it at shoulder height.',
        'Keep your body straight from head to heels.',
        'Bend your elbows and let your chest come towards the wall.',
        'Push back to the start. Slowly, both ways.',
      ],
      'The further your feet are from the wall, the harder it gets. Start close.'),
    ex('Knee Push-up', 'Chest and arms', '2 rounds of 8',
      [
        'On the floor on your hands and knees, a folded towel under the knees.',
        'Walk your hands forward until your body is a straight line from head to knees.',
        'Bend your elbows and lower your chest as far as is comfortable.',
        'Push back up. Three seconds down, one up.',
      ],
      'If your lower back sags, you have gone too far forward. Walk your hands back.'),
    ex('Incline Push-up', 'Chest and arms', '3 rounds of 10',
      [
        'Put your hands on a kitchen worktop or the back of a heavy sofa.',
        'Walk your feet back until your body is straight.',
        'Lower your chest to the surface, elbows going back rather than out.',
        'Push up. The lower the surface, the harder it is.',
      ],
      'Make sure whatever you lean on cannot slide. Not a chair on wheels.'),
  ],

  Legs: [
    ex('Chair Squat', 'Legs and standing up', '2 rounds of 8',
      [
        'Sit near the front of a firm chair, feet flat and hip-width apart.',
        'Lean your chest forward over your knees.',
        'Push through your heels and stand all the way up.',
        'Sit back down slowly, counting three.',
      ],
      'Push off your knees with your hands if you need to. That still counts.'),
    ex('Bodyweight Squat', 'Legs', '2 rounds of 10',
      [
        'Stand with feet a little wider than your hips, a chair behind you.',
        'Push your hips back as if you were about to sit.',
        'Go down only as far as is comfortable, and no further than the chair.',
        'Stand back up, pushing through your heels.',
      ],
      'Knees track over the toes, never falling inwards. If they do, go less deep.'),
    ex('Split Squat', 'Legs and balance', '2 rounds of 8 each leg',
      [
        'Hold a chair with one hand. Take one long step back.',
        'Bend both knees and lower straight down, not forwards.',
        'The back knee comes towards the floor but does not touch it.',
        'Push through the front heel to stand. Eight, then swap legs.',
      ],
      'Keep hold of the chair. This is a strength exercise, not a balance test.'),
  ],

  Back: [
    ex('Floor Back Extension', 'Back', '2 rounds of 10',
      [
        'Lie face down on a mat with your hands beside your shoulders.',
        'Lift your head and chest a small way off the floor.',
        'Hold for two seconds, looking at the floor and not up.',
        'Lower slowly.',
      ],
      'Small lift. This is not a press-up and your hips stay down.'),
    ex('Band Pull Apart', 'Upper back and posture', '2 rounds of 12',
      [
        'Hold a resistance band with both hands, arms straight out in front.',
        'Keep your arms straight and pull your hands apart.',
        'Squeeze your shoulder blades together at the widest point.',
        'Come back slowly. The band should never snap back.',
      ],
      'Shoulders stay down, away from your ears, the whole time.'),
    ex('Banded Upright Row', 'Upper back', '3 rounds of 10',
      [
        'Stand on the middle of a band, holding an end in each hand.',
        'Pull your hands up towards your chest, elbows leading.',
        'Stop when your hands reach the bottom of your ribs.',
        'Lower slowly.',
      ],
      'Do not pull higher than your chest. Above that the shoulder pinches.'),
  ],

  Shoulders: [
    ex('Seated Front Raise', 'Shoulders', '2 rounds of 10',
      [
        'Sit tall with your feet flat and your hands on your thighs.',
        'Lift both arms straight out in front, to shoulder height.',
        'Stop at shoulder height. No higher.',
        'Lower slowly, all the way down.',
      ],
      'Nothing goes above the shoulder. If a shoulder clicks, stop below where it does.'),
    ex('Banded Lateral Raise', 'Shoulders', '2 rounds of 12',
      [
        'Stand on the middle of a band, one end in each hand at your sides.',
        'Lift both arms out sideways to shoulder height.',
        'Lead with your elbows, not your hands.',
        'Lower slowly, taking three seconds.',
      ],
      'Shoulder height and no further. Above that is where shoulders get hurt.'),
    ex('Banded Shoulder Press', 'Shoulders', '3 rounds of 10',
      [
        'Stand on a band, hands at shoulder height, palms forward.',
        'Press both hands up until your arms are almost straight.',
        'Keep your ribs down — do not arch your back to get there.',
        'Lower slowly to shoulder height.',
      ],
      'If you cannot press overhead without arching, stay on the lateral raise.'),
  ],

  Arms: [
    ex('Self-Resisted Curl', 'Arms and grip', '2 rounds of 10 each',
      [
        'Sit with your right palm facing up on your thigh.',
        'Press your left hand down onto the right palm.',
        'Curl the right arm up while the left pushes back against it.',
        'Three seconds up, three down. Then swap.',
      ],
      'You decide how hard this is. Go gently the first week.'),
    ex('Banded Triceps Extension', 'Back of the arms', '2 rounds of 12',
      [
        'Hold one end of a band behind your head, the other hand holding it low behind your back.',
        'Straighten the top arm upwards against the band.',
        'Keep the elbow pointing forwards, not out to the side.',
        'Lower slowly. Twelve, then swap.',
      ],
      'If the shoulder complains reaching behind your head, do this with the band in front instead.'),
    ex('Close-Grip Push-up', 'Back of the arms', '2 rounds of 8',
      [
        'Do this on your knees, or with your hands on a worktop.',
        'Hands under your shoulders, closer together than a normal push-up.',
        'Lower with your elbows brushing your sides, not flaring out.',
        'Push back up slowly.',
      ],
      'Elbows in, close to the body. Flared elbows are what makes this hurt.'),
  ],

  Core: [
    ex('Standing Pelvic Tilt', 'Middle and lower back', '10 slow',
      [
        'Stand with your back against a wall, feet a little way out.',
        'Flatten the small of your back into the wall.',
        'Hold two seconds, then let go.',
        'Ten times, slowly.',
      ],
      'A small movement. Nobody across the room should be able to see it.'),
    ex('Dead Bug', 'Middle', '2 rounds of 8 each side',
      [
        'Lie on your back, knees bent up, arms straight towards the ceiling.',
        'Press your lower back gently into the floor and keep it there.',
        'Lower one arm behind you and the opposite leg towards the floor.',
        'Bring them back and swap sides.',
      ],
      'If your back lifts off the floor, move a smaller distance.'),
    ex('Side Plank', 'Sides', '2 rounds of 20 seconds each side',
      [
        'Lie on your side, propped on your forearm, knees bent.',
        'Lift your hips so you make a straight line from head to knees.',
        'Hold, breathing normally.',
        'Lower slowly, then swap sides.',
      ],
      'On the knees, not the feet. Straighten the legs only when twenty seconds is easy.'),
  ],

  Calves: [
    ex('Ankle Circles', 'Ankles', '10 each way, each foot',
      [
        'Sit down and lift one foot just off the floor.',
        'Draw ten slow circles one way.',
        'Ten the other way.',
        'Swap feet.',
      ],
      'Small circles. This is for the joint, not the muscle.'),
    ex('Calf Stretch at the Wall', 'Calves', '30 seconds each leg',
      [
        'Both hands on a wall, an arm’s length away.',
        'Step one foot back, heel pressed down.',
        'Bend the front knee until the back calf pulls gently.',
        'Hold, then swap legs.',
      ],
      'A pull, never a sharp pain. Bring the back foot in if it is too much.'),
    ex('Banded Calf Raise', 'Calves', '3 rounds of 15',
      [
        'Sit with a band under the ball of one foot, holding both ends.',
        'Push your toes away against the band.',
        'Hold for a second at the end.',
        'Come back slowly. Fifteen, then swap.',
      ],
      'Slow on the way back is the half that builds the calf.'),
  ],

  Balance: [
    ex('Standing Hip Circles', 'Hips and balance', '8 each way',
      [
        'Stand behind a firm chair and hold the back of it with both hands.',
        'Take your weight onto the left foot.',
        'Lift the right knee and draw a slow circle with it.',
        'Eight circles, then swap legs.',
      ],
      'Both hands on the chair to begin with. One hand only when it feels dull.'),
    ex('Side Leg Raises', 'Hips and side balance', '10 each leg',
      [
        'Hold the chair with one hand and stand tall.',
        'Lift one leg out to the side, only a hand-width off the floor.',
        'Keep your toes pointing forwards, not up.',
        'Lower slowly. Ten, then the other leg.',
      ],
      'Low is correct. Lifting high tips you over and trains nothing extra.'),
    ex('Rear Leg Raise', 'Backside and balance', '10 each leg',
      [
        'Hold the chair with one hand.',
        'Take one leg straight back behind you.',
        'Go only as far as you can without leaning forwards.',
        'Squeeze, then bring it back. Ten, then swap.',
      ],
      'If your back arches, you have gone too far. Shorten the movement.'),
  ],
};

export const GROUPS = Object.keys(LADDERS);

/* ---------------------------------------------------------------
   Which rung.

   The activity answer sets it. What it is for nudges it up by one on
   the groups that goal actually cares about — somebody training to
   jog should not be doing chair squats forever — and never past the
   top of the ladder.
   --------------------------------------------------------------- */
export function rungFor(activityKey, aimKey, group) {
  const act = ACTIVITY.find((a) => a.key === activityKey) || ACTIVITY[0];
  const aim = AIM.find((a) => a.key === aimKey) || AIM[0];
  const focused = aim.focus.includes(group);
  return Math.min(2, act.rung + (focused ? 1 : 0));
}

/* One group, at the right rung, with the reminder on every step. */
export function sessionFor(group, activityKey, aimKey) {
  const ladder = LADDERS[group];
  if (!ladder) return null;
  const rung = rungFor(activityKey, aimKey, group);
  const move = ladder[rung];

  return {
    key: 'sp-' + group.toLowerCase(),
    group,
    rung,
    name: group,
    mins: 12,
    sub: move.n,
    exercises: [{ ...move, steps: move.steps.map((s) => s) }],
  };
}

/* The whole plan: every group, hardest-worked first. */
export function planFor(activityKey, aimKey) {
  const aim = AIM.find((a) => a.key === aimKey) || AIM[0];
  return GROUPS
    .map((g) => sessionFor(g, activityKey, aimKey))
    .sort((a, b) => {
      const fa = aim.focus.indexOf(a.group);
      const fb = aim.focus.indexOf(b.group);
      return (fa === -1 ? 99 : fa) - (fb === -1 ? 99 : fb);
    });
}
