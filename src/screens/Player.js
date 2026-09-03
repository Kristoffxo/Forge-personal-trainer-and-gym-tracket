/* ---------------------------------------------------------------
   The workout player.

   Built to the reference recordings: a get-ready countdown, then one
   exercise filling the screen with a huge timer under it, then a
   blue rest screen, then the next one. Segments across the top show
   how far through you are. Nothing waits to be pressed — the clock
   starts on its own, every time, which is the whole point of the
   thing. You put the phone down and it drives.

   Where it differs from the reference, and why: that app is a timed
   circuit where every move is thirty seconds. Ours is sets and reps
   — four sets of eight is not a duration. So the work period is a
   set rather than a countdown, and the countdown is the rest after
   it, which is the part people actually get wrong. Holds like a
   plank still count down, because those genuinely are a duration.

   Same exercises, same sets, same library. Only the driving is new.
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
const REST = 45;           // between sets, and between exercises
const BLUE = '#1B6EF3';    // the rest screen, from the reference

/* mm:ss, always two digits, because a timer that changes width
   jitters under the eye. */
function mmss(n) {
  const s = Math.max(0, Math.ceil(n));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/* How many sets, and what the target is, out of "4 × 8–10". */
function planOf(exercise) {
  const held = parseDuration(exercise.s);
  const raw = String(exercise.s || '');
  const m = raw.match(/(\d+)\s*[×x]/);
  const sets = held ? (held.sets || 1) : (m ? parseInt(m[1], 10) : 3);
  const target = raw.replace(/^\s*\d+\s*[×x]\s*/, '').trim() || raw;
  return { sets: Math.max(1, sets), target, held };
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

  /* The movement fills everything between the header and the black
     panel. Sizing it off the window rather than letting it sit
     centred in a flex box is what stops the letterboxing — the
     reference has the picture running edge to edge. */
  const stageH = Math.max(200, height - 70 - 224);

  /* where we are: which exercise, which set, and what is happening */
  const [i, setI] = useState(0);
  const [set, setSet] = useState(1);
  const [phase, setPhase] = useState('ready');   // ready | work | rest | done
  const [paused, setPaused] = useState(false);

  const total = exercises.length;
  const ex = exercises[i];
  const plan = ex ? planOf(ex) : { sets: 1, target: '', held: null };
  const tint = ex ? (MUSCLE_C[ex.m] || C.ember) : C.ember;

  /* the last set of the last exercise is the end of the workout */
  const lastSet = set >= plan.sets;
  const lastEx = i >= total - 1;

  const advance = useCallback(() => {
    if (lastSet && lastEx) { setPhase('done'); onFinish(); return; }
    if (lastSet) { setI(i + 1); setSet(1); } else { setSet(set + 1); }
    setPhase('work');
  }, [lastSet, lastEx, i, set, onFinish]);

  /* ---- the three clocks. The key is what makes each set, each
     hold and each rest a fresh countdown rather than the last one
     carried over. ---- */
  const [ready] = useCountdown(READY, phase === 'ready' && !paused,
    () => setPhase('work'), 'ready');

  const [hold] = useCountdown(plan.held ? plan.held.seconds : 0,
    phase === 'work' && !!plan.held && !paused,
    () => setPhase('rest'), `hold-${i}-${set}`);

  const [restLeft, addRest] = useCountdown(REST, phase === 'rest' && !paused,
    advance, `rest-${i}-${set}`);

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
    const nextIsNewMove = lastSet;
    const upcoming = nextIsNewMove ? exercises[Math.min(i + 1, total - 1)] : ex;

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
            {t('NEXT')} {nextIsNewMove ? `${Math.min(i + 2, total)}/${total}` : `${t('Set')} ${set + 1}/${plan.sets}`}
          </Text>
          <View style={styles.restNextRow}>
            <Text style={styles.restNextName} numberOfLines={1}>{upcoming.n}</Text>
            <Text style={styles.restNextMeta}>{plan.target}</Text>
          </View>
          <View style={styles.restPreview}>
            <Demo exercise={upcoming} height={116} playing style={{ borderRadius: R.md }} />
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
          <Text style={styles.topMeta}>
            {i + 1}/{total} · {t('Set')} {set}/{plan.sets}
          </Text>
        </View>
        <View style={{ width: 26 }} />
      </View>

      {/* the movement, filling the screen */}
      <View style={styles.stage}>
        <Demo exercise={ex} height={stageH} playing={!paused} style={{ borderRadius: 0 }} />

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
            onPress={() => {
              if (set > 1) { setSet(set - 1); setPhase('work'); }
              else if (i > 0) { setI(i - 1); setSet(1); setPhase('work'); }
            }}
            hitSlop={10} scaleTo={0.9} style={styles.side}
          >
            <Text style={styles.sideTxt}>{'⏮'}</Text>
          </Press>

          {/* The one big button. A hold pauses; a set of reps is
              finished by hand, because nothing on a phone can tell
              when somebody racked the bar. */}
          {plan.held || gettingReady ? (
            <Press onPress={() => setPaused(!paused)} scaleTo={0.96}
              style={[styles.main, { backgroundColor: tint }]}>
              <Text style={styles.mainTxt}>{paused ? '▶' : '⏸'}</Text>
            </Press>
          ) : (
            <Press onPress={() => setPhase('rest')} scaleTo={0.96}
              style={[styles.main, { backgroundColor: tint }]}>
              <Text style={styles.mainDone}>{t('Done set')}</Text>
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

  stage: { flex: 1, overflow: 'hidden', justifyContent: 'center' },

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
    backgroundColor: '#08090D', paddingTop: S.md, paddingBottom: S.lg,
    paddingHorizontal: S.lg, alignItems: 'center',
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
