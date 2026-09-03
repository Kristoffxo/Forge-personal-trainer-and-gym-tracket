/* ---------------------------------------------------------------
   The map.

   Twenty-two ranks climbed from the bottom of the screen upwards,
   through four stretches of real country: a valley of green fields,
   a fogged wood, red badlands, and the northern lights over a snow
   peak. The photographs are the map.

   Nothing is written in a box. The only words on the map are
   handwritten onto the ground itself — where you are, and what the
   next week costs — because a rounded rectangle floating over a
   landscape reads as a dialog that has failed to close, and a note
   written on the ground reads as a map.

   The emblems are small. They mark a place; they are not the place.

   Where a rank sits is worked out once, in `layout()`. The trail,
   the emblems and the standing platform all read those same
   numbers, so they cannot drift apart.
   --------------------------------------------------------------- */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Press } from './kit';
import { useLang } from '../lang';
import { RANKS, TERRAIN, journeyFrom } from '../journey';

export const TERRAIN_PHOTO = {
  meadow: require('../../assets/photos/t_meadow.jpg'),
  forest: require('../../assets/photos/t_forest.jpg'),
  ember: require('../../assets/photos/t_ember.jpg'),
  frost: require('../../assets/photos/t_frost.jpg'),
};

/* One emblem per league, not per rank. Three ranks share a league
   and therefore share its emblem — which is the point: the tier
   number tells you where you are inside it, and the emblem tells
   you at a glance which league you are looking at.

   Icons by Lorc, game-icons.net, CC BY 3.0. Credited in Settings. */
export const LEAGUE_ICON = {
  bronze: require('../../assets/places/bronze.png'),
  silver: require('../../assets/places/silver.png'),
  gold: require('../../assets/places/gold.png'),
  platinum: require('../../assets/places/platinum.png'),
  diamond: require('../../assets/places/diamond.png'),
  champion: require('../../assets/places/champion.png'),
  master: require('../../assets/places/master.png'),
  titan: require('../../assets/places/titan.png'),
};

const ZOOM = {
  meadow: { scale: 1.25, anchor: 'bottom' },
  forest: { scale: 1.15, anchor: 'bottom' },
  ember: { scale: 1.1, anchor: 'bottom' },
  /* The frost band is the aurora over the summit. Its subject is the
     sky, so this one is not pushed down into its own ground. */
  frost: { scale: 1.0, anchor: 'centre' },
};

/* Twenty-two stops rather than thirteen, so each leg is shorter. */
const STEP = 118;
const TOP_PAD = 150;
const BOTTOM_PAD = 150;

export const MAP_HEIGHT = TOP_PAD + BOTTOM_PAD + STEP * (RANKS.length - 1);

/* Where each rank sits, bottom to top. `x` is a fraction of the
   width so it works at any screen size. The swing repeats every six
   ranks, which is often enough to read as a trail and regular
   enough that no emblem lands under another. */
const SWING = [0.5, 0.26, 0.7, 0.32, 0.68, 0.3];

export function layout() {
  return RANKS.map((r, i) => ({
    r,
    x: i === RANKS.length - 1 ? 0.5 : SWING[i % SWING.length],
    y: MAP_HEIGHT - BOTTOM_PAD - i * STEP,
  }));
}

function bands() {
  const spots = layout();
  const order = ['frost', 'ember', 'forest', 'meadow'];
  return order.map((key, i) => {
    const ys = spots.filter((s) => s.r.terrain === key).map((s) => s.y);
    const highest = ys.length ? Math.min(...ys) : 0;
    const top = i === 0 ? 0 : highest - STEP * 0.7;
    return { key, top, t: TERRAIN[key] };
  });
}

/* ---------------------------------------------------------------
   The ground.
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
              source={TERRAIN_PHOTO[b.key]}
              style={z.anchor === 'bottom'
                ? { position: 'absolute', left: 0, bottom: 0, width, height: h * z.scale }
                : { width, height: h }}
              resizeMode="cover"
            />
            <LinearGradient
              colors={[b.t.sky[0], 'rgba(0,0,0,0.40)', 'rgba(0,0,0,0.26)', 'rgba(0,0,0,0.44)', b.t.ground[1]]}
              locations={[0, 0.14, 0.5, 0.86, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: b.t.accent, opacity: 0.06 }]} />
          </View>
        );
      })}

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
   --------------------------------------------------------------- */
function Trail({ width, days }) {
  const spots = layout();
  const marks = [];

  for (let i = 0; i < spots.length - 1; i++) {
    const a = spots[i];
    const b = spots[i + 1];
    const from = a.r.at;
    const part = days >= b.r.at ? 1
      : days <= from ? 0
        : (days - from) / (b.r.at - from);

    const n = 7;
    for (let k = 1; k <= n; k++) {
      const t = k / (n + 1);
      const ease = t * t * (3 - 2 * t);
      const x = (a.x + (b.x - a.x) * ease) * width;
      const y = a.y + (b.y - a.y) * t;
      const lit = t <= part;

      marks.push(
        <View key={`${i}-${k}`} style={[styles.mark, {
          left: x - 3.5, top: y - 3.5,
          backgroundColor: lit ? b.r.colour : 'rgba(220,228,240,0.36)',
          shadowColor: lit ? b.r.colour : '#000',
          shadowOpacity: lit ? 1 : 0,
          shadowRadius: lit ? 7 : 0,
        }]} />,
      );
    }
  }
  return <View style={StyleSheet.absoluteFill} pointerEvents="none">{marks}</View>;
}

/* ---------------------------------------------------------------
   One rank.

   A small dark disc with a lit rim and its league emblem inside,
   and the tier number under it when the league has tiers. Nothing
   else — no plate, no day count. Reached ranks burn, the next one
   breathes, the rest are dimmed but still legible.
   --------------------------------------------------------------- */
function Node({ spot, width, days, onPress, isNext }) {
  const { r } = spot;
  const reached = days >= r.at;
  const colour = r.colour;
  /* Small. These mark a place on a landscape; at seventy pixels
     across they stop being markers and start being the view. */
  const size = r.opensLeague ? 52 : 42;

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
    /* box-none: these wrappers overlap their neighbours, and left
       touchable the transparent corner of one eats the taps meant
       for the next. */
    <View pointerEvents="box-none"
      style={{ position: 'absolute', left: spot.x * width - 58, top: spot.y - size / 2 - 8,
               width: 116, alignItems: 'center' }}>
      <Press onPress={() => onPress(r)} scaleTo={0.88} hitSlop={14} style={{ alignItems: 'center' }}>
        <View style={{ width: size + 24, height: size + 24, alignItems: 'center', justifyContent: 'center' }}>
          {isNext ? (
            <Animated.View style={[styles.ping, {
              width: size + 20, height: size + 20, borderRadius: (size + 20) / 2, borderColor: colour,
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1.3] }) }],
            }]} />
          ) : null}

          {reached || isNext ? (
            <View style={{
              position: 'absolute', width: size + 12, height: size + 12,
              borderRadius: (size + 12) / 2, backgroundColor: colour, opacity: 0.2,
            }} />
          ) : null}

          <View style={[styles.disc, {
            width: size, height: size, borderRadius: size / 2, borderColor: colour,
            shadowColor: colour,
            shadowOpacity: reached ? 0.95 : isNext ? 0.8 : 0.25,
            shadowRadius: reached ? 14 : isNext ? 12 : 5,
            opacity: reached || isNext ? 1 : 0.66,
          }]}>
            <LinearGradient
              colors={['rgba(255,255,255,0.13)', 'rgba(255,255,255,0.02)', 'rgba(0,0,0,0.5)']}
              locations={[0, 0.42, 1]}
              style={StyleSheet.absoluteFill}
            />
            <Image
              source={LEAGUE_ICON[r.league]}
              style={{ width: size * 0.56, height: size * 0.56, tintColor: colour,
                       opacity: reached || isNext ? 1 : 0.62 }}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* The whole name, not just the tier. A bare "2" under an
            emblem asks you to remember which league you were looking
            at; "Bronze 2" does not. */}
        <Text numberOfLines={1} style={[styles.tier, {
          color: colour,
          opacity: reached || isNext ? 0.98 : 0.55,
          textShadowColor: colour,
        }]}>
          {r.name}
        </Text>
      </Press>
    </View>
  );
}

/* ---------------------------------------------------------------
   Things written along the way.

   Twenty-two stops is a long scroll, and a long scroll of nothing
   but emblems is a long scroll. These are notes left on the ground
   between them — a line every few ranks, alternating sides so the
   eye keeps moving, and never on the leg being walked, which
   already has the countdown on it.

   They are indexed rather than random: the same note sits in the
   same place every time the map is opened, which is what makes it
   feel like a place rather than a slot machine.
   --------------------------------------------------------------- */
const ALONG = [
  'the first week is the hardest',
  'nobody starts strong',
  'rest days are part of it',
  'you have come further than you think',
  'a gap costs you nothing here',
  'this is where most people stop',
  'keep turning up',
  'halfway is still halfway',
  'the hard part is behind you',
  'almost nobody gets this far',
  'the air gets thin up here',
  'the summit is close',
];

function Along({ width, days }) {
  const spots = layout();
  const me = journeyFrom(days);
  const notes = [];

  /* one every third leg, starting above the second rank */
  for (let i = 2; i < spots.length - 1; i += 3) {
    const a = spots[i];
    const b = spots[i + 1];
    if (!b) break;

    /* not on the leg being walked — the countdown is written there */
    if (me.next && me.next.n === b.r.n) continue;

    const which = Math.floor(i / 3) % ALONG.length;

    /* Pinned to whichever margin is furthest from BOTH ends of the
       leg. Splitting the difference puts the note exactly where a
       rank's name is printed — which is how "the first week is the
       hardest" ended up written through the words "Silver 3". */
    const far = (edge) => Math.min(Math.abs(a.x - edge), Math.abs(b.x - edge));
    const xf = far(0.17) >= far(0.83) ? 0.17 : 0.83;
    const x = Math.max(6, Math.min(width - 206, xf * width - 100));

    notes.push(
      /* Not the midpoint of the leg. A rank's name is printed about
         forty-six points below its disc, and the midpoint lands
         thirteen points under that — which is how "rest days are
         part of it" ended up written through "Platinum 3". Three
         quarters of the way down the leg clears it. */
      <View key={i} style={{ position: 'absolute', left: x, top: b.y + STEP * 0.74,
                             width: 200, alignItems: 'center' }}>
        <Text style={[styles.handAlong, {
          /* lit once you are past it, ghosted while it is still ahead */
          color: days >= b.r.at ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.4)',
        }]}>
          {ALONG[which]}
        </Text>
      </View>,
    );
  }

  return <View style={StyleSheet.absoluteFill} pointerEvents="none">{notes}</View>;
}

/* ---------------------------------------------------------------
   Handwriting on the ground.

   Two notes, placed on the landscape rather than in a panel: one
   where you are standing, one on the leg you are walking. They are
   the map's entire text.
   --------------------------------------------------------------- */
function Notes({ width, days, t }) {
  const spots = layout();
  const me = journeyFrom(days);
  const here = me.rank ? spots.find((s) => s.r.n === me.rank.n) : null;
  const nextSpot = me.next ? spots.find((s) => s.r.n === me.next.n) : null;

  const out = [];

  /* "you are here", tucked under the rank you are standing on */
  if (here) {
    out.push(
      <View key="here" style={{ position: 'absolute', left: here.x * width - 100, top: here.y + 52,
                                width: 200, alignItems: 'center' }}>
        <Text style={[styles.hand, { color: '#fff' }]}>{t('you are here')}</Text>
      </View>,
    );
  } else if (nextSpot) {
    out.push(
      <View key="start" style={{ position: 'absolute', left: nextSpot.x * width - 100, top: nextSpot.y + 62,
                                 width: 200, alignItems: 'center' }}>
        <Text style={[styles.hand, { color: '#fff' }]}>{t('you start here')}</Text>
      </View>,
    );
  }

  /* What the next week costs, written beside the leg being walked
     rather than across it. The trail runs through the midpoint, and
     the emblems sit at both ends, so the note goes out to whichever
     side has open ground. */
  if (nextSpot && me.next) {
    const midY = here ? (here.y + nextSpot.y) / 2 : nextSpot.y - 84;
    const midXf = here ? (here.x + nextSpot.x) / 2 : nextSpot.x;
    const leftSide = midXf > 0.5;
    const wanted = (leftSide ? midXf - 0.34 : midXf + 0.34) * width - 110;
    /* clamped, or a note pushed off the trail ends up off the phone */
    const noteX = Math.max(6, Math.min(width - 226, wanted));
    out.push(
      <View key="togo" style={{ position: 'absolute', left: noteX, top: midY - 24,
                                width: 220, alignItems: 'center' }}>
        <Text style={[styles.handSmall, { color: 'rgba(255,255,255,0.92)' }]}>
          {me.toGo === 1
            ? t('train 1 more day')
            : `${t('train')} ${me.toGo} ${t('more days')}`}
        </Text>
        <Text style={[styles.handTiny, { color: me.next.colour }]}>
          {t('to reach')} {me.next.name}
        </Text>
      </View>,
    );
  }

  /* and a word at the summit, always, so the top of the map says
     what it is for even before anybody gets near it */
  const top = spots[spots.length - 1];
  out.push(
    <View key="top" style={{ position: 'absolute', left: top.x * width - 110, top: top.y - 86,
                             width: 220, alignItems: 'center' }}>
      <Text style={[styles.hand, { color: me.atTop ? top.r.colour : 'rgba(255,255,255,0.66)' }]}>
        {me.atTop ? t('you made it') : t('become a Titan')}
      </Text>
    </View>,
  );

  return <View style={StyleSheet.absoluteFill} pointerEvents="none">{out}</View>;
}

/* The platform that used to sit under your rank is gone. The
   handwriting says "you are here" in so many words, a few points
   below the same disc — two markers for one fact, and the rings ran
   straight through the writing. */

export function JourneyMap({ width, days, onPick }) {
  const { t } = useLang();
  const spots = layout();
  const nextN = (RANKS.find((r) => days < r.at) || {}).n;

  return (
    <View style={{ width, height: MAP_HEIGHT }}>
      <Ground width={width} />
      <Trail width={width} days={days} />
      {spots.map((s) => (
        <Node key={s.r.n} spot={s} width={width} days={days}
          onPress={onPick} isNext={s.r.n === nextN} />
      ))}
      <Along width={width} days={days} />
      <Notes width={width} days={days} t={t} />
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    position: 'absolute', width: 7, height: 7, borderRadius: 3.5,
    shadowOffset: { width: 0, height: 0 }, elevation: 3,
  },

  disc: {
    alignItems: 'center', justifyContent: 'center', borderWidth: 2,
    overflow: 'hidden', backgroundColor: '#080910',
    shadowOffset: { width: 0, height: 0 }, elevation: 10,
  },
  ping: { position: 'absolute', borderWidth: 2.5 },

  tier: {
    fontFamily: 'WorkSans_600SemiBold', fontSize: 11.5, marginTop: 4,
    letterSpacing: 0.3,
    textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8,
  },

  /* Handwritten, and shadowed hard, because it sits directly on a
     photograph with no plate behind it. */
  hand: {
    fontFamily: 'Caveat_700Bold', fontSize: 27, lineHeight: 31,
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 7,
  },
  handSmall: {
    fontFamily: 'Caveat_600SemiBold', fontSize: 21, lineHeight: 25,
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 7,
  },
  handAlong: {
    fontFamily: 'Caveat_600SemiBold', fontSize: 19, lineHeight: 23, textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 7,
  },
  handTiny: {
    fontFamily: 'Caveat_600SemiBold', fontSize: 18, lineHeight: 22,
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 7,
  },
});
