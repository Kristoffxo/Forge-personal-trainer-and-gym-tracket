/* ---------------------------------------------------------------
   Getting a photo out of the phone.

   Two paths, one signature. Every caller gets back the same shape
   whichever it took, so nothing above this file knows the difference.

     web       <input type="file" accept="image/*">, which opens the
               camera directly on iOS Safari and Android Chrome
     native    expo-image-picker, and expo-image-manipulator to do the
               resizing that a canvas does on the web

   Everything is downscaled before it leaves the device. A modern
   phone camera produces 4-6 MB per shot, which is slow to upload,
   expensive to store and far more than a 400 px feed image needs.
   1400 px on the long edge at q0.82 lands around 200-300 kB.

   Both paths re-encode, which also drops the EXIF block. That is
   worth having on a public feed: phone photos carry GPS coordinates
   and this app promises no location.
   --------------------------------------------------------------- */
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

const isWeb = Platform.OS === 'web';

export const CAN_TAKE_PHOTOS = isWeb ? typeof document !== 'undefined' : true;

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
    return Promise.reject(new Error('This device cannot open the camera.'));
  }
  if (!isWeb) return pickNative({ camera, maxEdge });

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

/* ---------------------------------------------------------------
   The native path.

   Supabase Storage cannot take a file:// URI, and React Native has no
   Blob worth uploading, so the resized photo comes back as base64 and
   is decoded to an ArrayBuffer here. That is what the storage client
   wants on a phone.
   --------------------------------------------------------------- */
async function pickNative({ camera, maxEdge }) {
  const ask = camera
    ? ImagePicker.requestCameraPermissionsAsync
    : ImagePicker.requestMediaLibraryPermissionsAsync;

  const perm = await ask();
  if (!perm.granted) {
    throw new Error(camera
      ? 'Reppo needs permission to use the camera. Turn it on in Settings.'
      : 'Reppo needs permission to open your photos. Turn it on in Settings.');
  }

  const open = camera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
  const res = await open({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 1,          // resized and re-compressed below, so take it whole
  });

  if (res.canceled || !res.assets || !res.assets.length) return null;
  const shot = res.assets[0];

  const scale = Math.min(1, (maxEdge || MAX_EDGE) / Math.max(shot.width || 0, shot.height || 0) || 1);
  const w = Math.max(1, Math.round((shot.width || maxEdge) * scale));

  const out = await ImageManipulator.manipulateAsync(
    shot.uri,
    scale < 1 ? [{ resize: { width: w } }] : [],
    { compress: QUALITY, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  );

  return {
    uri: out.uri,
    blob: bytesOf(out.base64),
    width: out.width,
    height: out.height,
  };
}

/* base64 -> ArrayBuffer, without atob, which React Native does not
   reliably have. */
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function bytesOf(b64) {
  /* The '=' padding is stripped by the regex above, so the byte count
     comes straight from what is left — subtracting for the padding as
     well undercounts, and goes negative on a one-byte payload. */
  const clean = String(b64 || '').replace(/[^A-Za-z0-9+/]/g, '');
  const out = new Uint8Array((clean.length * 3) >> 2);
  let bits = 0, held = 0, at = 0;
  for (let i = 0; i < clean.length; i++) {
    held = (held << 6) | B64.indexOf(clean[i]);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[at++] = (held >> bits) & 0xff;
    }
  }
  return out.buffer;
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
