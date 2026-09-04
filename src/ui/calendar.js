/* ---------------------------------------------------------------
   Every day you trained, on a month at a time.

   The journey map answers "how far have I come". This answers the
   other question people actually ask themselves, which is "have I
   been slack lately" — and a grid of thirty squares answers it
   faster than any number can.

   Days you trained are filled in the colour of the league you are
   in. Nothing is red, nothing is a cross, and a blank day is just
   blank: the whole app is built on rest days costing you nothing,
   and a calendar that scolds you for them would contradict it.
   --------------------------------------------------------------- */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

import { S, R, useTheme } from '../theme';
import { Press } from './kit';
import { useLang } from '../lang';
import { workoutsInMonth } from '../challenge';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const key = (y, m, d) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

export function WorkoutCalendar({ user, colour }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [rows, setRows] = useState(null);
  const [open, setOpen] = useState(null);      // a day being read

  const load = useCallback(async () => {
    if (!user || !user.id) return;
    setRows(null);
    setRows(await workoutsInMonth(user.id, year, month));
  }, [user, year, month]);

  useEffect(() => { load(); }, [load]);

  const byDay = {};
  (rows || []).forEach((r) => { byDay[r.day] = r; });

  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();

  /* Leading blanks so the first lands under its weekday, then the
     month, padded to whole weeks. */
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);

  const step = (by) => {
    const m = month + by;
    if (m < 0) { setMonth(11); setYear(year - 1); }
    else if (m > 11) { setMonth(0); setYear(year + 1); }
    else setMonth(m);
    setOpen(null);
  };

  /* Never let somebody page into next year looking for workouts
     they have not done yet. */
  const atNow = year === today.getFullYear() && month === today.getMonth();
  const trained = Object.keys(byDay).length;
  const tint = colour || C.ember;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text style={styles.month}>{t(MONTHS[month])} {year}</Text>
          <Text style={T.tiny}>
            {rows === null ? t('Looking') : trained === 1
              ? `1 ${t('day trained')}` : `${trained} ${t('days trained')}`}
          </Text>
        </View>
        <Press onPress={() => step(-1)} hitSlop={12} scaleTo={0.9} style={styles.arrow}>
          <Text style={styles.arrowTxt}>{'‹'}</Text>
        </Press>
        <Press onPress={() => !atNow && step(1)} hitSlop={12} scaleTo={0.9}
          style={[styles.arrow, atNow && { opacity: 0.3 }]}>
          <Text style={styles.arrowTxt}>{'›'}</Text>
        </Press>
      </View>

      <View style={styles.dow}>
        {DOW.map((d, i) => (
          <Text key={i} style={styles.dowTxt}>{d}</Text>
        ))}
      </View>

      {rows === null ? (
        <View style={{ paddingVertical: 40 }}>
          <ActivityIndicator color={tint} />
        </View>
      ) : (
        <View style={styles.grid}>
          {cells.map((d, i) => {
            if (d === null) return <View key={i} style={styles.cell} />;
            const k = key(year, month, d);
            const did = byDay[k];
            const isToday = atNow && d === today.getDate();
            const picked = open === k;
            return (
              <Press key={i} onPress={() => setOpen(did ? (picked ? null : k) : null)}
                scaleTo={did ? 0.88 : 1} style={styles.cell}>
                <View style={[
                  styles.day,
                  did && { backgroundColor: tint },
                  !did && isToday && { borderWidth: 1.5, borderColor: tint },
                  picked && { borderWidth: 2, borderColor: '#fff' },
                ]}>
                  <Text style={[
                    styles.dayTxt,
                    did && { color: '#0B0B0E', fontFamily: 'WorkSans_600SemiBold' },
                    !did && isToday && { color: tint },
                  ]}>
                    {d}
                  </Text>
                </View>
              </Press>
            );
          })}
        </View>
      )}

      {/* What was done, when a filled day is tapped. */}
      {open && byDay[open] ? (
        <View style={[styles.detail, { borderLeftColor: tint }]}>
          <Text style={styles.detailDay}>
            {t(MONTHS[month])} {Number(open.slice(-2))}
          </Text>
          <Text style={[T.bodyOn, { fontSize: 15 }]}>
            {byDay[open].name || t('Trained')}
          </Text>
          {byDay[open].kind ? <Text style={T.tiny}>{t(byDay[open].kind)}</Text> : null}
        </View>
      ) : null}

      {rows !== null && trained === 0 ? (
        <Text style={[T.tiny, { textAlign: 'center', marginTop: S.sm }]}>
          {atNow ? t('Nothing yet this month.') : t('Nothing that month.')}
        </Text>
      ) : null}
    </View>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  card: {
    backgroundColor: C.surface, borderRadius: R.lg, padding: S.lg,
    borderWidth: 1, borderColor: C.line, marginTop: S.md,
  },
  head: { flexDirection: 'row', alignItems: 'center' },
  month: { fontFamily: 'WorkSans_600SemiBold', fontSize: 20, color: C.text },
  arrow: {
    width: 34, height: 34, borderRadius: 17, marginLeft: 6,
    alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg,
  },
  arrowTxt: { fontFamily: 'WorkSans_600SemiBold', fontSize: 18, color: C.dim, lineHeight: 20 },

  dow: { flexDirection: 'row', marginTop: S.md },
  dowTxt: {
    flex: 1, textAlign: 'center', fontFamily: 'WorkSans_500Medium',
    fontSize: 11, color: C.faint, letterSpacing: 0.5,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  /* A fixed height, not an aspect ratio. react-native-web collapses
     aspectRatio on a percentage-width child inside a wrapping flex
     row, which stacked every week after the first on top of itself. */
  cell: { width: '14.2857%', height: 44, alignItems: 'center', justifyContent: 'center' },
  day: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  dayTxt: { fontFamily: 'WorkSans_400Regular', fontSize: 14, color: C.dim },

  detail: {
    marginTop: S.md, backgroundColor: C.bg, borderRadius: R.md,
    borderLeftWidth: 3, padding: S.md,
  },
  detailDay: {
    fontFamily: 'WorkSans_500Medium', fontSize: 10.5, letterSpacing: 1,
    textTransform: 'uppercase', color: C.faint, marginBottom: 2,
  },
});
