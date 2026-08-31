/* ---------------------------------------------------------------
   Exercise photographs.

   Two per exercise — the start of the movement and the end. The
   app alternates them, which is a truer demonstration than any
   drawing and costs nothing to play.

   From free-exercise-db, which is public domain. Regenerate with
   brand/match-exercises.mjs then brand/fetch-exercise-photos.mjs.
   This file is written by that second script — do not hand-edit.
   --------------------------------------------------------------- */
export const EXERCISE_FRAMES = {
  "Barbell Bench Press": [require('../assets/exercises/barbell-bench-press-0.jpg'), require('../assets/exercises/barbell-bench-press-1.jpg')],
  "Incline Dumbbell Press": [require('../assets/exercises/incline-dumbbell-press-0.jpg'), require('../assets/exercises/incline-dumbbell-press-1.jpg')],
  "Flat Dumbbell Press": [require('../assets/exercises/flat-dumbbell-press-0.jpg'), require('../assets/exercises/flat-dumbbell-press-1.jpg')],
  "Machine Chest Press": [require('../assets/exercises/machine-chest-press-0.jpg'), require('../assets/exercises/machine-chest-press-1.jpg')],
  "Push-up": [require('../assets/exercises/push-up-0.jpg'), require('../assets/exercises/push-up-1.jpg')],
  "Dips (chest lean)": [require('../assets/exercises/dips-chest-lean-0.jpg'), require('../assets/exercises/dips-chest-lean-1.jpg')],
  "Cable Fly": [require('../assets/exercises/cable-fly-0.jpg'), require('../assets/exercises/cable-fly-1.jpg')],
  "Dumbbell Fly": [require('../assets/exercises/dumbbell-fly-0.jpg'), require('../assets/exercises/dumbbell-fly-1.jpg')],
  "Pec Deck": [require('../assets/exercises/pec-deck-0.jpg'), require('../assets/exercises/pec-deck-1.jpg')],
  "Deadlift": [require('../assets/exercises/deadlift-0.jpg'), require('../assets/exercises/deadlift-1.jpg')],
  "Pull-up": [require('../assets/exercises/pull-up-0.jpg'), require('../assets/exercises/pull-up-1.jpg')],
  "Lat Pulldown": [require('../assets/exercises/lat-pulldown-0.jpg'), require('../assets/exercises/lat-pulldown-1.jpg')],
  "Barbell Row": [require('../assets/exercises/barbell-row-0.jpg'), require('../assets/exercises/barbell-row-1.jpg')],
  "Chest-Supported Row": [require('../assets/exercises/chest-supported-row-0.jpg'), require('../assets/exercises/chest-supported-row-1.jpg')],
  "Single-Arm Dumbbell Row": [require('../assets/exercises/single-arm-dumbbell-row-0.jpg'), require('../assets/exercises/single-arm-dumbbell-row-1.jpg')],
  "Seated Cable Row": [require('../assets/exercises/seated-cable-row-0.jpg'), require('../assets/exercises/seated-cable-row-1.jpg')],
  "Straight-Arm Pulldown": [require('../assets/exercises/straight-arm-pulldown-0.jpg'), require('../assets/exercises/straight-arm-pulldown-1.jpg')],
  "Face Pull": [require('../assets/exercises/face-pull-0.jpg'), require('../assets/exercises/face-pull-1.jpg')],
  "Inverted Row": [require('../assets/exercises/inverted-row-0.jpg'), require('../assets/exercises/inverted-row-1.jpg')],
  "Overhead Press": [require('../assets/exercises/overhead-press-0.jpg'), require('../assets/exercises/overhead-press-1.jpg')],
  "Seated Dumbbell Press": [require('../assets/exercises/seated-dumbbell-press-0.jpg'), require('../assets/exercises/seated-dumbbell-press-1.jpg')],
  "Arnold Press": [require('../assets/exercises/arnold-press-0.jpg'), require('../assets/exercises/arnold-press-1.jpg')],
  "Machine Shoulder Press": [require('../assets/exercises/machine-shoulder-press-0.jpg'), require('../assets/exercises/machine-shoulder-press-1.jpg')],
  "Lateral Raise": [require('../assets/exercises/lateral-raise-0.jpg'), require('../assets/exercises/lateral-raise-1.jpg')],
  "Cable Lateral Raise": [require('../assets/exercises/cable-lateral-raise-0.jpg'), require('../assets/exercises/cable-lateral-raise-1.jpg')],
  "Rear Delt Fly": [require('../assets/exercises/rear-delt-fly-0.jpg'), require('../assets/exercises/rear-delt-fly-1.jpg')],
  "Pike Push-up": [require('../assets/exercises/pike-push-up-0.jpg'), require('../assets/exercises/pike-push-up-1.jpg')],
  "Barbell Curl": [require('../assets/exercises/barbell-curl-0.jpg'), require('../assets/exercises/barbell-curl-1.jpg')],
  "Dumbbell Curl": [require('../assets/exercises/dumbbell-curl-0.jpg'), require('../assets/exercises/dumbbell-curl-1.jpg')],
  "Hammer Curl": [require('../assets/exercises/hammer-curl-0.jpg'), require('../assets/exercises/hammer-curl-1.jpg')],
  "Incline Dumbbell Curl": [require('../assets/exercises/incline-dumbbell-curl-0.jpg'), require('../assets/exercises/incline-dumbbell-curl-1.jpg')],
  "Cable Curl": [require('../assets/exercises/cable-curl-0.jpg'), require('../assets/exercises/cable-curl-1.jpg')],
  "Chin-up": [require('../assets/exercises/chin-up-0.jpg'), require('../assets/exercises/chin-up-1.jpg')],
  "Close-Grip Bench Press": [require('../assets/exercises/close-grip-bench-press-0.jpg'), require('../assets/exercises/close-grip-bench-press-1.jpg')],
  "Triceps Rope Pushdown": [require('../assets/exercises/triceps-rope-pushdown-0.jpg'), require('../assets/exercises/triceps-rope-pushdown-1.jpg')],
  "Overhead Cable Extension": [require('../assets/exercises/overhead-cable-extension-0.jpg'), require('../assets/exercises/overhead-cable-extension-1.jpg')],
  "Skull Crusher": [require('../assets/exercises/skull-crusher-0.jpg'), require('../assets/exercises/skull-crusher-1.jpg')],
  "Dumbbell Kickback": [require('../assets/exercises/dumbbell-kickback-0.jpg'), require('../assets/exercises/dumbbell-kickback-1.jpg')],
  "Bench Dip": [require('../assets/exercises/bench-dip-0.jpg'), require('../assets/exercises/bench-dip-1.jpg')],
  "Back Squat": [require('../assets/exercises/back-squat-0.jpg'), require('../assets/exercises/back-squat-1.jpg')],
  "Front Squat": [require('../assets/exercises/front-squat-0.jpg'), require('../assets/exercises/front-squat-1.jpg')],
  "Leg Press": [require('../assets/exercises/leg-press-0.jpg'), require('../assets/exercises/leg-press-1.jpg')],
  "Goblet Squat": [require('../assets/exercises/goblet-squat-0.jpg'), require('../assets/exercises/goblet-squat-1.jpg')],
  "Bulgarian Split Squat": [require('../assets/exercises/bulgarian-split-squat-0.jpg'), require('../assets/exercises/bulgarian-split-squat-1.jpg')],
  "Walking Lunge": [require('../assets/exercises/walking-lunge-0.jpg'), require('../assets/exercises/walking-lunge-1.jpg')],
  "Leg Extension": [require('../assets/exercises/leg-extension-0.jpg'), require('../assets/exercises/leg-extension-1.jpg')],
  "Bodyweight Squat": [require('../assets/exercises/bodyweight-squat-0.jpg'), require('../assets/exercises/bodyweight-squat-1.jpg')],
  "Romanian Deadlift": [require('../assets/exercises/romanian-deadlift-0.jpg'), require('../assets/exercises/romanian-deadlift-1.jpg')],
  "Dumbbell RDL": [require('../assets/exercises/dumbbell-rdl-0.jpg'), require('../assets/exercises/dumbbell-rdl-1.jpg')],
  "Lying Leg Curl": [require('../assets/exercises/lying-leg-curl-0.jpg'), require('../assets/exercises/lying-leg-curl-1.jpg')],
  "Seated Leg Curl": [require('../assets/exercises/seated-leg-curl-0.jpg'), require('../assets/exercises/seated-leg-curl-1.jpg')],
  "Good Morning": [require('../assets/exercises/good-morning-0.jpg'), require('../assets/exercises/good-morning-1.jpg')],
  "Nordic Curl": [require('../assets/exercises/nordic-curl-0.jpg'), require('../assets/exercises/nordic-curl-1.jpg')],
  "Hip Thrust": [require('../assets/exercises/hip-thrust-0.jpg'), require('../assets/exercises/hip-thrust-1.jpg')],
  "Glute Bridge": [require('../assets/exercises/glute-bridge-0.jpg'), require('../assets/exercises/glute-bridge-1.jpg')],
  "Cable Kickback": [require('../assets/exercises/cable-kickback-0.jpg'), require('../assets/exercises/cable-kickback-1.jpg')],
  "Sumo Deadlift": [require('../assets/exercises/sumo-deadlift-0.jpg'), require('../assets/exercises/sumo-deadlift-1.jpg')],
  "Step-up": [require('../assets/exercises/step-up-0.jpg'), require('../assets/exercises/step-up-1.jpg')],
  "Standing Calf Raise": [require('../assets/exercises/standing-calf-raise-0.jpg'), require('../assets/exercises/standing-calf-raise-1.jpg')],
  "Seated Calf Raise": [require('../assets/exercises/seated-calf-raise-0.jpg'), require('../assets/exercises/seated-calf-raise-1.jpg')],
  "Dumbbell Calf Raise": [require('../assets/exercises/dumbbell-calf-raise-0.jpg'), require('../assets/exercises/dumbbell-calf-raise-1.jpg')],
  "Hanging Knee Raise": [require('../assets/exercises/hanging-knee-raise-0.jpg'), require('../assets/exercises/hanging-knee-raise-1.jpg')],
  "Plank": [require('../assets/exercises/plank-0.jpg'), require('../assets/exercises/plank-1.jpg')],
  "Cable Crunch": [require('../assets/exercises/cable-crunch-0.jpg'), require('../assets/exercises/cable-crunch-1.jpg')],
  "Dead Bug": [require('../assets/exercises/dead-bug-0.jpg'), require('../assets/exercises/dead-bug-1.jpg')],
  "Russian Twist": [require('../assets/exercises/russian-twist-0.jpg'), require('../assets/exercises/russian-twist-1.jpg')],
  "Ab Wheel Rollout": [require('../assets/exercises/ab-wheel-rollout-0.jpg'), require('../assets/exercises/ab-wheel-rollout-1.jpg')],
  "Side Plank": [require('../assets/exercises/side-plank-0.jpg'), require('../assets/exercises/side-plank-1.jpg')],
};

export function framesFor(exercise) {
  const n = exercise && (exercise.n || exercise.name);
  return EXERCISE_FRAMES[n] || null;
}
