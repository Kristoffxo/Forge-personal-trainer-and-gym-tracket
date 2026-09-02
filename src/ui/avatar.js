/* ---------------------------------------------------------------
   Somebody's picture.

   One component, used on the feed, in a race, and on a profile card,
   so a face looks the same wherever it turns up. Falls back to the
   first letter of a name — which is what almost everybody will see,
   because almost nobody sets a picture.
   --------------------------------------------------------------- */
import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { avatarUrl } from '../social';

export function Avatar({ name, path, at, size = 44, colour, style }) {
  const { C } = useTheme();
  const [failed, setFailed] = useState(false);
  const url = failed ? null : avatarUrl(path, at);
  const ring = colour || C.line;

  return (
    <View style={[{
      width: size, height: size, borderRadius: size / 2,
      borderWidth: 2, borderColor: ring, overflow: 'hidden',
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: C.surface,
    }, style]}>
      {url ? (
        <Image
          source={{ uri: url }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
          /* A picture that 404s — deleted, or the bucket went
             private — should show the letter, not a grey hole. */
          onError={() => setFailed(true)}
        />
      ) : (
        <Text style={[styles.letter, { fontSize: size * 0.4, color: colour || C.dim }]}>
          {String(name || '?').trim().charAt(0).toUpperCase() || '?'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  letter: { fontFamily: 'WorkSans_600SemiBold' },
});
