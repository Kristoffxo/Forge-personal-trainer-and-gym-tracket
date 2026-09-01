/* ---------------------------------------------------------------
   The seniors side.

   Home only. No gym, no barbell, no jumping, nothing that puts a
   joint under load it did not ask for. Every session is done with a
   chair, a wall, the floor, and your own weight.

   The thing that makes this side different is not the exercise list
   — it is the instructions. Everywhere else in the app an exercise
   is a name and a rep scheme, because everyone else already knows
   what a squat is. Here each movement is written out as numbered
   steps, in short sentences, with the thing that can go wrong said
   out loud. Somebody starting at seventy-two, alone, in their front
   room, should not have to guess.

   What is deliberately absent: any exercise where losing balance
   means falling, any load overhead, any deep knee bend, anything
   fast. Every standing movement says to hold the chair.
   --------------------------------------------------------------- */

/* A movement: numbered steps, and one line on what to watch for.
     n     the name shown
     m     what it helps, in plain words
     s     how much — always time or an easy count
     steps do this, then this
     care  the mistake people make, or the reason to stop */
const m = (n, about, amount, steps, care) => ({
  n, m: about, t: 'i', e: 'None', s: amount, steps, care, senior: 1,
});

export const SENIOR_SESSIONS = [
  {
    key: 'sen-chair',
    name: 'Chair Strength',
    mins: 15,
    sub: 'Sit down, stand up, and the muscles that do it.',
    blurb: 'Everything here is done sitting, or holding the back of a chair. '
      + 'Standing up from a chair without using your hands is the single most '
      + 'useful thing a body can keep, and it is trainable at any age.',
    exercises: [
      m('Chair Squat', 'Legs and standing up', '2 rounds of 8',
        [
          'Sit near the front of a firm chair. Not an armchair — it needs to be steady.',
          'Put your feet flat, a little wider than your hips.',
          'Lean your chest forward over your knees.',
          'Push through your heels and stand all the way up.',
          'Sit back down slowly. Count three going down.',
        ],
        'If you cannot stand without hands yet, push off your knees. That still counts, and it goes away with practice.'),

      m('Seated Front Raise', 'Shoulders', '2 rounds of 10',
        [
          'Sit tall, feet flat, hands resting on your thighs.',
          'Lift both arms straight out in front of you, to shoulder height.',
          'Stop at shoulder height. No higher.',
          'Lower them slowly, all the way down.',
        ],
        'Nothing goes above the shoulder. If a shoulder clicks or catches, stop at the height where it does not.'),

      m('Self-Resisted Curl', 'Arms and grip', '2 rounds of 10',
        [
          'Sit with your right palm facing up on your thigh.',
          'Press your left hand down onto your right palm.',
          'Curl the right arm up while the left hand pushes back against it.',
          'Take three seconds up, three seconds down. Then swap arms.',
        ],
        'You decide how hard this is. Push gently the first week.'),

      m('Ankle Circles', 'Ankles and circulation', '10 each way, each foot',
        [
          'Sit with one foot lifted just off the floor.',
          'Draw a slow circle with your toes, ten times one way.',
          'Then ten times the other way.',
          'Put the foot down and do the other one.',
        ],
        'Small circles. This is for the joint, not the muscle.'),

      m('Overhead Stretch', 'Ribs and breathing', '30 seconds',
        [
          'Sit tall with your feet flat.',
          'Lace your fingers together and turn your palms up.',
          'Raise your arms as far as is comfortable and breathe out slowly.',
          'Hold, breathing normally, then lower.',
        ],
        'Only as far as is comfortable. Comfortable is different every day.'),
    ],
  },

  {
    key: 'sen-balance',
    name: 'Steady on Your Feet',
    mins: 12,
    sub: 'The one that stops a fall.',
    blurb: 'Balance is a skill and it fades if it is not used. Every movement '
      + 'here is done next to a chair or a worktop, with a hand on it. Keeping '
      + 'the hand there is not cheating — it is the exercise done properly.',
    exercises: [
      m('Standing Hip Circles', 'Hips and balance', '8 each way',
        [
          'Stand behind a firm chair and hold the back of it.',
          'Take your weight onto the left foot.',
          'Lift the right knee and draw a slow circle with it.',
          'Eight circles, then swap legs.',
        ],
        'Both hands on the chair to begin with. One hand only when it feels dull.'),

      m('Side Leg Raises', 'Hips and side balance', '10 each leg',
        [
          'Hold the chair with one hand and stand tall.',
          'Lift one leg straight out to the side, only a hand-width off the floor.',
          'Keep your toes pointing forwards, not up.',
          'Lower it slowly. Ten times, then the other leg.',
        ],
        'Low is correct. Lifting it high tips you over and trains nothing extra.'),

      m('Rear Leg Raise', 'Backside and posture', '10 each leg',
        [
          'Hold the chair with both hands.',
          'Stand tall and take one leg straight back behind you.',
          'Go only as far as you can without leaning forwards.',
          'Squeeze the muscle, then bring it back. Ten, then swap.',
        ],
        'If your back arches, you have gone too far back. Shorten the movement.'),

      m('Calf Stretch at the Wall', 'Calves and ankles', '30 seconds each leg',
        [
          'Stand an arm’s length from a wall and put both hands on it.',
          'Step one foot back, keeping that heel down.',
          'Bend the front knee until you feel a gentle pull in the back calf.',
          'Hold and breathe. Then swap legs.',
        ],
        'A pull, never a sharp pain. Bring the back foot in if it is too much.'),

      m('Knee Circles', 'Knees', '8 each way',
        [
          'Stand with your feet together and a hand on the chair.',
          'Bend your knees a little and rest your free hand on them.',
          'Draw slow, small circles with the knees.',
          'Eight one way, eight the other.',
        ],
        'Very small circles. Stop if the knee complains at all.'),
    ],
  },

  {
    key: 'sen-loosen',
    name: 'Loosen Up',
    mins: 10,
    sub: 'For the first hour of the morning.',
    blurb: 'Nothing here is hard. It is the ten minutes that make the rest of '
      + 'the day move more easily, and it can be done in a dressing gown before '
      + 'the kettle has boiled.',
    exercises: [
      m('Arm Circles', 'Shoulders', '10 each way',
        [
          'Stand or sit tall with your arms out to the sides.',
          'Draw small circles forwards, ten of them.',
          'Then ten backwards.',
          'Make the circles a little bigger only if it stays comfortable.',
        ],
        'Start small. Big circles on a cold shoulder are how people hurt one.'),

      m('Side Neck Stretch', 'Neck', '20 seconds each side',
        [
          'Sit tall and let your shoulders drop.',
          'Tip your right ear gently towards your right shoulder.',
          'Do not pull with your hand. Let the weight of your head do it.',
          'Hold, come back to the middle, and do the other side.',
        ],
        'Never roll the head all the way round. Side to side only.'),

      m('Cat Cow', 'Back', '8 slow rounds',
        [
          'On hands and knees on a mat or rug. A folded towel under the knees helps.',
          'Breathe out and round your back up towards the ceiling.',
          'Breathe in and let it sag gently the other way.',
          'Slow. Eight rounds.',
        ],
        'If the floor is not manageable, do the same movement sitting in a chair.'),

      m('One Knee To Chest', 'Lower back and hips', '30 seconds each leg',
        [
          'Lie on your back with both knees bent, feet flat.',
          'Bring one knee up towards your chest and hold behind the thigh.',
          'Keep the other foot flat on the floor.',
          'Hold, breathing, then swap.',
        ],
        'Hold behind the thigh, not on top of the kneecap.'),

      m('Standing Pelvic Tilt', 'Lower back', '10 slow',
        [
          'Stand with your back against a wall, feet a little way out from it.',
          'Flatten the small of your back into the wall.',
          'Hold for two seconds, then let it go.',
          'Ten times, slowly.',
        ],
        'Small movement. Nobody should be able to see you doing it from across the room.'),
    ],
  },

  {
    key: 'sen-legs',
    name: 'Gentle Legs',
    mins: 15,
    sub: 'Stairs, hills, and getting off the floor.',
    blurb: 'Leg strength is what stairs are made of. None of this bends a knee '
      + 'deeply and none of it is fast.',
    exercises: [
      m('Chair Squat', 'Legs', '2 rounds of 8',
        [
          'Sit near the front of a firm chair, feet flat.',
          'Lean your chest forward over your knees.',
          'Push through your heels and stand up.',
          'Sit down slowly, counting three.',
        ],
        'Slow on the way down is the half that matters. Do not drop into the chair.'),

      m('Butt Lift Bridge', 'Backside and lower back', '2 rounds of 10',
        [
          'Lie on your back, knees bent, feet flat and hip-width apart.',
          'Press through your heels and lift your hips a little way off the floor.',
          'Squeeze, hold for two, then lower slowly.',
          'Rest, then do the second round.',
        ],
        'Lift only as far as is comfortable. Height is not the point.'),

      m('Seated Hamstring Stretch', 'Backs of the legs', '30 seconds each leg',
        [
          'Sit on the front edge of a chair.',
          'Straighten one leg out with the heel on the floor and toes up.',
          'Sit tall and lean forward from the hips, not the back.',
          'Hold, then swap legs.',
        ],
        'Lean from the hip. Rounding the back moves the stretch to the wrong place.'),

      m('Calf Stretch at the Wall', 'Calves', '30 seconds each leg',
        [
          'Both hands on a wall, an arm’s length away.',
          'One foot back, heel pressed down.',
          'Bend the front knee until the back calf pulls gently.',
          'Hold, then swap.',
        ],
        'Keep the back heel down. If it lifts, bring the foot forward.'),

      m('Ankle Circles', 'Ankles', '10 each way, each foot',
        [
          'Sit down and lift one foot off the floor.',
          'Draw ten slow circles one way.',
          'Ten the other way, then swap feet.',
        ],
        'Good to do while the television is on.'),
    ],
  },

  {
    key: 'sen-back',
    name: 'Back & Shoulders',
    mins: 12,
    sub: 'For a back that has been in a chair all day.',
    blurb: 'Sitting shortens the front of you and tires the back of you. This '
      + 'is the other direction, done gently.',
    exercises: [
      m('Chair Lower Back Stretch', 'Lower back', '30 seconds',
        [
          'Sit on a chair with your feet flat and knees apart.',
          'Let yourself fold slowly forwards between your knees.',
          'Let your arms and head hang heavy.',
          'Come back up slowly, one bone at a time.',
        ],
        'Come up slowly. Standing up quickly from folded over makes people dizzy.'),

      m('Chair Upper Body Stretch', 'Chest and shoulders', '30 seconds',
        [
          'Sit tall away from the back of the chair.',
          'Take both arms behind you and hold the sides of the chair.',
          'Gently lift your chest and look straight ahead.',
          'Hold and breathe.',
        ],
        'Chest lifts, chin stays level. Do not tip your head back.'),

      m('Arm Circles', 'Shoulders', '10 each way',
        [
          'Sit or stand tall with your arms out to the sides.',
          'Ten small circles forwards.',
          'Ten small circles backwards.',
        ],
        'Small and slow beats big and fast, every time.'),

      m('Cat Cow', 'Whole back', '8 slow rounds',
        [
          'On hands and knees, or sitting in a chair if the floor is difficult.',
          'Breathe out, round the back up.',
          'Breathe in, let it sag gently.',
          'Eight slow rounds.',
        ],
        'Let the breath set the pace, not the other way round.'),

      m('Hug Knees To Chest', 'Lower back', '30 seconds',
        [
          'Lie on your back.',
          'Bring both knees up and hold them with your arms.',
          'Let your lower back settle into the floor.',
          'Hold and breathe out slowly.',
        ],
        'One knee at a time if both together is too much.'),
    ],
  },
];

export function seniorSessionByKey(key) {
  return SENIOR_SESSIONS.find((s) => s.key === key) || null;
}

/* Said once, on the menu screen, and it is not boilerplate.

   The most likely harm this app can do to somebody in their
   seventies is talk them past a symptom that mattered. So it names
   the symptoms. */
export const SENIOR_NOTE =
  'Move at your own pace and stop if anything hurts. Chest pain, dizziness, '
  + 'sudden shortness of breath or a joint that gives way are reasons to stop '
  + 'and speak to a doctor — not reasons to push on. If you are recovering '
  + 'from surgery, or a fall, or you have been told to be careful with a joint, '
  + 'ask your doctor which of these are for you before you start.';
