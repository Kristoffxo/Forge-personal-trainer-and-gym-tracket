/* ---------------------------------------------------------------
   Getting a photo out of the phone.

   This is the web path deliberately. `<input type="file" accept="image/*">`
   with `capture` opens the camera directly on iOS Safari and Android
   Chrome, which means the feed and the food camera need no native
   module, no permissions plumbing and no rebuild of the APK. The app
   is shipping as an installable web app first, so this is the whole
   story for now; a native build would add expo-image-picker here and
   nothing above this file would change.

   Everything is downscaled before it leaves the device. A modern phone
   camera produces 4-6 MB per shot, which is slow to upload, expensive
   to store and far more than a 400 px feed image or a vision model
   needs. 1400 px on the long edge at q0.82 lands around 200-300 kB.
   --------------------------------------------------------------- */
import { Platform } from 'react-native';

export const CAN_TAKE_PHOTOS = Platform.OS === 'web' && typeof document !== 'undefined';

const MAX_EDGE = 1400;
const QUALITY = 0.82;

/* ---------------------------------------------------------------
   Opens the picker and resolves with the chosen photo, or null if
   the person backed out.

     camera: true   ask for the camera directly (a meal, right now)
     camera: false  let them choose camera or library

   Resolves { uri, blob, width, height } where uri is a data URL —
   usable straight away as an <Image source={{ uri }}> preview.
   --------------------------------------------------------------- */
export function pickPhoto({ camera = false, maxEdge = MAX_EDGE } = {}) {
  if (!CAN_TAKE_PHOTOS) {
    return Promise.reject(new Error('Photos need the web app for now.'));
  }

  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (camera) input.capture = 'environment';
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    document.body.appendChild(input);

    let settled = false;
    const done = (v) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(v);
    };

    input.onchange = () => {
      const file = input.files && input.files[0];
      if (!file) return done(null);
      shrink(file, maxEdge).then(done, (e) => { input.remove(); reject(e); });
    };

    /* There is no cancel event on a file input. Focus returning to the
       window without a change event means they dismissed the sheet —
       the timeout is because Safari fires focus before change. */
    const onFocus = () => {
      window.removeEventListener('focus', onFocus);
      setTimeout(() => { if (!input.files || !input.files.length) done(null); }, 600);
    };
    window.addEventListener('focus', onFocus);

    input.click();
  });
}

/* Draw the file into a canvas at a sane size and re-encode it. Also
   quietly strips EXIF, which is worth having on a public feed — phone
   photos carry GPS coordinates and this app promises no location. */
function shrink(file, maxEdge) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file is not an image.')); };
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, (maxEdge || MAX_EDGE) / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Could not read that photo.'));
          const reader = new FileReader();
          reader.onload = () => resolve({ uri: reader.result, blob, width: w, height: h });
          reader.onerror = () => reject(new Error('Could not read that photo.'));
          reader.readAsDataURL(blob);
        },
        'image/jpeg',
        QUALITY,
      );
    };

    img.src = url;
  });
}

/* The base64 half of a data URL, which is what an API wants. */
export function base64Of(dataUrl) {
  const i = String(dataUrl || '').indexOf(',');
  return i === -1 ? '' : dataUrl.slice(i + 1);
}
