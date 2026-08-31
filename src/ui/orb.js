/* ---------------------------------------------------------------
   The glowing disc.

   A dark circle, a coloured ring, and a soft halo behind it. Used
   for the workout plans and the muscle groups, so both read as the
   same family of thing.

   The halo is three stacked circles at falling opacity rather than
   a shadow, because react-native-web renders box-shadow on a
   rounded View inconsistently across browsers and this looks the
   same everywhere.
   --------------------------------------------------------------- */
import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

export function Orb({ colour, size = 96, source, glyph, dim = false, style }) {
  const { C } = useTheme();
  const r = size / 2;
  const c = colour || C.ember;

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      {/* halo */}
      {!dim ? (
        <>
          <View style={[styles.halo, {
            width: size * 1.28, height: size * 1.28, borderRadius: size * 0.64,
            backgroundColor: c, opacity: 0.07,
          }]} />
          <View style={[styles.halo, {
            width: size * 1.12, height: size * 1.12, borderRadius: size * 0.56,
            backgroundColor: c, opacity: 0.10,
          }]} />
        </>
      ) : null}

      {/* the disc */}
      <View style={{
        width: size, height: size, borderRadius: r,
        backgroundColor: C.mode === 'light' ? '#FFFFFF' : '#0A0908',
        borderWidth: 2, borderColor: dim ? C.line : c,
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>
        {source ? (
          <Image
            source={source}
            style={{ width: size * 0.72, height: size * 0.72, tintColor: dim ? C.faint : c }}
            resizeMode="contain"
          />
        ) : (
          <Text style={{ fontSize: size * 0.34, color: dim ? C.faint : c }}>{glyph}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  halo: { position: 'absolute' },
});
