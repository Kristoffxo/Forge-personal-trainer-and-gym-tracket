import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, ImageBackground } from 'react-native';
import { S, R, useTheme } from '../theme';
import { Card, FadeIn, Label, Btn, Press, useCountUp } from '../ui/kit';
import { IMG } from '../images';
import { getProfile, saveProfile, signOut } from '../auth';
import { num, int } from '../num';
import { quoteOfDay } from '../quotes';
import { useLang } from '../lang';
import { useSheet } from '../ui/sheet';
import * as push from '../push';
import { quoteForDate } from '../quotes';

export default function Tools({ user, profile, onProfile }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const sheet = useSheet();
  const [notifOn, setNotifOn] = useState(false);
  const [notifBusy, setNotifBusy] = useState(false);

  useEffect(() => { push.isOn().then(setNotifOn); }, []);

  async function toggleNotif() {
    setNotifBusy(true);
    const r = notifOn ? await push.disable(user.id) : await push.enable(user.id);
    setNotifBusy(false);
    if (r.error) { await sheet.tell({ title: t('Not switched on'), message: r.error }); return; }
    setNotifOn(await push.isOn());
  }
  const styles = makeStyles(C, T);
  const [cm, setCm] = useState(profile?.height_cm ? String(profile.height_cm) : '');
  const [kg, setKg] = useState(profile?.weight_kg ? String(profile.weight_kg) : '');
  const [goal, setGoal] = useState(String(profile?.goal_kcal || 2200));
  const [saved, setSaved] = useState(false);
  const q = quoteOfDay();


  async function save() {
    const p = await saveProfile({
      height_cm: num(cm) || null,
      weight_kg: num(kg) || null,
      goal_kcal: int(goal, 2200),
    });
    if (p.data) { onProfile(p.data); setSaved(true); setTimeout(() => setSaved(false), 2000); }
  }

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom:60 }}>
      <ImageBackground source={IMG.hero} style={styles.head}>
        <View style={styles.headVeil} />
        <View style={{ padding:S.lg }}>
          <Label color={C.teal}>{t('Tools')}</Label>
          <Text style={styles.title}>{t('Know your numbers')}</Text>
        </View>
      </ImageBackground>

      {/* Height and weight stay — they feed the calorie target and
          the BMI on the Journey, which is where the index itself now
          lives. Two screens showing the same number invited them to
          disagree. */}
      <FadeIn delay={60} style={{ padding:S.lg }}>
        <Card color={C.teal}>
          <Label>{t('Your measurements')}</Label>
          <View style={{ flexDirection:'row', marginTop:S.md }}>
            <Num label={t('Height (cm)')} value={cm} onChange={setCm} />
            <View style={{ width:S.md }} />
            <Num label={t('Weight (kg)')} value={kg} onChange={setKg} />
          </View>
          <Text style={[T.tiny, { marginTop:S.sm }]}>
            {t('Your BMI is on the Journey tab.')}
          </Text>
        </Card>
      </FadeIn>

      {/* ---- daily target ---- */}
      <FadeIn delay={110} style={{ paddingHorizontal:S.lg }}>
        <Card color={C.amber}>
          <Label>{t('Daily calorie target')}</Label>
          <Text style={[T.small, { marginTop:4, marginBottom:S.md }]}>
            {t('The Food tab counts down from this.')}
          </Text>
          <Num label={t('kcal a day')} value={goal} onChange={setGoal} wide />
          <Btn label={saved ? t('Saved') + ' ✓' : t('Save my numbers')} color={saved ? C.lime : C.amber}
            onPress={save} style={{ marginTop:S.md }} />
        </Card>
      </FadeIn>

      {/* ---- quote ---- */}
      <FadeIn delay={160} style={{ padding:S.lg }}>
        <ImageBackground source={IMG.quote} style={styles.quote} imageStyle={{ borderRadius:R.md }}>
          <View style={styles.quoteVeil} />
          <View style={{ padding:S.md }}>
            <Text style={styles.quoteTxt}>“{q[0]}”</Text>
            <Label style={{ marginTop:S.sm }}>{q[1]}</Label>
          </View>
        </ImageBackground>
      </FadeIn>

      {/* ---- account ---- */}
      <FadeIn delay={200} style={{ paddingHorizontal:S.lg }}>
        <Card>
          <Label>{t('Account')}</Label>
          <Text style={[T.bodyOn, { marginTop:6 }]}>{profile?.full_name || 'Client'}</Text>
          <Text style={T.small}>{user.email}</Text>
          <Btn label={t('Sign out')} dark color={C.dim} onPress={signOut} style={{ marginTop:S.md }} />
        </Card>
      </FadeIn>
    </ScrollView>
  );
}

function Num({ label, value, onChange, wide }) {
  const { C, T } = useTheme();
  const styles = makeStyles(C, T);
  return (
    <View style={{ flex: wide ? undefined : 1 }}>
      <Label style={{ marginBottom:6 }}>{label}</Label>
      <TextInput value={value} onChangeText={onChange} keyboardType="decimal-pad"
        placeholder="0" placeholderTextColor={C.faint} style={styles.input} />
    </View>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  wrap:{ flex:1, backgroundColor:C.bg },
  pick:{ flexDirection:'row', alignItems:'center', borderWidth:1.5, borderColor:C.line,
         borderRadius:R.md, padding:S.md, marginTop:8 },
  radio:{ width:20, height:20, borderRadius:10, borderWidth:2, borderColor:C.line,
          marginLeft:S.sm },
  head:{ width:'100%', height:150, overflow:'hidden',
         justifyContent:'flex-end', backgroundColor:C.surface },
  headVeil:{ ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(14,13,12,0.66)' },
  title:{ fontFamily:'WorkSans_600SemiBold', fontSize:32, color:C.text, marginTop:2 },
  input:{ backgroundColor:C.raised, borderRadius:R.sm, paddingHorizontal:14, paddingVertical:13,
          fontFamily:'WorkSans_400Regular', fontSize:19, color:C.text },
  bmi:{ fontFamily:'WorkSans_600SemiBold', fontSize:64, lineHeight:68 },
  bandTxt:{ fontFamily:'WorkSans_500Medium', fontSize:12, letterSpacing:1.6, marginTop:2 },
  scale:{ flexDirection:'row', height:7, borderRadius:4, overflow:'hidden', marginTop:S.lg },
  marker:{ width:3, height:12, backgroundColor:C.text, marginLeft:-1.5, marginTop:3, borderRadius:2 },
  scaleNums:{ flexDirection:'row', justifyContent:'space-between', marginTop:6 },
  quote:{ width:'100%', minHeight:150, height:150, justifyContent:'flex-end',
          overflow:'hidden', borderRadius:R.md, backgroundColor:C.surface },
  quoteVeil:{ ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(14,13,12,0.68)', borderRadius:R.md },
  quoteTxt:{ fontFamily:'WorkSans_600SemiBold', fontStyle:'italic', fontSize:18, lineHeight:25, color:C.text },
});
