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

export { dayKey, progress, message } from './challengeRules';

/* ---------------------------------------------------------------
   Writing down that you trained
   --------------------------------------------------------------- */
export async function markWorkout(userId, kind, name) {
  const { error } = await supabase
    .from('workout_days')
    .upsert(
      { user_id: userId, day: dayKey(), kind: kind || 'workout', name: name || null },
      { onConflict: 'user_id,day' },
    );
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

