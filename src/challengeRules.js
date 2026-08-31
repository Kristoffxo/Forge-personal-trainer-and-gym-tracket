/* ---------------------------------------------------------------
   The rules a challenge runs on, and nothing else.

   Kept apart from src/challenge.js — which talks to the database —
   so these can be tested on their own. They decide whether someone
   keeps a ninety-day streak, so they are worth being sure about.
   --------------------------------------------------------------- */
const DAY = 86400000;

/* Dates are handled as plain YYYY-MM-DD in local time, because a
   challenge is about the day you lived, not the day in UTC. */
export function dayKey(d) {
  const t = d || new Date();
  return t.getFullYear() + '-'
    + String(t.getMonth() + 1).padStart(2, '0') + '-'
    + String(t.getDate()).padStart(2, '0');
}

function parseDay(s) {
  const [y, m, d] = String(s).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function daysBetween(a, b) {
  return Math.round((parseDay(b) - parseDay(a)) / DAY);
}


/* ---------------------------------------------------------------
   Where a challenge stands.

   Returns everything the screen needs, and — importantly — never
   writes anything. `progress` decides; the caller applies.

     state    'on'      going fine
              'grace'   one day missed, streak kept, say so kindly
              'broken'  a second miss, the run is over
              'done'    made it all the way

     spend    true when this reading is the moment the one free
              miss gets used up, so the caller can persist it
   --------------------------------------------------------------- */
export function progress(challenge, trainedDays) {
  const done = new Set(trainedDays || []);
  const today = dayKey();
  const start = challenge.started_on;

  const elapsed = daysBetween(start, today);       // 0 on the first day
  const dayNumber = Math.min(challenge.days, elapsed + 1);

  /* Every day from the start up to yesterday is a day that could
     have been missed. Today still has hours left in it. */
  const missed = [];
  for (let i = 0; i < elapsed; i++) {
    const d = dayKey(new Date(parseDay(start).getTime() + i * DAY));
    if (!done.has(d)) missed.push(d);
  }

  const trainedToday = done.has(today);
  const completedDays = Array.from({ length: elapsed + 1 }, (_, i) =>
    dayKey(new Date(parseDay(start).getTime() + i * DAY))).filter((d) => done.has(d)).length;

  let state = 'on';
  let spend = false;

  if (missed.length >= 2 || (missed.length === 1 && challenge.grace_used)) {
    state = 'broken';
  } else if (missed.length === 1) {
    state = 'grace';
    spend = !challenge.grace_used;       // first time we have seen this miss
  }

  if (state !== 'broken' && elapsed >= challenge.days) state = 'done';

  return {
    state,
    spend,
    dayNumber,
    total: challenge.days,
    completedDays,
    missedCount: missed.length,
    lastMissed: missed.length ? missed[missed.length - 1] : null,
    trainedToday,
    daysLeft: Math.max(0, challenge.days - elapsed),
  };
}

/* What to say. Warm, never scolding — the point is that they come
   back tomorrow, and nobody ever came back because an app told
   them off. */
export function message(p) {
  if (p.state === 'done') {
    return {
      title: 'You finished it',
      body: `${p.total} days. That is the hard part done — most people never get past the first week.`,
    };
  }
  if (p.state === 'broken') {
    return {
      title: 'This run has ended',
      body: 'Two missed days. No drama — start another one whenever you are ready, and it counts from zero again.',
    };
  }
  if (p.state === 'grace') {
    return {
      title: 'Streak saved',
      body: 'That was the first day you missed, so the streak stays. One more and it goes — but you have got this.',
    };
  }
  if (p.trainedToday) {
    return {
      title: `Day ${p.dayNumber} done`,
      body: p.daysLeft <= 1 ? 'One more to go.' : `${p.daysLeft} days left. Same again tomorrow.`,
    };
  }
  return {
    title: `Day ${p.dayNumber}`,
    body: 'Nothing logged today yet. Any workout counts.',
  };
}
