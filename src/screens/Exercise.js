/* ---------------------------------------------------------------
   One exercise, full screen.

   You get here by tapping a move during a workout. It shows the
   movement animating, the two or three things that matter about
   form, what you lifted last time, boxes to write down what you are
   lifting now, and a rest timer that starts itself.

   The whole screen has exactly one way out: the Done button.
   --------------------------------------------------------------- */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TextInput, StyleSheet, Platform,
  KeyboardAvoidingView, useWindowDimensions,
} from 'react-native';

import { S, R, useTheme } from '../theme';
import { Btn, Press, FadeIn, Label, Bar } from '../ui/kit';
import { Demo } from '../ui/demo';
import { NumberPicker, WEIGHTS, REPS } from '../ui/picker';
import { cuesFor } from '../anim/patterns';
import { historyFor, logSet, summarise, whenWas, setsWanted, repHint } from '../sets';
import { num } from '../num';
import { useLang } from '../lang';

const REST_SECONDS = 90;

/* The middle of the prescribed range, so the picker opens somewhere
   sensible instead of at five. */
function defaultReps(scheme) {
  const m = /(\d+)\s*[–-]\s*(\d+)/.exec(String(scheme || ''));
  if (m) return nearest(REPS, (Number(m[1]) + Number(m[2])) / 2) || 8;
  const one = /×\s*(\d+)/.exec(String(scheme || ''));
  return (one && nearest(REPS, Number(one[1]))) || 8;
}

/* The closest value the picker actually offers. */
function nearest(values, n) {
  if (n == null || !isFinite(Number(n))) return null;
  const x = Number(n);
  return values.reduce((best, v) =>
    Math.abs(v - x) < Math.abs(best - x) ? v : best, values[0]);
}

export default function Exercise({ exercise, user, index, total, onDone, onBack }) {
  const { C, T, MUSCLE_C } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  const { width } = useWindowDimensions();

  const cues = cuesFor(exercise);
  const want = Math.min(3, setsWanted(exercise.s));   // three sets is the working default
  const hint = repHint(exercise.s);
  const tint = MUSCLE_C[exercise.m] || C.ember;

  const [hist, setHist] = useState(null);
  const [rows, setRows] = useState(() =>
    Array.from({ length: want }, () => ({ weight: 0, reps: defaultReps(exercise.s), done: false })));
  const [rest, setRest] = useState(0);

  const load = useCallback(() => {
    historyFor(user.id, exercise.n).then((h) => {
      setHist(h);
      // carry last session's numbers forward as the placeholder to beat
      /* Start on what you did last time — the number you have to beat
         should already be under the marker. */
      if (h.last && h.last.sets.length) {
        setRows((prev) => prev.map((r, i) => {
          const was = h.last.sets[i];
          if (!was || r.done) return r;
          return {
            ...r,
            weight: nearest(WEIGHTS, was.weight_kg) ?? r.weight,
            reps: nearest(REPS, was.reps) ?? r.reps,
          };
        }));
      }
    });
  }, [user.id, exercise.n]);

  useEffect(() => { load(); }, [load]);

  /* Rest timer. Counts itself down; a set being ticked restarts it. */
  useEffect(() => {
    if (rest <= 0) return undefined;
    const id = setTimeout(() => setRest((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [rest]);

  const doneCount = rows.filter((r) => r.done).length;

  async function tick(i) {
    const row = rows[i];
    const next = rows.map((r, j) => (j === i ? { ...r, done: !r.done } : r));
    setRows(next);

    if (!row.done) {
      setRest(REST_SECONDS);
      await logSet({
        userId: user.id,
        exercise: exercise.n,
        setNo: i + 1,
        weight: row.weight || '',
        reps: row.reps || '',
      });
    }
  }

  const stage = Math.min(width - S.lg * 2, 340);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
        {/* ---- header ---- */}
        <View style={styles.head}>
          <Press onPress={onBack} hitSlop={12} scaleTo={0.94} style={{ alignSelf: 'flex-start' }}>
            <Text style={[T.small, { color: tint }]}>{'←'} {t('Back')}</Text>
          </Press>
          <Text style={styles.title}>{exercise.n}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.pill, { borderColor: tint }]}>
              <View style={[styles.dot, { backgroundColor: tint }]} />
              <Text style={[T.tiny, { color: C.text }]}>{exercise.m}</Text>
            </View>
            <View style={styles.pill}>
              <Text style={[T.tiny, { color: C.text }]}>{exercise.e}</Text>
            </View>
            <View style={{ flex: 1 }} />
            <Text style={T.tiny}>{index + 1} {t('of')} {total}</Text>
          </View>
        </View>

        {/* ---- the movement ---- */}
        <FadeIn delay={20}>
          <Demo exercise={exercise} height={230} style={{ borderRadius: 0 }} />
        </FadeIn>

        {/* ---- form ---- */}
        <FadeIn delay={45} style={{ paddingHorizontal: S.lg }}>
          <Label style={{ marginBottom: S.sm }}>{t('How to do it')}</Label>
          {cues.map((c, i) => (
            <View key={i} style={styles.cue}>
              <Text style={[styles.cueNum, { color: tint }]}>{i + 1}</Text>
              <Text style={[T.bodyOn, { flex: 1 }]}>{t(c)}</Text>
            </View>
          ))}
        </FadeIn>

        {/* ---- last time ---- */}
        {hist && hist.last ? (
          <FadeIn delay={70} style={{ paddingHorizontal: S.lg, marginTop: S.lg }}>
            <View style={styles.lastBox}>
              <Label>{t('Last time')} · {t(whenWas(hist.last.day))}</Label>
              <Text style={styles.lastTxt}>{summarise(hist.last)}</Text>
              {hist.best && hist.best.weight_kg ? (
                <Text style={T.tiny}>
                  {t('Your best')}: {hist.best.weight_kg} kg × {hist.best.reps}
                </Text>
              ) : null}
            </View>
          </FadeIn>
        ) : null}

        {/* ---- the sets ---- */}
        <FadeIn delay={95} style={{ paddingHorizontal: S.lg, marginTop: S.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: S.sm }}>
            <Label style={{ flex: 1 }}>{t('Sets')} · {t('aim for')} {exercise.s}</Label>
            {rest > 0 ? (
              <Press onPress={() => setRest(0)} scaleTo={0.92} style={[styles.rest, { borderColor: tint }]}>
                <Text style={[styles.restTxt, { color: tint }]}>
                  {t('Rest')} {Math.floor(rest / 60)}:{String(rest % 60).padStart(2, '0')}
                </Text>
              </Press>
            ) : null}
          </View>

          {rows.map((r, i) => (
            <View key={i} style={[styles.setRow, r.done && { borderColor: C.lime, opacity: 0.6 }]}>
              <View style={styles.setHead}>
                <Text style={styles.setNo}>{t('Set')} {i + 1}</Text>
                <Press onPress={() => tick(i)} scaleTo={0.9}
                  style={[styles.check, { borderColor: r.done ? C.lime : C.line },
                    r.done && { backgroundColor: C.lime }]}>
                  {r.done ? <Text style={styles.checkTxt}>{'✓'}</Text> : null}
                </Press>
              </View>

              <View style={styles.pickRow}>
                <Text style={styles.unit}>{t('kg')}</Text>
                <View style={{ flex: 1 }}>
                  <NumberPicker
                    values={WEIGHTS} value={r.weight} colour={tint}
                    onChange={(v) => setRows(rows.map((x, j) => (j === i ? { ...x, weight: v } : x)))}
                  />
                </View>
              </View>

              <View style={styles.pickRow}>
                <Text style={styles.unit}>{t('reps')}</Text>
                <View style={{ flex: 1 }}>
                  <NumberPicker
                    values={REPS} value={r.reps} colour={C.lime}
                    onChange={(v) => setRows(rows.map((x, j) => (j === i ? { ...x, reps: v } : x)))}
                  />
                </View>
              </View>
            </View>
          ))}

          <Text style={[T.tiny, { marginTop: 8 }]}>
            {t('Scroll to the weight and reps, then tick the set.')}
          </Text>

          <Bar value={doneCount} max={want} color={tint} height={6} style={{ marginTop: S.md }} />
        </FadeIn>
      </ScrollView>

      {/* ---- the one way out ---- */}
      <View style={styles.foot}>
        <Btn
          label={index + 1 === total ? t('Done — finish workout') : t('Done — next exercise')}
          color={doneCount > 0 ? C.lime : tint}
          onPress={onDone}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  head: { paddingHorizontal: S.lg, paddingTop: S.md, paddingBottom: S.md, backgroundColor: C.surface },
  title: { fontFamily: 'WorkSans_600SemiBold', fontSize: 30, lineHeight: 35, color: C.text, marginTop: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  pill: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.line,
    borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 4, marginRight: 8,
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },

  stage: { alignItems: 'center', paddingVertical: S.md, backgroundColor: C.surface },
  stageLabel: { marginTop: 2 },

  cue: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  cueNum: { fontFamily: 'WorkSans_600SemiBold', fontSize: 17, width: 22 },

  lastBox: {
    backgroundColor: C.surface, borderRadius: R.md, padding: S.md,
    borderLeftWidth: 4, borderLeftColor: C.gold,
  },
  lastTxt: { fontFamily: 'WorkSans_600SemiBold', fontSize: 24, color: C.text, marginTop: 2, marginBottom: 2 },

  rest: { borderWidth: 1.5, borderRadius: R.pill, paddingHorizontal: 12, paddingVertical: 5 },
  restTxt: { fontFamily: 'WorkSans_500Medium', fontSize: 12.5 },

  setRow: {
    backgroundColor: C.surface, borderRadius: R.md,
    paddingHorizontal: 10, paddingTop: 8, paddingBottom: 10, marginBottom: 10,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  pickRow: { flexDirection: 'row', alignItems: 'center' },
  unit: {
    width: 42, fontFamily: 'WorkSans_500Medium', fontSize: 11,
    letterSpacing: 0.6, color: C.faint, textTransform: 'uppercase',
  },
  setHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 4, marginBottom: 4,
  },
  setNo: {
    fontFamily: 'WorkSans_500Medium', fontSize: 12, letterSpacing: 1,
    textTransform: 'uppercase', color: C.dim,
  },
  check: {
    width: 34, height: 34, borderRadius: 17, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginLeft: 6,
  },
  checkTxt: { color: C.onAccent, fontSize: 16, fontFamily: 'WorkSans_500Medium' },

  foot: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    padding: S.lg, paddingTop: S.md,
    backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.line,
  },
});
