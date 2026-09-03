/* ---------------------------------------------------------------
   The first screen anybody sees.

   Black, the mark, the line, and two fields. Everything else that
   used to be here has gone: the photograph behind it (the mark
   carries its own gradient and the photo was competing with it),
   the segmented Sign in / Create account control (two buttons to
   decide between before you have typed anything), and the shouted
   EMAIL / PASSWORD labels above fields that already say what they
   are.

   What is left instead: room, and a focus state. A field that lights
   up when you are in it is the cheapest thing on this screen and the
   one that makes it feel considered.
   --------------------------------------------------------------- */
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable,
         ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { S, R, useTheme, REPPO_ORANGE } from '../theme';
import { FadeIn, useKeyboardHeight } from '../ui/kit';
import { Lockup } from '../ui/logo';
import { signIn, signUp } from '../auth';
import { useLang } from '../lang';

/* The screen is always the dark one, whatever the app is set to: it
   is where the brand is stated, so the colours are literal here
   rather than read from the palette. */
const INK = '#000000';
const FIELD = '#101014';
const LINE = '#22222A';
const DIM = '#7E7E88';
const FAINT = '#5A5A64';

export default function Auth({ onDone }) {
  const { T } = useTheme();
  const { t, lang, toggle: toggleLang } = useLang();
  const [mode, setMode] = useState('in');        // 'in' | 'up'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const isUp = mode === 'up';
  const ready = email.trim().length > 3 && pw.length >= 6 && (!isUp || name.trim().length > 0);

  async function go() {
    if (!ready || busy) return;
    setErr(''); setNote(''); setBusy(true);
    const res = isUp ? await signUp(email, pw, name) : await signIn(email, pw);
    setBusy(false);
    if (res.error) { setErr(res.error); return; }
    if (res.needsConfirm) {
      setNote(t('Almost there — confirm the link in your email, then sign in.'));
      setMode('in');
      return;
    }
    onDone();
  }

  function swap() {
    setMode(isUp ? 'in' : 'up');
    setErr(''); setNote('');
  }

  const kb = useKeyboardHeight();

  return (
    <KeyboardAvoidingView style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          /* Room under the form for the keyboard, and stop centring
             it once there is one: `justifyContent: center` with
             content shorter than the viewport pins the form in the
             middle with nothing to scroll, which is how the password
             box ended up underneath the keyboard with no way to
             reach it. */
          kb > 0 && { justifyContent: 'flex-start', paddingBottom: kb + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.column}>

          <Pressable onPress={toggleLang} hitSlop={12} style={styles.lang}>
            <Text style={styles.langTxt}>{lang === 'hi' ? 'Hinglish' : 'English'}</Text>
          </Pressable>

          {/* The mark shrinks out of the way once somebody is
              typing. A 196pt logo and a tagline is most of a short
              phone, and the point of this screen at that moment is
              the two boxes, not the branding. */}
          <FadeIn style={{ alignItems: 'center' }}>
            <Lockup width={kb > 0 ? 108 : 196} />
            {kb > 0 ? null : (
              <Text style={styles.tagline}>{t('Performance, redefined.')}</Text>
            )}
          </FadeIn>

          <FadeIn delay={70} style={{ width: '100%', marginTop: kb > 0 ? 22 : 46 }}>
            {isUp ? (
              <Field value={name} onChange={setName} placeholder={t('Your name')}
                autoCap="words" />
            ) : null}
            <Field value={email} onChange={setEmail} placeholder={t('Email')}
              keyboard="email-address" />
            <Field value={pw} onChange={setPw} placeholder={t('Password')} secure last />

            {err ? <Text style={styles.err}>{t(err)}</Text> : null}
            {note ? <Text style={styles.note}>{note}</Text> : null}

            <Pressable onPress={go} disabled={!ready || busy}
              style={({ pressed }) => [
                styles.go,
                !ready && styles.goOff,
                pressed && ready && { opacity: 0.86 },
              ]}>
              {busy
                ? <ActivityIndicator color="#FFFFFF" />
                : (
                  <Text style={[styles.goTxt, !ready && { color: FAINT }]}>
                    {isUp ? t('Create account') : t('Sign in')}
                  </Text>
                )}
            </Pressable>

            <Pressable onPress={swap} hitSlop={10} style={styles.swap}>
              <Text style={styles.swapTxt}>
                {isUp ? t('Already have an account?') : t('New here?')}{' '}
                <Text style={{ color: REPPO_ORANGE }}>
                  {isUp ? t('Sign in') : t('Create one')}
                </Text>
              </Text>
            </Pressable>
          </FadeIn>

          <Text style={styles.fine}>
            {t('Your password is never stored by this app.')}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* The placeholder is the label. One line of text where there were
   two, and nothing shouting in capitals above an empty box. */
function Field({ value, onChange, placeholder, secure, keyboard, autoCap, last }) {
  const [on, setOn] = useState(false);
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      onFocus={() => setOn(true)}
      onBlur={() => setOn(false)}
      placeholder={placeholder}
      placeholderTextColor={FAINT}
      secureTextEntry={secure}
      keyboardType={keyboard || 'default'}
      autoCapitalize={autoCap || 'none'}
      autoCorrect={false}
      style={[
        styles.input,
        !last && { marginBottom: 12 },
        on && { borderColor: REPPO_ORANGE },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: INK },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: S.lg, paddingVertical: 40 },
  /* capped, so it is a sign-in on a laptop and not a stretched form */
  column: { width: '100%', maxWidth: 380, alignSelf: 'center', alignItems: 'center' },

  lang: { alignSelf: 'flex-end', paddingVertical: 6, paddingHorizontal: 4, marginBottom: 22 },
  langTxt: { fontFamily: 'WorkSans_400Regular', fontSize: 13, color: DIM },

  tagline: {
    fontFamily: 'WorkSans_400Regular', fontSize: 15.5, letterSpacing: 0.3,
    color: DIM, marginTop: 22, textAlign: 'center',
  },

  input: {
    backgroundColor: FIELD, borderRadius: R.md,
    paddingHorizontal: 18, paddingVertical: 17,
    fontFamily: 'WorkSans_400Regular', fontSize: 16, color: '#FFFFFF',
    borderWidth: 1.5, borderColor: LINE,
  },

  go: {
    marginTop: 20, borderRadius: R.md, paddingVertical: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: REPPO_ORANGE, minHeight: 58,
  },
  /* Not a washed-out orange — a flat surface, so "not yet" reads as a
     state rather than as a broken button. */
  goOff: { backgroundColor: FIELD, borderWidth: 1.5, borderColor: LINE },
  goTxt: {
    fontFamily: 'WorkSans_600SemiBold', fontSize: 15.5,
    letterSpacing: 0.4, color: '#FFFFFF',
  },

  swap: { marginTop: 20, alignSelf: 'center' },
  swapTxt: { fontFamily: 'WorkSans_400Regular', fontSize: 14, color: DIM },

  err: { fontFamily: 'WorkSans_400Regular', fontSize: 13.5, color: '#F87171', marginTop: 12 },
  note: { fontFamily: 'WorkSans_400Regular', fontSize: 13.5, color: '#4ADE80', marginTop: 12 },

  fine: {
    fontFamily: 'WorkSans_400Regular', fontSize: 11.5, color: '#4A4A54',
    textAlign: 'center', marginTop: 34, lineHeight: 16,
  },
});
