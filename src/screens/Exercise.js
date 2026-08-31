/* ---------------------------------------------------------------
   One exercise, full screen.

   Deliberately almost empty. A photograph of the movement, what it
   trains, and one button.

   There is no set logging here any more. Writing numbers down
   mid-set is a thing serious lifters do in a notebook and everybody
   else abandons in week two — and it made this screen a form. The
   advice that replaces it is the advice that actually matters:
   pick a weight you can control, and add to it slowly.
   --------------------------------------------------------------- */
import React from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';

import { S, R, useTheme } from '../theme';
import { Btn, Press, FadeIn, Label } from '../ui/kit';
import { useLang } from '../lang';
import { Demo } from '../ui/demo';

export default function Exercise({ exercise, index, total, onDone, onBack }) {
  const { C, T, MUSCLE_C } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  const tint = MUSCLE_C[exercise.m] || C.ember;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }}>
        <View style={styles.head}>
          <Press onPress={onBack} hitSlop={12} scaleTo={0.94} style={{ alignSelf: 'flex-start' }}>
            <Text style={[T.small, { color: tint }]}>{'←'} {t('Back')}</Text>
          </Press>
          <Text style={styles.title}>{exercise.n}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.pill, { borderColor: tint }]}>
              <View style={[styles.dot, { backgroundColor: tint }]} />
              <Text style={[T.tiny, { color: C.text }]}>{exercise.m}</Text>
            </View>
            <View style={styles.pill}>
              <Text style={[T.tiny, { color: C.text }]}>{exercise.e}</Text>
            </View>
            <View style={{ flex: 1 }} />
            <Text style={T.tiny}>{index + 1} {t('of')} {total}</Text>
          </View>
        </View>

        <FadeIn delay={20}>
          <Demo exercise={exercise} height={260} style={{ borderRadius: 0 }} />
        </FadeIn>

        <FadeIn delay={60} style={{ padding: S.lg }}>
          <View style={[styles.card, { borderLeftColor: tint }]}>
            <Label>{t('Aim for')}</Label>
            <Text style={styles.scheme}>{exercise.s}</Text>
            <Text style={[T.small, { marginTop: S.sm }]}>
              {t('Pick a weight you can move cleanly for every rep. When all of them feel controlled, add a little next time — 2.5 kg is plenty.')}
            </Text>
          </View>

          <Text style={[T.tiny, { marginTop: S.md, textAlign: 'center' }]}>
            {t('Rest a minute or two between sets.')}
          </Text>
        </FadeIn>
      </ScrollView>

      <View style={styles.foot}>
        <Btn
          label={index + 1 === total ? t('Done — finish workout') : t('Done — next exercise')}
          color={tint}
          onPress={onDone}
        />
      </View>
    </View>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  head: { paddingHorizontal: S.lg, paddingTop: S.md, paddingBottom: S.md, backgroundColor: C.surface },
  title: { fontFamily: 'WorkSans_600SemiBold', fontSize: 27, lineHeight: 32,
           letterSpacing: -0.4, color: C.text, marginTop: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  pill: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.line,
    borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 4, marginRight: 8,
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },

  card: {
    backgroundColor: C.surface, borderRadius: R.md, padding: S.lg, borderLeftWidth: 4,
  },
  scheme: { fontFamily: 'WorkSans_600SemiBold', fontSize: 30, color: C.text, marginTop: 2 },

  foot: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    padding: S.lg, paddingTop: S.md,
    backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.line,
  },
});
