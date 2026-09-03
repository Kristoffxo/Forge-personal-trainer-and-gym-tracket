/* ---------------------------------------------------------------
   Accounts. Real email + password, handled by Supabase Auth.
   Passwords are never stored by us and never touch this code —
   they go straight to Supabase, which hashes them.
   --------------------------------------------------------------- */
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

export const signOut = () => supabase.auth.signOut();

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session || null;
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
export async function getProfile() {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;

  for (let go = 0; go < 3; go++) {
    const { data } = await supabase.from('profiles').select('*').eq('id', u.user.id).maybeSingle();
    if (data) return data;
    await new Promise((r) => setTimeout(r, 120 * (go + 1)));
  }
  return { id: u.user.id, role: 'client' };
}

export async function saveProfile(patch) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  /* Upsert, not update: if the trigger has not run yet an update
     matches nothing and the answers are lost without an error. */
  const { data } = await supabase.from('profiles')
    .upsert({ id: u.user.id, ...patch }, { onConflict: 'id' })
    .select().single();
  return data;
}
