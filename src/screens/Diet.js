/* ---------------------------------------------------------------
   A day of food.

   The plan and the diary are the same system: every meal here has an
   Add button that writes it straight into today's food, which is the
   difference between a diet plan and a picture of one. Nobody
   transcribes a meal plan by hand twice.

   One day at a time, and the same day all day — a plan that changes
   every time the screen is opened is not a plan. Shuffle gives a
   different day for people who do not fancy what they were given.
   --------------------------------------------------------------- */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';

import { S, R, useTheme } from '../theme';
import { Press, FadeIn, Label, Btn, Bar, useTabPad } from '../ui/kit';
import { useSheet } from '../ui/sheet';
import { useLang } from '../lang';
import { planFor, summarise, today, DIETS } from '../diet';
import { dailyTarget, proteinTarget } from '../tdee';
import { addEntry, todayKey } from '../diary';

const THIS_YEAR = new Date().getFullYear();

export default function Diet({ user, profile, onAdded }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  const tabPad = useTabPad();
  const sheet = useSheet();

  const [bump, setBump] = useState(0);
  const [adding, setAdding] = useState(null);   // which meal is being saved
  const [done, setDone] = useState({});         // which meals have been

  const kg = Number((profile && profile.weight_kg) || 0);
  const cm = Number((profile && profile.height_cm) || 0);
  const age = profile && profile.birth_year ? THIS_YEAR - profile.birth_year : 0;
  const goal = (profile && profile.goal) || 'keep';
  const diet = (profile && profile.diet) || 'both';

  /* The target already on the profile is the one they may have
     edited by hand, so it wins over a fresh calculation. */
  const kcal = Number((profile && profile.goal_kcal) || 0)
    || dailyTarget({ sex: profile && profile.sex, kg, cm, age, experience: profile && profile.experience, goal });
  const protein = proteinTarget(kg);

  const plan = planFor({ kcal, protein, diet, goal, seed: today() + bump });
  const dietName = (DIETS.find((d) => d.key === diet) || DIETS[1]).name;

  async function add(meal) {
    setAdding(meal.id);
    /* Each item goes in as its own diary row, so a half-eaten meal
       can be corrected by removing one line rather than all of it. */
    let failed = false;
    for (const i of meal.items) {
      const r = await addEntry(user.id, todayKey(), {
        meal: meal.slot,
        name: i.name,
        portion: `${i.grams} g`,
        grams: i.grams,
        kcal: i.kcal,
        protein: i.protein,
        carbs: i.carbs,
        fat: i.fat,
      });
      if (r && r.error) { failed = true; break; }
    }
    setAdding(null);

    if (failed) {
      await sheet.tell({ title: t('Could not add'), message: t('Nothing was saved. Try again.') });
      return;
    }
    setDone({ ...done, [meal.id]: true });
    if (onAdded) onAdded();
  }

  if (!profile || !kg || !cm) {
    return (
      <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: tabPad }}>
        <View style={styles.warn}>
          <Text style={styles.warnTitle}>{t('Tell us your height and weight')}</Text>
          <Text style={[T.small, { marginTop: 4 }]}>
            {t('The planner needs them to work out how much to suggest. Challenges → Numbers.')}
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: tabPad }}>

      <FadeIn>
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Label>{t('Today')}</Label>
            <Text style={styles.big}>{plan.kcal} <Text style={styles.unit}>kcal</Text></Text>
            <Text style={T.tiny}>
              {t('Target')} {plan.target} · {dietName.toLowerCase()}
            </Text>
          </View>
          <Press onPress={() => { setBump(bump + 1); setDone({}); }}
            hitSlop={12} scaleTo={0.92} style={styles.shuffle}>
            <Text style={[styles.shuffleTxt, { color: C.amber }]}>{t('Shuffle')}</Text>
          </Press>
        </View>

        <Bar value={Math.min(plan.kcal, plan.target * 1.3)} max={plan.target * 1.3}
          color={C.amber} height={6} style={{ marginTop: S.sm }} />
        <Text style={[T.tiny, { marginTop: 6 }]}>{t(summarise(plan))}</Text>

        <View style={styles.macros}>
          <Macro n={plan.protein} unit="g" label={t('protein')}
            colour={plan.hitsProtein ? C.lime : C.dim} C={C} T={T} />
          <Macro n={plan.carbs} unit="g" label={t('carbs')} C={C} T={T} />
          <Macro n={plan.fat} unit="g" label={t('fat')} C={C} T={T} />
        </View>
        {protein > 0 && !plan.hitsProtein ? (
          <Text style={[T.tiny, { marginTop: 6 }]}>
            {t('Aiming for')} {protein} g {t('protein — shuffle for a higher one.')}
          </Text>
        ) : null}
      </FadeIn>

      {plan.meals.map((m, i) => (
        <FadeIn key={m.id} delay={40 + i * 30}>
          <View style={styles.meal}>
            <View style={styles.mealHead}>
              <View style={{ flex: 1 }}>
                <Label>{t(m.slot)}</Label>
                <Text style={styles.mealName}>{t(m.name)}</Text>
              </View>
              <Text style={styles.mealKcal}>{m.kcal}</Text>
            </View>

            {m.items.map((it) => (
              <View key={it.key} style={styles.item}>
                <Text style={[T.bodyOn, { flex: 1, fontSize: 14.5 }]}>{t(it.name)}</Text>
                <Text style={T.tiny}>{it.grams} g</Text>
                <Text style={styles.itemKcal}>{it.kcal}</Text>
              </View>
            ))}

            <Text style={[T.tiny, { marginTop: 8 }]}>
              {m.protein} g {t('protein')} · {m.carbs} g {t('carbs')} · {m.fat} g {t('fat')}
            </Text>

            <Btn
              label={done[m.id] ? t('Added') : t('Add to today')}
              color={done[m.id] ? C.lime : C.amber}
              dark={!!done[m.id]}
              busy={adding === m.id}
              disabled={!!done[m.id]}
              onPress={() => add(m)}
              style={{ marginTop: S.md }}
            />
          </View>
        </FadeIn>
      ))}

      <Text style={[T.tiny, { marginTop: S.lg, textAlign: 'center' }]}>
        {t('A suggestion, not a prescription. Portions are estimates, and nobody should eat the same day twice.')}
      </Text>
    </ScrollView>
  );
}

function Macro({ n, unit, label, colour, C, T }) {
  const styles = makeStyles(C, T);
  return (
    <View style={styles.macro}>
      <Text style={[styles.macroN, colour ? { color: colour } : null]}>{n}{unit}</Text>
      <Text style={T.tiny}>{label}</Text>
    </View>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-start' },
  big: { fontFamily: 'WorkSans_600SemiBold', fontSize: 36, lineHeight: 40, color: C.text },
  unit: { fontFamily: 'WorkSans_400Regular', fontSize: 16, color: C.dim },
  shuffle: {
    borderWidth: 1, borderColor: C.line, borderRadius: R.pill,
    paddingHorizontal: 14, paddingVertical: 7, marginTop: 6,
  },
  shuffleTxt: { fontFamily: 'WorkSans_600SemiBold', fontSize: 13 },

  macros: { flexDirection: 'row', gap: 8, marginTop: S.md },
  macro: {
    flex: 1, backgroundColor: C.surface, borderRadius: R.md,
    paddingVertical: S.md, alignItems: 'center',
  },
  macroN: { fontFamily: 'WorkSans_600SemiBold', fontSize: 19, color: C.text },

  meal: {
    backgroundColor: C.surface, borderRadius: R.lg, padding: S.lg, marginTop: S.md,
  },
  mealHead: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: S.sm },
  mealName: { fontFamily: 'WorkSans_600SemiBold', fontSize: 17, color: C.text, lineHeight: 21 },
  mealKcal: { fontFamily: 'WorkSans_600SemiBold', fontSize: 20, color: C.amber },

  item: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: C.line,
  },
  itemKcal: { fontFamily: 'WorkSans_500Medium', fontSize: 13, color: C.dim, width: 40, textAlign: 'right' },

  warn: {
    backgroundColor: C.surface, borderRadius: R.lg, padding: S.lg,
    borderLeftWidth: 4, borderLeftColor: C.amber,
  },
  warnTitle: { fontFamily: 'WorkSans_600SemiBold', fontSize: 16, color: C.text },
});
