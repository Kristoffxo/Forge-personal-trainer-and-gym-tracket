/* ---------------------------------------------------------------
   The admin portal.

   One place, opened from Settings, for whoever runs this. It used to
   be two sub-tabs bolted onto Challenges, which put moderation in
   the middle of a screen people use every day and left it one
   mis-tap from a leaderboard.

   Two sections: the accounts, and the feed. The permission is in the
   database — every query behind this asks is_admin() first — so the
   row in Settings not appearing is a convenience, not the lock.
   --------------------------------------------------------------- */
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { S, R, useTheme } from '../theme';
import { Press } from '../ui/kit';
import AdminUsers from './AdminUsers';
import Admin from './Admin';
import { SwipeBack } from '../ui/swipeBack';

const PAGES = [
  { key: 'people', label: 'Accounts' },
  { key: 'feed', label: 'Feed' },
];

export default function AdminPortal({ onBack }) {
  const { C, T } = useTheme();
  const styles = makeStyles(C, T);
  const [page, setPage] = useState('people');

  return (
    <SwipeBack onBack={onBack}>
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={styles.head}>
        <Press onPress={onBack} hitSlop={14} scaleTo={0.94}>
          <Text style={[T.small, { color: C.violet }]}>{'←'} Settings</Text>
        </Press>
        <Text style={styles.title}>Admin</Text>
        <Text style={styles.sub}>Everyone using Reppo, and everything posted</Text>
      </View>

      <View style={styles.switcher}>
        {PAGES.map((p) => {
          const on = page === p.key;
          return (
            <Press key={p.key} onPress={() => setPage(p.key)} scaleTo={0.97}
              style={[styles.tab, on && { backgroundColor: C.violet }]}>
              <Text style={[styles.tabTxt, on && { color: '#FFFFFF' }]}>{p.label}</Text>
            </Press>
          );
        })}
      </View>

      <View style={{ flex: 1 }}>
        {page === 'people' ? <AdminUsers /> : <Admin />}
      </View>
    </View>
    </SwipeBack>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  head: { paddingHorizontal: S.lg, paddingTop: S.md, paddingBottom: S.sm },
  title: { fontFamily: 'WorkSans_600SemiBold', fontSize: 26, color: C.text, marginTop: 6 },
  sub: { fontFamily: 'WorkSans_400Regular', fontSize: 12.5, color: C.dim, marginTop: 1 },

  switcher: {
    flexDirection: 'row', backgroundColor: C.surface, borderRadius: R.pill,
    padding: 4, marginHorizontal: S.lg, marginTop: S.sm,
  },
  tab: { flex: 1, borderRadius: R.pill, paddingVertical: 9, alignItems: 'center' },
  tabTxt: { fontFamily: 'WorkSans_600SemiBold', fontSize: 13.5, color: C.dim },
});
