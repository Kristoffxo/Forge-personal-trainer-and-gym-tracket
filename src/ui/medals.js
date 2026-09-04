/* ---------------------------------------------------------------
   Where somebody stands, and the badges they have.

   There used to be two answers to "how am I doing" living in the
   same app: a streak-and-tier system with sixteen medals called
   things like "15 day silver", and the journey map. They disagreed,
   and the tier names meant nothing on their own — nobody could tell
   you whether 15 day silver beat 30 day bronze.

   There is one answer now: which league you are in. Days trained,
   in any order, seven of them to a promotion. Shared by the
   Challenges screen, your own numbers and anybody else's profile,
   so a league looks the same wherever it turns up.
   --------------------------------------------------------------- */
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { S, R, useTheme } from '../theme';
import { RANKS, LEAGUES, journeyFrom } from '../journey';
import { LEAGUE_ICON } from './journeyMap';

/* One badge: a disc in its grade colour, the place's number inside.
   Earned ones are filled, the rest are outlines. */
export function Badge({ league, earned, size = 44 }) {
  const { C, T } = useTheme();
  const styles = makeStyles(C, T);
  const colour = league.colour;

  return (
    <View style={{ alignItems: 'center', width: size + 8 }}>
      <View style={[
        styles.disc,
        { width: size, height: size, borderRadius: size / 2, borderColor: colour },
        earned ? { backgroundColor: colour } : { opacity: 0.32 },
      ]}>
        <Image source={LEAGUE_ICON[league.key]}
          style={{ width: size * 0.52, height: size * 0.52,
                   tintColor: earned ? '#0B0B0E' : colour }}
          resizeMode="contain" />
      </View>
    </View>
  );
}

/* Every badge, wrapped. Eight of them fit two rows deep on a phone,
   which is the whole ladder visible at once — the point being that
   you can see how much is still to come. */
export function BadgeRow({ days, size = 44 }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
      {LEAGUES.map((lg) => {
        const first = RANKS.find((r) => r.league === lg.key);
        return <Badge key={lg.key} league={lg} earned={(days || 0) >= first.at} size={size} />;
      })}
    </View>
  );
}

/* The headline. Level, the place you are standing in, and the two
   numbers that matter: the score and how much of the ladder is
   behind you. */
export function StandingCard({ days, accent }) {
  const { C, T } = useTheme();
  const styles = makeStyles(C, T);
  const j = journeyFrom(days || 0);
  const here = j.rank;
  const colour = here ? here.colour : (accent || C.faint);

  return (
    <View style={[styles.rank, { borderColor: colour }]}>
      {/* The chip used to hold the league and the line under it the
          rank. With the tiers gone those are the same word, so it
          carries the score instead — which is the number the ladder
          is actually climbed with. */}
      <View style={[styles.levelChip, { backgroundColor: colour + '22', borderColor: colour }]}>
        <Text style={[styles.levelTxt, { color: colour }]}>
          {`${j.score} RS`}
        </Text>
      </View>

      <Text style={[styles.rankTxt, { color: here ? C.text : C.dim }]}>
        {here ? here.name : 'Unranked'}
      </Text>

      {j.next ? (
        <Text style={[T.small, { marginTop: 4 }]}>
          {j.toGo} {j.toGo === 1 ? 'point' : 'points'} to {j.next.name}
        </Text>
      ) : (
        <Text style={[T.small, { marginTop: 4, color: colour }]}>The top of the ladder</Text>
      )}

      <View style={styles.numRow}>
        <View style={styles.numBit}>
          <Text style={[styles.num, { color: colour }]}>{j.score}</Text>
          <Text style={T.tiny}>Reppo Score</Text>
        </View>
        <View style={styles.numBit}>
          <Text style={styles.num}>{j.reached.length}</Text>
          <Text style={T.tiny}>of {RANKS.length} leagues</Text>
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
