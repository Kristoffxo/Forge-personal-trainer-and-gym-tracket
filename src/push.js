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
import { journeyFrom } from './journey';
import * as Notifications from 'expo-notifications';
import { supabase } from './supabase';

/* What the app remembers about you and reminders, on this device.
     WANT  'off' once you have turned them off. Anything else is on.
     ASKED set once we have put the question to you, so we never
           put it twice. */
const WANT = 'nemea:push';        // see the note in src/lang.js
const ASKED = 'nemea:push-asked';
const HOUR_KEY = 'nemea:push-hour';   // the phone build keeps its own

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
  if (!isWeb) return true;          // a phone build schedules its own
  return 'serviceWorker' in navigator
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
  if (!isWeb) return null;          // the phone build handles its own
  const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (iOS && !isInstalled()) {
    return 'On iPhone, add Reppo to your home screen first — Share, then Add to Home Screen. '
      + 'Apple only allows notifications for installed apps.';
  }
  if (!canPush()) return 'This browser cannot do notifications.';
  return null;
}

export function permission() {
  if (!isWeb) return 'native';
  return canPush() ? Notification.permission : 'unsupported';
}

/* ---------------------------------------------------------------
   The phone build.

   An installed app cannot use the browser's push service, which is
   why the reminder simply never arrived in the APK. It does not need
   to: a daily reminder at a chosen hour is a thing the phone can
   schedule itself, and a local notification is more reliable than a
   push — it needs no network, no VAPID, and no server awake at six.

   One repeating trigger, cancelled and rewritten whenever the hour
   changes.
   --------------------------------------------------------------- */
const NATIVE_ID = 'reppo-daily';

/* What the reminder says.

   "A few minutes today" is true of every day forever, which is why
   nobody reads it twice. Naming the league and the number of days
   left gives the reminder a reason to exist today in particular —
   and the number goes down as they train, which the generic line
   could never do.

   `days` is how many days they have trained. It is optional: the
   reminder is scheduled the moment somebody switches it on, which
   can be before the app knows their total, so there is a plain line
   to fall back to. */
export function nudgeText(days) {
  if (days == null) {
    return { title: 'Reppo', body: 'A few minutes today. Open it and log something.' };
  }

  const me = journeyFrom(days);

  if (me.atTop) {
    return {
      title: 'Titan',
      body: 'You are at the top. Today is about staying there.',
    };
  }

  const left = me.toGo;
  const goal = me.next.name;

  /* one day out is worth its own sentence */
  if (left <= 1) {
    return { title: `1 day from ${goal}`, body: `Train today and ${goal} is yours.` };
  }

  return {
    title: `${left} days to ${goal}`,
    body: `Train ${left} more days for ${goal}. You can do it.`,
  };
}

async function scheduleNative(hour, days) {
  const nudge = nudgeText(days);
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
  await Notifications.setNotificationChannelAsync('daily', {
    name: 'Daily reminder',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 200, 100, 200],
  }).catch(() => {});

  await Notifications.scheduleNotificationAsync({
    identifier: NATIVE_ID,
    content: { title: nudge.title, body: nudge.body, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
      channelId: 'daily',
    },
  });
}

async function nativeEnable(hour, days) {
  const asked = await Notifications.requestPermissionsAsync();
  if (!asked.granted && asked.status !== 'granted') {
    return { error: 'Notifications are switched off for Reppo. Turn them on in your phone settings.' };
  }
  await scheduleNative(hour, days);
  await AsyncStorage.setItem(HOUR_KEY, String(hour)).catch(() => {});
  await remember(true);
  return { ok: true };
}

async function nativeDisable() {
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
  await remember(false);
  return { ok: true };
}

async function nativeIsOn() {
  if (!(await wanted())) return false;
  const perm = await Notifications.getPermissionsAsync().catch(() => null);
  if (!perm || !(perm.granted || perm.status === 'granted')) return false;
  const list = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
  return list.length > 0;
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
export async function enable(userId, hour = DEFAULT_HOUR, days = null) {
  if (!isWeb) return nativeEnable(hour, days);

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
  if (!isWeb) return nativeDisable();
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
  if (!isWeb) {
    const v = await AsyncStorage.getItem(HOUR_KEY).catch(() => null);
    const n = parseInt(v, 10);
    return HOURS.includes(n) ? n : DEFAULT_HOUR;
  }
  const endpoint = await myEndpoint();
  if (!endpoint) return DEFAULT_HOUR;
  const { data, error } = await supabase
    .from('push_subs').select('send_hour').eq('endpoint', endpoint).maybeSingle();
  if (error || !data || data.send_hour == null) return DEFAULT_HOUR;
  return data.send_hour;
}

export async function setHour(hour, days = null) {
  if (!isWeb) {
    await AsyncStorage.setItem(HOUR_KEY, String(hour)).catch(() => {});
    await scheduleNative(hour, days);
    return { ok: true };
  }
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

  if (!isWeb) {
    const perm = await Notifications.getPermissionsAsync().catch(() => null);
    if (perm && (perm.granted || perm.status === 'granted')) {
      if (await nativeIsOn()) return { on: true };
      const hour = await getHour();
      const r = await nativeEnable(hour);
      return r.ok ? { on: true } : { off: true };
    }
    if (perm && perm.status === 'denied' && !perm.canAskAgain) return { off: true };
    const asked = await AsyncStorage.getItem(ASKED).catch(() => null);
    return asked ? { off: true } : { ask: true };
  }

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
  if (!isWeb) return nativeIsOn();
  if (!canPush() || Notification.permission !== 'granted') return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    return !!(await reg.pushManager.getSubscription());
  } catch (e) {
    return false;
  }
}


/* ---------------------------------------------------------------
   Keep the reminder honest.

   The text names a league and a number of days, and both change as
   somebody trains — so the scheduled notification is rewritten with
   today's numbers each time the app knows them. Cheap: it cancels
   one trigger and sets another, on the device, with no network.

   Silent about everything. A reminder that failed to reschedule is
   not worth interrupting anybody over; the old text still fires.
   --------------------------------------------------------------- */
export async function refreshNudge(days) {
  if (isWeb || days == null) return;
  try {
    if (!(await wanted())) return;
    const perm = await Notifications.getPermissionsAsync();
    if (!perm || !(perm.granted || perm.status === 'granted')) return;
    await scheduleNative(await getHour(), days);
  } catch {
    /* nothing worth saying */
  }
}
