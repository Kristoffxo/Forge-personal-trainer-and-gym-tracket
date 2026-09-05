/* ---------------------------------------------------------------
   Accounts. Real email + password, handled by Supabase Auth.
   Passwords are never stored by us and never touch this code —
   they go straight to Supabase, which hashes them.
   --------------------------------------------------------------- */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from './supabase';

function friendly(message) {
  const m = String(message || '').toLowerCase();
  if (m.includes('invalid login')) return 'Wrong email or password.';
  if (m.includes('already registered')) return 'That email already has an account. Sign in instead.';
  if (m.includes('password should be')) return 'Password needs at least 6 characters.';
  if (m.includes('unable to validate email')) return 'That does not look like a valid email.';
  if (m.includes('email not confirmed')) return 'Check your inbox and confirm your email first.';
  if (m.includes('network')) return 'No internet connection.';
  return message || 'Something went wrong. Try again.';
}

export async function signUp(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { full_name: (fullName || '').trim() } },
  });
  if (error) return { error: friendly(error.message) };
  if (!data.session) return { needsConfirm: true };
  return { user: data.user };
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(), password,
  });
  if (error) return { error: friendly(error.message) };
  return { user: data.user };
}

/* Clear the cached profile too. Leaving it behind would hand the
   next person to sign in on this phone the last one's answers. */
export const signOut = async () => {
  await forgetProfile();
  return supabase.auth.signOut();
};

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session || null;
}

/* Where a reset link should land. On the web that is wherever the
   app is being served from; on a phone there is nothing to open but
   the web app, which is the right place to set a password anyway. */
function backTo() {
  if (typeof window !== 'undefined' && window.location) return window.location.origin;
  return 'https://nemea.thearyanbasantani.workers.dev';
}

export async function sendReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(
    String(email || '').trim(), { redirectTo: backTo() },
  );
  return error ? { error: friendly(error.message) } : { ok: true };
}

export async function setPassword(password) {
  const { error } = await supabase.auth.updateUser({ password });
  return error ? { error: friendly(error.message) } : { ok: true };
}

/* Fires when somebody arrives on a reset link, so App can show the
   set-a-new-password screen instead of the app. */
export function onRecovery(fn) {
  const { data } = supabase.auth.onAuthStateChange((e) => {
    if (e === 'PASSWORD_RECOVERY') fn();
  });
  return () => data.subscription.unsubscribe();
}

export function onAuthChange(fn) {
  const { data } = supabase.auth.onAuthStateChange((_e, session) => fn(session));
  return () => data.subscription.unsubscribe();
}

/* profile row — name, coach flag, height/weight/goal */
/* A profile row is created by a trigger on auth.users. Straight
   after signing up that trigger may not have committed yet, so the
   first read comes back empty — and returning a stub meant the
   onboarding answers were written with an UPDATE that matched no
   rows and silently did nothing. Ask a few times, briefly, then give
   up and let the upsert in saveProfile create the row. */
/* ---------------------------------------------------------------
   Your profile, and why this is more careful than it looks.

   This used to end `return { id, role: 'client' }` after three
   failed reads. That object has no `onboarded`, so App read it as
   false and asked every onboarding question again — on a phone that
   had been using the app for weeks. A slow cold start on a bad line
   was enough to do it, which is exactly when somebody reopens an app
   they have not touched for a while.

   The distinction that fixes it: `maybeSingle` returns no data and
   no error when the row genuinely is not there, and an error when we
   could not find out. Those are not the same thing and must not be
   answered the same way.

   Every profile that arrives is also kept on the device, so a cold
   start with no signal shows the app you had rather than a
   questionnaire.
   --------------------------------------------------------------- */
const PROFILE_CACHE = 'reppo.profile.v1';

async function cacheProfile(row) {
  if (!row || !row.id) return row;
  try { await AsyncStorage.setItem(PROFILE_CACHE, JSON.stringify(row)); } catch { /* ignore */ }
  return row;
}

async function cachedProfile(id) {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_CACHE);
    const row = raw ? JSON.parse(raw) : null;
    return row && row.id === id ? row : null;
  } catch {
    return null;
  }
}

export async function forgetProfile() {
  try { await AsyncStorage.removeItem(PROFILE_CACHE); } catch { /* ignore */ }
}

export async function getProfile() {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;

  let failed = false;
  for (let go = 0; go < 3; go++) {
    const { data, error } = await supabase
      .from('profiles').select('*').eq('id', u.user.id).maybeSingle();
    if (data) return cacheProfile(data);
    if (!error) { failed = false; break; }   // no row, and we know it
    failed = true;
    await new Promise((r) => setTimeout(r, 120 * (go + 1)));
  }

  if (failed) {
    /* We could not read it. The last copy we saw is the best answer;
       anything invented here costs somebody their answers. */
    const cached = await cachedProfile(u.user.id);
    if (cached) return cached;
    /* Never seen it and cannot reach it — say so rather than
       guessing. App shows a retry instead of onboarding. */
    return { id: u.user.id, unknown: true };
  }

  /* The row really is not there yet. That happens for about a second
     after signing up, while the trigger runs, and onboarding is the
     right screen for it. */
  return { id: u.user.id, role: 'client' };
}

/* ---------------------------------------------------------------
   Saving your answers, and the bug that made this ugly.

   This was an `update`. It was changed to an `upsert` to survive the
   second after signing up, when the trigger that creates the profile
   row has not run yet and an update matches nothing. That change
   broke every save instead.

   PostgREST sends an upsert as INSERT ... ON CONFLICT DO UPDATE, and
   Postgres checks the INSERT policy for that statement whether or not
   the row is already there. `profiles` has policies for select and
   update and none for insert — so every upsert was refused, the error
   was thrown away, and onboarding asked the same questions on every
   launch because the answers never reached the table.

   So: update first, which is what the existing policy allows and what
   works in every case except the one-second race. Only if that
   matches nothing do we try to insert the row, and only then does the
   missing policy matter. The error comes back either way now; the
   caller is not allowed to carry on as if it worked.
   --------------------------------------------------------------- */
export async function saveProfile(patch) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { error: 'Not signed in.' };
  const id = u.user.id;

  const up = await supabase.from('profiles')
    .update(patch).eq('id', id).select().maybeSingle();
  if (up.data) return { data: await cacheProfile(up.data) };
  if (up.error) return { error: friendly(up.error.message) };

  /* No row yet — the trigger has not caught up. */
  const ins = await supabase.from('profiles')
    .upsert({ id, ...patch }, { onConflict: 'id' }).select().single();
  if (ins.data) return { data: await cacheProfile(ins.data) };
  return { error: friendly(ins.error && ins.error.message) };
}

