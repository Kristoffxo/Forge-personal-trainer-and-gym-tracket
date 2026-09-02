/* ---------------------------------------------------------------
   Challenges, and the streak that carries them.

   The rule, in one line: train every day from the day you start.
   Miss one and you keep the streak, once. Miss a second and the
   run ends.

   Nothing here punishes you for today — today is not over until it
   is over, so a day you have not trained yet is never counted as a
   miss. The only days that can break a challenge are days that
   have already finished.
   --------------------------------------------------------------- */
import { supabase } from './supabase';
import { dayKey } from './challengeRules';
import { analyse } from './rank';
import { journeyFrom } from './journey';

export { dayKey, progress, message } from './challengeRules';

/* ---------------------------------------------------------------
   Writing down that you trained
   --------------------------------------------------------------- */
/* ---------------------------------------------------------------
   Publishing your standing.

   Medals are computed on the device from workout_days, which only
   you can read. This copies the results onto your profile so other
   people can see them when they tap your name — and nothing else
   about you goes with it.
   --------------------------------------------------------------- */
export async function publishStats(userId) {
  const days = await allTrainedDays(userId);
  const a = analyse(days);
  await supabase.from('profiles').update({
    level: a.level,
    medals: a.medals,
    best_streak: a.longest,
    current_streak: a.current,
    stats_at: new Date().toISOString(),
  }).eq('id', userId);
  return a;
}

export async function allTrainedDays(userId) {
  const { data, error } = await supabase
    .from('workout_days').select('day').eq('user_id', userId).order('day');
  return error ? [] : (data || []).map((r) => r.day);
}

/* Where you stand, without a round trip to anyone else. */
export async function myStanding(userId) {
  return analyse(await allTrainedDays(userId));
}

/* ---------------------------------------------------------------
   Where you are on the journey.

   Counted in days trained, not days in a row. A gap takes nothing
   away, which is why this reads the length of the list rather than
   walking it looking for runs.
   --------------------------------------------------------------- */
export async function myJourney(userId) {
  const days = await allTrainedDays(userId);
  return { ...journeyFrom(days.length), trainedToday: days.includes(dayKey()) };
}

/* The measurements written at each place, keyed by milestone number.
   Milestone 0 is the starting point. */
export async function journeyEntries(userId) {
  const { data, error } = await supabase
    .from('journey_entries')
    .select('*')
    .eq('user_id', userId)
    .order('milestone');
  if (error) return {};
  const out = {};
  (data || []).forEach((r) => { out[r.milestone] = r; });
  return out;
}

export async function saveJourneyEntry(userId, milestone, values) {
  const row = {
    user_id: userId,
    milestone,
    day_count: values.dayCount || 0,
    weight_kg: values.weight === '' || values.weight == null ? null : Number(values.weight),
    bmi: values.bmi === '' || values.bmi == null ? null : Number(values.bmi),
    muscle_kg: values.muscle === '' || values.muscle == null ? null : Number(values.muscle),
    note: (values.note || '').trim().slice(0, 400) || null,
  };
  const { error } = await supabase
    .from('journey_entries')
    .upsert(row, { onConflict: 'user_id,milestone' });
  if (error) {
    if (/does not exist|schema cache/i.test(error.message)) {
      return { error: 'The journey is not set up on the database yet — run supabase-v8.sql.' };
    }
    return { error: error.message };
  }
  return { ok: true };
}

export async function markWorkout(userId, kind, name) {
  const { error } = await supabase
    .from('workout_days')
    .upsert(
      { user_id: userId, day: dayKey(), kind: kind || 'workout', name: name || null },
      { onConflict: 'user_id,day' },
    );
  if (!error) await publishStats(userId);
  return !error;
}

export async function trainedOn(userId, fromDay) {
  const { data, error } = await supabase
    .from('workout_days')
    .select('day')
    .eq('user_id', userId)
    .gte('day', fromDay);
  return error ? [] : (data || []).map((r) => r.day);
}

/* ---------------------------------------------------------------
   The challenge itself
   --------------------------------------------------------------- */
export async function activeChallenge(userId) {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  return error ? null : data;
}

export async function startChallenge(userId, days) {
  const { data, error } = await supabase
    .from('challenges')
    .insert({ user_id: userId, days, started_on: dayKey() })
    .select()
    .single();
  if (error) {
    if (String(error.message).includes('challenges_one_active')) {
      return { error: 'You already have a challenge running. Finish or leave that one first.' };
    }
    return { error: error.message };
  }
  return { challenge: data };
}

export async function updateChallenge(id, patch) {
  await supabase.from('challenges').update(patch).eq('id', id);
}

export async function leaveChallenge(id) {
  await supabase.from('challenges')
    .update({ status: 'broken', ended_on: dayKey() })
    .eq('id', id);
}

