/* ---------------------------------------------------------------
   Point the camera at your dinner.

   Take a photo, the app reads it, and you get a list of what it
   thinks is on the plate with a calorie count against each item.
   Everything is editable before it goes in the diary, because an
   estimate from a photograph is an estimate — the screen says so
   rather than pretending otherwise.

   If the vision endpoint is not switched on, or the photo cannot be
   read, this never dead-ends: there is always a way through to the
   food search.
   --------------------------------------------------------------- */
import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, ScrollView, TextInput, StyleSheet,
  ActivityIndicator, Platform, KeyboardAvoidingView, useWindowDimensions,
} from 'react-native';

import { S, R, useTheme } from '../theme';
import { Btn, Press, FadeIn, Label, Chip } from '../ui/kit';
import { pickPhoto, CAN_TAKE_PHOTOS } from '../photo';
import { readMeal, sumItems } from '../vision';
import { addEntry, todayKey } from '../diary';
import { num } from '../num';

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

export default function Camera({ meal, user, onCancel, onDone }) {
  const { C, T } = useTheme();
  const styles = makeStyles(C, T);
  const { width } = useWindowDimensions();

  const [photo, setPhoto] = useState(null);
  const [stage, setStage] = useState('pick');   // pick | reading | result | error
  const [items, setItems] = useState([]);
  const [note, setNote] = useState('');
  const [confidence, setConfidence] = useState('');
  const [err, setErr] = useState(null);
  const [which, setWhich] = useState(meal || 'Lunch');
  const [saving, setSaving] = useState(false);

  const side = Math.min(width, 620) - S.lg * 2;

  /* Go straight to the camera. Nobody opened this screen to look at it. */
  useEffect(() => {
    let gone = false;
    (async () => {
      try {
        const p = await pickPhoto({ camera: true });
        if (gone) return;
        if (!p) { onCancel(); return; }
        setPhoto(p);
        analyse(p, '');
      } catch (e) {
        if (!gone) { setErr({ kind: 'device', message: e.message }); setStage('error'); }
      }
    })();
    return () => { gone = true; };
    // deliberately once, on open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function analyse(p, hint) {
    setStage('reading'); setErr(null);
    try {
      const r = await readMeal(p, hint);
      setItems(r.items.map((i) => ({ ...i, on: true })));
      setNote(r.note || '');
      setConfidence(r.confidence || '');
      setStage(r.items.length ? 'result' : 'error');
      if (!r.items.length) {
        setErr({ kind: 'unreadable', message: r.note || 'No food found in that photo.' });
      }
    } catch (e) {
      setErr({ kind: e.kind || 'failed', message: e.message });
      setStage('error');
    }
  }

  async function retake() {
    try {
      const p = await pickPhoto({ camera: true });
      if (!p) return;
      setPhoto(p);
      analyse(p, '');
    } catch (e) {
      setErr({ kind: 'device', message: e.message });
      setStage('error');
    }
  }

  const chosen = items.filter((i) => i.on);
  const total = sumItems(chosen);

  async function save() {
    setSaving(true);
    for (const it of chosen) {
      await addEntry(user.id, todayKey(), {
        meal: which,
        name: it.name,
        portion: it.portion || 'from a photo',
        grams: Number(it.grams) || 0,
        kcal: Number(it.kcal) || 0,
        protein: Number(it.protein) || 0,
        carbs: Number(it.carbs) || 0,
        fat: Number(it.fat) || 0,
      });
    }
    setSaving(false);
    onDone();
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.head}>
        <Press onPress={onCancel} hitSlop={12} scaleTo={0.94}>
          <Text style={[T.small, { color: C.amber }]}>Cancel</Text>
        </Press>
        <Label style={{ color: C.text }}>Snap a meal</Label>
      </View>

      <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: 130 }}
        keyboardShouldPersistTaps="handled">

        {photo ? (
          <Image
            source={{ uri: photo.uri }}
            style={{ width: side, height: side * 0.62, borderRadius: R.md, backgroundColor: C.raised }}
            resizeMode="cover"
          />
        ) : null}

        {/* ---- waiting ---- */}
        {stage === 'reading' ? (
          <View style={styles.centre}>
            <ActivityIndicator color={C.amber} />
            <Text style={[T.body, { marginTop: S.md }]}>Reading your plate…</Text>
            <Text style={T.tiny}>A few seconds.</Text>
          </View>
        ) : null}

        {/* ---- something went wrong ---- */}
        {stage === 'error' && err ? (
          <FadeIn style={{ marginTop: S.lg }}>
            <View style={styles.problem}>
              <Text style={[T.h3, { marginBottom: 6 }]}>
                {err.kind === 'off' ? 'Not switched on yet'
                  : err.kind === 'offline' ? 'No connection'
                    : err.kind === 'auth' ? 'Signed out'
                      : 'Could not read that one'}
              </Text>
              <Text style={T.small}>{err.message}</Text>
              {err.kind === 'off' ? (
                <Text style={[T.tiny, { marginTop: 8 }]}>
                  The photo reader needs an API key on the server. Until then you can
                  still log this by searching for it.
                </Text>
              ) : null}
            </View>

            {CAN_TAKE_PHOTOS && err.kind !== 'off' ? (
              <Btn label="Try another photo" color={C.amber} onPress={retake}
                style={{ marginTop: S.md }} />
            ) : null}
            <Btn label="Search for it instead" dark color={C.dim} onPress={onCancel}
              style={{ marginTop: S.sm }} />
          </FadeIn>
        ) : null}

        {/* ---- what it found ---- */}
        {stage === 'result' ? (
          <>
            <FadeIn style={{ marginTop: S.lg }}>
              <View style={styles.totalRow}>
                <View>
                  <Text style={styles.total}>{Math.round(total.kcal)}</Text>
                  <Label>kcal in total</Label>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={T.small}>
                    P {Math.round(total.protein)} · C {Math.round(total.carbs)} · F {Math.round(total.fat)}
                  </Text>
                  {confidence ? (
                    <View style={[styles.conf, {
                      borderColor: confidence === 'high' ? C.lime
                        : confidence === 'medium' ? C.amber : C.danger,
                    }]}>
                      <Text style={[T.tiny, { color: C.text }]}>{confidence} confidence</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {note ? <Text style={[T.small, { marginTop: S.sm }]}>{note}</Text> : null}
            </FadeIn>

            <Label style={{ marginTop: S.xl, marginBottom: S.sm }}>
              Tap to include or leave out · tap a number to correct it
            </Label>

            {items.map((it, i) => (
              <View key={i} style={[styles.item, !it.on && { opacity: 0.4 }]}>
                <Press
                  onPress={() => setItems(items.map((x, j) => (j === i ? { ...x, on: !x.on } : x)))}
                  scaleTo={0.9}
                  style={[styles.tick, it.on && { backgroundColor: C.amber, borderColor: C.amber }]}
                >
                  {it.on ? <Text style={styles.tickTxt}>{'✓'}</Text> : null}
                </Press>

                <View style={{ flex: 1, marginHorizontal: 10 }}>
                  <Text style={styles.itemName}>{it.name}</Text>
                  <Text style={T.tiny}>{it.portion} · {Math.round(it.grams)} g</Text>
                </View>

                <TextInput
                  value={String(Math.round(it.kcal))}
                  onChangeText={(v) => {
                    const n = num(v);
                    setItems(items.map((x, j) => (j === i ? { ...x, kcal: isFinite(n) ? n : 0 } : x)));
                  }}
                  keyboardType="number-pad"
                  style={styles.kcalInput}
                />
                <Text style={T.tiny}>kcal</Text>
              </View>
            ))}

            <Label style={{ marginTop: S.xl, marginBottom: S.sm }}>Which meal?</Label>
            <View style={styles.wrapRow}>
              {MEALS.map((m) => (
                <Chip key={m} label={m} on={which === m} color={C.amber}
                  onPress={() => setWhich(m)} />
              ))}
            </View>

            <Press onPress={retake} scaleTo={0.97} style={styles.retake}>
              <Text style={[T.small, { color: C.amber }]}>Take another photo</Text>
            </Press>

            <Text style={[T.tiny, { marginTop: S.md, textAlign: 'center' }]}>
              These are estimates from a photograph. Correct anything that looks wrong.
            </Text>
          </>
        ) : null}
      </ScrollView>

      {stage === 'result' ? (
        <View style={styles.foot}>
          <Btn
            label={`Add ${chosen.length} to ${which.toLowerCase()}`}
            color={C.amber} busy={saving} disabled={!chosen.length}
            onPress={save}
          />
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  head: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: S.lg, paddingVertical: S.md,
    backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.line,
  },
  centre: { alignItems: 'center', paddingVertical: S.xxl },
  problem: {
    backgroundColor: C.surface, borderRadius: R.md, padding: S.md,
    borderLeftWidth: 4, borderLeftColor: C.danger,
  },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  total: { fontFamily: 'Forum_400Regular', fontSize: 52, lineHeight: 56, color: C.amber },
  conf: { borderWidth: 1, borderRadius: R.pill, paddingHorizontal: 9, paddingVertical: 3, marginTop: 6 },

  item: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: R.md, padding: 12, marginBottom: 8,
  },
  tick: {
    width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: C.line,
    alignItems: 'center', justifyContent: 'center',
  },
  tickTxt: { color: C.onAccent, fontSize: 14, fontFamily: 'WorkSans_500Medium' },
  itemName: { fontFamily: 'WorkSans_500Medium', fontSize: 15, color: C.text },
  kcalInput: {
    fontFamily: 'Forum_400Regular', fontSize: 22, color: C.text,
    backgroundColor: C.raised, borderRadius: R.sm,
    paddingHorizontal: 10, paddingVertical: 5, minWidth: 64, textAlign: 'center', marginRight: 6,
  },

  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 },
  retake: { alignItems: 'center', paddingVertical: 14, marginTop: S.lg,
    borderRadius: R.md, borderWidth: 1, borderColor: C.line },

  foot: {
    position: 'absolute', left: 0, right: 0, bottom: 0, padding: S.lg,
    backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.line,
  },
});
