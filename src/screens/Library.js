/* ---------------------------------------------------------------
   Gym workouts and home workouts.

   One screen, two modes. The exercise list is the same library the
   planner uses; `place` decides whether machines and barbells are
   allowed, or whether it has to be doable with your own weight and
   one dumbbell.

   Order matters on this screen: the three-way split first, because
   most people arrive knowing "today is push", and the single
   muscles underneath for when they do not.
   --------------------------------------------------------------- */
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, ImageBackground } from 'react-native';

import { S, R, useTheme } from '../theme';
import { Btn, Press, FadeIn, Label } from '../ui/kit';
import { useLang } from '../lang';
import { artForTarget } from '../muscleArt';
import { photoForTarget, photoForMuscle, groupPhoto, PHOTO } from '../photos';
import { framesFor } from '../exercisePhotos';
import { SPLIT_TARGETS, TARGETS, buildRoutine, minutesFor } from '../routines';
import Session from './Session';

export default function Library({ place, user, profile, onBack }) {
  const { C, T, MUSCLE_C } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);

  const [picked, setPicked] = useState(null);   // the routine being previewed
  const [running, setRunning] = useState(false);

  const level = (profile && profile.experience) || 'intermediate';
  const accent = place === 'home' ? C.teal : C.ember;

  if (running && picked) {
    return (
      <Session
        title={picked.name}
        exercises={picked.exercises}
        user={user}
        profile={profile}
        kind={place}
        name={picked.name}
        onExit={() => { setRunning(false); setPicked(null); }}
      />
    );
  }

  /* ---------- one routine, before you start it ---------- */
  if (picked) {
    return (
      <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: 70 }}>
        <ImageBackground source={photoForTarget(picked.key)} style={styles.hero}
          imageStyle={{ opacity: 0.55 }}>
          <View style={styles.heroVeil} />
          <View style={styles.heroBody}>
            <Press onPress={() => setPicked(null)} hitSlop={12} scaleTo={0.94}
              style={{ alignSelf: 'flex-start' }}>
              <Text style={[T.small, { color: '#fff' }]}>{'←'} {t('Back')}</Text>
            </Press>
            <Text style={styles.heroTitle}>{picked.name}</Text>
            <Text style={[T.small, { color: 'rgba(255,255,255,0.85)' }]}>
              {picked.exercises.length} {t('exercises')} · {minutesFor(picked.exercises.length)} {t('minutes')}
              {place === 'home' ? ' · ' + t('at home') : ''}
            </Text>
          </View>
        </ImageBackground>

        <View style={{ paddingHorizontal: S.lg, marginTop: S.md }}>
          {picked.exercises.map((x, i) => (
            <FadeIn key={x.n + i} delay={i * 18} from={6}>
              <View style={styles.exRow}>
                <View style={[styles.exNum, { backgroundColor: MUSCLE_C[x.m] }]}>
                  <Text style={styles.exNumTxt}>{i + 1}</Text>
                </View>
                <Image source={(framesFor(x) || [photoForMuscle(x.m)])[0]} style={styles.exThumb} />
                <View style={{ flex: 1, marginHorizontal: 10 }}>
                  <Text style={styles.exName} numberOfLines={1}>{x.n}</Text>
                  <Text style={T.tiny}>{x.m} · {x.e}</Text>
                </View>
                <Text style={[styles.setsTxt, { color: accent }]}>{x.s}</Text>
              </View>
            </FadeIn>
          ))}

          <Btn label={t('Start this workout')} color={accent}
            onPress={() => setRunning(true)} style={{ marginTop: S.lg }} />
        </View>
      </ScrollView>
    );
  }

  /* ---------- the menu ---------- */
  const open = (target) => setPicked(buildRoutine({ target, place, level }));

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: 70 }}>
      <View style={styles.head}>
        <Press onPress={onBack} hitSlop={12} scaleTo={0.94} style={{ alignSelf: 'flex-start' }}>
          <Text style={[T.small, { color: accent }]}>{'←'} {t('Train')}</Text>
        </Press>
        <Text style={styles.title}>
          {place === 'home' ? t('Home Workouts') : t('Gym Workouts')}
        </Text>
        <Text style={[T.small, { marginTop: 2 }]}>
          {place === 'home'
            ? t('Bodyweight, or one dumbbell — a water can works too.')
            : t('Everything the gym has.')}
        </Text>
      </View>

      <FadeIn delay={30} style={{ paddingHorizontal: S.lg, marginTop: S.lg }}>
        <Text style={styles.section}>{t('WORKOUT PLANS')}</Text>
        {SPLIT_TARGETS.map((tg) => {
          const c = MUSCLE_C[tg.muscles[0]] || accent;
          return (
            <Press key={tg.key} onPress={() => open(tg)} scaleTo={0.985} style={styles.planRow}>
              <Image source={groupPhoto(tg.key)} style={styles.chip} />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.planName}>{tg.name}</Text>
                <Text style={T.tiny}>{t(tg.sub)}</Text>
              </View>
              <View style={[styles.go, { backgroundColor: c }]}>
                <Text style={styles.goTxt}>{'→'}</Text>
              </View>
            </Press>
          );
        })}
      </FadeIn>

      <View style={styles.divider} />

      <FadeIn delay={70} style={{ paddingHorizontal: S.lg }}>
        <Text style={styles.section}>{t('MUSCLE GROUPS')}</Text>
        <View style={styles.grid}>
          {TARGETS.map((tg) => {
            const c = MUSCLE_C[tg.muscles[0]] || accent;
            return (
              <View key={tg.key} style={styles.tileWrap}>
                <Press onPress={() => open(tg)} scaleTo={0.96}>
                  <ImageBackground source={groupPhoto(tg.key)}
                    style={[styles.tile, { borderColor: c }]}
                    imageStyle={{ borderRadius: R.md - 2 }}>
                    <View style={styles.tileVeil} />
                    <Text style={styles.tileName}>{tg.name}</Text>
                  </ImageBackground>
                </Press>
              </View>
            );
          })}
        </View>
      </FadeIn>

      <Text style={[T.tiny, { textAlign: 'center', marginTop: S.lg, paddingHorizontal: S.lg }]}>
        {t('Sessions are sized to your level. Change it in You → Numbers.')}
      </Text>
    </ScrollView>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  head: { paddingHorizontal: S.lg, paddingTop: S.md, paddingBottom: S.md, backgroundColor: C.surface },
  title: { fontFamily: 'WorkSans_600SemiBold', fontSize: 30, lineHeight: 34, color: C.text, marginTop: 8 },

  section: {
    fontFamily: 'WorkSans_500Medium', fontSize: 12, letterSpacing: 2,
    color: C.dim, textTransform: 'uppercase', marginBottom: S.md,
  },
  planRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: R.md, padding: 12, marginBottom: 10,
  },
  chip: { width: 46, height: 46, borderRadius: R.sm, backgroundColor: C.raised },
  planName: { fontFamily: 'WorkSans_600SemiBold', fontSize: 17, color: C.text, letterSpacing: -0.2 },
  go: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  goTxt: { color: '#0B0B0E', fontSize: 15, fontFamily: 'WorkSans_600SemiBold' },
  divider: { height: 1, backgroundColor: C.line, marginVertical: S.lg, marginHorizontal: S.lg },

  /* Two across, square-ish, with real room. The old three-across
     grid squeezed "Shoulders" into a column narrower than the word. */
  /* three across, like the mockup — the discs carry the meaning so
     the tiles need no border or background of their own */
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  tileWrap: { width: '33.333%', paddingHorizontal: 5, paddingBottom: 10 },
  tile: {
    height: 118, borderRadius: R.md, borderWidth: 1.5,
    overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: C.raised,
  },
  tileVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6,6,9,0.34)',
  },
  tileName: {
    fontFamily: 'WorkSans_600SemiBold', fontSize: 13.5, color: '#FFFFFF',
    textAlign: 'center', paddingBottom: 9,
  },

  hero: { width: '100%', height: 190, overflow: 'hidden', justifyContent: 'flex-end',
          backgroundColor: C.raised },
  heroVeil: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(6,6,9,0.5)' },
  heroBody: { padding: S.lg },
  heroTitle: { fontFamily: 'WorkSans_600SemiBold', fontSize: 32, letterSpacing: -0.6,
               color: '#fff', marginTop: S.sm },

  exRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: R.md, padding: 10, marginBottom: 9,
  },
  exNum: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  exNumTxt: { fontFamily: 'WorkSans_600SemiBold', fontSize: 11, color: '#0B0B0E' },
  exThumb: { width: 46, height: 46, borderRadius: R.sm, marginLeft: 10, backgroundColor: C.raised },
  exName: { fontFamily: 'WorkSans_600SemiBold', fontSize: 14.5, color: C.text },
  setsTxt: { fontFamily: 'WorkSans_600SemiBold', fontSize: 13 },
});
