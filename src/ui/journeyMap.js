/* ---------------------------------------------------------------
   The map.

   Thirteen places, climbed from the bottom of the screen upwards
   through four stretches of real country: a meadow with a footpath
   worn into it, a fogged wood, volcanic ash, and a snow peak. The
   photographs are the map. Everything drawn on top — the trail, the
   medallions, the banners — is deliberately flat and bright so it
   reads against them, the way a game map reads against its terrain.

   It climbs rather than sprawling sideways because a phone is tall.
   The trail serpentines so thirteen stops fit without the screen
   becoming a list, and the whole thing scrolls.

   There is almost no writing on it. A place you have reached shows
   its name; a place you have not shows the day it opens and nothing
   else, because the whole appeal of a map is what is still dark.

   Where a place sits is worked out once, in `layout()`. The trail,
   the medallions and the you-marker all read those same numbers, so
   they cannot drift apart.
   --------------------------------------------------------------- */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { S, R, useTheme } from '../theme';
import { Press } from './kit';
import { useLang } from '../lang';
import { MILESTONES, TERRAIN, MEDAL_COLOUR } from '../journey';

/* The photographs. They live here rather than in journey.js because
   that file is plain model code the tests import under Node, where
   `require` of a .jpg means nothing. */
const PHOTO = {
  meadow: require('../../assets/photos/t_meadow.jpg'),
  forest: require('../../assets/photos/t_forest.jpg'),
  ember: require('../../assets/photos/t_ember.jpg'),
  frost: require('../../assets/photos/t_frost.jpg'),
};

/* One symbol per place. A campfire, a bridge, a windmill, a forge,
   a summit — drawn from game-icons.net, which exists precisely
   because a photograph is unreadable at sixty pixels across and a
   flat white glyph is not. Locked places show theirs dimmed rather
   than hidden: the appeal of a map is seeing what is out there
   before you can reach it.

   Icons by Lorc and Delapouite, game-icons.net, CC BY 3.0.
   The credit is repeated in Settings, where a person can read it. */
export const PLACE_ICON = {
  1: require('../../assets/places/i1.png'),
  2: require('../../assets/places/i2.png'),
  3: require('../../assets/places/i3.png'),
  4: require('../../assets/places/i4.png'),
  5: require('../../assets/places/i5.png'),
  6: require('../../assets/places/i6.png'),
  7: require('../../assets/places/i7.png'),
  8: require('../../assets/places/i8.png'),
  9: require('../../assets/places/i9.png'),
  10: require('../../assets/places/i10.png'),
  11: require('../../assets/places/i11.png'),
  12: require('../../assets/places/i12.png'),
  13: require('../../assets/places/i13.png'),
};

/* How far to zoom into each photograph, and where to hold it while
   zooming. Landscape photographs are about half sky, and a band of
   the map that is half empty blue is a band with nothing to look at.
   Drawing the image taller than its band and pinning it to the
   bottom throws the sky away and keeps the ground.

   The frost band is the exception. Its subject is the peak, in the
   middle of the frame, and cropping to the bottom of that picture
   removes the mountain — which is the one thing the top of the map
   is for. */
const ZOOM = {
  meadow: { scale: 1.25, anchor: 'bottom' },
  forest: { scale: 1.15, anchor: 'bottom' },
  ember: { scale: 1.1, anchor: 'bottom' },
  /* The frost band is the aurora over the summit. Its subject is
     the sky, so this one is not pushed down into its own ground —
     cropping to the bottom of that picture throws away the whole
     reason it is the last thing you climb to. */
  frost: { scale: 1.0, anchor: 'centre' },
};

/* How tall one leg of the climb is. */
const STEP = 152;
const TOP_PAD = 150;      // sky above the summit
const BOTTOM_PAD = 132;   // room under the first place for the you-marker

export const MAP_HEIGHT = TOP_PAD + BOTTOM_PAD + STEP * (MILESTONES.length - 1);

/* Where each place sits, bottom to top. `x` is a fraction of the
   width so it works at any screen size. The swing is wide enough to
   feel like a trail and tight enough that no plate runs off-screen. */
export function layout() {
  const swing = [0.5, 0.23, 0.74, 0.32, 0.7, 0.26, 0.62, 0.28, 0.68, 0.34, 0.72, 0.3, 0.5];
  return MILESTONES.map((m, i) => ({
    m,
    x: swing[i],
    y: MAP_HEIGHT - BOTTOM_PAD - i * STEP,
  }));
}

/* Which stretch each band covers, top of the screen downwards —
   the reverse of the order they are climbed in, because y shrinks
   as the journey rises. Listing them in journey order puts the ice
   under the meadow. */
function bands() {
  const spots = layout();
  const order = ['frost', 'ember', 'forest', 'meadow'];
  return order.map((key, i) => {
    const ys = spots.filter((s) => s.m.terrain === key).map((s) => s.y);
    const highest = ys.length ? Math.min(...ys) : 0;
    const top = i === 0 ? 0 : highest - STEP * 0.62;
    return { key, top, t: TERRAIN[key] };
  });
}

/* ---------------------------------------------------------------
   The ground.

   Each band is a photograph under a scrim. The scrim is heaviest at
   the seams, which does two jobs at once: it keeps the medallions
   legible wherever they land, and it dissolves one photograph into
   the next so the joins read as distance rather than as a cut.
   --------------------------------------------------------------- */
function Ground({ width }) {
  const bs = bands();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {bs.map((b, i) => {
        const next = bs[i + 1];
        const bottom = next ? next.top : MAP_HEIGHT;
        const h = bottom - b.top;
        const z = ZOOM[b.key];
        return (
          <View key={b.key} style={{ position: 'absolute', left: 0, right: 0, top: b.top, height: h,
                                     overflow: 'hidden' }}>
            <Image
              source={PHOTO[b.key]}
              style={z.anchor === 'bottom'
                ? { position: 'absolute', left: 0, bottom: 0, width, height: h * z.scale }
                : { width, height: h }}
              resizeMode="cover"
            />

            {/* dark at both edges, clearer through the middle */}
            <LinearGradient
              colors={[
                b.t.sky[0],
                'rgba(0,0,0,0.42)',
                'rgba(0,0,0,0.30)',
                'rgba(0,0,0,0.46)',
                b.t.ground[1],
              ]}
              locations={[0, 0.14, 0.5, 0.86, 1]}
              style={StyleSheet.absoluteFill}
            />

            {/* the band's own colour, breathed over the photograph so
                the four stretches stay distinct at a glance. Light —
                at 0.11 the fogged wood came out aquarium green. */}
            <View style={[StyleSheet.absoluteFill,
              { backgroundColor: b.t.accent, opacity: 0.06 }]} />
          </View>
        );
      })}

      {/* A horizon haze on each seam. */}
      {bs.map((b, i) => (i === 0 ? null : (
        <LinearGradient
          key={b.key + 'h'}
          colors={['rgba(0,0,0,0)', b.t.sky[0], 'rgba(0,0,0,0)']}
          style={{ position: 'absolute', left: 0, right: 0, top: b.top - 46, height: 92 }}
        />
      )))}
    </View>
  );
}

/* ---------------------------------------------------------------
   The trail.

   Dashes between one place and the next, lit as far as somebody has
   walked. The lit part stops mid-leg, which is what shows progress
   towards the next place rather than only arrival at it.
   --------------------------------------------------------------- */
function Trail({ width, days }) {
  const spots = layout();
  const marks = [];

  for (let i = 0; i < spots.length - 1; i++) {
    const a = spots[i];
    const b = spots[i + 1];
    const from = a.m.at;
    const part = days >= b.m.at ? 1
      : days <= from ? 0
        : (days - from) / (b.m.at - from);

    const n = 11;
    for (let k = 1; k <= n; k++) {
      const t = k / (n + 1);
      /* eased sideways, linear vertically: the trail bends into each
         place instead of arriving at an angle */
      const ease = t * t * (3 - 2 * t);
      const x = (a.x + (b.x - a.x) * ease) * width;
      const y = a.y + (b.y - a.y) * t;
      const lit = t <= part;
      const colour = MEDAL_COLOUR[b.m.grade];

      marks.push(
        /* Small and bright, not big and flat. A lit dash glows in
           its colour; an unlit one is a dim bead of the same size,
           so the trail reads as one line the whole way up. */
        <View key={`${i}-${k}`} style={[styles.mark, {
          left: x - 4, top: y - 4,
          backgroundColor: lit ? colour : 'rgba(220,228,240,0.42)',
          shadowColor: lit ? colour : '#000',
          shadowOpacity: lit ? 1 : 0,
          shadowRadius: lit ? 8 : 0,
        }]} />,
      );
    }
  }
  return <View style={StyleSheet.absoluteFill} pointerEvents="none">{marks}</View>;
}

/* ---------------------------------------------------------------
   One place.

   A dark glass disc with a glowing rim and its symbol lit inside.
   Every place looks like this — reached, next and locked alike —
   because a map where the far end is drawn in a different style
   stops looking like one place after another and starts looking
   like a settings list. What changes is how brightly it burns:
   reached places glow, the next one breathes, and the ones beyond
   are dimmed down but still legible, so you can see the forge long
   before you can reach it.
   --------------------------------------------------------------- */
function Node({ spot, width, days, onPress, isNext, t }) {
  const { m } = spot;
  const reached = days >= m.at;
  const colour = MEDAL_COLOUR[m.grade];
  /* Bigger than a numbered disc needed to be. These carry a
     photograph now, and a photograph has to be large enough to read
     as a campfire or a forge rather than as a dark circle. */
  const size = m.level ? 78 : 66;

  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!isNext) return undefined;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [isNext, pulse]);

  return (
    /* box-none, not the default: these wrappers are 152 wide and sit
       142 apart, so every one of them overlaps its neighbours. Left
       touchable, the transparent corner of one place eats the taps
       meant for the medallion of the next. */
    <View pointerEvents="box-none"
      style={{ position: 'absolute', left: spot.x * width - 76, top: spot.y - size / 2 - 30,
               width: 152, alignItems: 'center' }}>
      {/* a level banner, only on the four places that are one */}
      {m.level ? <Chevron label={`${t('LEVEL')} ${m.level}`} colour={colour} dim={!reached} />
        : <View style={{ height: 26 }} />}

      <Press onPress={() => onPress(m)} scaleTo={0.9}
        hitSlop={10} style={{ alignItems: 'center' }}>
        <View style={{ width: size + 30, height: size + 30, alignItems: 'center', justifyContent: 'center' }}>
          {/* the breathing ring on the place you are walking towards */}
          {isNext ? (
            <Animated.View style={[styles.ping, {
              width: size + 26, height: size + 26, borderRadius: (size + 26) / 2, borderColor: colour,
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1.32] }) }],
            }]} />
          ) : null}

          {/* an outer halo, so a lit place throws light onto the
              landscape behind it instead of sitting flat on top */}
          {reached || isNext ? (
            <View style={{
              position: 'absolute', width: size + 14, height: size + 14,
              borderRadius: (size + 14) / 2, backgroundColor: colour,
              opacity: 0.18,
            }} />
          ) : null}

          <View style={[
            styles.medal,
            {
              width: size, height: size, borderRadius: size / 2,
              borderColor: colour,
              shadowColor: colour,
              shadowOpacity: reached ? 0.95 : isNext ? 0.8 : 0.3,
              shadowRadius: reached ? 16 : isNext ? 14 : 6,
              opacity: reached || isNext ? 1 : 0.72,
            },
          ]}>
            {/* the disc is glass, not paint: a dark fill, a lit rim,
                and a soft highlight across the top third */}
            <LinearGradient
              colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.03)', 'rgba(0,0,0,0.55)']}
              locations={[0, 0.4, 1]}
              style={StyleSheet.absoluteFill}
            />
            <Image
              source={PLACE_ICON[m.n]}
              style={{ width: size * 0.56, height: size * 0.56,
                       tintColor: colour,
                       opacity: reached || isNext ? 1 : 0.6 }}
              resizeMode="contain"
            />
            {/* the specular dot, top left, that makes it read as a
                sphere rather than a ring */}
            <View style={{
              position: 'absolute', top: size * 0.1, left: size * 0.22,
              width: size * 0.15, height: size * 0.07, borderRadius: size * 0.08,
              backgroundColor: 'rgba(255,255,255,0.1)',
              transform: [{ rotate: '-20deg' }],
            }} />
          </View>
        </View>

        {/* one line of writing, never two */}
        <Tag label={reached ? m.place : `${t('Day')} ${m.at}`}
          colour={colour} dim={!reached && !isNext} />
      </Press>
    </View>
  );
}

/* ---------------------------------------------------------------
   The two label shapes from the map: a notched tag for a day or a
   place, and a chevron banner for a level. Both are built from a
   body plus two rotated squares, because there is no polygon in
   React Native and a plain rounded pill reads as a form field
   rather than as something stamped onto a map.
   --------------------------------------------------------------- */
function Cap({ colour, dim, side }) {
  return (
    <View style={{
      width: 13, height: 13, backgroundColor: 'rgba(9,10,16,0.92)',
      borderColor: dim ? 'rgba(255,255,255,0.16)' : colour,
      borderTopWidth: side === 'left' ? 0 : 1.5,
      borderLeftWidth: side === 'left' ? 1.5 : 0,
      borderBottomWidth: side === 'left' ? 1.5 : 0,
      borderRightWidth: side === 'left' ? 0 : 1.5,
      transform: [{ rotate: '45deg' }],
      marginLeft: side === 'left' ? 5 : -5,
      marginRight: side === 'left' ? -5 : 5,
    }} />
  );
}

function Tag({ label, colour, dim }) {
  return (
    <View style={styles.tagRow}>
      <Cap colour={colour} dim={dim} side="left" />
      <View style={[styles.tagBody, { borderColor: dim ? 'rgba(255,255,255,0.16)' : colour }]}>
        <Text numberOfLines={1} style={[styles.tagTxt, { color: dim ? 'rgba(233,238,246,0.66)' : '#fff' }]}>
          {label}
        </Text>
      </View>
      <Cap colour={colour} dim={dim} side="right" />
    </View>
  );
}

function Chevron({ label, colour, dim }) {
  return (
    <View style={styles.tagRow}>
      <Text style={[styles.chev, { color: dim ? 'rgba(255,255,255,0.3)' : colour }]}>{'\u2039'}</Text>
      <View style={[styles.chevBody, {
        borderColor: dim ? 'rgba(255,255,255,0.22)' : colour,
        shadowColor: colour, shadowOpacity: dim ? 0 : 0.7, shadowRadius: 8,
      }]}>
        <Text style={[styles.chevTxt, { color: dim ? 'rgba(233,238,246,0.6)' : colour }]}>{label}</Text>
      </View>
      <Text style={[styles.chev, { color: dim ? 'rgba(255,255,255,0.3)' : colour }]}>{'\u203A'}</Text>
    </View>
  );
}

/* ---------------------------------------------------------------
   Where you are standing.

   A lit platform under the last place you reached, rather than a
   dot floating on the trail. A dot on a line says "you are 17% of
   the way to the next one", which nobody needs to the percent; a
   platform says "this is where you are", which is the question
   somebody opens the map to answer.
   --------------------------------------------------------------- */
function Standing({ width, days }) {
  const spots = layout();
  const behind = spots.filter((s) => days >= s.m.at);
  const here = behind.length ? behind[behind.length - 1] : spots[0];
  const grounded = behind.length > 0;
  const colour = MEDAL_COLOUR[here.m.grade];
  const size = here.m.level ? 78 : 66;

  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(spin, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(spin, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [spin]);

  /* before the first place is reached the platform sits just below
     it, on the trail, rather than on a place nobody has been to */
  const cx = here.x * width;
  const cy = here.y + (grounded ? size / 2 + 2 : size / 2 + 70);

  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: cx - 90, top: cy, width: 180,
                                        alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <Animated.View key={i} style={{
          position: 'absolute',
          top: 2 + i * 10,
          width: 132 - i * 30, height: 30 - i * 7,
          borderRadius: 999, borderWidth: 2, borderColor: colour,
          opacity: spin.interpolate({ inputRange: [0, 1], outputRange: [0.9 - i * 0.22, 0.35 - i * 0.08] }),
          shadowColor: colour, shadowOpacity: 0.9, shadowRadius: 12,
          shadowOffset: { width: 0, height: 0 },
        }} />
      ))}
      <View style={{
        position: 'absolute', top: 0, width: 144, height: 40, borderRadius: 999,
        backgroundColor: colour, opacity: 0.16,
      }} />
    </View>
  );
}

export function JourneyMap({ width, days, onPick }) {
  const { t } = useLang();
  const spots = layout();
  const nextN = (MILESTONES.find((m) => days < m.at) || {}).n;

  return (
    <View style={{ width, height: MAP_HEIGHT }}>
      <Ground width={width} />
      <Trail width={width} days={days} />
      {spots.map((s) => (
        <Node key={s.m.n} spot={s} width={width} days={days}
          onPress={onPick} isNext={s.m.n === nextN} t={t} />
      ))}
      <Standing width={width} days={days} />
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    position: 'absolute', width: 8, height: 8, borderRadius: 4,
    shadowOffset: { width: 0, height: 0 }, elevation: 3,
  },

  medal: {
    alignItems: 'center', justifyContent: 'center', borderWidth: 2.5,
    overflow: 'hidden', backgroundColor: '#080910',
    shadowOffset: { width: 0, height: 0 }, elevation: 10,
  },

  ping: { position: 'absolute', borderWidth: 3 },

  tagRow: { flexDirection: 'row', alignItems: 'center', marginTop: 9 },
  tagBody: {
    backgroundColor: 'rgba(9,10,16,0.92)', borderTopWidth: 1.5, borderBottomWidth: 1.5,
    paddingHorizontal: 9, paddingVertical: 5, maxWidth: 132,
  },
  tagTxt: { fontFamily: 'WorkSans_600SemiBold', fontSize: 12, letterSpacing: 0.2 },

  chev: { fontFamily: 'WorkSans_600SemiBold', fontSize: 17, marginHorizontal: 3 },
  chevBody: {
    backgroundColor: 'rgba(9,10,16,0.92)', borderWidth: 1.5, borderRadius: 4,
    paddingHorizontal: 11, paddingVertical: 3.5,
    shadowOffset: { width: 0, height: 0 },
  },
  chevTxt: { fontFamily: 'WorkSans_600SemiBold', fontSize: 10.5, letterSpacing: 1.4 },

});
