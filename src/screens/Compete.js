/* ---------------------------------------------------------------
   Compete.

   Sixty seconds against somebody else who is doing it right now.
   Both scores are on both screens the whole time.

   Reps are counted from the camera where the camera can be read —
   MediaPipe's pose landmarker, running on the phone, feeding
   src/pose.js. Where it cannot, they are tapped, and the screen says
   which one it is doing rather than leaving you to wonder whether it
   is watching.
   --------------------------------------------------------------- */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Vibration, Platform } from 'react-native';

import { S, R, useTheme } from '../theme';
import { Btn, FadeIn, Label, useTabPad } from '../ui/kit';
import { useSheet } from '../ui/sheet';
import { useLang } from '../lang';
import { MOVES, ROUND_SECONDS, joinRound, sendScore, leaveRound, watchRound, sidesOf } from '../compete';
import { makeCounter } from '../pose';
import { poseAvailable, startPose } from '../ui/poseCam';
import { PoseView } from '../ui/poseView';

export default function Compete({ user, profile }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  const sheet = useSheet();
  const tabPad = useTabPad();

  const [move, setMove] = useState(null);      // chosen exercise
  const [round, setRound] = useState(null);    // the row
  const [busy, setBusy] = useState(false);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(ROUND_SECONDS);
  const [phase, setPhase] = useState('idle');  // idle | waiting | running | over

  const endsAt = useRef(0);
  const pending = useRef(0);
  const roundId = useRef(null);

  /* the camera counter, when there is one */
  const [seeing, setSeeing] = useState(false);      // body in frame
  const counter = useRef(null);
  const canWatch = poseAvailable();

  const onPose = useCallback((pts, tMs) => {
    if (!counter.current) return;
    const r = counter.current.push(pts, tMs);
    setSeeing(r.visible);
    if (r.counted) {
      pending.current = r.reps;
      setScore(r.reps);
    }
  }, []);

  /* ---- watch the other side ---- */
  useEffect(() => {
    if (!round) return undefined;
    roundId.current = round.id;
    return watchRound(round.id, (row) => setRound((old) => (old && old.id === row.id ? row : old)));
  }, [round && round.id]);   // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- the moment somebody joins, the clock starts ---- */
  useEffect(() => {
    if (!round || phase !== 'waiting') return;
    if (round.b_id) {
      endsAt.current = Date.now() + ROUND_SECONDS * 1000;
      setPhase('running');
    }
  }, [round, phase]);

  /* ---- the clock ---- */
  useEffect(() => {
    if (phase !== 'running') return undefined;
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endsAt.current - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining <= 0) {
        clearInterval(id);
        setPhase('over');
        if (Platform.OS !== 'web') Vibration.vibrate(500);
        sendScore(roundId.current, pending.current, true);
      }
    }, 200);
    return () => clearInterval(id);
  }, [phase]);

  /* ---- push the score, at most twice a second ---- */
  useEffect(() => {
    if (phase !== 'running') return undefined;
    const id = setInterval(() => {
      if (roundId.current) sendScore(roundId.current, pending.current, false);
    }, 600);
    return () => clearInterval(id);
  }, [phase]);

  const start = useCallback(async (m) => {
    setBusy(true);
    const r = await joinRound(m.key, (profile && profile.full_name) || '');
    setBusy(false);
    if (r.error) { await sheet.tell({ title: t('Could not start'), message: r.error }); return; }

    setMove(m);
    setScore(0);
    pending.current = 0;
    counter.current = canWatch ? makeCounter(m.key) : null;
    setLeft(ROUND_SECONDS);
    setRound(r.round);

    if (r.round.b_id) {
      endsAt.current = Date.now() + ROUND_SECONDS * 1000;
      setPhase('running');
    } else {
      setPhase('waiting');
    }
  }, [profile, sheet, t]);

  function tap() {
    if (phase !== 'running' || canWatch) return;
    pending.current += 1;
    setScore(pending.current);
  }

  async function quit() {
    if (round && phase === 'waiting') await leaveRound(round.id);
    setRound(null); setMove(null); setPhase('idle'); setScore(0);
    pending.current = 0;
  }

  /* ---------- pick an exercise ---------- */
  if (phase === 'idle') {
    return (
      <View style={[styles.wrap, { paddingBottom: tabPad }]}>
        <FadeIn style={{ padding: S.lg }}>
          <Text style={styles.h1}>{t('One minute. Someone else.')}</Text>
          <Text style={[T.small, { marginTop: 6 }]}>
            {t('Pick a move and you are matched with whoever else is waiting. Both scores show on both screens.')}
          </Text>

          {MOVES.map((m, i) => (
            <FadeIn key={m.key} delay={40 + i * 24}>
              <Pressable onPress={() => start(m)} disabled={busy}
                style={({ pressed }) => [styles.pick, pressed && { opacity: 0.85 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickName}>{t(m.name)}</Text>
                  <Text style={T.tiny}>{t(m.hint)}</Text>
                </View>
                <Text style={[styles.pickGo, { color: C.ember }]}>{'→'}</Text>
              </Pressable>
            </FadeIn>
          ))}

          {busy ? <ActivityIndicator color={C.ember} style={{ marginTop: S.lg }} /> : null}

          <Text style={[T.tiny, { marginTop: S.xl, lineHeight: 17 }]}>
            {canWatch
              ? t('The camera counts your reps. Nothing is recorded and no video leaves the phone.')
              : t('Reps are counted by tapping. The camera counter needs the web app.')}
          </Text>
        </FadeIn>
      </View>
    );
  }

  const side = round ? sidesOf(round, user.id) : null;

  /* ---------- waiting for somebody ---------- */
  if (phase === 'waiting') {
    return (
      <View style={[styles.wrap, styles.middle, { paddingBottom: tabPad }]}>
        <ActivityIndicator color={C.ember} size="large" />
        <Text style={[styles.h1, { marginTop: S.lg, textAlign: 'center' }]}>
          {t('Looking for someone')}
        </Text>
        <Text style={[T.small, { marginTop: 6, textAlign: 'center' }]}>
          {t(move.name)} · {ROUND_SECONDS} {t('seconds')}
        </Text>
        <Btn label={t('Cancel')} dark color={C.dim} full={false}
          onPress={quit} style={{ marginTop: S.xl }} />
      </View>
    );
  }

  /* ---------- the round, and the result ---------- */
  const over = phase === 'over';
  const won = over && side && side.myScore >= 0 && score > side.theirScore;
  const drew = over && side && score === side.theirScore;

  return (
    <View style={[styles.wrap, { paddingBottom: tabPad }]}>
      <View style={styles.scoreRow}>
        <View style={styles.half}>
          <Label>{t('You')}</Label>
          <Text style={[styles.score, { color: C.ember }]}>{score}</Text>
        </View>
        <View style={styles.clockWrap}>
          <Text style={[styles.clock, over && { color: C.dim }]}>{over ? t('Time') : left}</Text>
        </View>
        <View style={styles.half}>
          <Label>{(side && side.theirName) || t('Them')}</Label>
          <Text style={[styles.score, { color: C.teal }]}>{(side && side.theirScore) || 0}</Text>
        </View>
      </View>

      {over ? (
        <View style={styles.middle}>
          <Text style={styles.result}>
            {drew ? t('A draw') : won ? t('You won') : t('They won')}
          </Text>
          <Text style={[T.small, { marginTop: 6 }]}>
            {score} {t('to')} {(side && side.theirScore) || 0}
          </Text>
          {side && !side.theirDone ? (
            <Text style={[T.tiny, { marginTop: S.md }]}>{t('They are still finishing.')}</Text>
          ) : null}
          <Btn label={t('Again')} color={C.ember} full={false}
            onPress={quit} style={{ marginTop: S.xl }} />
        </View>
      ) : (
        canWatch ? (
          <PoseView
            move={move}
            score={score}
            seeing={seeing}
            onFrame={onPose}
            onError={(e) => sheet.tell({ title: t('Camera problem'), message: e.message })}
          />
        ) : (
          <Pressable onPress={tap} style={({ pressed }) => [
            styles.tapArea, pressed && { backgroundColor: C.raised },
          ]}>
            <Text style={styles.tapBig}>{score}</Text>
            <Text style={styles.tapHint}>{t('Tap anywhere for each rep')}</Text>
            <Text style={[T.tiny, { marginTop: 4 }]}>{t(move.name)}</Text>
          </Pressable>
        )
      )}
    </View>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: S.lg },
  h1: { fontFamily: 'WorkSans_600SemiBold', fontSize: 26, lineHeight: 31, color: C.text },

  pick: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: R.md, padding: S.md, marginTop: S.md,
  },
  pickName: { fontFamily: 'WorkSans_600SemiBold', fontSize: 19, color: C.text },
  pickGo: { fontFamily: 'WorkSans_600SemiBold', fontSize: 20 },

  scoreRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: S.lg, paddingTop: S.md, paddingBottom: S.sm,
    backgroundColor: C.surface,
  },
  half: { flex: 1, alignItems: 'center' },
  score: { fontFamily: 'WorkSans_600SemiBold', fontSize: 40, lineHeight: 45 },
  clockWrap: { width: 74, alignItems: 'center' },
  clock: { fontFamily: 'WorkSans_600SemiBold', fontSize: 26, color: C.text },

  tapArea: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    margin: S.lg, borderRadius: R.lg, borderWidth: 2, borderColor: C.line,
    backgroundColor: C.surface,
  },
  tapBig: { fontFamily: 'WorkSans_600SemiBold', fontSize: 96, lineHeight: 104, color: C.text },
  tapHint: { fontFamily: 'WorkSans_500Medium', fontSize: 15, color: C.dim, marginTop: 6 },

  result: { fontFamily: 'WorkSans_600SemiBold', fontSize: 34, color: C.text },
});
