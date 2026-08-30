/* ---------------------------------------------------------------
   What you actually lifted.

   The single most useful thing a training app can show you is what
   you did last time, on the screen where you are about to do it
   again. That is all this is: write the sets down, read the last
   session back, and notice a best.
   --------------------------------------------------------------- */
import { supabase } from './supabase';
import { todayKey } from './diary';

export async function logSet({ userId, exercise, setNo, weight, reps }) {
  const { error } = await supabase.from('sets').insert({
    user_id: userId,
    day: todayKey(),
    exercise,
    set_no: setNo,
    weight_kg: weight === '' || weight == null ? null : Number(weight),
    reps: reps === '' || reps == null ? null : Number(reps),
  });
  return !error;
}

export async function clearToday(userId, exercise) {
  await supabase
    .from('sets')
    .delete()
    .eq('user_id', userId)
    .eq('exercise', exercise)
    .eq('day', todayKey());
}

/* ---------------------------------------------------------------
   History for one exercise: today's sets, the last session before
   today, and the heaviest single set ever recorded.
   --------------------------------------------------------------- */
export async function historyFor(userId, exercise) {
  const { data, error } = await supabase
    .from('sets')
    .select('day, set_no, weight_kg, reps')
    .eq('user_id', userId)
    .eq('exercise', exercise)
    .order('day', { ascending: false })
    .order('set_no', { ascending: true })
    .limit(120);

  if (error || !data) return { today: [], last: null, best: null };

  const today = todayKey();
  const todaySets = data.filter((r) => r.day === today);

  const earlier = data.filter((r) => r.day !== today);
  const lastDay = earlier.length ? earlier[0].day : null;
  const last = lastDay
    ? { day: lastDay, sets: earlier.filter((r) => r.day === lastDay) }
    : null;

  /* "Best" is the heaviest weight that was moved for at least one
     rep. Estimated one-rep maxes are a rabbit hole and everyone
     disagrees about the formula. */
  let best = null;
  data.forEach((r) => {
    if (r.weight_kg == null || !r.reps) return;
    if (!best || r.weight_kg > best.weight_kg) best = r;
  });

  return { today: todaySets, last, best };
}

/* One line, for the card: "Last time: 60 kg × 8, 8, 7" */
export function summarise(session) {
  if (!session || !session.sets || !session.sets.length) return '';
  const sets = session.sets;
  const weights = [...new Set(sets.map((s) => s.weight_kg).filter((w) => w != null))];
  const reps = sets.map((s) => s.reps).filter(Boolean);

  if (weights.length === 1 && reps.length) {
    return `${trim(weights[0])} kg × ${reps.join(', ')}`;
  }
  if (!weights.length && reps.length) return `${reps.join(', ')} reps`;

  return sets
    .map((s) => (s.weight_kg != null ? `${trim(s.weight_kg)}×${s.reps || '?'}` : `${s.reps || '?'}`))
    .join('  ');
}

/* How long ago that session was, in words. */
export function whenWas(day) {
  if (!day) return '';
  const then = new Date(day + 'T00:00:00');
  const days = Math.round((Date.now() - then.getTime()) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return days + ' days ago';
  if (days < 14) return 'last week';
  return Math.floor(days / 7) + ' weeks ago';
}

const trim = (n) => (Number(n) % 1 === 0 ? String(Number(n)) : Number(n).toFixed(1));

/* How many sets the "4 × 6–8" style string is asking for. */
export function setsWanted(scheme) {
  const m = /^(\d+)/.exec(String(scheme || '').trim());
  const n = m ? parseInt(m[1], 10) : 3;
  return Math.min(8, Math.max(1, n));
}

/* And the rep target, for the placeholder in the reps box. */
export function repHint(scheme) {
  const m = /×\s*([0-9]+)/.exec(String(scheme || ''));
  return m ? m[1] : '';
}
