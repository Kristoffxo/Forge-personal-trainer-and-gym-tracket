/* ---------------------------------------------------------------
   Messages between a client and Coach Sid.

   Real rows in Supabase, streamed over Realtime. There is no bot and
   no automatic reply — whatever a client sends waits for Sid to answer
   himself from the coach view.
   --------------------------------------------------------------- */
import { supabase } from './supabase';

let listeners = [];
let channel = null;

function shape(r) {
  return { id:String(r.id), userId:r.user_id, sender:r.sender,
           mine:r.sender === 'client', text:r.body,
           at:new Date(r.created_at).getTime() };
}
const emit = (m) => listeners.forEach((fn) => fn(m));

export function subscribe(fn) {
  listeners.push(fn);
  return () => { listeners = listeners.filter((l) => l !== fn); };
}

/* Watch for new rows and push them to whoever is listening. */
export function listen(onChange) {
  if (channel) supabase.removeChannel(channel);
  channel = supabase.channel('msgs')
    .on('postgres_changes', { event:'INSERT', schema:'public', table:'messages' },
        () => { onChange && onChange(); })
    .subscribe();
  return () => { if (channel) { supabase.removeChannel(channel); channel = null; } };
}

/* A client's own thread. RLS makes sure that is all they can see. */
export async function loadThread(userId) {
  let q = supabase.from('messages').select('*').order('created_at', { ascending:true }).limit(400);
  if (userId) q = q.eq('user_id', userId);
  const { data, error } = await q;
  if (error) return [];
  const msgs = data.map(shape);
  emit(msgs);
  return msgs;
}

export async function sendAsClient(userId, text) {
  const body = String(text || '').trim();
  if (!body) return null;
  const { error } = await supabase.from('messages')
    .insert({ user_id:userId, sender:'client', body });
  if (error) return { error: error.message };
  return loadThread(userId);
}

export async function sendAsCoach(userId, text) {
  const body = String(text || '').trim();
  if (!body) return null;
  const { error } = await supabase.from('messages')
    .insert({ user_id:userId, sender:'coach', body });
  if (error) return { error: error.message };
  return loadThread(userId);
}

/* Coach view: everyone who has ever written in, newest first. */
export async function listThreads() {
  const { data, error } = await supabase
    .from('messages').select('user_id, body, sender, created_at')
    .order('created_at', { ascending:false }).limit(600);
  if (error) return [];
  const seen = new Map();
  data.forEach((r) => {
    if (!seen.has(r.user_id)) {
      seen.set(r.user_id, { userId:r.user_id, last:r.body,
                            from:r.sender, at:new Date(r.created_at).getTime() });
    }
  });
  const rows = Array.from(seen.values());
  const ids = rows.map((r) => r.userId);
  if (ids.length) {
    const { data: profs } = await supabase.from('profiles')
      .select('id, full_name').in('id', ids);
    const byId = new Map((profs || []).map((p) => [p.id, p.full_name]));
    rows.forEach((r) => { r.name = byId.get(r.userId) || 'Client'; });
  }
  return rows;
}
