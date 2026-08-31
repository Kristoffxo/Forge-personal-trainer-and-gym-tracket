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
   differently from the way anybody says them out loud. */
const ALIAS = {
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
  'Pike Push-up': 'Pushups - Close Triceps Position',
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
  'Bulgarian Split Squat': 'Bulgarian Squat',
  'Walking Lunge': 'Dumbbell Walking Lunge',
  'Bodyweight Squat': 'Bodyweight Squat',
  'Romanian Deadlift': 'Romanian Deadlift',
  'Dumbbell RDL': 'Romanian Deadlift With Dumbbells',
  'Lying Leg Curl': 'Lying Leg Curls',
  'Seated Leg Curl': 'Seated Leg Curl',
  'Nordic Curl': 'Natural Glute Ham Raise',
  'Hip Thrust': 'Barbell Hip Thrust',
  'Cable Kickback': 'Glute Kickback',
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
  'Pike Push-up': 'Handstand Push-Ups',
  'Bulgarian Split Squat': 'Smith Single-Leg Split Squat',
  'Dumbbell RDL': 'Romanian Deadlift',

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
  'Wall Sit': 'Bodyweight Squat',
  'Single-Leg Glute Bridge': 'Single Leg Glute Bridge',
  'Flutter Kicks': 'Flutter Kicks',
  'Inchworm': 'Inchworm',
  'Front Leg Raise': 'Front Leg Raises',
  'Calf Raise': 'Calf Press',
  'Air Bike': 'Air Bike',
  'Cross-Body Crunch': 'Cross-Body Crunch',
  'Mountain Climber': 'Mountain Climbers',
  'Butt-Ups': 'Butt-Ups',
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
