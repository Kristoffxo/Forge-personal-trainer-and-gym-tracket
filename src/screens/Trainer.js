/* ---------------------------------------------------------------
   Ask a trainer — not yet.

   This screen used to sell credits through Razorpay. That cannot
   ship on Google Play: selling digital goods inside an Android app
   has to go through Play Billing, and taking payment for them any
   other way is grounds for removal, not a warning.

   So the whole purchase path is gone from the app rather than
   hidden. There is no balance, no price, no button, and nothing on
   this screen that could take money. What is left says what the
   feature will be and that it is not here yet, which is the honest
   version of "coming soon".

   src/trainer.js still holds the credits and messaging code, and
   supabase-v4/v5 still hold their tables. Nothing was deleted —
   this is a door that is closed, not a room that was demolished.
   --------------------------------------------------------------- */
import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';

import { S, R, useTheme } from '../theme';
import { FadeIn, Label, useTabPad } from '../ui/kit';
import { useLang } from '../lang';
import { PHOTO } from '../photos';

export default function Trainer() {
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  const tabPad = useTabPad();

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: S.lg, paddingBottom: tabPad }}>
      <FadeIn>
        <View style={styles.card}>
          <Image source={PHOTO.bench} style={styles.hero} resizeMode="cover" />
          <View style={[styles.badge, { backgroundColor: C.teal }]}>
            <Text style={styles.badgeTxt}>{t('Coming soon')}</Text>
          </View>
        </View>
      </FadeIn>

      <FadeIn delay={60}>
        <Text style={styles.title}>{t('Ask a real trainer')}</Text>
        <Text style={[T.body, { marginTop: S.sm, fontSize: 16, lineHeight: 24 }]}>
          {t('Send a question. A person answers.')}
        </Text>

        <View style={styles.row}>
          <Text style={[styles.dot, { color: C.teal }]}>{'•'}</Text>
          <Text style={[T.bodyOn, styles.rowTxt]}>{t('Your form, from a photo or a video')}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.dot, { color: C.teal }]}>{'•'}</Text>
          <Text style={[T.bodyOn, styles.rowTxt]}>{t('A plan for your week')}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.dot, { color: C.teal }]}>{'•'}</Text>
          <Text style={[T.bodyOn, styles.rowTxt]}>{t('An old injury to train around')}</Text>
        </View>

        <Label style={{ marginTop: S.xl }}>{t('Not a bot')}</Label>
        <Text style={[T.small, { marginTop: 4 }]}>
          {t('A real person reads it and writes back.')}
        </Text>
      </FadeIn>
    </ScrollView>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  card: { borderRadius: R.md, overflow: 'hidden' },
  hero: { width: '100%', height: 168, backgroundColor: C.raised },
  badge: {
    position: 'absolute', top: S.md, left: S.md,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: R.pill,
  },
  badgeTxt: {
    fontFamily: 'WorkSans_600SemiBold', fontSize: 11.5, letterSpacing: 1,
    textTransform: 'uppercase', color: '#0B0B0E',
  },
  title: {
    fontFamily: 'WorkSans_600SemiBold', fontSize: 28, lineHeight: 33,
    color: C.text, marginTop: S.lg,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', marginTop: S.md },
  dot: { fontSize: 18, lineHeight: 24, marginRight: 10 },
  rowTxt: { flex: 1, fontSize: 16, lineHeight: 24 },
});
