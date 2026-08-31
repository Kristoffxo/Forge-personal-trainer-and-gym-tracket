import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, ImageBackground,
         KeyboardAvoidingView, Platform } from 'react-native';
import { S, R, useTheme } from '../theme';
import { Btn, Press, FadeIn, Label } from '../ui/kit';
import { Mark } from '../ui/logo';
import { IMG } from '../images';
import { signIn, signUp } from '../auth';
import { useLang } from '../lang';

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
    if (res.needsConfirm) { setNote('Almost there — confirm the link in your email, then sign in.'); setMode('in'); return; }
    onDone();
  }

  return (
    <KeyboardAvoidingView style={{ flex:1, backgroundColor:C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow:1 }} keyboardShouldPersistTaps="handled">

        <ImageBackground source={IMG.hero} style={styles.hero}>
          <View style={styles.heroVeil} />
          <Press onPress={toggleLang} scaleTo={0.9} style={styles.langBtn}>
            <Text style={styles.langTxt}>{lang === 'hi' ? 'ENGLISH' : 'HINGLISH'}</Text>
          </Press>
          <FadeIn style={{ padding:S.lg }}>
            <Mark size={56} style={{ marginBottom:S.sm }} />
            <Text style={styles.brand}>NEMEA</Text>
            <Text style={styles.tagline}>{t('Train like the')}{'\n'}{t('lion was real.')}</Text>
          </FadeIn>
        </ImageBackground>

        <View style={{ padding:S.lg }}>
          <FadeIn delay={80}>
            <View style={styles.toggle}>
              <Press onPress={() => { setMode('in'); setErr(''); }} scaleTo={0.97}
                style={[styles.tab, !isUp && styles.tabOn]}>
                <Text style={[styles.tabTxt, !isUp && { color:C.onAccent }]}>{t('Sign in')}</Text>
              </Press>
              <Press onPress={() => { setMode('up'); setErr(''); }} scaleTo={0.97}
                style={[styles.tab, isUp && styles.tabOn]}>
                <Text style={[styles.tabTxt, isUp && { color:C.onAccent }]}>{t('Create account')}</Text>
              </Press>
            </View>
          </FadeIn>

          {isUp ? (
            <FadeIn delay={120}>
              <Field label={t('Your name')} value={name} onChange={setName}
                placeholder="Aryan" autoCap="words" />
            </FadeIn>
          ) : null}

          <FadeIn delay={160}>
            <Field label={t('Email')} value={email} onChange={setEmail}
              placeholder={t('you@email.com')} keyboard="email-address" />
          </FadeIn>
          <FadeIn delay={200}>
            <Field label={t('Password')} value={pw} onChange={setPw}
              placeholder={t('at least 6 characters')} secure />
          </FadeIn>

          {err ? <Text style={styles.err}>{t(err)}</Text> : null}
          {note ? <Text style={styles.note}>{note}</Text> : null}

          <FadeIn delay={240}>
            <Btn label={isUp ? t('Create my account') : t('Sign in')}
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
        placeholderTextColor={C.faint} secureTextEntry={secure}
        keyboardType={keyboard || 'default'}
        autoCapitalize={autoCap || 'none'} autoCorrect={false}
        style={styles.input}
      />
    </View>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  /* width and overflow matter on the web: without them react-native-web sizes
     the photo to its own 1200px and it spills out of the box. */
  hero:{ width:'100%', height:300, overflow:'hidden',
         justifyContent:'flex-end', backgroundColor:C.surface },
  heroVeil:{ ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(14,13,12,0.55)' },
  brand:{ fontFamily:'WorkSans_500Medium', fontSize:12, letterSpacing:3.4, color:C.ember },
  langBtn:{ position:'absolute', top:S.md, right:S.md,
            paddingHorizontal:12, paddingVertical:7, borderRadius:R.pill,
            borderWidth:1.5, borderColor:C.gold, backgroundColor:'rgba(0,0,0,0.35)' },
  langTxt:{ fontFamily:'WorkSans_500Medium', fontSize:10.5, letterSpacing:1, color:C.gold },
  tagline:{ fontFamily:'WorkSans_600SemiBold', fontSize:34, lineHeight:38, color:C.text, marginTop:6 },
  toggle:{ flexDirection:'row', backgroundColor:C.surface, borderRadius:R.pill,
           padding:4, marginBottom:S.lg },
  tab:{ flex:1, paddingVertical:11, borderRadius:R.pill, alignItems:'center' },
  tabOn:{ backgroundColor:C.ember },
  tabTxt:{ fontFamily:'WorkSans_500Medium', fontSize:13.5, color:C.dim },
  input:{ backgroundColor:C.surface, borderRadius:R.md, paddingHorizontal:16, paddingVertical:15,
          fontFamily:'WorkSans_400Regular', fontSize:16, color:C.text,
          borderWidth:1, borderColor:C.line },
  err:{ fontFamily:'WorkSans_400Regular', fontSize:13.5, color:C.danger, marginTop:4 },
  note:{ fontFamily:'WorkSans_400Regular', fontSize:13.5, color:C.lime, marginTop:4 },
  fine:{ fontFamily:'WorkSans_400Regular', fontSize:11.5, color:C.faint,
         textAlign:'center', marginTop:S.md, lineHeight:16 },
});
