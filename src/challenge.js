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
import { scoreFrom } from './score';
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

  /* The score is published, not recomputed by anyone else. It is
     made of workout_days, posts and rounds, and row-level security
     keeps all three private to their owner — so nobody but you is
     able to work out your score. Writing the finished number here
     is the only way it can appear on your profile card. */
  const mine = await myScore(userId);

  const row = {
    level: a.level,
    medals: a.medals,
    best_streak: a.longest,
    days_trained: a.trained,
    current_streak: a.current,
    reppo_score: mine.score,
    stats_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('profiles').update(row).eq('id', userId);

  /* Each of these columns arrived in a later migration, and one
     unknown column rejects the whole update — which would quietly
     stop publishing anything at all. Drop whichever is missing and
     write the rest rather than losing the lot. */
  if (error && /reppo_score/.test(error.message || '')) {
    const { reppo_score, ...older } = row;
    const retry = await supabase.from('profiles').update(older).eq('id', userId);
    if (retry.error && /days_trained/.test(retry.error.message || '')) {
      const { days_trained, ...oldest } = older;
      await supabase.from('profiles').update(oldest).eq('id', userId);
    }
  } else if (error && /days_trained/.test(error.message || '')) {
    const { days_trained, ...older } = row;
    await supabase.from('profiles').update(older).eq('id', userId);
  }
  return a;
}

/* Just the count, for anything that needs the number and not the
   list — the reminder text, mostly. */
export async function trainedDays(userId) {
  const days = await allTrainedDays(userId);
  return new Set(days).size;
}

/* Every workout in one month, for the calendar. Returns the rows
   themselves rather than a count, because the calendar wants to say
   what was done on the 14th and not only that something was. */
export async function workoutsInMonth(userId, year, month) {
  const pad = (n) => String(n).padStart(2, '0');
  const from = `${year}-${pad(month + 1)}-01`;
  const last = new Date(year, month + 1, 0).getDate();
  const to = `${year}-${pad(month + 1)}-${pad(last)}`;

  const ask = (cols) => supabase
    .from('workout_days')
    .select(cols)
    .eq('user_id', userId)
    .gte('day', from)
    .lte('day', to)
    .order('day');

  const { data, error } = await ask('day, kind, name');
  if (!error) return data || [];

  /* `kind` and `name` arrived after the table did, and `create table
     if not exists` will not add a column to a table that is already
     there. On a database that missed that migration the rich select
     fails and the calendar comes back empty for ever — which looks
     exactly like never having trained. Ask for the one column that
     has always existed instead: fewer details, but the right days. */
  const bare = await ask('day');
  return bare.error ? [] : (bare.data || []);
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
   The Reppo Score, and where it puts you on the journey.

   Three counts and a date. Everything else is arithmetic in
   src/score.js, which has no idea Supabase exists and can therefore
   be tested without it.

   The counts are asked for with `head: true`, so the database sends
   back a number rather than the rows — a person with four hundred
   workouts should not have to download four hundred rows to be told
   they have four hundred.
   --------------------------------------------------------------- */
async function countRows(table, build) {
  const q = build(supabase.from(table).select('id', { count: 'exact', head: true }));
  const { count, error } = await q;
  return error ? 0 : (count || 0);
}

/* Rounds you finished and won. A draw is not a win, and a round the
   other person walked away from never finished, so neither counts. */
export async function competeWins(userId) {
  const { data, error } = await supabase
    .from('rounds')
    .select('a_id, b_id, a_score, b_score, a_done, b_done')
    .or(`a_id.eq.${userId},b_id.eq.${userId}`);
  if (error) return 0;
  return (data || []).filter((r) => {
    if (!r.a_done || !r.b_done || !r.b_id) return false;
    return r.a_id === userId ? r.a_score > r.b_score : r.b_score > r.a_score;
  }).length;
}

/* ---------------------------------------------------------------
   Put the score where other people can see it.

   publishStats does this too, but only when a workout is finished.
   That left everybody reading zero from the moment the column was
   created until their next session — a real score of thirty-two
   shown to the feed as nought. Opening the app is the other moment
   the number is known, so it is written then as well.

   Cheap: one update of one integer, and only when it has actually
   moved. Failures are ignored on purpose — if the column is not
   there yet, the card falls back to days trained and nothing about
   this is worth interrupting somebody for.
   --------------------------------------------------------------- */
export async function publishScore(userId) {
  if (!userId) return null;
  try {
    const mine = await myScore(userId);
    await supabase.from('profiles')
      .update({ reppo_score: mine.score })
      .eq('id', userId);
    return mine.score;
  } catch {
    return null;
  }
}

/* Points that were earned once, counted once.

   These used to be a count of the rows still lying about: posts,
   and rounds you had won. Both are cleaned up on a timer —
   photographs after seven days, rounds after one — so the points
   went with them, and a score of 34 became 32 overnight because a
   photograph aged out. That is not the rest-day penalty and there
   is no way to explain it on the screen.

   The durable counters live on the profile row and are kept by
   database triggers, so nothing purges them and no client can award
   itself a league. Counting the surviving rows is the fallback for
   a database that has not run supabase-score-counters.sql yet: too
   low once things start expiring, but never a number nobody can
   account for. */
async function earnedCounts(userId) {
  const { data } = await supabase
    .from('profiles').select('photos_posted, rounds_won').eq('id', userId).maybeSingle();

  if (data && typeof data.photos_posted === 'number' && typeof data.rounds_won === 'number') {
    return { posts: data.photos_posted, wins: data.rounds_won };
  }

  const [posts, wins] = await Promise.all([
    countRows('posts', (q) => q.eq('user_id', userId)),
    competeWins(userId),
  ]);
  return { posts, wins };
}

export async function myScore(userId) {
  const [trained, earned] = await Promise.all([
    allTrainedDays(userId),
    earnedCounts(userId),
  ]);
  return {
    ...scoreFrom({ trained, posts: earned.posts, wins: earned.wins, today: dayKey() }),
    trained,
  };
}

export async function myJourney(userId) {
  const s = await myScore(userId);
  return {
    ...journeyFrom(s.score),
    ...s,
    trainedToday: s.trained.includes(dayKey()),
  };
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

