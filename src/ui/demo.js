/* ---------------------------------------------------------------
   What the exercise actually looks like.

   Two photographs — the start of the movement and the end — cross-
   faded back and forth. It is a flip-book rather than a video, but
   it shows a real person doing the real lift, which the stick figure
   this replaces never did.

   Photographs come from free-exercise-db (public domain). Anything
   the database has no photo for falls back to a still of the muscle
   being trained, so the screen is never empty.
   --------------------------------------------------------------- */
import React, { useRef, useEffect } from 'react';
import { View, Image, Animated, Easing, StyleSheet } from 'react-native';
import { useTheme, R } from '../theme';
import { framesFor } from '../exercisePhotos';
import { photoForMuscle } from '../photos';

export function Demo({ exercise, playing = true, height = 240, style }) {
  const { C } = useTheme();
  const frames = framesFor(exercise);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!frames || frames.length < 2 || !playing) {
      fade.setValue(0);
      return undefined;
    }
    /* Hold each end of the movement, and move between them quickly —
       that is what the lift looks like. A slow cross-fade reads as a
       dissolve rather than a rep. */
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(620),
        Animated.timing(fade, {
          toValue: 1, duration: 260, easing: Easing.inOut(Easing.quad), useNativeDriver: true,
        }),
        Animated.delay(620),
        Animated.timing(fade, {
          toValue: 0, duration: 260, easing: Easing.inOut(Easing.quad), useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [frames, playing, fade]);

  const box = [styles.box, { height, backgroundColor: C.raised, borderRadius: R.md }, style];

  if (!frames || !frames.length) {
    return (
      <View style={box}>
        <Image source={photoForMuscle(exercise && exercise.m)}
          style={styles.fill} resizeMode="cover" />
      </View>
    );
  }

  return (
    <View style={box}>
      <Image source={frames[0]} style={styles.fill} resizeMode="cover" />
      {frames[1] ? (
        <Animated.Image source={frames[1]} style={[styles.fill, { opacity: fade }]}
          resizeMode="cover" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: '100%', overflow: 'hidden' },
  fill: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
});
