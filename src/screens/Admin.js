/* ---------------------------------------------------------------
   Moderation.

   Only appears if `profiles.is_admin` is true, and only works if it
   is — the delete policies are in the database, so the tab showing
   up is a convenience, not the permission.

   Two lists: everything on the feed, and everything reported. Both
   delete the photograph as well as the row.
   --------------------------------------------------------------- */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';

import { S, R, useTheme } from '../theme';
import { Press, FadeIn, Label } from '../ui/kit';
import { useSheet } from '../ui/sheet';
import { loadAllPosts, loadReports, deletePost, imageUrl, firstNameOf, ago, daysLeft } from '../social';

export default function Admin() {
  const { C, T } = useTheme();
  const styles = makeStyles(C, T);
  const sheet = useSheet();

  const [posts, setPosts] = useState(null);
  const [reports, setReports] = useState([]);

  const load = useCallback(async () => {
    setPosts(await loadAllPosts());
    setReports(await loadReports());
  }, []);

  useEffect(() => { load(); }, [load]);

  const reportedIds = new Set(reports.map((r) => r.post_id).filter(Boolean));

  async function remove(post) {
    const yes = await sheet.confirm({
      title: 'Delete this post?',
      message: `${firstNameOf(post.name)} · ${ago(post.created_at)}`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!yes) return;
    const r = await deletePost(post);
    if (r.error) await sheet.tell({ title: 'Could not delete', message: r.error });
    load();
  }

  if (posts === null) {
    return <View style={styles.boot}><ActivityIndicator color={C.gold} /></View>;
  }

  return (
    <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: S.xxl }}>
      <View style={styles.summary}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{posts.length}</Text>
          <Label>on the feed</Label>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statNum, reports.length ? { color: C.danger } : null]}>
            {reports.length}
          </Text>
          <Label>reported</Label>
        </View>
      </View>

      <Text style={[T.tiny, { marginTop: S.sm }]}>
        Posts delete themselves after 7 days. Tap any photo to remove it now.
      </Text>

      {posts.length === 0 ? (
        <Text style={[T.small, { marginTop: S.xl }]}>Nothing posted yet.</Text>
      ) : (
        posts.map((p, i) => {
          const flagged = reportedIds.has(p.id);
          return (
            <FadeIn key={p.id} delay={Math.min(i, 8) * 30} from={6}>
              <Press
                onPress={() => remove(p)}
                scaleTo={0.99}
                style={[styles.row, flagged && { borderColor: C.danger }]}
              >
                <Image
                  source={{ uri: imageUrl(p.image_path) }}
                  style={styles.thumb}
                  resizeMode="cover"
                />
                <View style={{ flex: 1, marginHorizontal: 12 }}>
                  <Text style={styles.who}>
                    {firstNameOf(p.name)}
                    {flagged ? <Text style={{ color: C.danger }}>  · reported</Text> : null}
                  </Text>
                  {p.caption ? (
                    <Text style={T.tiny} numberOfLines={2}>{p.caption}</Text>
                  ) : null}
                  <Text style={T.tiny}>
                    {ago(p.created_at)} · {daysLeft(p.created_at)} days left
                  </Text>
                </View>
                <Text style={styles.bin}>{'✕'}</Text>
              </Press>
            </FadeIn>
          );
        })
      )}

      {reports.length ? (
        <View>
          <Label style={{ marginTop: S.xl, marginBottom: S.sm }}>Reports</Label>
          {reports.map((r) => (
            <View key={r.id} style={styles.report}>
              <Text style={[T.bodyOn, { fontSize: 13.5 }]}>
                {r.post_id ? `Post #${r.post_id}` : `Comment #${r.comment_id}`}
              </Text>
              <Text style={T.tiny}>{r.reason || 'no reason given'} · {ago(r.created_at)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  summary: { flexDirection: 'row', gap: S.md },
  stat: {
    flex: 1, backgroundColor: C.surface, borderRadius: R.md,
    padding: S.md, alignItems: 'center',
  },
  statNum: { fontFamily: 'WorkSans_600SemiBold', fontSize: 34, color: C.text },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: R.md, padding: 10, marginTop: 9,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  thumb: { width: 52, height: 52, borderRadius: R.sm, backgroundColor: C.raised },
  who: { fontFamily: 'WorkSans_500Medium', fontSize: 14.5, color: C.text },
  bin: { color: C.danger, fontSize: 16, paddingHorizontal: 8 },
  report: {
    backgroundColor: C.surface, borderRadius: R.sm, padding: S.sm, marginBottom: 7,
    borderLeftWidth: 3, borderLeftColor: C.danger,
  },
});
