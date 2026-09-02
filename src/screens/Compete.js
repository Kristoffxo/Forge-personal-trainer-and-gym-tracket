/* ---------------------------------------------------------------
   Compete.

   Sixty seconds against somebody else who is doing the same thing at
   the same moment, with both scores on both screens the whole way.

   The counting is honest about itself. Push-ups and squats are read
   from the camera where the camera can be read — MediaPipe feeding
   src/pose.js — and everything else is tapped. The screen says which
   one it is doing before the minute starts rather than after.
   --------------------------------------------------------------- */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, Image, Pressable, StyleSheet, ActivityIndicator, Vibration, Platform,
} from 'react-native';

import { S, R, useTheme } from '../theme';
import { Btn, FadeIn, Label, useTabPad } from '../ui/kit';
import { useSheet } from '../ui/sheet';
import { Avatar } from '../ui/avatar';
import { useLang } from '../lang';
import { Ring } from '../ui/ring';
import {
  MOVES, ROUND_SECONDS, joinRound, sendScore, leaveRound, watchRound, sidesOf,
} from '../compete';
import { makeCounter } from '../pose';
import { poseAvailable } from '../ui/poseCam';
import { PoseView } from '../ui/poseView';
import { framesFor } from '../exercisePhotos';
import { photoForMuscle } from '../photos';

const demoOf = (m) => (framesFor({ n: m.demo }) || [photoForMuscle('Chest')])[0];

export default function Compete({ user, profile }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  const sheet = useSheet();
  const tabPad = useTabPad();

  const [move, setMove] = useState(MOVES[0]);
  const [picking, setPicking] = useState(false);
  const [round, setRound] = useState(null);
  const [busy, setBusy] = useState(false);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(ROUND_SECONDS);
  const [phase, setPhase] = useState('idle');   // idle | waiting | running | over
  const [seeing, setSeeing] = useState(false);

  const endsAt = useRef(0);
  const pending = useRef(0);
  const roundId = useRef(null);
  const counter = useRef(null);

  const watching = poseAvailable() && move.camera;

  const onPose = useCallback((pts, tMs) => {
    if (!counter.current) return;
    const r = counter.current.push(pts, tMs);
    setSeeing(r.visible);
    if (r.counted) { pending.current = r.reps; setScore(r.reps); }
  }, []);

  useEffect(() => {
    if (!round) return undefined;
    roundId.current = round.id;
    return watchRound(round.id, (row) => setRound((old) => (old && old.id === row.id ? row : old)));
  }, [round && round.id]);   // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!round || phase !== 'waiting') return;
    if (round.b_id) { endsAt.current = Date.now() + ROUND_SECONDS * 1000; setPhase('running'); }
  }, [round, phase]);

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

  useEffect(() => {
    if (phase !== 'running') return undefined;
    const id = setInterval(() => {
      if (roundId.current) sendScore(roundId.current, pending.current, false);
    }, 600);
    return () => clearInterval(id);
  }, [phase]);

  const start = useCallback(async () => {
    setBusy(true);
    const r = await joinRound(move.key, (profile && profile.full_name) || '');
    setBusy(false);
    if (r.error) { await sheet.tell({ title: t('Could not start'), message: r.error }); return; }

    setScore(0); pending.current = 0; setLeft(ROUND_SECONDS);
    counter.current = watching ? makeCounter(move.key) : null;
    setRound(r.round);

    if (r.round.b_id) { endsAt.current = Date.now() + ROUND_SECONDS * 1000; setPhase('running'); }
    else setPhase('waiting');
  }, [move, profile, sheet, t, watching]);

  function tap() {
    if (phase !== 'running' || watching) return;
    pending.current += 1;
    setScore(pending.current);
  }

  async function quit() {
    if (round && phase === 'waiting') await leaveRound(round.id);
    setRound(null); setPhase('idle'); setScore(0); pending.current = 0; setLeft(ROUND_SECONDS);
  }

  const side = round ? sidesOf(round, user.id) : null;
  const them = side ? side.theirScore : 0;

  /* ---------- before the round ---------- */
  if (phase === 'idle' || phase === 'waiting') {
    const waiting = phase === 'waiting';
    return (
      <View style={[styles.wrap, { paddingBottom: tabPad }]}>
        <FadeIn style={{ padding: S.lg }}>
          <View style={styles.card}>
            <Text style={styles.h1}>
              <Text style={{ color: C.violet }}>{t('You')}</Text> {t('vs All')}
            </Text>
            <Text style={[T.small, styles.centre]}>
              {ROUND_SECONDS} {t('seconds, who can do max reps?')}
            </Text>

            <View style={styles.faces}>
              <View style={styles.face}>
                <Avatar name={(profile && profile.full_name) || 'You'}
                  path={profile && profile.avatar_path} at={profile && profile.avatar_at}
                  size={72} colour={C.violet} />
                <Text style={[styles.faceName, { color: C.violet }]}>{t('You')}</Text>
              </View>

              <Text style={styles.vs}>{t('VS')}</Text>

              <View style={styles.face}>
                <View style={[styles.avatar, styles.avatarGhost]}>
                  {waiting
                    ? <ActivityIndicator color={C.violet} />
                    : <Text style={[styles.avatarTxt, { color: C.faint }]}>?</Text>}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.faceName}>{t('Stranger')}</Text>
                  <View style={[styles.live, { backgroundColor: C.lime }]} />
                </View>
              </View>
            </View>

            {/* the exercise, and the list behind it */}
            <Pressable onPress={() => !waiting && setPicking(!picking)}
              style={({ pressed }) => [styles.select, pressed && { opacity: 0.85 }]}>
              <Image source={demoOf(move)} style={styles.selectImg} resizeMode="cover" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Label>{t('Exercise')}</Label>
                <Text style={styles.selectName}>{t(move.name)}</Text>
              </View>
              <Text style={styles.chev}>{picking ? '⌃' : '⌄'}</Text>
            </Pressable>

            {picking ? (
              <View style={styles.list}>
                {MOVES.map((m) => {
                  const on = m.key === move.key;
                  return (
                    <Pressable key={m.key}
                      onPress={() => { setMove(m); setPicking(false); }}
                      style={({ pressed }) => [
                        styles.listRow,
                        on && { borderColor: C.violet, backgroundColor: 'rgba(139,92,246,0.12)' },
                        pressed && { opacity: 0.85 },
                      ]}>
                      <Image source={demoOf(m)} style={styles.listImg} resizeMode="cover" />
                      <Text style={[styles.listName, on && { color: C.text }]}>{t(m.name)}</Text>
                      <View style={{ flex: 1 }} />
                      {on ? (
                        <View style={[styles.tick, { backgroundColor: C.violet }]}>
                          <Text style={styles.tickTxt}>{'✓'}</Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View style={styles.tiles}>
                <Tile label={t('TARGET')} value={t('Max Reps')} C={C} T={T} />
                <Tile label={t('DURATION')} value={`${ROUND_SECONDS} ${t('Seconds')}`} C={C} T={T} />
                <Tile label={t('COUNTING')}
                  value={watching ? t('Camera') : t('Tap')} C={C} T={T} />
              </View>
            )}

            {waiting ? (
              <>
                <Text style={[T.small, styles.centre, { marginTop: S.lg }]}>
                  {t('Looking for someone')}
                </Text>
                <Btn label={t('Cancel')} dark color={C.dim} onPress={quit}
                  style={{ marginTop: S.md }} />
              </>
            ) : (
              <Btn label={t('Find someone')} color={C.violet} busy={busy}
                onPress={start} style={{ marginTop: S.lg }} />
            )}
          </View>

          <Text style={[T.tiny, styles.centre, { marginTop: S.md }]}>
            {watching
              ? t('The camera counts. No video is saved or sent.')
              : t('Tap the screen for each rep.')}
          </Text>
        </FadeIn>
      </View>
    );
  }

  /* ---------- the round, and the result ---------- */
  const over = phase === 'over';
  const won = over && score > them;
  const drew = over && score === them;

  return (
    <View style={[styles.wrap, { paddingBottom: tabPad }]}>
      {over ? (
        <View style={styles.middle}>
          <Text style={[styles.result, { color: drew ? C.text : won ? C.lime : C.dim }]}>
            {drew ? t('A draw') : won ? t('You won') : t('They won')}
          </Text>
          <Text style={[styles.bigScore, { color: C.violet }]}>{score} — {them}</Text>
          {side && !side.theirDone ? (
            <Text style={[T.tiny, { marginTop: S.md }]}>{t('They are still finishing.')}</Text>
          ) : null}
          <Btn label={t('Again')} color={C.violet} full={false}
            onPress={quit} style={{ marginTop: S.xl }} />
        </View>
      ) : (
        <>
          {watching ? (
            <PoseView move={move} score={score} seeing={seeing} onFrame={onPose}
              onError={(e) => sheet.tell({ title: t('Camera problem'), message: e.message })} />
          ) : (
            <Pressable onPress={tap} style={({ pressed }) => [
              styles.gauge, pressed && { opacity: 0.9 },
            ]}>
              <Ring size={236} stroke={12} progress={left / ROUND_SECONDS}
                color={C.violet} track={C.line}>
                <Label>{t('YOUR REPS')}</Label>
                <Text style={styles.reps}>{score}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.live, { backgroundColor: C.lime }]} />
                  <Text style={T.tiny}>{t('Counting…')}</Text>
                </View>
              </Ring>
              <Text style={[T.tiny, { marginTop: S.md }]}>{t('Tap anywhere for each rep')}</Text>
            </Pressable>
          )}

          <View style={styles.bar}>
            <View style={styles.barCell}>
              <Label>{t('OPPONENT')}</Label>
              <Text style={[styles.barNum, { color: C.teal }]}>{them}</Text>
            </View>
            <View style={styles.barVs}><Text style={styles.barVsTxt}>{t('VS')}</Text></View>
            <View style={styles.barCell}>
              <Label>{t('TIME LEFT')}</Label>
              <Text style={[styles.barNum, { color: C.violet }]}>
                0:{String(left).padStart(2, '0')}
              </Text>
            </View>
          </View>

          <Btn label={t('Give up')} dark color={C.danger} onPress={quit}
            style={{ marginHorizontal: S.lg, marginBottom: S.md }} />
        </>
      )}
    </View>
  );
}

function Tile({ label, value, C, T }) {
  const styles = makeStyles(C, T);
  return (
    <View style={styles.tile}>
      <Label style={{ fontSize: 9 }}>{label}</Label>
      <Text style={styles.tileVal}>{value}</Text>
    </View>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: S.lg },
  centre: { textAlign: 'center' },

  card: {
    backgroundColor: C.surface, borderRadius: R.lg, padding: S.lg,
    borderWidth: 1, borderColor: C.line,
  },
  h1: {
    fontFamily: 'WorkSans_600SemiBold', fontSize: 27, color: C.text,
    textAlign: 'center',
  },

  faces: { flexDirection: 'row', alignItems: 'center', marginTop: S.lg },
  face: { flex: 1, alignItems: 'center' },
  avatar: {
    width: 92, height: 92, borderRadius: 46, borderWidth: 2.5,
    alignItems: 'center', justifyContent: 'center', backgroundColor: C.raised,
  },
  avatarGhost: { borderColor: C.line, borderStyle: 'dashed' },
  avatarTxt: { fontFamily: 'WorkSans_600SemiBold', fontSize: 34, color: C.text },
  faceName: { fontFamily: 'WorkSans_500Medium', fontSize: 13, color: C.dim, marginTop: 8 },
  live: { width: 7, height: 7, borderRadius: 4, marginLeft: 6 },
  vs: { fontFamily: 'WorkSans_600SemiBold', fontSize: 20, color: C.violet, width: 44, textAlign: 'center' },

  select: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.raised,
    borderRadius: R.md, padding: S.sm, marginTop: S.lg,
    borderWidth: 1, borderColor: C.line,
  },
  selectImg: { width: 54, height: 46, borderRadius: R.sm, backgroundColor: C.surface },
  selectName: { fontFamily: 'WorkSans_600SemiBold', fontSize: 20, color: C.text },
  chev: { fontSize: 20, color: C.dim, paddingHorizontal: 8 },

  list: {
    marginTop: S.sm, backgroundColor: C.raised, borderRadius: R.md,
    borderWidth: 1, borderColor: C.line, overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row', alignItems: 'center', padding: S.sm,
    borderWidth: 1.5, borderColor: 'transparent', borderRadius: R.md,
  },
  listImg: { width: 46, height: 40, borderRadius: R.sm, backgroundColor: C.surface },
  listName: { fontFamily: 'WorkSans_500Medium', fontSize: 16, color: C.dim, marginLeft: 12 },
  tick: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  tickTxt: { color: '#fff', fontSize: 12, fontFamily: 'WorkSans_600SemiBold' },

  tiles: { flexDirection: 'row', marginTop: S.sm, gap: 8 },
  tile: {
    flex: 1, backgroundColor: C.raised, borderRadius: R.md,
    paddingVertical: S.sm, paddingHorizontal: 8, alignItems: 'center',
  },
  tileVal: { fontFamily: 'WorkSans_600SemiBold', fontSize: 13, color: C.text, marginTop: 3 },

  gauge: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  reps: { fontFamily: 'WorkSans_600SemiBold', fontSize: 68, lineHeight: 74, color: C.text },

  bar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: R.md, margin: S.lg, marginBottom: S.sm, padding: S.md,
  },
  barCell: { flex: 1, alignItems: 'center' },
  barNum: { fontFamily: 'WorkSans_600SemiBold', fontSize: 30, lineHeight: 34 },
  barVs: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: C.raised,
    alignItems: 'center', justifyContent: 'center',
  },
  barVsTxt: { fontFamily: 'WorkSans_600SemiBold', fontSize: 13, color: C.dim },

  result: { fontFamily: 'WorkSans_600SemiBold', fontSize: 34 },
  bigScore: { fontFamily: 'WorkSans_600SemiBold', fontSize: 52, marginTop: 6 },
});
