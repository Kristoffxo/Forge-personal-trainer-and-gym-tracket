/* ---------------------------------------------------------------
   The Journey tab.

   A map you climb, a card at each place where you write down what
   you weighed when you got there, and a list for when you want the
   whole thing at a glance.

   The streak is gone from here entirely. Progress is the number of
   days you have trained in this app, ever. Three hundred and sixty
   of them reaches the summit whether that takes a year or three, and
   a fortnight off takes nothing away — which is the difference
   between a thing that rewards training and a thing that punishes
   living.
   --------------------------------------------------------------- */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, ActivityIndicator,
  useWindowDimensions, KeyboardAvoidingView, Platform, Image,
} from 'react-native';

import { S, R, useTheme } from '../theme';
import { Btn, Bar, Press, FadeIn, Label, useTabPad } from '../ui/kit';
import { useSheet } from '../ui/sheet';
import { useLang } from '../lang';
import { myJourney, journeyEntries, saveJourneyEntry } from '../challenge';
import { RANKS, LEAGUES, TERRAIN, terrainOf, TOP, journeyFrom } from '../journey';
import { PER_WORKOUT, PER_POST, PER_WIN } from '../score';
import { bmiFrom, bandOf, healthyRange, scalePos } from '../bmi';
import { JourneyMap, MAP_HEIGHT, LEAGUE_ICON, TERRAIN_PHOTO } from '../ui/journeyMap';
import { WorkoutCalendar } from '../ui/calendar';
import { LinearGradient } from 'expo-linear-gradient';
import { SwipeBack } from '../ui/swipeBack';

/* react-native-web hands every focused input the browser's own blue
   focus ring, which lands on top of the app's border and reads as a
   selection box rather than as a text field. */
const NO_RING = Platform.OS === 'web' ? { outlineStyle: 'none', outlineWidth: 0 } : null;

export default function Journey({ user, profile }) {
  const { C, T, mode } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  const sheet = useSheet();
  const tabPad = useTabPad();
  const { width } = useWindowDimensions();

  const [me, setMe] = useState(null);
  const [entries, setEntries] = useState({});
  const [open, setOpen] = useState(null);      // a milestone being read
  const [list, setList] = useState(false);
  /* Three things live in this tab and they want different screens:
     the number, the climb it drives, and the record of what you
     actually did. Score opens first — it is the one that changes
     every day and the one everything else is measured in. */
  const [page, setPage] = useState('score');
  const scroller = useRef(null);
  const viewH = useRef(0);
  const ready = useRef(false);
  const placed = useRef(false);

  /* Put the foot of the map on screen, once. */
  const place = useCallback(() => {
    if (placed.current || !ready.current || !viewH.current || !scroller.current) return;
    placed.current = true;
    scroller.current.scrollTo({
      y: Math.max(0, MAP_HEIGHT - viewH.current + 56), animated: false,
    });
  }, []);

  const load = useCallback(async () => {
    setMe(await myJourney(user.id));
    setEntries(await journeyEntries(user.id));
  }, [user.id]);
  useEffect(() => { load(); }, [load]);

  if (!me) return <View style={styles.boot}><ActivityIndicator color={C.violet} /></View>;

  const start = entries[0] || null;

  if (open) {
    return (
      <RankSheet
        milestone={open}
        days={me.days}
        entry={entries[open.n]}
        onBack={() => setOpen(null)}
        onSaved={() => { setOpen(null); load(); }}
        user={user}
        profile={profile}
      />
    );
  }

  /* The league colours are chosen to sit on a dark photograph — that
     is what the map is, whatever the theme says. Off the map they
     have to answer to the theme instead: Silver is #D5DDE8, which on
     a white card is a blank space where a number should be. */
  const tint = mode === 'light' ? C.ember : (me.rank ? me.rank.colour : C.ember);

  /* The map page is its own dark world whatever the theme is doing,
     so the switcher has to be told which ground it is standing on. */
  const switcher = (onDark) => (
    <View style={[styles.switcher,
      { backgroundColor: onDark ? 'rgba(255,255,255,0.10)' : C.surface }]}>
      {PAGES.map((pg) => {
        const on = page === pg.key;
        return (
          <Press key={pg.key} onPress={() => setPage(pg.key)} scaleTo={0.97}
            style={[styles.swTab, on && { backgroundColor: C.ember }]}>
            <Text style={[styles.swTxt,
              { color: onDark ? 'rgba(255,255,255,0.75)' : C.dim },
              on && { color: '#FFFFFF' }]}>
              {t(pg.label)}
            </Text>
          </Press>
        );
      })}
    </View>
  );

  if (page === 'score') {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        {switcher(false)}
        <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: tabPad }}>
          <ScoreCard me={me} C={C} T={T} t={t} styles={styles} colour={tint} />
        </ScrollView>
      </View>
    );
  }

  if (page === 'calendar') {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        {switcher(false)}
        <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: tabPad }}>
          <Text style={styles.calTitle}>{t('Your workouts')}</Text>
          <Text style={[T.small, { marginTop: 2 }]}>
            {t('Every day you have trained. Tap a filled day to see what you did.')}
          </Text>
          <WorkoutCalendar user={user} colour={tint} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#07070B' }}>
      {switcher(true)}
      {/* Opens with the foot of the map on screen — where the journey
          starts and where you are — and you climb from there. Not
          scrollToEnd: that goes past the map to the cards underneath
          it, and shows a map nobody has seen the start of. */}
      <ScrollView
        ref={scroller}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: tabPad }}
        /* Both of these have to have happened before the scroll can be
           worked out, and they do not fire in a fixed order — measuring
           the content first leaves the height at zero and sends the map
           right off the bottom. So either one triggers the attempt and
           `place` does nothing until it has both. */
        onLayout={(e) => { viewH.current = e.nativeEvent.layout.height; place(); }}
        onContentSizeChange={() => { ready.current = true; place(); }}
      >
        {/* the map, tallest at the bottom — you climb it */}
        <View style={{ width, height: MAP_HEIGHT }}>
          <JourneyMap width={width} days={me.days} onPick={setOpen} />

        </View>

        {/* Under the map. The starting point used to sit on top of it
            and covered whichever milestone happened to be behind it. */}
        <View style={{ padding: S.lg }}>
          <View style={styles.startCard}>
            <View style={styles.startHead}>
              <Text style={styles.startTitle}>{t('Start')}</Text>
              <Text style={T.tiny}>0 {t('RS')}</Text>
            </View>
            <Stat label={t('Weight')} value={start && start.weight_kg} unit="kg" C={C} T={T} />
            <Stat label={t('BMI')} value={start && start.bmi} unit="" C={C} T={T} />
            <Press
              onPress={() => setOpen({ n: 0, at: 0, name: 'Your Starting Point',
                league: 'bronze', colour: LEAGUES[0].colour, terrain: 'meadow' })}
              scaleTo={0.97}>
              <Text style={[styles.startLink, { color: C.ember }]}>
                {start ? t('Change it') : t('Set it')}
              </Text>
            </Press>
          </View>

          <BmiCard profile={profile} entries={entries} C={C} T={T} t={t} styles={styles} />

          <Press onPress={() => setList(true)} scaleTo={0.98} style={styles.rowBtn}>
            <Text style={[T.bodyOn, { flex: 1, fontSize: 15 }]}>{t('List view')}</Text>
            <Text style={{ color: C.dim }}>{'›'}</Text>
          </Press>
        </View>
      </ScrollView>

      {list ? <ListView days={me.days} entries={entries}
        onPick={(m) => { setList(false); setOpen(m); }} onBack={() => setList(false)} /> : null}
    </View>
  );
}

function Stat({ label, value, unit, C, T }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 7 }}>
      <Text style={[T.small, { flex: 1 }]}>{label}</Text>
      <Text style={{ fontFamily: 'WorkSans_600SemiBold', fontSize: 15, color: C.text }}>
        {value == null ? '—' : `${value}${unit ? ' ' + unit : ''}`}
      </Text>
    </View>
  );
}

/* ---------------------------------------------------------------
   One place, and what you weighed when you got there.
   --------------------------------------------------------------- */
function RankSheet({ milestone, days, entry, onBack, onSaved, user, profile }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  const sheet = useSheet();
  const tabPad = useTabPad();

  const reached = milestone.n === 0 || days >= milestone.at;
  const terrain = terrainOf(milestone) || { accent: C.ember, sky: ['#16161B', '#0B0B0E'] };
  const colour = milestone.colour || terrain.accent;

  const [weight, setWeight] = useState(entry && entry.weight_kg != null ? String(entry.weight_kg) : '');
  const [note, setNote] = useState((entry && entry.note) || '');
  const [busy, setBusy] = useState(false);

  /* BMI is not something to be asked for. The height is already on
     the profile and the weight is in the box above, so it is simply
     arithmetic — and typing it by hand is how it ends up wrong. */
  const cm = Number((profile && profile.height_cm) || 0);
  const bmiNum = bmiFrom(cm, weight);
  const bmi = bmiNum == null ? '' : bmiNum.toFixed(1);
  const band = bandOf(bmiNum);

  async function save() {
    setBusy(true);
    const r = await saveJourneyEntry(user.id, milestone.n, {
      dayCount: days, weight, bmi, muscle: '', note,
    });
    setBusy(false);
    if (r.error) { await sheet.tell({ title: t('Could not save'), message: r.error }); return; }
    onSaved();
  }

  return (
    <SwipeBack onBack={onBack}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingBottom: tabPad }} keyboardShouldPersistTaps="handled">

          {/* The photograph this rank sits on, rather than a flat
              green hill. The map behind a rank and the header above it
              should be the same country. */}
          <View style={{ height: 232, overflow: 'hidden' }}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: terrain.sky[0] }]} />
            {TERRAIN_PHOTO[milestone.terrain] ? (
              <Image source={TERRAIN_PHOTO[milestone.terrain]}
                style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : null}
            <LinearGradient
              colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0.28)', 'rgba(0,0,0,0.72)']}
              locations={[0, 0.45, 1]}
              style={StyleSheet.absoluteFill}
            />

            {/* mCentre is flex:1 and fills this whole box, and a later
                sibling paints over an earlier one — so with the header
                first, the back button sat underneath it and every tap
                landed on the medallion instead. Header last, and the
                middle passes touches through. */}
            <View style={styles.mCentre} pointerEvents="box-none">
              <View style={[styles.mMedal, {
                borderColor: colour,
                backgroundColor: reached ? colour : 'rgba(8,8,12,0.7)',
              }]}>
                {LEAGUE_ICON[milestone.league] ? (
                  <Image source={LEAGUE_ICON[milestone.league]}
                    style={{ width: 46, height: 46,
                             tintColor: reached ? '#0B0B0E' : colour,
                             opacity: reached ? 1 : 0.6 }}
                    resizeMode="contain" />
                ) : null}
              </View>
              {milestone.n ? (
                <View style={styles.mPlate}>
                  <Text style={[styles.mPlateTxt, { color: colour }]}>
                    {t('LEAGUE')} {milestone.n}
                  </Text>
                  <Text style={styles.mPlateDay}>{milestone.at} {t('RS')}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.mHead}>
              <Press onPress={onBack} hitSlop={16} scaleTo={0.94}>
                <Text style={[T.small, { color: '#fff' }]}>{'←'} {t('Map')}</Text>
              </Press>
            </View>
          </View>

          <View style={{ padding: S.lg }}>
            <Text style={styles.mPlace}>{t(milestone.name)}</Text>
            <Text style={[T.small, { marginTop: 2 }]}>
              {milestone.n === 0
                ? t('Where you began.')
                : reached
                  ? t('Reached.')
                  : `${milestone.at - days} ${t('points to go')}`}
            </Text>

            {reached ? (
              <>
                <Label style={{ marginTop: S.xl, marginBottom: S.sm }}>{t('Record')}</Label>
                <Field label={t('Weight')} unit="kg" value={weight} onChange={setWeight} C={C} T={T} />
                {/* the word, not only the number — 24.1 on its own is
                    not something anybody can act on */}
                <ReadOut label={t('BMI')} value={bmi} band={band}
                  hint={cm > 0 ? '' : t('Add your height in Challenges \u2192 Numbers')} C={C} T={T} />

                <Label style={{ marginTop: S.md, marginBottom: 6 }}>{t('Notes')}</Label>
                <TextInput
                  value={note} onChangeText={setNote}
                  placeholder={t('How are you feeling?')} placeholderTextColor={C.faint}
                      multiline maxLength={400} underlineColorAndroid="transparent"
                  style={[styles.noteBox, NO_RING]}
                />

                <Btn label={t('Save')} color={colour} busy={busy}
                  onPress={save} style={{ marginTop: S.lg }} />
              </>
            ) : (
              /* Nothing to fill in for a place you have not been to.
                 Writing down what you weighed at the summit before you
                 have climbed it is not a record of anything. */
              <View style={styles.locked}>
                <Text style={styles.lockedIcon}>{'\u25CB'}</Text>
                <Text style={[T.bodyOn, { fontSize: 15, marginTop: 6 }]}>{t('Locked')}</Text>
                <Text style={[T.small, { textAlign: 'center', marginTop: 4 }]}>
                  {`${milestone.at - days} ${milestone.at - days === 1 ? t('more point') : t('more points')} ${t('to open this')}`}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SwipeBack>
  );
}

function Field({ label, unit, value, onChange, C, T }) {
  const styles = makeStyles(C, T);
  return (
    <View style={styles.field}>
      <Text style={[T.bodyOn, { flex: 1, fontSize: 15 }]}>{label}</Text>
      <TextInput
        value={value} onChangeText={onChange}
        keyboardType="decimal-pad" placeholder="—" placeholderTextColor={C.faint}
        underlineColorAndroid="transparent"
        style={[styles.fieldInput, NO_RING]}
      />
      {unit ? <Text style={[T.tiny, { width: 22 }]}>{unit}</Text> : <View style={{ width: 22 }} />}
    </View>
  );
}

/* ---------------------------------------------------------------
   Where your weight has you, right now.

   The index on its own tells almost nobody anything: 26.4 is not a
   fact most people can act on. So the word comes first and large,
   the number is a footnote to it, and underneath is the one figure
   that is actually in the unit their scales are in — the weight
   range that would put them in the healthy band.

   The weight comes from the last place they recorded one at, which
   means the card fills itself in as they climb rather than asking
   them to type their weight a second time.
   --------------------------------------------------------------- */
function BmiCard({ profile, entries, C, T, t, styles }) {
  const cm = (profile && profile.height_cm) || null;

  /* the most recent milestone with a weight on it, then whatever is
     on the profile as a fallback */
  const latest = Object.values(entries || {})
    .filter((e) => e && e.weight_kg != null)
    .sort((a, b) => (b.milestone || 0) - (a.milestone || 0))[0];
  const kg = latest ? latest.weight_kg : ((profile && profile.weight_kg) || null);

  const bmi = cm && kg ? bmiFrom(cm, kg) : null;
  const band = bandOf(bmi);
  const range = cm ? healthyRange(cm) : null;
  const pos = scalePos(bmi);

  return (
    <FadeIn delay={30}>
      <View style={[styles.bmiCard, band && { borderColor: band.color }]}>
        <Label>{t('Where you are')}</Label>

        {band ? (
          <>
            <Text style={[styles.bmiBand, { color: band.color }]}>{t(band.label)}</Text>
            <Text style={[T.small, { marginTop: 2 }]}>
              {t('BMI')} {bmi.toFixed(1)} · {kg} kg
            </Text>

            <View style={styles.bmiScale}>
              <View style={{ flex: 4.5, backgroundColor: '#5C9BE8' }} />
              <View style={{ flex: 6.5, backgroundColor: '#8BC34A' }} />
              <View style={{ flex: 5, backgroundColor: '#F5A623' }} />
              <View style={{ flex: 10, backgroundColor: '#E4453A' }} />
            </View>
            <View style={{ marginLeft: (pos * 100) + '%' }}>
              <View style={styles.bmiMark} />
            </View>
            <View style={styles.bmiNums}>
              {['14', '18.5', '25', '30', '40'].map((n) => (
                <Text key={n} style={T.tiny}>{n}</Text>
              ))}
            </View>

            <Text style={[T.body, { marginTop: S.md }]}>{t(band.note)}</Text>
            {range ? (
              <Text style={[T.small, { marginTop: 6, color: C.text }]}>
                {t('Healthy for your height')}: {range.lo.toFixed(0)}–{range.hi.toFixed(0)} kg
              </Text>
            ) : null}
            <Text style={[T.tiny, { marginTop: S.sm }]}>
              {t('BMI cannot tell muscle from fat, so it reads high if you train. One number, not a verdict.')}
            </Text>
          </>
        ) : (
          <Text style={[T.small, { marginTop: 6 }]}>
            {cm
              ? t('Record a weight at any place you have reached and this fills itself in.')
              : t('Add your height in Challenges → Numbers and this fills itself in.')}
          </Text>
        )}
      </View>
    </FadeIn>
  );
}

/* A number the app worked out rather than one you type. */
function ReadOut({ label, value, band, hint, C, T }) {
  const styles = makeStyles(C, T);
  return (
    <View style={styles.field}>
      <Text style={[T.bodyOn, { flex: 1, fontSize: 15 }]}>{label}</Text>
      {band ? (
        <Text style={[styles.readOutBand, { color: band.color }]}>{band.label}</Text>
      ) : null}
      <Text style={[styles.readOut, { color: value ? C.text : C.faint }]}>
        {value || (hint ? '' : '\u2014')}
      </Text>
      {hint ? <Text style={[T.tiny, { maxWidth: 130, textAlign: 'right' }]}>{hint}</Text> : null}
      <View style={{ width: 22 }} />
    </View>
  );
}

/* ---------------------------------------------------------------
   The same thirteen places, as a list, grouped by level.
   --------------------------------------------------------------- */
function ListView({ days, entries, onPick, onBack }) {
  const { C, T, mode } = useTheme();
  const light = mode === 'light';
  const { t } = useLang();
  const styles = makeStyles(C, T);
  const tabPad = useTabPad();

  return (
    <SwipeBack onBack={onBack}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: C.bg }]}>
        <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: tabPad }}>
          <Press onPress={onBack} hitSlop={16} scaleTo={0.94} style={{ alignSelf: 'flex-start' }}>
            <Text style={[T.small, { color: C.ember }]}>{'\u2190'} {t('Map')}</Text>
          </Press>
          <Text style={styles.listTitle}>{t('Leagues')}</Text>
          <Text style={[T.small, { marginBottom: S.lg }]}>
            {t('Every 50 Reppo Score is a promotion.')}
          </Text>

          {/* One row per league. There used to be a heading and three
              numbered rows under it; with the tiers gone the heading
              and its single row said the same thing twice. */}
          {RANKS.map((r) => {
            const reached = days >= r.at;
            const e = entries[r.n];
            return (
              <Press key={r.n} onPress={() => onPick(r)} scaleTo={0.985} style={styles.listRow}>
                <View style={[styles.listMedal, {
                  borderColor: r.colour,
                  backgroundColor: reached ? r.colour : 'transparent',
                }]}>
                  <Image source={LEAGUE_ICON[r.league]}
                    style={{ width: 20, height: 20,
                             tintColor: reached ? '#0B0B0E' : r.colour }}
                    resizeMode="contain" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.listName, { color: reached ? C.text : C.dim }]}>
                    {t(r.name)}
                  </Text>
                  {e && e.weight_kg != null ? (
                    <Text style={T.tiny}>{e.weight_kg} kg</Text>
                  ) : null}
                </View>
                <Text style={T.tiny}>{r.at} {t('RS')}</Text>
                <Text style={{ color: C.faint, marginLeft: 8 }}>{'\u203A'}</Text>
              </Press>
            );
          })}

        </ScrollView>
      </View>
    </SwipeBack>
  );
}

const PAGES = [
  { key: 'score', label: 'Score' },
  { key: 'map', label: 'Journey' },
  { key: 'calendar', label: 'Calendar' },
];

/* ---------------------------------------------------------------
   The Reppo Score.

   The number, then where every point of it came from, then the rules
   — in that order, because the first question is "what is it" and
   the second is "how do I make it go up".

   The working is shown on purpose. A score you cannot account for is
   a score you cannot argue with, and the whole thing is arithmetic
   over three tables anybody can see in their own app.
   --------------------------------------------------------------- */
function ScoreCard({ me, C, T, t, styles, colour }) {
  const rows = [
    { label: t('Workouts'), n: me.workouts, each: PER_WORKOUT, got: me.fromWorkouts },
    { label: t('Photos on Discover'), n: me.posts, each: PER_POST, got: me.fromPosts },
    { label: t('Compete rounds won'), n: me.wins, each: PER_WIN, got: me.fromWins },
  ];

  return (
    <>
      <View style={[styles.scoreHero, { borderColor: colour }]}>
        <Text style={styles.scoreLabel}>{t('REPPO SCORE')}</Text>
        <Text style={[styles.scoreBig, { color: colour }]}>{me.score}</Text>
        <Text style={[styles.scoreRank, { color: colour }]}>
          {me.rank ? t(me.rank.name) : ''}
        </Text>
        {me.next ? (
          <Text style={[T.small, { marginTop: 4, textAlign: 'center' }]}>
            {me.toGo} {me.toGo === 1 ? t('point to') : t('points to')} {t(me.next.name)}
          </Text>
        ) : (
          <Text style={[T.small, { marginTop: 4, color: colour }]}>
            {t('The top of the ladder')}
          </Text>
        )}
        <Bar value={me.progress} max={1} color={colour} height={7}
          style={{ marginTop: S.md, alignSelf: 'stretch' }} />
      </View>

      <Label style={{ marginTop: S.xl }}>{t('Where it came from')}</Label>
      <View style={styles.scoreCard}>
        {rows.map((r, i) => (
          <View key={r.label} style={[styles.scoreRow, i > 0 && styles.scoreRowLine]}>
            <View style={{ flex: 1 }}>
              <Text style={[T.bodyOn, { fontSize: 15 }]}>{r.label}</Text>
              <Text style={T.tiny}>{r.n} × {r.each}</Text>
            </View>
            <Text style={[styles.scoreDelta, { color: r.got ? C.lime : C.faint }]}>
              +{r.got}
            </Text>
          </View>
        ))}
        <View style={[styles.scoreRow, styles.scoreRowLine]}>
          <View style={{ flex: 1 }}>
            <Text style={[T.bodyOn, { fontSize: 15 }]}>{t('Idle days')}</Text>
            <Text style={T.tiny}>
              {t('One rest day between workouts is free')}
            </Text>
          </View>
          <Text style={[styles.scoreDelta, { color: me.idle ? C.ember : C.faint }]}>
            {me.idle ? `−${me.idle}` : '0'}
          </Text>
        </View>
      </View>

      {me.floored ? (
        <Text style={[T.tiny, { marginTop: S.sm }]}>
          {t('A Reppo Score never goes below nought.')}
        </Text>
      ) : null}

      <Label style={{ marginTop: S.xl }}>{t('How it moves')}</Label>
      <View style={styles.scoreCard}>
        {[
          [`+${PER_WORKOUT}`, t('Finish a workout')],
          [`+${PER_POST}`, t('Post a photo to Discover')],
          [`+${PER_WIN}`, t('Win a round of Compete')],
          ['−1', t('Every idle day after the first')],
        ].map(([n, what], i) => (
          <View key={what} style={[styles.scoreRow, i > 0 && styles.scoreRowLine]}>
            <Text style={[styles.scoreRule, { color: n.startsWith('+') ? C.lime : C.ember }]}>
              {n}
            </Text>
            <Text style={[T.bodyOn, { fontSize: 15, flex: 1, marginLeft: 12 }]}>{what}</Text>
          </View>
        ))}
      </View>
      <Text style={[T.tiny, { marginTop: S.sm, marginBottom: S.lg }]}>
        {t('Every 50 points is a new league. Train every other day and you hold steady.')}
      </Text>
    </>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },

  /* Sits over the map as often as over the calendar, so it carries
     its own dark ground rather than borrowing the theme's. */
  switcher: {
    flexDirection: 'row', borderRadius: R.pill, padding: 4,
    marginHorizontal: S.lg, marginTop: S.md,
  },
  swTab: { flex: 1, paddingVertical: 10, borderRadius: R.pill, alignItems: 'center' },
  swTxt: { fontFamily: 'WorkSans_500Medium', fontSize: 12.5 },
  calTitle: { fontFamily: 'WorkSans_600SemiBold', fontSize: 22, color: C.text },

  scoreHero: {
    backgroundColor: C.surface, borderRadius: R.lg, padding: S.lg,
    borderWidth: 1.5, alignItems: 'center', marginTop: S.sm,
  },
  scoreLabel: {
    fontFamily: 'WorkSans_500Medium', fontSize: 10.5, letterSpacing: 2,
    color: C.faint,
  },
  scoreBig: { fontFamily: 'WorkSans_600SemiBold', fontSize: 68, lineHeight: 78 },
  scoreRank: { fontFamily: 'WorkSans_600SemiBold', fontSize: 19, marginTop: -4 },
  scoreCard: {
    backgroundColor: C.surface, borderRadius: R.lg,
    borderWidth: 1, borderColor: C.line, paddingHorizontal: S.md,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13 },
  scoreRowLine: { borderTopWidth: 1, borderTopColor: C.line },
  scoreDelta: { fontFamily: 'WorkSans_600SemiBold', fontSize: 17 },
  scoreRule: {
    fontFamily: 'WorkSans_600SemiBold', fontSize: 16, width: 34,
  },

  startCard: {
    backgroundColor: C.surface, borderRadius: R.md, padding: S.md,
    borderWidth: 1, borderColor: C.line, marginBottom: S.md,
  },
  startHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  startTitle: { fontFamily: 'WorkSans_600SemiBold', fontSize: 13.5, color: C.text, flex: 1 },
  startLink: { fontFamily: 'WorkSans_500Medium', fontSize: 13, marginTop: 10 },

  mapTop: { position: 'absolute', right: S.md, bottom: S.md, alignItems: 'flex-end' },
  pill: {
    backgroundColor: 'rgba(8,8,12,0.84)', borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
  },
  pillTxt: { fontFamily: 'WorkSans_600SemiBold', fontSize: 13, color: '#fff' },

  next: { backgroundColor: C.surface, borderRadius: R.md, padding: S.md, borderWidth: 1.5 },
  nextName: { fontFamily: 'WorkSans_600SemiBold', fontSize: 22, color: C.text, marginTop: 4 },
  nextGo: { fontFamily: 'WorkSans_600SemiBold', fontSize: 15, marginTop: 10 },

  rowBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: R.md, padding: S.md, marginTop: S.sm,
  },

  /* one place */
  hill: {
    position: 'absolute', left: -80, right: -80, bottom: -140,
    height: 260, borderRadius: 400,
  },
  mHead: { position: 'absolute', left: S.lg, top: S.md },
  mapCorner: { position: 'absolute', right: S.lg, bottom: 18 },
  daysCard: {
    backgroundColor: 'rgba(9,10,16,0.86)', borderRadius: R.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center',
  },
  daysBig: { fontFamily: 'WorkSans_600SemiBold', fontSize: 19, color: '#fff', letterSpacing: 0.4 },
  daysSub: { fontFamily: 'WorkSans_400Regular', fontSize: 9.5, letterSpacing: 1.6,
             color: 'rgba(233,238,246,0.6)', marginTop: 1 },
  dashRow: { flexDirection: 'row', gap: 4, marginTop: 7 },
  dash: { width: 13, height: 3, borderRadius: 2 },

  explain: {
    backgroundColor: C.surface, borderRadius: R.lg, padding: S.lg,
    borderWidth: 1, borderColor: C.line, marginTop: S.md,
  },
  explainTitle: { fontFamily: 'WorkSans_600SemiBold', fontSize: 16, color: C.text, marginBottom: S.sm },
  explainRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 },
  explainDot: { width: 5, height: 5, borderRadius: 3, marginTop: 7, marginRight: 10 },

  lgHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: S.sm },
  lgName: { fontFamily: 'WorkSans_600SemiBold', fontSize: 13, letterSpacing: 1.4 },

  bmiCard: {
    backgroundColor: C.surface, borderRadius: R.lg, padding: S.lg,
    borderWidth: 1.5, borderColor: C.line, marginTop: S.md,
  },
  bmiBand: { fontFamily: 'WorkSans_600SemiBold', fontSize: 30, lineHeight: 34, marginTop: 4 },
  bmiScale: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginTop: S.lg },
  bmiMark: { width: 2, height: 12, backgroundColor: C.text, marginTop: 2 },
  bmiNums: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  readOutBand: { fontFamily: 'WorkSans_600SemiBold', fontSize: 12.5, letterSpacing: 0.3, marginRight: 10 },
  readOut: { fontFamily: 'WorkSans_600SemiBold', fontSize: 15, textAlign: 'right', minWidth: 54 },
  locked: {
    marginTop: S.xl, alignItems: 'center', backgroundColor: C.surface,
    borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: S.lg,
  },
  lockedIcon: { fontSize: 26, color: C.faint },
  mCentre: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 18 },
  mMedal: {
    width: 78, height: 78, borderRadius: 39, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  mPlate: {
    marginTop: 10, backgroundColor: 'rgba(8,8,12,0.82)', borderRadius: 9,
    paddingHorizontal: 12, paddingVertical: 7, alignItems: 'center',
  },
  mPlateTxt: { fontFamily: 'WorkSans_600SemiBold', fontSize: 11, letterSpacing: 0.6 },
  mPlateDay: { fontFamily: 'WorkSans_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  mPlace: { fontFamily: 'WorkSans_600SemiBold', fontSize: 28, lineHeight: 33, color: C.text },

  field: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: R.md, paddingHorizontal: S.md, paddingVertical: 4, marginBottom: 9,
  },
  fieldInput: {
    width: 86, textAlign: 'right', paddingVertical: 12,
    fontFamily: 'WorkSans_600SemiBold', fontSize: 17, color: C.text,
  },
  noteBox: {
    backgroundColor: C.surface, borderRadius: R.md, padding: S.md, minHeight: 74,
    fontFamily: 'WorkSans_400Regular', fontSize: 15, color: C.text, textAlignVertical: 'top',
  },

  /* the list */
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: C.bg },
  listHead: {
    paddingHorizontal: S.lg, paddingTop: S.md, paddingBottom: S.md,
    backgroundColor: C.surface,
  },
  listTitle: { fontFamily: 'WorkSans_600SemiBold', fontSize: 27, color: C.text, marginTop: 6 },
  listRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: R.md, padding: S.sm, marginBottom: 8,
  },
  listMedal: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  listNum: { fontFamily: 'WorkSans_600SemiBold', fontSize: 16 },
  listName: { fontFamily: 'WorkSans_500Medium', fontSize: 14 },
});
