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
import { activeChallenge, trainedOn, progress, dayKey } from '../challenge';

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
  const [banner, setBanner] = useState(null);   // the live challenge, if any

  /* A running challenge is the one thing worth saying on the hub —
     it is the reason someone opened the app at all. */
  const load = useCallback(async () => {
    const ch = await activeChallenge(user.id);
    if (!ch) { setBanner(null); return; }
    const days = await trainedOn(user.id, ch.started_on);
    const p = progress(ch, days);
    setBanner(p.state === 'on' || p.state === 'grace' ? { ch, p } : null);
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
      {banner ? (
        <FadeIn>
          <Press onPress={() => setOpen('challenges')} scaleTo={0.99}
            style={[styles.banner, banner.p.state === 'grace' && { borderColor: C.amber }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTop}>
                {banner.ch.days} {t('day challenge')} · {t('Day')} {banner.p.dayNumber}
              </Text>
              <Text style={T.tiny}>
                {banner.p.trainedToday
                  ? t('Today is logged ✓')
                  : t('Nothing logged today yet')}
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
