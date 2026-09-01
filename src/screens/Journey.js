/* ---------------------------------------------------------------
   The journey.

   Where you are, what is next, and how far. Deliberately few words:
   a ring that fills, the medal you are working towards, and the
   sixteen of them laid out in order — the ones behind you filled in,
   the ones ahead still outlines.

   Nothing here is a new number. src/rank.js already worked all of it
   out from the days you trained; this screen only shows it.
   --------------------------------------------------------------- */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Animated, Easing, ActivityIndicator } from 'react-native';

import { S, R, useTheme } from '../theme';
import { FadeIn, Label, useTabPad } from '../ui/kit';
import { useLang } from '../lang';
import { myStanding } from '../challenge';
import { TIERS, GRADES, GRADE_COLOUR, LEVEL_NAME } from '../rank';
import { Ring } from '../ui/ring';

/* The four levels, by longest streak. Same numbers as src/rank.js. */
const LEVELS = [
  { level: 1, at: 0 },
  { level: 2, at: 30 },
  { level: 3, at: 90 },
  { level: 4, at: 360 },
];

/* Every medal in the app, in the order they are earned: four grades
   at each of the four tiers. `need` is how many complete runs of
   that length it takes. */
function allMedals() {
  const out = [];
  TIERS.forEach((tier) => {
    GRADES.forEach((grade, i) => {
      out.push({
        key: tier + grade,
        tier,
        grade,
        need: i + 1,
        label: cap(grade) + ' · ' + tier + ' day',
        days: tier * (i + 1),
      });
    });
  });
  return out.sort((a, b) => a.days - b.days);
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default function Journey({ user }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  const tabPad = useTabPad();
  const [me, setMe] = useState(null);

  const load = useCallback(async () => { setMe(await myStanding(user.id)); }, [user.id]);
  useEffect(() => { load(); }, [load]);

  if (!me) return <View style={styles.boot}><ActivityIndicator color={C.violet} /></View>;

  const won = (m) => (me.medals[m.tier] || 0) >= m.need;
  const medals = allMedals();
  const behind = medals.filter(won);
  const ahead = medals.filter((m) => !won(m));

  /* level progress, on the longest streak ever run */
  const here = LEVELS.filter((l) => me.longest >= l.at).pop() || LEVELS[0];
  const nextLevel = LEVELS.find((l) => l.at > me.longest) || null;
  const levelPct = nextLevel
    ? (me.longest - here.at) / (nextLevel.at - here.at)
    : 1;

  const nextMedal = me.next
    ? { colour: GRADE_COLOUR[me.next.grade],
        label: cap(me.next.grade) + ' · ' + me.next.tier + ' day',
        toGo: me.next.daysToGo }
    : null;

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: S.lg, paddingBottom: tabPad }}>
      <FadeIn>
        <View style={styles.hero}>
          <Ring size={200} stroke={11} progress={Math.max(0.015, Math.min(1, levelPct))}
            color={nextMedal ? nextMedal.colour : C.lime} track={C.line}>
            <Text style={styles.big}>{me.current}</Text>
            <Text style={T.tiny}>{t('day streak')}</Text>
          </Ring>
          <Text style={styles.rank}>{t(me.rank.label)}</Text>
          <Text style={T.small}>
            {t(LEVEL_NAME[me.level] || 'Level 1')}
            {nextLevel ? ` · ${nextLevel.at - me.longest} ${t('to the next')}` : ''}
          </Text>
        </View>
      </FadeIn>

      {nextMedal ? (
        <FadeIn delay={40}>
          <View style={[styles.nextCard, { borderColor: nextMedal.colour }]}>
            <Label style={{ color: nextMedal.colour }}>{t('Next medal')}</Label>
            <Text style={styles.nextName}>{nextMedal.label}</Text>
            <Bar value={me.next.tier - nextMedal.toGo} max={me.next.tier}
              colour={nextMedal.colour} C={C} />
            <Text style={[T.small, { marginTop: 10 }]}>
              {nextMedal.toGo === 1
                ? t('1 more day')
                : `${nextMedal.toGo} ${t('more days')}`}
            </Text>
          </View>
        </FadeIn>
      ) : (
        <FadeIn delay={40}>
          <View style={[styles.nextCard, { borderColor: C.lime }]}>
            <Text style={styles.nextName}>{t('Every medal is yours')}</Text>
          </View>
        </FadeIn>
      )}

      <Label style={{ marginTop: S.xl, marginBottom: S.sm }}>{t('Ahead')}</Label>
      {ahead.length ? ahead.slice(0, 6).map((m, i) => (
        <FadeIn key={m.key} delay={i * 22} from={6}>
          <Row m={m} styles={styles} C={C} T={T} t={t} />
        </FadeIn>
      )) : (
        <Text style={T.small}>{t('Nothing left to earn.')}</Text>
      )}

      {behind.length ? (
        <>
          <Label style={{ marginTop: S.xl, marginBottom: S.sm }}>{t('Behind you')}</Label>
          {behind.slice().reverse().map((m, i) => (
            <FadeIn key={m.key} delay={i * 20} from={6}>
              <Row m={m} won styles={styles} C={C} T={T} t={t} />
            </FadeIn>
          ))}
        </>
      ) : (
        <Text style={[T.tiny, { marginTop: S.md }]}>
          {t('Train seven days in a row for the first one.')}
        </Text>
      )}
    </ScrollView>
  );
}

function Row({ m, won, styles, C, T, t }) {
  const colour = GRADE_COLOUR[m.grade];
  return (
    <View style={[styles.row, won && { borderColor: colour }]}>
      <View style={[styles.dot, {
        borderColor: colour,
        backgroundColor: won ? colour : 'transparent',
      }]} />
      <Text style={[styles.rowName, won && { color: C.text }]}>{m.label}</Text>
      <View style={{ flex: 1 }} />
      <Text style={T.tiny}>{won ? t('earned') : `${m.days} ${t('days')}`}</Text>
    </View>
  );
}

/* Fills once, on arrival. */
function Bar({ value, max, colour, C }) {
  const a = useRef(new Animated.Value(0)).current;
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  useEffect(() => {
    Animated.timing(a, {
      toValue: pct, duration: 760, delay: 140,
      easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: false,
    }).start();
  }, [pct, a]);

  return (
    <View style={styles0(C).track}>
      <Animated.View style={[styles0(C).fill, {
        backgroundColor: colour,
        width: a.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
      }]} />
    </View>
  );
}
const styles0 = (C) => ({
  track: { height: 8, borderRadius: 4, backgroundColor: C.line, marginTop: 14, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
});

const makeStyles = (C, T) => StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },

  hero: { alignItems: 'center', paddingTop: S.sm },
  big: { fontFamily: 'WorkSans_600SemiBold', fontSize: 56, lineHeight: 60, color: C.text },
  rank: { fontFamily: 'WorkSans_600SemiBold', fontSize: 25, color: C.text, marginTop: S.md },

  nextCard: {
    backgroundColor: C.surface, borderRadius: R.md, padding: S.md,
    borderWidth: 1.5, marginTop: S.xl,
  },
  nextName: { fontFamily: 'WorkSans_600SemiBold', fontSize: 22, color: C.text, marginTop: 4 },

  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: R.sm, padding: S.md, marginBottom: 8,
    borderWidth: 1, borderColor: 'transparent',
  },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, marginRight: 12 },
  rowName: { fontFamily: 'WorkSans_500Medium', fontSize: 15, color: C.dim },
});
