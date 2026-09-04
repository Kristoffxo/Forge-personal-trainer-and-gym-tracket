/* ============================================================
   Two palettes, one shape. Everything reads colours through
   useTheme() so switching is instant and nothing is hard-coded.

   Men and women do NOT have different palettes. That was tried and
   it was too much — a whole app tinted blue or pink storms over
   everything on it. The only place those two colours appear now is
   the switch itself, where they are doing a job: telling you which
   side you are on at a glance.
   ============================================================ */
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSide } from './side';

/* The two colours of the men/women switch, and nowhere else. */
export const SIDE_BLUE = '#3B82F6';
export const SIDE_PINK = '#FF4D8D';

/* The logo's own gradient, sampled out of brand/reppo-logo-source.png
   rather than picked to look similar. `ember` below is the middle of
   it, which is why the app and the mark sit together. */
export const REPPO_ORANGE = '#FE4E02';
export const REPPO_RED = '#FA0A12';

export const DARK = {
  mode:'dark',
  bg:'#0B0B0E', surface:'#16161B', raised:'#1F1F26', line:'#2A2A32',
  text:'#FFFFFF', dim:'#9CA3AF', faint:'#6B7280', onAccent:'#0B0B0E',
  ember:'#FE4E02', amber:'#FBBF24', teal:'#22D3EE', violet:'#8B5CF6', lime:'#4ADE80',
  gold:'#FF7A2E', taupe:'#F0A882',   // the mark's lighter end
  protein:'#EF4444', carbs:'#FBBF24', fat:'#22D3EE',
  danger:'#EF4444', white:'#FFFFFF',
  veil:'rgba(14,13,12,0.62)',      // over photographs
  heroVeil:'rgba(14,13,12,0.55)',
};

export const LIGHT = {
  mode:'light',
  bg:'#F6F6F8', surface:'#FFFFFF', raised:'#EFEFF3', line:'#E1E1E8',
  text:'#0B0B0E', dim:'#5B6270', faint:'#8A90A0', onAccent:'#FFFFFF',
  ember:'#D93F00', amber:'#C98A0A', teal:'#0E9BB5', violet:'#6D40E0', lime:'#2FA45C',
  gold:'#C4500A', taupe:'#A8664A',
  protein:'#D32F2F', carbs:'#C98A0A', fat:'#0E9BB5',
  danger:'#D32F2F', white:'#FFFFFF',
  veil:'rgba(14,13,12,0.44)',
  heroVeil:'rgba(14,13,12,0.46)',
};

export function palette(mode = 'light') {
  return mode === 'light' ? LIGHT : DARK;
}

/* ---------- muscle colours ----------
   Readable on both modes, and the same on both sides. The last five
   are not muscles — they are what the period-pain sessions ease,
   which is what those screens name instead. */
export const MUSCLE_DARK = {
  Chest:'#FF5A3C', Back:'#38BDF8', Shoulders:'#FBBF24', Biceps:'#A78BFA',
  Triceps:'#A78BFA', Quads:'#4ADE80', Hamstrings:'#34D399', Glutes:'#F472B6',
  Thighs:'#FB7185', Calves:'#60A5FA', Core:'#FACC15',
  /* the period-pain sessions name what they ease, not a muscle */
  'Lower back':'#F9A8D4', Hips:'#F472B6', 'Inner thigh':'#FB7185',
  'Upper back':'#93C5FD', Ribs:'#FCD34D',
};
export const MUSCLE_LIGHT = {
  Chest:'#C7481A', Back:'#12867C', Shoulders:'#B9761A', Biceps:'#6244D8',
  Triceps:'#C63D2C', Quads:'#4E7C1F', Hamstrings:'#0F7A70', Glutes:'#C2557A',
  Thighs:'#C0455E', Calves:'#2F6FBF', Core:'#A8862A',
  'Lower back':'#BE4A80', Hips:'#C2557A', 'Inner thigh':'#C0455E',
  'Upper back':'#2F6FBF', Ribs:'#A8862A',
};

export const F = {
  display:'WorkSans_600SemiBold',
  body:'WorkSans_400Regular',
  medium:'WorkSans_500Medium',
};

/* type scale, coloured for whichever palette is active */
export function makeT(C) {
  return {
    hero:  { fontFamily:F.display, fontSize:36, lineHeight:41, letterSpacing:-0.6, color:C.text },
    h1:    { fontFamily:F.display, fontSize:28, lineHeight:33, letterSpacing:-0.4, color:C.text },
    h2:    { fontFamily:F.display, fontSize:21, lineHeight:26, letterSpacing:-0.2, color:C.text },
    h3:    { fontFamily:F.medium,  fontSize:16, lineHeight:22, color:C.text },
    body:  { fontFamily:F.body,    fontSize:15, lineHeight:22, color:C.dim },
    bodyOn:{ fontFamily:F.body,    fontSize:15, lineHeight:22, color:C.text },
    small: { fontFamily:F.body,    fontSize:13, lineHeight:19, color:C.dim },
    tiny:  { fontFamily:F.body,    fontSize:11, lineHeight:15, color:C.faint },
    label: { fontFamily:F.medium,  fontSize:11, letterSpacing:1.4,
             textTransform:'uppercase', color:C.dim },
    num:   { fontFamily:F.display, fontSize:42, letterSpacing:-1, color:C.text },
  };
}

export const S = { xs:6, sm:10, md:16, lg:22, xl:32, xxl:44 };
export const R = { sm:12, md:18, lg:24, pill:999 };

/* ---------- the switch ----------
   Dark is the standard. Light is there for anybody who wants it,
   and is remembered once they do. */
const KEY = 'nemea:theme';        // see the note in src/lang.js
const Ctx = createContext(null);

export function ThemeProvider({ children }) {
  /* Only so screens can read it from one hook. The side changes what
     the app trains, never what colour it is. */
  const { side } = useSide();
  /* Light until told otherwise. Most people never open a settings
     screen, and the app they never configure should be the one that
     reads in daylight in a gym. Anyone who wants dark still has the
     toggle, and the choice is remembered. */
  const [mode, setMode] = useState('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => { if (v === 'light' || v === 'dark') setMode(v); })
      .finally(() => setReady(true));
  }, []);

  const value = useMemo(() => {
    const C = palette(mode);
    return {
      C,
      T: makeT(C),
      MUSCLE_C: mode === 'light' ? MUSCLE_LIGHT : MUSCLE_DARK,
      mode,
      side,
      toggle: () => {
        const next = mode === 'light' ? 'dark' : 'light';
        setMode(next);
        AsyncStorage.setItem(KEY, next).catch(() => {});
      },
    };
  }, [mode, side]);

  if (!ready) return null;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const v = useContext(Ctx);
  // a sensible fallback so a component rendered outside the provider still works
  return v || {
    C: LIGHT, T: makeT(LIGHT), MUSCLE_C: MUSCLE_LIGHT,
    mode:'light', side:'men', toggle: () => {},
  };
}

/* default export kept so any stray `import { C }` still resolves to dark */
export const C = DARK;
export const T = makeT(DARK);
export const MUSCLE_C = MUSCLE_DARK;
