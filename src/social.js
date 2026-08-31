/* ---------------------------------------------------------------
   The feed.

   Deliberately small: a photo, a first name, a caption, and
   comments. There is no username, no handle, no location, no
   follower graph and no like count — the only thing identifying a
   post is the poster's first name, which is what was asked for and
   also the least a photo-sharing feature can collect.

   Blocking is enforced by the database (see supabase-upgrade.sql),
   not here, so a blocked person's rows never reach this file.
   --------------------------------------------------------------- */
import { supabase } from './supabase';

export const PAGE = 12;
const BUCKET = 'posts';

/* Only ever show the first word of a name. Someone who signed up as
   "Aryan Basantani" appears as "Aryan". */
export function firstNameOf(full) {
  const s = String(full || '').trim();
  if (!s) return 'Someone';
  return s.split(/\s+/)[0].slice(0, 24);
}

export function imageUrl(path) {
  if (!path) return null;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data ? data.publicUrl : null;
}

/* ---------------------------------------------------------------
   Reading the feed.

   `before` is the created_at of the oldest post already on screen,
   which is what makes "load more" work without offsets drifting as
   people post.
   --------------------------------------------------------------- */
/* The start of today, UTC — the same day boundary the unique index uses. */
export function utcDayStart(d) {
  const t = d || new Date();
  return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate())).toISOString();
}

/* Has this person already posted today? */
export async function postedToday(userId) {
  const { data, error } = await supabase
    .from('posts')
    .select('id, created_at')
    .eq('user_id', userId)
    .gte('created_at', utcDayStart())
    .limit(1);
  return !error && !!(data && data.length);
}

export async function loadFeed({ before } = {}) {
  let q = supabase
    .from('posts')
    .select('id, user_id, name, image_path, caption, created_at')
    .order('created_at', { ascending: false })
    .limit(PAGE);

  if (before) q = q.lt('created_at', before);

  const { data, error } = await q;
  if (error) return { posts: [], counts: {}, error: friendly(error.message) };

  const posts = data || [];
  return { posts, counts: await commentCounts(posts.map((p) => p.id)), error: null };
}

/* One round trip for every count on screen, rather than one per post. */
async function commentCounts(ids) {
  if (!ids.length) return {};
  const { data, error } = await supabase.from('comments').select('post_id').in('post_id', ids);
  if (error) return {};
  const out = {};
  (data || []).forEach((c) => { out[c.post_id] = (out[c.post_id] || 0) + 1; });
  return out;
}

/* ---------------------------------------------------------------
   Posting.

   The photo goes to storage first. If the row insert then fails the
   image is removed again, so a failed post cannot leave an orphan
   file sitting in the bucket forever.
   --------------------------------------------------------------- */
export async function createPost({ userId, name, blob, caption }) {
  const clean = String(caption || '').trim().slice(0, 300);
  const who = firstNameOf(name);

  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

  const up = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (up.error) return { error: friendly(up.error.message) };

  const { data, error } = await supabase
    .from('posts')
    .insert({ user_id: userId, name: who, image_path: path, caption: clean })
    .select()
    .single();

  if (error) {
    await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
    return { error: friendly(error.message) };
  }
  return { post: data };
}

export async function deletePost(post) {
  const { error } = await supabase.from('posts').delete().eq('id', post.id);
  if (error) return { error: friendly(error.message) };
  // best effort — the row is what the feed reads, so a stray file is harmless
  await supabase.storage.from(BUCKET).remove([post.image_path]).catch(() => {});
  return {};
}

/* ---------------------------------------------------------------
   Comments
   --------------------------------------------------------------- */
export async function loadComments(postId) {
  const { data, error } = await supabase
    .from('comments')
    .select('id, post_id, user_id, name, body, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  return error ? [] : (data || []);
}

export async function addComment({ postId, userId, name, body }) {
  const text = String(body || '').trim().slice(0, 400);
  if (!text) return { error: 'Write something first.' };

  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, user_id: userId, name: firstNameOf(name), body: text })
    .select()
    .single();

  return error ? { error: friendly(error.message) } : { comment: data };
}

export async function deleteComment(id) {
  const { error } = await supabase.from('comments').delete().eq('id', id);
  return error ? { error: friendly(error.message) } : {};
}

/* ---------------------------------------------------------------
   Moderation. Both stores require a way to report and a way to
   block before they will list an app carrying user photographs.
   --------------------------------------------------------------- */
export async function report({ reporterId, postId, commentId, reason }) {
  const { error } = await supabase.from('reports').insert({
    reporter: reporterId,
    post_id: postId || null,
    comment_id: commentId || null,
    reason: String(reason || '').slice(0, 200),
  });
  return error ? { error: friendly(error.message) } : {};
}

export async function blockUser({ blockerId, blockedId }) {
  const { error } = await supabase
    .from('blocks')
    .insert({ blocker: blockerId, blocked: blockedId });
  // already blocked is not a failure worth showing
  if (error && !String(error.message).includes('duplicate')) {
    return { error: friendly(error.message) };
  }
  return {};
}

/* ---------------------------------------------------------------
   Likes, which nobody can trace.

   The database lets you read your own like and nobody else's, so
   the app can never learn who liked a post even if it wanted to.
   Totals come from a security-definer function that returns counts
   and no identities at all.
   --------------------------------------------------------------- */
export async function likeCounts(ids) {
  if (!ids || !ids.length) return {};
  const { data, error } = await supabase.rpc('like_counts', { ids });
  if (error) return {};
  const out = {};
  (data || []).forEach((r) => { out[r.post_id] = Number(r.n) || 0; });
  return out;
}

/* Which of these did I like? Only ever my own rows come back. */
export async function myLikes(userId, ids) {
  if (!ids || !ids.length) return new Set();
  const { data, error } = await supabase
    .from('likes').select('post_id').eq('user_id', userId).in('post_id', ids);
  return error ? new Set() : new Set((data || []).map((r) => r.post_id));
}

export async function setLike(postId, userId, on) {
  if (on) {
    const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: userId });
    // already liked is not a failure
    return !error || String(error.message).includes('duplicate');
  }
  const { error } = await supabase
    .from('likes').delete().eq('post_id', postId).eq('user_id', userId);
  return !error;
}

/* ---------------------------------------------------------------
   Other people's standing.

   Both of these go through security-definer functions that return
   a first name, a level and the medals — and cannot return height,
   weight or anything else on the profile row.
   --------------------------------------------------------------- */
export async function publicProfile(uid) {
  const { data, error } = await supabase.rpc('public_profile', { uid });
  if (error || !data || !data.length) return null;
  return data[0];
}

export async function leaderboard(top = 20) {
  const { data, error } = await supabase.rpc('leaderboard', { top });
  return error ? [] : (data || []);
}

/* ---------------------------------------------------------------
   Moderation, for whoever runs the app.

   `is_admin` on the profile is what unlocks this; the database
   enforces it, so a forged flag in the client buys nothing.
   --------------------------------------------------------------- */
export async function loadAllPosts({ limit = 60 } = {}) {
  const { data, error } = await supabase
    .from('posts')
    .select('id, user_id, name, image_path, caption, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  return error ? [] : (data || []);
}

export async function loadReports() {
  const { data, error } = await supabase
    .from('reports')
    .select('id, reporter, post_id, comment_id, reason, created_at')
    .order('created_at', { ascending: false })
    .limit(60);
  return error ? [] : (data || []);
}

/* How many days a post has left before the nightly job removes it. */
export function daysLeft(iso) {
  const gone = new Date(iso).getTime() + 7 * 86400000;
  const days = Math.ceil((gone - Date.now()) / 86400000);
  return Math.max(0, days);
}

function friendly(message) {
  const m = String(message || '').toLowerCase();
  // Every "the database has not been migrated yet" shape, in one place.
  if (m.includes('schema cache') || m.includes('could not find the table')
      || m.includes('does not exist') || m.includes('row-level security')
      || m.includes('policy') || m.includes('bucket')) {
    return 'The feed tables are not in the database yet — run supabase-upgrade.sql '
      + 'in the Supabase SQL editor and this page will work.';
  }
  if (m.includes('posts_one_a_day') || (m.includes('duplicate key') && m.includes('posts'))) {
    return 'You have already posted today. One a day — come back tomorrow.';
  }
  if (m.includes('exceeded') || m.includes('too large')) return 'That photo is too big.';
  if (m.includes('network') || m.includes('fetch')) return 'No connection.';
  return message || 'Something went wrong.';
}

/* How long ago, in the fewest words. */
export function ago(iso) {
  const then = new Date(iso).getTime();
  if (!isFinite(then)) return '';
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h';
  const days = Math.floor(hrs / 24);
  if (days < 7) return days + 'd';
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
