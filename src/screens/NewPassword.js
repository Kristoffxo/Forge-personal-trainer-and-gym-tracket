/* ---------------------------------------------------------------
   Where a reset link lands.

   Supabase signs somebody in when they open the link — that is what
   the link is — and fires PASSWORD_RECOVERY. Without this screen
   they would arrive inside the app with a password they still do not
   know, which is the same as being locked out, only more confusing.

   Two boxes rather than one. Somebody who mistypes the only password
   they can now sign in with is locked out for a second time, by the
   thing that was meant to let them back in.
   --------------------------------------------------------------- */
import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ActivityIndicator, Pressable, KeyboardAvoidingView, Platform,
} from 'react-native';

import { S, R, useTheme, REPPO_ORANGE } from '../theme';
import { useLang } from '../lang';
import { Lockup } from '../ui/logo';
import { setPassword } from '../auth';

const INK = '#000000';
const FIELD = '#101014';
const LINE = '#22222A';
const DIM = '#7E7E88';
const FAINT = '#5A5A64';

export default function NewPassword({ onDone }) {
  const { t } = useLang();
  const { C } = useTheme();
  const styles = makeStyles(C);

  const [pw, setPw] = useState('');
  const [again, setAgain] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const long = pw.length >= 6;
  const same = pw === again;
  const ready = long && same && !busy;

  async function save() {
    if (!ready) return;
    setErr(''); setBusy(true);
    const r = await setPassword(pw);
    setBusy(false);
    if (r.error) { setErr(r.error); return; }
    onDone();
  }

  return (
    <KeyboardAvoidingView style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.body}>
        <Lockup width={108} onDark />

        <Text style={styles.title}>{t('Set a new password')}</Text>
        <Text style={styles.sub}>{t('You are signed in. Choose one you will remember.')}</Text>

        <TextInput
          value={pw} onChangeText={setPw}
          placeholder={t('New password')} placeholderTextColor={FAINT}
          secureTextEntry autoCapitalize="none" style={styles.field}
        />
        <TextInput
          value={again} onChangeText={setAgain}
          placeholder={t('Type it again')} placeholderTextColor={FAINT}
          secureTextEntry autoCapitalize="none" style={styles.field}
        />

        {/* Said as it is typed, not after pressing a button that
            refuses to do anything and does not say why. */}
        <Text style={styles.hint}>
          {pw.length === 0 ? t('At least 6 characters.')
            : !long ? t('At least 6 characters.')
              : !same ? t('The two do not match yet.')
                : t('That will do.')}
        </Text>

        {err ? <Text style={styles.err}>{err}</Text> : null}

        <Pressable onPress={save} disabled={!ready}
          style={({ pressed }) => [
            styles.go,
            !ready && styles.goOff,
            pressed && ready && { opacity: 0.86 },
          ]}>
          {busy ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={[styles.goTxt, !ready && { color: FAINT }]}>{t('Save it')}</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = () => StyleSheet.create({
  screen: { flex: 1, backgroundColor: INK },
  body: { flex: 1, justifyContent: 'center', paddingHorizontal: 26 },
  title: {
    fontFamily: 'WorkSans_600SemiBold', fontSize: 26, color: '#FFFFFF', marginTop: 26,
  },
  sub: { fontFamily: 'WorkSans_400Regular', fontSize: 14, color: DIM, marginTop: 6 },
  field: {
    backgroundColor: FIELD, borderRadius: R.md, borderWidth: 1.5, borderColor: LINE,
    color: '#FFFFFF', fontFamily: 'WorkSans_400Regular', fontSize: 16,
    paddingHorizontal: 16, paddingVertical: 16, marginTop: S.md,
  },
  hint: { fontFamily: 'WorkSans_400Regular', fontSize: 12.5, color: FAINT, marginTop: 10 },
  err: { fontFamily: 'WorkSans_500Medium', fontSize: 13, color: '#FF6B5A', marginTop: 8 },
  go: {
    backgroundColor: REPPO_ORANGE, borderRadius: R.md, minHeight: 58,
    alignItems: 'center', justifyContent: 'center', marginTop: S.lg,
  },
  goOff: { backgroundColor: FIELD, borderWidth: 1.5, borderColor: LINE },
  goTxt: { fontFamily: 'WorkSans_600SemiBold', fontSize: 16, color: '#FFFFFF' },
});
