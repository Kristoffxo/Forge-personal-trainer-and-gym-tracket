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
import { View, Text, ScrollView, StyleSheet } from 'react-native';

import { S, R, useTheme } from '../theme';
import { Btn, Press, FadeIn, Label } from '../ui/kit';
import { useLang } from '../lang';
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
        <View style={styles.head}>
          <Press onPress={() => setPicked(null)} hitSlop={12} scaleTo={0.94}
            style={{ alignSelf: 'flex-start' }}>
            <Text style={[T.small, { color: accent }]}>{'←'} {t('Back')}</Text>
          </Press>
          <Text style={styles.title}>{t(picked.name)}</Text>
          <Text style={[T.small, { marginTop: 2 }]}>
            {picked.exercises.length} {t('moves')} · {minutesFor(picked.exercises.length)} {t('minutes')}
            {place === 'home' ? ' · ' + t('at home') : ''}
          </Text>
        </View>

        <View style={{ paddingHorizontal: S.lg, marginTop: S.md }}>
          {picked.exercises.map((x, i) => (
            <FadeIn key={x.n + i} delay={i * 18} from={6}>
              <View style={styles.exRow}>
                <View style={[styles.exNum, { backgroundColor: MUSCLE_C[x.m] }]}>
                  <Text style={styles.exNumTxt}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1, marginHorizontal: 12 }}>
                  <Text style={styles.exName}>{x.n}</Text>
                  <Text style={T.tiny}>{x.m} · {x.e}</Text>
                </View>
                <View style={styles.setsBox}>
                  <Text style={[styles.setsTxt, { color: accent }]}>{x.s}</Text>
                </View>
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
        <Label style={{ marginBottom: S.sm }}>{t('Full sessions')}</Label>
        {SPLIT_TARGETS.map((tg, i) => (
          <Press key={tg.key} onPress={() => open(tg)} scaleTo={0.985}
            style={[styles.card, { borderLeftColor: accent }]}>
            <Text style={[styles.cardIcon, { color: accent }]}>{tg.icon}</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.cardName}>{t(tg.name)}</Text>
              <Text style={T.tiny}>{t(tg.sub)}</Text>
            </View>
            <Text style={styles.chev}>{'›'}</Text>
          </Press>
        ))}
      </FadeIn>

      <FadeIn delay={70} style={{ paddingHorizontal: S.lg, marginTop: S.lg }}>
        <Label style={{ marginBottom: S.sm }}>{t('One muscle')}</Label>
        <View style={styles.grid}>
          {TARGETS.map((tg) => {
            const c = MUSCLE_C[tg.muscles[0]] || accent;
            return (
              <View key={tg.key} style={styles.tileWrap}>
                <Press onPress={() => open(tg)} scaleTo={0.96}
                  style={[styles.tile, { borderColor: c + '55', backgroundColor: c + '12' }]}>
                  <Text style={[styles.tileIcon, { color: c }]}>{tg.icon}</Text>
                  <Text style={styles.tileName}>{t(tg.name)}</Text>
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
  title: { fontFamily: 'Forum_400Regular', fontSize: 30, lineHeight: 34, color: C.text, marginTop: 8 },

  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: R.md, padding: S.md, marginBottom: 9, borderLeftWidth: 4,
  },
  cardIcon: { fontSize: 20 },
  cardName: { fontFamily: 'Forum_400Regular', fontSize: 22, color: C.text },
  chev: { fontSize: 22, color: C.faint },

  /* Two across, square-ish, with real room. The old three-across
     grid squeezed "Shoulders" into a column narrower than the word. */
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  tileWrap: { width: '50%', paddingHorizontal: 5, paddingBottom: 10 },
  tile: {
    backgroundColor: C.surface, borderRadius: R.lg,
    paddingVertical: S.lg, paddingHorizontal: S.md,
    alignItems: 'center', justifyContent: 'center',
    minHeight: 104, borderWidth: 1.5,
  },
  tileIcon: { fontSize: 26, marginBottom: 8 },
  tileName: { fontFamily: 'WorkSans_500Medium', fontSize: 15, color: C.text, textAlign: 'center' },

  exRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: R.md, padding: 12, marginBottom: 9,
  },
  exNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  exNumTxt: { fontFamily: 'WorkSans_500Medium', fontSize: 13, color: C.onAccent },
  exName: { fontFamily: 'WorkSans_500Medium', fontSize: 15, color: C.text },
  setsBox: { backgroundColor: C.raised, borderRadius: R.sm, paddingHorizontal: 10, paddingVertical: 6 },
  setsTxt: { fontFamily: 'WorkSans_500Medium', fontSize: 12.5 },
});
