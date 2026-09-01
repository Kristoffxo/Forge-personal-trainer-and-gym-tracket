/* ---------------------------------------------------------------
   The daily notification.

   Subscribes to push and stores the subscription in Supabase so the
   Worker knows where to send, and at what hour. The push itself
   carries no payload — the service worker picks the quote — so
   nothing about you ever travels with it.

   It is on by default. That is a deliberate choice and it has one
   honest limit: a browser will not let an app grant itself
   permission to interrupt you. What "on by default" can mean is

     - if you have already allowed notifications, this signs the
       device up on its own, with no button to find
     - if you have not been asked yet, you are asked once, plainly,
       and never again if you say no

   Turning it off in Settings is remembered on the device and stops
   both of those for good.

   On iPhone none of it works until the app is on the home screen.
   That is Apple's rule, not ours, and `whyNot()` says so in words
   rather than failing silently.
   --------------------------------------------------------------- */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

/* What the app remembers about you and reminders, on this device.
     WANT  'off' once you have turned them off. Anything else is on.
     ASKED set once we have put the question to you, so we never
           put it twice. */
const WANT = 'nemea:push';
const ASKED = 'nemea:push-asked';

export const DEFAULT_HOUR = 18;          // six in the evening, India time

/* The hours worth offering. Nobody wants a philosopher at 3am. */
export const HOURS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

/* 18 -> "6:00 pm". The app is used in India, where the twelve-hour
   clock is what people say out loud. */
export function hourLabel(h) {
  const am = h < 12;
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return `${twelve}:00 ${am ? 'am' : 'pm'}`;
}

export async function wanted() {
  const v = await AsyncStorage.getItem(WANT).catch(() => null);
  return v !== 'off';
}

async function remember(on) {
  await AsyncStorage.setItem(WANT, on ? 'on' : 'off').catch(() => {});
}

/* Public half of the VAPID pair. The private half is a Worker
   secret and never reaches the browser. */
export const VAPID_PUBLIC =
  'BHWdjEaZBWDvdCYcNCyAzRY8Uah78rVKfCA7vEnCbaO3elsxXpyUPN5YQG2k-277M1OxDCe8KERaZaThruSu6e8';

const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';

export function canPush() {
  return isWeb
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window;
}

/* Safari only exposes PushManager to an installed web app. */
export function isInstalled() {
  if (!isWeb) return false;
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

/* Why the button cannot be offered, in a sentence, or null if it can. */
export function whyNot() {
  if (!isWeb) return 'Notifications need the web app.';
  const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (iOS && !isInstalled()) {
    return 'On iPhone, add Nemea to your home screen first — Share, then Add to Home Screen. '
      + 'Apple only allows notifications for installed apps.';
  }
  if (!canPush()) return 'This browser cannot do notifications.';
  return null;
}

export function permission() {
  return canPush() ? Notification.permission : 'unsupported';
}

/* base64url -> Uint8Array, which is the only shape subscribe() takes */
function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/* ---------------------------------------------------------------
   Turn it on. Resolves { ok } or { error } — never throws at the
   caller, because every failure here has a sentence worth showing.
   --------------------------------------------------------------- */
export async function enable(userId, hour = DEFAULT_HOUR) {
  const why = whyNot();
  if (why) return { error: why };

  let granted;
  try {
    granted = await Notification.requestPermission();
  } catch (e) {
    return { error: 'The browser refused the request.' };
  }
  if (granted !== 'granted') {
    return { error: 'Notifications are switched off for this site. Turn them on in your browser settings.' };
  }

  const reg = await navigator.serviceWorker.ready;

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    try {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });
    } catch (e) {
      return { error: 'Could not subscribe: ' + (e && e.message ? e.message : 'unknown') };
    }
  }

  const json = sub.toJSON();
  const { error } = await supabase.from('push_subs').upsert({
    endpoint: sub.endpoint,
    user_id: userId,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
    send_hour: hour,
  }, { onConflict: 'endpoint' });

  if (error) {
    if (/send_hour/i.test(error.message)) {
      return { error: 'The reminder time is not set up on the database yet — run supabase-v6.sql.' };
    }
    if (/schema cache|does not exist/i.test(error.message)) {
      return { error: 'Notifications are not set up on the database yet — run supabase-v2.sql.' };
    }
    return { error: error.message };
  }

  await remember(true);
  return { ok: true };
}

export async function disable(userId) {
  await remember(false);
  if (!canPush()) return { ok: true };
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    await supabase.from('push_subs').delete().eq('endpoint', sub.endpoint);
    await sub.unsubscribe().catch(() => {});
  }
  return { ok: true };
}

/* ---------------------------------------------------------------
   What time.

   Kept against this device's subscription rather than the account,
   because the reminder arrives on a device — somebody with a phone
   and a laptop can reasonably want different answers.
   --------------------------------------------------------------- */
async function myEndpoint() {
  if (!canPush()) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return sub ? sub.endpoint : null;
  } catch (e) {
    return null;
  }
}

export async function getHour() {
  const endpoint = await myEndpoint();
  if (!endpoint) return DEFAULT_HOUR;
  const { data, error } = await supabase
    .from('push_subs').select('send_hour').eq('endpoint', endpoint).maybeSingle();
  if (error || !data || data.send_hour == null) return DEFAULT_HOUR;
  return data.send_hour;
}

export async function setHour(hour) {
  const endpoint = await myEndpoint();
  if (!endpoint) return { error: 'Turn the reminder on first.' };

  const { error } = await supabase
    .from('push_subs').update({ send_hour: hour }).eq('endpoint', endpoint);

  if (error) {
    if (/send_hour|column/i.test(error.message)) {
      return { error: 'The reminder time is not set up on the database yet — run supabase-v6.sql.' };
    }
    return { error: error.message };
  }
  return { ok: true };
}

/* ---------------------------------------------------------------
   On by default, as far as a browser allows.

   Returns one of:
     { on: true }      already signed up, or just signed up silently
     { ask: true }     worth putting the question, and we have not
     { off: true }     they said no, or this device cannot
   --------------------------------------------------------------- */
export async function autoStart(userId) {
  if (!(await wanted())) return { off: true };
  if (whyNot()) return { off: true };

  if (Notification.permission === 'denied') return { off: true };

  if (Notification.permission === 'granted') {
    if (await isOn()) return { on: true };
    const r = await enable(userId);      // no prompt: permission is already given
    return r.ok ? { on: true } : { off: true };
  }

  /* permission is 'default' — the browser will only ask off the back
     of something the person did, so this has to go through the UI */
  const asked = await AsyncStorage.getItem(ASKED).catch(() => null);
  if (asked) return { off: true };
  return { ask: true };
}

/* Called once the question has been put, whatever the answer. */
export async function markAsked() {
  await AsyncStorage.setItem(ASKED, '1').catch(() => {});
}

/* Is this device already signed up? */
export async function isOn() {
  if (!canPush() || Notification.permission !== 'granted') return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    return !!(await reg.pushManager.getSubscription());
  } catch (e) {
    return false;
  }
}
