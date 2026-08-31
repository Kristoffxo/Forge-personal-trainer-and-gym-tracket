/* ---------------------------------------------------------------
   The six o'clock notification.

   Asks the browser for permission, subscribes to push, and stores
   the subscription in Supabase so the nightly Worker knows where to
   send. The push itself carries no payload — the service worker
   picks the quote — so nothing about you ever travels with it.

   On iPhone this only works once the app has been added to the home
   screen. That is Apple's rule, not ours, and `whyNot()` says so in
   words rather than failing silently.
   --------------------------------------------------------------- */
import { Platform } from 'react-native';
import { supabase } from './supabase';

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
export async function enable(userId) {
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
  }, { onConflict: 'endpoint' });

  if (error) {
    if (/schema cache|does not exist/i.test(error.message)) {
      return { error: 'Notifications are not set up on the database yet — run supabase-v2.sql.' };
    }
    return { error: error.message };
  }
  return { ok: true };
}

export async function disable(userId) {
  if (!canPush()) return { ok: true };
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    await supabase.from('push_subs').delete().eq('endpoint', sub.endpoint);
    await sub.unsubscribe().catch(() => {});
  }
  return { ok: true };
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
