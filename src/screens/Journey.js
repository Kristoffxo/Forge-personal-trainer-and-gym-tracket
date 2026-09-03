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
import { Btn, Press, FadeIn, Label, useTabPad } from '../ui/kit';
import { useSheet } from '../ui/sheet';
import { useLang } from '../lang';
import { myJourney, journeyEntries, saveJourneyEntry } from '../challenge';
import { MILESTONES, MEDAL_COLOUR, terrainOf, TOP } from '../journey';
import { bmiFrom, bandOf, healthyRange, scalePos } from '../bmi';
import { JourneyMap, MAP_HEIGHT, PLACE_ICON } from '../ui/journeyMap';

/* react-native-web hands every focused input the browser's own blue
   focus ring, which lands on top of the app's border and reads as a
   selection box rather than as a text field. */
const NO_RING = Platform.OS === 'web' ? { outlineStyle: 'none', outlineWidth: 0 } : null;

export default function Journey({ user, profile }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  const sheet = useSheet();
  const tabPad = useTabPad();
  const { width } = useWindowDimensions();

  const [me, setMe] = useState(null);
  const [entries, setEntries] = useState({});
  const [open, setOpen] = useState(null);      // a milestone being read
  const [list, setList] = useState(false);
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
      <Milestone
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

  return (
    <View style={{ flex: 1, backgroundColor: '#07070B' }}>
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

          {/* bottom right of the map, over the landscape */}
          <View style={styles.mapCorner}>
            <View style={styles.daysCard}>
              <Text style={styles.daysBig}>
                {me.days} {me.days === 1 ? t('DAY') : t('DAYS')}
              </Text>
              <Text style={styles.daysSub}>{t('TRAINED')}</Text>
              <View style={styles.dashRow}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <View key={i} style={[styles.dash, {
                    backgroundColor: i / 5 < me.progress ? MEDAL_COLOUR[(me.next || MILESTONES[12]).grade]
                      : 'rgba(255,255,255,0.18)',
                  }]} />
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Under the map. The starting point used to sit on top of it
            and covered whichever milestone happened to be behind it. */}
        <View style={{ padding: S.lg }}>
          <View style={styles.startCard}>
            <View style={styles.startHead}>
              <Text style={styles.startTitle}>{t('Start')}</Text>
              <Text style={T.tiny}>{t('Day')} 0</Text>
            </View>
            <Stat label={t('Weight')} value={start && start.weight_kg} unit="kg" C={C} T={T} />
            <Stat label={t('BMI')} value={start && start.bmi} unit="" C={C} T={T} />
            <Press
              onPress={() => setOpen({ n: 0, at: 0, place: 'Your Starting Point',
                terrain: 'meadow' })}
              scaleTo={0.97}>
              <Text style={[styles.startLink, { color: C.ember }]}>
                {start ? t('Change it') : t('Set it')}
              </Text>
            </Press>
          </View>

          <BmiCard profile={profile} entries={entries} C={C} T={T} t={t} styles={styles} />

          {/* Plainly, once, near the top. Somebody opening a map of
              thirteen glowing symbols deserves a sentence telling
              them what any of it is for. */}
          <FadeIn delay={45}>
            <View style={styles.explain}>
              <Text style={styles.explainTitle}>{t('How the levels work')}</Text>
              {[
                t('Every day you train moves you one day up the mountain.'),
                t('The numbers on the map are training days, not dates. Rest days take nothing away.'),
                t('Reach a place and it lights up, and you can record your weight there.'),
                t('360 training days reaches the summit. Keep going.'),
              ].map((line, i) => (
                <View key={i} style={styles.explainRow}>
                  <View style={[styles.explainDot, { backgroundColor: C.ember }]} />
                  <Text style={[T.small, { flex: 1, color: C.text }]}>{line}</Text>
                </View>
              ))}
            </View>
          </FadeIn>

          {me.next ? (
            <FadeIn>
              <View style={[styles.next, { borderColor: MEDAL_COLOUR[me.next.grade] }]}>
                <Label style={{ color: MEDAL_COLOUR[me.next.grade] }}>{t('Next')}</Label>
                <Text style={styles.nextName}>{t(me.next.place)}</Text>
                <Text style={[styles.nextGo, { color: MEDAL_COLOUR[me.next.grade] }]}>
                  {me.toGo === 1 ? t('1 day to go') : `${me.toGo} ${t('days to go')}`}
                </Text>
              </View>
            </FadeIn>
          ) : (
            <View style={[styles.next, { borderColor: C.lime }]}>
              <Text style={styles.nextName}>{t('Summit reached')}</Text>
            </View>
          )}

          <Press onPress={() => setList(true)} scaleTo={0.98} style={styles.rowBtn}>
            <Text style={[T.bodyOn, { flex: 1, fontSize: 15 }]}>{t('List view')}</Text>
            <Text style={{ color: C.dim }}>{'›'}</Text>
          </Press>
          <Press
            onPress={() => sheet.tell({
              title: t('How it works'),
              message: t('Every day you train counts. Rest days take nothing away. 360 training days reaches the summit, however long that takes.'),
            })}
            scaleTo={0.98} style={styles.rowBtn}>
            <Text style={[T.bodyOn, { flex: 1, fontSize: 15 }]}>{t('How it works')}</Text>
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
function Milestone({ milestone, days, entry, onBack, onSaved, user, profile }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  const sheet = useSheet();
  const tabPad = useTabPad();

  const reached = milestone.n === 0 || days >= milestone.at;
  const terrain = terrainOf(milestone) || { accent: C.ember, sky: ['#16161B', '#0B0B0E'] };
  const colour = milestone.grade ? MEDAL_COLOUR[milestone.grade] : terrain.accent;

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
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingBottom: tabPad }} keyboardShouldPersistTaps="handled">

        <View style={{ height: 232 }}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: terrain.sky[0] }]} />
          <View style={[styles.hill, { backgroundColor: terrain.ground ? terrain.ground[0] : '#1A2712' }]} />

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
              {PLACE_ICON[milestone.n] ? (
                <Image source={PLACE_ICON[milestone.n]}
                  style={{ width: 46, height: 46,
                           tintColor: reached ? '#0B0B0E' : colour,
                           opacity: reached ? 1 : 0.6 }}
                  resizeMode="contain" />
              ) : null}
            </View>
            {milestone.grade ? (
              <View style={styles.mPlate}>
                <Text style={[styles.mPlateTxt, { color: colour }]}>
                  {t(milestone.grade.toUpperCase())}
                </Text>
                <Text style={styles.mPlateDay}>{t('Day')} {milestone.at}</Text>
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
          <Text style={styles.mPlace}>{t(milestone.place)}</Text>
          <Text style={[T.small, { marginTop: 2 }]}>
            {milestone.n === 0
              ? t('Where you began.')
              : reached
                ? t('Reached.')
                : `${milestone.at - days} ${t('days to go')}`}
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
                {`${t('Train')} ${milestone.at - days} ${milestone.at - days === 1 ? t('more day') : t('more days')} ${t('to open this')}`}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  const tabPad = useTabPad();

  const levels = [1, 2, 3, 4];
  const endOf = { 1: 5, 2: 8, 3: 12, 4: 13 };
  const startOf = { 1: 1, 2: 6, 3: 9, 4: 13 };

  return (
    <View style={styles.overlay}>
      <View style={styles.listHead}>
        <Press onPress={onBack} hitSlop={12} scaleTo={0.94}>
          <Text style={[T.small, { color: C.ember }]}>{'←'} {t('Map')}</Text>
        </Press>
        <Text style={styles.listTitle}>{t('Journey')}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: tabPad }}>
        {levels.map((lv) => {
          const rows = MILESTONES.filter((m) => m.n >= startOf[lv] && m.n <= endOf[lv]);
          if (!rows.length) return null;
          return (
            <View key={lv} style={{ marginBottom: S.lg }}>
              <Label style={{ marginBottom: S.sm }}>{t('Level')} {lv}</Label>
              {rows.map((m) => {
                const reached = days >= m.at;
                const e = entries[m.n];
                return (
                  <Press key={m.n} onPress={() => onPick(m)} scaleTo={0.985} style={styles.listRow}>
                    <View style={[styles.listMedal, {
                      borderColor: MEDAL_COLOUR[m.grade],
                      backgroundColor: reached ? MEDAL_COLOUR[m.grade] : 'transparent',
                    }]}>
                      <Text style={[styles.listNum, { color: reached ? '#0B0B0E' : MEDAL_COLOUR[m.grade] }]}>
                        {m.n}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.listName, { color: reached ? C.text : C.dim }]}>
                        {t(m.place)}
                      </Text>
                      {e && e.weight_kg != null ? (
                        <Text style={T.tiny}>{e.weight_kg} kg</Text>
                      ) : null}
                    </View>
                    <Text style={T.tiny}>{t('Day')} {m.at}</Text>
                    <Text style={{ color: C.faint, marginLeft: 8 }}>{'›'}</Text>
                  </Press>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },

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
