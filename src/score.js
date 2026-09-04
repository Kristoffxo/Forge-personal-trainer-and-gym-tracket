/* ---------------------------------------------------------------
   The Reppo Score.

   One number for how much you have put into the app. It goes up when
   you do something and down when you disappear, and it is the only
   thing the leagues are climbed with.

     a workout          +5
     a photo on Discover +2
     a round of Compete you won +2
     every idle day after the first  −1

   The idle rule is the only one with any thought in it. A rest day
   costs nothing — the whole app is built on rest days costing
   nothing, and charging for one would contradict every other screen.
   Two in a row costs one point, three costs two, and so on: the
   first day of any gap is free and the rest are not. So training
   every other day holds a score steady, and a fortnight off is
   thirteen points.

   Nothing is stored. The score is worked out from the three tables
   that already record what happened — workout_days, posts and
   rounds — so it cannot drift from them, cannot be edited by a
   client that fancies a higher number, and needs no migration.
   --------------------------------------------------------------- */

export const PER_WORKOUT = 5;
export const PER_POST = 2;
export const PER_WIN = 2;

/* What a league costs. Bronze at nought, Silver at fifty, and so on
   to Titan at three hundred and fifty. */
export const LEAGUE_STEP = 50;

const DAY = 86400000;

/* 'YYYY-MM-DD' -> a UTC midnight, so arithmetic between two of them
   is exact whatever the phone's timezone is doing. */
function stamp(key) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || '').trim());
  if (!m) return NaN;
  return Date.UTC(+m[1], +m[2] - 1, +m[3]);
}

/* The days you did not train, minus one free day per gap.

   Counted from the first day you ever trained to today — before that
   there is nothing to be idle from, and somebody who signed up this
   morning should not open the app owing points. An unfinished gap
   counts: if you have not trained in a week, that week is costing
   you now rather than once you come back. */
export function idleDays(trained, today) {
  const end = stamp(today);
  const stamps = (trained || [])
    .map(stamp)
    .filter((n) => !Number.isNaN(n) && n <= end)
    .sort((a, b) => a - b);
  if (!stamps.length || Number.isNaN(end)) return 0;

  const seen = new Set(stamps);
  let idle = 0;
  let run = 0;

  for (let d = stamps[0] + DAY; d <= end; d += DAY) {
    if (seen.has(d)) { run = 0; continue; }
    run += 1;
    /* the first day of a gap is the rest day, and it is free */
    if (run > 1) idle += 1;
  }
  return idle;
}

/* The whole sum, and its parts, so a screen can show the working.

   Clamped at nought. A negative Reppo Score would put somebody below
   Bronze, and there is nothing below Bronze — the map starts with
   you already standing on it. */
export function scoreFrom({ trained = [], posts = 0, wins = 0, today }) {
  const workouts = (trained || []).length;
  const idle = idleDays(trained, today);

  const earned = workouts * PER_WORKOUT + posts * PER_POST + wins * PER_WIN;
  const score = Math.max(0, earned - idle);

  return {
    score,
    workouts,
    posts,
    wins,
    idle,
    fromWorkouts: workouts * PER_WORKOUT,
    fromPosts: posts * PER_POST,
    fromWins: wins * PER_WIN,
    earned,
    /* true when the clamp is doing something, so a screen can say
       "you cannot go below nought" rather than showing a sum that
       does not add up */
    floored: earned - idle < 0,
  };
}
