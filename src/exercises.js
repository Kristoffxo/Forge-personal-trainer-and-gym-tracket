/* ============================================================
   Exercise library, grouped by muscle.
     t: 'c' compound (moves most weight, goes first)
        'i' isolation (finishes the muscle off)
     e: kit needed — used to filter a home/gym plan
   ============================================================ */
export const EX = [
  /* ---- Chest ---- */
  { n:'Barbell Bench Press',        m:'Chest', t:'c', e:'Barbell',  s:'4 × 6–8' },
  { n:'Incline Dumbbell Press',     m:'Chest', t:'c', e:'Dumbbell', s:'4 × 8–10' },
  { n:'Flat Dumbbell Press',        m:'Chest', t:'c', e:'Dumbbell', s:'4 × 8–10' },
  { n:'Machine Chest Press',        m:'Chest', t:'c', e:'Machine',  s:'3 × 10–12' },
  { n:'Push-up',                    m:'Chest', t:'c', e:'None',     s:'4 × max' },
  { n:'Dips (chest lean)',          m:'Chest', t:'c', e:'None',     s:'3 × 8–12' },
  { n:'Cable Fly',                  m:'Chest', t:'i', e:'Cable',    s:'3 × 12–15' },
  { n:'Dumbbell Fly',               m:'Chest', t:'i', e:'Dumbbell', s:'3 × 12–15' },
  { n:'Pec Deck',                   m:'Chest', t:'i', e:'Machine',  s:'3 × 12–15' },

  /* ---- Back ---- */
  { n:'Deadlift',                   m:'Back', t:'c', e:'Barbell',  s:'4 × 5' },
  { n:'Pull-up',                    m:'Back', t:'c', e:'None',     s:'4 × 6–10' },
  { n:'Lat Pulldown',               m:'Back', t:'c', e:'Machine',  s:'4 × 8–12' },
  { n:'Barbell Row',                m:'Back', t:'c', e:'Barbell',  s:'4 × 8–10' },
  { n:'Chest-Supported Row',        m:'Back', t:'c', e:'Machine',  s:'3 × 10–12' },
  { n:'Single-Arm Dumbbell Row',    m:'Back', t:'c', e:'Dumbbell', s:'3 × 10 each' },
  { n:'Seated Cable Row',           m:'Back', t:'c', e:'Cable',    s:'3 × 10–12' },
  { n:'Straight-Arm Pulldown',      m:'Back', t:'i', e:'Cable',    s:'3 × 12–15' },
  { n:'Face Pull',                  m:'Back', t:'i', e:'Cable',    s:'3 × 15' },
  { n:'Inverted Row',               m:'Back', t:'c', e:'None',     s:'4 × 10–12' },

  /* ---- Shoulders ---- */
  { n:'Overhead Press',             m:'Shoulders', t:'c', e:'Barbell',  s:'4 × 6–8' },
  { n:'Seated Dumbbell Press',      m:'Shoulders', t:'c', e:'Dumbbell', s:'4 × 8–10' },
  { n:'Arnold Press',               m:'Shoulders', t:'c', e:'Dumbbell', s:'3 × 10' },
  { n:'Machine Shoulder Press',     m:'Shoulders', t:'c', e:'Machine',  s:'3 × 10–12' },
  { n:'Lateral Raise',              m:'Shoulders', t:'i', e:'Dumbbell', s:'4 × 12–15' },
  { n:'Cable Lateral Raise',        m:'Shoulders', t:'i', e:'Cable',    s:'3 × 15' },
  { n:'Rear Delt Fly',              m:'Shoulders', t:'i', e:'Dumbbell', s:'3 × 15' },
  { n:'Pike Push-up',               m:'Shoulders', t:'c', e:'None',     s:'3 × 8–12' },

  /* ---- Biceps ---- */
  { n:'Barbell Curl',               m:'Biceps', t:'i', e:'Barbell',  s:'4 × 8–10' },
  { n:'Dumbbell Curl',              m:'Biceps', t:'i', e:'Dumbbell', s:'3 × 10–12' },
  { n:'Hammer Curl',                m:'Biceps', t:'i', e:'Dumbbell', s:'3 × 10–12' },
  { n:'Incline Dumbbell Curl',      m:'Biceps', t:'i', e:'Dumbbell', s:'3 × 12' },
  { n:'Cable Curl',                 m:'Biceps', t:'i', e:'Cable',    s:'3 × 12–15' },
  { n:'Chin-up',                    m:'Biceps', t:'c', e:'None',     s:'3 × 6–10' },

  /* ---- Triceps ---- */
  { n:'Close-Grip Bench Press',     m:'Triceps', t:'c', e:'Barbell',  s:'4 × 8' },
  { n:'Triceps Rope Pushdown',      m:'Triceps', t:'i', e:'Cable',    s:'4 × 12–15' },
  { n:'Overhead Cable Extension',   m:'Triceps', t:'i', e:'Cable',    s:'3 × 12' },
  { n:'Skull Crusher',              m:'Triceps', t:'i', e:'Barbell',  s:'3 × 10–12' },
  { n:'Dumbbell Kickback',          m:'Triceps', t:'i', e:'Dumbbell', s:'3 × 15' },
  { n:'Bench Dip',                  m:'Triceps', t:'c', e:'None',     s:'3 × 12–15' },

  /* ---- Quads ---- */
  { n:'Back Squat',                 m:'Quads', t:'c', e:'Barbell',  s:'4 × 6–8' },
  { n:'Front Squat',                m:'Quads', t:'c', e:'Barbell',  s:'4 × 6–8' },
  { n:'Leg Press',                  m:'Quads', t:'c', e:'Machine',  s:'4 × 10–12' },
  { n:'Goblet Squat',               m:'Quads', t:'c', e:'Dumbbell', s:'4 × 10' },
  { n:'Bulgarian Split Squat',      m:'Quads', t:'c', e:'Dumbbell', s:'3 × 10 each' },
  { n:'Walking Lunge',              m:'Quads', t:'c', e:'Dumbbell', s:'3 × 12 each' },
  { n:'Leg Extension',              m:'Quads', t:'i', e:'Machine',  s:'3 × 12–15' },
  { n:'Bodyweight Squat',           m:'Quads', t:'c', e:'None',     s:'4 × 20' },

  /* ---- Hamstrings ---- */
  { n:'Romanian Deadlift',          m:'Hamstrings', t:'c', e:'Barbell',  s:'4 × 8–10' },
  { n:'Dumbbell RDL',               m:'Hamstrings', t:'c', e:'Dumbbell', s:'3 × 10' },
  { n:'Lying Leg Curl',             m:'Hamstrings', t:'i', e:'Machine',  s:'3 × 12' },
  { n:'Seated Leg Curl',            m:'Hamstrings', t:'i', e:'Machine',  s:'3 × 12–15' },
  { n:'Good Morning',               m:'Hamstrings', t:'c', e:'Barbell',  s:'3 × 10' },
  { n:'Nordic Curl',                m:'Hamstrings', t:'i', e:'None',     s:'3 × 6' },

  /* ---- Glutes ---- */
  { n:'Hip Thrust',                 m:'Glutes', t:'c', e:'Barbell',  s:'4 × 8–10' },
  { n:'Glute Bridge',               m:'Glutes', t:'c', e:'None',     s:'3 × 15' },
  { n:'Cable Kickback',             m:'Glutes', t:'i', e:'Cable',    s:'3 × 15 each' },
  { n:'Sumo Deadlift',              m:'Glutes', t:'c', e:'Barbell',  s:'4 × 6–8' },
  { n:'Step-up',                    m:'Glutes', t:'c', e:'Dumbbell', s:'3 × 10 each' },

  /* ---- Calves ---- */
  { n:'Standing Calf Raise',        m:'Calves', t:'i', e:'Machine',  s:'4 × 12–15' },
  { n:'Seated Calf Raise',          m:'Calves', t:'i', e:'Machine',  s:'4 × 15' },
  { n:'Dumbbell Calf Raise',        m:'Calves', t:'i', e:'Dumbbell', s:'4 × 15–20' },

  /* ---- Core ---- */
  { n:'Hanging Knee Raise',         m:'Core', t:'c', e:'None',     s:'3 × 12' },
  { n:'Plank',                      m:'Core', t:'i', e:'None',     s:'3 × 45 s' },
  { n:'Cable Crunch',               m:'Core', t:'i', e:'Cable',    s:'3 × 15' },
  { n:'Dead Bug',                   m:'Core', t:'i', e:'None',     s:'3 × 10 each' },
  { n:'Russian Twist',              m:'Core', t:'i', e:'None',     s:'3 × 20' },
  { n:'Ab Wheel Rollout',           m:'Core', t:'c', e:'None',     s:'3 × 10' },
  { n:'Side Plank',                 m:'Core', t:'i', e:'None',     s:'3 × 30 s each' },

  /* ---- Bodyweight, so a home session is not a gym session with the
     barbells crossed out. There were only one or two of these per
     muscle before, which is why Home and Gym looked alike. Every one
     has a photograph in the library. ---- */
  { n:'Wide Push-up',               m:'Chest', t:'c', e:'None',     s:'4 × 10–15' },
  { n:'Incline Push-up',            m:'Chest', t:'c', e:'None',     s:'4 × 12–15' },
  { n:'Decline Push-up',            m:'Chest', t:'c', e:'None',     s:'3 × 10–12' },
  { n:'Plyo Push-up',               m:'Chest', t:'c', e:'None',     s:'3 × 6–8' },

  { n:'Superman',                   m:'Back', t:'i', e:'None',      s:'3 × 12–15' },
  { n:'Wide-Grip Pull-up',          m:'Back', t:'c', e:'None',      s:'4 × 6–10' },

  { n:'Handstand Push-up',          m:'Shoulders', t:'c', e:'None', s:'3 × 5–8' },
  { n:'Seated Front Raise',         m:'Shoulders', t:'i', e:'None', s:'3 × 15' },

  { n:'Close-Grip Push-up',         m:'Triceps', t:'c', e:'None',   s:'3 × 10–15' },
  { n:'Triceps Dip',                m:'Triceps', t:'c', e:'None',   s:'3 × 10–15' },

  { n:'Jump Squat',                 m:'Quads', t:'c', e:'None',     s:'3 × 12' },
  { n:'Reverse Lunge',              m:'Quads', t:'c', e:'None',     s:'3 × 12 each' },
  { n:'Wall Sit',                   m:'Quads', t:'i', e:'None',     s:'3 × 45 s' },

  { n:'Single-Leg Glute Bridge',    m:'Glutes', t:'c', e:'None',    s:'3 × 12 each' },
  { n:'Flutter Kicks',              m:'Glutes', t:'i', e:'None',    s:'3 × 30 s' },

  { n:'Inchworm',                   m:'Hamstrings', t:'c', e:'None', s:'3 × 8' },
  { n:'Front Leg Raise',            m:'Hamstrings', t:'i', e:'None', s:'3 × 12 each' },

  { n:'Calf Raise',                 m:'Calves', t:'i', e:'None',    s:'4 × 20' },

  { n:'Air Bike',                   m:'Core', t:'i', e:'None',      s:'3 × 20' },
  { n:'Cross-Body Crunch',          m:'Core', t:'i', e:'None',      s:'3 × 15 each' },
  { n:'Mountain Climber',           m:'Core', t:'c', e:'None',      s:'3 × 40 s' },
  { n:'Butt-Ups',                   m:'Core', t:'i', e:'None',      s:'3 × 15' },
];

export const MUSCLES = ['Chest','Back','Shoulders','Biceps','Triceps',
                        'Quads','Hamstrings','Glutes','Calves','Core'];

export function byMuscle(m, kitOnly) {
  let list = EX.filter((x) => x.m === m);
  if (kitOnly === 'None') list = list.filter((x) => x.e === 'None');
  return list;
}
