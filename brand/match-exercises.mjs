#!/usr/bin/env node
/* Matches the app's exercise list against free-exercise-db and prints
   the pairing so it can be eyeballed before anything is downloaded.
   The database is public domain (Unlicense) and every exercise carries
   two photographs: the start of the movement and the end. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EX } from '../src/exercises.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const db = JSON.parse(fs.readFileSync('/tmp/e.json', 'utf8'));

const norm = (s) => String(s).toLowerCase()
  .replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

/* A few the plain words never get to, because the database names them
   differently from the way anybody says them out loud.

   Anything absent from here on purpose is listed in NO_PHOTO below:
   the database has no honest picture of it, and the app falls back to
   a photograph of the muscle rather than showing a different exercise
   and calling it this one.

   Every key must appear once. A duplicate key silently wins, which is
   how Pike Push-up came to show a handstand and Dumbbell RDL a
   barbell — both of them for weeks. */
export const NO_PHOTO = [
  'Wall Sit',            // the database has squats, none of them static
  'Calf Raise',          // every calf photo in it is on a machine
  'Pike Push-up',        // the near-matches are all handstands
  'Wall Push-up',        // nothing in it is done against a wall
  'Knee Push-up',        // every press-up in it is on the toes
];

const ALIAS = {
  'Split Squat': 'Split Squats',
  /* ---- the seniors side ---- */
  'Ankle Circles': 'Ankle Circles',
  'Side Leg Raises': 'Side Leg Raises',
  'Calf Stretch at the Wall': 'Calf Stretch Hands Against Wall',
  'Knee Circles': 'Knee Circles',
  'Arm Circles': 'Arm Circles',
  'Side Neck Stretch': 'Side Neck Stretch',
  'Chair Upper Body Stretch': 'Chair Upper Body Stretch',
  'Hug Knees To Chest': 'Hug Knees To Chest',

  /* ---- home work with a band, and the floor moves that replaced the
     pull-ups when 'no equipment' was made to mean it. These were
     fetched by hand once and never written down here, which meant the
     pipeline could not rebuild them. ---- */
  'Floor Back Extension': 'Hyperextensions With No Hyperextension Bench',
  'Band Pull Apart': 'Band Pull Apart',
  'Banded Rear Fly': 'Back Flyes - With Bands',
  'Banded Upright Row': 'Upright Row - With Bands',
  'Self-Resisted Curl': 'Seated Biceps',
  'Banded Shoulder Press': 'Shoulder Press - With Bands',
  'Banded Lateral Raise': 'Lateral Raise - With Bands',
  'Banded Chest Fly': 'Cross Over - With Bands',
  'Banded Triceps Extension': 'Speed Band Overhead Triceps',
  'Banded Squat': 'Squats - With Bands',
  'Banded Good Morning': 'Band Good Morning',
  'Monster Walk': 'Monster Walk',
  'Glute Kickback': 'Glute Kickback',
  'Walking Lunge': 'Dumbbell Lunges',
  'Dumbbell RDL': 'Stiff-Legged Dumbbell Deadlift',
  'Bulgarian Split Squat': 'Split Squat with Dumbbells',
  'Barbell Bench Press': 'Barbell Bench Press - Medium Grip',
  'Flat Dumbbell Press': 'Dumbbell Bench Press',
  'Machine Chest Press': 'Leverage Chest Press',
  'Dips (chest lean)': 'Dips - Chest Version',
  'Pull-up': 'Pullups',
  'Chin-up': 'Chin-Up',
  'Barbell Row': 'Bent Over Barbell Row',
  'Chest-Supported Row': 'Leverage Iso Row',
  'Single-Arm Dumbbell Row': 'One-Arm Dumbbell Row',
  'Seated Cable Row': 'Seated Cable Rows',
  'Straight-Arm Pulldown': 'Straight-Arm Pulldown',
  'Overhead Press': 'Standing Military Press',
  'Seated Dumbbell Press': 'Seated Dumbbell Press',
  'Machine Shoulder Press': 'Leverage Shoulder Press',
  'Lateral Raise': 'Side Lateral Raise',
  'Rear Delt Fly': 'Reverse Flyes',
  'Barbell Curl': 'Barbell Curl',
  'Dumbbell Curl': 'Dumbbell Bicep Curl',
  'Cable Curl': 'Standing Biceps Cable Curl',
  'Triceps Rope Pushdown': 'Triceps Pushdown - Rope Attachment',
  'Overhead Cable Extension': 'Cable Rope Overhead Triceps Extension',
  'Skull Crusher': 'EZ-Bar Skullcrusher',
  'Dumbbell Kickback': 'Tricep Dumbbell Kickback',
  'Bench Dip': 'Bench Dips',
  'Back Squat': 'Barbell Squat',
  'Goblet Squat': 'Dumbbell Squat',
  'Bodyweight Squat': 'Bodyweight Squat',
  'Romanian Deadlift': 'Romanian Deadlift',
  'Lying Leg Curl': 'Lying Leg Curls',
  'Seated Leg Curl': 'Seated Leg Curl',
  'Nordic Curl': 'Natural Glute Ham Raise',
  'Hip Thrust': 'Barbell Hip Thrust',
  'Step-up': 'Dumbbell Step Ups',
  'Standing Calf Raise': 'Standing Calf Raises',
  'Seated Calf Raise': 'Seated Calf Raise',
  'Dumbbell Calf Raise': 'Standing Dumbbell Calf Raise',
  'Hanging Knee Raise': 'Hanging Leg Raise',
  'Cable Crunch': 'Cable Crunch',
  'Russian Twist': 'Russian Twist',
  'Ab Wheel Rollout': 'Ab Roller',
  'Side Plank': 'Side Bridge',
  'Push-up': 'Pushups',
  'Inverted Row': 'Inverted Row',
  'Face Pull': 'Face Pull',
  'Cable Fly': 'Cable Crossover',
  'Dumbbell Fly': 'Dumbbell Flyes',
  'Pec Deck': 'Butterfly',
  'Incline Dumbbell Press': 'Incline Dumbbell Press',
  'Incline Dumbbell Curl': 'Incline Dumbbell Curl',
  'Hammer Curl': 'Hammer Curls',
  'Close-Grip Bench Press': 'Close-Grip Barbell Bench Press',
  'Front Squat': 'Front Barbell Squat',
  'Leg Press': 'Leg Press',
  'Leg Extension': 'Leg Extensions',
  'Good Morning': 'Good Morning',
  'Sumo Deadlift': 'Sumo Deadlift',
  'Glute Bridge': 'Butt Lift (Bridge)',
  'Dead Bug': 'Bent-Knee Hip Raise',
  'Plank': 'Plank',
  'Deadlift': 'Barbell Deadlift',
  'Lat Pulldown': 'Wide-Grip Lat Pulldown',
  'Arnold Press': 'Arnold Dumbbell Press',
  'Cable Lateral Raise': 'Cable Seated Lateral Raise',

  /* the bodyweight additions */
  'Wide Push-up': 'Push-Up Wide',
  'Incline Push-up': 'Incline Push-Up',
  'Decline Push-up': 'Push-Ups With Feet Elevated',
  'Plyo Push-up': 'Plyo Push-up',
  'Superman': 'Superman',
  'Wide-Grip Pull-up': 'Wide-Grip Rear Pull-Up',
  'Handstand Push-up': 'Handstand Push-Ups',
  'Seated Front Raise': 'Seated Front Deltoid',
  'Close-Grip Push-up': 'Push-Ups - Close Triceps Position',
  'Triceps Dip': 'Dips - Triceps Version',
  'Jump Squat': 'Freehand Jump Squat',
  'Reverse Lunge': 'Bodyweight Walking Lunge',
  /* no wall sit in the database; the isometric squat is the same hold */
  'Single-Leg Glute Bridge': 'Single Leg Glute Bridge',
  'Flutter Kicks': 'Flutter Kicks',
  'Inchworm': 'Inchworm',
  'Front Leg Raise': 'Front Leg Raises',
  'Air Bike': 'Air Bike',
  'Cross-Body Crunch': 'Cross-Body Crunch',
  'Mountain Climber': 'Mountain Climbers',
  'Butt-Ups': 'Butt-Ups',
  /* ---- the women's side, and the period-pain sessions ---- */
  'Barbell Glute Bridge': 'Barbell Glute Bridge',
  'Butt Lift Bridge': 'Butt Lift (Bridge)',
  'Banded Hip Extension': 'Hip Extension with Bands',
  'Banded Hip Lift': 'Hip Lift with Band',
  'Cable Glute Kickback': 'One-Legged Cable Kickback',
  'Rear Leg Raise': 'Rear Leg Raises',
  'Lying Leg Lift': 'Leg Lift',
  'Kneeling Squat': 'Kneeling Squat',
  'Sumo Squat': 'Plie Dumbbell Squat',
  'Inner Thigh Machine': 'Thigh Adductor',
  'Outer Thigh Machine': 'Thigh Abductor',
  'Cable Hip Adduction': 'Cable Hip Adduction',
  'Banded Hip Adduction': 'Band Hip Adductions',
  'Side Split Squat': 'Barbell Side Split Squat',
  'Prone Hip Circles': 'Hip Circles (prone)',
  'Standing Hip Circles': 'Standing Hip Circles',
  'Groiners': 'Groiners',
  'Calf Press': 'Calf Press On The Leg Press Machine',
  'Donkey Calf Raise': 'Donkey Calf Raises',
  'Single-Leg Calf Raise': 'Dumbbell Seated One-Leg Calf Raise',
  'Banded Calf Raise': 'Calf Raises - With Bands',
  'Chair Squat': 'Chair Squat',
  'Dumbbell Reverse Lunge': 'Dumbbell Rear Lunge',
  'Bodyweight Walking Lunge': 'Bodyweight Walking Lunge',
  'Banded Hamstring Curl': 'Seated Band Hamstring Curl',
  'Floor Glute-Ham Raise': 'Floor Glute-Ham Raise',
  'Scissor Kick': 'Scissor Kick',
  'Bent-Knee Hip Raise': 'Bent-Knee Hip Raise',
  'Leg Pull-In': 'Leg Pull-In',

  /* the period-pain sessions */
  'Child’s Pose': "Child's Pose",
  'Cat Cow': 'Cat Stretch',
  'Pelvic Tilt Into Bridge': 'Pelvic Tilt Into Bridge',
  'Standing Pelvic Tilt': 'Standing Pelvic Tilt',
  'One Knee To Chest': 'One Knee To Chest',
  'Reclined Butterfly': 'Lying Bent Leg Groin',
  'Side Lying Groin Stretch': 'Side Lying Groin Stretch',
  'Groin and Back Stretch': 'Groin and Back Stretch',
  'Seated Glute Stretch': 'Seated Glute',
  'Lying Glute Stretch': 'Lying Glute',
  'Supine Spinal Twist': "Dancer's Stretch",
  'Spinal Stretch': 'Spinal Stretch',
  'Lower Back Curl': 'Lower Back Curl',
  'Side-Lying Floor Stretch': 'Side-Lying Floor Stretch',
  'Seated Hamstring Stretch': 'Seated Floor Hamstring Stretch',
  'Leg-Up Hamstring Stretch': 'Leg-Up Hamstring Stretch',
  'Standing Side Stretch': 'Standing Lateral Stretch',
  'Overhead Stretch': 'Overhead Stretch',
  'Kneeling Hip Flexor Stretch': 'Kneeling Hip Flexor',
  'Middle Back Stretch': 'Middle Back Stretch',
  'Upper Back Stretch': 'Upper Back Stretch',
  'Chair Lower Back Stretch': 'Chair Lower Back Stretch',
  'Quad Stretch': 'Quad Stretch',
};

const byName = new Map(db.map((d) => [norm(d.name), d]));

const out = {};
const missing = [];
for (const x of EX) {
  const wanted = ALIAS[x.n] || x.n;
  let hit = byName.get(norm(wanted));
  if (!hit) {
    // fall back to the closest name that contains every word
    const words = norm(x.n).split(' ').filter((w) => w.length > 2);
    hit = db.find((d) => words.every((w) => norm(d.name).includes(w)));
  }
  if (hit && hit.images && hit.images.length) out[x.n] = hit.images;
  else missing.push(x.n);
}

console.log(`matched ${Object.keys(out).length} of ${EX.length}`);
if (missing.length) console.log('no photo for:', missing.join(', '));
fs.writeFileSync(path.join(ROOT, 'brand', 'exercise-photos.json'), JSON.stringify(out, null, 1));
