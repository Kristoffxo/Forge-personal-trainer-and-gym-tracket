/* ---------------------------------------------------------------
   The Nemea mark.

   assets/brand/mark.png is the supplied logo with its cream field
   knocked out, so the same file sits on either palette. Both pieces
   of artwork are cut from brand/nemea-logo-source.png by
   `node brand/render.mjs` — replace that file and re-run, and every
   icon in the app follows.
   --------------------------------------------------------------- */
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

const MARK = require('../../assets/brand/mark.png');
const LOCKUP = require('../../assets/brand/lockup.png');

/* Just the ring and the N. Use in headers and anywhere tight. */
export function Mark({ size = 28, style }) {
  return (
    <Image
      source={MARK}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
      accessibilityLabel="Nemea"
    />
  );
}

/* Mark over the NEMEA wordmark.

   The supplied lockup's wordmark is near-black, which disappears on
   the dark palette, so on dark we render the mark and set the word
   ourselves in the app's own type. Same lockup, legible either way. */
export function Lockup({ width = 220, style }) {
  const { C } = useTheme();
  const styles = makeStyles(C);

  if (C.mode === 'light') {
    return (
      <Image
        source={LOCKUP}
        style={[{ width, height: (width * 694) / 894 }, style]}
        resizeMode="contain"
        accessibilityLabel="Nemea — fuel, track, progress"
      />
    );
  }

  return (
    <View style={[{ alignItems: 'center' }, style]}>
      <Mark size={width * 0.42} />
      <Text style={[styles.word, { fontSize: width * 0.15, letterSpacing: width * 0.055 }]}>
        NEMEA
      </Text>
      <View style={styles.strapRow}>
        <View style={styles.rule} />
        <Text style={styles.strap}>FUEL</Text>
        <Text style={styles.dot}>{'·'}</Text>
        <Text style={styles.strap}>TRACK</Text>
        <Text style={styles.dot}>{'·'}</Text>
        <Text style={styles.strap}>PROGRESS</Text>
        <View style={styles.rule} />
      </View>
    </View>
  );
}

const makeStyles = (C) => StyleSheet.create({
  word: {
    fontFamily: 'WorkSans_400Regular',
    color: C.text,
    marginTop: 14,
    // letterSpacing pads the right edge too, so pull the block back
    // by half a space to keep it optically centred
    marginRight: -6,
  },
  strapRow: { flexDirection: 'row', alignItems: 'center', marginTop: 9 },
  rule: { width: 26, height: 1, backgroundColor: C.gold, marginHorizontal: 9 },
  strap: {
    fontFamily: 'WorkSans_400Regular', fontSize: 9.5,
    letterSpacing: 2.6, color: C.dim,
  },
  dot: { color: C.gold, fontSize: 10, marginHorizontal: 7 },
});
