/* Workout programmes — plain data, so Coach Sid can edit these
   without touching a screen file. Add an object, it appears. */
export const WORKOUTS = [
  { id:'foundation', cat:'Strength', equip:'Dumbbells', name:'Foundation Strength', focus:'Full body', level:'Beginner',
    days:'3 days / week', minutes:45,
    summary:'The base everything else is built on. Compound movements, moderate load, full range. Run this for eight weeks before progressing.',
    blocks:[
      { name:'Warm-up', items:['Rower or brisk walk — 5 min','World’s greatest stretch — 6 each side','Band pull-apart — 2 × 15'] },
      { name:'Main', items:['Goblet squat — 4 × 8','Push-up (or incline) — 4 × 8–12','Dumbbell row — 4 × 10 each','Romanian deadlift — 3 × 10'] },
      { name:'Finisher', items:['Dead bug — 3 × 8 each','Side plank — 3 × 30 s each'] },
    ] },
  { id:'upper', cat:'Strength', equip:'Gym', name:'Upper Body Hypertrophy', focus:'Chest, back, shoulders, arms', level:'Intermediate',
    days:'2 days / week', minutes:60,
    summary:'Volume where it counts. Every working set to two reps in reserve; add load only once all sets hit the top of the range.',
    blocks:[
      { name:'Warm-up', items:['Arm circles — 30 s each way','Scapular push-up — 2 × 12','Light pressing — 2 × 15'] },
      { name:'Push', items:['Incline dumbbell press — 4 × 8–10','Overhead press — 3 × 8','Cable fly — 3 × 12–15','Triceps rope — 3 × 12'] },
      { name:'Pull', items:['Pull-up or lat pulldown — 4 × 6–10','Chest-supported row — 3 × 10','Face pull — 3 × 15','Dumbbell curl — 3 × 12'] },
    ] },
  { id:'lower', cat:'Strength', equip:'Barbell', name:'Lower Body Hypertrophy', focus:'Quads, hamstrings, glutes', level:'Intermediate',
    days:'2 days / week', minutes:60,
    summary:'Heavy on the hinge and the squat, finished with single-leg work. Depth before load, every time.',
    blocks:[
      { name:'Warm-up', items:['Bike — 5 min','Hip airplane — 5 each side','Bodyweight squat — 2 × 15'] },
      { name:'Main', items:['Back squat — 4 × 6–8','Romanian deadlift — 4 × 8','Walking lunge — 3 × 10 each','Leg curl — 3 × 12'] },
      { name:'Finisher', items:['Calf raise — 4 × 15','Hanging knee raise — 3 × 12'] },
    ] },
  { id:'home', cat:'Bodyweight', equip:'None', name:'Home, No Equipment', focus:'Full body', level:'All levels',
    days:'4 days / week', minutes:30,
    summary:'For travel weeks and hotel rooms. Nothing but the floor. Slow the tempo as it gets easy — three seconds down, one up.',
    blocks:[
      { name:'Circuit × 4', items:['Push-up — 12','Split squat — 10 each','Glute bridge — 15','Superman hold — 30 s','Mountain climber — 30 s'] },
      { name:'Cool-down', items:['Child’s pose — 60 s','Couch stretch — 45 s each'] },
    ] },
  { id:'mudgar', cat:'Ancient', equip:'Mudgar', name:'Ancient Methods — Mudgar', focus:'Shoulders, grip, rotational strength', level:'Intermediate',
    days:'2 days / week', minutes:30,
    summary:'The Indian club work Mesamorfit was built on. Start with the lightest mudgar you own and earn the range before the weight.',
    blocks:[
      { name:'Prep', items:['Wrist circles — 30 s each','Shoulder dislocates with band — 2 × 10'] },
      { name:'Main', items:['Single-hand swing — 4 × 10 each','Double mudgar swing — 4 × 10','Shield cast — 3 × 8 each','Farmer carry — 3 × 40 m'] },
    ] },
  { id:'desk', cat:'Mobility', equip:'None', name:'The Desk Antidote', focus:'Posture, hips, thoracic spine', level:'All levels',
    days:'Daily', minutes:15,
    summary:'Fifteen minutes against eight hours of sitting. Built for the professional schedule — between meetings, no kit, no sweat.',
    blocks:[
      { name:'Open', items:['Thoracic extension over chair — 10','Hip flexor stretch — 45 s each','Doorway pec stretch — 45 s each'] },
      { name:'Activate', items:['Wall slide — 2 × 12','Glute bridge — 2 × 15','Chin tuck — 2 × 10'] },
    ] },
  { id:'rajyog', cat:'Recovery', equip:'None', name:'Rajyog — Breath & Stillness', focus:'Recovery, nervous system', level:'All levels',
    days:'3 days / week', minutes:20,
    summary:'From our sister brand. Not a workout — the other half of one. Best in the evening, or the day after a heavy session.',
    blocks:[
      { name:'Pranayama', items:['Anulom vilom — 5 min','Bhramari — 10 rounds','Box breathing 4–4–4–4 — 5 min'] },
      { name:'Stillness', items:['Seated meditation — 10 min','Savasana — 5 min'] },
    ] },
];
