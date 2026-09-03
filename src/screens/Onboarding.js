/* ---------------------------------------------------------------
   The five questions, asked once.

   Everything the app calculates hangs off these: the calorie
   target, the protein target, how many exercises a session holds.
   Before this screen existed the Food tab opened on 2,200 kcal and
   expected people to know their own number, which almost nobody
   does.

   One question per screen, a progress bar, and nothing optional —
   but the target it produces is shown before you accept it, and it
   stays editable afterwards in Challenges → Numbers.
   --------------------------------------------------------------- */
import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, Platform, KeyboardAvoidingView,
} from 'react-native';

import { S, R, useTheme } from '../theme';
import { Btn, Press, FadeIn, Label, Bar } from '../ui/kit';
import { useLang } from '../lang';
import { Mark } from '../ui/logo';
import { saveProfile } from '../auth';
import { num, int } from '../num';
import { dailyTarget, proteinTarget, EXPERIENCE, GOALS, SEXES } from '../tdee';
import { DIETS } from '../diet';

const THIS_YEAR = new Date().getFullYear();

export default function Onboarding({ profile, onDone }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);

  const [step, setStep] = useState(0);
  const [sex, setSex] = useState(null);
  const [age, setAge] = useState('');
  const [cm, setCm] = useState('');
  const [kg, setKg] = useState('');
  const [experience, setExperience] = useState(null);
  const [goal, setGoal] = useState(null);
  const [diet, setDiet] = useState(null);
  const [busy, setBusy] = useState(false);

  const ageN = int(age, 0);
  const cmN = num(cm);
  const kgN = num(kg);

  const target = dailyTarget({ sex, kg: kgN, cm: cmN, age: ageN, experience, goal });
  const protein = proteinTarget(kgN);

  const STEPS = [
    { key: 'sex', ok: !!sex },
    { key: 'body', ok: ageN >= 12 && ageN <= 100 && cmN > 90 && cmN < 250 && kgN > 25 && kgN < 350 },
    { key: 'experience', ok: !!experience },
    { key: 'goal', ok: !!goal },
    { key: 'diet', ok: !!diet },
    { key: 'done', ok: true },
  ];
  const here = STEPS[step];

  async function finish() {
    setBusy(true);
    const saved = await saveProfile({
      sex,
      birth_year: THIS_YEAR - ageN,
      height_cm: cmN,
      weight_kg: kgN,
      experience,
      goal,
      diet,
      goal_kcal: target,
      onboarded: true,
    });
    setBusy(false);
    onDone(saved);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">

        <View style={styles.head}>
          <Mark size={34} />
          <Bar value={step + 1} max={STEPS.length} color={C.gold} height={4}
            style={{ marginTop: S.md }} />
        </View>

        <View style={{ padding: S.lg }}>
          {/* ---------- 1. sex ---------- */}
          {here.key === 'sex' ? (
            <FadeIn>
              <Text style={styles.q}>{t('Are you male or female?')}</Text>
              <Text style={[T.small, { marginBottom: S.lg }]}>
                {t('This changes the calorie number, nothing else.')}
              </Text>
              {SEXES.map((o) => (
                <Choice key={o.key} on={sex === o.key} name={t(o.name)}
                  onPress={() => setSex(o.key)} />
              ))}
            </FadeIn>
          ) : null}

          {/* ---------- 2. body ---------- */}
          {here.key === 'body' ? (
            <FadeIn>
              <Text style={styles.q}>{t('Your age, height and weight')}</Text>
              <Text style={[T.small, { marginBottom: S.lg }]}>
                {t('Rough is fine. You can change it any time.')}
              </Text>

              <Label style={{ marginBottom: 8 }}>{t('Age')}</Label>
              <TextInput value={age} onChangeText={setAge} keyboardType="number-pad"
                placeholder="24" placeholderTextColor={C.faint} style={styles.input} />

              <Label style={{ marginTop: S.md, marginBottom: 8 }}>{t('Height (cm)')}</Label>
              <TextInput value={cm} onChangeText={setCm} keyboardType="decimal-pad"
                placeholder="175" placeholderTextColor={C.faint} style={styles.input} />

              <Label style={{ marginTop: S.md, marginBottom: 8 }}>{t('Weight (kg)')}</Label>
              <TextInput value={kg} onChangeText={setKg} keyboardType="decimal-pad"
                placeholder="70" placeholderTextColor={C.faint} style={styles.input} />
            </FadeIn>
          ) : null}

          {/* ---------- 3. experience ---------- */}
          {here.key === 'experience' ? (
            <FadeIn>
              <Text style={styles.q}>{t('How much have you trained before?')}</Text>
              <Text style={[T.small, { marginBottom: S.lg }]}>
                {t('This sets how long your sessions are.')}
              </Text>
              {EXPERIENCE.map((o) => (
                <Choice key={o.key} on={experience === o.key} name={t(o.name)} sub={t(o.sub)}
                  onPress={() => setExperience(o.key)} />
              ))}
            </FadeIn>
          ) : null}

          {/* ---------- 5. what they eat ---------- */}
          {here.key === 'diet' ? (
            <FadeIn>
              <Text style={styles.q}>{t('What do you eat?')}</Text>
              <Text style={[T.small, { marginBottom: S.lg }]}>
                {t('This decides what the diet planner suggests. Change it any time in Settings.')}
              </Text>
              {DIETS.map((o) => (
                <Choice key={o.key} on={diet === o.key} name={t(o.name)} sub={t(o.sub)}
                  onPress={() => setDiet(o.key)} />
              ))}
            </FadeIn>
          ) : null}

          {/* ---------- 4. goal ---------- */}
          {here.key === 'goal' ? (
            <FadeIn>
              <Text style={styles.q}>{t('What are you after?')}</Text>
              <Text style={[T.small, { marginBottom: S.lg }]}>
                {t('This decides whether you eat under, over, or level with what you burn.')}
              </Text>
              {GOALS.map((o) => (
                <Choice key={o.key} on={goal === o.key} name={t(o.name)} sub={t(o.sub)}
                  onPress={() => setGoal(o.key)} />
              ))}
            </FadeIn>
          ) : null}

          {/* ---------- 5. the number ---------- */}
          {here.key === 'done' ? (
            <FadeIn>
              <Text style={styles.q}>{t('Here is your number')}</Text>
              <View style={styles.result}>
                <Text style={styles.big}>{target}</Text>
                <Label>{t('kcal a day')}</Label>
                <View style={styles.rule} />
                <Text style={[T.bodyOn, { marginTop: 2 }]}>
                  {protein} g {t('of protein a day')}
                </Text>
                <Text style={[T.tiny, { marginTop: S.sm }]}>
                  {t('An estimate. Change it any time in Challenges → Numbers.')}
                </Text>
              </View>
            </FadeIn>
          ) : null}

          <Btn
            label={here.key === 'done' ? t('Start') : t('Next')}
            color={C.gold}
            disabled={!here.ok} busy={busy}
            onPress={() => (here.key === 'done' ? finish() : setStep(step + 1))}
            style={{ marginTop: S.xl }}
          />

          {step > 0 ? (
            <Press onPress={() => setStep(step - 1)} scaleTo={0.97} style={styles.back}>
              <Text style={[T.small, { color: C.dim }]}>{t('Back')}</Text>
            </Press>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Choice({ on, name, sub, onPress }) {
  const { C, T } = useTheme();
  const styles = makeStyles(C, T);
  return (
    <Press onPress={onPress} scaleTo={0.985}
      style={[styles.opt, on && { borderColor: C.gold, backgroundColor: 'rgba(201,154,62,0.10)' }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.optName}>{name}</Text>
        {sub ? <Text style={[T.small, { marginTop: 2 }]}>{sub}</Text> : null}
      </View>
      <View style={[styles.radio, on && { borderColor: C.gold, backgroundColor: C.gold }]} />
    </Press>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  head: { alignItems: 'center', paddingTop: S.xl, paddingHorizontal: S.lg, paddingBottom: S.sm },
  q: { fontFamily: 'WorkSans_600SemiBold', fontSize: 30, lineHeight: 34, color: C.text, marginBottom: 6 },

  input: {
    backgroundColor: C.surface, borderRadius: R.md, paddingHorizontal: 16, paddingVertical: 15,
    fontFamily: 'WorkSans_400Regular', fontSize: 19, color: C.text,
    borderWidth: 1, borderColor: C.line,
  },

  opt: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: R.md, padding: S.md, marginBottom: 10,
    borderWidth: 1.5, borderColor: C.line,
  },
  optName: { fontFamily: 'WorkSans_600SemiBold', fontSize: 21, color: C.text },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.line, marginLeft: S.sm },

  result: {
    backgroundColor: C.surface, borderRadius: R.lg, padding: S.lg,
    alignItems: 'center', borderWidth: 1.5, borderColor: C.gold,
  },
  big: { fontFamily: 'WorkSans_600SemiBold', fontSize: 64, lineHeight: 68, color: C.gold },
  rule: { height: 1, alignSelf: 'stretch', backgroundColor: C.line, marginVertical: S.md },

  back: { alignItems: 'center', paddingVertical: 14 },
});
