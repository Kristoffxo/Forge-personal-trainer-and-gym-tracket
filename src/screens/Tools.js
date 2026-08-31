import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, ImageBackground } from 'react-native';
import { S, R, useTheme } from '../theme';
import { Card, FadeIn, Label, Btn, useCountUp } from '../ui/kit';
import { IMG } from '../images';
import { getProfile, saveProfile, signOut } from '../auth';
import { num, int } from '../num';
import { quoteOfDay } from '../quotes';
import { useLang } from '../lang';
import { useSheet } from '../ui/sheet';
import * as push from '../push';
import { quoteForDate } from '../quotes';

const BANDS = [
  { max:18.5, label:'Underweight', color:'#5C9BE8',
    note:'Below the healthy range. Eating more is the priority, not training harder.' },
  { max:25,   label:'Healthy', color:'#8BC34A',
    note:'Right where you want to be. Keep doing what you are doing.' },
  { max:30,   label:'Overweight', color:'#F5A623',
    note:'A little above. A small daily calorie deficit is the lever.' },
  { max:1e9,  label:'Obese', color:'#E4453A',
    note:'Well above the healthy range. Structured coaching matters most here.' },
];

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

  const h = num(cm) / 100;
  const w = num(kg);
  const ok = h > 0.5 && h < 2.6 && w > 20 && w < 400;
  const bmi = ok ? w / (h * h) : 0;
  const band = ok ? BANDS.find((b) => bmi < b.max) : null;
  const shown = useCountUp(ok ? Math.round(bmi * 10) : 0, 550) / 10;
  const lo = ok ? 18.5 * h * h : 0;
  const hi = ok ? 24.9 * h * h : 0;
  const pos = ok ? Math.max(0, Math.min(1, (bmi - 14) / 26)) : 0;

  async function save() {
    const p = await saveProfile({
      height_cm: ok ? num(cm) : null,
      weight_kg: ok ? num(kg) : null,
      goal_kcal: int(goal, 2200),
    });
    if (p) { onProfile(p); setSaved(true); setTimeout(() => setSaved(false), 2000); }
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

      {/* ---- BMI ---- */}
      <FadeIn delay={60} style={{ padding:S.lg }}>
        <Card color={C.teal}>
          <Label>{t('Body Mass Index')}</Label>
          <View style={{ flexDirection:'row', marginTop:S.md }}>
            <Num label={t('Height (cm)')} value={cm} onChange={setCm} />
            <View style={{ width:S.md }} />
            <Num label={t('Weight (kg)')} value={kg} onChange={setKg} />
          </View>

          <View style={{ marginTop:S.lg, alignItems:'center' }}>
            <Text style={[styles.bmi, { color: band ? band.color : C.faint }]}>
              {ok ? shown.toFixed(1) : '—'}
            </Text>
            <Text style={[styles.bandTxt, { color: band ? band.color : C.faint }]}>
              {band ? t(band.label).toUpperCase() : t('ENTER YOUR NUMBERS')}
            </Text>
          </View>

          {ok ? (
            <>
              <View style={styles.scale}>
                <View style={{ flex:4.5, backgroundColor:'#5C9BE8' }} />
                <View style={{ flex:6.5, backgroundColor:'#8BC34A' }} />
                <View style={{ flex:5,   backgroundColor:'#F5A623' }} />
                <View style={{ flex:10,  backgroundColor:'#E4453A' }} />
              </View>
              <View style={{ marginLeft:(pos * 100) + '%' }}>
                <View style={styles.marker} />
              </View>
              <View style={styles.scaleNums}>
                {['14','18.5','25','30','40'].map((n) => <Text key={n} style={T.tiny}>{n}</Text>)}
              </View>
              <Text style={[T.body, { marginTop:S.md }]}>{t(band.note)}</Text>
              <Text style={[T.small, { marginTop:6, color:C.text }]}>
                Healthy weight for your height: {lo.toFixed(0)}–{hi.toFixed(0)} kg
              </Text>
              <Text style={[T.tiny, { marginTop:S.sm }]}>
                BMI cannot tell muscle from fat, so it reads high if you train.
                One number, not a verdict.
              </Text>
            </>
          ) : null}
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

      {/* ---- the six o'clock line ---- */}
      <FadeIn delay={180} style={{ paddingHorizontal:S.lg, marginBottom:S.lg }}>
        <Card color={C.gold}>
          <Label>{t('Daily reminder')}</Label>
          <Text style={[T.small, { marginTop:4 }]}>
            {t('One line from a philosopher, every evening at six.')}
          </Text>
          <Btn
            label={notifOn ? t('Turn off the 6pm reminder') : t('Send me the 6pm reminder')}
            color={notifOn ? C.dim : C.gold} dark={notifOn}
            busy={notifBusy} onPress={toggleNotif}
            style={{ marginTop:S.md }} />
          {notifOn ? (
            <Text style={[T.tiny, { marginTop:S.sm }]}>
              {t('Tonight')}: “{quoteForDate()[0]}” — {quoteForDate()[1]}
            </Text>
          ) : null}
        </Card>
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
  head:{ width:'100%', height:150, overflow:'hidden',
         justifyContent:'flex-end', backgroundColor:C.surface },
  headVeil:{ ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(14,13,12,0.66)' },
  title:{ fontFamily:'Forum_400Regular', fontSize:32, color:C.text, marginTop:2 },
  input:{ backgroundColor:C.raised, borderRadius:R.sm, paddingHorizontal:14, paddingVertical:13,
          fontFamily:'WorkSans_400Regular', fontSize:19, color:C.text },
  bmi:{ fontFamily:'Forum_400Regular', fontSize:64, lineHeight:68 },
  bandTxt:{ fontFamily:'WorkSans_500Medium', fontSize:12, letterSpacing:1.6, marginTop:2 },
  scale:{ flexDirection:'row', height:7, borderRadius:4, overflow:'hidden', marginTop:S.lg },
  marker:{ width:3, height:12, backgroundColor:C.text, marginLeft:-1.5, marginTop:3, borderRadius:2 },
  scaleNums:{ flexDirection:'row', justifyContent:'space-between', marginTop:6 },
  quote:{ width:'100%', minHeight:150, height:150, justifyContent:'flex-end',
          overflow:'hidden', borderRadius:R.md, backgroundColor:C.surface },
  quoteVeil:{ ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(14,13,12,0.68)', borderRadius:R.md },
  quoteTxt:{ fontFamily:'Forum_400Regular', fontStyle:'italic', fontSize:18, lineHeight:25, color:C.text },
});
