import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet,
         KeyboardAvoidingView, Platform } from 'react-native';
import { S, R, useTheme } from '../theme';
import { Btn, Press, FadeIn, Label, useCountUp } from '../ui/kit';
import { searchFoods, macrosFor, portionsFor } from '../foods';
import { addEntry, todayKey } from '../diary';
import { num } from '../num';
import { useLang } from '../lang';
import { useSheet } from '../ui/sheet';

export default function AddFood({ meal, onDone, onCancel, user }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  const [q, setQ] = useState('');
  const [deferred, setDeferred] = useState('');
  const [picked, setPicked] = useState(null);

  // Debounced so a 7,800-row scan doesn't run on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setDeferred(q), 140);
    return () => clearTimeout(id);
  }, [q]);

  const results = useMemo(() => searchFoods(deferred, 60), [deferred]);

  if (picked) return <Portion food={picked} meal={meal} user={user} onBack={() => setPicked(null)} onDone={onDone} />;

  return (
    <KeyboardAvoidingView style={styles.wrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.head}>
        <View style={styles.headRow}>
          <Label style={{ color:C.text }}>{t('Add to')} {t(meal).toLowerCase()}</Label>
          <Pressable onPress={onCancel} hitSlop={12}>
            <Text style={[T.small, { color:C.amber }]}>{t('Cancel')}</Text>
          </Pressable>
        </View>
        <TextInput value={q} onChangeText={setQ} placeholder={t('Search foods')}
          placeholderTextColor={C.stone} autoCorrect={false} autoFocus style={styles.input} />
        <View style={{height:1,backgroundColor:C.line}} />
      </View>

      <FlatList
        data={results} keyExtractor={(f) => String(f.id)}
        keyboardShouldPersistTaps="handled" initialNumToRender={14} windowSize={7}
        contentContainerStyle={{ paddingBottom:40 }}
        ListHeaderComponent={deferred.length < 2 ?
          <Label style={{ paddingHorizontal:S.lg, paddingTop:S.md }}>{t('Common foods')}</Label> : null}
        ListEmptyComponent={
          <Text style={[T.small, { padding:S.lg }]}>
            {t('Nothing matched. Try a simpler word.')}
          </Text>}
        renderItem={({ item, index }) => (
          <FadeIn delay={Math.min(index, 10) * 28} from={8} duration={360}>
            <Press onPress={() => setPicked(item)} style={styles.row}>
              <View style={{ flex:1, paddingRight:S.md }}>
                <Text style={[T.bodyOn]} numberOfLines={2}>{item.name}</Text>
                <Text style={T.tiny}>{item.cat}</Text>
              </View>
              <Text style={[T.body, { color:C.dim }]}>{Math.round(item.kcal)}</Text>
            </Press>
          </FadeIn>
        )}
      />
    </KeyboardAvoidingView>
  );
}

function Portion({ food, meal, user, onBack, onDone }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  const sheet = useSheet();
  const options = useMemo(() => portionsFor(food), [food]);
  const [idx, setIdx] = useState(0);
  const [qty, setQty] = useState('1');
  const [saving, setSaving] = useState(false);

  const n = num(qty);
  const count = isFinite(n) && n > 0 ? n : 0;
  const grams = options[idx].grams * count;
  const m = macrosFor(food, grams);
  const shownKcal = useCountUp(Math.round(m.kcal), 420);

  /* This waits on the network, and it used to do it with no sign that
     anything was happening: the button stayed lit, a second tap wrote
     the meal twice, and a failed write closed the screen anyway so the
     food simply was not there. All three are handled here. */
  async function save() {
    if (saving) return;
    setSaving(true);
    const r = await addEntry(user.id, todayKey(), {
      name:food.name, meal,
      portion:(count % 1 === 0 ? count : count.toFixed(2)) + ' × ' + options[idx].label +
              ' (' + Math.round(grams) + ' g)',
      grams, kcal:m.kcal, protein:m.protein, carbs:m.carbs, fat:m.fat,
    });
    setSaving(false);

    if (r.error) {
      await sheet.tell({
        title: t('Could not add that'),
        message: t('Nothing was saved. Check your connection and try again.'),
      });
      return;
    }
    onDone(r.row);
  }

  return (
    <KeyboardAvoidingView style={styles.wrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.head}>
        <View style={styles.headRow}>
          <Pressable onPress={onBack} hitSlop={12}>
            <Text style={[T.small, { color:C.amber }]}>{t('Back')}</Text>
          </Pressable>
          <Label style={{ color:C.text }}>{t(meal)}</Label>
        </View>
        <Text style={[T.h2, { marginTop:S.sm }]} numberOfLines={3}>{food.name}</Text>
        <Text style={T.tiny}>{food.cat}</Text>
      </View>

      <View style={{ paddingHorizontal:S.lg }}>
        <View style={styles.totalRow}>
          <View>
            <Text style={styles.total}>{shownKcal}</Text>
            <Label>kcal</Label>
          </View>
          <View style={{ flexDirection:'row' }}>
            <Mini label="P" v={m.protein} />
            <Mini label="C" v={m.carbs} />
            <Mini label="F" v={m.fat} />
          </View>
        </View>
        <Label style={{ marginTop:S.xl, marginBottom:S.sm }}>{t('Quantity')}</Label>
        <TextInput value={qty} onChangeText={setQty} keyboardType="decimal-pad" style={styles.qty} />
        <View style={{height:1,backgroundColor:C.line}} />
        <Label style={{ marginTop:S.xl, marginBottom:S.sm }}>{t('Serving')}</Label>
      </View>

      <FlatList
        data={options} keyExtractor={(o, i) => o.label + i}
        keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom:110 }}
        renderItem={({ item, index }) => (
          <Press onPress={() => setIdx(index)} style={[styles.optRow,
                 index === idx && { backgroundColor:'rgba(245,166,35,0.10)' }]} scaleTo={0.99}>
            <View style={{ width:14 }}>
              {index === idx ? <View style={styles.tick} /> : null}
            </View>
            <Text style={[T.body, { color: index === idx ? C.amber : C.dim, flex:1 }]}>{item.label}</Text>
            <Text style={T.tiny}>{Math.round(item.grams)} g</Text>
          </Press>
        )}
      />

      <View style={styles.foot}>
        <Btn label={t('Add to diary')} color={C.amber} onPress={save}
          busy={saving} disabled={count <= 0} />
      </View>
    </KeyboardAvoidingView>
  );
}
function Mini({ label, v }) {
  const { C, T } = useTheme();
  return (
    <View style={{ alignItems:'flex-end', marginLeft:S.lg }}>
      <Text style={[T.h3, { color:C.text }]}>{Math.round(v)}</Text>
      <Label>{label}</Label>
    </View>
  );
}
const makeStyles = (C, T) => StyleSheet.create({
  wrap:{ flex:1, backgroundColor:C.bg },
  head:{ paddingHorizontal:S.lg, paddingTop:S.md, paddingBottom:S.sm, backgroundColor:C.surface },
  headRow:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  input:{ backgroundColor:C.raised, borderRadius:R.sm, paddingHorizontal:14, paddingVertical:13,
          fontFamily:'WorkSans_400Regular', fontSize:16, color:C.text, marginTop:S.sm },
  row:{ flexDirection:'row', alignItems:'center', paddingVertical:13, paddingHorizontal:S.lg,
        borderBottomWidth:1, borderBottomColor:C.line },
  totalRow:{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-end', marginTop:S.lg },
  total:{ fontFamily:'WorkSans_600SemiBold', fontSize:50, lineHeight:54, color:C.amber },
  qty:{ backgroundColor:C.raised, borderRadius:R.sm, paddingHorizontal:14, paddingVertical:12,
        fontFamily:'WorkSans_400Regular', fontSize:18, color:C.text },
  optRow:{ flexDirection:'row', alignItems:'center', paddingVertical:13, paddingHorizontal:S.lg,
           borderBottomWidth:1, borderBottomColor:C.line },
  tick:{ width:6, height:6, borderRadius:3, backgroundColor:C.amber },
  foot:{ position:'absolute', left:0, right:0, bottom:0, padding:S.lg,
         backgroundColor:C.bg, borderTopWidth:1, borderTopColor:C.line },
});
