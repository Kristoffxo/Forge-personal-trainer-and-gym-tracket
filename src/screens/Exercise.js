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
import { Figure } from '../anim/figure';
import { patternFor, cuesFor } from '../anim/patterns';
import { historyFor, logSet, summarise, whenWas, setsWanted, repHint } from '../sets';
import { num } from '../num';
import { useLang } from '../lang';

const REST_SECONDS = 90;

export default function Exercise({ exercise, user, index, total, onDone, onBack }) {
  const { C, T, MUSCLE_C } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  const { width } = useWindowDimensions();

  const pattern = patternFor(exercise);
  const cues = cuesFor(exercise);
  const want = setsWanted(exercise.s);
  const hint = repHint(exercise.s);
  const tint = MUSCLE_C[exercise.m] || C.ember;

  const [hist, setHist] = useState(null);
  const [rows, setRows] = useState(() =>
    Array.from({ length: want }, () => ({ weight: '', reps: '', done: false })));
  const [rest, setRest] = useState(0);

  const load = useCallback(() => {
    historyFor(user.id, exercise.n).then((h) => {
      setHist(h);
      // carry last session's numbers forward as the placeholder to beat
      if (h.last && h.last.sets.length) {
        setRows((prev) => prev.map((r, i) => {
          const was = h.last.sets[i];
          if (r.weight || r.reps || !was) return r;
          return { ...r, hintW: was.weight_kg, hintR: was.reps };
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
        weight: row.weight === '' ? row.hintW ?? '' : num(row.weight),
        reps: row.reps === '' ? row.hintR ?? '' : num(row.reps),
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
            <Text style={T.tiny}>{total} {t('mein se')} {index + 1}</Text>
          </View>
        </View>

        {/* ---- the movement ---- */}
        <FadeIn delay={20}>
          <View style={styles.stage}>
            <Figure pattern={pattern} scale={stage / 200} tint={tint} />
            <Text style={[T.tiny, styles.stageLabel]}>{pattern.name}</Text>
          </View>
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
            <View key={i} style={[styles.setRow, r.done && { borderColor: C.lime, opacity: 0.7 }]}>
              <Text style={styles.setNo}>{i + 1}</Text>

              <View style={styles.field}>
                <TextInput
                  value={r.weight}
                  onChangeText={(v) => setRows(rows.map((x, j) => (j === i ? { ...x, weight: v } : x)))}
                  placeholder={r.hintW != null ? String(r.hintW) : '—'}
                  placeholderTextColor={C.faint}
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
                <Text style={T.tiny}>{t('kg')}</Text>
              </View>

              <Text style={styles.times}>×</Text>

              <View style={styles.field}>
                <TextInput
                  value={r.reps}
                  onChangeText={(v) => setRows(rows.map((x, j) => (j === i ? { ...x, reps: v } : x)))}
                  placeholder={r.hintR != null ? String(r.hintR) : hint || '—'}
                  placeholderTextColor={C.faint}
                  keyboardType="number-pad"
                  style={styles.input}
                />
                <Text style={T.tiny}>{t('reps')}</Text>
              </View>

              <Press onPress={() => tick(i)} scaleTo={0.9}
                style={[styles.check, { borderColor: r.done ? C.lime : C.line },
                  r.done && { backgroundColor: C.lime }]}>
                {r.done ? <Text style={styles.checkTxt}>{'✓'}</Text> : null}
              </Press>
            </View>
          ))}

          <Text style={[T.tiny, { marginTop: 8 }]}>
            {t('Numbers are optional. Tick the set either way.')}
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
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: R.md, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  setNo: { fontFamily: 'WorkSans_600SemiBold', fontSize: 19, color: C.dim, width: 20 },
  field: { flex: 1, flexDirection: 'row', alignItems: 'baseline', marginLeft: 8 },
  input: {
    fontFamily: 'WorkSans_500Medium', fontSize: 19, color: C.text,
    paddingVertical: 6, paddingHorizontal: 6, minWidth: 52,
    backgroundColor: C.raised, borderRadius: R.sm, marginRight: 5, textAlign: 'center',
  },
  times: { color: C.faint, fontSize: 14, marginHorizontal: 2 },
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
