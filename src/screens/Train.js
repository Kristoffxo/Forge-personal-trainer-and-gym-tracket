/* ---------------------------------------------------------------
   The Train tab.

   Four ways in, because people arrive wanting different things:

     7 Day Workout Planner   write me a week and tell me what today is
     Gym Workouts            I am at the gym, today is chest
     Home Workouts           I have a floor and maybe a dumbbell
     Challenges              give me a reason to turn up tomorrow

   The hub is deliberately four large targets and nothing else. Every
   screen behind it knows how to get back here.
   --------------------------------------------------------------- */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

import { S, R, useTheme } from '../theme';
import { Press, FadeIn } from '../ui/kit';
import { useLang } from '../lang';
import { myStanding } from '../challenge';
import { GRADE_COLOUR } from '../rank';

import Planner from './Training';
import Library from './Library';
import Challenges from './Challenges';

const BOXES = [
  {
    key: 'planner', icon: '▦', colorKey: 'ember',
    name: '7 Day Workout Planner',
    sub: 'A week built around your days, ticked off as you go',
  },
  {
    key: 'gym', icon: '▲', colorKey: 'amber',
    name: 'Gym Workouts',
    sub: 'Push, pull, legs — or pick one muscle',
  },
  {
    key: 'home', icon: '◆', colorKey: 'teal',
    name: 'Home Workouts',
    sub: 'Bodyweight, or one dumbbell',
  },
  {
    key: 'challenges', icon: '✦', colorKey: 'violet',
    name: 'Challenges',
    sub: '7, 15, 30 or 90 days without missing',
  },
];

export default function Train({ user, profile }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);

  const [open, setOpen] = useState(null);
  const [me, setMe] = useState(null);          // streak, medals, level

  /* The streak is the one thing worth saying on the hub — it is the
     reason most people opened the app at all. */
  const load = useCallback(async () => {
    setMe(await myStanding(user.id));
  }, [user.id]);

  useEffect(() => { load(); }, [load, open]);

  if (open === 'planner') return <Planner user={user} onBack={() => setOpen(null)} />;
  if (open === 'gym') {
    return <Library place="gym" user={user} profile={profile} onBack={() => setOpen(null)} />;
  }
  if (open === 'home') {
    return <Library place="home" user={user} profile={profile} onBack={() => setOpen(null)} />;
  }
  if (open === 'challenges') return <Challenges user={user} onBack={() => setOpen(null)} />;

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: S.lg, paddingBottom: 70 }}>
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
          <FadeIn key={b.key} delay={i * 40} from={8}>
            <Press onPress={() => setOpen(b.key)} scaleTo={0.98}
              style={[styles.box, { borderColor: c }]}>
              <View style={[styles.iconWrap, { backgroundColor: c + '22' }]}>
                <Text style={[styles.icon, { color: c }]}>{b.icon}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.boxName}>{t(b.name)}</Text>
                <Text style={[T.small, { marginTop: 2 }]}>{t(b.sub)}</Text>
              </View>
              <Text style={styles.chev}>{'›'}</Text>
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
  streakNum: { fontFamily: 'Forum_400Regular', fontSize: 20, lineHeight: 24 },

  box: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: R.lg, padding: S.lg, marginBottom: S.md,
    borderWidth: 1.5,
  },
  iconWrap: {
    width: 52, height: 52, borderRadius: R.md,
    alignItems: 'center', justifyContent: 'center',
  },
  icon: { fontSize: 24 },
  boxName: { fontFamily: 'Forum_400Regular', fontSize: 23, lineHeight: 27, color: C.text },
  chev: { fontSize: 24, color: C.faint, paddingLeft: 6 },
});
