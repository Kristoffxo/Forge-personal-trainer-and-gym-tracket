#!/usr/bin/env node
/* The rep counter, without a camera.

   Every one of these is a way the obvious implementation miscounts.
   Run with: node scripts/test-pose.mjs */
import { makeCounter, angleAt, MOVES, L, fromMoveNet } from '../src/pose.js';

let pass = 0, fail = 0;
const is = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++; else { fail++; console.log(`  FAIL ${name}\n    got  ${JSON.stringify(got)}\n    want ${JSON.stringify(want)}`); }
};

/* ---------------------------------------------------------------
   A body, posed to order.

   Builds the 33-point array with the joint bent to `deg`, so a test
   can say "now they are at 90 degrees" without hand-placing points.
   --------------------------------------------------------------- */
function body({ elbow = 180, knee = 180, torso = 180, vis = 1, missing = [] } = {}) {
  const pts = [];
  for (let i = 0; i < 33; i++) pts[i] = { x: 0, y: 0, visibility: vis };
  const put = (i, x, y) => { pts[i] = { x, y, visibility: vis }; };
  const rad = (d) => (d * Math.PI) / 180;

  /* Place `c` so that the angle a-b-c is exactly `deg`.
     b->a points straight up, so b->c is that vector turned by deg:
     rotating (0,-1) by t gives (sin t, -cos t). */
  const swing = (b, deg, len = 1) => {
    const t = rad(deg);
    return [b[0] + Math.sin(t) * len, b[1] - Math.cos(t) * len];
  };

  for (const side of ['left', 'right']) {
    const s = side === 'left' ? 0 : 1;     // the two sides sit apart

    /* arm: shoulder above elbow, wrist swung out by `elbow` */
    put(L[side + 'Shoulder'], s, 0);
    put(L[side + 'Elbow'], s, 1);
    const [wx, wy] = swing([s, 1], elbow);
    put(L[side + 'Wrist'], wx, wy);

    /* torso: hip below shoulder, knee swung by `torso` */
    put(L[side + 'Hip'], s, 2);
    const [kx, ky] = swing([s, 2], torso);
    put(L[side + 'Knee'], kx, ky);

    /* leg: ankle swung from the knee by `knee`, measured against
       knee->hip so the geometry holds wherever the knee ended up */
    const hx = s - kx, hy = 2 - ky;             // knee -> hip
    const base = Math.atan2(hx, -hy);           // its bearing
    const t = base + rad(knee);
    put(L[side + 'Ankle'], kx + Math.sin(t), ky - Math.cos(t));
  }

  missing.forEach((k) => { pts[L[k]] = { x: 0, y: 0, visibility: 0 }; });
  return pts;
}

/* Sanity: does the harness actually produce the angle it claims? */
console.log('the test harness itself');
for (const deg of [40, 90, 100, 150, 179]) {
  const p = body({ elbow: deg });
  const got = angleAt(p[L.leftShoulder], p[L.leftElbow], p[L.leftWrist]);
  is(`elbow ${deg}`, Math.round(got), deg);
}
for (const deg of [60, 115, 160]) {
  const p = body({ knee: deg });
  const got = angleAt(p[L.leftHip], p[L.leftKnee], p[L.leftAnkle]);
  is(`knee ${deg}`, Math.round(got), deg);
}

/* A rep, as a sequence of frames. */
function rep(c, { top = 170, bottom = 70, at = 0, step = 60, joint = 'elbow' } = {}) {
  let t = at;
  const frames = [];
  for (let a = top; a >= bottom; a -= 20) frames.push(a);
  for (let a = bottom; a <= top; a += 20) frames.push(a);
  let last = null;
  for (const a of frames) {
    last = c.push(body({ [joint]: a }), t);
    t += step;
  }
  return { end: t, last };
}

console.log('counting');
{
  const c = makeCounter('pushups');
  let t = 0;
  for (let i = 0; i < 5; i++) t = rep(c, { at: t }).end + 200;
  is('five press-ups', c.reps, 5);
}
{
  const c = makeCounter('squats');
  let t = 0;
  for (let i = 0; i < 3; i++) t = rep(c, { at: t, joint: 'knee', top: 175, bottom: 80 }).end + 200;
  is('three squats', c.reps, 3);
}

console.log('the four ways it miscounts');

/* 1. jitter at the threshold */
{
  const c = makeCounter('pushups');
  let t = 0;
  for (let i = 0; i < 40; i++) {
    c.push(body({ elbow: i % 2 ? 99 : 101 }), t);
    t += 40;
  }
  is('jitter at the down threshold counts nothing', c.reps, 0);
}
{
  const c = makeCounter('pushups');
  let t = 0;
  for (let i = 0; i < 40; i++) {
    c.push(body({ elbow: i % 2 ? 149 : 151 }), t);
    t += 40;
  }
  is('jitter at the up threshold counts nothing', c.reps, 0);
}

/* 2. half reps */
{
  const c = makeCounter('pushups');
  let t = 0;
  for (let i = 0; i < 6; i++) {
    for (const a of [170, 140, 125, 140, 170]) { c.push(body({ elbow: a }), t); t += 60; }
  }
  is('dipping to 125 is not a press-up', c.reps, 0);
}

/* 3. impossible speed */
{
  const c = makeCounter('pushups');
  let t = 0;
  for (let i = 0; i < 6; i++) {
    for (const a of [170, 60, 170]) { c.push(body({ elbow: a }), t); t += 30; }
  }
  is('three frames per rep is a glitch, not a person', c.reps, 0);
}
{
  /* the same movement, at human speed, does count */
  const c = makeCounter('pushups');
  let t = 0;
  for (let i = 0; i < 3; i++) {
    for (const a of [170, 60, 60, 170]) { c.push(body({ elbow: a }), t); t += 300; }
  }
  is('the same movement slowly does count', c.reps, 3);
}

/* 4. guessing when it cannot see */
{
  const c = makeCounter('pushups');
  let t = 0;
  for (let i = 0; i < 6; i++) {
    for (const a of [170, 60, 170]) {
      c.push(body({ elbow: a, missing: ['leftWrist', 'rightWrist'] }), t);
      t += 300;
    }
  }
  is('no wrists, no counting', c.reps, 0);
  is('and it says so', c.push(body({ elbow: 90, missing: ['leftWrist', 'rightWrist'] }), t).visible, false);
}
{
  const c = makeCounter('pushups');
  is('low confidence is not a sighting',
    c.push(body({ elbow: 90, vis: 0.2 }), 0).visible, false);
}
{
  /* one side hidden is fine — a phone on the floor sees one arm */
  const c = makeCounter('pushups');
  let t = 0;
  for (let i = 0; i < 3; i++) {
    for (const a of [170, 60, 60, 170]) {
      c.push(body({ elbow: a, missing: ['rightShoulder', 'rightElbow', 'rightWrist', 'rightHip'] }), t);
      t += 300;
    }
  }
  is('one arm is enough', c.reps, 3);
}

console.log('and one more');
{
  /* somebody sitting in a chair bending their elbows makes the same
     elbow angle as a press-up */
  const c = makeCounter('pushups');
  let t = 0;
  for (let i = 0; i < 4; i++) {
    for (const a of [170, 60, 60, 170]) {
      c.push(body({ elbow: a, torso: 90 }), t);
      t += 300;
    }
  }
  is('folded at the hips is not a press-up', c.reps, 0);
}
{
  /* squats do not check the torso — you fold at the hip on purpose */
  const c = makeCounter('squats');
  let t = 0;
  for (let i = 0; i < 3; i++) {
    for (const a of [175, 80, 80, 175]) { c.push(body({ knee: a }), t); t += 300; }
  }
  is('squats still count while folded', c.reps, 3);
}

console.log('housekeeping');
{
  const c = makeCounter('pushups');
  let t = 0;
  for (let i = 0; i < 3; i++) t = rep(c, { at: t }).end + 200;
  c.reset();
  is('reset clears', c.reps, 0);
  is('phase back to up', c.phase, 'up');
}
is('unknown move throws', (() => { try { makeCounter('nope'); return false; } catch (e) { return true; } })(), true);
is('nothing in, nothing out', makeCounter('squats').push(null, 0).visible, false);
is('both moves are described', Object.keys(MOVES).sort(), ['pushups', 'squats']);

/* ---------------------------------------------------------------
   The other model.

   A phone runs MoveNet, which speaks COCO's seventeen points in
   (y, x, score) order. The counter only ever sees BlazePose's
   thirty-three. If this mapping is wrong the phone counts nothing
   and says it cannot see you, which is a maddening thing to debug on
   a device — so it is checked here instead.
   --------------------------------------------------------------- */
console.log('MoveNet to BlazePose');
{
  /* a flat array of 17 * (y, x, score), each point marked so its
     origin is recoverable */
  const raw = [];
  for (let i = 0; i < 17; i++) raw.push(i / 100, 1 - i / 100, 0.9);
  const pts = fromMoveNet(raw);

  is('thirty-three slots out', pts.length, 33);
  const pairs = [
    [5, 'leftShoulder'], [6, 'rightShoulder'], [7, 'leftElbow'], [8, 'rightElbow'],
    [9, 'leftWrist'], [10, 'rightWrist'], [11, 'leftHip'], [12, 'rightHip'],
    [13, 'leftKnee'], [14, 'rightKnee'], [15, 'leftAnkle'], [16, 'rightAnkle'],
  ];
  for (const [coco, name] of pairs) {
    is(`coco ${coco} lands on ${name}`,
      [pts[L[name]].y, pts[L[name]].x], [coco / 100, 1 - coco / 100]);
  }
  is('score becomes visibility', pts[L.leftShoulder].visibility, 0.9);
  is('unused slots stay empty', pts[0], null);
  is('a short array is nothing', fromMoveNet([1, 2, 3]), null);
  is('nothing is nothing', fromMoveNet(null), null);
}
{
  /* and the whole chain: MoveNet numbers in, reps out */
  const c = makeCounter('squats');
  const frame = (kneeDeg) => {
    const raw = new Array(51).fill(0);
    const put = (coco, x, y) => {
      raw[coco * 3] = y; raw[coco * 3 + 1] = x; raw[coco * 3 + 2] = 0.9;
    };
    const t = (kneeDeg * Math.PI) / 180;
    put(11, 0, 0.2); put(12, 0.1, 0.2);            // hips
    put(13, 0, 0.5); put(14, 0.1, 0.5);            // knees
    /* ankle swung from the knee so hip-knee-ankle is kneeDeg */
    /* y grows downward, so knee->hip is (0,-1) and swinging it by t
       gives (sin t, -cos t) */
    put(15, Math.sin(t) * 0.3, 0.5 - Math.cos(t) * 0.3);
    put(16, 0.1 + Math.sin(t) * 0.3, 0.5 - Math.cos(t) * 0.3);
    return fromMoveNet(raw);
  };
  let t = 0;
  for (let i = 0; i < 3; i++) {
    for (const a of [175, 80, 80, 175]) { c.push(frame(a), t); t += 300; }
  }
  is('MoveNet frames count reps', c.reps, 3);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
