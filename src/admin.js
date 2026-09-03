/* ---------------------------------------------------------------
   The admin portal's data layer.

   Every read here goes through a security-definer function that
   begins by asking is_admin(). The check lives in the database, not
   in this file — anything in the app can be edited by whoever holds
   the phone, so a screen that simply declines to render is not a
   permission system. If somebody who is not an admin calls these,
   they get nothing back.

   Deleting an account is the exception: removing an auth.users row
   needs the service key, which only the Worker has. That call is
   below, and the Worker re-checks is_admin before it acts.
   --------------------------------------------------------------- */
import { supabase } from './supabase';
import { api } from './api';

/* Supabase returns a friendly-ish message for a missing function.
   Say which file fixes it rather than showing the raw text. */
function friendly(msg) {
  const m = String(msg || '');
  if (/does not exist|schema cache/i.test(m)) {
    return 'The admin portal is not set up on the database yet — run supabase-v9.sql.';
  }
  if (/not an admin/i.test(m)) return 'That account is not an admin.';
  return m || 'Something went wrong.';
}

export async function overview() {
  const { data, error } = await supabase.rpc('admin_overview');
  if (error) return { error: friendly(error.message) };
  const row = Array.isArray(data) ? data[0] : data;
  return { overview: row || null };
}

export async function listUsers({ q = '', limit = 50, offset = 0 } = {}) {
  const { data, error } = await supabase.rpc('admin_users', {
    q: q || null, lim: limit, off: offset,
  });
  if (error) return { error: friendly(error.message) };
  return { users: data || [] };
}

export async function userDetail(userId) {
  const { data, error } = await supabase.rpc('admin_user_detail', { uid: userId });
  if (error) return { error: friendly(error.message) };
  const row = Array.isArray(data) ? data[0] : data;
  return { detail: row || null };
}

export async function userPosts(userId, limit = 30) {
  const { data, error } = await supabase.rpc('admin_user_posts', { uid: userId, lim: limit });
  if (error) return { error: friendly(error.message) };
  return { posts: data || [] };
}

export async function setAdmin(userId, makeAdmin) {
  const { error } = await supabase.rpc('admin_set_admin', {
    uid: userId, make_admin: !!makeAdmin,
  });
  return error ? { error: friendly(error.message) } : { ok: true };
}

/* ---------------------------------------------------------------
   Removing somebody.

   Irreversible, and it takes their workouts, diary, posts and
   photographs with it — everything hangs off auth.users. The screen
   asks twice before calling this; this function does not ask at all,
   because a data-layer function that shows dialogs cannot be reused.
   --------------------------------------------------------------- */
export async function deleteUser(userId) {
  const { data } = await supabase.auth.getSession();
  const token = data && data.session && data.session.access_token;
  if (!token) return { error: 'You are signed out. Sign in again.' };

  let res;
  try {
    res = await fetch(api('/api/admin/delete-user'), {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
  } catch (e) {
    return { error: 'Could not reach the server. Check your connection.' };
  }

  if (res.ok) return { ok: true };

  const said = await res.json().catch(() => ({}));
  if (said.error === 'forbidden') return { error: 'You are not an admin.' };
  if (said.error === 'use_delete_account') {
    return { error: 'Use Settings to delete your own account.' };
  }
  if (said.error === 'not_configured') {
    return { error: 'The server has no service key set.' };
  }
  return { error: 'Could not delete that account.' };
}
