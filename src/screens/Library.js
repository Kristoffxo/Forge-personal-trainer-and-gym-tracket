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
import { Btn, Press, FadeIn, Label, useTabPad } from '../ui/kit';
import { useLang } from '../lang';
import { photoForTarget, photoForMuscle, groupPhoto, PHOTO } from '../photos';
import { framesFor } from '../exercisePhotos';
import { targetsFor, splitTargetsFor, buildRoutine, minutesFor, INSTANT, buildInstant } from '../routines';
import { useSide } from '../side';
import { RELIEF, RELIEF_NOTE } from '../menstrual';
import { SENIOR_SESSIONS, SENIOR_NOTE } from '../seniors';
import { yogaFor } from '../yoga';
import { kitLabel } from '../exercises';
import Session from './Session';
import Exercise from './Exercise';

export default function Library({ place, user, profile, onBack }) {
  const { C, T, MUSCLE_C } = useTheme();
  const { t } = useLang();
  const { side } = useSide();
  const styles = makeStyles(C, T);
  const tabPad = useTabPad();

  const [picked, setPicked] = useState(null);   // the routine being previewed
  const [running, setRunning] = useState(false);
  const [peek, setPeek] = useState(null);      // one exercise, just to look at

  const level = (profile && profile.experience) || 'intermediate';
  const accent = place === 'relief' ? C.gold
    : place === 'senior' ? C.lime
      : place === 'yoga' ? C.violet
        : place === 'home' ? C.teal : C.ember;

  const SPLITS = splitTargetsFor(side);
  const SINGLES = targetsFor(side);

  /* Tapping a move in the list opens the demonstration without
     starting anything — you are just checking what it is. */
  if (peek !== null && picked && picked.exercises[peek]) {
    return (
      <Exercise
        exercise={picked.exercises[peek]}
        index={peek}
        total={picked.exercises.length}
        list={picked.exercises}
        onGo={setPeek}
        onBack={() => setPeek(null)}
        onDone={() => setPeek(null)}
        previewOnly
      />
    );
  }

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
      <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: tabPad }}>
        {/* A home session must not open with a photograph of a gym.
            It was showing a man on a pull-up bar above a list with no
            pull-up in it. */}
        <ImageBackground
          source={place === 'gym' ? photoForTarget(picked.key)
            : place === 'senior' ? PHOTO.rest
              : place === 'yoga' || place === 'relief' ? PHOTO.calm : PHOTO.home}
          style={styles.hero} imageStyle={{ opacity: 0.55 }}>
          <View style={styles.heroVeil} />
          <View style={styles.heroBody}>
            <Press onPress={() => setPicked(null)} hitSlop={12} scaleTo={0.94}
              style={{ alignSelf: 'flex-start' }}>
              <Text style={[T.small, { color: '#fff' }]}>{'←'} {t('Back')}</Text>
            </Press>
            <Text style={styles.heroTitle}>{picked.name}</Text>
            <Text style={[T.small, { color: 'rgba(255,255,255,0.85)' }]}>
              {picked.exercises.length} {t('exercises')} ·{' '}
              {picked.mins || minutesFor(picked.exercises.length)} {t('minutes')}
              {place === 'home' ? ' · ' + t('at home') : ''}
            </Text>
          </View>
        </ImageBackground>

        <View style={{ paddingHorizontal: S.lg, marginTop: S.md }}>
          {picked.exercises.map((x, i) => (
            <FadeIn key={x.n + i} delay={i * 12} from={6}>
              <Press onPress={() => setPeek(i)} scaleTo={0.99} style={styles.exRow}>
                <View style={[styles.exNum, { backgroundColor: MUSCLE_C[x.m] || accent }]}>
                  <Text style={styles.exNumTxt}>{i + 1}</Text>
                </View>
                <Image source={(framesFor(x) || [photoForMuscle(x.m)])[0]} style={styles.exThumb} />
                <View style={{ flex: 1, marginHorizontal: 10 }}>
                  <Text style={styles.exName} numberOfLines={2}>{x.n}</Text>
                  {/* A stretch has no kit and its hold is a sentence, so it
                      goes on this line rather than squeezing the name into
                      half a row. */}
                  <Text style={T.tiny}>
                    {x.senior || x.r
                      ? `${t(x.m)} · ${x.s}`
                      : `${t(x.m)} · ${t(kitLabel(x.e))}`}
                  </Text>
                </View>
                {x.r || x.senior ? null
                  : <Text style={[styles.setsTxt, { color: accent }]}>{x.s}</Text>}
                <Text style={styles.rowChev}>{'›'}</Text>
              </Press>
            </FadeIn>
          ))}

          {picked.exercises.length ? (
            <Btn label={t('Start this workout')} color={accent}
              onPress={() => setRunning(true)} style={{ marginTop: S.lg }} />
          ) : (
            /* Belt and braces. Every target has exercises at every
               level — there are tests for it — but a Start button on
               an empty list would start nothing and say nothing. */
            <Text style={[T.small, { marginTop: S.lg, textAlign: 'center' }]}>
              {t('Nothing here fits your kit. Try another muscle.')}
            </Text>
          )}
        </View>
      </ScrollView>
    );
  }

  /* ---------- the menu ---------- */
  const open = (target) => setPicked(buildRoutine({ target, place, level, side }));

  /* ---------- yoga ----------
     Fixed flows rather than anything generated, and the same row as
     the other timed lists so nothing new has to be learnt. */
  if (place === 'yoga') {
    const flows = yogaFor(side);
    return (
      <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: tabPad }}>
        <ImageBackground source={PHOTO.calm} style={styles.hero} imageStyle={{ opacity: 0.5 }}>
          <View style={styles.heroVeil} />
          <View style={styles.heroBody}>
            <Press onPress={onBack} hitSlop={12} scaleTo={0.94} style={{ alignSelf: 'flex-start' }}>
              <Text style={[T.small, { color: '#fff' }]}>{'←'} {t('Train')}</Text>
            </Press>
            <Text style={styles.heroTitle}>{t('Yoga')}</Text>
            <Text style={[T.small, { color: 'rgba(255,255,255,0.85)' }]}>{t('Slow, on the floor.')}</Text>
          </View>
        </ImageBackground>

        <View style={{ padding: S.lg }}>
          {flows.map((r, i) => (
            <FadeIn key={r.key} delay={i * 24} from={8}>
              <Press onPress={() => setPicked(r)} scaleTo={0.985} style={styles.timeRow}>
                <View style={[styles.timeBadge, { borderColor: accent }]}>
                  <Text style={[styles.timeNum, { color: accent }]}>{r.mins}</Text>
                  <Text style={T.tiny}>{t('min')}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.planName}>{t(r.name)}</Text>
                  <Text style={[T.small, { marginTop: 2 }]}>{t(r.sub)}</Text>
                </View>
                <View style={[styles.go, { backgroundColor: accent }]}>
                  <Text style={styles.goTxt}>{'→'}</Text>
                </View>
              </Press>
            </FadeIn>
          ))}
        </View>
      </ScrollView>
    );
  }

  /* ---------- the seniors side ----------
     Five fixed sessions and nothing generated. What is right for a
     joint that has done seventy years of work is a known short list,
     not something to shuffle. */
  if (place === 'senior') {
    return (
      <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: tabPad }}>
        <ImageBackground source={PHOTO.rest} style={styles.hero} imageStyle={{ opacity: 0.45 }}>
          <View style={styles.heroVeil} />
          <View style={styles.heroBody}>
            <Press onPress={onBack} hitSlop={12} scaleTo={0.94} style={{ alignSelf: 'flex-start' }}>
              <Text style={[T.small, { color: '#fff' }]}>{'←'} {t('Train')}</Text>
            </Press>
            <Text style={styles.heroTitle}>{t('Gentle Workouts')}</Text>
            <Text style={[T.small, { color: 'rgba(255,255,255,0.85)' }]}>
              {t('A chair, a wall, the floor.')}
            </Text>
          </View>
        </ImageBackground>

        <View style={{ padding: S.lg }}>
          {SENIOR_SESSIONS.map((r, i) => (
            <FadeIn key={r.key} delay={i * 24} from={8}>
              <Press onPress={() => setPicked(r)} scaleTo={0.985} style={styles.timeRow}>
                <View style={[styles.timeBadge, { borderColor: accent }]}>
                  <Text style={[styles.timeNum, { color: accent }]}>{r.mins}</Text>
                  <Text style={T.tiny}>{t('min')}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.planName}>{t(r.name)}</Text>
                  <Text style={[T.small, { marginTop: 2 }]}>{t(r.sub)}</Text>
                </View>
                <View style={[styles.go, { backgroundColor: accent }]}>
                  <Text style={styles.goTxt}>{'→'}</Text>
                </View>
              </Press>
            </FadeIn>
          ))}

          <View style={[styles.note, { borderLeftColor: C.danger }]}>
            <Text style={[T.small, { color: C.text }]}>{t(SENIOR_NOTE)}</Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  /* ---------- period pain ----------
     Three fixed sessions rather than anything generated. What eases
     cramp is a known short list, not something to shuffle. */
  if (place === 'relief') {
    return (
      <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: tabPad }}>
        <ImageBackground source={PHOTO.calm} style={styles.hero} imageStyle={{ opacity: 0.5 }}>
          <View style={styles.heroVeil} />
          <View style={styles.heroBody}>
            <Press onPress={onBack} hitSlop={12} scaleTo={0.94} style={{ alignSelf: 'flex-start' }}>
              <Text style={[T.small, { color: '#fff' }]}>{'←'} {t('Train')}</Text>
            </Press>
            <Text style={styles.heroTitle}>{t('Menstrual Exercises')}</Text>
            <Text style={[T.small, { color: 'rgba(255,255,255,0.85)' }]}>
              {t('For period pain.')}
            </Text>
          </View>
        </ImageBackground>

        <View style={{ padding: S.lg }}>
          {RELIEF.map((r, i) => (
            <FadeIn key={r.key} delay={i * 24} from={8}>
              <Press onPress={() => setPicked(r)} scaleTo={0.985} style={styles.timeRow}>
                <View style={[styles.timeBadge, { borderColor: accent }]}>
                  <Text style={[styles.timeNum, { color: accent }]}>{r.mins}</Text>
                  <Text style={T.tiny}>{t('min')}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.planName}>{t(r.name)}</Text>
                  <Text style={[T.small, { marginTop: 2 }]}>{t(r.sub)}</Text>
                </View>
                <View style={[styles.go, { backgroundColor: accent }]}>
                  <Text style={styles.goTxt}>{'→'}</Text>
                </View>
              </Press>
            </FadeIn>
          ))}

          {/* Said plainly, and not buried. Stretching is not a
              treatment and the app should not imply that it is. */}
          <View style={[styles.note, { borderLeftColor: C.danger }]}>
            <Text style={[T.small, { color: C.text }]}>{t(RELIEF_NOTE)}</Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  if (place === 'instant') {
    return (
      <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: tabPad }}>
        <ImageBackground source={PHOTO.home} style={styles.hero} imageStyle={{ opacity: 0.5 }}>
          <View style={styles.heroVeil} />
          <View style={styles.heroBody}>
            <Press onPress={onBack} hitSlop={12} scaleTo={0.94} style={{ alignSelf: 'flex-start' }}>
              <Text style={[T.small, { color: '#fff' }]}>{'←'} {t('Train')}</Text>
            </Press>
            <Text style={styles.heroTitle}>{t('Instant Workouts')}</Text>
            <Text style={[T.small, { color: 'rgba(255,255,255,0.85)' }]}>
              {t('How long have you got?')}
            </Text>
          </View>
        </ImageBackground>

        <View style={{ padding: S.lg }}>
          {INSTANT.map((o, i) => (
            <FadeIn key={o.mins} delay={i * 24} from={8}>
              <Press onPress={() => setPicked(buildInstant(o.mins))} scaleTo={0.985}
                style={styles.timeRow}>
                <View style={[styles.timeBadge, { borderColor: accent }]}>
                  <Text style={[styles.timeNum, { color: accent }]}>{o.mins}</Text>
                  <Text style={T.tiny}>{t('min')}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.planName}>{t(o.name)}</Text>
                  <Text style={[T.small, { marginTop: 2 }]}>{t(o.blurb)}</Text>
                </View>
                <View style={[styles.go, { backgroundColor: accent }]}>
                  <Text style={styles.goTxt}>{'→'}</Text>
                </View>
              </Press>
            </FadeIn>
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: tabPad }}>
      <View style={styles.head}>
        <Press onPress={onBack} hitSlop={12} scaleTo={0.94} style={{ alignSelf: 'flex-start' }}>
          <Text style={[T.small, { color: accent }]}>{'←'} {t('Train')}</Text>
        </Press>
        <Text style={styles.title}>
          {place === 'home' ? t('Home Workouts') : t('Gym Workouts')}
        </Text>
        <Text style={[T.small, { marginTop: 2 }]}>
          {place === 'home'
            ? t('No gym needed. A chair, a band, one dumbbell.')
            : t('Everything the gym has.')}
        </Text>
      </View>

      <FadeIn delay={30} style={{ paddingHorizontal: S.lg, marginTop: S.lg }}>
        <Text style={styles.section}>{t('WORKOUT PLANS')}</Text>
        {SPLITS.map((tg) => {
          const c = MUSCLE_C[tg.muscles[0]] || accent;
          return (
            <Press key={tg.key} onPress={() => open(tg)} scaleTo={0.985} style={styles.planRow}>
              <Image source={groupPhoto(tg.key)} style={styles.chip} resizeMode="cover" />
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
          {SINGLES.map((tg) => {
            const c = MUSCLE_C[tg.muscles[0]] || accent;
            return (
              <View key={tg.key} style={styles.tileWrap}>
                <Press onPress={() => open(tg)} scaleTo={0.96}>
                  <ImageBackground source={groupPhoto(tg.key)} resizeMode="cover"
                    style={[styles.tile, { borderColor: c }]}
                    imageStyle={styles.tileImg}>
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
        {place === 'instant'
          ? t('Rest 30 seconds between moves.')
          : t('Sized to your level.')}
      </Text>
    </ScrollView>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  head: { paddingHorizontal: S.lg, paddingTop: S.md, paddingBottom: S.md, backgroundColor: C.surface },
  title: { fontFamily: 'WorkSans_600SemiBold', fontSize: 30, lineHeight: 34, color: C.text, marginTop: 8 },

  note: {
    backgroundColor: C.surface, borderRadius: R.md, padding: S.md,
    borderLeftWidth: 4, marginTop: S.lg,
  },
  section: {
    fontFamily: 'WorkSans_500Medium', fontSize: 12, letterSpacing: 2,
    color: C.dim, textTransform: 'uppercase', marginBottom: S.md,
  },
  timeRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: R.md, padding: S.md, marginBottom: 10,
  },
  timeBadge: {
    width: 56, height: 56, borderRadius: R.md, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  timeNum: { fontFamily: 'WorkSans_600SemiBold', fontSize: 22, lineHeight: 24 },
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
  /* The width matters. Without it react-native-web lays the inner
     <img> out at its natural size and the tile shows a magnified
     corner of the photograph instead of the photograph — which is
     what made every one of these cards look wrong, whatever picture
     was in it. */
  tile: {
    width: '100%', height: 118, borderRadius: R.md, borderWidth: 1.5,
    overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: C.raised,
  },
  tileImg: { width: '100%', height: '100%', borderRadius: R.md - 2 },
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
  rowChev: { fontSize: 19, color: C.faint, marginLeft: 6 },
});
