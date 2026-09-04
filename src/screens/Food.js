import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { S, R, useTheme } from '../theme';
import { Card, Press, FadeIn, Label, Bar, useCountUp } from '../ui/kit';
import { useSheet } from '../ui/sheet';
import { useLang } from '../lang';
import { Ring } from '../ui/ring';
import { todayKey, loadDay, removeEntry, totals } from '../diary';

/* Names, no symbols. A sun over "Breakfast" and a moon over "Dinner"
   tell you what the word already told you, and the half-moon for
   lunch and the star for snacks were not saying anything at all. */
const MEALS = [
  { name:'Breakfast' },
  { name:'Lunch' },
  { name:'Dinner' },
  { name:'Snacks' },
];

export default function Food({ user, profile, refreshKey, justAdded, onAdd }) {
  const { C, T } = useTheme();
  const { t: tr } = useLang();
  const styles = makeStyles(C, T);
  const sheet = useSheet();
  const [rows, setRows] = useState(null);
  const goal = profile?.goal_kcal || 2200;
  const day = todayKey();

  const load = useCallback(() => { loadDay(user.id, day).then(setRows); }, [user.id, day]);

  /* Show what was just saved immediately, then let the refetch replace
     it. The row is real — it came back from the insert — so this is
     not a guess about what the server will say, it is the server's
     answer arriving one round trip early. */
  useEffect(() => {
    if (justAdded) {
      setRows((prev) => {
        const list = prev || [];
        return list.some((r) => r.id === justAdded.id) ? list : list.concat(justAdded);
      });
    }
    load();
  }, [load, refreshKey, justAdded]);

  const t = totals(rows);
  const left = goal - t.kcal;
  const kcal = useCountUp(t.kcal);
  const p = useCountUp(t.protein, 550);
  const c = useCountUp(t.carbs, 550);
  const f = useCountUp(t.fat, 550);

  async function confirmRemove(e) {
    const yes = await sheet.confirm({
      title: tr('Remove this?'),
      message: e.name,
      confirmLabel: tr('Remove'),
      cancelLabel: tr('Keep it'),
      destructive: true,
    });
    if (yes) { await removeEntry(e.id); load(); }
  }

  const dateLabel = new Date().toLocaleDateString(undefined,
    { weekday:'long', day:'numeric', month:'long' });

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom:60 }}>
      <View style={styles.head}>
        <FadeIn><Label color={C.amber}>{dateLabel}</Label></FadeIn>
        <FadeIn delay={70} style={{ alignItems:'center', marginTop:S.md }}>
          <Ring size={196} stroke={10} progress={goal > 0 ? t.kcal / goal : 0}
                color={left >= 0 ? C.amber : C.danger} track={C.line}>
            <Text style={styles.ringNum}>{kcal}</Text>
            <Text style={T.tiny}>{tr('of')} {goal} kcal</Text>
            <View style={[styles.leftPill, left < 0 && { backgroundColor:'rgba(228,69,58,0.18)' }]}>
              <Text style={[styles.leftTxt, { color: left >= 0 ? C.amber : C.danger }]}>
                {left >= 0 ? left + ' ' + tr('left') : Math.abs(left) + ' ' + tr('over')}
              </Text>
            </View>
          </Ring>
        </FadeIn>

        <View style={styles.macros}>
          <Macro label={tr('Protein')} v={p} goal={Math.round(goal * 0.3 / 4)} color={C.protein} d={90} />
          <Macro label={tr('Carbs')}   v={c} goal={Math.round(goal * 0.45 / 4)} color={C.carbs} d={115} />
          <Macro label={tr('Fat')}     v={f} goal={Math.round(goal * 0.25 / 9)} color={C.fat} d={140} />
        </View>
      </View>

      {rows === null ? <ActivityIndicator color={C.amber} style={{ marginTop:S.xl }} /> :
        MEALS.map((meal, mi) => {
          const list = (rows || []).filter((e) => e.meal === meal.name);
          const mt = totals(list);
          return (
            <FadeIn key={meal.name} delay={140 + mi * 26} style={{ paddingHorizontal:S.lg, marginTop:S.lg }}>
              <View style={styles.mealHead}>
                <Text style={styles.mealName}>{tr(meal.name)}</Text>
                <Text style={[T.small, { color:C.amber }]}>{mt.kcal} kcal</Text>
              </View>

              {list.map((e) => (
                /* The row used to be long-press-only. It animated under
                   a tap and then did nothing, which reads as a broken
                   button rather than as a hint — so removing is now a
                   control you can see. Long press still works. */
                <View key={e.id} style={styles.row}>
                  <View style={{ flex:1, paddingRight:S.md }}>
                    <Text style={styles.foodName} numberOfLines={2}>{e.name}</Text>
                    <Text style={T.tiny}>{e.portion}</Text>
                  </View>
                  <Text style={styles.foodKcal}>{Math.round(e.kcal)}</Text>
                  <Press onPress={() => confirmRemove(e)} onLongPress={() => confirmRemove(e)}
                    hitSlop={14} scaleTo={0.85} style={styles.del}>
                    <Text style={styles.delX}>{'\u00d7'}</Text>
                  </Press>
                </View>
              ))}

              <Press onPress={() => onAdd(meal.name)} scaleTo={0.97} style={styles.addBtn}>
                <Text style={styles.addPlus}>+</Text>
                <Text style={styles.addTxt}>{tr('Add to')} {tr(meal.name).toLowerCase()}</Text>
              </Press>
            </FadeIn>
          );
        })}

      {rows && rows.length > 0 ? (
        <Text style={[T.tiny, { textAlign:'center', marginTop:S.lg }]}>
          {tr('Tap \u00d7 to remove an item')}
        </Text>
      ) : null}
    </ScrollView>
  );
}

function Macro({ label, v, goal, color, d }) {
  const { C, T } = useTheme();
  const styles = makeStyles(C, T);
  return (
    <FadeIn delay={d} style={{ flex:1, paddingHorizontal:5 }}>
      <Text style={[styles.macroNum, { color }]}>{v}<Text style={T.tiny}> g</Text></Text>
      <Label style={{ marginTop:2, marginBottom:7 }}>{label}</Label>
      <Bar value={v} max={goal} color={color} height={5} />
    </FadeIn>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  wrap:{ flex:1, backgroundColor:C.bg },
  head:{ paddingHorizontal:S.lg, paddingTop:S.lg, paddingBottom:S.lg, backgroundColor:C.surface },
  ringNum:{ fontFamily:'WorkSans_600SemiBold', fontSize:50, lineHeight:54, color:C.text },
  leftPill:{ marginTop:6, backgroundColor:'rgba(245,166,35,0.16)',
             borderRadius:R.pill, paddingHorizontal:11, paddingVertical:3 },
  leftTxt:{ fontFamily:'WorkSans_500Medium', fontSize:12 },
  macros:{ flexDirection:'row', marginTop:S.lg },
  macroNum:{ fontFamily:'WorkSans_600SemiBold', fontSize:24 },
  mealHead:{ flexDirection:'row', alignItems:'center', marginBottom:S.sm },
  mealName:{ flex:1, fontFamily:'WorkSans_600SemiBold', fontSize:22, color:C.text },
  row:{ flexDirection:'row', alignItems:'center', backgroundColor:C.surface,
        borderRadius:R.sm, padding:13, marginBottom:8 },
  foodName:{ fontFamily:'WorkSans_400Regular', fontSize:14.5, color:C.text },
  foodKcal:{ fontFamily:'WorkSans_600SemiBold', fontSize:20, color:C.amber },
  del:{ marginLeft:10, width:26, height:26, borderRadius:13, alignItems:'center',
        justifyContent:'center', backgroundColor:C.bg },
  delX:{ fontFamily:'WorkSans_400Regular', fontSize:17, lineHeight:19, color:C.dim },
  addBtn:{ flexDirection:'row', alignItems:'center', paddingVertical:13, paddingHorizontal:13,
           borderRadius:R.sm, borderWidth:1.5, borderColor:C.line, borderStyle:'dashed' },
  addPlus:{ fontFamily:'WorkSans_500Medium', fontSize:18, color:C.amber, marginRight:10 },
  addTxt:{ fontFamily:'WorkSans_400Regular', fontSize:14, color:C.dim },
});
