/* ---------------------------------------------------------------
   The workout player.

   Built to the reference recordings: a get-ready countdown, then one
   exercise filling the screen with a huge timer under it, then a
   blue rest screen, then the next one. Segments across the top show
   how far through you are. Nothing waits to be pressed — the clock
   starts on its own, every time, which is the whole point of the
   thing. You put the phone down and it drives.

   One block per exercise, exactly like the reference. It stepped
   through every set for a while — four sets of seven exercises is
   twenty-eight taps of Done, and every other screen was the same
   movement again, which reads as the app being stuck rather than as
   progress. The rep scheme is still printed on the screen; it just
   is not something the app walks you through one set at a time.

   Where it still differs from the reference: that app counts down
   every move because every move is thirty seconds. Ours are sets and
   reps, and "4 × 8" is not a duration — so a lifting block ends when
   you say it does, and the countdown is the rest after it. Holds
   like a plank count themselves down, because those genuinely are a
   duration.

   Same exercises, same rep schemes, same library. Only the driving
   is new.
   --------------------------------------------------------------- */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Vibration, Platform, useWindowDimensions,
} from 'react-native';

import { S, R, useTheme } from '../theme';
import { Press } from '../ui/kit';
import { useSheet } from '../ui/sheet';
import { useLang } from '../lang';
import { Demo } from '../ui/demo';
import { parseDuration } from '../duration';
import { useClaimFullscreen } from '../fullscreen';

const READY = 10;          // seconds before the first move
/* The reference rests thirty. Forty-five between every set of every
   exercise adds four or five minutes to a session and, more to the
   point, reads as being stuck. */
const REST = 30;
const BLUE = '#1B6EF3';    // the rest screen, from the reference

/* mm:ss, always two digits, because a timer that changes width
   jitters under the eye. */
function mmss(n) {
  const s = Math.max(0, Math.ceil(n));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/* The whole rep scheme, printed as written: "4 × 8-10". Not split
   into sets any more — the app shows what to do and gets out of the
   way rather than counting your sets for you. */
function planOf(exercise) {
  return { target: String(exercise.s || '').trim(), held: parseDuration(exercise.s) };
}

/* ---------------------------------------------------------------
   A countdown that runs off a wall-clock deadline.

   Adding up setInterval ticks drifts, and drifts badly in a tab the
   browser has throttled — a timer that lies is worse than no timer.

   `key` is what says "this is a different countdown now". It used to
   reset on `seconds` changing, which was wrong in the one way that
   mattered: every rest is the same forty-five seconds, so after the
   first one the value never changed, the fired-once guard never
   cleared, and the timer reached zero and did nothing. The workout
   stopped dead on the second set and looked like it was repeating
   one exercise forever.
   --------------------------------------------------------------- */
function useCountdown(total, running, onEnd, key) {
  const [left, setLeft] = useState(total);
  const endsAt = useRef(0);
  const fired = useRef(false);
  const leftRef = useRef(total);

  /* Always call the newest callback. Held in a ref because the
     interval closes over whatever it was given when it started, and
     `advance` is a different function every render. */
  const cb = useRef(onEnd);
  useEffect(() => { cb.current = onEnd; });
  useEffect(() => { leftRef.current = left; }, [left]);

  useEffect(() => {
    setLeft(total);
    leftRef.current = total;
    fired.current = false;
  }, [key, total]);

  useEffect(() => {
    if (!running) return undefined;
    endsAt.current = Date.now() + leftRef.current * 1000;

    const id = setInterval(() => {
      const remaining = Math.max(0, (endsAt.current - Date.now()) / 1000);
      setLeft(remaining);
      if (remaining <= 0 && !fired.current) {
        fired.current = true;
        clearInterval(id);
        if (Platform.OS !== 'web') Vibration.vibrate(400);
        if (cb.current) cb.current();
      }
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, key]);

  /* +20s pushes the finish line out rather than restarting. */
  const add = useCallback((n) => {
    endsAt.current += n * 1000;
    setLeft((v) => v + n);
  }, []);

  return [left, add];
}

export default function Player({ title, exercises, onQuit, onFinish }) {
  const { C, T, MUSCLE_C } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  const sheet = useSheet();
  const { width, height } = useWindowDimensions();

  /* The whole screen, for as long as this is mounted. Released in
     the cleanup, so quitting, finishing and unmounting by any other
     route all give it back without each needing to remember. */
  useClaimFullscreen();

  /* The photographs are landscape, roughly four to three. Given the
     whole gap between the header and the panel they sit in the
     middle of it with a band of black above and below; sized to
     their own shape they fill the width and the band goes. Capped
     by what is actually free so a short screen does not push the
     controls off the bottom. */
  const stageH = Math.min(Math.round(width * 0.78), Math.max(200, height - 70 - 200));

  /* where we are: which exercise, and what is happening */
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState('ready');   // ready | work | rest | done
  const [paused, setPaused] = useState(false);

  const total = exercises.length;
  const ex = exercises[i];
  const plan = ex ? planOf(ex) : { target: '', held: null };
  const tint = ex ? (MUSCLE_C[ex.m] || C.ember) : C.ember;

  const lastEx = i >= total - 1;

  /* Rest ends, or Skip is pressed: on to the next movement. Never
     back to the one just finished. */
  const advance = useCallback(() => {
    if (lastEx) { setPhase('done'); onFinish(); return; }
    setI(i + 1);
    setPhase('work');
  }, [lastEx, i, onFinish]);

  /* ---- the three clocks. The key is what makes each hold and each
     rest a fresh countdown rather than the last one carried over. */
  const [ready] = useCountdown(READY, phase === 'ready' && !paused,
    () => setPhase('work'), 'ready');

  const [hold] = useCountdown(plan.held ? plan.held.seconds : 0,
    phase === 'work' && !!plan.held && !paused,
    () => setPhase('rest'), `hold-${i}`);

  const [restLeft, addRest] = useCountdown(REST, phase === 'rest' && !paused,
    advance, `rest-${i}`);

  async function quit() {
    const yes = await sheet.confirm({
      title: t('Stop the workout?'),
      message: `${i + 1} ${t('of')} ${total} ${t('done.')}`,
      confirmLabel: t('Stop'),
      destructive: true,
    });
    if (yes) onQuit(i);
  }

  if (!ex) return null;

  /* ---------- the blue rest screen ---------- */
  if (phase === 'rest') {
    const upcoming = exercises[Math.min(i + 1, total - 1)];

    return (
      <View style={[styles.screen, { backgroundColor: BLUE }]}>
        <Segments total={total} at={i} />

        <View style={styles.restTop}>
          <Press onPress={quit} hitSlop={14} scaleTo={0.9}>
            <Text style={styles.restX}>{'×'}</Text>
          </Press>
        </View>

        <View style={styles.restMiddle}>
          <Text style={styles.restLabel}>{t('REST')}</Text>
          <Text style={styles.restClock}>{mmss(restLeft)}</Text>

          <View style={styles.restBtns}>
            <Press onPress={() => addRest(20)} scaleTo={0.94} style={styles.restAdd}>
              <Text style={styles.restAddTxt}>+20s</Text>
            </Press>
            <Press onPress={advance} scaleTo={0.94} style={styles.restSkip}>
              <Text style={styles.restSkipTxt}>{t('SKIP')}</Text>
            </Press>
          </View>
        </View>

        <View style={styles.restNext}>
          <Text style={styles.restNextLabel}>
            {lastEx ? t('LAST ONE DONE') : `${t('NEXT')} ${i + 2}/${total}`}
          </Text>
          <View style={styles.restNextRow}>
            <Text style={styles.restNextName} numberOfLines={1}>
              {lastEx ? t('Finishing up') : upcoming.n}
            </Text>
            <Text style={styles.restNextMeta}>{lastEx ? '' : planOf(upcoming).target}</Text>
          </View>
          <View style={styles.restPreview}>
            {/* A glance, not the movement itself — filling the strip
                reads better here than showing every last pixel. */}
            <Demo exercise={upcoming} height={116} playing fit="cover"
              style={{ borderRadius: R.md }} />
          </View>
        </View>
      </View>
    );
  }

  /* ---------- get ready, and the exercise itself ---------- */
  const gettingReady = phase === 'ready';

  return (
    <View style={[styles.screen, { backgroundColor: C.bg }]}>
      <Segments total={total} at={i} />

      <View style={styles.top}>
        <Press onPress={quit} hitSlop={14} scaleTo={0.9}>
          <Text style={styles.x}>{'×'}</Text>
        </Press>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.topName} numberOfLines={1}>{ex.n}</Text>
          <Text style={styles.topMeta}>{i + 1} {t('of')} {total}</Text>
        </View>
        <View style={{ width: 26 }} />
      </View>

      {/* the movement, filling the screen */}
      <View style={[styles.stage, { height: stageH }]}>
        <Demo exercise={ex} height={stageH} playing={!paused} fit="cover"
          style={{ borderRadius: 0 }} />

        {gettingReady ? (
          <View style={styles.readyVeil}>
            <Text style={styles.readyLabel}>{t('READY TO GO')}</Text>
            <Text style={[styles.readyNum, { color: tint }]}>{Math.ceil(ready)}</Text>
            <Text style={styles.readyName}>{ex.n}</Text>
            <Press onPress={() => setPhase('work')} scaleTo={0.95} style={styles.readyBtn}>
              <Text style={styles.readyBtnTxt}>{t('Start now')}</Text>
            </Press>
          </View>
        ) : null}
      </View>

      {/* The black panel: name, clock, controls.

          While getting ready the panel shows what is coming rather
          than the same number that is already three inches high over
          the picture. Two clocks counting the same seconds is one
          clock too many. */}
      <View style={styles.panel}>
        <Text style={styles.panelName} numberOfLines={1}>{ex.n}</Text>

        <Text style={styles.clock}>
          {gettingReady ? plan.target : plan.held ? mmss(hold) : plan.target}
        </Text>
        <Text style={styles.panelHint}>
          {gettingReady ? `${t('Starting in')} ${Math.ceil(ready)}s` : ex.m}
        </Text>

        <View style={styles.controls}>
          <Press
            onPress={() => { if (i > 0) { setI(i - 1); setPhase('work'); } }}
            hitSlop={10} scaleTo={0.9} style={styles.side}
          >
            <Text style={styles.sideTxt}>{'⏮'}</Text>
          </Press>

          {/* The one big button. A hold pauses itself down; a
              lifting block is finished by hand, because nothing on a
              phone can tell when somebody racked the bar. */}
          {plan.held || gettingReady ? (
            <Press onPress={() => setPaused(!paused)} scaleTo={0.96}
              style={[styles.main, { backgroundColor: tint }]}>
              <Text style={styles.mainTxt}>{paused ? '▶' : '⏸'}</Text>
            </Press>
          ) : (
            <Press onPress={() => setPhase('rest')} scaleTo={0.96}
              style={[styles.main, { backgroundColor: tint }]}>
              <Text style={styles.mainDone}>
                {lastEx ? t('Finish') : t('Done \u2014 next')}
              </Text>
            </Press>
          )}

          <Press onPress={advance} hitSlop={10} scaleTo={0.9} style={styles.side}>
            <Text style={styles.sideTxt}>{'⏭'}</Text>
          </Press>
        </View>
      </View>
    </View>
  );
}

/* One dash per exercise, filled as they go by. */
function Segments({ total, at }) {
  const { C } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 3, paddingHorizontal: 10, paddingTop: 6 }}>
      {Array.from({ length: total }).map((_, k) => (
        <View key={k} style={{
          flex: 1, height: 3, borderRadius: 2,
          backgroundColor: k <= at ? '#FFFFFF' : 'rgba(255,255,255,0.28)',
        }} />
      ))}
    </View>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  screen: { flex: 1 },

  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.lg, paddingTop: S.sm },
  x: { fontFamily: 'WorkSans_400Regular', fontSize: 26, color: C.dim, width: 26 },
  topName: { fontFamily: 'WorkSans_600SemiBold', fontSize: 14, color: C.text },
  topMeta: { fontFamily: 'WorkSans_400Regular', fontSize: 11.5, color: C.dim, marginTop: 1 },

  stage: { overflow: 'hidden', justifyContent: 'center' },

  readyVeil: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(6,7,11,0.86)',
    alignItems: 'center', justifyContent: 'center',
  },
  readyLabel: {
    fontFamily: 'WorkSans_600SemiBold', fontSize: 13, letterSpacing: 2,
    color: 'rgba(255,255,255,0.7)',
  },
  readyNum: { fontFamily: 'WorkSans_600SemiBold', fontSize: 86, lineHeight: 96 },
  readyName: { fontFamily: 'WorkSans_500Medium', fontSize: 17, color: '#fff', marginTop: 2 },
  readyBtn: {
    marginTop: S.lg, backgroundColor: '#fff', borderRadius: R.pill,
    paddingHorizontal: 30, paddingVertical: 11,
  },
  readyBtnTxt: { fontFamily: 'WorkSans_600SemiBold', fontSize: 15, color: '#0B0B0E' },

  panel: {
    flex: 1, backgroundColor: '#08090D', paddingTop: S.lg, paddingBottom: S.lg,
    paddingHorizontal: S.lg, alignItems: 'center', justifyContent: 'center',
    borderTopLeftRadius: R.lg, borderTopRightRadius: R.lg,
  },
  panelName: { fontFamily: 'WorkSans_600SemiBold', fontSize: 17, color: '#fff' },
  clock: {
    fontFamily: 'WorkSans_600SemiBold', fontSize: 52, lineHeight: 60, color: '#fff',
    marginTop: 2,
  },
  panelHint: { fontFamily: 'WorkSans_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.5)' },

  controls: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: S.md },
  side: {
    width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  sideTxt: { fontSize: 17, color: '#fff' },
  main: {
    minWidth: 150, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24,
  },
  mainTxt: { fontSize: 20, color: '#fff' },
  mainDone: { fontFamily: 'WorkSans_600SemiBold', fontSize: 15.5, color: '#fff' },

  /* ---- rest ---- */
  restTop: { paddingHorizontal: S.lg, paddingTop: S.sm },
  restX: { fontFamily: 'WorkSans_400Regular', fontSize: 26, color: 'rgba(255,255,255,0.85)' },
  restMiddle: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  restLabel: {
    fontFamily: 'WorkSans_600SemiBold', fontSize: 18, letterSpacing: 3, color: '#fff',
  },
  restClock: {
    fontFamily: 'WorkSans_600SemiBold', fontSize: 66, lineHeight: 76, color: '#fff', marginTop: 2,
  },
  restBtns: { flexDirection: 'row', gap: 12, marginTop: S.lg },
  restAdd: {
    backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: R.pill,
    paddingHorizontal: 22, paddingVertical: 11,
  },
  restAddTxt: { fontFamily: 'WorkSans_600SemiBold', fontSize: 15, color: '#fff' },
  restSkip: { backgroundColor: '#fff', borderRadius: R.pill, paddingHorizontal: 30, paddingVertical: 11 },
  restSkipTxt: { fontFamily: 'WorkSans_600SemiBold', fontSize: 15, color: '#1B6EF3', letterSpacing: 1 },

  restNext: { padding: S.lg },
  restNextLabel: {
    fontFamily: 'WorkSans_600SemiBold', fontSize: 11, letterSpacing: 1.6,
    color: 'rgba(255,255,255,0.75)',
  },
  restNextRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  restNextName: { fontFamily: 'WorkSans_600SemiBold', fontSize: 17, color: '#fff', flex: 1 },
  restNextMeta: { fontFamily: 'WorkSans_500Medium', fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  restPreview: {
    marginTop: S.sm, borderRadius: R.md, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
});
