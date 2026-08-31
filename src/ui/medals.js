/* ---------------------------------------------------------------
   Medals, levels and the line that names your rank.

   Shared by the Challenges screen, your own profile and anybody
   else's, so a medal looks the same wherever it turns up.
   --------------------------------------------------------------- */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { S, R, useTheme } from '../theme';
import { TIERS, GRADES, GRADE_COLOUR, gradeOf, LEVEL_NAME } from '../rank';

/* One tier's badge: the ring is the grade, the number is the length. */
export function Medal({ tier, count, size = 62 }) {
  const { C, T } = useTheme();
  const styles = makeStyles(C, T);
  const grade = gradeOf(count || 0);
  const colour = grade ? GRADE_COLOUR[grade] : C.line;

  return (
    <View style={{ alignItems: 'center', width: size + 10 }}>
      <View style={[
        styles.disc,
        { width: size, height: size, borderRadius: size / 2, borderColor: colour },
        grade ? { backgroundColor: colour + '1F' } : { opacity: 0.45 },
      ]}>
        <Text style={[styles.discNum, { color: grade ? colour : C.faint, fontSize: size * 0.36 }]}>
          {tier}
        </Text>
        <Text style={[styles.discDay, { color: grade ? colour : C.faint }]}>day</Text>
      </View>

      {/* four pips: how many of the four grades are in */}
      <View style={styles.pips}>
        {GRADES.map((g, i) => (
          <View key={g} style={[
            styles.pip,
            { backgroundColor: i < (count || 0) ? GRADE_COLOUR[g] : C.line },
          ]} />
        ))}
      </View>

      <Text style={[styles.grade, { color: grade ? GRADE_COLOUR[grade] : C.faint }]}>
        {grade ? grade : 'locked'}
      </Text>
    </View>
  );
}

/* All four tiers in a row. */
export function MedalRow({ medals, size = 62 }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {TIERS.map((tier) => (
        <Medal key={tier} tier={tier} count={(medals || {})[tier] || 0} size={size} />
      ))}
    </View>
  );
}

/* The headline: level, rank, and the streak carrying them. */
export function RankCard({ level, rank, current, longest, accent }) {
  const { C, T } = useTheme();
  const styles = makeStyles(C, T);
  const unranked = !rank || rank.label === 'Unranked';
  const colour = unranked ? C.faint : (GRADE_COLOUR[rank.grade] || accent || C.gold);

  return (
    <View style={[styles.rank, { borderColor: colour }]}>
      <View style={[styles.levelChip, { backgroundColor: colour + '22', borderColor: colour }]}>
        <Text style={[styles.levelTxt, { color: colour }]}>{LEVEL_NAME[level] || 'Level 1'}</Text>
      </View>

      <Text style={[styles.rankTxt, { color: unranked ? C.dim : C.text }]}>
        {unranked ? 'Unranked' : rank.label}
      </Text>

      {unranked ? (
        <Text style={[T.small, { marginTop: 4 }]}>
          Train seven days in a row for your first medal.
        </Text>
      ) : (
        <View style={styles.streakRow}>
          <View style={styles.streakBit}>
            <Text style={[styles.streakNum, { color: colour }]}>{current}</Text>
            <Text style={T.tiny}>day streak</Text>
          </View>
          <View style={styles.streakBit}>
            <Text style={styles.streakNum}>{longest}</Text>
            <Text style={T.tiny}>best ever</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  disc: {
    borderWidth: 2.5, alignItems: 'center', justifyContent: 'center',
  },
  discNum: { fontFamily: 'Forum_400Regular', lineHeight: 26 },
  discDay: { fontFamily: 'WorkSans_400Regular', fontSize: 9, letterSpacing: 0.5, marginTop: -2 },

  pips: { flexDirection: 'row', gap: 3, marginTop: 7 },
  pip: { width: 8, height: 3, borderRadius: 2 },

  grade: {
    fontFamily: 'WorkSans_500Medium', fontSize: 9.5,
    letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 5,
  },

  rank: {
    backgroundColor: C.surface, borderRadius: R.lg, padding: S.lg,
    borderWidth: 1.5, alignItems: 'center',
  },
  levelChip: {
    borderRadius: R.pill, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 4, marginBottom: S.sm,
  },
  levelTxt: { fontFamily: 'WorkSans_500Medium', fontSize: 11, letterSpacing: 1 },
  rankTxt: { fontFamily: 'Forum_400Regular', fontSize: 30, lineHeight: 34, color: C.text },

  streakRow: { flexDirection: 'row', gap: S.xl, marginTop: S.md },
  streakBit: { alignItems: 'center' },
  streakNum: { fontFamily: 'Forum_400Regular', fontSize: 30, color: C.text, lineHeight: 34 },
});
