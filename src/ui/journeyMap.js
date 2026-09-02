/* ---------------------------------------------------------------
   The map.

   Thirteen places, climbed from the bottom of the screen upwards,
   through four bands of terrain that get colder and cleaner as they
   go. Drawn rather than painted: there is no illustration here, only
   gradients, a dotted path and the medallions themselves — which
   means it costs nothing to download and looks the same on every
   phone.

   It climbs rather than sprawling sideways because a phone is tall.
   The path serpentines left and right so thirteen stops fit without
   the screen becoming a list, and the whole thing scrolls.

   Everything about where a place sits is worked out here, once, in
   `layout()` — the path dots and the medallions read the same
   numbers, so they cannot drift apart.
   --------------------------------------------------------------- */
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { S, R, useTheme } from '../theme';
import { Press } from './kit';
import { useLang } from '../lang';
import { MILESTONES, TERRAIN, MEDAL_COLOUR, terrainOf } from '../journey';

/* How tall one leg of the climb is, and how far the path swings. */
const STEP = 128;
const TOP_PAD = 96;
const BOTTOM_PAD = 150;   // room under the first place for the you-marker

export const MAP_HEIGHT = TOP_PAD + BOTTOM_PAD + STEP * (MILESTONES.length - 1);

/* Where each place sits, bottom to top. `x` is a fraction of the
   width so it works at any screen size. */
export function layout() {
  const swing = [0.5, 0.24, 0.72, 0.35, 0.68, 0.28, 0.6, 0.3, 0.66, 0.38, 0.7, 0.32, 0.5];
  return MILESTONES.map((m, i) => ({
    m,
    x: swing[i],
    y: MAP_HEIGHT - BOTTOM_PAD - i * STEP,
  }));
}

/* ---------------------------------------------------------------
   The ground.

   Four bands, stacked, each fading into the one above it. The
   boundaries land between the milestones that change terrain.
   --------------------------------------------------------------- */
function Ground({ width }) {
  const spots = layout();

  /* Top of the screen downwards, which is the reverse of the order
     they are climbed in: y shrinks as the journey goes up, so listing
     them in journey order puts the boundaries in backwards and the
     ice ends up under the meadow. */
  const order = ['frost', 'ember', 'forest', 'meadow'];
  const bands = order.map((key, i) => {
    const ys = spots.filter((s) => s.m.terrain === key).map((s) => s.y);
    const highest = ys.length ? Math.min(...ys) : 0;
    return { key, top: i === 0 ? 0 : highest - STEP * 0.7, t: TERRAIN[key] };
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {bands.map((b, i) => {
        const next = bands[i + 1];
        const bottom = next ? next.top : MAP_HEIGHT;
        return (
          <LinearGradient
            key={b.key}
            colors={[b.t.sky[0], b.t.sky[1], b.t.ground[0], b.t.ground[1]]}
            locations={[0, 0.35, 0.7, 1]}
            style={{ position: 'absolute', left: 0, right: 0, top: b.top, height: bottom - b.top }}
          />
        );
      })}

      {/* A ridge on each boundary, so the bands read as land meeting
          land rather than as stripes. The topmost has none — there is
          nothing above the summit for it to meet. */}
      {bands.map((b, i) => (i === 0 ? null : (
        <View key={b.key + 'r'} style={{
          position: 'absolute', left: -width * 0.25, right: -width * 0.25,
          top: b.top - 30, height: 74, borderRadius: width,
          backgroundColor: b.t.sky[0], opacity: 0.9,
        }} />
      )))}
    </View>
  );
}

/* ---------------------------------------------------------------
   The path.

   Dots between one place and the next, lit up to however far along
   somebody is. The lit part stops mid-leg, which is what shows
   progress towards the next place rather than only arrival at it.
   --------------------------------------------------------------- */
function Path({ width, days }) {
  const spots = layout();
  const dots = [];

  for (let i = 0; i < spots.length - 1; i++) {
    const a = spots[i];
    const b = spots[i + 1];
    const legDone = days >= b.m.at;
    const from = a.m.at;
    const part = legDone ? 1
      : days <= from ? 0
        : (days - from) / (b.m.at - from);

    const n = 7;
    for (let k = 1; k <= n; k++) {
      const t = k / (n + 1);
      /* a gentle curve rather than a straight line: the swing is
         eased so the path bends into each place */
      const ease = t * t * (3 - 2 * t);
      const x = (a.x + (b.x - a.x) * ease) * width;
      const y = a.y + (b.y - a.y) * t;
      const lit = t <= part;
      dots.push(
        <View key={`${i}-${k}`} style={[styles.dot, {
          left: x - 3, top: y - 3,
          backgroundColor: lit ? terrainOf(b.m).accent : 'rgba(255,255,255,0.16)',
          opacity: lit ? 1 : 0.7,
        }]} />,
      );
    }
  }
  return <View style={StyleSheet.absoluteFill} pointerEvents="none">{dots}</View>;
}

/* One medallion. Lit when reached, dark and outlined when not. */
function Node({ spot, width, days, onPress, C, T, t }) {
  const { m } = spot;
  const reached = days >= m.at;
  const lead = m.medals[0];
  const colour = MEDAL_COLOUR[lead.grade];
  const size = m.level ? 62 : 54;

  return (
    <View style={{ position: 'absolute', left: spot.x * width - 74, top: spot.y - size / 2 - 8,
                   width: 148, alignItems: 'center' }}>
      {m.level ? (
        <View style={[styles.levelTag, reached && { backgroundColor: colour, borderColor: colour }]}>
          <Text style={[styles.levelTxt, reached && { color: '#0B0B0E' }]}>
            {t('Level')} {m.level}
          </Text>
        </View>
      ) : null}

      <Press onPress={() => onPress(m)} scaleTo={0.9} style={{ alignItems: 'center' }}>
        <View style={[
          styles.medal,
          { width: size, height: size, borderRadius: size / 2, borderColor: colour },
          reached ? { backgroundColor: colour } : { backgroundColor: 'rgba(8,8,12,0.72)' },
        ]}>
          <Text style={[styles.medalNum, { color: reached ? '#0B0B0E' : colour }]}>{m.n}</Text>
        </View>

        <View style={styles.plate}>
          {m.medals.map((md) => (
            <Text key={md.tier + md.grade} style={[styles.plateTop, { color: MEDAL_COLOUR[md.grade] }]}>
              {md.tier} {t('DAY')} {t(md.grade.toUpperCase())}
            </Text>
          ))}
          <Text style={styles.plateDay}>{t('Day')} {m.at}</Text>
        </View>
      </Press>
    </View>
  );
}

/* You, somewhere along the path. */
function Marker({ width, days }) {
  const spots = layout();
  const behind = spots.filter((s) => days >= s.m.at);
  const i = behind.length - 1;

  let x; let y;
  if (i < 0) {
    x = spots[0].x * width; y = spots[0].y + 116;   // clear of the first plate
  } else if (i >= spots.length - 1) {
    x = spots[spots.length - 1].x * width; y = spots[spots.length - 1].y;
  } else {
    const a = spots[i]; const b = spots[i + 1];
    const part = (days - a.m.at) / (b.m.at - a.m.at);
    const ease = part * part * (3 - 2 * part);
    x = (a.x + (b.x - a.x) * ease) * width;
    y = a.y + (b.y - a.y) * part;
  }

  return (
    <View style={[styles.you, { left: x - 18, top: y - 18 }]} pointerEvents="none">
      <View style={styles.youDot} />
    </View>
  );
}

export function JourneyMap({ width, days, onPick }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const spots = layout();

  return (
    <View style={{ width, height: MAP_HEIGHT }}>
      <Ground width={width} />
      <Path width={width} days={days} />
      {spots.map((s) => (
        <Node key={s.m.n} spot={s} width={width} days={days}
          onPress={onPick} C={C} T={T} t={t} />
      ))}
      <Marker width={width} days={days} />
    </View>
  );
}

const styles = StyleSheet.create({
  dot: { position: 'absolute', width: 6, height: 6, borderRadius: 3 },

  medal: {
    alignItems: 'center', justifyContent: 'center', borderWidth: 2.5,
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  medalNum: { fontFamily: 'WorkSans_600SemiBold', fontSize: 22 },

  plate: {
    marginTop: 7, backgroundColor: 'rgba(8,8,12,0.82)', borderRadius: 8,
    paddingHorizontal: 9, paddingVertical: 5, alignItems: 'center',
  },
  plateTop: {
    fontFamily: 'WorkSans_600SemiBold', fontSize: 9, letterSpacing: 0.5,
  },
  plateDay: {
    fontFamily: 'WorkSans_400Regular', fontSize: 9.5, color: 'rgba(255,255,255,0.62)', marginTop: 1,
  },

  levelTag: {
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)', borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 3, marginBottom: 7,
    backgroundColor: 'rgba(8,8,12,0.8)',
  },
  levelTxt: {
    fontFamily: 'WorkSans_600SemiBold', fontSize: 10, letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.9)',
  },

  you: {
    position: 'absolute', width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 2, borderColor: '#fff',
  },
  youDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#fff' },
});
