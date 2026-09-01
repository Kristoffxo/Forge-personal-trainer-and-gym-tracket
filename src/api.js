/* ---------------------------------------------------------------
   Where the app's own endpoints live.

   On the web that is the page's own origin, so a relative path is
   right and stays right on any domain the app is served from.

   In an Android or iOS build there is no origin — `fetch('/api/x')`
   has nothing to be relative to and simply fails. So the native
   builds carry the address of the Worker, which is the one place in
   the app that has to be updated when a real domain replaces the
   workers.dev one.
   --------------------------------------------------------------- */
import { Platform } from 'react-native';

export const API_ORIGIN = 'https://nemea.thearyanbasantani.workers.dev';

/* '' on web, the Worker on a phone. */
export const API_BASE = Platform.OS === 'web' ? '' : API_ORIGIN;

export function api(path) {
  return API_BASE + path;
}
