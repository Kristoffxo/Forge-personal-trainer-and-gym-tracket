/* ---------------------------------------------------------------
   One exercise, mid-workout.

   Deliberately almost empty. A photograph of the movement, what it
   trains, and one button.

   Two things it gained: a countdown for the moves that are held
   rather than counted — a plank is forty-five seconds and people
   were either timing it on another app or guessing — and a strip
   showing the move either side of this one, so you can see what is
   coming without going back to the list. The photograph shrank to
   make room, which it could afford: it is a demonstration, not the
   point of the screen.

   There is no set logging here. Writing numbers down mid-set is a
   thing serious lifters do in a notebook and everybody else abandons
   in week two — and it made this screen a form. The advice that
   replaces it is the advice that actually matters: pick a weight you
   can control, and add to it slowly.
   --------------------------------------------------------------- */
import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';

import { S, R, useTheme } from '../theme';
import { Btn, Press, FadeIn, Label } from '../ui/kit';
import { kitLabel } from '../exercises';
import { useLang } from '../lang';
import { Demo } from '../ui/demo';
import { Timer } from '../ui/timer';
import { parseDuration } from '../duration';
import { framesFor } from '../exercisePhotos';
import { photoForMuscle } from '../photos';

/* The move before and the move after, small, tappable. `list` is the
   whole session; without it this simply does not render, which is
   what happens when a single exercise is being looked at on its own. */
function Neighbours({ list, index, onGo, C, T, styles, t }) {
  if (!list || list.length < 2 || !onGo) return null;
  const prev = index > 0 ? list[index - 1] : null;
  const next = index + 1 < list.length ? list[index + 1] : null;
  if (!prev && !next) return null;

  const thumb = (x) => (framesFor(x) || [photoForMuscle(x.m)])[0];

  return (
    <View style={styles.neighbours}>
      {prev ? (
        <Press onPress={() => onGo(index - 1)} scaleTo={0.97} style={styles.near}>
          <Text style={styles.nearChev}>{'‹'}</Text>
          <Image source={thumb(prev)} style={styles.nearImg} resizeMode="cover" />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.nearLabel}>{t('Before')}</Text>
            <Text style={styles.nearName} numberOfLines={1}>{prev.n}</Text>
          </View>
        </Press>
      ) : <View style={{ flex: 1 }} />}

      {next ? (
        <Press onPress={() => onGo(index + 1)} scaleTo={0.97} style={[styles.near, styles.nearRight]}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[styles.nearLabel, { textAlign: 'right' }]}>{t('Next')}</Text>
            <Text style={[styles.nearName, { textAlign: 'right' }]} numberOfLines={1}>{next.n}</Text>
          </View>
          <Image source={thumb(next)} style={styles.nearImg} resizeMode="cover" />
          <Text style={styles.nearChev}>{'›'}</Text>
        </Press>
      ) : <View style={{ flex: 1 }} />}
    </View>
  );
}

export default function Exercise({ exercise, index, total, list, onGo, onDone, onBack, previewOnly }) {
  const { C, T, MUSCLE_C } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  const tint = MUSCLE_C[exercise.m] || C.ember;
  const held = parseDuration(exercise.s);

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
            {exercise.r || exercise.senior ? null : (
              <View style={styles.pill}>
                <Text style={[T.tiny, { color: C.text }]}>{t(kitLabel(exercise.e))}</Text>
              </View>
            )}
            <View style={{ flex: 1 }} />
            <Text style={T.tiny}>{index + 1} {t('of')} {total}</Text>
          </View>
        </View>

        <FadeIn delay={20}>
          <Demo exercise={exercise} height={196} style={{ borderRadius: 0 }} />
        </FadeIn>

        <Neighbours list={list} index={index} onGo={onGo}
          C={C} T={T} styles={styles} t={t} />

        <FadeIn delay={60} style={{ paddingHorizontal: S.lg, paddingBottom: S.lg }}>
          {held ? <Timer seconds={held.seconds} eachSide={held.eachSide} tint={tint} /> : null}

          {/* The seniors side writes its movements out. Everywhere else
              an exercise is a name and a rep scheme, because everyone
              else already knows what a squat is. */}
          {exercise.steps ? (
            <View style={[styles.card, { borderLeftColor: tint, marginTop: S.md }]}>
              <Label>{t('How to do it')}</Label>
              {exercise.steps.map((step, i) => (
                <View key={i} style={styles.step}>
                  <View style={[styles.stepNum, { borderColor: tint }]}>
                    <Text style={[styles.stepNumTxt, { color: tint }]}>{i + 1}</Text>
                  </View>
                  <Text style={[T.bodyOn, styles.stepTxt]}>{t(step)}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {exercise.care ? (
            <View style={[styles.care, { borderLeftColor: C.amber }]}>
              <Label style={{ color: C.amber }}>{t('Take care')}</Label>
              <Text style={[T.bodyOn, { marginTop: 4, fontSize: 14.5 }]}>{t(exercise.care)}</Text>
            </View>
          ) : null}

          <View style={[styles.card, { borderLeftColor: tint, marginTop: S.md }]}>
            <Label>{exercise.r || held ? t('Hold for') : t('Aim for')}</Label>
            <Text style={styles.scheme}>{exercise.s}</Text>
            <Text style={[T.small, { marginTop: S.sm }]}>
              {exercise.senior
                ? t('There is no rush and nothing to prove. Doing it slowly is doing it properly.')
                : exercise.r
                  ? t('Go only as far as is comfortable and breathe out slowly into it. Nothing here should hurt — if it does, come out of it.')
                  : exercise.e === 'None'
                    ? t('Slow down rather than rushing. Three seconds down, one up — when that feels easy, add reps before you add anything else.')
                    : t('Pick a weight you can move cleanly for every rep. When all of them feel controlled, add a little next time — 2.5 kg is plenty.')}
            </Text>
          </View>

          <Text style={[T.tiny, { marginTop: S.md, textAlign: 'center' }]}>
            {exercise.senior
              ? t('Take as long as you like between movements.')
              : exercise.r
              ? t('There is no rush and nothing to count. Move to the next one when you are ready.')
                : t('Rest a minute or two between sets.')}
          </Text>
        </FadeIn>
      </ScrollView>

      <View style={styles.foot}>
        <Btn
          label={previewOnly
            ? t('Back to the list')
            : index + 1 === total ? t('Done — finish workout') : t('Done — next exercise')}
          color={tint}
          dark={previewOnly}
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

  /* the move either side of this one */
  neighbours: {
    flexDirection: 'row', alignItems: 'stretch',
    paddingHorizontal: S.md, paddingTop: S.sm, gap: 8,
  },
  near: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: R.sm, padding: 7,
  },
  nearRight: { justifyContent: 'flex-end' },
  nearImg: { width: 34, height: 34, borderRadius: 7, backgroundColor: C.raised },
  nearChev: { fontFamily: 'WorkSans_400Regular', fontSize: 17, color: C.faint, paddingHorizontal: 3 },
  nearLabel: {
    fontFamily: 'WorkSans_500Medium', fontSize: 8.5, letterSpacing: 1.1,
    textTransform: 'uppercase', color: C.faint,
  },
  nearName: { fontFamily: 'WorkSans_400Regular', fontSize: 12, color: C.dim, marginTop: 1 },

  /* numbered instructions, seniors side */
  step: { flexDirection: 'row', alignItems: 'flex-start', marginTop: S.md },
  stepNum: {
    width: 26, height: 26, borderRadius: 13, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 1,
  },
  stepNumTxt: { fontFamily: 'WorkSans_600SemiBold', fontSize: 13 },
  stepTxt: { flex: 1, fontSize: 16, lineHeight: 24 },
  care: {
    backgroundColor: C.surface, borderRadius: R.md, padding: S.md,
    borderLeftWidth: 4, marginTop: S.md,
  },
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
