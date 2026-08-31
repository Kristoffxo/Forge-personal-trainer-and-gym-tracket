/* ---------------------------------------------------------------
   Training.

   Three states, in order of how often you are in them:

     workout   you are training right now — a list of moves, tap one
     week      your plan, with today at the top
     wizard    the two questions that build the plan

   Tapping a move opens src/screens/Exercise.js: the movement
   animating, the form points, what you lifted last time, and one
   Done button that brings you back here and moves you on.
   --------------------------------------------------------------- */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

import { S, R, useTheme } from '../theme';
import { Btn, Press, Card, FadeIn, Label, Chip, Bar } from '../ui/kit';
import { useSheet } from '../ui/sheet';
import { useLang } from '../lang';
import { SPLITS, DAY_NAMES, buildWeek, todayIndex, dayTitle } from '../planner';
import { MUSCLES } from '../exercises';
import { supabase } from '../supabase';
import Session from './Session';

const PER = [3, 4, 5, 6, 7, 8];
const KITS = ['Full gym', 'None'];

export default function Training({ user, profile, onBack }) {
  const { C, T, MUSCLE_C } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  const sheet = useSheet();

  const [plan, setPlan] = useState(undefined);   // undefined = loading, null = none yet
  const [editing, setEditing] = useState(false);
  const [splitId, setSplitId] = useState(null);
  const [per, setPer] = useState(5);
  const [kit, setKit] = useState('Full gym');
  const [custom, setCustom] = useState([[], [], [], [], [], [], []]);

  const [viewDay, setViewDay] = useState(todayIndex());
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState({});
  const [openIdx, setOpenIdx] = useState(null);   // which move is open full-screen

  const load = useCallback(async () => {
    const { data } = await supabase.from('plans').select('*').eq('user_id', user.id).maybeSingle();
    setPlan(data || null);
  }, [user.id]);
  useEffect(() => { load(); }, [load]);

  async function savePlan() {
    const row = { user_id: user.id, split: splitId, per_session: per, days: { custom, kit } };
    await supabase.from('plans').upsert(row, { onConflict: 'user_id' });
    setPlan(row);
    setEditing(false);
    setViewDay(todayIndex());
  }

  if (plan === undefined) return <View style={styles.wrap} />;

  /* ---------- the wizard ---------- */
  if (plan === null || editing) {
    return (
      <Wizard
        firstTime={plan === null}
        splitId={splitId} setSplitId={setSplitId}
        per={per} setPer={setPer}
        kit={kit} setKit={setKit}
        custom={custom} setCustom={setCustom}
        onSave={savePlan}
        onCancel={plan ? () => setEditing(false) : null}
        onBack={onBack}
      />
    );
  }

  const kitSaved = (plan.days && plan.days.kit) || 'Full gym';
  const week = buildWeek(plan.split, plan.days && plan.days.custom, plan.per_session, kitSaved);
  const day = week[viewDay];
  const isToday = viewDay === todayIndex();

  /* ---------- doing it ---------- */
  if (running) {
    return (
      <Session
        title={day.title}
        exercises={day.exercises}
        user={user}
        profile={profile}
        kind="planner"
        name={day.title}
        onExit={() => { setRunning(false); setDone({}); setOpenIdx(null); }}
      />
    );
  }

  /* ---------- the week ---------- */
  const todayPlan = week[todayIndex()];

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: 70 }}>
      {onBack ? (
        <Press onPress={onBack} hitSlop={12} scaleTo={0.94}
          style={{ alignSelf: 'flex-start', paddingHorizontal: S.lg, paddingTop: S.md }}>
          <Text style={[T.small, { color: C.ember }]}>{'←'} {t('Train')}</Text>
        </Press>
      ) : null}

      {/* today, front and centre */}
      <FadeIn style={{ padding: S.lg, paddingBottom: 0 }}>
        <View style={styles.todayCard}>
          <Label color={C.ember}>{t('Today')} · {DAY_NAMES[todayIndex()]}</Label>
          <Text style={styles.todayTitle}>{todayPlan.title}</Text>

          {todayPlan.exercises.length ? (
            <>
              <View style={styles.mRow}>
                {todayPlan.muscles.map((m) => (
                  <View key={m} style={[styles.mTag, { borderColor: MUSCLE_C[m] }]}>
                    <View style={[styles.mDot, { backgroundColor: MUSCLE_C[m] }]} />
                    <Text style={[T.tiny, { color: C.text }]}>{m}</Text>
                  </View>
                ))}
              </View>
              <Text style={[T.small, { marginTop: 4 }]}>
                {todayPlan.exercises.length} {t('moves')} · {12 + todayPlan.exercises.length * 6} {t('minutes')}
              </Text>
              <Btn
                label={t('Start today’s workout')}
                onPress={() => {
                  setViewDay(todayIndex());
                  setDone({}); setOpenIdx(0); setRunning(true);
                }}
                style={{ marginTop: S.md }}
              />
            </>
          ) : (
            <>
              <Text style={[T.small, { marginTop: 6 }]}>
                {t('Rest day. Walk, sleep, eat well.')}
              </Text>
              <Btn
                label={t('Train anyway')}
                dark color={C.dim}
                onPress={() => { setViewDay((todayIndex() + 1) % 7); }}
                style={{ marginTop: S.md }}
              />
            </>
          )}
        </View>
      </FadeIn>

      {/* the rest of the week */}
      <FadeIn delay={70}>
        <Label style={{ paddingHorizontal: S.lg, marginTop: S.xl, marginBottom: S.sm }}>
          {t('Your week')}
        </Label>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: S.lg, paddingBottom: S.sm }}>
          {week.map((d, i) => {
            const on = viewDay === i;
            const rest = d.muscles.length === 0;
            return (
              <Press key={d.day} onPress={() => setViewDay(i)} scaleTo={0.93}
                style={[styles.dayPill,
                  on && { backgroundColor: C.ember, borderColor: C.ember },
                  !on && rest && { opacity: 0.45 }]}>
                <Text style={[styles.dayName, on && { color: C.onAccent }]}>{d.day}</Text>
                <Text style={[styles.dayKind, on && { color: C.onAccent }]} numberOfLines={1}>
                  {rest ? t('Rest') : t(d.title)}
                </Text>
                {i === todayIndex() && !on ? <View style={styles.todayDot} /> : null}
              </Press>
            );
          })}
        </ScrollView>
      </FadeIn>

      {/* whichever day is selected */}
      <FadeIn delay={110} style={{ paddingHorizontal: S.lg, marginTop: S.md }}>
        {!isToday ? (
          <View style={styles.sessionHead}>
            <View style={{ flex: 1 }}>
              <Label color={C.ember}>{DAY_NAMES[viewDay]}</Label>
              <Text style={styles.sessionTitle}>{day.title}</Text>
            </View>
          </View>
        ) : null}

        {day.exercises.length === 0 ? (
          !isToday ? (
            <Card style={{ alignItems: 'center', paddingVertical: S.xl }}>
              <Text style={styles.restBig}>{t('Rest')}</Text>
            </Card>
          ) : null
        ) : (
          <>
            {day.exercises.map((x, i) => (
              <View key={x.n + i} style={styles.exRow}>
                <View style={[styles.exNum, { backgroundColor: MUSCLE_C[x.m] }]}>
                  <Text style={styles.exNumTxt}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1, marginHorizontal: 12 }}>
                  <Text style={styles.exName}>{x.n}</Text>
                  <Text style={T.tiny}>{x.m} · {x.e}</Text>
                </View>
                <View style={styles.setsBox}>
                  <Text style={styles.setsTxt}>{x.s}</Text>
                </View>
              </View>
            ))}

            {!isToday ? (
              <Btn label={t('Start this workout')}
                onPress={() => { setDone({}); setOpenIdx(0); setRunning(true); }}
                style={{ marginTop: S.md }} />
            ) : null}
          </>
        )}

        <Press
          onPress={() => {
            setSplitId(plan.split); setPer(plan.per_session); setKit(kitSaved);
            setCustom((plan.days && plan.days.custom) || [[], [], [], [], [], [], []]);
            setEditing(true);
          }}
          scaleTo={0.98}
          style={styles.changeBtn}
        >
          <View style={{ flex: 1 }}>
            <Text style={[T.bodyOn, { fontSize: 15 }]}>{t('Change my plan')}</Text>
            <Text style={T.tiny}>
              {t(SPLITS.find((s) => s.id === plan.split)?.name || 'Custom')} ·{' '}
              {plan.per_session} {t('a session')}
            </Text>
          </View>
          <Text style={{ color: C.ember, fontSize: 22 }}>{'›'}</Text>
        </Press>
      </FadeIn>
    </ScrollView>
  );
}

/* ---------------------------------------------------------------
   The plan wizard
   --------------------------------------------------------------- */
function Wizard({ firstTime, splitId, setSplitId, per, setPer, kit, setKit,
  custom, setCustom, onSave, onCancel, onBack }) {
  const { C, T, MUSCLE_C } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);

  const ready = splitId && (splitId !== 'custom' || custom.some((d) => d.length));

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: 70 }}>
      <View style={styles.wizHead}>
        {onBack && !onCancel ? (
          <Press onPress={onBack} hitSlop={12} scaleTo={0.94} style={{ alignSelf: 'flex-start' }}>
            <Text style={[T.small, { color: C.ember }]}>{'←'} {t('Train')}</Text>
          </Press>
        ) : null}
        <Text style={styles.wizTitle}>
          {firstTime ? t('Let’s build your week') : t('Change your plan')}
        </Text>
        <Text style={[T.small, { marginTop: 4 }]}>
          {t('Two questions. Change it any time.')}
        </Text>
      </View>

      <FadeIn delay={50} style={{ padding: S.lg, paddingBottom: 0 }}>
        <StepDot n={1} label={t('How often can you train?')} />
        {SPLITS.map((s) => {
          const on = splitId === s.id;
          return (
            <Press key={s.id} onPress={() => setSplitId(s.id)} scaleTo={0.985}
              style={[styles.opt, on && { borderColor: C.ember, backgroundColor: 'rgba(232,92,36,0.10)' }]}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Text style={styles.optName}>{s.name}</Text>
                  <View style={[styles.tag, on && { backgroundColor: C.ember }]}>
                    <Text style={[styles.tagTxt, on && { color: C.onAccent }]}>{s.tag}</Text>
                  </View>
                </View>
                <Text style={[T.small, { marginTop: 4 }]}>{t(s.blurb)}</Text>
              </View>
              <View style={[styles.radio, on && { borderColor: C.ember, backgroundColor: C.ember }]} />
            </Press>
          );
        })}
      </FadeIn>

      {splitId === 'custom' ? (
        <FadeIn style={{ paddingHorizontal: S.lg, marginTop: S.md }}>
          <Label style={{ marginBottom: S.sm }}>{t('Tap the muscles for each day')}</Label>
          {DAY_NAMES.map((d, i) => (
            <View key={d} style={styles.customDay}>
              <Text style={styles.customDayName}>{d}</Text>
              <View style={styles.wrapRow}>
                {MUSCLES.map((m) => {
                  const on = custom[i].includes(m);
                  return (
                    <Chip key={m} label={m} on={on} color={MUSCLE_C[m]}
                      onPress={() => {
                        const next = custom.map((x) => x.slice());
                        next[i] = on ? next[i].filter((x) => x !== m) : next[i].concat(m);
                        setCustom(next);
                      }} />
                  );
                })}
              </View>
              <Text style={T.tiny}>{custom[i].length ? t(dayTitle(custom[i])) : t('Rest day')}</Text>
            </View>
          ))}
        </FadeIn>
      ) : null}

      <FadeIn delay={100} style={{ padding: S.lg }}>
        <StepDot n={2} label={t('What do you train with?')} />
        <View style={styles.wrapRow}>
          {KITS.map((k) => (
            <Chip key={k} label={k === 'None' ? t('Just my body') : t('A gym')}
              on={kit === k} color={C.teal} onPress={() => setKit(k)} />
          ))}
        </View>

        <Press
          onPress={() => setPer(per >= 8 ? 3 : per + 1)}
          scaleTo={0.98}
          style={styles.perRow}
        >
          <View style={{ flex: 1 }}>
            <Text style={[T.bodyOn]}>{per} {t('exercises a session')}</Text>
            <Text style={T.tiny}>
              {per <= 4 ? t('Short. Good for a busy week.')
                : per <= 6 ? t('About right for most people.')
                  : t('A lot. Only if you recover well.')}
            </Text>
          </View>
          <Text style={[styles.perTap, { color: C.ember }]}>{t('tap')}</Text>
        </Press>

        <Btn label={firstTime ? t('Build my week') : t('Save')} onPress={onSave}
          disabled={!ready} style={{ marginTop: S.xl }} />
        {onCancel ? (
          <Btn label={t('Cancel')} dark color={C.dim} onPress={onCancel} style={{ marginTop: S.sm }} />
        ) : null}
      </FadeIn>
    </ScrollView>
  );
}

function StepDot({ n, label }) {
  const { C, T } = useTheme();
  const styles = makeStyles(C, T);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: S.md }}>
      <View style={styles.stepDot}><Text style={styles.stepNum}>{n}</Text></View>
      <Text style={[T.h3, { marginLeft: 10, flex: 1 }]}>{label}</Text>
    </View>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },

  todayCard: {
    backgroundColor: C.surface, borderRadius: R.lg, padding: S.lg,
    borderWidth: 1.5, borderColor: C.line,
  },
  todayTitle: { fontFamily: 'WorkSans_600SemiBold', fontSize: 38, lineHeight: 42, color: C.text, marginTop: 2 },
  mRow: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, marginTop: S.sm },

  wizHead: { paddingHorizontal: S.lg, paddingTop: S.lg, paddingBottom: S.md, backgroundColor: C.surface },
  wizTitle: { fontFamily: 'WorkSans_600SemiBold', fontSize: 30, lineHeight: 34, color: C.text },

  stepDot: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: C.ember,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNum: { fontFamily: 'WorkSans_500Medium', fontSize: 13, color: C.onAccent },

  opt: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: R.md, padding: S.md, marginBottom: 10, borderWidth: 1.5, borderColor: C.line,
  },
  optName: { fontFamily: 'WorkSans_600SemiBold', fontSize: 20, color: C.text },
  tag: {
    backgroundColor: C.raised, borderRadius: R.pill, paddingHorizontal: 9,
    paddingVertical: 3, marginLeft: 8,
  },
  tagTxt: { fontFamily: 'WorkSans_500Medium', fontSize: 10.5, color: C.dim },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.line, marginLeft: S.sm },

  perRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: R.md, padding: S.md, marginTop: S.lg,
  },
  perTap: { fontFamily: 'WorkSans_500Medium', fontSize: 12, letterSpacing: 1 },

  customDay: { backgroundColor: C.surface, borderRadius: R.md, padding: S.md, marginBottom: 10 },
  customDayName: { fontFamily: 'WorkSans_500Medium', fontSize: 14, color: C.text, marginBottom: 8 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 },

  dayPill: {
    minWidth: 74, paddingVertical: 11, paddingHorizontal: 12, borderRadius: R.md,
    borderWidth: 1.5, borderColor: C.line, marginRight: 8, alignItems: 'center',
    backgroundColor: C.surface,
  },
  dayName: { fontFamily: 'WorkSans_500Medium', fontSize: 13, color: C.text },
  dayKind: { fontFamily: 'WorkSans_400Regular', fontSize: 11, color: C.dim, marginTop: 2 },
  todayDot: { position: 'absolute', top: 6, right: 6, width: 6, height: 6, borderRadius: 3, backgroundColor: C.ember },

  sessionHead: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: S.md },
  sessionTitle: { fontFamily: 'WorkSans_600SemiBold', fontSize: 30, color: C.text, marginTop: 2 },

  mTag: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: R.pill,
    paddingHorizontal: 10, paddingVertical: 4, marginRight: 8,
  },
  mDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },

  exRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: R.md, padding: 12, marginBottom: 9,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  exNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  exNumTxt: { fontFamily: 'WorkSans_500Medium', fontSize: 13, color: C.onAccent },
  exName: { fontFamily: 'WorkSans_500Medium', fontSize: 15, color: C.text },
  setsBox: { backgroundColor: C.raised, borderRadius: R.sm, paddingHorizontal: 10, paddingVertical: 6 },
  setsTxt: { fontFamily: 'WorkSans_500Medium', fontSize: 12.5, color: C.ember },
  chev: { fontSize: 22, color: C.faint, paddingHorizontal: 4 },
  restBig: { fontFamily: 'WorkSans_600SemiBold', fontSize: 36, color: C.dim },

  workTop: { paddingHorizontal: S.lg, paddingTop: S.lg, paddingBottom: S.lg, backgroundColor: C.surface },
  workBig: { fontFamily: 'WorkSans_600SemiBold', fontSize: 38, color: C.text },

  check: {
    width: 30, height: 30, borderRadius: 15, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  checkMark: { color: C.onAccent, fontSize: 15, fontFamily: 'WorkSans_500Medium' },

  changeBtn: {
    flexDirection: 'row', alignItems: 'center', padding: S.md, marginTop: S.lg,
    borderRadius: R.md, borderWidth: 1.5, borderColor: C.ember,
    backgroundColor: 'rgba(255,107,44,0.08)',
  },
});
