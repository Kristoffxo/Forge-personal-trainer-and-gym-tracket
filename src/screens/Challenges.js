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
import { Press, FadeIn, Label, Bar } from '../ui/kit';
import { useLang } from '../lang';
import { MedalRow, RankCard } from '../ui/medals';
import { TIERS, GRADE_COLOUR, gradeOf } from '../rank';
import { myStanding } from '../challenge';
import { leaderboard } from '../social';

export default function Challenges({ user, onBack }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);

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

  const next = me.next;

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: 70 }}>
      <View style={styles.head}>
        <Press onPress={onBack} hitSlop={12} scaleTo={0.94} style={{ alignSelf: 'flex-start' }}>
          <Text style={[T.small, { color: C.violet }]}>{'←'} {t('Train')}</Text>
        </Press>
        <Text style={styles.title}>{t('Challenges')}</Text>
        <Text style={[T.small, { marginTop: 2 }]}>
          {t('Just train. The medals come to you.')}
        </Text>
      </View>

      {/* where you stand */}
      <FadeIn style={{ padding: S.lg, paddingBottom: 0 }}>
        <RankCard level={me.level} rank={me.rank}
          current={me.current} longest={me.longest} accent={C.violet} />
      </FadeIn>

      {/* this week's free rest day */}
      <FadeIn delay={40} style={{ paddingHorizontal: S.lg, marginTop: S.md }}>
        <View style={[styles.rest, { borderColor: me.restUsedThisWeek ? C.amber : C.lime }]}>
          <Text style={[styles.restIcon, { color: me.restUsedThisWeek ? C.amber : C.lime }]}>
            {me.restUsedThisWeek ? '◑' : '●'}
          </Text>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[T.bodyOn, { fontSize: 14.5 }]}>
              {me.restUsedThisWeek
                ? t('Rest day used this week')
                : t('One free rest day left this week')}
            </Text>
            <Text style={T.tiny}>
              {me.restUsedThisWeek
                ? t('Miss another day before Monday and the streak resets.')
                : t('Every week you get one day off that does not break your streak.')}
            </Text>
          </View>
        </View>
      </FadeIn>

      {/* the four tiers */}
      <FadeIn delay={70} style={{ paddingHorizontal: S.lg, marginTop: S.lg }}>
        <Label style={{ marginBottom: S.md }}>{t('Your medals')}</Label>
        <View style={styles.medalBox}>
          <MedalRow medals={me.medals} size={62} />
        </View>

        {next ? (
          <View style={styles.nextBox}>
            <Text style={[T.small, { color: C.text }]}>
              {next.daysToGo} {next.daysToGo === 1 ? t('day') : t('days')} {t('to')}{' '}
              <Text style={{ color: GRADE_COLOUR[next.grade] }}>{t(next.grade)}</Text>
              {' '}{t('at the')} {next.tier} {t('day tier')}
            </Text>
            <Bar value={next.tier - next.daysToGo} max={next.tier}
              color={GRADE_COLOUR[next.grade]} height={6} style={{ marginTop: S.sm }} />
          </View>
        ) : (
          <View style={styles.nextBox}>
            <Text style={[T.small, { color: C.text }]}>
              {t('Every medal earned. There is nothing left to win — only to keep.')}
            </Text>
          </View>
        )}
      </FadeIn>

      {/* how it works */}
      <FadeIn delay={110} style={{ paddingHorizontal: S.lg, marginTop: S.lg }}>
        <Label style={{ marginBottom: S.sm }}>{t('How it works')}</Label>
        {[
          t('Any workout counts — planner, gym or home.'),
          t('7, 15, 30 and 90 days. Finish a tier four times for diamond.'),
          t('One rest day a week is free. A second missed day resets the streak.'),
          t('30 days unbroken is Level 2. 90 is Level 3. 360 is Level 4.'),
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
            {t('Longest run wins. Top of the board at the end of the month gets a reward.')}
          </Text>
          {board.map((p, i) => {
            const mine = p.id === user.id;
            const g = gradeOf((p.medals || {})[90] || (p.medals || {})[30] || 0);
            return (
              <View key={p.id} style={[styles.boardRow, mine && { borderColor: C.violet }]}>
                <Text style={[styles.place, i < 3 && { color: C.gold }]}>{i + 1}</Text>
                <Text style={[styles.boardName, mine && { color: C.violet }]}>
                  {p.name}{mine ? ' ' + t('(you)') : ''}
                </Text>
                <Text style={[T.tiny, { marginRight: 8 }]}>{t('Level')} {p.level}</Text>
                <Text style={[styles.boardStreak, g && { color: GRADE_COLOUR[g] }]}>
                  {p.best_streak}
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
  title: { fontFamily: 'Forum_400Regular', fontSize: 30, lineHeight: 34, color: C.text, marginTop: 8 },

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
  place: { fontFamily: 'Forum_400Regular', fontSize: 18, color: C.dim, width: 26 },
  boardName: { flex: 1, fontFamily: 'WorkSans_500Medium', fontSize: 14.5, color: C.text },
  boardStreak: { fontFamily: 'Forum_400Regular', fontSize: 20, color: C.text, minWidth: 30, textAlign: 'right' },
});
