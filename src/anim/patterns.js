/* ---------------------------------------------------------------
   What each exercise looks like.

   There are seventy exercises in the library and nowhere near
   seventy different shapes of movement, so this file holds the
   shapes — about twenty — and maps every exercise onto one. A bench
   press and a machine chest press are the same picture; a barbell
   curl and a cable curl are the same picture. Where the picture
   really does differ, it gets its own entry.

   Angles are read by src/anim/figure.js. All of them are relative
   to the joint above, in degrees, and positive always means
   flexion — forward and up:

     torso   0 upright,       + leans forward
     arm     0 by your side,  + swings forward and up (90 = level,
                                180 = straight overhead)
     elbow   0 straight,      + brings the hand toward the shoulder
     thigh   0 straight down, + drives the knee forward
     knee    0 straight,      + folds the heel back
     hipX/Y  where the hips travel, in stage units, + Y is downward

   Each is [start, finish] — where the rep begins and where it ends.

   `cues` are the two or three things that actually matter. They are
   shown next to the animation, so they are written as instructions,
   not as prose.
   --------------------------------------------------------------- */

export const PATTERNS = {
  /* ---------------- squat family ---------------- */
  squat: {
    name: 'Squat',
    torso: [6, 32], arm: [42, 68], elbow: [98, 98],
    thigh: [2, 82], knee: [3, 88],
    hipY: [0, 40], hipX: [0, -7],
    implement: 'barbell', tempo: 2600, hold: 160,
    cues: [
      'Sit down between your hips, not backwards',
      'Knees track over your toes, never inward',
      'Chest up the whole way — depth before load',
    ],
  },
  squatBody: {
    name: 'Bodyweight squat',
    torso: [6, 28], arm: [4, 88], elbow: [6, 14],
    thigh: [2, 80], knee: [3, 86],
    hipY: [0, 38], hipX: [0, -6],
    implement: 'none', tempo: 2200,
    cues: [
      'Arms come up as you go down — it keeps you balanced',
      'Heels stay flat on the floor',
      'Three seconds down, one up, once it feels easy',
    ],
  },
  legPress: {
    name: 'Leg press',
    torso: [62, 62], arm: [40, 40], elbow: [70, 70],
    thigh: [70, 18], knee: [86, 12],
    hipY: [12, 12], hipX: [0, 0],
    implement: 'none', ground: false, tempo: 2400,
    cues: [
      'Bring the sled down until your knees reach 90°',
      'Do not let your lower back round off the pad',
      'Stop just short of locking the knees out',
    ],
  },

  /* ---------------- hinge family ---------------- */
  hinge: {
    name: 'Hip hinge',
    torso: [8, 74], arm: [8, 74], elbow: [3, 5],
    thigh: [2, 26], knee: [6, 22],
    hipY: [0, 6], hipX: [0, -12],
    implement: 'barbell', tempo: 2800, hold: 140,
    cues: [
      'Push your hips back — this is a hinge, not a squat',
      'Bar stays in contact with your legs the whole way',
      'Stand up by squeezing your glutes, not pulling with your back',
    ],
  },
  deadlift: {
    name: 'Deadlift',
    torso: [72, 8], arm: [72, 8], elbow: [4, 3],
    thigh: [58, 2], knee: [64, 4],
    hipY: [26, 0], hipX: [-8, 0],
    implement: 'barbell', tempo: 3000, hold: 200,
    cues: [
      'Take the slack out of the bar before you pull',
      'Hips and shoulders rise together',
      'Finish standing tall — do not lean back at the top',
    ],
  },
  hipThrust: {
    name: 'Hip thrust',
    torso: [-118, -96], arm: [-56, -56], elbow: [10, 10],
    thigh: [112, 92], knee: [92, 84],
    hipY: [58, 32], hipX: [0, 0], hipAt: 100, stageH: 170,
    implement: 'barbell', bench: true, benchX: 84, benchW: 92,
    tempo: 2200, hold: 300,
    cues: [
      'Squeeze at the top until your body makes a straight line',
      'Chin tucked, ribs down — do not arch your back',
      'Drive through your heels',
    ],
  },

  /* ---------------- horizontal press ---------------- */
  benchPress: {
    name: 'Bench press',
    torso: [-90, -90], arm: [62, 92], elbow: [98, 6],
    thigh: [74, 74], knee: [76, 76],
    hipY: [30, 30], hipX: [0, 0], hipAt: 88, stageH: 186,
    implement: 'barbell', bench: true, benchX: 38, benchW: 76,
    tempo: 2600, hold: 150,
    cues: [
      'Touch your chest, do not bounce off it',
      'Elbows about 45° from your body, not flared wide',
      'Shoulder blades pinched back and down throughout',
    ],
  },
  pushup: {
    name: 'Push-up',
    torso: [-92, -92], arm: [-88, -90], elbow: [78, 4],
    thigh: [86, 88], knee: [3, 2],
    hipY: [44, 22], hipX: [0, 0], hipAt: 92, stageH: 150,
    implement: 'none', ground: true,
    tempo: 2200,
    cues: [
      'Body stays one straight line from head to heels',
      'Lower until your chest is a fist off the floor',
      'Push the floor away rather than just bending your arms',
    ],
  },
  dip: {
    name: 'Dip',
    torso: [14, 18], arm: [-12, 26], elbow: [6, 92],
    thigh: [24, 24], knee: [56, 56],
    hipY: [0, 30], hipX: [0, 0],
    implement: 'none', ground: false, tempo: 2400,
    cues: [
      'Lean forward a little to bias the chest',
      'Go down until your upper arms are level with the floor',
      'Stop if you feel it pinch at the front of your shoulder',
    ],
  },
  fly: {
    name: 'Fly',
    torso: [-90, -90], arm: [56, 92], elbow: [26, 18],
    thigh: [74, 74], knee: [76, 76],
    hipY: [30, 30], hipX: [0, 0], hipAt: 88, stageH: 186,
    implement: 'dumbbell', bench: true, benchX: 38, benchW: 76,
    tempo: 2800,
    cues: [
      'Soft bend in the elbows, held the whole set',
      'Open until you feel a stretch across the chest, no further',
      'Think about hugging a barrel, not pressing',
    ],
  },

  /* ---------------- vertical press ---------------- */
  overheadPress: {
    name: 'Overhead press',
    torso: [3, 1], arm: [16, 172], elbow: [96, 6],
    thigh: [1, 1], knee: [2, 2],
    hipY: [0, 0], hipX: [0, 0],
    implement: 'barbell', tempo: 2400, hold: 150,
    cues: [
      'Squeeze your glutes so you do not arch backwards',
      'Move your head back out of the way, then push up',
      'Finish with the bar over the middle of your foot',
    ],
  },
  lateralRaise: {
    name: 'Lateral raise',
    torso: [4, 4], arm: [4, 92], elbow: [12, 16],
    thigh: [1, 1], knee: [2, 2],
    hipY: [0, 0], hipX: [0, 0],
    implement: 'dumbbell', tempo: 2600,
    cues: [
      'Lead with your elbows, not your hands',
      'Stop at shoulder height — higher brings the traps in',
      'Lower it slowly; that half is the whole exercise',
    ],
  },

  /* ---------------- vertical pull ---------------- */
  pulldown: {
    name: 'Pulldown',
    torso: [6, 14], arm: [168, 42], elbow: [8, 84],
    thigh: [72, 72], knee: [86, 86],
    hipY: [16, 16], hipX: [0, 0],
    implement: 'handle', ground: false, tempo: 2600, hold: 140,
    cues: [
      'Pull your elbows down toward your back pockets',
      'Bring the bar to your collarbone, in front of your head',
      'Let the weight stretch your lats at the top',
    ],
  },
  pullup: {
    name: 'Pull-up',
    torso: [2, 5], arm: [176, 128], elbow: [6, 100],
    thigh: [14, 20], knee: [26, 40],
    hipY: [0, -34], hipX: [0, 0],
    implement: 'none', ground: false, tempo: 2600, hold: 160,
    cues: [
      'Start from a dead hang, arms straight',
      'Pull until your chin clears the bar',
      'Lower under control — do not drop',
    ],
  },

  /* ---------------- horizontal pull ---------------- */
  row: {
    name: 'Bent-over row',
    torso: [66, 62], arm: [66, 88], elbow: [4, 96],
    thigh: [18, 18], knee: [22, 22],
    hipY: [8, 8], hipX: [-8, -8],
    implement: 'barbell', tempo: 2400, hold: 150,
    cues: [
      'Back flat and chest proud before you pull anything',
      'Pull to your belly button, not your chest',
      'Squeeze your shoulder blades together at the top',
    ],
  },
  seatedRow: {
    name: 'Seated row',
    torso: [22, 2], arm: [64, 14], elbow: [8, 92],
    thigh: [76, 76], knee: [82, 82],
    hipY: [18, 18], hipX: [0, 0],
    implement: 'handle', ground: false, tempo: 2400,
    cues: [
      'Sit tall — do not row with your lower back',
      'Elbows stay close to your sides',
      'Let your shoulder blades open at the front of the rep',
    ],
  },
  facePull: {
    name: 'Face pull',
    torso: [4, 4], arm: [88, 84], elbow: [12, 104],
    thigh: [2, 2], knee: [3, 3],
    hipY: [0, 0], hipX: [0, 0],
    implement: 'handle', tempo: 2400,
    cues: [
      'Pull the rope toward your eyebrows',
      'Finish with your knuckles pointing behind you',
      'Light weight. This one is for the small muscles',
    ],
  },

  /* ---------------- arms ---------------- */
  curl: {
    name: 'Curl',
    torso: [3, 3], arm: [2, 14], elbow: [6, 132],
    thigh: [1, 1], knee: [2, 2],
    hipY: [0, 0], hipX: [0, 0],
    implement: 'dumbbell', tempo: 2200,
    cues: [
      'Elbows pinned to your sides — they do not travel',
      'No swing. If your back moves, the weight is too heavy',
      'Lower it all the way down each rep',
    ],
  },
  pushdown: {
    name: 'Triceps extension',
    torso: [8, 6], arm: [10, 8], elbow: [96, 4],
    thigh: [2, 2], knee: [3, 3],
    hipY: [0, 0], hipX: [0, 0],
    implement: 'handle', tempo: 2200,
    cues: [
      'Upper arms stay still — only the forearms move',
      'Push all the way to straight and hold for a beat',
      'Keep your elbows tucked in, not flaring out',
    ],
  },
  overheadExtension: {
    name: 'Overhead extension',
    torso: [4, 4], arm: [170, 172], elbow: [116, 6],
    thigh: [1, 1], knee: [2, 2],
    hipY: [0, 0], hipX: [0, 0],
    implement: 'handle', tempo: 2400,
    cues: [
      'Elbows point forward and stay there',
      'Lower until you feel the stretch behind your arm',
      'Ribs down — do not let your back arch',
    ],
  },

  /* ---------------- legs, single and isolation ---------------- */
  lunge: {
    name: 'Lunge',
    torso: [5, 12], arm: [4, 6], elbow: [6, 8],
    thigh: [4, 62], knee: [4, 84],
    hipY: [0, 34], hipX: [0, 4],
    implement: 'dumbbell', tempo: 2600,
    cues: [
      'Drop straight down — the back knee goes to the floor',
      'Front shin stays close to vertical',
      'Push back up through the front heel',
    ],
  },
  legExtension: {
    name: 'Leg extension',
    torso: [8, 8], arm: [34, 34], elbow: [46, 46],
    thigh: [76, 76], knee: [84, 4],
    hipY: [18, 18], hipX: [0, 0],
    implement: 'none', ground: false, tempo: 2200, hold: 250,
    cues: [
      'Straighten fully and squeeze for a count',
      'Lower slowly — do not let the stack drop',
      'Keep your hips pressed into the seat',
    ],
  },
  legCurl: {
    name: 'Leg curl',
    torso: [14, 14], arm: [30, 30], elbow: [40, 40],
    thigh: [64, 64], knee: [8, 96],
    hipY: [16, 16], hipX: [0, 0],
    implement: 'none', ground: false, tempo: 2200,
    cues: [
      'Curl your heel toward your backside',
      'Hips stay down on the pad',
      'Slow on the way back — hamstrings hate the negative',
    ],
  },
  calfRaise: {
    name: 'Calf raise',
    torso: [2, 2], arm: [3, 3], elbow: [4, 4],
    thigh: [1, 1], knee: [3, 2],
    hipY: [0, -12], hipX: [0, 0],
    implement: 'dumbbell', tempo: 1800, hold: 260,
    cues: [
      'All the way up onto your toes, hold for a second',
      'All the way down until you feel the stretch',
      'Do not bounce — the bounce is your tendons, not your calves',
    ],
  },

  /* ---------------- core ---------------- */
  plank: {
    name: 'Plank',
    torso: [-92, -92], arm: [-88, -88], elbow: [86, 90],
    thigh: [87, 88], knee: [3, 2],
    hipY: [48, 50], hipX: [0, 0], hipAt: 92, stageH: 150,
    implement: 'none', ground: true, tempo: 3600,
    cues: [
      'Squeeze your glutes — that is what stops the sag',
      'Ribs pulled down, hips level with your shoulders',
      'Breathe. If you cannot talk, come down',
    ],
  },
  crunch: {
    name: 'Crunch',
    torso: [-92, -58], arm: [126, 130], elbow: [108, 108],
    thigh: [120, 120], knee: [100, 100],
    hipY: [70, 70], hipX: [0, 0], hipAt: 96, stageH: 148,
    implement: 'none', ground: true, tempo: 2000,
    cues: [
      'Curl your ribs toward your hips',
      'Do not pull on your neck',
      'Short range, slow, and squeeze at the top',
    ],
  },
  kneeRaise: {
    name: 'Hanging knee raise',
    torso: [2, 8], arm: [176, 176], elbow: [4, 6],
    thigh: [4, 96], knee: [6, 92],
    hipY: [0, 0], hipX: [0, 0],
    implement: 'none', ground: false, tempo: 2400,
    cues: [
      'Stop yourself swinging before the first rep',
      'Curl your hips up at the top — that is the ab part',
      'Lower slowly, all the way to a hang',
    ],
  },
  rollout: {
    name: 'Rollout',
    torso: [-30, -76], arm: [44, 98], elbow: [12, 6],
    thigh: [12, 12], knee: [96, 96],
    hipY: [26, 34], hipX: [0, -10], hipAt: 108, stageH: 166,
    implement: 'none', ground: true, tempo: 3000,
    cues: [
      'Go only as far as you can keep your back flat',
      'Ribs down and hips tucked the whole way out',
      'If your lower back arches, you have gone too far',
    ],
  },
  gluteBridge: {
    name: 'Glute bridge',
    torso: [-96, -74], arm: [-64, -64], elbow: [8, 8],
    thigh: [118, 96], knee: [98, 86],
    hipY: [70, 46], hipX: [0, 0], hipAt: 96, stageH: 150,
    implement: 'none', ground: true, tempo: 2000, hold: 280,
    cues: [
      'Squeeze at the top for a full second',
      'Push through your heels',
      'Do not arch — the movement is your hips, not your back',
    ],
  },
  carry: {
    name: 'Carry',
    torso: [3, 3], arm: [2, 3], elbow: [4, 5],
    thigh: [8, -8], knee: [14, 20],
    hipY: [0, -3], hipX: [0, 0],
    implement: 'dumbbell', tempo: 1200,
    cues: [
      'Stand tall — shoulders back, ribs down',
      'Small, steady steps',
      'Grip is the point. Put it down when the grip goes',
    ],
  },
  stretch: {
    name: 'Stretch',
    torso: [10, 52], arm: [10, 60], elbow: [8, 20],
    thigh: [6, 40], knee: [10, 30],
    hipY: [0, 10], hipX: [0, -6],
    implement: 'none', tempo: 4000, hold: 500,
    cues: [
      'Ease into it — never bounce',
      'Breathe out as you go deeper',
      'Mild tension, never pain',
    ],
  },
};

/* ---------------------------------------------------------------
   Exercise -> pattern.

   Keyed by the exact `n` in src/exercises.js. Anything not listed
   falls back to a guess from its name, then to the muscle it trains,
   so adding an exercise still shows something sensible rather than
   an empty box.
   --------------------------------------------------------------- */
const BY_NAME = {
  /* chest */
  'Barbell Bench Press': 'benchPress',
  'Incline Dumbbell Press': 'benchPress',
  'Flat Dumbbell Press': 'benchPress',
  'Machine Chest Press': 'benchPress',
  'Push-up': 'pushup',
  'Dips (chest lean)': 'dip',
  'Cable Fly': 'fly',
  'Dumbbell Fly': 'fly',
  'Pec Deck': 'fly',

  /* back */
  Deadlift: 'deadlift',
  'Pull-up': 'pullup',
  'Lat Pulldown': 'pulldown',
  'Barbell Row': 'row',
  'Chest-Supported Row': 'seatedRow',
  'Single-Arm Dumbbell Row': 'row',
  'Seated Cable Row': 'seatedRow',
  'Straight-Arm Pulldown': 'pulldown',
  'Face Pull': 'facePull',
  'Inverted Row': 'seatedRow',

  /* shoulders */
  'Overhead Press': 'overheadPress',
  'Seated Dumbbell Press': 'overheadPress',
  'Arnold Press': 'overheadPress',
  'Machine Shoulder Press': 'overheadPress',
  'Lateral Raise': 'lateralRaise',
  'Cable Lateral Raise': 'lateralRaise',
  'Rear Delt Fly': 'facePull',
  'Pike Push-up': 'pushup',

  /* biceps */
  'Barbell Curl': 'curl',
  'Dumbbell Curl': 'curl',
  'Hammer Curl': 'curl',
  'Incline Dumbbell Curl': 'curl',
  'Cable Curl': 'curl',
  'Chin-up': 'pullup',

  /* triceps */
  'Close-Grip Bench Press': 'benchPress',
  'Triceps Rope Pushdown': 'pushdown',
  'Overhead Cable Extension': 'overheadExtension',
  'Skull Crusher': 'overheadExtension',
  'Dumbbell Kickback': 'pushdown',
  'Bench Dip': 'dip',

  /* quads */
  'Back Squat': 'squat',
  'Front Squat': 'squat',
  'Leg Press': 'legPress',
  'Goblet Squat': 'squat',
  'Bulgarian Split Squat': 'lunge',
  'Walking Lunge': 'lunge',
  'Leg Extension': 'legExtension',
  'Bodyweight Squat': 'squatBody',

  /* hamstrings */
  'Romanian Deadlift': 'hinge',
  'Dumbbell RDL': 'hinge',
  'Lying Leg Curl': 'legCurl',
  'Seated Leg Curl': 'legCurl',
  'Good Morning': 'hinge',
  'Nordic Curl': 'legCurl',

  /* glutes */
  'Hip Thrust': 'hipThrust',
  'Glute Bridge': 'gluteBridge',
  'Cable Kickback': 'gluteBridge',
  'Sumo Deadlift': 'deadlift',
  'Step-up': 'lunge',

  /* calves */
  'Standing Calf Raise': 'calfRaise',
  'Seated Calf Raise': 'calfRaise',
  'Dumbbell Calf Raise': 'calfRaise',

  /* core */
  'Hanging Knee Raise': 'kneeRaise',
  Plank: 'plank',
  'Cable Crunch': 'crunch',
  'Dead Bug': 'crunch',
  'Russian Twist': 'crunch',
  'Ab Wheel Rollout': 'rollout',
  'Side Plank': 'plank',
};

/* Words that give a movement away, for anything added later. */
const BY_WORD = [
  [/\bdeadlift\b/i, 'deadlift'],
  [/\b(rdl|romanian|good morning|hinge)\b/i, 'hinge'],
  [/\bhip thrust\b/i, 'hipThrust'],
  [/\bbridge|kickback\b/i, 'gluteBridge'],
  [/\bsplit squat|lunge|step-?up\b/i, 'lunge'],
  [/\bsquat\b/i, 'squat'],
  [/\bleg press\b/i, 'legPress'],
  [/\bleg extension\b/i, 'legExtension'],
  [/\bleg curl|nordic\b/i, 'legCurl'],
  [/\bcalf\b/i, 'calfRaise'],
  [/\bpull-?up|chin-?up\b/i, 'pullup'],
  [/\bpulldown\b/i, 'pulldown'],
  [/\bface pull|rear delt\b/i, 'facePull'],
  [/\brow\b/i, 'row'],
  [/\bcurl\b/i, 'curl'],
  [/\bpushdown|kickback\b/i, 'pushdown'],
  [/\bskull|overhead (cable )?extension\b/i, 'overheadExtension'],
  [/\blateral raise\b/i, 'lateralRaise'],
  [/\boverhead press|shoulder press|arnold\b/i, 'overheadPress'],
  [/\bfly|pec deck\b/i, 'fly'],
  [/\bpush-?up\b/i, 'pushup'],
  [/\bdip\b/i, 'dip'],
  [/\bbench press|chest press\b/i, 'benchPress'],
  [/\bplank\b/i, 'plank'],
  [/\bknee raise|leg raise\b/i, 'kneeRaise'],
  [/\brollout\b/i, 'rollout'],
  [/\bcrunch|twist|dead bug\b/i, 'crunch'],
  [/\bcarry|farmer\b/i, 'carry'],
  [/\bstretch|mobility\b/i, 'stretch'],
];

/* Last resort: something that at least trains the right end of the body. */
const BY_MUSCLE = {
  Chest: 'benchPress', Back: 'row', Shoulders: 'overheadPress',
  Biceps: 'curl', Triceps: 'pushdown', Quads: 'squat',
  Hamstrings: 'hinge', Glutes: 'hipThrust', Calves: 'calfRaise',
  Core: 'plank',
};

export function patternFor(exercise) {
  if (!exercise) return PATTERNS.squat;
  const name = exercise.n || exercise.name || '';

  const exact = BY_NAME[name];
  if (exact && PATTERNS[exact]) return PATTERNS[exact];

  for (const [re, key] of BY_WORD) {
    if (re.test(name) && PATTERNS[key]) return PATTERNS[key];
  }

  const byMuscle = BY_MUSCLE[exercise.m || exercise.muscle];
  return PATTERNS[byMuscle] || PATTERNS.squat;
}

/* The form points shown beside the animation. */
export function cuesFor(exercise) {
  return patternFor(exercise).cues || [];
}
