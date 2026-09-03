/* ---------------------------------------------------------------
   A small word when somebody likes or comments on your photograph.

   In-app only, and quiet: it slides in under the title bar, says
   what happened, and goes away on its own. There is no push here on
   purpose — the one notification this app sends is the daily
   reminder somebody asked for, and adding "Aryan liked your photo"
   to a phone's lock screen is the beginning of an app that buzzes.

   What counts as seen is kept on the device rather than the server.
   It is a read marker, not a fact about anybody, and a person who
   signs in on a second phone would rather be told twice than not at
   all.
   --------------------------------------------------------------- */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { S, R, useTheme } from '../theme';
import { Press } from './kit';
import { useLang } from '../lang';
import { myActivity } from '../social';

const SEEN = 'reppo:activity-seen';

/* How it reads with one, two, or a pile. */
function phrase(rows, t) {
  const likes = rows.filter((r) => r.kind === 'like');
  const comments = rows.filter((r) => r.kind === 'comment');
  const first = rows[0];

  if (rows.length === 1) {
    return first.kind === 'like'
      ? `${first.name} ${t('liked your photo')}`
      : `${first.name} ${t('commented on your photo')}`;
  }
  if (likes.length && !comments.length) {
    return `${first.name} ${t('and')} ${likes.length - 1} ${t('others liked your photo')}`;
  }
  if (comments.length && !likes.length) {
    return `${comments.length} ${t('new comments on your photo')}`;
  }
  return `${likes.length} ${t('likes and')} ${comments.length} ${t('comments on your photo')}`;
}

export function ActivityBanner({ user, onOpen }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);

  const [rows, setRows] = useState([]);
  const drop = useRef(new Animated.Value(0)).current;
  const timer = useRef(null);

  const hide = useCallback(async () => {
    /* Marking as seen is what dismisses it — otherwise it comes
       straight back the next time anything checks. */
    await AsyncStorage.setItem(SEEN, new Date().toISOString()).catch(() => {});
    Animated.timing(drop, {
      toValue: 0, duration: 220, easing: Easing.in(Easing.quad), useNativeDriver: true,
    }).start(() => setRows([]));
  }, [drop]);

  const check = useCallback(async () => {
    if (!user || !user.id) return;
    const since = await AsyncStorage.getItem(SEEN).catch(() => null);

    /* First run: mark now as seen and say nothing. Opening the app
       for the first time and being told about three months of likes
       is not a welcome. */
    if (!since) {
      await AsyncStorage.setItem(SEEN, new Date().toISOString()).catch(() => {});
      return;
    }

    const found = await myActivity(since);
    if (!found.length) return;
    setRows(found);
    Animated.timing(drop, {
      toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true,
    }).start();

    /* Six seconds, then away. Long enough to read, short enough not
       to be in the way of the thing they opened the app to do. */
    clearTimeout(timer.current);
    timer.current = setTimeout(hide, 6000);
  }, [user, drop, hide]);

  useEffect(() => {
    check();
    /* and once more every few minutes while the app is open */
    const id = setInterval(check, 4 * 60 * 1000);
    return () => { clearInterval(id); clearTimeout(timer.current); };
  }, [check]);

  if (!rows.length) return null;

  return (
    <Animated.View
      style={[styles.wrap, {
        opacity: drop,
        transform: [{ translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) }],
      }]}
    >
      <Press
        onPress={() => { hide(); if (onOpen) onOpen(); }}
        scaleTo={0.985}
        style={styles.card}
      >
        <Text style={[styles.heart, { color: C.ember }]}>{'♥'}</Text>
        <Text style={[T.bodyOn, { flex: 1, fontSize: 14, marginLeft: 10 }]} numberOfLines={2}>
          {phrase(rows, t)}
        </Text>
        <Press onPress={hide} hitSlop={14} scaleTo={0.85}>
          <Text style={[T.small, { color: C.dim, paddingLeft: 8 }]}>{'×'}</Text>
        </Press>
      </Press>
    </Animated.View>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, top: 0, zIndex: 40, padding: S.md },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: R.md,
    borderWidth: 1, borderColor: C.line, padding: S.md,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  heart: { fontSize: 16 },
});
