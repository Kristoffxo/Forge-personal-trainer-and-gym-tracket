/* ---------------------------------------------------------------
   Where somebody stands, and the badges they have.

   There used to be two answers to "how am I doing" living in the
   same app: a streak-and-tier system with sixteen medals called
   things like "15 day silver", and the journey map. They disagreed,
   and the tier names meant nothing on their own — nobody could tell
   you whether 15 day silver beat 30 day bronze.

   There is one answer now. Days trained, in any order, place you
   have reached on the map, one badge per place. Shared by the
   Challenges screen, your own numbers and anybody else's profile,
   so a badge looks the same wherever it turns up.
   --------------------------------------------------------------- */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { S, R, useTheme } from '../theme';
import { MILESTONES, MEDAL_COLOUR, journeyFrom } from '../journey';

/* One badge: a disc in its grade colour, the place's number inside.
   Earned ones are filled, the rest are outlines. */
export function Badge({ milestone, earned, size = 44 }) {
  const { C, T } = useTheme();
  const styles = makeStyles(C, T);
  const colour = MEDAL_COLOUR[milestone.grade];

  return (
    <View style={{ alignItems: 'center', width: size + 8 }}>
      <View style={[
        styles.disc,
        { width: size, height: size, borderRadius: size / 2, borderColor: colour },
        earned ? { backgroundColor: colour } : { opacity: 0.32 },
      ]}>
        <Text style={[styles.discNum, {
          color: earned ? '#0B0B0E' : colour, fontSize: size * 0.38,
        }]}>
          {milestone.n}
        </Text>
      </View>
    </View>
  );
}

/* Every badge, wrapped. Thirteen of them fit three rows deep on a
   phone, which is the whole set visible at once — the point being
   that you can see how much is still to come. */
export function BadgeRow({ days, size = 44 }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
      {MILESTONES.map((m) => (
        <Badge key={m.n} milestone={m} earned={(days || 0) >= m.at} size={size} />
      ))}
    </View>
  );
}

/* The headline. Level, the place you are standing in, and the two
   numbers that matter: days trained and badges held. */
export function StandingCard({ days, accent }) {
  const { C, T } = useTheme();
  const styles = makeStyles(C, T);
  const j = journeyFrom(days || 0);
  const here = j.reached[j.reached.length - 1] || null;
  const colour = here ? MEDAL_COLOUR[here.grade] : (accent || C.faint);

  return (
    <View style={[styles.rank, { borderColor: colour }]}>
      <View style={[styles.levelChip, { backgroundColor: colour + '22', borderColor: colour }]}>
        <Text style={[styles.levelTxt, { color: colour }]}>
          {j.level ? `LEVEL ${j.level}` : 'SETTING OUT'}
        </Text>
      </View>

      <Text style={[styles.rankTxt, { color: here ? C.text : C.dim }]}>
        {here ? here.place : 'The Meadow'}
      </Text>

      {j.next ? (
        <Text style={[T.small, { marginTop: 4 }]}>
          {j.toGo} {j.toGo === 1 ? 'day' : 'days'} to {j.next.place}
        </Text>
      ) : (
        <Text style={[T.small, { marginTop: 4, color: colour }]}>The summit</Text>
      )}

      <View style={styles.numRow}>
        <View style={styles.numBit}>
          <Text style={[styles.num, { color: colour }]}>{j.days}</Text>
          <Text style={T.tiny}>days trained</Text>
        </View>
        <View style={styles.numBit}>
          <Text style={styles.num}>{j.badges.length}</Text>
          <Text style={T.tiny}>of {MILESTONES.length} badges</Text>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  disc: {
    borderWidth: 2.5, alignItems: 'center', justifyContent: 'center',
  },
  discNum: { fontFamily: 'WorkSans_600SemiBold' },

  rank: {
    backgroundColor: C.surface, borderRadius: R.lg, padding: S.lg,
    borderWidth: 1.5, alignItems: 'center',
  },
  levelChip: {
    borderRadius: R.pill, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 4, marginBottom: S.sm,
  },
  levelTxt: { fontFamily: 'WorkSans_500Medium', fontSize: 11, letterSpacing: 1 },
  rankTxt: { fontFamily: 'WorkSans_600SemiBold', fontSize: 30, lineHeight: 34, color: C.text },

  numRow: { flexDirection: 'row', gap: S.xl, marginTop: S.md },
  numBit: { alignItems: 'center' },
  num: { fontFamily: 'WorkSans_600SemiBold', fontSize: 30, color: C.text, lineHeight: 34 },
});
