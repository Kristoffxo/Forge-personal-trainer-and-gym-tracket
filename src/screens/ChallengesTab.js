/* ---------------------------------------------------------------
   The Challenges tab.

   Three things, in the order somebody wants them: a race against
   another person, the medals in front of and behind you, and the
   numbers everything is calculated from.

   Settings used to be a fourth switch up here. It is behind the
   three dots in the corner now — it is a place you go once, not one
   of three things you flip between daily.
   --------------------------------------------------------------- */
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { S, R, useTheme } from '../theme';
import { Press } from '../ui/kit';
import { useLang } from '../lang';
import Compete from './Compete';
import Journey from './Journey';
import Tools from './Tools';
import Admin from './Admin';

const PAGES = [
  { key: 'compete', label: 'Compete' },
  { key: 'journey', label: 'Journey' },
  { key: 'numbers', label: 'Numbers' },
];

/* Only whoever runs the app sees this one. */
const ADMIN_PAGE = { key: 'admin', label: 'Feed' };

export default function ChallengesTab({ user, profile, onProfile }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  const [page, setPage] = useState('compete');
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
              <Text style={[styles.tabTxt, on && { color: '#FFFFFF' }]}>{t(p.label)}</Text>
            </Press>
          );
        })}
      </View>

      <View style={{ flex: 1 }}>
        {page === 'compete' ? <Compete user={user} profile={profile} />
          : page === 'journey' ? <Journey user={user} profile={profile} />
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
  tabTxt: { fontFamily: 'WorkSans_500Medium', fontSize: 12.5, color: C.dim },
});
