/* ---------------------------------------------------------------
   A countdown, for the moves that are held rather than counted.

   Plank for forty-five seconds, Child's Pose for ninety — those are
   the ones people were timing on a separate app, or not timing at
   all and guessing. The number is the whole widget: tap it to start,
   tap it to pause, and there is a small reset beside it.

   It buzzes once when it lands. Vibration is in React Native itself,
   so this needs nothing installed, and it is a no-op on the web.
   --------------------------------------------------------------- */
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Vibration, Platform } from 'react-native';
import { S, R, useTheme } from '../theme';
import { useLang } from '../lang';
import { clock } from '../duration';

export function Timer({ seconds, eachSide, tint }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);

  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(false);
  const endsAt = useRef(0);

  /* Counted off a wall-clock deadline rather than by adding up ticks:
     a setInterval that is throttled in a background tab would
     otherwise run slow, and a timer that lies is worse than none. */
  useEffect(() => {
    if (!running) return undefined;
    endsAt.current = Date.now() + left * 1000;

    const id = setInterval(() => {
      const remaining = Math.max(0, (endsAt.current - Date.now()) / 1000);
      setLeft(remaining);
      if (remaining <= 0) {
        setRunning(false);
        if (Platform.OS !== 'web') Vibration.vibrate(400);
      }
    }, 100);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  /* a different exercise, a different hold */
  useEffect(() => { setLeft(seconds); setRunning(false); }, [seconds]);

  const done = left <= 0;
  const colour = done ? C.lime : tint;

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => (done ? (setLeft(seconds), setRunning(true)) : setRunning(!running))}
        style={({ pressed }) => [
          styles.face,
          { borderColor: colour },
          pressed && { opacity: 0.8 },
        ]}
      >
        <Text style={[styles.time, { color: colour }]}>{clock(left)}</Text>
        <Text style={styles.hint}>
          {done ? t('Tap to go again') : running ? t('Tap to pause') : t('Tap to start')}
        </Text>
      </Pressable>

      <View style={{ flex: 1, marginLeft: S.md }}>
        <Text style={[T.bodyOn, { fontSize: 15 }]}>
          {eachSide ? t('Hold each side') : t('Hold it')}
        </Text>
        <Text style={T.tiny}>
          {eachSide
            ? t('Run it once for each side.')
            : t('Breathe. Stop if anything sharpens.')}
        </Text>
        {left !== seconds || running ? (
          <Pressable onPress={() => { setRunning(false); setLeft(seconds); }} hitSlop={10}>
            <Text style={[styles.reset, { color: C.dim }]}>{t('Reset')}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: R.md, padding: S.md, marginTop: S.md,
  },
  face: {
    width: 118, paddingVertical: 12, borderRadius: R.md, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', backgroundColor: C.raised,
  },
  time: { fontFamily: 'WorkSans_600SemiBold', fontSize: 30, lineHeight: 34 },
  hint: { fontFamily: 'WorkSans_400Regular', fontSize: 10.5, color: C.faint, marginTop: 2 },
  reset: { fontFamily: 'WorkSans_500Medium', fontSize: 13, marginTop: 8 },
});
