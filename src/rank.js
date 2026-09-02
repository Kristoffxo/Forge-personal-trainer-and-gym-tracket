/* ---------------------------------------------------------------
   Streaks, medals, levels.

   Nothing is "started" any more. You train, the days pile up, and
   the medals arrive on their own — which is the only version of
   this that survives contact with real life, because nobody
   remembers to press Start before a good month.

   The rules
   ---------
   A run is a stretch of consecutive days. Every calendar week you
   get one rest day that does not break it. Miss a second day in the
   same week and the run ends and a new one begins.

   Today never breaks anything. The day is not over yet.

   Medals — four tiers, four grades each. Every complete block of N
   days inside a run earns one grade at that tier, and they add up
   across every run you have ever had, because doing seven days
   twice really is doing it twice.

     1 block  bronze
     2        silver
     3        gold
     4        diamond

   Levels come from the longest single unbroken run, because that is
   the thing that is genuinely hard:

     level 1  starting out
     level 2  30 days
     level 3  90 days
     level 4  360 days — the same as diamond at the 90 tier
   --------------------------------------------------------------- */

const DAY = 86400000;

export const TIERS = [7, 15, 30, 90];
export const GRADES = ['bronze', 'silver', 'gold', 'diamond'];

export const GRADE_COLOUR = {
  bronze: '#C77B3C',
  silver: '#B9BCC4',
  gold: '#E3B23C',
  diamond: '#6FD8E8',
};

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

/* Monday-start week, as a sortable key. Two days share a key when
   they share a week, which is all the exemption rule needs. */
function weekKey(date) {
  const d = new Date(date.getTime());
  const shift = (d.getDay() + 6) % 7;          // Monday = 0
  d.setDate(d.getDate() - shift);
  return dayKey(d);
}

/* ---------------------------------------------------------------
   Walk every day from the first one trained to today, and cut it
   into runs.

   Returns { runs, current, longest, restUsedThisWeek, restLeftThisWeek }
   --------------------------------------------------------------- */
export function runsFrom(days, today) {
  const set = new Set(days || []);
  if (!set.size) {
    return { runs: [], current: 0, longest: 0, restUsedThisWeek: false, restLeftThisWeek: 1 };
  }

  const sorted = [...set].sort();
  const start = parseDay(sorted[0]);
  const end = parseDay(today || dayKey());
  const todayK = dayKey(end);

  const runs = [];
  const usedInWeek = {};
  let cur = 0;
  let currentRun = 0;

  for (let t = start.getTime(); t <= end.getTime(); t += DAY) {
    const d = new Date(t);
    const k = dayKey(d);
    const wk = weekKey(d);

    if (set.has(k)) {
      cur += 1;
      continue;
    }

    /* Today has not happened yet — it can neither extend a run nor
       end one. Stop here and let the run stand. */
    if (k === todayK) break;

    if (!usedInWeek[wk]) {
      usedInWeek[wk] = true;      // the week's rest day
      cur += 1;
      continue;
    }

    if (cur) runs.push(cur);
    cur = 0;
  }

  currentRun = cur;
  if (cur) runs.push(cur);

  const thisWeek = weekKey(end);
  return {
    runs,
    current: currentRun,
    longest: runs.length ? Math.max(...runs) : 0,
    restUsedThisWeek: !!usedInWeek[thisWeek],
    restLeftThisWeek: usedInWeek[thisWeek] ? 0 : 1,
  };
}

/* ---------------------------------------------------------------
   Medals
   --------------------------------------------------------------- */
export function medalsFrom(runs) {
  const out = {};
  TIERS.forEach((tier) => {
    const blocks = (runs || []).reduce((n, r) => n + Math.floor(r / tier), 0);
    out[tier] = Math.min(4, blocks);
  });
  return out;
}

export function gradeOf(count) {
  return count > 0 ? GRADES[Math.min(4, count) - 1] : null;
}

export function levelFrom(longest) {
  if (longest >= 360) return 4;
  if (longest >= 90) return 3;
  if (longest >= 30) return 2;
  return 1;
}

export const LEVEL_NAME = {
  1: 'Level 1',
  2: 'Level 2',
  3: 'Level 3',
  4: 'Level 4',
};

/* The one line that goes on a profile. */
export function rankOf(medals) {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    const tier = TIERS[i];
    const g = gradeOf(medals[tier] || 0);
    if (g) return { tier, grade: g, label: cap(g) + ' · ' + tier + ' day' };
  }
  return { tier: null, grade: null, label: 'Unranked' };
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------------------------------------------------------------
   Everything a screen needs, from the list of days trained.
   --------------------------------------------------------------- */
export function analyse(days, today) {
  const r = runsFrom(days, today);
  const medals = medalsFrom(r.runs);
  const level = levelFrom(r.longest);
  return {
    ...r,
    medals,
    level,
    /* The only number the journey cares about: how many days have
       been trained, ever, in any order. Runs and streaks are still
       computed above because the older screens read them, but this
       is what drives the map and the badges. */
    trained: new Set(days || []).size,
    rank: rankOf(medals),
    trainedToday: (days || []).includes(dayKey(today ? new Date(today) : undefined)),
    /* what the next medal needs */
    next: nextUp(r, medals),
  };
}

/* The nearest thing still to earn, so a screen can say "three more
   days" instead of showing a wall of empty badges. */
function nextUp(r, medals) {
  for (const tier of TIERS) {
    if ((medals[tier] || 0) < 4) {
      const done = (medals[tier] || 0);
      const within = r.current % tier;
      return {
        tier,
        grade: GRADES[Math.min(3, done)],
        daysToGo: within === 0 && r.current > 0 ? tier : tier - within,
      };
    }
  }
  return null;
}
