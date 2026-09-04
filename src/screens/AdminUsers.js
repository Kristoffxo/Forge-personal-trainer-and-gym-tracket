/* ---------------------------------------------------------------
   Everybody, and what they have been doing.

   The permission is in the database. Every function this screen
   calls begins by asking is_admin(), so hiding the tab is a
   convenience and not a lock — somebody who edited the app to show
   it would still get empty lists.

   What it deliberately does not show: anybody's food diary line by
   line, their weights, or the notes they wrote on the journey. An
   admin screen exists to keep the place running — to see whether an
   account is real, active and behaving — and reading somebody's
   body measurements is not that. Counts and dates only.
   --------------------------------------------------------------- */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, ActivityIndicator, Platform,
} from 'react-native';

import { S, R, useTheme } from '../theme';
import { Press, FadeIn, Label, Btn, useTabPad } from '../ui/kit';
import { useSheet } from '../ui/sheet';
import { Avatar } from '../ui/avatar';
import { journeyFrom } from '../journey';
import { ago } from '../social';
import { SwipeBack } from '../ui/swipeBack';
import {
  overview, listUsers, userDetail, userPosts, setAdmin, deleteUser,
} from '../admin';

const NO_RING = Platform.OS === 'web' ? { outlineStyle: 'none', outlineWidth: 0 } : null;

export default function AdminUsers() {
  const { C, T } = useTheme();
  const styles = makeStyles(C, T);
  const tabPad = useTabPad();
  const sheet = useSheet();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState(null);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(null);      // a user being read

  const load = useCallback(async (search) => {
    const o = await overview();
    if (o.error) { setError(o.error); setUsers([]); return; }
    setStats(o.overview);

    const r = await listUsers({ q: search });
    if (r.error) { setError(r.error); setUsers([]); return; }
    setError('');
    setUsers(r.users);
  }, []);

  useEffect(() => { load(''); }, [load]);

  /* Search on a pause rather than on every keystroke — this is a
     round trip per call, and an admin typing an email would fire one
     per letter. */
  useEffect(() => {
    const id = setTimeout(() => { load(q.trim()); }, 350);
    return () => clearTimeout(id);
  }, [q, load]);

  if (open) {
    return <Person userId={open} onBack={() => setOpen(null)}
      onGone={() => { setOpen(null); load(q.trim()); }} />;
  }

  if (error) {
    return (
      <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: tabPad }}>
        <View style={styles.warn}>
          <Text style={styles.warnTitle}>Not available</Text>
          <Text style={[T.small, { marginTop: 4 }]}>{error}</Text>
        </View>
      </ScrollView>
    );
  }

  if (!users) {
    return <View style={styles.boot}><ActivityIndicator color={C.violet} /></View>;
  }

  return (
    <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: tabPad }}
      keyboardShouldPersistTaps="handled">

      {stats ? (
        <FadeIn>
          <View style={styles.statGrid}>
            <Stat n={stats.users} label="accounts" C={C} T={T} />
            <Stat n={stats.active_7d} label="trained this week" C={C} T={T} />
            <Stat n={stats.new_7d} label="new this week" C={C} T={T} />
            <Stat n={stats.active_30d} label="trained this month" C={C} T={T} />
            <Stat n={stats.posts} label="posts" C={C} T={T} />
            <Stat n={stats.open_reports} label="reports"
              colour={stats.open_reports ? C.danger : null} C={C} T={T} />
          </View>
        </FadeIn>
      ) : null}

      <TextInput
        value={q} onChangeText={setQ}
        placeholder="Search a name or email" placeholderTextColor={C.faint}
        autoCapitalize="none" autoCorrect={false}
        underlineColorAndroid="transparent"
        style={[styles.search, NO_RING]}
      />

      <Label style={{ marginTop: S.lg, marginBottom: S.sm }}>
        {users.length} {users.length === 1 ? 'account' : 'accounts'}
      </Label>

      {users.map((u) => {
        const rank = journeyFrom(u.days_trained || 0).rank;
        return (
          <Press key={u.id} onPress={() => setOpen(u.id)} scaleTo={0.985} style={styles.row}>
            <Avatar name={u.name} path={u.avatar_path} at={u.avatar_at}
              size={40} colour={u.is_admin ? C.gold : C.line} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.name} numberOfLines={1}>{u.name}</Text>
                {u.is_admin ? <Text style={[styles.tag, { color: C.gold }]}>ADMIN</Text> : null}
                {u.reports ? <Text style={[styles.tag, { color: C.danger }]}>{u.reports} REPORTED</Text> : null}
              </View>
              <Text style={T.tiny} numberOfLines={1}>{u.email}</Text>
              <Text style={T.tiny}>
                {rank ? rank.name : 'Bronze 3'} · {u.days_trained || 0} days · {u.posts || 0} posts
              </Text>
            </View>
            <Text style={{ color: C.faint, marginLeft: 8 }}>{'›'}</Text>
          </Press>
        );
      })}

      {users.length === 0 ? (
        <Text style={[T.small, { textAlign: 'center', marginTop: S.xl }]}>
          Nobody matches that.
        </Text>
      ) : null}
    </ScrollView>
  );
}

function Stat({ n, label, colour, C, T }) {
  const styles = makeStyles(C, T);
  return (
    <View style={styles.stat}>
      <Text style={[styles.statNum, colour ? { color: colour } : null]}>{n == null ? '—' : n}</Text>
      <Text style={T.tiny}>{label}</Text>
    </View>
  );
}

/* ---------------------------------------------------------------
   One account.
   --------------------------------------------------------------- */
function Person({ userId, onBack, onGone }) {
  const { C, T } = useTheme();
  const styles = makeStyles(C, T);
  const tabPad = useTabPad();
  const sheet = useSheet();

  const [d, setD] = useState(null);
  const [posts, setPosts] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await userDetail(userId);
    if (!r.error) setD(r.detail);
    const p = await userPosts(userId);
    if (!p.error) setPosts(p.posts);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  /* Asked twice, and the second one has to be typed. A misfired tap
     on a row of accounts should not be able to end one. */
  async function remove() {
    const first = await sheet.confirm({
      title: `Delete ${d.name}?`,
      message: 'Their workouts, diary, posts, photographs and account all go. '
        + 'This cannot be undone.',
      confirm: 'Continue',
      destructive: true,
    });
    if (!first) return;

    const second = await sheet.confirm({
      title: 'Really delete this account?',
      message: d.email,
      confirm: 'Delete for good',
      destructive: true,
    });
    if (!second) return;

    setBusy(true);
    const r = await deleteUser(userId);
    setBusy(false);
    if (r.error) { await sheet.tell({ title: 'Could not delete', message: r.error }); return; }
    await sheet.tell({ title: 'Deleted', message: `${d.name} is gone.` });
    onGone();
  }

  async function toggleAdmin() {
    const yes = await sheet.confirm({
      title: d.is_admin ? `Remove admin from ${d.name}?` : `Make ${d.name} an admin?`,
      message: d.is_admin
        ? 'They will lose access to this screen.'
        : 'They will be able to see every account and delete any of them.',
      confirm: d.is_admin ? 'Remove' : 'Make admin',
      destructive: !!d.is_admin,
    });
    if (!yes) return;
    setBusy(true);
    const r = await setAdmin(userId, !d.is_admin);
    setBusy(false);
    if (r.error) { await sheet.tell({ title: 'Could not change', message: r.error }); return; }
    load();
  }

  if (!d) return <View style={styles.boot}><ActivityIndicator color={C.violet} /></View>;

  const me = journeyFrom(d.days_trained || 0);

  return (
    <SwipeBack onBack={onBack}>
      <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: tabPad }}>
        <Press onPress={onBack} hitSlop={16} scaleTo={0.94} style={{ alignSelf: 'flex-start' }}>
          <Text style={[T.small, { color: C.violet }]}>{'←'} All accounts</Text>
        </Press>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: S.lg, gap: 14 }}>
          <Avatar name={d.name} size={64} colour={d.is_admin ? C.gold : C.line} />
          <View style={{ flex: 1 }}>
            <Text style={styles.big}>{d.name}</Text>
            <Text style={T.tiny}>{d.email}</Text>
            <Text style={[T.tiny, { color: me.rank ? me.rank.colour : C.dim }]}>
              {me.rank ? me.rank.name : 'Bronze 3'}
            </Text>
          </View>
        </View>

        <Label style={{ marginTop: S.xl, marginBottom: S.sm }}>Account</Label>
        <Row k="Joined" v={d.created_at ? ago(d.created_at) + ' ago' : '—'} C={C} T={T} />
        <Row k="Last signed in" v={d.last_sign_in ? ago(d.last_sign_in) + ' ago' : 'never'} C={C} T={T} />
        <Row k="Admin" v={d.is_admin ? 'yes' : 'no'} C={C} T={T} />
        <Row k="Daily reminder" v={d.reminders_on ? 'on' : 'off'} C={C} T={T} />

        <Label style={{ marginTop: S.lg, marginBottom: S.sm }}>Training</Label>
        <Row k="Days trained" v={d.days_trained || 0} C={C} T={T} />
        <Row k="First workout" v={d.first_trained || '—'} C={C} T={T} />
        <Row k="Last workout" v={d.last_trained || '—'} C={C} T={T} />
        <Row k="Days with food logged" v={d.food_days || 0} C={C} T={T} />
        <Row k="Journey notes" v={d.journey_notes || 0} C={C} T={T} />

        <Label style={{ marginTop: S.lg, marginBottom: S.sm }}>Discover</Label>
        <Row k="Posts" v={d.posts || 0} C={C} T={T} />
        <Row k="Comments" v={d.comments || 0} C={C} T={T} />
        <Row k="Likes given" v={d.likes_given || 0} C={C} T={T} />
        <Row k="Reports against them" v={d.reports_against || 0}
          colour={d.reports_against ? C.danger : null} C={C} T={T} />

        {posts.length ? (
          <>
            <Label style={{ marginTop: S.lg, marginBottom: S.sm }}>
              Their posts ({posts.length})
            </Label>
            {posts.map((p) => (
              <View key={p.id} style={styles.postRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[T.small, { color: C.text }]} numberOfLines={2}>
                    {p.caption || 'no caption'}
                  </Text>
                  <Text style={T.tiny}>{ago(p.created_at)} ago</Text>
                </View>
                {p.reports ? (
                  <Text style={[styles.tag, { color: C.danger }]}>{p.reports} REPORTED</Text>
                ) : null}
              </View>
            ))}
            <Text style={[T.tiny, { marginTop: 6 }]}>
              Remove individual posts from the Moderation tab.
            </Text>
          </>
        ) : null}

        <Btn label={d.is_admin ? 'Remove admin' : 'Make admin'} dark color={C.dim}
          busy={busy} onPress={toggleAdmin} style={{ marginTop: S.xl }} />

        <Btn label="Delete this account" color={C.danger}
          busy={busy} onPress={remove} style={{ marginTop: S.sm }} />

        <Text style={[T.tiny, { marginTop: S.sm, textAlign: 'center' }]}>
          Deleting takes their workouts, diary, posts and photographs with it.
        </Text>
      </ScrollView>
    </SwipeBack>
  );
}

function Row({ k, v, colour, C, T }) {
  const styles = makeStyles(C, T);
  return (
    <View style={styles.kv}>
      <Text style={[T.small, { flex: 1 }]}>{k}</Text>
      <Text style={[styles.kvV, colour ? { color: colour } : null]}>{String(v)}</Text>
    </View>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: S.lg },
  stat: {
    flexGrow: 1, flexBasis: '30%', backgroundColor: C.surface, borderRadius: R.md,
    padding: S.md, alignItems: 'center',
  },
  statNum: { fontFamily: 'WorkSans_600SemiBold', fontSize: 24, color: C.text, lineHeight: 28 },

  search: {
    backgroundColor: C.surface, borderRadius: R.pill, borderWidth: 1, borderColor: C.line,
    paddingHorizontal: 16, paddingVertical: 11, color: C.text,
    fontFamily: 'WorkSans_400Regular', fontSize: 15,
  },

  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: R.md, padding: S.md, marginBottom: 8,
  },
  name: { fontFamily: 'WorkSans_600SemiBold', fontSize: 15, color: C.text, flexShrink: 1 },
  tag: { fontFamily: 'WorkSans_600SemiBold', fontSize: 9, letterSpacing: 0.8 },

  big: { fontFamily: 'WorkSans_600SemiBold', fontSize: 22, color: C.text, lineHeight: 26 },

  kv: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.line,
  },
  kvV: { fontFamily: 'WorkSans_600SemiBold', fontSize: 14, color: C.text },

  postRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.surface, borderRadius: R.md, padding: S.md, marginBottom: 6,
  },

  warn: {
    backgroundColor: C.surface, borderRadius: R.lg, padding: S.lg,
    borderLeftWidth: 4, borderLeftColor: C.amber,
  },
  warnTitle: { fontFamily: 'WorkSans_600SemiBold', fontSize: 16, color: C.text },
});
