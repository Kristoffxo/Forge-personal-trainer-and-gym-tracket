/* ============================================================
   Exercise library, grouped by muscle.
     t: 'c' compound (moves most weight, goes first)
        'i' isolation (finishes the muscle off)
     e: kit needed — used to filter a home/gym plan
     w: 1 if the women's side leads with it
     x: 1 if the women's side leaves it out

   `w` and `x` are preferences, not rules about who is allowed to
   lift what. A woman who wants to bench can pick Chest and find the
   bench there. They only decide what a session written *for* her
   opens with — glutes, thighs and calves before pressing — which is
   what the women's side is for.
   ============================================================ */
export const EX = [
  /* ---- Chest ---- */
  { n:'Barbell Bench Press',        m:'Chest', t:'c', e:'Barbell',  s:'4 × 6–8', x:1 },
  { n:'Incline Dumbbell Press',     m:'Chest', t:'c', e:'Dumbbell', s:'4 × 8–10' },
  { n:'Flat Dumbbell Press',        m:'Chest', t:'c', e:'Dumbbell', s:'4 × 8–10' },
  { n:'Machine Chest Press',        m:'Chest', t:'c', e:'Machine',  s:'3 × 10–12', w:1 },
  { n:'Push-up',                    m:'Chest', t:'c', e:'None',     s:'4 × max' },
  { n:'Dips (chest lean)',          m:'Chest', t:'c', e:'None',     s:'3 × 8–12', x:1 },
  { n:'Cable Fly',                  m:'Chest', t:'i', e:'Cable',    s:'3 × 12–15', w:1 },
  { n:'Dumbbell Fly',               m:'Chest', t:'i', e:'Dumbbell', s:'3 × 12–15' },
  { n:'Pec Deck',                   m:'Chest', t:'i', e:'Machine',  s:'3 × 12–15' },

  /* ---- Back ---- */
  { n:'Deadlift',                   m:'Back', t:'c', e:'Barbell',  s:'4 × 5', x:1 },
  { n:'Pull-up',                    m:'Back', t:'c', e:'None',     s:'4 × 6–10' },
  { n:'Lat Pulldown',               m:'Back', t:'c', e:'Machine',  s:'4 × 8–12', w:1 },
  { n:'Barbell Row',                m:'Back', t:'c', e:'Barbell',  s:'4 × 8–10' },
  { n:'Chest-Supported Row',        m:'Back', t:'c', e:'Machine',  s:'3 × 10–12' },
  { n:'Single-Arm Dumbbell Row',    m:'Back', t:'c', e:'Dumbbell', s:'3 × 10 each' },
  { n:'Seated Cable Row',           m:'Back', t:'c', e:'Cable',    s:'3 × 10–12', w:1 },
  { n:'Straight-Arm Pulldown',      m:'Back', t:'i', e:'Cable',    s:'3 × 12–15' },
  { n:'Face Pull',                  m:'Back', t:'i', e:'Cable',    s:'3 × 15', w:1 },
  { n:'Inverted Row',               m:'Back', t:'c', e:'None',     s:'4 × 10–12' },

  /* ---- Shoulders ---- */
  { n:'Overhead Press',             m:'Shoulders', t:'c', e:'Barbell',  s:'4 × 6–8' },
  { n:'Seated Dumbbell Press',      m:'Shoulders', t:'c', e:'Dumbbell', s:'4 × 8–10' },
  { n:'Arnold Press',               m:'Shoulders', t:'c', e:'Dumbbell', s:'3 × 10' },
  { n:'Machine Shoulder Press',     m:'Shoulders', t:'c', e:'Machine',  s:'3 × 10–12' },
  { n:'Lateral Raise',              m:'Shoulders', t:'i', e:'Dumbbell', s:'4 × 12–15', w:1 },
  { n:'Cable Lateral Raise',        m:'Shoulders', t:'i', e:'Cable',    s:'3 × 15' },
  { n:'Rear Delt Fly',              m:'Shoulders', t:'i', e:'Dumbbell', s:'3 × 15', w:1 },
  { n:'Pike Push-up',               m:'Shoulders', t:'c', e:'None',     s:'3 × 8–12' },

  /* ---- Biceps ---- */
  { n:'Barbell Curl',               m:'Biceps', t:'i', e:'Barbell',  s:'4 × 8–10' },
  { n:'Dumbbell Curl',              m:'Biceps', t:'i', e:'Dumbbell', s:'3 × 10–12' },
  { n:'Hammer Curl',                m:'Biceps', t:'i', e:'Dumbbell', s:'3 × 10–12', w:1 },
  { n:'Incline Dumbbell Curl',      m:'Biceps', t:'i', e:'Dumbbell', s:'3 × 12' },
  { n:'Cable Curl',                 m:'Biceps', t:'i', e:'Cable',    s:'3 × 12–15', w:1 },
  { n:'Chin-up',                    m:'Biceps', t:'c', e:'None',     s:'3 × 6–10' },

  /* ---- Triceps ---- */
  { n:'Close-Grip Bench Press',     m:'Triceps', t:'c', e:'Barbell',  s:'4 × 8', x:1 },
  { n:'Triceps Rope Pushdown',      m:'Triceps', t:'i', e:'Cable',    s:'4 × 12–15', w:1 },
  { n:'Overhead Cable Extension',   m:'Triceps', t:'i', e:'Cable',    s:'3 × 12' },
  { n:'Skull Crusher',              m:'Triceps', t:'i', e:'Barbell',  s:'3 × 10–12', x:1 },
  { n:'Dumbbell Kickback',          m:'Triceps', t:'i', e:'Dumbbell', s:'3 × 15', w:1 },
  { n:'Bench Dip',                  m:'Triceps', t:'c', e:'None',     s:'3 × 12–15' },

  /* ---- Quads ---- */
  { n:'Back Squat',                 m:'Quads', t:'c', e:'Barbell',  s:'4 × 6–8' },
  { n:'Front Squat',                m:'Quads', t:'c', e:'Barbell',  s:'4 × 6–8', x:1 },
  { n:'Leg Press',                  m:'Quads', t:'c', e:'Machine',  s:'4 × 10–12', w:1 },
  { n:'Goblet Squat',               m:'Quads', t:'c', e:'Dumbbell', s:'4 × 10', w:1 },
  { n:'Bulgarian Split Squat',      m:'Quads', t:'c', e:'Dumbbell', s:'3 × 10 each', w:1 },
  { n:'Walking Lunge',              m:'Quads', t:'c', e:'Dumbbell', s:'3 × 12 each', w:1 },
  { n:'Leg Extension',              m:'Quads', t:'i', e:'Machine',  s:'3 × 12–15', w:1 },
  { n:'Bodyweight Squat',           m:'Quads', t:'c', e:'None',     s:'4 × 20', w:1 },

  /* ---- Hamstrings ---- */
  { n:'Romanian Deadlift',          m:'Hamstrings', t:'c', e:'Barbell',  s:'4 × 8–10', w:1 },
  { n:'Dumbbell RDL',               m:'Hamstrings', t:'c', e:'Dumbbell', s:'3 × 10', w:1 },
  { n:'Lying Leg Curl',             m:'Hamstrings', t:'i', e:'Machine',  s:'3 × 12', w:1 },
  { n:'Seated Leg Curl',            m:'Hamstrings', t:'i', e:'Machine',  s:'3 × 12–15', w:1 },
  { n:'Good Morning',               m:'Hamstrings', t:'c', e:'Barbell',  s:'3 × 10', x:1 },
  { n:'Nordic Curl',                m:'Hamstrings', t:'i', e:'None',     s:'3 × 6', x:1 },

  /* ---- Glutes ---- */
  { n:'Hip Thrust',                 m:'Glutes', t:'c', e:'Barbell',  s:'4 × 8–10', w:1 },
  { n:'Glute Bridge',               m:'Glutes', t:'c', e:'None',     s:'3 × 15', w:1 },
  { n:'Cable Kickback',             m:'Glutes', t:'i', e:'Cable',    s:'3 × 15 each', w:1 },
  { n:'Sumo Deadlift',              m:'Glutes', t:'c', e:'Barbell',  s:'4 × 6–8', w:1 },
  { n:'Step-up',                    m:'Glutes', t:'c', e:'Dumbbell', s:'3 × 10 each', w:1 },

  /* ---- Calves ---- */
  { n:'Standing Calf Raise',        m:'Calves', t:'i', e:'Machine',  s:'4 × 12–15', w:1 },
  { n:'Seated Calf Raise',          m:'Calves', t:'i', e:'Machine',  s:'4 × 15', w:1 },
  { n:'Dumbbell Calf Raise',        m:'Calves', t:'i', e:'Dumbbell', s:'4 × 15–20', w:1 },

  /* ---- Core ---- */
  { n:'Hanging Knee Raise',         m:'Core', t:'c', e:'None',     s:'3 × 12' },
  { n:'Plank',                      m:'Core', t:'i', e:'None',     s:'3 × 45 s', w:1 },
  { n:'Cable Crunch',               m:'Core', t:'i', e:'Cable',    s:'3 × 15' },
  { n:'Dead Bug',                   m:'Core', t:'i', e:'None',     s:'3 × 10 each', w:1 },
  { n:'Russian Twist',              m:'Core', t:'i', e:'None',     s:'3 × 20', w:1 },
  { n:'Ab Wheel Rollout',           m:'Core', t:'c', e:'None',     s:'3 × 10', x:1 },
  { n:'Side Plank',                 m:'Core', t:'i', e:'None',     s:'3 × 30 s each', w:1 },

  /* ---- Bodyweight, so a home session is not a gym session with the
     barbells crossed out. There were only one or two of these per
     muscle before, which is why Home and Gym looked alike. Every one
     has a photograph in the library. ---- */
  { n:'Wide Push-up',               m:'Chest', t:'c', e:'None',     s:'4 × 10–15' },
  { n:'Incline Push-up',            m:'Chest', t:'c', e:'None',     s:'4 × 12–15', w:1 },
  { n:'Decline Push-up',            m:'Chest', t:'c', e:'None',     s:'3 × 10–12', x:1 },
  { n:'Plyo Push-up',               m:'Chest', t:'c', e:'None',     s:'3 × 6–8', x:1 },

  { n:'Superman',                   m:'Back', t:'i', e:'None',      s:'3 × 12–15', w:1 },
  { n:'Wide-Grip Pull-up',          m:'Back', t:'c', e:'None',      s:'4 × 6–10', x:1 },

  { n:'Handstand Push-up',          m:'Shoulders', t:'c', e:'None', s:'3 × 5–8', x:1 },
  { n:'Seated Front Raise',         m:'Shoulders', t:'i', e:'None', s:'3 × 15' },

  { n:'Close-Grip Push-up',         m:'Triceps', t:'c', e:'None',   s:'3 × 10–15' },
  { n:'Triceps Dip',                m:'Triceps', t:'c', e:'None',   s:'3 × 10–15' },

  { n:'Jump Squat',                 m:'Quads', t:'c', e:'None',     s:'3 × 12' },
  { n:'Reverse Lunge',              m:'Quads', t:'c', e:'None',     s:'3 × 12 each', w:1 },
  { n:'Wall Sit',                   m:'Quads', t:'i', e:'None',     s:'3 × 45 s', w:1 },

  { n:'Single-Leg Glute Bridge',    m:'Glutes', t:'c', e:'None',    s:'3 × 12 each', w:1 },
  { n:'Flutter Kicks',              m:'Glutes', t:'i', e:'None',    s:'3 × 30 s', w:1 },

  { n:'Inchworm',                   m:'Hamstrings', t:'c', e:'None', s:'3 × 8' },
  { n:'Front Leg Raise',            m:'Hamstrings', t:'i', e:'None', s:'3 × 12 each', w:1 },

  { n:'Calf Raise',                 m:'Calves', t:'i', e:'None',    s:'4 × 20', w:1 },

  { n:'Air Bike',                   m:'Core', t:'i', e:'None',      s:'3 × 20', w:1 },
  { n:'Cross-Body Crunch',          m:'Core', t:'i', e:'None',      s:'3 × 15 each', w:1 },
  { n:'Mountain Climber',           m:'Core', t:'c', e:'None',      s:'3 × 40 s', w:1 },
  { n:'Butt-Ups',                   m:'Core', t:'i', e:'None',      s:'3 × 15', x:1 },

  /* ------------------------------------------------------------
     The women's side.

     Everything above stays where it is. What follows is the work a
     session written for a woman is built out of: glutes, inner and
     outer thigh, calves, and the hip work that the men's library
     never needed a name for. Every one has a real photograph, from
     the same public-domain database as the rest.

     'Thighs' is one muscle here rather than two. Adductors and
     abductors are the same session in practice, and nobody says
     "abductor day".
     ------------------------------------------------------------ */

  /* ---- Glutes, the long way round ---- */
  { n:'Barbell Glute Bridge',       m:'Glutes', t:'c', e:'Barbell',  s:'4 × 10', w:1 },
  { n:'Butt Lift Bridge',           m:'Glutes', t:'c', e:'None',     s:'3 × 20', w:1 },
  { n:'Banded Hip Extension',       m:'Glutes', t:'i', e:'Band',     s:'3 × 15 each', w:1 },
  { n:'Banded Hip Lift',            m:'Glutes', t:'c', e:'Band',     s:'3 × 15', w:1 },
  { n:'Cable Glute Kickback',       m:'Glutes', t:'i', e:'Cable',    s:'3 × 15 each', w:1 },
  { n:'Rear Leg Raise',             m:'Glutes', t:'i', e:'None',     s:'3 × 15 each', w:1 },
  { n:'Lying Leg Lift',             m:'Glutes', t:'i', e:'None',     s:'3 × 15 each', w:1 },
  { n:'Kneeling Squat',             m:'Glutes', t:'c', e:'Barbell',  s:'3 × 10', w:1 },

  /* ---- Thighs: inner and outer ---- */
  { n:'Sumo Squat',                 m:'Thighs', t:'c', e:'Dumbbell', s:'4 × 12', w:1 },
  { n:'Inner Thigh Machine',        m:'Thighs', t:'i', e:'Machine',  s:'3 × 15', w:1 },
  { n:'Outer Thigh Machine',        m:'Thighs', t:'i', e:'Machine',  s:'3 × 15', w:1 },
  { n:'Cable Hip Adduction',        m:'Thighs', t:'i', e:'Cable',    s:'3 × 15 each', w:1 },
  { n:'Banded Hip Adduction',       m:'Thighs', t:'i', e:'Band',     s:'3 × 20 each', w:1 },
  { n:'Side Split Squat',           m:'Thighs', t:'c', e:'Barbell',  s:'3 × 10 each', w:1 },
  { n:'Prone Hip Circles',          m:'Thighs', t:'i', e:'None',     s:'3 × 12 each', w:1 },
  { n:'Standing Hip Circles',       m:'Thighs', t:'i', e:'None',     s:'3 × 15 each', w:1 },
  { n:'Groiners',                   m:'Thighs', t:'c', e:'None',     s:'3 × 10 each', w:1 },

  /* ---- Calves ---- */
  { n:'Calf Press',                 m:'Calves', t:'i', e:'Machine',  s:'4 × 15', w:1 },
  { n:'Donkey Calf Raise',          m:'Calves', t:'i', e:'Machine',  s:'3 × 15', w:1 },
  { n:'Single-Leg Calf Raise',      m:'Calves', t:'i', e:'Dumbbell', s:'3 × 15 each', w:1 },
  { n:'Banded Calf Raise',          m:'Calves', t:'i', e:'Band',     s:'3 × 20', w:1 },

  /* ---- Legs, gentler ways in ---- */
  { n:'Chair Squat',                m:'Quads', t:'c', e:'None',      s:'3 × 15', w:1 },
  { n:'Dumbbell Reverse Lunge',     m:'Quads', t:'c', e:'Dumbbell',  s:'3 × 12 each', w:1 },
  { n:'Bodyweight Walking Lunge',   m:'Quads', t:'c', e:'None',      s:'3 × 14 each', w:1 },
  { n:'Banded Hamstring Curl',      m:'Hamstrings', t:'i', e:'Band', s:'3 × 15', w:1 },
  { n:'Floor Glute-Ham Raise',      m:'Hamstrings', t:'i', e:'None', s:'3 × 8', w:1 },

  /* ---- Core ---- */
  { n:'Scissor Kick',               m:'Core', t:'i', e:'None',       s:'3 × 30 s', w:1 },
  { n:'Bent-Knee Hip Raise',        m:'Core', t:'i', e:'None',       s:'3 × 15', w:1 },
  { n:'Leg Pull-In',                m:'Core', t:'i', e:'None',       s:'3 × 15', w:1 },
];

/* The men's side, unchanged — 'Thighs' is a women's group and adding
   it here would have quietly changed a screen that was asked to stay
   exactly as it is. */
export const MUSCLES = ['Chest','Back','Shoulders','Biceps','Triceps',
                        'Quads','Hamstrings','Glutes','Calves','Core'];

/* What a woman's session is built from, in the order it prefers.
   Lower body first and heaviest — that is the whole point of the
   switch. The upper body is still here, with less of it. */
export const WOMEN_MUSCLES = ['Glutes','Thighs','Quads','Hamstrings','Calves',
                              'Core','Back','Shoulders','Biceps','Triceps','Chest'];

export function byMuscle(m, kitOnly) {
  let list = EX.filter((x) => x.m === m);
  if (kitOnly === 'None') list = list.filter((x) => x.e === 'None');
  return list;
}
