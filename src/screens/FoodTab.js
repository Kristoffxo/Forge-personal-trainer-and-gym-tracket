/* ---------------------------------------------------------------
   The Food tab.

   Two things: what you ate, and what you could eat. Today's diary
   opens first because that is what people come here to do — logging
   a meal is a daily job and reading a plan is a weekly one, and a
   tab that opens on advice when you wanted the tracker is a tab you
   have to press twice every time.
   --------------------------------------------------------------- */
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { S, R, useTheme } from '../theme';
import { Press } from '../ui/kit';
import { useLang } from '../lang';
import Food from './Food';
import Diet from './Diet';

const PAGES = [
  { key: 'today', label: 'Today' },
  { key: 'plan', label: 'Diet plan' },
];

export default function FoodTab({ user, profile, refreshKey, justAdded, onAdd, onChanged }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  const [page, setPage] = useState('today');

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={styles.switcher}>
        {PAGES.map((p) => {
          const on = page === p.key;
          return (
            <Press key={p.key} onPress={() => setPage(p.key)} scaleTo={0.97}
              style={[styles.tab, on && { backgroundColor: C.amber }]}>
              <Text style={[styles.tabTxt, on && { color: '#0B0B0E' }]}>{t(p.label)}</Text>
            </Press>
          );
        })}
      </View>

      <View style={{ flex: 1 }}>
        {page === 'plan' ? (
          <Diet user={user} profile={profile}
            /* Adding a meal from the plan writes into the same diary
               the other tab is showing, so it has to be told. */
            onAdded={onChanged} />
        ) : (
          <Food user={user} profile={profile} refreshKey={refreshKey}
            justAdded={justAdded} onAdd={onAdd} />
        )}
      </View>
    </View>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  switcher: {
    flexDirection: 'row', backgroundColor: C.surface, borderRadius: R.pill,
    padding: 4, margin: S.lg, marginBottom: 0,
  },
  tab: {
    flex: 1, borderRadius: R.pill, paddingVertical: 9, alignItems: 'center',
  },
  tabTxt: {
    fontFamily: 'WorkSans_600SemiBold', fontSize: 13.5, color: C.dim,
  },
});
