/* ---------------------------------------------------------------
   The Train tab.

   Several ways in, because people arrive wanting different things:

     7 Day Workout Planner   write me a week and tell me what today is
     Gym Workouts            I am at the gym, today is chest
     Home Workouts           I have a floor and maybe a dumbbell
     Instant Workouts        I have twenty minutes and no equipment
     Challenges              give me a reason to turn up tomorrow
     Menstrual Exercises     it is day two and I want to feel human

   The last one only appears on the women's side, because on the
   men's side it would be a box nobody could ever open.

   The hub is deliberately a handful of large targets and nothing
   else. Every screen behind it knows how to get back here.
   --------------------------------------------------------------- */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ImageBackground } from 'react-native';

import { S, R, useTheme } from '../theme';
import { Press, FadeIn, useTabPad } from '../ui/kit';
import { useLang } from '../lang';
import { myStanding } from '../challenge';
import { GRADE_COLOUR } from '../rank';
import { PHOTO } from '../photos';
import { useSide } from '../side';

import Planner from './Training';
import Library from './Library';
import Challenges from './Challenges';

function boxesFor(women) {
  return [
    {
      key: 'planner', photo: 'gym', colorKey: 'ember',
      name: '7 Day Workout Planner',
      sub: 'A week built around your days',
    },
    {
      key: 'gym', photo: 'hero', colorKey: 'amber',
      name: 'Gym Workouts',
      sub: women ? 'Glutes, thighs, lower body — or one muscle'
                 : 'Push, pull, legs — or one muscle',
    },
    {
      key: 'home', photo: 'kit', colorKey: 'teal',
      name: 'Home Workouts',
      sub: 'The floor, a chair, a band — nothing you need to buy',
    },
    {
      key: 'instant', photo: 'home', colorKey: 'lime',
      name: 'Instant Workouts',
      sub: '10, 15, 20 or 30 minutes — no equipment',
    },
    ...(women ? [{
      key: 'relief', photo: 'calm', colorKey: 'gold',
      name: 'Menstrual Exercises',
      sub: 'Ten to twenty minutes for period pain',
    }] : []),
    {
      key: 'challenges', photo: 'bench', colorKey: 'violet',
      name: 'Challenges',
      sub: 'Medals for every streak you keep',
    },
  ];
}

export default function Train({ user, profile }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const { isWomen } = useSide();
  const styles = makeStyles(C, T);
  const tabPad = useTabPad();
  const BOXES = boxesFor(isWomen);

  const [open, setOpen] = useState(null);
  const [me, setMe] = useState(null);          // streak, medals, level

  /* The streak is the one thing worth saying on the hub — it is the
     reason most people opened the app at all. */
  const load = useCallback(async () => {
    setMe(await myStanding(user.id));
  }, [user.id]);

  useEffect(() => { load(); }, [load, open]);

  if (open === 'planner') return <Planner user={user} profile={profile} onBack={() => setOpen(null)} />;
  if (open === 'gym') {
    return <Library place="gym" user={user} profile={profile} onBack={() => setOpen(null)} />;
  }
  if (open === 'home') {
    return <Library place="home" user={user} profile={profile} onBack={() => setOpen(null)} />;
  }
  if (open === 'instant') {
    return <Library place="instant" user={user} profile={profile} onBack={() => setOpen(null)} />;
  }
  if (open === 'relief') {
    return <Library place="relief" user={user} profile={profile} onBack={() => setOpen(null)} />;
  }
  if (open === 'challenges') return <Challenges user={user} onBack={() => setOpen(null)} />;

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: S.lg, paddingBottom: tabPad }}>
      {me ? (
        <FadeIn>
          <Press onPress={() => setOpen('challenges')} scaleTo={0.99}
            style={[styles.banner, {
              borderColor: me.rank.grade ? GRADE_COLOUR[me.rank.grade] : C.violet,
            }]}>
            <View style={styles.streakBadge}>
              <Text style={[styles.streakNum, {
                color: me.rank.grade ? GRADE_COLOUR[me.rank.grade] : C.violet,
              }]}>
                {me.current}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.bannerTop}>
                {me.current === 1
                  ? t('1 day streak')
                  : me.current + ' ' + t('day streak')}
                {' · '}{t(me.rank.label)}
              </Text>
              <Text style={T.tiny}>
                {me.trainedToday
                  ? t('Today is logged ✓')
                  : me.restUsedThisWeek
                    ? t('Nothing today yet — this week’s rest day is gone')
                    : t('Nothing today yet — one free rest day left')}
              </Text>
            </View>
            <Text style={[styles.chev, { color: C.violet }]}>{'›'}</Text>
          </Press>
        </FadeIn>
      ) : null}

      {BOXES.map((b, i) => {
        const c = C[b.colorKey];
        return (
          <FadeIn key={b.key} delay={i * 24} from={8}>
            <Press onPress={() => setOpen(b.key)} scaleTo={0.98} style={styles.box}>
              <ImageBackground source={PHOTO[b.photo]} style={styles.boxImg}
                imageStyle={{ borderRadius: R.lg }}>
                <View style={styles.boxInk} />
                <View style={[styles.boxVeil, { backgroundColor: c + '22' }]} />
                <View style={styles.boxBody}>
                  <View style={[styles.rule, { backgroundColor: c }]} />
                  <Text style={styles.boxName}>{t(b.name)}</Text>
                  <Text style={styles.boxSub}>{t(b.sub)}</Text>
                </View>
              </ImageBackground>
            </Press>
          </FadeIn>
        );
      })}
    </ScrollView>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },

  banner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: R.md, padding: S.md, marginBottom: S.lg,
    borderWidth: 1.5, borderColor: C.violet,
  },
  bannerTop: { fontFamily: 'WorkSans_500Medium', fontSize: 14, color: C.text },
  streakBadge: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: C.raised,
    alignItems: 'center', justifyContent: 'center',
  },
  streakNum: { fontFamily: 'WorkSans_600SemiBold', fontSize: 20, lineHeight: 24 },

  box: { marginBottom: S.md, borderRadius: R.lg, overflow: 'hidden' },
  boxImg: { height: 134, justifyContent: 'flex-end', backgroundColor: C.raised },
  boxInk: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(6,6,9,0.5)' },
  boxVeil: { ...StyleSheet.absoluteFillObject },
  boxBody: { padding: S.lg },
  rule: { width: 30, height: 3, borderRadius: 2, marginBottom: 8 },
  boxName: { fontFamily: 'WorkSans_600SemiBold', fontSize: 22, lineHeight: 26, color: '#fff' },
  boxSub: { fontFamily: 'WorkSans_400Regular', fontSize: 13,
            color: 'rgba(255,255,255,0.82)', marginTop: 2 },
});
