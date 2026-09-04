/* ---------------------------------------------------------------
   Doing a workout.

   Shared by all three ways in — the 7-day planner, a gym session
   and a home session — because once you have started, they are the
   same thing: a list of moves, tap one, tick it off, finish.

   Finishing writes today into `workout_days`, which is the single
   row every challenge counts. It does not matter where the workout
   came from.
   --------------------------------------------------------------- */
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TextInput,
         Platform, KeyboardAvoidingView, useWindowDimensions } from 'react-native';

import { S, R, useTheme } from '../theme';
import { Btn, Press, FadeIn, Bar, Label, useTabPad } from '../ui/kit';
import { useSheet } from '../ui/sheet';
import Player from './Player';
import { useLang } from '../lang';
import { markWorkout } from '../challenge';
import { framesFor } from '../exercisePhotos';
import { photoForMuscle } from '../photos';
import { pickPhoto, CAN_TAKE_PHOTOS } from '../photo';
import { createPost, postedToday, firstNameOf } from '../social';
import Exercise from './Exercise';
import { setsReps } from '../duration';

export default function Session({ title, exercises, user, profile, kind, name,
                                  autoStart, onExit }) {
  const { C, T, MUSCLE_C } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  const tabPad = useTabPad();
  const sheet = useSheet();

  const [done, setDone] = useState({});
  const [openIdx, setOpenIdx] = useState(null);
  const [finished, setFinished] = useState(false);
  /* Every screen that opens a Session has already shown the list of
     moves and a Start button, so showing a second list with a second
     Start was a step that existed only because two screens were
     written at different times. Start means start. The list below is
     still reachable by stopping the player. */
  const [playing, setPlaying] = useState(!!autoStart);

  const total = exercises.length;
  const ticked = Object.keys(done).filter((k) => done[k]).length;
  const allDone = ticked === total && total > 0;
  const nextIdx = exercises.findIndex((_, i) => !done[i]);

  if (finished) {
    return (
      <Finished title={title} count={ticked} user={user} profile={profile}
        onExit={() => onExit(true)} />
    );
  }

  /* The player. Runs the whole session on its own — a countdown in,
     one move at a time, a rest between each. */
  if (playing) {
    return (
      <Player
        title={title}
        exercises={exercises}
        onQuit={(reached) => {
          /* everything before where they stopped counts as done */
          const upTo = {};
          for (let k = 0; k < reached; k++) upTo[k] = true;
          setDone(upTo);
          setPlaying(false);
        }}
        onFinish={async () => {
          const all = {};
          exercises.forEach((_, k) => { all[k] = true; });
          setDone(all);
          setPlaying(false);
          await markWorkout(user.id, kind, name || title);
          setFinished(true);
        }}
      />
    );
  }

  /* one move, full screen — reached by tapping a row to read it */
  if (openIdx !== null && exercises[openIdx]) {
    return (
      <Exercise
        exercise={exercises[openIdx]}
        index={openIdx}
        total={total}
        list={exercises}
        onGo={setOpenIdx}
        onBack={() => setOpenIdx(null)}
        onStart={() => { setOpenIdx(null); setPlaying(true); }}
        onDone={() => setOpenIdx(null)}
      />
    );
  }

  async function finish() {
    if (ticked < total) {
      const stop = await sheet.confirm({
        title: t('Finish early?'),
        message: `${total - ticked} ${t('moves still to go.')}`,
        confirmLabel: t('Finish anyway'),
      });
      if (!stop) return;
    }
    // anything ticked counts as having trained today
    if (ticked > 0) {
      await markWorkout(user.id, kind, name || title);
      setFinished(true);      // ask for the photo before letting go
      return;
    }
    onExit(false);
  }

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: tabPad }}>
      <View style={styles.top}>
        <Press onPress={() => onExit(false)} hitSlop={12} scaleTo={0.94}
          style={{ alignSelf: 'flex-start' }}>
          <Text style={[T.small, { color: C.ember }]}>{'←'} {t('Back')}</Text>
        </Press>
        <Text style={styles.big}>{t(title)}</Text>
        <Text style={[T.small, { marginTop: 2 }]}>
          {ticked} {t('of')} {total} {t('done')}
        </Text>
        <Bar value={ticked} max={total} color={allDone ? C.lime : C.ember}
          height={7} style={{ marginTop: S.md }} />
      </View>

      {/* The button goes above the list, not under it. Everything
          below is for reading before you begin, and a start button
          at the bottom of seven exercises means scrolling past the
          whole workout to begin it. */}
      <View style={{ paddingHorizontal: S.lg, marginTop: S.lg }}>
        <Btn
          label={t('Start workout')}
          color={C.ember}
          onPress={() => setPlaying(true)}
        />
        <Text style={[T.tiny, { textAlign: 'center', marginTop: 10, marginBottom: S.sm }]}>
          {t('Tap a move to see how it is done')}
        </Text>

        {exercises.map((x, i) => {
          const on = !!done[i];
          const isNext = i === nextIdx;
          return (
            <FadeIn key={x.n + i} delay={i * 12} from={6}>
              <Press
                scaleTo={0.985}
                onPress={() => setOpenIdx(i)}
                style={[
                  styles.exRow,
                  on && { opacity: 0.5, borderColor: C.lime, borderWidth: 1.5 },
                  isNext && { borderColor: MUSCLE_C[x.m], borderWidth: 1.5 },
                ]}
              >
                <View style={[styles.check,
                  { backgroundColor: on ? C.lime : 'transparent',
                    borderColor: on ? C.lime : MUSCLE_C[x.m] }]}>
                  {on ? <Text style={styles.checkMark}>{'✓'}</Text>
                    : <Text style={[styles.num, { color: MUSCLE_C[x.m] }]}>{i + 1}</Text>}
                </View>
                <Image source={(framesFor(x) || [photoForMuscle(x.m)])[0]} style={styles.thumb} />

                <View style={{ flex: 1, marginHorizontal: 12 }}>
                  <Text style={[styles.exName, on && { textDecorationLine: 'line-through' }]}>
                    {x.n}
                  </Text>
                  <Text style={T.tiny}>{x.m} · {x.e} · {setsReps(x.s).line}</Text>
                </View>

                <Text style={[styles.chev, isNext && { color: MUSCLE_C[x.m] }]}>
                  {on ? '' : '›'}
                </Text>
              </Press>
            </FadeIn>
          );
        })}

        <Press onPress={finish} scaleTo={0.98} style={{ paddingVertical: 14, marginTop: S.md }}>
          <Text style={[T.small, { textAlign: 'center', color: C.dim }]}>
            {allDone ? t('Finish — well done') : t('Finish without training')}
          </Text>
        </Press>
      </View>
    </ScrollView>
  );
}

/* ---------------------------------------------------------------
   Done.

   The moment right after a workout is the only moment anybody
   actually wants to post — so that is where the feed asks. One tap
   to the camera, one to publish, and "Not now" is the same size as
   the other button.
   --------------------------------------------------------------- */
function Finished({ title, count, user, profile, onExit }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  const sheet = useSheet();
  const { width } = useWindowDimensions();

  const [photo, setPhoto] = useState(null);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [already, setAlready] = useState(null);

  const side = Math.min(width, 620) - S.lg * 2;
  const who = firstNameOf(profile && profile.full_name);

  React.useEffect(() => { postedToday(user.id).then(setAlready); }, [user.id]);

  async function choose() {
    try {
      const p = await pickPhoto({ camera: true });
      if (p) setPhoto(p);
    } catch (e) {
      await sheet.tell({ title: t('Cannot open the camera'), message: e.message });
    }
  }

  async function share() {
    setBusy(true);
    const r = await createPost({ userId: user.id, name: who, blob: photo.blob, caption });
    setBusy(false);
    if (r.error) { await sheet.tell({ title: t('Could not post'), message: r.error }); return; }
    onExit();
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled">
        <FadeIn>
          <Text style={styles.bigDone}>{t('Workout done')}</Text>
          <Text style={[T.small, { marginTop: 4 }]}>
            {t(title)} · {count} {count === 1 ? t('exercise') : t('exercises')}
          </Text>
        </FadeIn>

        {already === false ? (
          <FadeIn delay={60} style={{ marginTop: S.xl }}>
            {photo ? (
              <>
                <Press onPress={choose} scaleTo={0.99}>
                  <Image source={{ uri: photo.uri }}
                    style={{
                      width: side,
                      height: Math.round(side / Math.min(1.25, Math.max(0.62, photo.width / photo.height))),
                      borderRadius: R.md, backgroundColor: C.raised,
                    }}
                    resizeMode="cover" />
                </Press>
                <Label style={{ marginTop: S.lg, marginBottom: 8 }}>{t('Caption')}</Label>
                <TextInput
                  value={caption} onChangeText={setCaption}
                  placeholder={t('Say something (optional)')}
                  placeholderTextColor={C.faint}
                  multiline maxLength={300}
                  style={styles.input}
                />
                <Btn label={t('Post to Discover')} color={C.gold} busy={busy}
                  onPress={share} style={{ marginTop: S.lg }} />
              </>
            ) : (
              <Press onPress={choose} scaleTo={0.98} style={styles.invite}>
                <Text style={styles.inviteIcon}>{'◎'}</Text>
                <Text style={styles.inviteTitle}>{t('Upload a picture')}</Text>
                <Text style={[T.small, { textAlign: 'center', marginTop: 4 }]}>
                  {t('Put it on Discover so everyone can see you turned up.')}
                </Text>
                {!CAN_TAKE_PHOTOS ? (
                  <Text style={[T.tiny, { marginTop: 8 }]}>
                    {t('Photos need the web app for now.')}
                  </Text>
                ) : null}
              </Press>
            )}
          </FadeIn>
        ) : already === true ? (
          <FadeIn delay={60} style={{ marginTop: S.xl }}>
            <Text style={T.small}>{t('You have already posted today. One a day.')}</Text>
          </FadeIn>
        ) : null}

        <Btn label={photo ? t('Skip') : t('Not now')} dark color={C.dim}
          onPress={onExit} style={{ marginTop: S.lg }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  bigDone: { fontFamily: 'WorkSans_600SemiBold', fontSize: 34, letterSpacing: -0.7, color: C.text },
  invite: {
    alignItems: 'center', paddingVertical: S.xxl, paddingHorizontal: S.lg,
    borderRadius: R.lg, borderWidth: 1.5, borderStyle: 'dashed',
    borderColor: C.gold, backgroundColor: 'rgba(201,154,62,0.07)',
  },
  inviteIcon: { fontSize: 34, color: C.gold, marginBottom: 10 },
  inviteTitle: { fontFamily: 'WorkSans_600SemiBold', fontSize: 19, color: C.text },
  input: {
    backgroundColor: C.surface, borderRadius: R.md, paddingHorizontal: 16, paddingVertical: 14,
    fontFamily: 'WorkSans_400Regular', fontSize: 15.5, color: C.text,
    borderWidth: 1, borderColor: C.line, minHeight: 84, textAlignVertical: 'top',
  },
  top: { paddingHorizontal: S.lg, paddingTop: S.md, paddingBottom: S.lg, backgroundColor: C.surface },
  big: { fontFamily: 'WorkSans_600SemiBold', fontSize: 36, color: C.text, marginTop: 6 },
  exRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: R.md, padding: 12, marginBottom: 9,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  check: {
    width: 30, height: 30, borderRadius: 15, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  checkMark: { color: C.onAccent, fontSize: 15, fontFamily: 'WorkSans_500Medium' },
  num: { fontFamily: 'WorkSans_500Medium', fontSize: 13 },
  exName: { fontFamily: 'WorkSans_500Medium', fontSize: 15, color: C.text },
  thumb: { width: 44, height: 44, borderRadius: R.sm, marginLeft: 10, backgroundColor: C.raised },
  chev: { fontSize: 22, color: C.faint, paddingHorizontal: 4 },
});
