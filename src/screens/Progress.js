/* ---------------------------------------------------------------
   Progress — the reason to open the app tomorrow.

   Everything here is derived from rows that already exist, so there
   is no migration to run:

     streak / days logged / calorie history   the diary table
     weight and its trend                     kept on the device

   Weight lives in AsyncStorage rather than Supabase so it works with
   no connection and needs no new table. Moving it to the server later
   is a small job — see the README.
   --------------------------------------------------------------- */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { S, R, useTheme } from '../theme';
import { Card, Label, Btn, FadeIn, useCountUp, useTabPad } from '../ui/kit';
import { loadRange, totals, todayKey } from '../diary';
import { num } from '../num';
import { useLang } from '../lang';
import { RankCard, MedalRow } from '../ui/medals';
import { myStanding } from '../challenge';

const WKEY = 'nemea:weights';
const DAYS = 14;

/* ---------- weight log, kept on the device ---------- */
async function readWeights() {
  try {
    const raw = await AsyncStorage.getItem(WKEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

async function writeWeight(kg) {
  const list = await readWeights();
  const day = todayKey();
  const without = list.filter((w) => w.day !== day);
  const next = [...without, { day, kg }].sort((a, b) => (a.day < b.day ? -1 : 1)).slice(-180);
  await AsyncStorage.setItem(WKEY, JSON.stringify(next)).catch(() => {});
  return next;
}

/* ---------- turning diary rows into a fortnight ---------- */
function byDay(rows) {
  const map = {};
  (rows || []).forEach((r) => {
    (map[r.day] = map[r.day] || []).push(r);
  });
  return map;
}

function lastDays(n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(todayKey(d));
  }
  return out;
}

/* Consecutive days ending today, or ending yesterday if today is still
   empty — losing a streak at breakfast would be a cruel way to count. */
function streakOf(map) {
  let n = 0;
  const d = new Date();
  if (!map[todayKey(d)]) d.setDate(d.getDate() - 1);
  for (;;) {
    if (!map[todayKey(d)]) break;
    n += 1;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export default function Progress({ user, profile }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  const tabPad = useTabPad();

  const [rows, setRows] = useState(null);
  const [weights, setWeights] = useState([]);
  const [entry, setEntry] = useState('');
  const [saved, setSaved] = useState(false);
  const [standing, setStanding] = useState(null);

  const load = useCallback(() => {
    loadRange(user.id, DAYS).then(setRows);
    readWeights().then(setWeights);
    myStanding(user.id).then(setStanding);
  }, [user.id]);

  useEffect(load, [load]);

  if (rows === null) {
    return <View style={styles.boot}><ActivityIndicator color={C.violet} /></View>;
  }

  const map = byDay(rows);
  const days = lastDays(DAYS);
  const streak = streakOf(map);
  const logged = days.filter((d) => map[d]).length;
  const target = (profile && profile.goal_kcal) || 2200;

  const perDay = days.map((d) => ({ day: d, kcal: totals(map[d] || []).kcal }));
  const eaten = perDay.filter((p) => p.kcal > 0);
  const avg = eaten.length
    ? Math.round(eaten.reduce((s, p) => s + p.kcal, 0) / eaten.length)
    : 0;
  const proteinAvg = eaten.length
    ? Math.round(
        days.reduce((s, d) => s + totals(map[d] || []).protein, 0) / eaten.length
      )
    : 0;

  const first = weights.length ? weights[0] : null;
  const latest = weights.length ? weights[weights.length - 1] : null;
  const delta = first && latest ? Number((latest.kg - first.kg).toFixed(1)) : null;

  async function saveWeight() {
    const kg = num(entry);
    if (!kg || kg < 20 || kg > 400) return;
    const next = await writeWeight(kg);
    setWeights(next);
    setEntry('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: tabPad }}>
      {standing ? (
        <FadeIn>
          <RankCard level={standing.level} rank={standing.rank}
            current={standing.current} longest={standing.longest} />
          <View style={styles.medalBox}>
            <MedalRow medals={standing.medals} size={56} />
          </View>
        </FadeIn>
      ) : null}

      <FadeIn delay={40} style={{ marginTop: S.md }}>
        <StreakCard streak={streak} logged={logged} days={DAYS} />
      </FadeIn>

      <FadeIn delay={70}>
        <Card style={{ marginTop: S.md }}>
          <Label color={C.amber}>{t('Last')} {DAYS} {t('days')}</Label>
          <Text style={[T.body, { marginTop: 4 }]}>
            {eaten.length
              ? `Averaging ${avg} kcal and ${proteinAvg} g of protein on the days you logged.`
              : 'Log a meal in the Food tab and your history starts building here.'}
          </Text>
          <Chart data={perDay} target={target} />
        </Card>
      </FadeIn>

      <FadeIn delay={140}>
        <Card style={{ marginTop: S.md }} color={C.teal}>
          <Label color={C.teal}>{t('Weight')}</Label>
          {latest ? (
            <View style={styles.weightRow}>
              <Text style={styles.big}>{latest.kg}</Text>
              <Text style={[T.body, { marginLeft: 6, marginBottom: 8 }]}>kg</Text>
              {delta !== null && weights.length > 1 ? (
                <Text
                  style={[
                    styles.delta,
                    { color: delta === 0 ? C.dim : delta < 0 ? C.lime : C.amber },
                  ]}
                >
                  {delta > 0 ? '+' : ''}
                  {delta} kg since you started
                </Text>
              ) : null}
            </View>
          ) : (
            <Text style={[T.body, { marginTop: 4 }]}>
              Add today's weight. Once a week is enough — daily weight is
              mostly water.
            </Text>
          )}

          <View style={styles.entryRow}>
            <TextInput
              style={styles.input}
              value={entry}
              onChangeText={setEntry}
              keyboardType="numeric"
              placeholder={t('kg today')}
              placeholderTextColor={C.faint}
            />
            <Btn label={saved ? t('Saved') : t('Log')} onPress={saveWeight} color={C.teal} full={false} />
          </View>

          {weights.length > 1 ? <Spark weights={weights} /> : null}
        </Card>
      </FadeIn>

      <FadeIn delay={210}>
        <Text style={[T.tiny, { marginTop: S.lg, textAlign: 'center' }]}>
          {t('Your weight stays on this device.')}
        </Text>
      </FadeIn>
    </ScrollView>
  );
}

function StreakCard({ streak, logged, days }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  const n = useCountUp(streak);
  return (
    <View style={[styles.streak, { borderColor: streak > 0 ? C.ember : C.line }]}>
      <Text style={[styles.big, { color: streak > 0 ? C.ember : C.faint }]}>{n}</Text>
      <Text style={[T.h3, { marginTop: -4 }]}>
        {streak === 1 ? t('day in a row') : t('days in a row')}
      </Text>
      <Text style={[T.small, { marginTop: 6, textAlign: 'center' }]}>
        {streak === 0
          ? t('Log anything today to start.')
          : `${logged} ${t('of the last')} ${days} ${t('days logged.')}`}
      </Text>
    </View>
  );
}

/* A fortnight of calories against the target. Bars, not a line — a
   missed day should read as a gap, not as a dip to zero. */
function Chart({ data, target }) {
  const { C, T } = useTheme();
  const styles = makeStyles(C, T);
  const max = Math.max(target * 1.25, ...data.map((d) => d.kcal), 1);
  return (
    <View style={styles.chart}>
      <View style={[styles.targetLine, { bottom: (target / max) * 96 }]} />
      {data.map((d) => {
        const h = Math.max(2, (d.kcal / max) * 96);
        const over = d.kcal > target;
        return (
          <View key={d.day} style={styles.barSlot}>
            <View
              style={[
                styles.bar,
                {
                  height: d.kcal ? h : 2,
                  backgroundColor: !d.kcal ? C.line : over ? C.amber : C.teal,
                },
              ]}
            />
          </View>
        );
      })}
    </View>
  );
}

function Spark({ weights }) {
  const { C } = useTheme();
  const styles = makeStyles(C, null);
  const kgs = weights.map((w) => w.kg);
  const lo = Math.min(...kgs);
  const hi = Math.max(...kgs);
  const span = hi - lo || 1;
  return (
    <View style={styles.spark}>
      {weights.slice(-30).map((w, i) => (
        <View
          key={w.day + i}
          style={[styles.sparkDot, { bottom: ((w.kg - lo) / span) * 34 }]}
        />
      ))}
    </View>
  );
}

const makeStyles = (C, T) =>
  StyleSheet.create({
    boot: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    medalBox: {
      backgroundColor: C.surface, borderRadius: R.lg,
      padding: S.md, marginTop: S.sm,
    },
    streak: {
      alignItems: 'center',
      paddingVertical: S.lg,
      borderRadius: R.md,
      borderWidth: 1.5,
      backgroundColor: C.surface,
    },
    big: { fontFamily: 'WorkSans_600SemiBold', fontSize: 54, color: C.text, lineHeight: 60 },

    chart: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      height: 100,
      marginTop: S.md,
    },
    barSlot: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
    bar: { width: '62%', borderRadius: 3 },
    targetLine: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 1,
      backgroundColor: C.line,
    },

    weightRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 2 },
    delta: { fontFamily: 'WorkSans_400Regular', fontSize: 12.5, marginLeft: 'auto', marginBottom: 10 },
    entryRow: { flexDirection: 'row', alignItems: 'center', marginTop: S.md, gap: 10 },
    input: {
      flex: 1,
      backgroundColor: C.raised,
      borderRadius: R.md,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontFamily: 'WorkSans_400Regular',
      fontSize: 16,
      color: C.text,
      borderWidth: 1,
      borderColor: C.line,
    },

    spark: { height: 40, marginTop: S.md, flexDirection: 'row', alignItems: 'flex-end' },
    sparkDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.teal, marginRight: 4 },
  });
