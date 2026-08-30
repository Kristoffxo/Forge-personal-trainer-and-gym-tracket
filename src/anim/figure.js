/* ---------------------------------------------------------------
   The little figure that shows you the movement.

   Built out of plain <View>s and rotations, for the same reason the
   calorie ring is: no SVG dependency, so the native side of the
   build stays untouched and the same code renders identically in a
   browser and in the APK.

   How it holds together
   ---------------------
   Every limb is a rounded rectangle anchored at one end, rotated
   about that end with `transformOrigin`, and carrying the next limb
   as a child positioned at its far end. Rotations therefore compose
   the way joints actually do: bend the thigh and the shin, foot and
   everything below come with it.

   Angles are in degrees, clockwise, and each is measured relative to
   its parent — which is also how anatomy measures them. The figure
   faces right.

     torso   0 upright, positive leans forward
     arm     0 hanging down the side, positive swings forward/up
             (relative to the torso, so a lean does not move it)
     elbow   0 straight, positive curls the hand toward the shoulder
     thigh   0 straight down, positive drives the knee forward
     knee    0 straight, positive folds the heel back

   Everything animates off one clock, `t`, running 0 -> 1 -> 0: 0 is
   the start of the rep, 1 is the end of the lift. Every angle is a
   plain interpolation of it, so the whole figure is one native
   animation and costs nothing per frame.
   --------------------------------------------------------------- */
import React, { useRef, useEffect, useMemo } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

/* Proportions, in stage units. The stage is 200 x 230. */
const P = {
  torso: 54,
  head: 15,
  upperArm: 30,
  foreArm: 28,
  thigh: 40,
  shin: 40,
  foot: 15,
  limb: 7,        // limb thickness
  trunk: 11,      // torso thickness
};

const STAGE_W = 200;
const STAGE_H = 230;
const GROUND_Y = 206;

/* Standing hip height, measured up from the ground. */
const HIP_Y = GROUND_Y - P.thigh - P.shin;

/* ---------------------------------------------------------------
   A limb. Anchored at its top edge and rotated about it, unless
   `up` is set, in which case it grows upward from its bottom edge —
   which is what the torso does.
   --------------------------------------------------------------- */
function Bone({ len, thick, angle, colour, up, children, round = true }) {
  const style = {
    position: 'absolute',
    width: thick,
    height: len,
    marginLeft: -thick / 2,
    borderRadius: round ? thick / 2 : 2,
    backgroundColor: colour,
    transform: [{ rotate: angle }],
  };

  if (up) {
    style.bottom = 0;
    style.transformOrigin = 'bottom center';
  } else {
    style.top = 0;
    style.transformOrigin = 'top center';
  }

  return (
    <Animated.View style={style}>
      {/* the far end, where whatever comes next hangs from */}
      <View style={{ position: 'absolute', left: thick / 2, top: up ? 0 : len }}>
        {children}
      </View>
    </Animated.View>
  );
}

/* A weight in the hands. It is drawn inside the forearm's rotated
   frame, so it is counter-rotated by everything above it to keep a
   barbell level with the floor the way a real one is. */
function Implement({ kind, counter, colour, accent, scale = 1 }) {
  if (!kind || kind === 'none') return null;

  const spin = { transform: [{ rotate: counter }] };
  const z = (n) => n * scale;

  if (kind === 'barbell') {
    return (
      <Animated.View style={[styles.centre, spin]}>
        <View style={[styles.bar, { backgroundColor: colour, width: z(96), height: z(4) }]} />
        <View style={[styles.plate, { backgroundColor: accent, left: z(-48), width: z(7), height: z(34) }]} />
        <View style={[styles.plate, { backgroundColor: accent, right: z(-48), width: z(7), height: z(34) }]} />
      </Animated.View>
    );
  }

  if (kind === 'dumbbell') {
    return (
      <Animated.View style={[styles.centre, spin]}>
        <View style={[styles.bar, { backgroundColor: colour, width: z(26), height: z(4) }]} />
        <View style={[styles.dbEnd, { backgroundColor: accent, left: z(-15), width: z(9), height: z(22) }]} />
        <View style={[styles.dbEnd, { backgroundColor: accent, right: z(-15), width: z(9), height: z(22) }]} />
      </Animated.View>
    );
  }

  if (kind === 'handle') {          // a cable attachment
    return (
      <Animated.View style={[styles.centre, spin]}>
        <View style={[styles.bar, { backgroundColor: accent, width: z(30), height: z(5) }]} />
      </Animated.View>
    );
  }

  return null;
}

/* ---------------------------------------------------------------
   The figure.

     pattern   one entry from patterns.js
     playing   false parks it at the start of the rep
     scale     stage units -> pixels
   --------------------------------------------------------------- */
export function Figure({ pattern, playing = true, scale = 1, tint }) {
  const { C } = useTheme();
  const t = useRef(new Animated.Value(0)).current;

  // Only the arms take the muscle colour. Tinting the whole figure made
  // it read as one orange blob with no readable joints.
  const body = C.dim;
  const accent = tint || C.ember;
  const kit = C.faint;

  useEffect(() => {
    t.stopAnimation();
    if (!playing) {
      Animated.timing(t, { toValue: 0, duration: 220, useNativeDriver: true }).start();
      return undefined;
    }

    const period = pattern.tempo || 2400;
    const hold = pattern.hold || 0;

    /* Out and back, with a pause at each end. A rep does not snap
       around at the top, and neither should this. */
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, {
          toValue: 1,
          duration: period * 0.42,
          easing: Easing.bezier(0.4, 0, 0.3, 1),
          useNativeDriver: true,
        }),
        Animated.delay(hold),
        Animated.timing(t, {
          toValue: 0,
          duration: period * 0.58,
          easing: Easing.bezier(0.4, 0, 0.3, 1),
          useNativeDriver: true,
        }),
        Animated.delay(hold * 0.4),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t, playing, pattern]);

  /* Every angle, as a degree string the transform can take.

     A CSS rotation is clockwise. For the torso, which grows upward,
     clockwise already means "lean forward". For every limb that
     grows downward it means the opposite, so those are negated here
     and the pattern data can be written the way a physiotherapist
     would say it: positive is flexion, forward, up. */
  const deg = useMemo(() => {
    const pair = (key, sign) => {
      const v = pattern[key] || [0, 0];
      return t.interpolate({
        inputRange: [0, 1],
        outputRange: [sign * v[0] + 'deg', sign * v[1] + 'deg'],
      });
    };
    return {
      torso: pair('torso', 1),
      arm: pair('arm', -1),
      elbow: pair('elbow', -1),
      thigh: pair('thigh', -1),
      knee: pair('knee', 1),
      head: pair('head', 1),
    };
  }, [pattern, t]);

  /* The hip travels as well as rotating — that is most of what a
     squat or a press actually looks like. */
  const px = (v) => (v || [0, 0]);
  const hipDX = t.interpolate({
    inputRange: [0, 1], outputRange: px(pattern.hipX).map((n) => n * scale),
  });
  const hipDY = t.interpolate({
    inputRange: [0, 1], outputRange: px(pattern.hipY).map((n) => n * scale),
  });

  /* Keep the bar level with the floor: undo every rotation above the
     hand. Signs must match the ones applied in `deg` above. */
  const counter = t.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1].map((i) => {
      const at = (pattern.torso || [0, 0])[i] || 0;
      const aa = (pattern.arm || [0, 0])[i] || 0;
      const ae = (pattern.elbow || [0, 0])[i] || 0;
      return (-(at - aa - ae)) + 'deg';
    }),
  });

  const s = (n) => n * scale;
  /* Patterns that live low in the frame can shorten it; everything
     inside shifts up by the same amount so the figure stays put. */
  const frameH = pattern.stageH || STAGE_H;
  const crop = STAGE_H - frameH;

  return (
    <View
      style={{
        width: s(STAGE_W), height: s(frameH),
        alignSelf: 'center', overflow: 'hidden',
      }}
    >
      {/* the floor, and the bench if the movement uses one */}
      {pattern.ground !== false ? (
        <View style={[styles.ground, {
          top: s(GROUND_Y - crop), left: s(18), width: s(STAGE_W - 36),
          backgroundColor: C.line,
        }]} />
      ) : null}

      {pattern.bench ? (
        <View style={[styles.bench, {
          top: s(GROUND_Y - 44 - crop), left: s(pattern.benchX == null ? 24 : pattern.benchX),
          width: s(pattern.benchW || 124), height: s(9),
          backgroundColor: C.line,
        }]} />
      ) : null}

      <Animated.View
        style={{
          position: 'absolute',
          left: s(pattern.hipAt == null ? 96 : pattern.hipAt),
          top: s(HIP_Y - crop),
          transform: [
            { translateX: hipDX },
            { translateY: hipDY },
          ],
        }}
      >
        {/* ---- upper body ---- */}
        <Bone len={s(P.torso)} thick={s(P.trunk)} angle={deg.torso} colour={body} up round={false}>
          {/* head sits above the shoulder */}
          <Animated.View
            style={{
              position: 'absolute',
              left: -s(P.head) / 2,
              top: -s(P.head) - s(3),
              width: s(P.head), height: s(P.head), borderRadius: s(P.head) / 2,
              backgroundColor: body,
              transform: [{ rotate: deg.head }],
            }}
          />
          <Bone len={s(P.upperArm)} thick={s(P.limb)} angle={deg.arm} colour={accent}>
            <Bone len={s(P.foreArm)} thick={s(P.limb)} angle={deg.elbow} colour={accent}>
              <Implement
                kind={pattern.implement} counter={counter}
                colour={kit} accent={accent} scale={scale}
              />
            </Bone>
          </Bone>
        </Bone>

        {/* ---- lower body ---- */}
        <Bone len={s(P.thigh)} thick={s(P.limb + 1)} angle={deg.thigh} colour={body}>
          <Bone len={s(P.shin)} thick={s(P.limb)} angle={deg.knee} colour={body}>
            <View style={{
              position: 'absolute', left: -s(3), top: -s(2),
              width: s(P.foot), height: s(4), borderRadius: s(2),
              backgroundColor: body,
            }} />
          </Bone>
        </Bone>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  ground: { position: 'absolute', height: 2, borderRadius: 1 },
  bench: { position: 'absolute', borderRadius: 3 },
  centre: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  bar: { position: 'absolute', height: 4, borderRadius: 2 },
  plate: { position: 'absolute', width: 7, height: 34, borderRadius: 3 },
  dbEnd: { position: 'absolute', width: 9, height: 22, borderRadius: 3 },
});
