/* ---------------------------------------------------------------
   The map.

   Eight leagues climbed from the bottom of the screen upwards,
   through one valley — green fields at your feet, peaks at the top.
   The photograph is the map.

   It used to be four photographs stacked into bands, and what people
   saw was the seams between them. One picture has no seams.

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
  valley: require('../../assets/photos/t_meadow.jpg'),
};

/* One emblem per league.

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

/* Eight stops now rather than twenty-two, so each leg is longer
   and the whole climb still fills a screen and a half. */
const STEP = 150;
const TOP_PAD = 150;
const BOTTOM_PAD = 150;

export const MAP_HEIGHT = TOP_PAD + BOTTOM_PAD + STEP * (RANKS.length - 1);

/* Where each rank sits, bottom to top. `x` is a fraction of the
   width so it works at any screen size.

   One value per league rather than a repeating cycle: eight stops is
   few enough to draw the path deliberately, and a path drawn on
   purpose reads better than one that happens to come out of a
   modulo. It starts and ends in the middle and leans a little wider
   as it climbs. */
const SWING = [0.5, 0.28, 0.68, 0.3, 0.72, 0.32, 0.64, 0.5];

export function layout() {
  return RANKS.map((r, i) => ({
    r,
    x: SWING[i] != null ? SWING[i] : 0.5,
    y: MAP_HEIGHT - BOTTOM_PAD - i * STEP,
  }));
}

/* ---------------------------------------------------------------
   The ground.

   One photograph over the whole map, and one scrim over that.

   The scrim is the only thing making the emblems and the handwriting
   legible, so it is darkest at the two ends — where the standing
   platform and the summit sit — and lightest across the middle,
   where the picture is doing the work.
   --------------------------------------------------------------- */
function Ground({ width }) {
  const t = TERRAIN.valley;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image
        source={TERRAIN_PHOTO.valley}
        style={{ position: 'absolute', left: 0, top: 0, width, height: MAP_HEIGHT }}
        resizeMode="cover"
      />
      <LinearGradient
        colors={[
          t.sky[0],
          'rgba(6,10,9,0.62)',
          'rgba(6,10,9,0.50)',
          'rgba(6,10,9,0.30)',
          'rgba(6,10,9,0.34)',
          'rgba(6,10,9,0.58)',
          t.ground[1],
        ]}
        /* Heavier over the top third than the middle. That end of
           the photograph is cloud and bright rock, and Master and
           Titan are the two palest labels on the map — they were
           washing out against it. The valley floor needs no such
           help, so the scrim thins out on the way down. */
        locations={[0, 0.10, 0.30, 0.52, 0.72, 0.92, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* A breath of the valley's own green over the lot, so the
          scrim reads as evening rather than as grey paint. */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: t.accent, opacity: 0.05 }]} />
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
          /* A name has to be readable before you have earned it —
             that is most of what the map is for. 0.55 disappeared
             into dark rock now that there is one photograph rather
             than four flat bands. */
          opacity: reached || isNext ? 0.98 : 0.74,
          /* Black, not the label's own colour. A coloured glow lifts
             coloured text off dark rock and does nothing at all
             against bright cloud, which is where the top of a single
             photograph puts Master and Titan. A dark halo works on
             both. */
          textShadowColor: 'rgba(0,0,0,0.92)',
        }]}>
          {r.name}
        </Text>
      </Press>
    </View>
  );
}

/* ---------------------------------------------------------------
   Things written along the way.

   A climb of nothing but emblems is a long scroll. These are notes
   left on the ground between them — a line every few leagues,
   alternating sides so the eye keeps moving, and never on the leg
   being walked, which already has the countdown on it.

   They are indexed rather than random: the same note sits in the
   same place every time the map is opened, which is what makes it
   feel like a place rather than a slot machine.
   --------------------------------------------------------------- */
const ALONG = [
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
      /* Halfway down the leg. This used to sit three quarters of the
         way down, which cleared the upper rank's printed name back
         when a leg was 118 points; at 150 it walked straight into
         the disc of the rank below. Halfway is the one place that is
         clear of both however long the leg is. */
      <View key={i} style={{ position: 'absolute', left: x, top: b.y + STEP * 0.5,
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
            : `${me.toGo} ${me.toGo === 1 ? t('more point') : t('more points')}`}
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
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6,
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
