/* ---------------------------------------------------------------
   You.

   Tools and Progress used to be two of the four tabs, which meant
   half the app's navigation was spent on screens you visit once a
   week. They are one tab now, with a switch at the top: what you
   have done, and the numbers everything else is calculated from.

   Both halves are the screens that already existed, unchanged —
   this only decides which one is showing.
   --------------------------------------------------------------- */
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { S, R, useTheme } from '../theme';
import { Press } from '../ui/kit';
import { useLang } from '../lang';
import Progress from './Progress';
import Tools from './Tools';
import Admin from './Admin';

const PAGES = [
  { key: 'progress', label: 'Progress' },
  { key: 'numbers', label: 'Numbers' },
];

/* Only whoever runs the app sees this one. */
const ADMIN_PAGE = { key: 'admin', label: 'Feed' };

export default function You({ user, profile, onProfile }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  const [page, setPage] = useState('progress');
  const pages = profile && profile.is_admin ? PAGES.concat(ADMIN_PAGE) : PAGES;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={styles.switcher}>
        {pages.map((p) => {
          const on = page === p.key;
          return (
            <Press
              key={p.key}
              onPress={() => setPage(p.key)}
              scaleTo={0.97}
              style={[styles.tab, on && { backgroundColor: C.violet }]}
            >
              <Text style={[styles.tabTxt, on && { color: C.onAccent }]}>{t(p.label)}</Text>
            </Press>
          );
        })}
      </View>

      <View style={{ flex: 1 }}>
        {page === 'progress' ? <Progress user={user} profile={profile} />
          : page === 'admin' ? <Admin />
            : <Tools user={user} profile={profile} onProfile={onProfile} />}
      </View>
    </View>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  switcher: {
    flexDirection: 'row', backgroundColor: C.surface, borderRadius: R.pill,
    padding: 4, marginHorizontal: S.lg, marginTop: S.md,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: R.pill, alignItems: 'center' },
  tabTxt: { fontFamily: 'WorkSans_500Medium', fontSize: 13.5, color: C.dim },
});
