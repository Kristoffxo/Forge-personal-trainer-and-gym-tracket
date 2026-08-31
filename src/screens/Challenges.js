/* ---------------------------------------------------------------
   Challenges.

   Pick a length, press start, then train every day. Miss one and
   the streak survives — once. Miss a second and the run ends.

   The screen reads the state, tells you where you are, and writes
   back only the one thing that has to persist: whether the free
   miss has been spent. Everything else is derived, so a challenge
   cannot drift out of step with what you actually did.
   --------------------------------------------------------------- */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';

import { S, R, useTheme } from '../theme';
import { Btn, Press, FadeIn, Label, Bar } from '../ui/kit';
import { useSheet } from '../ui/sheet';
import { useLang } from '../lang';
import { CHALLENGES } from '../routines';
import {
  activeChallenge, startChallenge, updateChallenge, leaveChallenge,
  trainedOn, progress, message,
} from '../challenge';

export default function Challenges({ user, onBack }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  const sheet = useSheet();

  const [challenge, setChallenge] = useState(undefined);   // undefined = loading
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const ch = await activeChallenge(user.id);
    if (!ch) { setChallenge(null); setState(null); return; }

    const days = await trainedOn(user.id, ch.started_on);
    const p = progress(ch, days);

    /* The one write: remember that the free miss has been used, so
       we do not forgive the same day twice. */
    if (p.spend) {
      await updateChallenge(ch.id, { grace_used: true });
      ch.grace_used = true;
    }
    if (p.state === 'broken' || p.state === 'done') {
      await updateChallenge(ch.id, {
        status: p.state === 'done' ? 'done' : 'broken',
        ended_on: new Date().toISOString().slice(0, 10),
      });
    }

    setChallenge(ch);
    setState(p);
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  async function begin(days) {
    setBusy(true);
    const r = await startChallenge(user.id, days);
    setBusy(false);
    if (r.error) { await sheet.tell({ title: t('Could not start'), message: r.error }); return; }
    load();
  }

  async function quit() {
    const yes = await sheet.confirm({
      title: t('Leave this challenge?'),
      message: t('Your streak ends here. You can start a new one straight away.'),
      confirmLabel: t('Leave it'),
      destructive: true,
    });
    if (!yes) return;
    await leaveChallenge(challenge.id);
    load();
  }

  if (challenge === undefined) {
    return <View style={styles.boot}><ActivityIndicator color={C.violet} /></View>;
  }

  const running = challenge && state && (state.state === 'on' || state.state === 'grace');
  const note = state ? message(state) : null;

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: 70 }}>
      <View style={styles.head}>
        <Press onPress={onBack} hitSlop={12} scaleTo={0.94} style={{ alignSelf: 'flex-start' }}>
          <Text style={[T.small, { color: C.violet }]}>{'←'} {t('Train')}</Text>
        </Press>
        <Text style={styles.title}>{t('Challenges')}</Text>
        <Text style={[T.small, { marginTop: 2 }]}>
          {t('Train every day. Miss one and the streak survives — once.')}
        </Text>
      </View>

      {/* ---------- a challenge is running ---------- */}
      {running ? (
        <FadeIn style={{ padding: S.lg }}>
          <View style={[styles.live, state.state === 'grace' && { borderColor: C.amber }]}>
            <Label color={state.state === 'grace' ? C.amber : C.violet}>
              {challenge.days} {t('day challenge')}
            </Label>
            <Text style={styles.dayBig}>
              {t('Day')} {state.dayNumber}
              <Text style={styles.daySmall}> / {state.total}</Text>
            </Text>

            <Bar value={state.completedDays} max={state.total}
              color={state.state === 'grace' ? C.amber : C.violet}
              height={8} style={{ marginTop: S.md, marginBottom: S.md }} />

            <Text style={[T.h3, { marginBottom: 4 }]}>{t(note.title)}</Text>
            <Text style={T.small}>{t(note.body)}</Text>

            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{state.completedDays}</Text>
                <Label>{t('days trained')}</Label>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{state.daysLeft}</Text>
                <Label>{t('to go')}</Label>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statNum, challenge.grace_used && { color: C.amber }]}>
                  {challenge.grace_used ? 0 : 1}
                </Text>
                <Label>{t('misses left')}</Label>
              </View>
            </View>

            {state.trainedToday ? (
              <View style={styles.doneToday}>
                <Text style={[T.small, { color: C.lime }]}>{t('Today is logged ✓')}</Text>
              </View>
            ) : (
              <Text style={[T.tiny, { marginTop: S.md }]}>
                {t('Any workout today keeps it going — planner, gym or home.')}
              </Text>
            )}
          </View>

          <Press onPress={quit} scaleTo={0.97} style={styles.quit}>
            <Text style={[T.small, { color: C.dim }]}>{t('Leave this challenge')}</Text>
          </Press>
        </FadeIn>
      ) : (
        <>
          {/* ---------- just finished, or just broke ---------- */}
          {challenge && state && note ? (
            <FadeIn style={{ paddingHorizontal: S.lg, paddingTop: S.lg }}>
              <View style={[styles.verdict,
                { borderLeftColor: state.state === 'done' ? C.lime : C.dim }]}>
                <Text style={[T.h3, { marginBottom: 4 }]}>{t(note.title)}</Text>
                <Text style={T.small}>{t(note.body)}</Text>
              </View>
            </FadeIn>
          ) : null}

          <FadeIn delay={40} style={{ padding: S.lg }}>
            <Label style={{ marginBottom: S.sm }}>{t('Pick a length')}</Label>
            {CHALLENGES.map((c, i) => (
              <Press key={c.days} onPress={() => begin(c.days)} disabled={busy}
                scaleTo={0.985} style={styles.opt}>
                <View style={styles.daysBadge}>
                  <Text style={styles.daysNum}>{c.days}</Text>
                  <Text style={T.tiny}>{t('days')}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.optName}>{t(c.name)}</Text>
                  <Text style={[T.small, { marginTop: 2 }]}>{t(c.blurb)}</Text>
                </View>
              </Press>
            ))}

            <Text style={[T.tiny, { marginTop: S.md }]}>
              {t('One challenge at a time. It starts today.')}
            </Text>
          </FadeIn>
        </>
      )}
    </ScrollView>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  head: { paddingHorizontal: S.lg, paddingTop: S.md, paddingBottom: S.md, backgroundColor: C.surface },
  title: { fontFamily: 'Forum_400Regular', fontSize: 30, lineHeight: 34, color: C.text, marginTop: 8 },

  live: {
    backgroundColor: C.surface, borderRadius: R.lg, padding: S.lg,
    borderWidth: 1.5, borderColor: C.violet,
  },
  dayBig: { fontFamily: 'Forum_400Regular', fontSize: 46, lineHeight: 50, color: C.text, marginTop: 2 },
  daySmall: { fontSize: 22, color: C.dim },

  statRow: { flexDirection: 'row', marginTop: S.lg, gap: S.sm },
  stat: { flex: 1, alignItems: 'center', backgroundColor: C.raised, borderRadius: R.sm, paddingVertical: S.sm },
  statNum: { fontFamily: 'Forum_400Regular', fontSize: 26, color: C.text },

  doneToday: {
    marginTop: S.md, alignSelf: 'flex-start', borderRadius: R.pill,
    borderWidth: 1, borderColor: C.lime, paddingHorizontal: 12, paddingVertical: 5,
  },
  quit: { alignItems: 'center', paddingVertical: 14, marginTop: S.md },

  verdict: {
    backgroundColor: C.surface, borderRadius: R.md, padding: S.md, borderLeftWidth: 4,
  },

  opt: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: R.md, padding: S.md, marginBottom: 10,
    borderWidth: 1.5, borderColor: C.line,
  },
  daysBadge: {
    width: 58, height: 58, borderRadius: R.md, backgroundColor: C.raised,
    alignItems: 'center', justifyContent: 'center',
  },
  daysNum: { fontFamily: 'Forum_400Regular', fontSize: 24, color: C.violet, lineHeight: 26 },
  optName: { fontFamily: 'Forum_400Regular', fontSize: 22, color: C.text },
});
