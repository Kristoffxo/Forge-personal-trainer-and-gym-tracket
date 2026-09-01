/* ---------------------------------------------------------------
   The camera half of counting reps.

   src/pose.js turns landmarks into a number and knows nothing about
   cameras. This turns a camera into landmarks and knows nothing
   about reps. They meet in Compete.

   MediaPipe's pose landmarker runs in the browser on WebGL, at the
   frame rate the camera gives it. Both the WASM and the model are
   served from this app's own origin — copied into the build by
   scripts/build-web.mjs — so there is no CDN in the path and it
   works on a phone that has already loaded the app once.

   Everything here is web-only. On a phone build there is no
   getUserMedia and no WASM backend; `poseAvailable()` says so and
   Compete falls back to counting by hand.
   --------------------------------------------------------------- */
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web' && typeof document !== 'undefined';

export function poseAvailable() {
  return isWeb
    && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    && typeof WebAssembly === 'object';
}

/* The model is five megabytes. Loaded once, kept for the session. */
let landmarker = null;
let loading = null;

async function getLandmarker() {
  if (landmarker) return landmarker;
  if (loading) return loading;

  loading = (async () => {
    /* Loaded at runtime rather than bundled. MediaPipe's own bundle
       calls import() with a computed string, which Metro refuses to
       parse — building the import through Function keeps it out of
       Metro's sight and lets the browser do what it was always going
       to do. The file is served from this app's own origin. */
    const load = new Function('u', 'return import(u)');
    const vision = await load('/mediapipe/vision_bundle.mjs');
    const fileset = await vision.FilesetResolver.forVisionTasks('/mediapipe');
    landmarker = await vision.PoseLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: '/models/pose_landmarker_lite.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    return landmarker;
  })();

  try {
    return await loading;
  } catch (e) {
    loading = null;
    throw e;
  }
}

/* ---------------------------------------------------------------
   Start the camera and call `onFrame(landmarks, timeMs)` for every
   frame it manages to read. Returns a stop function.

   Landmarks come back in MediaPipe's own shape — {x, y, z,
   visibility} in the 33-point order src/pose.js expects — so nothing
   in between has to translate.
   --------------------------------------------------------------- */
export async function startPose(video, onFrame, onError) {
  if (!poseAvailable()) {
    throw new Error('The camera counter needs the web app.');
  }

  const model = await getLandmarker();

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
    audio: false,
  });

  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;
  await video.play();

  let live = true;
  let lastAt = -1;

  const tick = () => {
    if (!live) return;
    try {
      /* MediaPipe wants a strictly increasing timestamp, and a paused
         or stalled video hands back the same one. */
      const t = performance.now();
      if (video.readyState >= 2 && video.currentTime !== lastAt) {
        lastAt = video.currentTime;
        const res = model.detectForVideo(video, t);
        const pts = res && res.landmarks && res.landmarks[0];
        onFrame(pts || null, t);
      }
    } catch (e) {
      if (onError) onError(e);
    }
    if (live) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  return () => {
    live = false;
    try { stream.getTracks().forEach((t) => t.stop()); } catch (e) { /* gone already */ }
    try { video.srcObject = null; } catch (e) { /* gone already */ }
  };
}

/* The bones worth drawing, so the overlay shows it is really
   watching rather than asserting it. */
export const BONES = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [24, 26], [26, 28],
];
