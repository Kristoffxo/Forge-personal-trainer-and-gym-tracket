/* ---------------------------------------------------------------
   Two questions, then a plan.

   Asked in examples rather than adjectives: "I do not move much
   during the day" tells you something, "sedentary" does not, and
   somebody choosing between beginner, intermediate and advanced is
   guessing at what those words mean to whoever wrote them.

   The answers are kept on the device. They decide which rung of each
   ladder gets shown — see src/seniorPlan.js — and can be changed
   from the top of the plan at any time.
   --------------------------------------------------------------- */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { S, R, useTheme } from '../theme';
import { Press, FadeIn, Label, useTabPad } from '../ui/kit';
import { useLang } from '../lang';
import { ACTIVITY, AIM, planFor, STEP_NOTE } from '../seniorPlan';
import { SENIOR_NOTE } from '../seniors';
import { framesFor } from '../exercisePhotos';
import { photoForMuscle } from '../photos';
import Exercise from './Exercise';
import { setsReps } from '../duration';
import { SwipeBack } from '../ui/swipeBack';

const KEY = 'nemea:senior-plan';      // see the note in src/lang.js

export default function SeniorPlan({ onBack }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  const tabPad = useTabPad();

  const [answers, setAnswers] = useState(undefined);   // undefined = loading
  const [step, setStep] = useState('activity');
  const [activity, setActivity] = useState(null);      // held between the two
  const [open, setOpen] = useState(null);              // a session being read

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        const v = raw ? JSON.parse(raw) : null;
        setAnswers(v && v.activity && v.aim ? v : null);
      })
      .catch(() => setAnswers(null));
  }, []);

  const save = useCallback(async (next) => {
    setAnswers(next);
    await AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  if (answers === undefined) {
    return <View style={styles.boot}><ActivityIndicator color={C.lime} /></View>;
  }

  /* ---------- one movement, full screen ---------- */
  if (open) {
    return (
      <Exercise
        exercise={open.exercises[0]}
        index={0}
        total={1}
        onBack={() => setOpen(null)}
        onDone={() => setOpen(null)}
        previewOnly
      />
    );
  }

  /* ---------- the two questions ---------- */
  if (!answers) {
    const asking = step === 'activity' ? ACTIVITY : AIM;
    return (
      <ScrollView style={styles.wrap} contentContainerStyle={{ padding: S.lg, paddingBottom: tabPad }}>
        <Press onPress={onBack} hitSlop={12} scaleTo={0.94} style={{ alignSelf: 'flex-start' }}>
          <Text style={[T.small, { color: C.lime }]}>{'←'} {t('Train')}</Text>
        </Press>

        <Text style={styles.q}>
          {step === 'activity'
            ? t('Which of these describes you best?')
            : t('And what is it for?')}
        </Text>
        <Text style={[T.small, { marginTop: 6 }]}>
          {step === 'activity'
            ? t('There is no right answer. It only decides where to start.')
            : t('This decides what gets the most work.')}
        </Text>

        {asking.map((o, i) => (
          <FadeIn key={o.key} delay={i * 40}>
            <Press
              scaleTo={0.985}
              style={styles.choice}
              onPress={() => {
                if (step === 'activity') { setActivity(o.key); setStep('aim'); }
                else save({ activity, aim: o.key });
              }}
            >
              <Text style={styles.choiceName}>{t(o.name)}</Text>
              <Text style={[T.small, { marginTop: 4 }]}>{t(o.sub)}</Text>
            </Press>
          </FadeIn>
        ))}

        {step === 'aim' ? (
          <Press onPress={() => setStep('activity')} hitSlop={10} style={{ marginTop: S.lg }}>
            <Text style={[T.small, { color: C.dim, textAlign: 'center' }]}>{t('Back a step')}</Text>
          </Press>
        ) : null}
      </ScrollView>
    );
  }

  /* ---------- the plan ---------- */
  const plan = planFor(answers.activity, answers.aim);
  const act = ACTIVITY.find((a) => a.key === answers.activity);
  const aim = AIM.find((a) => a.key === answers.aim);

  return (
    <SwipeBack onBack={onBack}>
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: S.lg, paddingBottom: tabPad }}>
      <Press onPress={onBack} hitSlop={12} scaleTo={0.94} style={{ alignSelf: 'flex-start' }}>
        <Text style={[T.small, { color: C.lime }]}>{'←'} {t('Train')}</Text>
      </Press>

      <Text style={styles.title}>{t('Your plan')}</Text>
      <Press onPress={() => { setAnswers(null); setActivity(null); setStep('activity'); }} scaleTo={0.98}
        style={styles.who}>
        <View style={{ flex: 1 }}>
          <Text style={[T.small, { color: C.text }]}>{t(act.name)}</Text>
          <Text style={T.tiny}>{t(aim.name)}</Text>
        </View>
        <Text style={[T.small, { color: C.lime }]}>{t('Change')}</Text>
      </Press>

      <Label style={{ marginTop: S.xl, marginBottom: S.sm }}>{t('One for each part of you')}</Label>

      {plan.map((s, i) => {
        const move = s.exercises[0];
        const thumb = (framesFor(move) || [photoForMuscle('Core')])[0];
        return (
          <FadeIn key={s.key} delay={i * 22} from={6}>
            <Press onPress={() => setOpen(s)} scaleTo={0.985} style={styles.row}>
              <Image source={thumb} style={styles.thumb} resizeMode="cover" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.rowName}>{t(s.group)}</Text>
                <Text style={T.tiny}>{move.n} · {setsReps(move.s).line}</Text>
              </View>
              <View style={styles.rung}>
                {[0, 1, 2].map((r) => (
                  <View key={r} style={[styles.pip, r <= s.rung && { backgroundColor: C.lime }]} />
                ))}
              </View>
            </Press>
          </FadeIn>
        );
      })}

      <View style={[styles.note, { borderLeftColor: C.amber }]}>
        <Text style={[T.small, { color: C.text }]}>{t(STEP_NOTE)}</Text>
      </View>
      <View style={[styles.note, { borderLeftColor: C.danger }]}>
        <Text style={[T.small, { color: C.text }]}>{t(SENIOR_NOTE)}</Text>
      </View>
    </ScrollView>
    </SwipeBack>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },

  q: { fontFamily: 'WorkSans_600SemiBold', fontSize: 27, lineHeight: 32, color: C.text, marginTop: S.lg },
  title: { fontFamily: 'WorkSans_600SemiBold', fontSize: 30, lineHeight: 34, color: C.text, marginTop: S.md },

  choice: {
    backgroundColor: C.surface, borderRadius: R.md, padding: S.md, marginTop: S.md,
    borderWidth: 1.5, borderColor: C.line,
  },
  choiceName: { fontFamily: 'WorkSans_600SemiBold', fontSize: 18, lineHeight: 24, color: C.text },

  who: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: R.md, padding: S.md, marginTop: S.md,
  },

  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: R.md, padding: S.sm, marginBottom: 9,
  },
  thumb: { width: 52, height: 52, borderRadius: R.sm, backgroundColor: C.raised },
  rowName: { fontFamily: 'WorkSans_600SemiBold', fontSize: 17, color: C.text },
  rung: { flexDirection: 'row', paddingRight: 6 },
  pip: {
    width: 7, height: 7, borderRadius: 4, marginLeft: 4,
    backgroundColor: C.line,
  },

  note: {
    backgroundColor: C.surface, borderRadius: R.md, padding: S.md,
    borderLeftWidth: 4, marginTop: S.md,
  },
});
