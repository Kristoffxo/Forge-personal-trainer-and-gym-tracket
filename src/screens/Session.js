/* ---------------------------------------------------------------
   Doing a workout.

   Shared by all three ways in — the 7-day planner, a gym session
   and a home session — because once you have started, they are the
   same thing: a list of moves, tap one, tick it off, finish.

   Finishing writes today into `workout_days`, which is the single
   row every challenge counts. It does not matter where the workout
   came from.
   --------------------------------------------------------------- */
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

import { S, R, useTheme } from '../theme';
import { Btn, Press, FadeIn, Bar } from '../ui/kit';
import { useSheet } from '../ui/sheet';
import { useLang } from '../lang';
import { markWorkout } from '../challenge';
import Exercise from './Exercise';

export default function Session({ title, exercises, user, kind, name, onExit }) {
  const { C, T, MUSCLE_C } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  const sheet = useSheet();

  const [done, setDone] = useState({});
  const [openIdx, setOpenIdx] = useState(0);

  const total = exercises.length;
  const ticked = Object.keys(done).filter((k) => done[k]).length;
  const allDone = ticked === total && total > 0;
  const nextIdx = exercises.findIndex((_, i) => !done[i]);

  /* one move, full screen */
  if (openIdx !== null && exercises[openIdx]) {
    return (
      <Exercise
        exercise={exercises[openIdx]}
        user={user}
        index={openIdx}
        total={total}
        onBack={() => setOpenIdx(null)}
        onDone={() => {
          const next = { ...done, [openIdx]: true };
          setDone(next);
          const following = exercises.findIndex((_, i) => !next[i]);
          setOpenIdx(following === -1 ? null : following);
        }}
      />
    );
  }

  async function finish() {
    if (ticked < total) {
      const stop = await sheet.confirm({
        title: t('Finish early?'),
        message: `${total - ticked} ${t('moves still to go.')}`,
        confirmLabel: t('Finish anyway'),
      });
      if (!stop) return;
    }
    // anything ticked counts as having trained today
    if (ticked > 0) await markWorkout(user.id, kind, name || title);
    onExit(ticked > 0);
  }

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: 70 }}>
      <View style={styles.top}>
        <Press onPress={() => onExit(false)} hitSlop={12} scaleTo={0.94}
          style={{ alignSelf: 'flex-start' }}>
          <Text style={[T.small, { color: C.ember }]}>{'←'} {t('Back')}</Text>
        </Press>
        <Text style={styles.big}>{t(title)}</Text>
        <Text style={[T.small, { marginTop: 2 }]}>
          {total} {t('mein se')} {ticked} {t('done')}
        </Text>
        <Bar value={ticked} max={total} color={allDone ? C.lime : C.ember}
          height={7} style={{ marginTop: S.md }} />
      </View>

      <View style={{ paddingHorizontal: S.lg, marginTop: S.lg }}>
        {exercises.map((x, i) => {
          const on = !!done[i];
          const isNext = i === nextIdx;
          return (
            <FadeIn key={x.n + i} delay={i * 18} from={6}>
              <Press
                scaleTo={0.985}
                onPress={() => setOpenIdx(i)}
                style={[
                  styles.exRow,
                  on && { opacity: 0.5, borderColor: C.lime, borderWidth: 1.5 },
                  isNext && { borderColor: MUSCLE_C[x.m], borderWidth: 1.5 },
                ]}
              >
                <View style={[styles.check,
                  { backgroundColor: on ? C.lime : 'transparent',
                    borderColor: on ? C.lime : MUSCLE_C[x.m] }]}>
                  {on ? <Text style={styles.checkMark}>{'✓'}</Text>
                    : <Text style={[styles.num, { color: MUSCLE_C[x.m] }]}>{i + 1}</Text>}
                </View>

                <View style={{ flex: 1, marginHorizontal: 12 }}>
                  <Text style={[styles.exName, on && { textDecorationLine: 'line-through' }]}>
                    {x.n}
                  </Text>
                  <Text style={T.tiny}>{x.m} · {x.e} · {x.s}</Text>
                </View>

                <Text style={[styles.chev, isNext && { color: MUSCLE_C[x.m] }]}>
                  {on ? '' : '›'}
                </Text>
              </Press>
            </FadeIn>
          );
        })}

        <Btn
          label={allDone ? t('Finish — well done') : t('Finish workout')}
          color={allDone ? C.lime : C.ember} dark={!allDone}
          onPress={finish} style={{ marginTop: S.xl }}
        />
        <Text style={[T.tiny, { textAlign: 'center', marginTop: S.sm }]}>
          {t('Tap a move to see how it is done')}
        </Text>
      </View>
    </ScrollView>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  top: { paddingHorizontal: S.lg, paddingTop: S.md, paddingBottom: S.lg, backgroundColor: C.surface },
  big: { fontFamily: 'Forum_400Regular', fontSize: 36, color: C.text, marginTop: 6 },
  exRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: R.md, padding: 12, marginBottom: 9,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  check: {
    width: 30, height: 30, borderRadius: 15, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  checkMark: { color: C.onAccent, fontSize: 15, fontFamily: 'WorkSans_500Medium' },
  num: { fontFamily: 'WorkSans_500Medium', fontSize: 13 },
  exName: { fontFamily: 'WorkSans_500Medium', fontSize: 15, color: C.text },
  chev: { fontSize: 22, color: C.faint, paddingHorizontal: 4 },
});
