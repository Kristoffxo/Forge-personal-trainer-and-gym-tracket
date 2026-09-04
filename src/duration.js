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

/* ---------------------------------------------------------------
   The same prescription, in words.

   "4 × 8–10" is how a coach writes it on a whiteboard and it is
   unreadable on a screen — it looks like arithmetic, and at the top
   of a workout the one thing somebody needs to know without thinking
   is how many sets of how many. So it comes apart into "4 sets" and
   "8–10 reps", which the player stacks and everything else joins
   with a dot.

   The library keeps writing the short form. It is what parseDuration
   reads, it is what the shuffle and the rules reason about, and
   rewriting three hundred rows to change how one label looks would
   put the machine-readable field and the human one in the same
   string again.
   --------------------------------------------------------------- */
export function setsReps(text) {
  const raw = String(text || '').trim();
  if (!raw) return { sets: '', work: '', line: '' };

  const m = raw.match(/^(\d+)\s*[×x]\s*(.+)$/i);
  if (!m) return { sets: '', work: raw, line: raw };

  const n = parseInt(m[1], 10);
  const sets = `${n} ${n === 1 ? 'set' : 'sets'}`;

  /* "each" is always each side. Said in full it stops reading as an
     abbreviation of something the reader has to work out. */
  let rest = m[2].trim();
  const eachSide = /\beach\b/i.test(rest);
  rest = rest.replace(/\s*\beach\b\s*/i, ' ').trim();

  let work;
  const time = rest.match(/^(\d+(?:\.\d+)?)\s*(s|secs?|seconds?)$/i);
  const mins = rest.match(/^(\d+(?:\.\d+)?)\s*(m|mins?|minutes?)$/i);
  if (time) {
    work = `${time[1]} ${Number(time[1]) === 1 ? 'second' : 'seconds'}`;
  } else if (mins) {
    work = `${mins[1]} ${Number(mins[1]) === 1 ? 'minute' : 'minutes'}`;
  } else if (/^max$/i.test(rest)) {
    work = 'max reps';
  } else if (/^[\d–—-]+$/.test(rest)) {
    /* a number or a range: 10, 8–10 */
    work = `${rest} reps`;
  } else {
    /* already carries its own noun — "20 steps", "10 breaths" */
    work = rest;
  }

  if (eachSide) work += ' each side';
  return { sets, work, line: `${sets} · ${work}` };
}
