/* ---------------------------------------------------------------
   The first screen anybody sees.

   Black, the logo, and the line. No photograph behind it: the mark
   carries its own gradient, and a stock gym shot underneath was
   competing with it rather than framing it.

   The rule under the tagline is the mark's gradient, drawn as a row
   of thin blocks. React Native has no gradient of its own and this
   is one screen — not worth a dependency for a strip four pixels
   tall.
   --------------------------------------------------------------- */
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView,
         KeyboardAvoidingView, Platform } from 'react-native';
import { S, R, useTheme, REPPO_ORANGE, REPPO_RED } from '../theme';
import { Btn, Press, FadeIn, Label } from '../ui/kit';
import { Lockup } from '../ui/logo';
import { signIn, signUp } from '../auth';
import { useLang } from '../lang';

/* orange to red, in `steps` blocks */
function GradientRule({ width = 132, height = 4, steps = 24, style }) {
  const a = [0xFE, 0x4E, 0x02];
  const b = [0xFA, 0x0A, 0x12];
  const blocks = [];
  for (let i = 0; i < steps; i++) {
    const k = i / (steps - 1);
    const c = a.map((v, j) => Math.round(v + (b[j] - v) * k));
    blocks.push(
      <View key={i} style={{
        flex: 1, height,
        backgroundColor: `rgb(${c[0]},${c[1]},${c[2]})`,
      }} />,
    );
  }
  return (
    <View style={[{ flexDirection: 'row', width, borderRadius: height, overflow: 'hidden' }, style]}>
      {blocks}
    </View>
  );
}

export default function Auth({ onDone }) {
  const { C, T } = useTheme();
  const { t, lang, toggle: toggleLang } = useLang();
  const styles = makeStyles(C, T);
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

  return (
    <KeyboardAvoidingView style={{ flex:1, backgroundColor:'#000000' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow:1 }} keyboardShouldPersistTaps="handled">

        <View style={styles.hero}>
          {/* In the flow, not floating over the artwork — absolutely
              positioned it landed on top of the mark. */}
          <View style={styles.topRow}>
            <Press onPress={toggleLang} scaleTo={0.9} style={styles.langBtn}>
              <Text style={styles.langTxt}>{lang === 'hi' ? 'HINGLISH' : 'ENGLISH'}</Text>
            </Press>
          </View>

          <FadeIn style={{ alignItems:'center' }}>
            <Lockup width={214} />
            <GradientRule width={120} height={3} style={{ marginTop:S.lg }} />
            <Text style={styles.tagline}>{t('Performance, redefined.')}</Text>
          </FadeIn>
        </View>

        <View style={styles.sheet}>
          <FadeIn delay={60}>
            <View style={styles.toggle}>
              <Press onPress={() => { setMode('in'); setErr(''); }} scaleTo={0.97}
                style={[styles.tab, !isUp && { backgroundColor: REPPO_ORANGE }]}>
                <Text style={[styles.tabTxt, !isUp && styles.tabTxtOn]}>{t('Sign in')}</Text>
              </Press>
              <Press onPress={() => { setMode('up'); setErr(''); }} scaleTo={0.97}
                style={[styles.tab, isUp && { backgroundColor: REPPO_ORANGE }]}>
                <Text style={[styles.tabTxt, isUp && styles.tabTxtOn]}>{t('Create account')}</Text>
              </Press>
            </View>
          </FadeIn>

          {isUp ? (
            <FadeIn delay={100}>
              <Field label={t('Your name')} value={name} onChange={setName}
                placeholder="Aryan" autoCap="words" />
            </FadeIn>
          ) : null}

          <FadeIn delay={130}>
            <Field label={t('Email')} value={email} onChange={setEmail}
              placeholder={t('you@email.com')} keyboard="email-address" />
          </FadeIn>
          <FadeIn delay={160}>
            <Field label={t('Password')} value={pw} onChange={setPw}
              placeholder={t('at least 6 characters')} secure />
          </FadeIn>

          {err ? <Text style={styles.err}>{t(err)}</Text> : null}
          {note ? <Text style={styles.note}>{note}</Text> : null}

          <FadeIn delay={190}>
            <Btn label={isUp ? t('Create my account') : t('Sign in')}
              color={REPPO_ORANGE}
              onPress={go} disabled={!ready} busy={busy} style={{ marginTop:S.lg }} />
          </FadeIn>

          <Text style={styles.fine}>
            {t('Your password is never stored by this app.')}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChange, placeholder, secure, keyboard, autoCap }) {
  const { C, T } = useTheme();
  const styles = makeStyles(C, T);
  return (
    <View style={{ marginBottom:S.md }}>
      <Label style={{ marginBottom:8 }}>{label}</Label>
      <TextInput
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor="#5A5A62" secureTextEntry={secure}
        keyboardType={keyboard || 'default'}
        autoCapitalize={autoCap || 'none'} autoCorrect={false}
        style={styles.input}
      />
    </View>
  );
}

/* The sign-in is always the dark one, whatever the app is set to —
   it is the first thing anybody sees and it is where the brand is
   stated. So the colours here are literal rather than from the
   palette. */
const makeStyles = (C, T) => StyleSheet.create({
  hero:{ paddingTop:S.md, paddingBottom:S.xl, paddingHorizontal:S.lg,
         alignItems:'stretch', backgroundColor:'#000000' },
  topRow:{ flexDirection:'row', justifyContent:'flex-end', marginBottom:S.lg },
  langBtn:{ paddingHorizontal:12, paddingVertical:7, borderRadius:R.pill,
            borderWidth:1.5, borderColor:'rgba(254,78,2,0.55)' },
  langTxt:{ fontFamily:'WorkSans_500Medium', fontSize:10.5, letterSpacing:1,
            color:REPPO_ORANGE },
  tagline:{ fontFamily:'WorkSans_400Regular', fontSize:16, letterSpacing:0.4,
            color:'#C9C9CF', marginTop:S.md, textAlign:'center' },

  sheet:{ padding:S.lg, paddingTop:S.xl, backgroundColor:'#0B0B0E',
          borderTopLeftRadius:R.lg, borderTopRightRadius:R.lg },
  toggle:{ flexDirection:'row', backgroundColor:'#16161B', borderRadius:R.pill,
           padding:4, marginBottom:S.lg },
  tab:{ flex:1, paddingVertical:11, borderRadius:R.pill, alignItems:'center' },
  tabTxt:{ fontFamily:'WorkSans_500Medium', fontSize:13.5, color:'#8A8A92' },
  tabTxtOn:{ color:'#FFFFFF' },
  input:{ backgroundColor:'#16161B', borderRadius:R.md, paddingHorizontal:16, paddingVertical:15,
          fontFamily:'WorkSans_400Regular', fontSize:16, color:'#FFFFFF',
          borderWidth:1, borderColor:'#2A2A32' },
  err:{ fontFamily:'WorkSans_400Regular', fontSize:13.5, color:'#EF4444', marginTop:4 },
  note:{ fontFamily:'WorkSans_400Regular', fontSize:13.5, color:'#4ADE80', marginTop:4 },
  fine:{ fontFamily:'WorkSans_400Regular', fontSize:11.5, color:'#6B7280',
         textAlign:'center', marginTop:S.md, lineHeight:16 },
});
