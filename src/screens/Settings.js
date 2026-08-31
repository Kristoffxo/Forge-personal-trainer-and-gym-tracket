/* ---------------------------------------------------------------
   Settings.

   Your account, and the switches that were scattered across other
   screens. Two things here are not decoration:

     - a password reset that goes through Supabase, so this app
       never sees or stores a password
     - a real account deletion, which both app stores require and
       which actually removes the auth row rather than just signing
       you out and leaving your data behind
   --------------------------------------------------------------- */
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';

import { S, R, useTheme } from '../theme';
import { Btn, Press, FadeIn, Label } from '../ui/kit';
import { useSheet } from '../ui/sheet';
import { useLang } from '../lang';
import { supabase } from '../supabase';
import { saveProfile, signOut } from '../auth';
import * as push from '../push';
import { EXPERIENCE, GOALS } from '../tdee';

export default function Settings({ user, profile, onProfile }) {
  const { C, T, mode, toggle } = useTheme();
  const { t, lang, toggle: toggleLang } = useLang();
  const styles = makeStyles(C, T);
  const sheet = useSheet();

  const [name, setName] = useState((profile && profile.full_name) || '');
  const [saving, setSaving] = useState(false);
  const [notifOn, setNotifOn] = useState(false);
  const [notifBusy, setNotifBusy] = useState(false);
  const [working, setWorking] = useState(false);

  useEffect(() => { push.isOn().then(setNotifOn); }, []);

  async function saveName() {
    setSaving(true);
    const p = await saveProfile({ full_name: name.trim() });
    setSaving(false);
    if (p) onProfile(p);
  }

  async function toggleNotif() {
    setNotifBusy(true);
    const r = notifOn ? await push.disable(user.id) : await push.enable(user.id);
    setNotifBusy(false);
    if (r.error) { await sheet.tell({ title: t('Not switched on'), message: r.error }); return; }
    setNotifOn(await push.isOn());
  }

  async function resetPassword() {
    const yes = await sheet.confirm({
      title: t('Send a reset link?'),
      message: `${t('We will email a link to')} ${user.email}.`,
      confirmLabel: t('Send it'),
    });
    if (!yes) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email);
    await sheet.tell({
      title: error ? t('Could not send') : t('Check your email'),
      message: error ? error.message : t('The link lets you set a new password. This app never sees it.'),
    });
  }

  async function removeAccount() {
    const yes = await sheet.confirm({
      title: t('Delete your account?'),
      message: t('Everything goes — your workouts, your posts, your food diary. This cannot be undone.'),
      confirmLabel: t('Delete everything'),
      destructive: true,
    });
    if (!yes) return;

    const sure = await sheet.confirm({
      title: t('Really delete?'),
      message: t('There is no way back from this one.'),
      confirmLabel: t('Yes, delete my account'),
      destructive: true,
    });
    if (!sure) return;

    setWorking(true);
    const { data } = await supabase.auth.getSession();
    const token = data && data.session && data.session.access_token;

    let ok = false;
    try {
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { authorization: 'Bearer ' + token },
      });
      ok = res.ok;
    } catch (e) {
      ok = false;
    }
    setWorking(false);

    if (!ok) {
      await sheet.tell({
        title: t('Could not delete'),
        message: t('Something went wrong and nothing was removed. Try again, or email us.'),
      });
      return;
    }
    await signOut();
  }

  const exp = EXPERIENCE.find((e) => e.key === (profile && profile.experience));
  const goal = GOALS.find((g) => g.key === (profile && profile.goal));

  return (
    <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: S.xxl }}>
      {/* ---- who you are ---- */}
      <FadeIn>
        <Label>{t('Your name')}</Label>
        <Text style={[T.tiny, { marginTop: 2, marginBottom: 8 }]}>
          {t('The first word of this is what Discover shows.')}
        </Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TextInput value={name} onChangeText={setName} style={[styles.input, { flex: 1 }]}
            placeholder="Aryan" placeholderTextColor={C.faint} autoCapitalize="words" />
          <Btn label={saving ? t('Saved') : t('Save')} color={C.gold} full={false}
            onPress={saveName} />
        </View>

        <View style={styles.row}>
          <Text style={[T.small, { flex: 1 }]}>{t('Signed in as')}</Text>
          <Text style={[T.bodyOn, { fontSize: 14 }]}>{user.email}</Text>
        </View>
      </FadeIn>

      {/* ---- what the app calculates from ---- */}
      <FadeIn delay={40}>
        <Label style={{ marginTop: S.xl, marginBottom: S.sm }}>{t('Your training')}</Label>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={[T.small, { flex: 1 }]}>{t('Experience')}</Text>
            <Text style={[T.bodyOn, { fontSize: 14 }]}>{exp ? t(exp.name) : '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[T.small, { flex: 1 }]}>{t('Goal')}</Text>
            <Text style={[T.bodyOn, { fontSize: 14 }]}>{goal ? t(goal.name) : '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[T.small, { flex: 1 }]}>{t('Daily calorie target')}</Text>
            <Text style={[T.bodyOn, { fontSize: 14 }]}>
              {(profile && profile.goal_kcal) || '—'} kcal
            </Text>
          </View>
          <Text style={[T.tiny, { marginTop: 6 }]}>
            {t('Change these in You → Numbers.')}
          </Text>
        </View>
      </FadeIn>

      {/* ---- switches ---- */}
      <FadeIn delay={80}>
        <Label style={{ marginTop: S.xl, marginBottom: S.sm }}>{t('App')}</Label>

        <Press onPress={toggleLang} scaleTo={0.98} style={styles.opt}>
          <Text style={[T.bodyOn, { flex: 1, fontSize: 15 }]}>{t('Language')}</Text>
          <Text style={[styles.optValue, { color: C.gold }]}>
            {lang === 'hi' ? 'Hinglish' : 'English'}
          </Text>
        </Press>

        <Press onPress={toggle} scaleTo={0.98} style={styles.opt}>
          <Text style={[T.bodyOn, { flex: 1, fontSize: 15 }]}>{t('Theme')}</Text>
          <Text style={[styles.optValue, { color: C.gold }]}>
            {mode === 'light' ? t('Light') : t('Dark')}
          </Text>
        </Press>

        <Press onPress={toggleNotif} disabled={notifBusy} scaleTo={0.98} style={styles.opt}>
          <View style={{ flex: 1 }}>
            <Text style={[T.bodyOn, { fontSize: 15 }]}>{t('Six o’clock reminder')}</Text>
            <Text style={T.tiny}>{t('One line from a philosopher, every evening')}</Text>
          </View>
          <Text style={[styles.optValue, { color: notifOn ? C.lime : C.faint }]}>
            {notifOn ? t('On') : t('Off')}
          </Text>
        </Press>
      </FadeIn>

      {/* ---- account ---- */}
      <FadeIn delay={120}>
        <Label style={{ marginTop: S.xl, marginBottom: S.sm }}>{t('Account')}</Label>

        <Btn label={t('Change password')} dark color={C.dim} onPress={resetPassword} />
        <Btn label={t('Sign out')} dark color={C.dim} onPress={signOut}
          style={{ marginTop: S.sm }} />

        <View style={styles.danger}>
          <Text style={[T.bodyOn, { fontSize: 15, marginBottom: 4 }]}>
            {t('Delete your account')}
          </Text>
          <Text style={T.small}>
            {t('Removes your account and everything in it, for good.')}
          </Text>
          {working ? (
            <ActivityIndicator color={C.danger} style={{ marginTop: S.md }} />
          ) : (
            <Btn label={t('Delete my account')} color={C.danger} dark
              onPress={removeAccount} style={{ marginTop: S.md }} />
          )}
        </View>
      </FadeIn>
    </ScrollView>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  input: {
    backgroundColor: C.surface, borderRadius: R.md, paddingHorizontal: 14, paddingVertical: 13,
    fontFamily: 'WorkSans_400Regular', fontSize: 16, color: C.text,
    borderWidth: 1, borderColor: C.line,
  },
  card: { backgroundColor: C.surface, borderRadius: R.md, padding: S.md },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  opt: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: R.md, padding: S.md, marginBottom: 9,
  },
  optValue: { fontFamily: 'WorkSans_500Medium', fontSize: 14 },
  danger: {
    marginTop: S.xl, backgroundColor: C.surface, borderRadius: R.md, padding: S.md,
    borderLeftWidth: 4, borderLeftColor: C.danger,
  },
});
