import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, Easing,
         useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { WorkSans_400Regular, WorkSans_500Medium, WorkSans_600SemiBold,
         WorkSans_700Bold } from '@expo-google-fonts/work-sans';

import { useTheme, ThemeProvider } from './src/theme';
import { SideProvider, useSide, WOMEN } from './src/side';
import { LangProvider, useLang } from './src/lang';
import { Press } from './src/ui/kit';
import { SheetProvider } from './src/ui/sheet';
import { Mark } from './src/ui/logo';
import { getSession, onAuthChange, getProfile } from './src/auth';
import { useWebChrome } from './src/webChrome';

import Auth     from './src/screens/Auth';
import Food     from './src/screens/Food';
import AddFood  from './src/screens/AddFood';
import Train    from './src/screens/Train';
import Discover from './src/screens/Feed';
import You      from './src/screens/You';
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
    title:'Discover',        sub:'See how everyone is doing' },
  { key:'you',   label:'You',   icon:'✦', colorKey:'violet',
    title:'You',             sub:'Your streak and your numbers' },
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
  const styles = makeStyles(C, T);
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ WorkSans_600SemiBold, WorkSans_400Regular, WorkSans_500Medium });
  const [session, setSession] = useState(undefined);   // undefined = still checking
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState('train');
  const [adding, setAdding] = useState(null);      // meal name, for the food search
  const [refreshKey, setRefreshKey] = useState(0);

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

  useEffect(() => {
    const i = Math.max(0, TABS.findIndex((t) => t.key === tab));
    Animated.timing(slide, { toValue:i, duration:170,
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
  const overlay = adding ? (
    <AddFood meal={adding} user={user}
      onCancel={() => setAdding(null)}
      onDone={() => { setAdding(null); setRefreshKey((k) => k + 1); }} />
  ) : null;

  return (
    <>
      <StatusBar style={mode === 'light' ? 'dark' : 'light'} />
      <SafeAreaView style={styles.wrap} edges={EDGES_TOP}>
        {overlay || (
          <>
            <TitleBar tab={current} accent={accent} />

            <View style={{ flex:1 }}>
              {tab === 'train' ? (
                <Train user={user} profile={profile} />
              ) : tab === 'food' ? (
                <Food user={user} profile={profile} refreshKey={refreshKey}
                      onAdd={(meal) => setAdding(meal)} />
              ) : tab === 'feed' ? (
                <Discover user={user} profile={profile} />
              ) : tab === 'trainer' ? (
                <Trainer user={user} profile={profile} />
              ) : (
                <You user={user} profile={profile} onProfile={setProfile} />
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
                      <Text style={[styles.icon, { color: on ? c : C.faint }]}>{t.icon}</Text>
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
function TitleBar({ tab, accent }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  if (!tab) return null;
  return (
    <View style={[styles.titleBar, { borderBottomColor: accent }]}>
      <Mark size={30} style={{ marginRight: 11 }} />
      <View style={{ flex:1 }}>
        <Text style={styles.titleTxt}>{t(tab.title)}</Text>
        <Text style={styles.subTxt}>{t(tab.sub)}</Text>
      </View>
      <SideSwitch />
    </View>
  );
}

/* Two halves of one pill. Blue on the left, pink on the right, and
   the whole thing is a single tap — there is no third state to get
   lost in and nothing to confirm. */
function SideSwitch() {
  const { C, T } = useTheme();
  const { t } = useLang();
  const { side, setSide } = useSide();
  const styles = makeStyles(C, T);
  const women = side === WOMEN;

  const half = (key, label, colour, on) => (
    <Press onPress={() => setSide(key)} scaleTo={0.94}
      style={[styles.sideHalf, on && { backgroundColor: colour }]}>
      <Text style={[styles.sideTxt, { color: on ? C.onAccent : C.faint }]}>{t(label)}</Text>
    </Press>
  );

  return (
    <View style={[styles.sideWrap, { borderColor: women ? '#FF4D8D' : '#3B82F6' }]}>
      {half('men', 'Men', '#3B82F6', !women)}
      {half(WOMEN, 'Women', '#FF4D8D', women)}
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
  sideWrap:{ flexDirection:'row', borderRadius:999, borderWidth:1.5,
             backgroundColor:C.raised, padding:2, overflow:'hidden' },
  sideHalf:{ paddingHorizontal:11, paddingVertical:6, borderRadius:999 },
  sideTxt:{ fontFamily:'WorkSans_500Medium', fontSize:11, letterSpacing:0.7,
            textTransform:'uppercase' },
  titleTxt:{ fontFamily:'WorkSans_600SemiBold', fontSize:21, color:C.text },
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
