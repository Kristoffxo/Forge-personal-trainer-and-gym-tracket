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
import { parseDuration } from '../duration';

/* `fit` is 'cover' on cards, where the box is small and a filled
   frame looks right, and 'contain' anywhere the movement itself is
   the point. A gym photograph is landscape; covering a tall
   portrait box with one crops it to a vertical strip through the
   middle and cuts off the head and the feet, which is no use at all
   when the whole question is what the movement looks like. */
export function Demo({ exercise, playing = true, height = 240, fit = 'cover', style }) {
  const { C } = useTheme();
  const all = framesFor(exercise);
  const fade = useRef(new Animated.Value(0)).current;

  /* A hold has nothing to flip between.

     The database gives two photographs per movement, the start and
     the end. For a plank the start is the man kneeling down to get
     into it, so cross-fading the pair showed him climbing into a
     plank and back out of it, over and over, for forty-five seconds
     — which is not what a plank is. A held position gets the end
     frame on its own and stays still. */
  const held = !!parseDuration(exercise && exercise.s);
  const frames = held && all && all.length ? [all[all.length - 1]] : all;

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
          style={styles.fill} resizeMode={fit} />
      </View>
    );
  }

  return (
    <View style={box}>
      <Image source={frames[0]} style={styles.fill} resizeMode={fit} />
      {frames[1] ? (
        <Animated.Image source={frames[1]} style={[styles.fill, { opacity: fade }]}
          resizeMode={fit} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: '100%', overflow: 'hidden' },
  fill: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
});
