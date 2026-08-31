/* ---------------------------------------------------------------
   The feed — photos, first names, comments. Nothing else.

   Three views live in this file because they share one piece of
   state (the list) and splitting them would mean threading a
   refresh callback through two more files:

     list      what everyone posted
     compose   pick a photo, write a name and a caption
     post      one photo and its comments
   --------------------------------------------------------------- */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, Image, ScrollView, TextInput, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, useWindowDimensions,
} from 'react-native';

import { S, R, useTheme } from '../theme';
import { Btn, Press, FadeIn, Label } from '../ui/kit';
import { useSheet } from '../ui/sheet';
import { useLang } from '../lang';
import { pickPhoto, CAN_TAKE_PHOTOS } from '../photo';
import {
  loadFeed, createPost, deletePost, loadComments, addComment, deleteComment,
  report, blockUser, imageUrl, firstNameOf, ago, postedToday,
  likeCounts, myLikes, setLike,
} from '../social';

export default function Feed({ user, profile }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);

  const [view, setView] = useState('list');       // list | compose | post
  const [posts, setPosts] = useState(null);
  const [counts, setCounts] = useState({});
  const [error, setError] = useState('');
  const [more, setMore] = useState(false);
  const [open, setOpen] = useState(null);          // the post being read
  const [posted, setPosted] = useState(false);     // already posted today
  const [likes, setLikes] = useState({});          // post id -> how many
  const [mine, setMine] = useState(new Set());     // which ones I liked

  const load = useCallback(async () => {
    const r = await loadFeed();
    if (r.error) { setError(r.error); setPosts([]); return; }
    setError('');
    setPosts(r.posts);
    setCounts(r.counts);
    setMore(r.posts.length >= 12);
    setPosted(await postedToday(user.id));

    const ids = r.posts.map((p) => p.id);
    setLikes(await likeCounts(ids));
    setMine(await myLikes(user.id, ids));
  }, [user.id]);

  /* Optimistic: the number moves the instant you tap. A like that
     fails to save is not worth a spinner. */
  async function toggleLike(post) {
    const on = !mine.has(post.id);
    const next = new Set(mine);
    if (on) next.add(post.id); else next.delete(post.id);
    setMine(next);
    setLikes({ ...likes, [post.id]: Math.max(0, (likes[post.id] || 0) + (on ? 1 : -1)) });
    await setLike(post.id, user.id, on);
  }

  useEffect(() => { load(); }, [load]);

  async function loadMore() {
    if (!posts || !posts.length) return;
    const r = await loadFeed({ before: posts[posts.length - 1].created_at });
    if (r.error) return;
    setPosts(posts.concat(r.posts));
    setCounts({ ...counts, ...r.counts });
    setMore(r.posts.length >= 12);
  }

  if (view === 'compose') {
    return (
      <Compose
        user={user} profile={profile} alreadyPosted={posted}
        onCancel={() => setView('list')}
        onDone={() => { setView('list'); load(); }}
      />
    );
  }

  if (view === 'post' && open) {
    return (
      <PostView
        post={open} user={user} profile={profile}
        onBack={() => { setView('list'); setOpen(null); load(); }}
      />
    );
  }

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: 70 }}>
      <View style={styles.top}>
        <Press onPress={() => setView('compose')} scaleTo={0.98} style={styles.share}>
          <Text style={styles.shareIcon}>{'◎'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.shareTxt}>
              {posted ? t('Posted today') : t('Post today\u2019s photo')}
            </Text>
            <Text style={T.tiny}>
              {posted ? t('Come back tomorrow.') : t('One a day. Your first name only.')}
            </Text>
          </View>
          <Text style={[styles.shareIcon, { fontSize: 20 }]}>+</Text>
        </Press>
      </View>

      {error ? (
        <FadeIn style={{ padding: S.lg }}>
          <View style={styles.problem}>
            <Text style={[T.bodyOn, { marginBottom: 4 }]}>{t('The feed is not ready')}</Text>
            <Text style={T.small}>{error}</Text>
          </View>
        </FadeIn>
      ) : null}

      {posts === null ? (
        <ActivityIndicator color={C.gold} style={{ marginTop: S.xxl }} />
      ) : posts.length === 0 && !error ? (
        <FadeIn style={styles.empty}>
          <Text style={styles.emptyBig}>{t('Nobody has posted yet')}</Text>
          <Text style={[T.small, { textAlign: 'center', marginTop: 6 }]}>
            {t('See how everyone is doing, and let them see you. Post first.')}
          </Text>
        </FadeIn>
      ) : (
        posts.map((p, i) => (
          <PostCard
            key={p.id} post={p} index={i} user={user}
            comments={counts[p.id] || 0}
            likes={likes[p.id] || 0}
            liked={mine.has(p.id)}
            onLike={() => toggleLike(p)}
            onOpen={() => { setOpen(p); setView('post'); }}
            onChanged={load}
          />
        ))
      )}

      {more ? (
        <Press onPress={loadMore} scaleTo={0.97} style={styles.moreBtn}>
          <Text style={[T.small, { color: C.gold }]}>{t('Load more')}</Text>
        </Press>
      ) : null}
    </ScrollView>
  );
}

/* ---------------------------------------------------------------
   One post in the list
   --------------------------------------------------------------- */
function PostCard({ post, index, user, comments, likes, liked, onLike, onOpen, onChanged }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  const sheet = useSheet();
  const { width } = useWindowDimensions();
  const mine = post.user_id === user.id;
  const side = Math.min(width, 620) - S.lg * 2;

  return (
    <FadeIn delay={Math.min(index, 6) * 26} from={8} style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>{firstNameOf(post.name).charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.who}>{firstNameOf(post.name)}</Text>
        <Text style={T.tiny}>{ago(post.created_at)}</Text>
        <Press
          onPress={() => menuFor({ sheet, post, mine, user, onChanged })}
          scaleTo={0.9}
          style={styles.dots}
        >
          <Text style={styles.dotsTxt}>{'···'}</Text>
        </Press>
      </View>

      <Press onPress={onOpen} scaleTo={0.995}>
        <Image
          source={{ uri: imageUrl(post.image_path) }}
          style={{ width: side, height: side, backgroundColor: C.raised }}
          resizeMode="cover"
        />
      </Press>

      <View style={styles.actions}>
        <Press onPress={onLike} scaleTo={0.86} style={styles.likeBtn}>
          <Text style={[styles.heart, liked && { color: C.ember }]}>
            {liked ? '♥' : '♡'}
          </Text>
          <Text style={[T.small, liked && { color: C.ember }]}>
            {likes === 0 ? t('Like')
              : likes === 1 ? t('1 person liked this')
                : likes + ' ' + t('people liked this')}
          </Text>
        </Press>

        <Press onPress={onOpen} scaleTo={0.94} style={{ paddingVertical: 6 }}>
          <Text style={[T.small, { color: C.gold }]}>
            {comments === 0 ? t('Add a comment')
              : comments + ' ' + t('comments')}
          </Text>
        </Press>
      </View>

      {post.caption ? (
        <Text style={styles.caption}>
          <Text style={styles.captionWho}>{firstNameOf(post.name)} </Text>
          {post.caption}
        </Text>
      ) : null}
    </FadeIn>
  );
}

/* The little menu behind the dots. Delete for your own, report and
   block for everyone else's — both stores insist on all three. */
async function menuFor({ sheet, post, mine, user, onChanged }) {
  const who = firstNameOf(post.name);

  if (mine) {
    const yes = await sheet.confirm({
      title: 'Delete this post?',
      message: 'It disappears for everyone, along with its comments.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!yes) return;
    const r = await deletePost(post);
    if (r.error) await sheet.tell({ title: 'Could not delete', message: r.error });
    else onChanged();
    return;
  }

  const pick = await sheet.choose({
    title: who + '\u2019s post',
    options: [
      { label: 'Report this post', value: 'report' },
      { label: 'Block ' + who, value: 'block', destructive: true },
    ],
  });

  if (pick === 'report') {
    await report({ reporterId: user.id, postId: post.id, reason: 'reported from feed' });
    await sheet.tell({ title: 'Reported', message: 'Thanks \u2014 we will take a look.' });
  } else if (pick === 'block') {
    const r = await blockUser({ blockerId: user.id, blockedId: post.user_id });
    if (r.error) await sheet.tell({ title: 'Could not block', message: r.error });
    else onChanged();
  }
}

/* ---------------------------------------------------------------
   Composing
   --------------------------------------------------------------- */
function Compose({ user, profile, alreadyPosted, onCancel, onDone }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  const { width } = useWindowDimensions();

  const [photo, setPhoto] = useState(null);
  const [name, setName] = useState(firstNameOf(profile && profile.full_name));
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const side = Math.min(width, 620) - S.lg * 2;

  async function choose(camera) {
    setErr('');
    try {
      const p = await pickPhoto({ camera });
      if (p) setPhoto(p);
    } catch (e) {
      setErr(e.message);
    }
  }

  async function post() {
    setBusy(true); setErr('');
    const r = await createPost({
      userId: user.id, name, blob: photo.blob, caption,
    });
    setBusy(false);
    if (r.error) setErr(r.error);
    else onDone();
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <View style={styles.composeHead}>
          <Press onPress={onCancel} hitSlop={12} scaleTo={0.94}>
            <Text style={[T.small, { color: C.gold }]}>{t('Cancel')}</Text>
          </Press>
          <Label style={{ color: C.text }}>{t('Today’s photo')}</Label>
        </View>

        <View style={{ padding: S.lg }}>
          {alreadyPosted ? (
            <View style={styles.oneADay}>
              <Text style={[T.h3, { marginBottom: 4 }]}>{t('Already posted today')}</Text>
              <Text style={T.small}>
                {t('One a day. It keeps the feed worth scrolling.')}
              </Text>
              <Btn label={t('Back to the feed')} dark color={C.dim} onPress={onCancel}
                style={{ marginTop: S.md }} />
            </View>
          ) : photo ? (
            <Press onPress={() => choose(false)} scaleTo={0.99}>
              <Image
                source={{ uri: photo.uri }}
                style={{ width: side, height: side, borderRadius: R.md, backgroundColor: C.raised }}
                resizeMode="cover"
              />
              <Text style={[T.tiny, { textAlign: 'center', marginTop: 8 }]}>
                {t('Tap to change')}
              </Text>
            </Press>
          ) : (
            <View>
              <Press onPress={() => choose(true)} scaleTo={0.98} style={styles.bigPick}>
                <Text style={styles.bigPickIcon}>{'◎'}</Text>
                <Text style={styles.bigPickTxt}>{t('Take a photo')}</Text>
              </Press>
              <Press onPress={() => choose(false)} scaleTo={0.98} style={styles.smallPick}>
                <Text style={[T.small, { color: C.gold }]}>{t('Pick one instead')}</Text>
              </Press>
              {!CAN_TAKE_PHOTOS ? (
                <Text style={[T.tiny, { marginTop: S.md, textAlign: 'center' }]}>
                  Photos need the web app for now.
                </Text>
              ) : null}
            </View>
          )}

          <Label style={{ marginTop: S.xl, marginBottom: 8 }}>{t('Your name')}</Label>
          <TextInput
            value={name} onChangeText={setName}
            placeholder="Aryan" placeholderTextColor={C.faint}
            autoCapitalize="words" autoCorrect={false} maxLength={24}
            style={styles.input}
          />
          <Text style={[T.tiny, { marginTop: 6 }]}>
            {t('All anyone sees. No username, no location.')}
          </Text>

          <Label style={{ marginTop: S.lg, marginBottom: 8 }}>{t('Caption')}</Label>
          <TextInput
            value={caption} onChangeText={setCaption}
            placeholder={t('Say something (optional)')}
            placeholderTextColor={C.faint}
            multiline maxLength={300}
            style={[styles.input, { minHeight: 84, textAlignVertical: 'top' }]}
          />

          {err ? <Text style={styles.err}>{err}</Text> : null}

          {alreadyPosted ? null : (
            <Btn
              label={t('Post today\u2019s photo')} color={C.gold} busy={busy}
              disabled={!photo || !name.trim()}
              onPress={post} style={{ marginTop: S.lg }}
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ---------------------------------------------------------------
   One post, with its comments
   --------------------------------------------------------------- */
function PostView({ post, user, profile, onBack }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  const { width } = useWindowDimensions();

  const sheet = useSheet();
  const [list, setList] = useState(null);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const scroller = useRef(null);

  const side = Math.min(width, 620) - S.lg * 2;
  const myName = firstNameOf(profile && profile.full_name);

  const load = useCallback(() => { loadComments(post.id).then(setList); }, [post.id]);
  useEffect(() => { load(); }, [load]);

  async function send() {
    setBusy(true);
    const r = await addComment({
      postId: post.id, userId: user.id, name: myName, body,
    });
    setBusy(false);
    if (r.error) { await sheet.tell({ title: 'Could not comment', message: r.error }); return; }
    setBody('');
    setList((list || []).concat(r.comment));
    setTimeout(() => scroller.current && scroller.current.scrollToEnd({ animated: true }), 60);
  }

  async function tapComment(c) {
    const who = firstNameOf(c.name);

    if (c.user_id === user.id) {
      const yes = await sheet.confirm({
        title: 'Delete your comment?',
        confirmLabel: 'Delete',
        destructive: true,
      });
      if (yes) { await deleteComment(c.id); load(); }
      return;
    }

    const pick = await sheet.choose({
      title: who + '\u2019s comment',
      options: [
        { label: 'Report this comment', value: 'report' },
        { label: 'Block ' + who, value: 'block', destructive: true },
      ],
    });

    if (pick === 'report') {
      await report({ reporterId: user.id, commentId: c.id, reason: 'reported from thread' });
      await sheet.tell({ title: 'Reported', message: 'Thanks \u2014 we will take a look.' });
    } else if (pick === 'block') {
      await blockUser({ blockerId: user.id, blockedId: c.user_id });
      load();
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.composeHead}>
        <Press onPress={onBack} hitSlop={12} scaleTo={0.94}>
          <Text style={[T.small, { color: C.gold }]}>{'←'} {t('Feed')}</Text>
        </Press>
        <Label style={{ color: C.text }}>{firstNameOf(post.name)}</Label>
      </View>

      <ScrollView
        ref={scroller}
        contentContainerStyle={{ padding: S.lg, paddingBottom: 30 }}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={{ uri: imageUrl(post.image_path) }}
          style={{ width: side, height: side, borderRadius: R.md, backgroundColor: C.raised }}
          resizeMode="cover"
        />

        {post.caption ? (
          <Text style={[styles.caption, { paddingHorizontal: 0, marginTop: S.md }]}>
            <Text style={styles.captionWho}>{firstNameOf(post.name)} </Text>
            {post.caption}
          </Text>
        ) : null}

        <View style={styles.rule} />

        {list === null ? (
          <ActivityIndicator color={C.gold} />
        ) : list.length === 0 ? (
          <Text style={T.small}>{t('No comments yet.')}</Text>
        ) : (
          list.map((c) => (
            <Press key={c.id} onPress={() => tapComment(c)} scaleTo={0.995} style={styles.comment}>
              <View style={[styles.avatar, { width: 30, height: 30, borderRadius: 15 }]}>
                <Text style={styles.avatarTxt}>{firstNameOf(c.name).charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.commentWho}>{firstNameOf(c.name)}</Text>
                  <Text style={[T.tiny, { marginLeft: 8 }]}>{ago(c.created_at)}</Text>
                </View>
                <Text style={[T.bodyOn, { marginTop: 1 }]}>{c.body}</Text>
              </View>
            </Press>
          ))
        )}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          value={body} onChangeText={setBody}
          placeholder={t('Comment as') + ' ' + myName}
          placeholderTextColor={C.faint}
          style={styles.commentInput}
          maxLength={400}
          onSubmitEditing={() => { if (body.trim() && !busy) send(); }}
          returnKeyType="send"
        />
        <Press
          onPress={send} scaleTo={0.92} disabled={!body.trim() || busy}
          style={[styles.send, (!body.trim() || busy) && { opacity: 0.35 }]}
        >
          <Text style={styles.sendTxt}>{t('Post')}</Text>
        </Press>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },

  top: { paddingHorizontal: S.lg, paddingTop: S.md },
  share: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: R.md, padding: S.md, borderWidth: 1.5, borderColor: C.line,
  },
  shareIcon: { fontSize: 17, color: C.gold, marginRight: 12 },
  shareTxt: { fontFamily: 'WorkSans_500Medium', fontSize: 15, color: C.text },

  problem: { backgroundColor: C.surface, borderRadius: R.md, padding: S.md,
    borderLeftWidth: 4, borderLeftColor: C.danger },

  empty: { alignItems: 'center', paddingTop: S.xxl, paddingHorizontal: S.xl },
  emptyBig: { fontFamily: 'Forum_400Regular', fontSize: 28, color: C.dim },

  card: { marginTop: S.lg },
  cardHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.lg, marginBottom: S.sm },
  avatar: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: C.raised,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.gold,
  },
  avatarTxt: { fontFamily: 'Forum_400Regular', fontSize: 16, color: C.gold },
  who: { flex: 1, fontFamily: 'WorkSans_500Medium', fontSize: 15, color: C.text, marginLeft: 10 },
  dots: { paddingHorizontal: 8, paddingVertical: 4, marginLeft: 4 },
  dotsTxt: { color: C.faint, fontSize: 15, letterSpacing: 1 },

  caption: { fontFamily: 'WorkSans_400Regular', fontSize: 14.5, lineHeight: 21,
    color: C.text, paddingHorizontal: S.lg, marginTop: S.sm },
  captionWho: { fontFamily: 'WorkSans_500Medium' },

  actions: {
    flexDirection: 'row', alignItems: 'center', gap: S.lg,
    paddingHorizontal: S.lg, paddingTop: S.sm,
  },
  likeBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  heart: { fontSize: 19, color: C.faint, marginRight: 7 },

  moreBtn: { alignSelf: 'center', marginTop: S.xl, paddingVertical: 12, paddingHorizontal: 26,
    borderRadius: R.pill, borderWidth: 1.5, borderColor: C.line },

  composeHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: S.lg, paddingVertical: S.md, backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.line,
  },
  oneADay: {
    backgroundColor: C.surface, borderRadius: R.md, padding: S.lg,
    borderLeftWidth: 4, borderLeftColor: C.gold,
  },
  bigPick: {
    alignItems: 'center', justifyContent: 'center', paddingVertical: S.xxl,
    borderRadius: R.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.line,
    backgroundColor: C.surface,
  },
  bigPickIcon: { fontSize: 34, color: C.gold, marginBottom: 10 },
  bigPickTxt: { fontFamily: 'WorkSans_500Medium', fontSize: 15, color: C.text },
  smallPick: { alignItems: 'center', paddingVertical: S.md },

  input: {
    backgroundColor: C.surface, borderRadius: R.md, paddingHorizontal: 16, paddingVertical: 14,
    fontFamily: 'WorkSans_400Regular', fontSize: 15.5, color: C.text,
    borderWidth: 1, borderColor: C.line,
  },
  err: { fontFamily: 'WorkSans_400Regular', fontSize: 13.5, color: C.danger, marginTop: S.md },

  rule: { height: 1, backgroundColor: C.line, marginVertical: S.lg },
  comment: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: S.md },
  commentWho: { fontFamily: 'WorkSans_500Medium', fontSize: 13.5, color: C.text },

  composer: {
    flexDirection: 'row', alignItems: 'center', padding: S.sm, paddingHorizontal: S.md,
    backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.line,
  },
  commentInput: {
    flex: 1, backgroundColor: C.raised, borderRadius: R.pill,
    paddingHorizontal: 16, paddingVertical: 11,
    fontFamily: 'WorkSans_400Regular', fontSize: 15, color: C.text,
  },
  send: { paddingHorizontal: 14, paddingVertical: 8, marginLeft: 6 },
  sendTxt: { fontFamily: 'WorkSans_500Medium', fontSize: 14, color: C.gold },
});
