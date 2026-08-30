/* ---------------------------------------------------------------
   Client half of the food camera.

   Posts a photo to the app's own Worker, which holds the API key and
   talks to Claude. Nothing sensitive lives here.

   Every failure is turned into a plain sentence and a `kind` the
   screen can branch on, because "the camera is not switched on yet"
   and "you are offline" want very different buttons underneath them.
   --------------------------------------------------------------- */
import { supabase } from './supabase';
import { base64Of } from './photo';

export const VISION_URL = '/api/vision';

/* ---------------------------------------------------------------
   Reads a meal.

     photo   whatever pickPhoto() resolved with
     note    optional words from the person ("with two rotis")

   Resolves { items, confidence, note }. Rejects with an Error
   carrying .kind — one of:

     off        the key is not set on the Worker yet
     auth       signed out
     offline    the request never landed
     unreadable the model could not make sense of the picture
     failed     anything else
   --------------------------------------------------------------- */
export async function readMeal(photo, note) {
  const { data } = await supabase.auth.getSession();
  const token = data && data.session && data.session.access_token;
  if (!token) throw tagged('auth', 'Sign in to use the camera.');

  let res;
  try {
    res = await fetch(VISION_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer ' + token,
      },
      body: JSON.stringify({
        image: base64Of(photo.uri),
        mediaType: 'image/jpeg',
        note: note || '',
      }),
    });
  } catch (e) {
    throw tagged('offline', 'No connection. The photo did not send.');
  }

  let body = null;
  try {
    body = await res.json();
  } catch (e) {
    /* falls through to the status check below */
  }

  if (!res.ok) {
    const err = (body && body.error) || '';
    if (res.status === 503 || err === 'not_configured') {
      throw tagged('off', 'The food camera is not switched on yet.');
    }
    if (res.status === 401) throw tagged('auth', 'Sign in to use the camera.');
    if (res.status === 422 || res.status === 413) {
      throw tagged('unreadable', (body && body.message) || 'Could not read that photo.');
    }
    throw tagged('failed', (body && body.message) || 'Something went wrong. Try again.');
  }

  if (!body || !Array.isArray(body.items)) {
    throw tagged('failed', 'Something went wrong. Try again.');
  }

  return body;
}

function tagged(kind, message) {
  const e = new Error(message);
  e.kind = kind;
  return e;
}

/* Adds up a set of recognised items. */
export function sumItems(items) {
  return (items || []).reduce(
    (t, i) => ({
      kcal: t.kcal + (Number(i.kcal) || 0),
      protein: t.protein + (Number(i.protein) || 0),
      carbs: t.carbs + (Number(i.carbs) || 0),
      fat: t.fat + (Number(i.fat) || 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

/* Which meal a photo taken now most likely belongs to, so the camera
   opens on the right one instead of asking. */
export function mealForNow(d) {
  const h = (d || new Date()).getHours();
  if (h < 11) return 'Breakfast';
  if (h < 16) return 'Lunch';
  if (h < 21) return 'Dinner';
  return 'Snacks';
}
