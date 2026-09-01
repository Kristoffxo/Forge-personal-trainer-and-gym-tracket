/* ---------------------------------------------------------------
   Counting reps from a pose.

   This file holds the part that has to be correct, and nothing that
   touches a camera. It takes a stream of body landmarks — wherever
   they came from — and turns it into a number.

   THE PROBLEM WITH THE OBVIOUS APPROACH

   The obvious approach is "angle below X means down, above Y means
   up, count on the way up". It miscounts in four ways, and each of
   the guards below exists because of one of them:

     1. Jitter at the threshold. A landmark wobbling either side of
        the line counts ten reps in one second. Fixed by hysteresis:
        the angle to go down is not the angle to come up.

     2. Half reps. Dipping two degrees past the threshold and back
        counts the same as going all the way down. Fixed by
        requiring a real range: the rep only lands if the angle
        actually travelled far enough between the two ends.

     3. Speed that is not human. A landmark jumping because somebody
        walked behind you counts a rep. Fixed by a refractory
        period — nobody does a press-up in a quarter of a second.

     4. Guessing when it cannot see. Landmarks come with a
        confidence, and out-of-frame ones are confidently wrong.
        Fixed by refusing to update the state at all when the joints
        this movement needs are not visible.

   Everything here is deterministic and takes its own timestamps, so
   it can be tested without a camera — see scripts/test-pose.mjs.
   --------------------------------------------------------------- */

/* BlazePose's 33 points, the ones we use. */
export const L = {
  leftShoulder: 11, rightShoulder: 12,
  leftElbow: 13, rightElbow: 14,
  leftWrist: 15, rightWrist: 16,
  leftHip: 23, rightHip: 24,
  leftKnee: 25, rightKnee: 26,
  leftAnkle: 27, rightAnkle: 28,
};

/* The angle at `b`, in degrees, between a-b and c-b. */
export function angleAt(a, b, c) {
  if (!a || !b || !c) return null;
  const abx = a.x - b.x, aby = a.y - b.y;
  const cbx = c.x - b.x, cby = c.y - b.y;
  const dot = abx * cbx + aby * cby;
  const mag = Math.hypot(abx, aby) * Math.hypot(cbx, cby);
  if (!mag) return null;
  const cos = Math.min(1, Math.max(-1, dot / mag));
  return (Math.acos(cos) * 180) / Math.PI;
}

const seen = (p, min) => !!p && (p.visibility === undefined || p.visibility >= min);

/* ---------------------------------------------------------------
   What each movement watches.

     joints    the three points whose angle is the movement
     down/up   the two ends, in degrees, with a gap between them
     travel    how much of the range a rep has to actually cover
     needs     the points that must be visible to say anything
   --------------------------------------------------------------- */
export const MOVES = {
  pushups: {
    name: 'Push-ups',
    joints: [['leftShoulder', 'leftElbow', 'leftWrist'], ['rightShoulder', 'rightElbow', 'rightWrist']],
    needs: ['leftShoulder', 'leftElbow', 'leftWrist', 'leftHip'],
    needsAlt: ['rightShoulder', 'rightElbow', 'rightWrist', 'rightHip'],
    down: 100,
    up: 150,
    travel: 35,
    /* a press-up is done with a straight-ish body: if the hips have
       folded, this is somebody sitting down, not pressing */
    torso: true,
  },
  squats: {
    name: 'Squats',
    joints: [['leftHip', 'leftKnee', 'leftAnkle'], ['rightHip', 'rightKnee', 'rightAnkle']],
    needs: ['leftHip', 'leftKnee', 'leftAnkle'],
    needsAlt: ['rightHip', 'rightKnee', 'rightAnkle'],
    down: 115,
    up: 160,
    travel: 30,
    torso: false,
  },
};

/* Nobody does a rep in less than this. */
const REFRACTORY_MS = 450;

/* Nor does anybody spend less than this at the bottom of one. A dip
   shorter than this is a landmark glitch, not a person. */
const MIN_BOTTOM_MS = 150;

/* Below this the landmark is a guess, not an observation. */
const MIN_VISIBILITY = 0.55;

/* ---------------------------------------------------------------
   One counter, for one round.

   push(landmarks, tMs) -> {
     reps      how many so far
     phase     'up' | 'down'
     angle     the angle it is watching, or null if it cannot see
     visible   whether the joints it needs are in frame
     counted   true only on the frame a rep landed
     depth     0-1, how far into the rep you are, for a progress ring
   }
   --------------------------------------------------------------- */
export function makeCounter(moveKey, opts = {}) {
  const move = MOVES[moveKey];
  if (!move) throw new Error('unknown move: ' + moveKey);

  const minVis = opts.minVisibility === undefined ? MIN_VISIBILITY : opts.minVisibility;
  const refractory = opts.refractoryMs === undefined ? REFRACTORY_MS : opts.refractoryMs;
  const minBottom = opts.minBottomMs === undefined ? MIN_BOTTOM_MS : opts.minBottomMs;

  let reps = 0;
  let phase = 'up';
  let lastRepAt = -Infinity;
  let wentDownAt = 0;
  let deepest = null;          // the lowest angle reached this descent

  /* Whichever side is better seen. A phone on the floor usually has
     one arm far clearer than the other, and averaging the two lets
     the bad one drag the good one across a threshold. */
  function angleOf(pts) {
    let best = null;
    for (const [a, b, c] of move.joints) {
      const pa = pts[L[a]], pb = pts[L[b]], pc = pts[L[c]];
      if (!seen(pa, minVis) || !seen(pb, minVis) || !seen(pc, minVis)) continue;
      const v = angleAt(pa, pb, pc);
      if (v === null) continue;
      const conf = Math.min(
        pa.visibility === undefined ? 1 : pa.visibility,
        pb.visibility === undefined ? 1 : pb.visibility,
        pc.visibility === undefined ? 1 : pc.visibility,
      );
      if (!best || conf > best.conf) best = { v, conf };
    }
    return best ? best.v : null;
  }

  function canSee(pts) {
    const ok = (list) => list.every((k) => seen(pts[L[k]], minVis));
    return ok(move.needs) || ok(move.needsAlt);
  }

  /* A press-up is done with a straight-ish body. Somebody sitting
     down and bending their elbows makes the same elbow angle. Only
     checked when the hip and knee are actually visible — refusing to
     count because a knee is out of frame would be worse. */
  function torsoOk(pts) {
    if (!move.torso) return true;
    for (const side of ['left', 'right']) {
      const sh = pts[L[side + 'Shoulder']];
      const hip = pts[L[side + 'Hip']];
      const knee = pts[L[side + 'Knee']];
      if (!seen(sh, minVis) || !seen(hip, minVis) || !seen(knee, minVis)) continue;
      const a = angleAt(sh, hip, knee);
      if (a !== null) return a >= 140;
    }
    return true;      // cannot tell, so do not stand in the way
  }

  function depthOf(angle) {
    const span = move.up - move.down;
    if (span <= 0) return 0;
    return Math.min(1, Math.max(0, (move.up - angle) / span));
  }

  return {
    get reps() { return reps; },
    get phase() { return phase; },
    reset() {
      reps = 0; phase = 'up'; lastRepAt = -Infinity; wentDownAt = 0; deepest = null;
    },

    push(pts, tMs) {
      const t = tMs === undefined ? 0 : tMs;
      const blind = { reps, phase, angle: null, visible: false, counted: false, depth: 0 };

      if (!pts || !canSee(pts)) return blind;
      const angle = angleOf(pts);
      if (angle === null) return blind;

      let counted = false;

      if (phase === 'up') {
        if (angle <= move.down && torsoOk(pts)) {
          phase = 'down';
          wentDownAt = t;
          deepest = angle;
        }
      } else {
        deepest = deepest === null ? angle : Math.min(deepest, angle);

        if (angle >= move.up) {
          const travelled = angle - deepest;
          const longEnough = t - wentDownAt >= minBottom;
          const rested = t - lastRepAt >= refractory;

          if (travelled >= move.travel && longEnough && rested && torsoOk(pts)) {
            reps += 1;
            counted = true;
            lastRepAt = t;
          }
          phase = 'up';
          deepest = null;
        }
      }

      return { reps, phase, angle, visible: true, counted, depth: depthOf(angle) };
    },
  };
}
