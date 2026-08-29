import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, ImageBackground } from 'react-native';
import { S, R, useTheme } from '../theme';
import { Btn, Press, Card, FadeIn, Label, Chip, Bar } from '../ui/kit';
import { IMG } from '../images';
import { SPLITS, DAY_NAMES, buildWeek, todayIndex, dayTitle } from '../planner';
import { MUSCLES } from '../exercises';
import { supabase } from '../supabase';

const PER = [3, 4, 5, 6, 7, 8];
const KITS = ['Full gym', 'None'];

export default function Training({ user }) {
  const { C, T, MUSCLE_C } = useTheme();
  const styles = makeStyles(C, T);
  const [plan, setPlan] = useState(undefined);   // undefined = loading, null = none yet
  const [step, setStep] = useState(0);           // wizard position
  const [splitId, setSplitId] = useState(null);
  const [per, setPer] = useState(5);
  const [kit, setKit] = useState('Full gym');
  const [custom, setCustom] = useState([[],[],[],[],[],[],[]]);
  const [viewDay, setViewDay] = useState(todayIndex());
  const [running, setRunning] = useState(false);   // doing the session now
  const [done, setDone] = useState({});            // which moves are ticked off

  const load = useCallback(async () => {
    const { data } = await supabase.from('plans').select('*').eq('user_id', user.id).maybeSingle();
    setPlan(data || null);
  }, [user.id]);
  useEffect(() => { load(); }, [load]);

  async function savePlan() {
    const row = { user_id:user.id, split:splitId, per_session:per,
                  days:{ custom, kit } };
    await supabase.from('plans').upsert(row, { onConflict:'user_id' });
    setPlan(row);
    setStep(0);
    setViewDay(todayIndex());
  }

  if (plan === undefined) return <View style={styles.wrap} />;

  /* ---------- no plan yet: the wizard ---------- */
  if (plan === null || step > 0) {
    return (
      <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom:60 }}>
        <CoachHeader
          line="I’ll manage your exercises."
          sub="Answer two questions and I’ll write your week." />

        {/* step 1 — the split */}
        <FadeIn delay={60} style={{ padding:S.lg, paddingBottom:0 }}>
          <StepDot n={1} label="How do you want to train?" />
          {SPLITS.map((s) => {
            const on = splitId === s.id;
            return (
              <Press key={s.id} onPress={() => setSplitId(s.id)} scaleTo={0.985}
                style={[styles.opt, on && { borderColor:C.ember, backgroundColor:'rgba(232,92,36,0.10)' }]}>
                <View style={{ flex:1 }}>
                  <View style={{ flexDirection:'row', alignItems:'center' }}>
                    <Text style={styles.optName}>{s.name}</Text>
                    <View style={[styles.tag, on && { backgroundColor:C.ember }]}>
                      <Text style={[styles.tagTxt, on && { color:C.onAccent }]}>{s.tag}</Text>
                    </View>
                  </View>
                  <Text style={[T.small, { marginTop:4 }]}>{s.blurb}</Text>
                </View>
                <View style={[styles.radio, on && { borderColor:C.ember, backgroundColor:C.ember }]} />
              </Press>
            );
          })}
        </FadeIn>

        {/* custom day builder */}
        {splitId === 'custom' ? (
          <FadeIn style={{ paddingHorizontal:S.lg, marginTop:S.md }}>
            <Label style={{ marginBottom:S.sm }}>Tap the muscles for each day</Label>
            {DAY_NAMES.map((d, i) => (
              <View key={d} style={styles.customDay}>
                <Text style={styles.customDayName}>{d}</Text>
                <View style={styles.wrapRow}>
                  {MUSCLES.map((m) => {
                    const on = custom[i].includes(m);
                    return (
                      <Chip key={m} label={m} on={on} color={MUSCLE_C[m]}
                        onPress={() => {
                          const next = custom.map((x) => x.slice());
                          next[i] = on ? next[i].filter((x) => x !== m) : next[i].concat(m);
                          setCustom(next);
                        }} />
                    );
                  })}
                </View>
                <Text style={T.tiny}>{custom[i].length ? dayTitle(custom[i]) : 'Rest day'}</Text>
              </View>
            ))}
          </FadeIn>
        ) : null}

        {/* step 2 — volume */}
        <FadeIn delay={120} style={{ padding:S.lg }}>
          <StepDot n={2} label="How many exercises per session?" />
          <View style={styles.wrapRow}>
            {PER.map((n) => (
              <Chip key={n} label={String(n)} on={per === n} onPress={() => setPer(n)} />
            ))}
          </View>
          <Text style={[T.tiny, { marginTop:6 }]}>
            {per <= 4 ? 'Short and sharp — good for busy weeks.'
             : per <= 6 ? 'The sweet spot for most people.'
             : 'High volume. Only if you recover well.'}
          </Text>

          <View style={{ height:S.lg }} />
          <StepDot n={3} label="What equipment do you have?" />
          <View style={styles.wrapRow}>
            {KITS.map((k) => (
              <Chip key={k} label={k === 'None' ? 'Just bodyweight' : k}
                on={kit === k} color={C.teal} onPress={() => setKit(k)} />
            ))}
          </View>

          <Btn label="Build my plan" onPress={savePlan}
            disabled={!splitId || (splitId === 'custom' && custom.every((d) => d.length === 0))}
            style={{ marginTop:S.xl }} />
          {plan ? (
            <Btn label="Cancel" dark color={C.dim} onPress={() => setStep(0)}
              style={{ marginTop:S.sm }} />
          ) : null}
        </FadeIn>
      </ScrollView>
    );
  }

  /* ---------- a plan exists ---------- */
  const kitSaved = (plan.days && plan.days.kit) || 'Full gym';
  const week = buildWeek(plan.split, plan.days && plan.days.custom, plan.per_session, kitSaved);
  const today = week[viewDay];
  const isToday = viewDay === todayIndex();

  if (running) {
    return (
      <Session day={today} done={done} setDone={setDone}
        onExit={() => { setRunning(false); setDone({}); }} />
    );
  }

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom:60 }}>
      <CoachHeader
        line="Here’s your week."
        sub={`${SPLITS.find((s) => s.id === plan.split)?.name || 'Custom'} · ${plan.per_session} exercises a session`} />

      {/* day strip */}
      <FadeIn delay={60}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal:S.lg, paddingVertical:S.md }}>
          {week.map((d, i) => {
            const on = viewDay === i;
            const rest = d.muscles.length === 0;
            return (
              <Press key={d.day} onPress={() => setViewDay(i)} scaleTo={0.93}
                style={[styles.dayPill,
                        on && { backgroundColor:C.ember, borderColor:C.ember },
                        !on && rest && { opacity:0.45 }]}>
                <Text style={[styles.dayName, on && { color:C.onAccent }]}>{d.day}</Text>
                <Text style={[styles.dayKind, on && { color:C.onAccent }]} numberOfLines={1}>
                  {rest ? 'Rest' : d.title}
                </Text>
                {i === todayIndex() && !on ? <View style={styles.todayDot} /> : null}
              </Press>
            );
          })}
        </ScrollView>
      </FadeIn>

      {/* the session */}
      <FadeIn delay={110} style={{ paddingHorizontal:S.lg }}>
        <View style={styles.sessionHead}>
          <View style={{ flex:1 }}>
            <Label color={C.ember}>{isToday ? 'Today' : DAY_NAMES[viewDay]}</Label>
            <Text style={styles.sessionTitle}>{today.title}</Text>
          </View>
          {today.exercises.length ? (
            <View style={styles.countBadge}>
              <Text style={styles.countTxt}>{today.exercises.length}</Text>
              <Text style={T.tiny}>moves</Text>
            </View>
          ) : null}
        </View>

        {today.muscles.length ? (
          <View style={[styles.wrapRow, { marginBottom:S.md }]}>
            {today.muscles.map((m) => (
              <View key={m} style={[styles.mTag, { borderColor:MUSCLE_C[m] }]}>
                <View style={[styles.mDot, { backgroundColor:MUSCLE_C[m] }]} />
                <Text style={[T.tiny, { color:C.text }]}>{m}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {today.exercises.length === 0 ? (
          <Card style={{ alignItems:'center', paddingVertical:S.xl }}>
            <Text style={styles.restBig}>Rest</Text>
            <Text style={[T.small, { textAlign:'center', marginTop:6 }]}>
              Muscle is built while you recover. Walk, sleep, eat well.
            </Text>
          </Card>
        ) : today.exercises.map((x, i) => (
          <FadeIn key={x.n + i} delay={i * 45} from={8}>
            <View style={styles.exRow}>
              <View style={[styles.exNum, { backgroundColor:MUSCLE_C[x.m] }]}>
                <Text style={styles.exNumTxt}>{i + 1}</Text>
              </View>
              <View style={{ flex:1, marginHorizontal:12 }}>
                <Text style={styles.exName}>{x.n}</Text>
                <Text style={T.tiny}>{x.m} · {x.e}</Text>
              </View>
              <View style={styles.setsBox}>
                <Text style={styles.setsTxt}>{x.s}</Text>
              </View>
            </View>
          </FadeIn>
        ))}

        {today.exercises.length ? (
          <Btn label={isToday ? 'Start today\u2019s workout' : 'Start this workout'}
            onPress={() => { setDone({}); setRunning(true); }}
            style={{ marginTop:S.xl }} />
        ) : null}

        <Btn label="Change my plan" dark color={C.dim}
          onPress={() => { setSplitId(plan.split); setPer(plan.per_session);
                           setKit(kitSaved);
                           setCustom((plan.days && plan.days.custom) || [[],[],[],[],[],[],[]]);
                           setStep(1); }}
          style={{ marginTop:S.sm }} />
      </FadeIn>
    </ScrollView>
  );
}

/* ---------------------------------------------------------------
   Doing the workout. Tap a move to tick it off; the bar fills as you
   go and the finish button turns solid once everything is done.
   --------------------------------------------------------------- */
function Session({ day, done, setDone, onExit }) {
  const { C, T, MUSCLE_C } = useTheme();
  const styles = makeStyles(C, T);
  const total = day.exercises.length;
  const ticked = Object.keys(done).filter((k) => done[k]).length;
  const allDone = ticked === total && total > 0;

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom:60 }}>
      <View style={styles.sessionTop}>
        <Press onPress={onExit} scaleTo={0.94} style={{ alignSelf:'flex-start' }}>
          <Text style={[T.small, { color:C.ember }]}>\u2190 Back to my week</Text>
        </Press>
        <Text style={styles.sessionBig}>{day.title}</Text>
        <Text style={[T.small, { marginTop:2 }]}>
          {ticked} of {total} done
        </Text>
        <Bar value={ticked} max={total} color={allDone ? C.lime : C.ember}
             height={7} style={{ marginTop:S.md }} />
      </View>

      <View style={{ paddingHorizontal:S.lg, marginTop:S.lg }}>
        {day.exercises.map((x, i) => {
          const on = !!done[i];
          return (
            <FadeIn key={x.n + i} delay={i * 45} from={8}>
              <Press scaleTo={0.985}
                onPress={() => setDone({ ...done, [i]: !on })}
                style={[styles.exRow, on && { opacity:0.55, borderWidth:1, borderColor:C.lime }]}>
                <View style={[styles.check,
                              { backgroundColor: on ? C.lime : 'transparent',
                                borderColor: on ? C.lime : MUSCLE_C[x.m] }]}>
                  {on ? <Text style={styles.checkMark}>\u2713</Text> : null}
                </View>
                <View style={{ flex:1, marginHorizontal:12 }}>
                  <Text style={[styles.exName, on && { textDecorationLine:'line-through' }]}>
                    {x.n}
                  </Text>
                  <Text style={T.tiny}>{x.m} \u00b7 {x.e}</Text>
                </View>
                <View style={styles.setsBox}>
                  <Text style={styles.setsTxt}>{x.s}</Text>
                </View>
              </Press>
            </FadeIn>
          );
        })}

        <Btn label={allDone ? 'Finish \u2014 well done' : 'Finish workout'}
          color={allDone ? C.lime : C.ember} dark={!allDone}
          onPress={onExit} style={{ marginTop:S.xl }} />
        <Text style={[T.tiny, { textAlign:'center', marginTop:S.sm }]}>
          Tap a move to tick it off
        </Text>
      </View>
    </ScrollView>
  );
}

function CoachHeader({ line, sub }) {
  const { C, T } = useTheme();
  const styles = makeStyles(C, T);
  return (
    <ImageBackground source={IMG.s1} style={styles.header} resizeMode="cover">
      <View style={styles.headerVeil} />
      <View style={styles.headerRow}>
        <Image source={IMG.coach} style={styles.headerAvatar} />
        <View style={{ flex:1, marginLeft:S.md }}>
          <Label color={C.ember}>Siddhartha Gupta</Label>
          <Text style={styles.headerLine}>{line}</Text>
          <Text style={[T.small, { marginTop:2 }]}>{sub}</Text>
        </View>
      </View>
    </ImageBackground>
  );
}

function StepDot({ n, label }) {
  const { C, T } = useTheme();
  const styles = makeStyles(C, T);
  return (
    <View style={{ flexDirection:'row', alignItems:'center', marginBottom:S.md }}>
      <View style={styles.stepDot}><Text style={styles.stepNum}>{n}</Text></View>
      <Text style={[T.h3, { marginLeft:10, flex:1 }]}>{label}</Text>
    </View>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  wrap:{ flex:1, backgroundColor:C.bg },
  header:{ width:'100%', height:126, overflow:'hidden',
           backgroundColor:C.surface, justifyContent:'center' },
  headerVeil:{ ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(14,13,12,0.76)' },
  headerRow:{ flexDirection:'row', alignItems:'center', paddingHorizontal:S.lg },
  headerAvatar:{ width:56, height:56, borderRadius:28, borderWidth:2, borderColor:C.ember },
  headerLine:{ fontFamily:'Forum_400Regular', fontSize:24, color:C.text, marginTop:2 },

  stepDot:{ width:26, height:26, borderRadius:13, backgroundColor:C.ember,
            alignItems:'center', justifyContent:'center' },
  stepNum:{ fontFamily:'WorkSans_500Medium', fontSize:13, color:C.onAccent },

  opt:{ flexDirection:'row', alignItems:'center', backgroundColor:C.surface,
        borderRadius:R.md, padding:S.md, marginBottom:10, borderWidth:1.5, borderColor:C.line },
  optName:{ fontFamily:'Forum_400Regular', fontSize:20, color:C.text },
  tag:{ backgroundColor:C.raised, borderRadius:R.pill, paddingHorizontal:9, paddingVertical:3, marginLeft:8 },
  tagTxt:{ fontFamily:'WorkSans_500Medium', fontSize:10.5, color:C.dim },
  radio:{ width:20, height:20, borderRadius:10, borderWidth:2, borderColor:C.line, marginLeft:S.sm },

  customDay:{ backgroundColor:C.surface, borderRadius:R.md, padding:S.md, marginBottom:10 },
  customDayName:{ fontFamily:'WorkSans_500Medium', fontSize:14, color:C.text, marginBottom:8 },
  wrapRow:{ flexDirection:'row', flexWrap:'wrap', rowGap:8 },

  dayPill:{ minWidth:74, paddingVertical:11, paddingHorizontal:12, borderRadius:R.md,
            borderWidth:1.5, borderColor:C.line, marginRight:8, alignItems:'center',
            backgroundColor:C.surface },
  dayName:{ fontFamily:'WorkSans_500Medium', fontSize:13, color:C.text },
  dayKind:{ fontFamily:'WorkSans_400Regular', fontSize:11, color:C.dim, marginTop:2 },
  todayDot:{ position:'absolute', top:6, right:6, width:6, height:6,
             borderRadius:3, backgroundColor:C.ember },

  sessionHead:{ flexDirection:'row', alignItems:'flex-end', marginTop:S.sm, marginBottom:S.md },
  sessionTitle:{ fontFamily:'Forum_400Regular', fontSize:32, color:C.text, marginTop:2 },
  countBadge:{ alignItems:'center' },
  countTxt:{ fontFamily:'Forum_400Regular', fontSize:26, color:C.ember },

  mTag:{ flexDirection:'row', alignItems:'center', borderWidth:1, borderRadius:R.pill,
         paddingHorizontal:10, paddingVertical:4, marginRight:8 },
  mDot:{ width:6, height:6, borderRadius:3, marginRight:6 },

  exRow:{ flexDirection:'row', alignItems:'center', backgroundColor:C.surface,
          borderRadius:R.md, padding:12, marginBottom:9 },
  exNum:{ width:28, height:28, borderRadius:14, alignItems:'center', justifyContent:'center' },
  exNumTxt:{ fontFamily:'WorkSans_500Medium', fontSize:13, color:C.onAccent },
  exName:{ fontFamily:'WorkSans_500Medium', fontSize:15, color:C.text },
  setsBox:{ backgroundColor:C.raised, borderRadius:R.sm, paddingHorizontal:10, paddingVertical:6 },
  setsTxt:{ fontFamily:'WorkSans_500Medium', fontSize:12.5, color:C.ember },
  restBig:{ fontFamily:'Forum_400Regular', fontSize:36, color:C.dim },
  sessionTop:{ paddingHorizontal:S.lg, paddingTop:S.lg, paddingBottom:S.lg,
               backgroundColor:C.surface },
  sessionBig:{ fontFamily:'Forum_400Regular', fontSize:38, color:C.text, marginTop:6 },
  check:{ width:28, height:28, borderRadius:14, borderWidth:2,
          alignItems:'center', justifyContent:'center' },
  checkMark:{ color:C.onAccent, fontSize:15, fontFamily:'WorkSans_500Medium' },
});
