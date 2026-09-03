/* ---------------------------------------------------------------
   Challenges.

   There is nothing to start. You train, the days add up, and the
   medals arrive on their own — which is the only version of this
   that survives a real life, because nobody remembers to press
   Start before a good month.

   Four tiers, four grades each. Every complete block of seven days
   inside a run earns a grade at the seven tier, and so on up. Do a
   tier four times and it goes diamond.

   One rest day a week is free and does not break anything. That is
   said plainly on this screen, because a rule nobody knows about is
   not a kindness.
   --------------------------------------------------------------- */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';

import { S, R, useTheme } from '../theme';
import { Press, FadeIn, Label, Bar, useTabPad } from '../ui/kit';
import { useLang } from '../lang';
import { BadgeRow, StandingCard } from '../ui/medals';
import { journeyFrom } from '../journey';
import { myStanding } from '../challenge';
import { leaderboard } from '../social';

export default function Challenges({ user, onBack }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  const tabPad = useTabPad();

  const [me, setMe] = useState(null);
  const [board, setBoard] = useState([]);

  const load = useCallback(async () => {
    setMe(await myStanding(user.id));
    setBoard(await leaderboard(10));
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  if (!me) {
    return <View style={styles.boot}><ActivityIndicator color={C.violet} /></View>;
  }

  const here = journeyFrom(me.trained);

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: tabPad }}>
      <View style={styles.head}>
        <Press onPress={onBack} hitSlop={12} scaleTo={0.94} style={{ alignSelf: 'flex-start' }}>
          <Text style={[T.small, { color: C.violet }]}>{'←'} {t('Train')}</Text>
        </Press>
        <Text style={styles.title}>{t('Challenges')}</Text>
        <Text style={[T.small, { marginTop: 2 }]}>
          {t('Train seven days, go up a league.')}
        </Text>
      </View>

      {/* where you stand */}
      <FadeIn style={{ padding: S.lg, paddingBottom: 0 }}>
        <StandingCard days={me.trained} accent={C.violet} />
      </FadeIn>

      {/* the badges */}
      <FadeIn delay={70} style={{ paddingHorizontal: S.lg, marginTop: S.lg }}>
        <Label style={{ marginBottom: S.md }}>{t('Leagues')}</Label>
        <View style={styles.medalBox}>
          <BadgeRow days={me.trained} size={44} />
        </View>

        {here.next ? (
          <View style={styles.nextBox}>
            <Text style={[T.small, { color: C.text }]}>
              {here.toGo} {here.toGo === 1 ? t('day') : t('days')} {t('to')}{' '}
              <Text style={{ color: here.next.colour }}>{t(here.next.name)}</Text>
            </Text>
            <Bar value={here.progress} max={1}
              color={here.next.colour} height={6} style={{ marginTop: S.sm }} />
          </View>
        ) : (
          <View style={styles.nextBox}>
            <Text style={[T.small, { color: C.text }]}>
              {t('Titan. Nothing left to win — only to keep.')}
            </Text>
          </View>
        )}
      </FadeIn>

      {/* how it works */}
      <FadeIn delay={110} style={{ paddingHorizontal: S.lg, marginTop: S.lg }}>
        <Label style={{ marginBottom: S.sm }}>{t('How it works')}</Label>
        {[
          t('Any workout counts — planner, gym or home.'),
          t('Seven days of training is a promotion. Rest days take nothing away.'),
          t('Bronze, Silver, Gold, Platinum, Diamond, Champion, Master.'),
          t('Three steps in each, and then you are a Titan.'),
        ].map((line, i) => (
          <View key={i} style={styles.ruleRow}>
            <Text style={[styles.ruleDot, { color: C.violet }]}>{'—'}</Text>
            <Text style={[T.small, { flex: 1 }]}>{line}</Text>
          </View>
        ))}
      </FadeIn>

      {/* the board */}
      {board.length ? (
        <FadeIn delay={150} style={{ paddingHorizontal: S.lg, marginTop: S.lg }}>
          <Label style={{ marginBottom: S.sm }}>{t('This month')}</Label>
          <Text style={[T.tiny, { marginBottom: S.sm }]}>
            {t('Most days trained wins. Top of the board at the end of the month gets a reward.')}
          </Text>
          {board.map((p, i) => {
            const mine = p.id === user.id;
            const their = journeyFrom(p.days_trained || 0).rank;
            return (
              <View key={p.id} style={[styles.boardRow, mine && { borderColor: C.violet }]}>
                <Text style={[styles.place, i < 3 && { color: C.gold }]}>{i + 1}</Text>
                <Text style={[styles.boardName, mine && { color: C.violet }]}>
                  {p.name}{mine ? ' ' + t('(you)') : ''}
                </Text>
                <Text style={[T.tiny, { marginRight: 8 }]}>{their ? t(their.name) : t('Unranked')}</Text>
                <Text style={[styles.boardStreak, their && { color: their.colour }]}>
                  {p.days_trained || 0}
                </Text>
              </View>
            );
          })}
        </FadeIn>
      ) : null}
    </ScrollView>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  head: { paddingHorizontal: S.lg, paddingTop: S.md, paddingBottom: S.md, backgroundColor: C.surface },
  title: { fontFamily: 'WorkSans_600SemiBold', fontSize: 30, lineHeight: 34, color: C.text, marginTop: 8 },

  rest: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: R.md, padding: S.md, borderWidth: 1.5,
  },
  restIcon: { fontSize: 18 },

  medalBox: { backgroundColor: C.surface, borderRadius: R.lg, padding: S.md },
  nextBox: {
    backgroundColor: C.surface, borderRadius: R.md, padding: S.md, marginTop: S.sm,
  },

  ruleRow: { flexDirection: 'row', marginBottom: 7 },
  ruleDot: { width: 18, fontSize: 13 },

  boardRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: R.sm, paddingHorizontal: S.md, paddingVertical: 11, marginBottom: 7,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  place: { fontFamily: 'WorkSans_600SemiBold', fontSize: 18, color: C.dim, width: 26 },
  boardName: { flex: 1, fontFamily: 'WorkSans_500Medium', fontSize: 14.5, color: C.text },
  boardStreak: { fontFamily: 'WorkSans_600SemiBold', fontSize: 20, color: C.text, minWidth: 30, textAlign: 'right' },
});
