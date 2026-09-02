import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, Easing,
         useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { WorkSans_400Regular, WorkSans_500Medium, WorkSans_600SemiBold,
         WorkSans_700Bold } from '@expo-google-fonts/work-sans';

import { useTheme, ThemeProvider, SIDE_BLUE, SIDE_PINK } from './src/theme';
import { SideProvider, useSide, MEN, WOMEN, SENIORS } from './src/side';
import { LangProvider, useLang } from './src/lang';
import { Press } from './src/ui/kit';
import { SheetProvider, useSheet } from './src/ui/sheet';
import { Mark } from './src/ui/logo';
import { TabIcon } from './src/ui/tabIcons';
import { getSession, onAuthChange, getProfile } from './src/auth';
import { useWebChrome } from './src/webChrome';
import * as push from './src/push';

import Auth     from './src/screens/Auth';
import Food     from './src/screens/Food';
import AddFood  from './src/screens/AddFood';
import Train    from './src/screens/Train';
import Discover from './src/screens/Feed';
import ChallengesTab from './src/screens/ChallengesTab';
import Settings from './src/screens/Settings';
import Trainer  from './src/screens/Trainer';
import Onboarding from './src/screens/Onboarding';

/* Four tabs, in the order they are used. Train is first because it
   is what most days open the app for; You holds the things you set
   once and check weekly. */
const TABS = [
  { key:'train', label:'Train', icon:'▲', colorKey:'ember',
    title:'Train',           sub:'Today’s workout' },
  { key:'food',  label:'Food',  icon:'◍', colorKey:'amber',
    title:'Food',            sub:'What you ate today' },
  { key:'feed',  label:'Discover', icon:'◈', colorKey:'gold',
    title:'Discover',        sub:'How everyone is doing' },
  { key:'you',   label:'Challenges', icon:'✦', colorKey:'violet',
    title:'Challenges',      sub:'Race, medals, numbers' },
  { key:'trainer', label:'Trainer', icon:'✆', colorKey:'teal',
    title:'Trainer',         sub:'Ask a real trainer' },
];

/* Spell every edge out. react-native-safe-area-context's web SafeAreaView falls
   back to 'additive' for any edge missing from an array, so edges={['top']} also
   pads the bottom in a browser and the tab bar floats above the home indicator.
   The native one treats a missing edge as 'off'. These records behave the same
   on both. */
const EDGES_TOP = { top:'additive', bottom:'off', left:'off', right:'off' };

export default function App() {
  return (
    <SideProvider>
      <ThemeProvider>
        <LangProvider>
          <SafeAreaProvider>
            <SheetProvider>
              <Root />
            </SheetProvider>
          </SafeAreaProvider>
        </LangProvider>
      </ThemeProvider>
    </SideProvider>
  );
}

function Root() {
  const { C, T, mode } = useTheme();
  const { t: tr } = useLang();
  const { seedFrom } = useSide();
  const sheet = useSheet();
  const styles = makeStyles(C, T);
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ WorkSans_600SemiBold, WorkSans_400Regular, WorkSans_500Medium });
  const [session, setSession] = useState(undefined);   // undefined = still checking
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState('train');
  const [adding, setAdding] = useState(null);      // meal name, for the food search
  const [refreshKey, setRefreshKey] = useState(0);
  /* The row that was just written, handed straight to the diary so it
     appears the instant it is saved. Waiting for a second round trip
     to fetch back what we had just sent was most of why adding food
     felt like it had not worked. */
  const [justAdded, setJustAdded] = useState(null);
  /* Settings is a place you go, not a tab you flip to. It opens over
     everything from the three dots beside the mark. */
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { width } = useWindowDimensions();
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getSession().then(setSession);
    return onAuthChange((s) => { setSession(s); if (!s) setProfile(null); });
  }, []);

  useEffect(() => {
    if (session) getProfile().then(setProfile);
  }, [session]);

  /* Onboarding already asked whether you are male or female, so the
     first sight of the app is already the right one. It is only a
     starting point — the switch in the title bar overrules it. */
  useEffect(() => {
    if (profile && profile.sex) seedFrom(profile.sex);
  }, [profile, seedFrom]);

  /* The daily reminder is on unless you turned it off.

     If the browser has already been given permission this signs the
     device up quietly, with no button to find. If it has not, a
     browser will not let us ask on our own — so we ask, once, and
     take no for an answer permanently. */
  useEffect(() => {
    /* Not until they are through onboarding — a permission box on top
       of "what do you weigh?" is how people end up saying no. */
    if (!session || !session.user || !profile || !profile.onboarded) return undefined;
    let alive = true;

    (async () => {
      const r = await push.autoStart(session.user.id);
      if (!alive || !r.ask) return;

      await push.markAsked();            // whatever they say, we asked
      const yes = await sheet.confirm({
        title: tr('Can we nudge you once a day?'),
        message: tr('One reminder, at a time you pick, to keep you going on the days you would rather not. Nothing else — no offers, no chasing. Change the time or switch it off in Settings whenever you like.'),
        confirmLabel: tr('Yes, keep me going'),
        cancelLabel: tr('Not now'),
      });
      if (!alive || !yes) return;

      const done = await push.enable(session.user.id);
      if (alive && done.error) {
        await sheet.tell({ title: tr('Not switched on'), message: done.error });
      }
    })();

    return () => { alive = false; };
  }, [session, profile, sheet, tr]);

  useEffect(() => {
    const i = Math.max(0, TABS.findIndex((t) => t.key === tab));
    Animated.timing(slide, { toValue:i, duration:140,
      easing:Easing.bezier(0.22,1,0.36,1), useNativeDriver:true }).start();
  }, [tab, slide]);

  /* Web only: keeps the page background, the theme colour and the boot
     screen in step with the app. Does nothing on iOS or Android. */
  useWebChrome({ bg: C.bg, mode, ready: fontsLoaded && session !== undefined });

  if (!fontsLoaded || session === undefined) {
    return <View style={styles.boot}><ActivityIndicator color={C.gold} /></View>;
  }

  if (!session) {
    return (
      <>
        <StatusBar style={mode === 'light' ? 'dark' : 'light'} />
        <Auth onDone={() => {}} />
      </>
    );
  }

  const user = session.user;

  if (profile && !profile.onboarded) {
    return (
      <>
        <StatusBar style={mode === 'light' ? 'dark' : 'light'} />
        <SafeAreaView style={styles.wrap} edges={EDGES_TOP}>
          <Onboarding profile={profile} onDone={(p) => setProfile(p || { ...profile, onboarded: true })} />
        </SafeAreaView>
      </>
    );
  }

  const tabW = width / TABS.length;
  const current = TABS.find((x) => x.key === tab) || TABS[0];
  const accent = C[current.colorKey] || C.ember;

  /* Full-screen flows sit above the tabs — logging food is a task you
     finish, not a place you are. */
  const overlay = settingsOpen ? (
    <SettingsSheet onClose={() => setSettingsOpen(false)}>
      <Settings user={user} profile={profile} onProfile={setProfile} />
    </SettingsSheet>
  ) : adding ? (
    <AddFood meal={adding} user={user}
      onCancel={() => setAdding(null)}
      onDone={(row) => {
        setAdding(null);
        setJustAdded(row || null);
        setRefreshKey((k) => k + 1);
      }} />
  ) : null;

  return (
    <>
      <StatusBar style={mode === 'light' ? 'dark' : 'light'} />
      <SafeAreaView style={styles.wrap} edges={EDGES_TOP}>
        {overlay || (
          <>
            <TitleBar tab={current} accent={accent}
              onSettings={() => setSettingsOpen(true)} />

            <View style={{ flex:1 }}>
              {tab === 'train' ? (
                <Train user={user} profile={profile} />
              ) : tab === 'food' ? (
                <Food user={user} profile={profile} refreshKey={refreshKey}
                      justAdded={justAdded}
                      onAdd={(meal) => setAdding(meal)} />
              ) : tab === 'feed' ? (
                <Discover user={user} profile={profile} />
              ) : tab === 'trainer' ? (
                <Trainer />
              ) : (
                <ChallengesTab user={user} profile={profile} onProfile={setProfile} />
              )}
            </View>

            <View style={[styles.tabs, { height: 58 + Math.max(insets.bottom, 8),
                                         paddingBottom: Math.max(insets.bottom, 8) }]}>
              <Animated.View style={[styles.indicator, {
                width: tabW,
                backgroundColor: accent,
                transform:[{ translateX: slide.interpolate({
                  inputRange: TABS.map((_, i) => i),
                  outputRange: TABS.map((_, i) => i * tabW),
                }) }],
              }]} />
              {TABS.map((t) => {
                const on = tab === t.key;
                const c = C[t.colorKey] || C.ember;
                return (
                  <Press key={t.key} onPress={() => setTab(t.key)} scaleTo={0.9} style={styles.tab}>
                    <View style={[styles.iconWrap, on && { backgroundColor: c + '26' }]}>
                      <TabIcon name={t.key} colour={on ? c : C.faint} />
                    </View>
                    <Text style={[styles.tabLabel,
                      { color: on ? c : C.faint,
                        fontFamily: on ? 'WorkSans_500Medium' : 'WorkSans_400Regular' }]}>
                      {tr(t.label)}
                    </Text>
                  </Press>
                );
              })}
            </View>
          </>
        )}
      </SafeAreaView>
    </>
  );
}

/* Says where you are and what this tab is for, with the mark on the
   left and the one switch that changes the app on the right.

   Light/dark and the language used to live here too. They were moved
   into Settings: they are set once and then never touched again,
   whereas this one is the difference between two different apps. */
function TitleBar({ tab, accent, onSettings }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  if (!tab) return null;
  return (
    <View style={[styles.titleBar, { borderBottomColor: accent }]}>
      <Mark size={30} />
      {/* Everything you set once lives behind these. */}
      <Press onPress={onSettings} scaleTo={0.88} style={styles.dots}
        accessibilityLabel={t('Settings')}>
        <Text style={styles.dotsTxt}>{'⋮'}</Text>
      </Press>
      {/* One line each. The switch takes real width, and a subtitle
          that wraps makes the bar a different height on every tab. */}
      <View style={{ flex:1, marginRight: 8 }}>
        <Text style={styles.titleTxt} numberOfLines={1}>{t(tab.title)}</Text>
        <Text style={styles.subTxt} numberOfLines={1}>{t(tab.sub)}</Text>
      </View>
      <SideSwitch />
    </View>
  );
}

/* Three ways the app can be. Men and women are the two colours the
   logo already uses; seniors is the app's own accent, because it is
   not a third gender — it is a third kind of training.

   The thumb springs across and overshoots slightly, which is most of
   the reason to animate it: you see which way it went.

   Changing sides says what changed, in the middle of the screen.
   Somebody who taps this by accident should find out immediately,
   not three screens later when the workout is not the one they
   expected. */
const SIDE_ORDER = [MEN, WOMEN, SENIORS];
const HALF = 52;

function SideSwitch() {
  const { C, T } = useTheme();
  const { t } = useLang();
  const { side, setSide } = useSide();
  const sheet = useSheet();
  const styles = makeStyles(C, T);

  const at = Math.max(0, SIDE_ORDER.indexOf(side));
  const slide = useRef(new Animated.Value(at)).current;

  useEffect(() => {
    Animated.spring(slide, {
      toValue: at, useNativeDriver: true, speed: 16, bounciness: 11,
    }).start();
  }, [at, slide]);

  const COLOUR = { [MEN]: SIDE_BLUE, [WOMEN]: SIDE_PINK, [SENIORS]: C.lime };

  const SAID = {
    [MEN]: {
      title: 'You are in Men mode',
      body: 'Upper body focused — push, pull and legs, the full gym library. Switch back any time.',
    },
    [WOMEN]: {
      title: 'You are in Women mode',
      body: 'Lower body focused — glutes, thighs and calves lead every session. Menstrual Exercises are on the Train screen. Switch back any time.',
    },
    [SENIORS]: {
      title: 'You are in Seniors mode',
      body: 'Home only, and nothing that strains a joint. Every movement is written out step by step, with what to watch for. Switch back any time.',
    },
  };

  async function pick(next) {
    if (next === side) return;
    setSide(next);
    await sheet.tell({ title: t(SAID[next].title), message: t(SAID[next].body) });
  }

  const lit = (i) => slide.interpolate({
    inputRange: [i - 1, i, i + 1],
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });

  const half = (key, label, i) => (
    <Press key={key} onPress={() => pick(key)} scaleTo={0.96} style={styles.sideHalf}>
      <Text style={[styles.sideTxt, { color: C.faint }]}>{t(label)}</Text>
      <Animated.Text style={[styles.sideTxt, styles.sideTxtOn, { opacity: lit(i) }]}>
        {t(label)}
      </Animated.Text>
    </Press>
  );

  return (
    <View style={[styles.sideWrap, { borderColor: COLOUR[side] }]}>
      <Animated.View
        pointerEvents="none"
        style={[styles.sideThumb, {
          transform: [{
            translateX: slide.interpolate({
              inputRange: [0, 1, 2], outputRange: [0, HALF, HALF * 2],
            }),
          }],
        }]}
      >
        {SIDE_ORDER.map((k, i) => (
          <Animated.View key={k} style={[styles.sideFill,
            { backgroundColor: COLOUR[k], opacity: lit(i) }]} />
        ))}
      </Animated.View>

      {half(MEN, 'Men', 0)}
      {half(WOMEN, 'Women', 1)}
      {half(SENIORS, 'Seniors', 2)}
    </View>
  );
}

/* Settings, over the top of whatever you were doing. */
function SettingsSheet({ children, onClose }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={[styles.titleBar, { borderBottomColor: C.violet }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.titleTxt}>{t('Settings')}</Text>
          <Text style={styles.subTxt} numberOfLines={1}>{t('Your account and how the app behaves')}</Text>
        </View>
        <Press onPress={onClose} scaleTo={0.9} style={styles.close}>
          <Text style={[styles.closeTxt, { color: C.violet }]}>{t('Done')}</Text>
        </Press>
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  boot:{ flex:1, backgroundColor:C.bg, alignItems:'center', justifyContent:'center' },
  wrap:{ flex:1, backgroundColor:C.bg },

  /* the strip that names the tab you are on */
  titleBar:{ flexDirection:'row', alignItems:'center', paddingHorizontal:18,
             paddingTop:12, paddingBottom:11,
             backgroundColor:C.surface, borderBottomWidth:2 },
  dots:{ width:26, height:34, alignItems:'center', justifyContent:'center', marginRight:6 },
  dotsTxt:{ fontFamily:'WorkSans_600SemiBold', fontSize:21, color:C.dim, lineHeight:24 },
  close:{ paddingHorizontal:12, paddingVertical:8 },
  closeTxt:{ fontFamily:'WorkSans_600SemiBold', fontSize:15 },

  sideWrap:{ flexDirection:'row', borderRadius:999, borderWidth:1.5,
             backgroundColor:C.raised, padding:2, overflow:'hidden' },
  sideThumb:{ position:'absolute', left:2, top:2, bottom:2, width:HALF,
              borderRadius:999, overflow:'hidden' },
  sideFill:{ ...StyleSheet.absoluteFillObject, borderRadius:999 },
  sideHalf:{ width:HALF, paddingVertical:6, alignItems:'center', justifyContent:'center' },
  sideTxt:{ fontFamily:'WorkSans_500Medium', fontSize:9.5, letterSpacing:0.4,
            textTransform:'uppercase', textAlign:'center' },
  sideTxtOn:{ ...StyleSheet.absoluteFillObject, color:'#FFFFFF',
              paddingVertical:6 },
  titleTxt:{ fontFamily:'WorkSans_600SemiBold', fontSize:19, color:C.text },
  subTxt:{ fontFamily:'WorkSans_400Regular', fontSize:12, color:C.dim, marginTop:1 },

  /* bottom bar — the padding keeps it whole above the home indicator */
  tabs:{ flexDirection:'row', flexShrink:0, backgroundColor:C.surface,
         borderTopWidth:1, borderTopColor:C.line },
  indicator:{ position:'absolute', top:0, left:0, height:3, backgroundColor:C.ember },
  tab:{ flex:1, alignItems:'center', paddingTop:9, paddingBottom:4 },
  iconWrap:{ paddingHorizontal:13, paddingVertical:3, borderRadius:999, marginBottom:3 },
  icon:{ fontSize:17 },
  tabLabel:{ fontSize:10.5, letterSpacing:0.2 },
});
