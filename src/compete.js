/* ---------------------------------------------------------------
   Head-to-head.

   One minute, one exercise, somebody else somewhere doing the same
   thing at the same time, and both scores on both screens as they
   happen.

   Matchmaking is one database function: take the oldest round nobody
   has claimed, or open one and wait. There is no queue and no server
   process. `for update skip locked` is what stops two people
   claiming the same round in the same instant.

   Neither app writes the other's score — score_round() decides which
   column you are allowed to touch from who you are. A client that
   could write the table could write the other person's number.
   --------------------------------------------------------------- */
import { supabase } from './supabase';

/* The two you can race on.

   There were five. The other three — sit-ups, plank, burpees — had
   to be counted by hand, because the rep counter only knows push-ups
   and squats, and a race where one person taps their own score is
   not a race. They come back when the counter can see them. */
export const MOVES = [
  { key: 'pushups', name: 'Push-ups', demo: 'Push-up',
    hint: 'Phone on the floor, propped up.', camera: true },
  { key: 'squats', name: 'Squats', demo: 'Bodyweight Squat',
    hint: 'Phone against a wall, a few steps back.', camera: true },
];

export function moveByKey(key) {
  return MOVES.find((m) => m.key === key) || MOVES[0];
}

export const ROUND_SECONDS = 60;

/* Find somebody, or become the person somebody finds. */
export async function joinRound(move, name) {
  const { data, error } = await supabase.rpc('join_round', {
    p_move: move,
    p_name: String(name || '').trim().split(/\s+/)[0] || 'Someone',
  });
  if (error) {
    if (/does not exist|schema cache/i.test(error.message)) {
      return { error: 'Head-to-head is not set up on the database yet — run supabase-v7.sql.' };
    }
    return { error: error.message };
  }
  return { round: Array.isArray(data) ? data[0] : data };
}

export async function sendScore(id, score, done) {
  const { data, error } = await supabase.rpc('score_round', {
    p_id: id, p_score: Math.round(score), p_done: !!done,
  });
  if (error) return { error: error.message };
  return { round: Array.isArray(data) ? data[0] : data };
}

export async function leaveRound(id) {
  await supabase.rpc('leave_round', { p_id: id }).then(null, () => {});
}

export async function readRound(id) {
  const { data, error } = await supabase.from('rounds').select('*').eq('id', id).maybeSingle();
  return error ? null : data;
}

/* Which half of the row is you. */
export function sidesOf(round, userId) {
  const mine = round.a_id === userId;
  return {
    mine: mine ? 'a' : 'b',
    myScore: mine ? round.a_score : round.b_score,
    theirScore: mine ? round.b_score : round.a_score,
    theirName: mine ? round.b_name : round.a_name,
    theirDone: mine ? round.b_done : round.a_done,
    waiting: !round.b_id,
  };
}

/* ---------------------------------------------------------------
   Watching the other person.

   Supabase Realtime pushes the row when it changes. Polling backs it
   up, because a round is sixty seconds long and a websocket that
   quietly fails to connect on a bad line would leave the opponent's
   number frozen at zero with nothing to say why.
   --------------------------------------------------------------- */
export function watchRound(id, onChange) {
  const channel = supabase
    .channel('round:' + id)
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'rounds', filter: 'id=eq.' + id },
      (payload) => onChange(payload.new))
    .subscribe();

  const poll = setInterval(async () => {
    const row = await readRound(id);
    if (row) onChange(row);
  }, 2500);

  return () => {
    clearInterval(poll);
    supabase.removeChannel(channel);
  };
}
