/* ---------------------------------------------------------------
   The Reppo mark.

   Both files are cuts of the supplied artwork, made by
   `node brand/render.mjs` from brand/reppo-logo-source.png — the
   black field is knocked out so the same file sits on either
   palette, but nothing is redrawn. Replace the source, re-run, and
   every icon in the app follows.
   --------------------------------------------------------------- */
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

const MARK = require('../../assets/brand/mark.png');
const LOCKUP = require('../../assets/brand/lockup.png');

/* The mark alone. Header bars and anywhere tight. */
export function Mark({ size = 28, style }) {
  return (
    <Image
      source={MARK}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
      accessibilityLabel="Reppo"
    />
  );
}

/* Mark over the REPPO wordmark.

   The supplied wordmark is white, so on dark the artwork goes in
   whole — that is the real thing, gradient and all. On light it
   would vanish, so there the mark goes in on its own and the word is
   set in the app's own type underneath.

   `onDark` is for the screens that are black whatever the theme is
   — the sign-in screen, chiefly. Reading the mode alone put a
   near-black wordmark on that near-black screen the day light became
   the default. */
export function Lockup({ width = 220, style, onDark = false }) {
  const { C } = useTheme();
  const styles = makeStyles(C);

  if (onDark || C.mode !== 'light') {
    return (
      <Image
        source={LOCKUP}
        style={[{ width, height: (width * 594) / 618 }, style]}
        resizeMode="contain"
        accessibilityLabel="Reppo"
      />
    );
  }

  return (
    <View style={[{ alignItems: 'center' }, style]}>
      <Mark size={width * 0.62} />
      <Text style={[styles.word, { fontSize: width * 0.15, letterSpacing: width * 0.055 }]}>
        REPPO
      </Text>
    </View>
  );
}

const makeStyles = (C) => StyleSheet.create({
  word: {
    fontFamily: 'WorkSans_500Medium',
    color: C.text,
    marginTop: 14,
    // letterSpacing pads the right edge too, so pull the block back
    // by half a space to keep it optically centred
    marginRight: -6,
  },
});
