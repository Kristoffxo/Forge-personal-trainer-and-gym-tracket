/* ---------------------------------------------------------------
   The Train tab.

   Several ways in, because people arrive wanting different things:

     7 Day Workout Planner   write me a week and tell me what today is
     Gym Workouts            I am at the gym, today is chest
     Home Workouts           I have a floor and maybe a dumbbell
     Instant Workouts        I have twenty minutes and no equipment
     Menstrual Exercises     it is day two and I want to feel human

   Menstrual Exercises only appears on the women's side. The seniors
   side shows none of the gym boxes at all — it has its own gentle
   sessions and nothing else, because half a menu you must not use is
   worse than no menu.

   Challenges used to be here. It has its own tab now: it is a thing
   you check on, not a way into today's session.

   The hub is deliberately a handful of large targets and nothing
   else. Every screen behind it knows how to get back here.
   --------------------------------------------------------------- */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ImageBackground } from 'react-native';

import { S, R, useTheme } from '../theme';
import { Press, FadeIn, useTabPad } from '../ui/kit';
import { useLang } from '../lang';
import { myJourney } from '../challenge';
import { PHOTO } from '../photos';
import { useSide } from '../side';

import Planner from './Training';
import Library from './Library';
import SeniorPlan from './SeniorPlan';

function boxesFor(women, senior) {
  if (senior) {
    return [
      {
        key: 'plan', photo: 'hero', colorKey: 'lime',
        name: 'Build My Plan',
        sub: 'Two questions, then your workouts',
      },
      {
        key: 'senior', photo: 'rest', colorKey: 'ember',
        name: 'Gentle Workouts',
        sub: 'Five ready-made sessions',
      },
      {
        key: 'yoga', photo: 'calm', colorKey: 'violet',
        name: 'Yoga',
        sub: 'Slow, on the floor',
      },
      /* No Instant Workouts here. It builds from the bodyweight pool,
         which still has press-ups and mountain climbers in it — fine
         for everyone else and not what this side is for. */
    ];
  }

  return [
    {
      key: 'planner', photo: 'gym', colorKey: 'ember',
      name: '7 Day Workout Planner',
      sub: 'A week built around your days',
    },
    {
      key: 'gym', photo: 'hero', colorKey: 'amber',
      name: 'Gym Workouts',
      sub: women ? 'Glutes, thighs, legs — or one muscle'
                 : 'Push, pull, legs — or one muscle',
    },
    {
      key: 'home', photo: 'kit', colorKey: 'teal',
      name: 'Home Workouts',
      sub: 'The floor, a chair, a band',
    },
    {
      key: 'instant', photo: 'home', colorKey: 'lime',
      name: 'Instant Workouts',
      sub: '10 to 30 minutes, no equipment',
    },
    {
      key: 'yoga', photo: 'calm', colorKey: 'violet',
      name: 'Yoga',
      sub: 'Slow, on the floor',
    },
    ...(women ? [{
      key: 'relief', photo: 'calm', colorKey: 'gold',
      name: 'Menstrual Exercises',
      sub: 'For period pain',
    }] : []),
  ];
}

export default function Train({ user, profile }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const { isWomen, isSenior } = useSide();
  const styles = makeStyles(C, T);
  const tabPad = useTabPad();
  const BOXES = boxesFor(isWomen, isSenior);

  const [open, setOpen] = useState(null);
  const [me, setMe] = useState(null);          // streak, medals, level

  /* The streak is the one thing worth saying on the hub — it is the
     reason most people opened the app at all. */
  const load = useCallback(async () => {
    setMe(await myJourney(user.id));
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
  if (open === 'senior') {
    return <Library place="senior" user={user} profile={profile} onBack={() => setOpen(null)} />;
  }
  if (open === 'plan') return <SeniorPlan onBack={() => setOpen(null)} />;
  if (open === 'yoga') {
    return <Library place="yoga" user={user} profile={profile} onBack={() => setOpen(null)} />;
  }

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: S.lg, paddingBottom: tabPad }}>
      {/* Days trained, not a streak. The streak went with the idea
          that a rest day costs you something — it does not, and a
          banner counting consecutive days was the loudest place that
          idea lived. */}
      {me ? (
        <FadeIn>
          <View style={[styles.banner, { borderColor: C.violet }]}>
            <View style={styles.streakBadge}>
              <Text style={[styles.streakNum, { color: C.violet }]}>{me.days}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.bannerTop}>
                {me.days === 1 ? t('1 day trained') : `${me.days} ${t('days trained')}`}
              </Text>
              <Text style={T.tiny}>
                {me.trainedToday
                  ? t('Today is logged ✓')
                  : me.next
                    ? `${me.toGo} ${t('more to')} ${t(me.next.place)}`
                    : t('Every place reached.')}
              </Text>
            </View>
          </View>
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
