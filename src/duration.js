/* ---------------------------------------------------------------
   How long to hold something for.

   The library writes its prescriptions the way a coach says them —
   "3 × 45 s", "60 seconds each", "2 minutes" — because that is what
   reads well on a list. This turns the ones that name a time into a
   number the timer can count down, and returns null for the ones
   that count reps instead.

   "each" means each side, which is worth saying on screen: the timer
   is one side's worth and it gets run twice.
   --------------------------------------------------------------- */

/* '3 × 45 s each' -> { seconds: 45, sets: 3, eachSide: true } */
export function parseDuration(text) {
  const s = String(text || '').toLowerCase();

  const time = s.match(/(\d+(?:\.\d+)?)\s*(s\b|secs?\b|seconds?\b|m\b|mins?\b|minutes?\b)/);
  if (!time) return null;

  const n = parseFloat(time[1]);
  if (!isFinite(n) || n <= 0) return null;

  const perMinute = /^m/.test(time[2]);
  const seconds = Math.round(perMinute ? n * 60 : n);
  if (seconds < 3 || seconds > 60 * 30) return null;   // not a hold, or a typo

  const sets = s.match(/(\d+)\s*[×x]\s/);

  return {
    seconds,
    sets: sets ? parseInt(sets[1], 10) : 1,
    eachSide: /\beach\b/.test(s),
  };
}

/* 90 -> '1:30' */
export function clock(seconds) {
  const n = Math.max(0, Math.round(seconds));
  return Math.floor(n / 60) + ':' + String(n % 60).padStart(2, '0');
}
