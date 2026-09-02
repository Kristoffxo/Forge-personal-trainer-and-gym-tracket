/* ---------------------------------------------------------------
   Somebody else's profile.

   Opens from a name on Discover. It shows a first name, a level and
   the medals — the things worth seeing, and nothing that would make
   the feed feel like surveillance. There is no follower count, no
   post history and no way to message anyone, because none of those
   were asked for and each one is a moderation problem.
   --------------------------------------------------------------- */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { S, R, useTheme } from '../theme';
import { Press } from '../ui/kit';
import { useLang } from '../lang';
import { BadgeRow, StandingCard } from '../ui/medals';
import { publicProfile } from '../social';

export default function PersonSheet({ userId, name, onClose }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  const insets = useSafeAreaInsets();

  const [who, setWho] = useState(undefined);

  useEffect(() => {
    let gone = false;
    publicProfile(userId).then((p) => { if (!gone) setWho(p || null); });
    return () => { gone = true; };
  }, [userId]);


  return (
    <Modal transparent visible animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, S.lg) }]}>
        <View style={styles.grab} />

        {who === undefined ? (
          <ActivityIndicator color={C.gold} style={{ marginVertical: S.xl }} />
        ) : who === null ? (
          <View style={{ alignItems: 'center', paddingVertical: S.lg }}>
            <Text style={styles.who}>{name}</Text>
            <Text style={[T.small, { marginTop: 6, textAlign: 'center' }]}>
              {t('Nothing to show yet — this person has not finished a workout.')}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.top}>
              <View style={styles.avatar}>
                <Text style={styles.avatarTxt}>
                  {String(who.name || name || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.who}>{who.name || name}</Text>
            </View>

            <StandingCard days={who.days_trained || 0} />

            <View style={styles.medals}>
              <BadgeRow days={who.days_trained || 0} size={42} />
            </View>
          </>
        )}

        <Press onPress={onClose} scaleTo={0.97} style={styles.close}>
          <Text style={[T.small, { color: C.dim }]}>{t('Close')}</Text>
        </Press>
      </View>
    </Modal>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: C.bg,
    borderTopLeftRadius: R.lg, borderTopRightRadius: R.lg,
    paddingHorizontal: S.lg, paddingTop: S.sm,
    borderTopWidth: 1, borderTopColor: C.line,
    maxWidth: 560, alignSelf: 'center', width: '100%',
  },
  grab: {
    width: 38, height: 4, borderRadius: 2, backgroundColor: C.line,
    alignSelf: 'center', marginBottom: S.md,
  },
  top: { alignItems: 'center', marginBottom: S.md },
  avatar: {
    width: 54, height: 54, borderRadius: 27, backgroundColor: C.raised,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: C.gold, marginBottom: S.sm,
  },
  avatarTxt: { fontFamily: 'WorkSans_600SemiBold', fontSize: 24, color: C.gold },
  who: { fontFamily: 'WorkSans_600SemiBold', fontSize: 26, color: C.text },
  medals: { backgroundColor: C.surface, borderRadius: R.lg, padding: S.md, marginTop: S.md },
  close: { alignItems: 'center', paddingVertical: 14, marginTop: S.sm },
});
