/* ============================================================
   Two palettes, one shape. Everything reads colours through
   useTheme() so switching is instant and nothing is hard-coded.
   ============================================================ */
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DARK = {
  mode:'dark',
  bg:'#100E0D', surface:'#1D1A18', raised:'#292523', line:'#3A3532',
  text:'#F8F4EE', dim:'#B4ADA4', faint:'#7C756E', onAccent:'#120F0D',
  ember:'#FF6B2C', amber:'#FFB43A', teal:'#2FD9C8', violet:'#9B7BFF', lime:'#9BD84F',
  gold:'#C99A3E', taupe:'#CFC1AA',   // straight off the logo
  protein:'#E8543F', carbs:'#F2A93B', fat:'#2EC4B6',
  danger:'#E4453A', white:'#FFFFFF',
  veil:'rgba(14,13,12,0.62)',      // over photographs
  heroVeil:'rgba(14,13,12,0.55)',
};

export const LIGHT = {
  mode:'light',
  bg:'#FAF7F1', surface:'#FFFFFF', raised:'#F1ECE3', line:'#DED8CE',
  text:'#17150F', dim:'#6B655C', faint:'#9C958B', onAccent:'#FFFFFF',
  ember:'#E0521C', amber:'#C9821B', teal:'#12968A', violet:'#6B4CE0', lime:'#5A8F22',
  gold:'#B0801F', taupe:'#B9A88C',
  protein:'#C63D2C', carbs:'#B9761A', fat:'#12867C',
  danger:'#C0392B', white:'#FFFFFF',
  veil:'rgba(14,13,12,0.44)',
  heroVeil:'rgba(14,13,12,0.46)',
};

/* muscle colours are readable on both, nudged darker for light mode */
export const MUSCLE_DARK = {
  Chest:'#FF6B2C', Back:'#2FD9C8', Shoulders:'#FFB43A', Biceps:'#9B7BFF',
  Triceps:'#FF6A55', Quads:'#9BD84F', Hamstrings:'#31C4B4', Glutes:'#FF8FB4',
  Calves:'#69A9FF', Core:'#FFD84D',
};
export const MUSCLE_LIGHT = {
  Chest:'#C7481A', Back:'#12867C', Shoulders:'#B9761A', Biceps:'#6244D8',
  Triceps:'#C63D2C', Quads:'#4E7C1F', Hamstrings:'#0F7A70', Glutes:'#C2557A',
  Calves:'#2F6FBF', Core:'#A8862A',
};

export const F = {
  display:'WorkSans_600SemiBold',
  body:'WorkSans_400Regular',
  medium:'WorkSans_500Medium',
};

/* type scale, coloured for whichever palette is active */
export function makeT(C) {
  return {
    hero:  { fontFamily:F.bold, fontSize:36, lineHeight:41, letterSpacing:-0.6, color:C.text },
    h1:    { fontFamily:F.bold, fontSize:28, lineHeight:33, letterSpacing:-0.4, color:C.text },
    h2:    { fontFamily:F.display, fontSize:21, lineHeight:26, letterSpacing:-0.2, color:C.text },
    h3:    { fontFamily:F.medium,  fontSize:16, lineHeight:22, color:C.text },
    body:  { fontFamily:F.body,    fontSize:15, lineHeight:22, color:C.dim },
    bodyOn:{ fontFamily:F.body,    fontSize:15, lineHeight:22, color:C.text },
    small: { fontFamily:F.body,    fontSize:13, lineHeight:19, color:C.dim },
    tiny:  { fontFamily:F.body,    fontSize:11, lineHeight:15, color:C.faint },
    label: { fontFamily:F.medium,  fontSize:11, letterSpacing:1.4,
             textTransform:'uppercase', color:C.dim },
    num:   { fontFamily:F.bold, fontSize:42, letterSpacing:-1, color:C.text },
  };
}

export const S = { xs:6, sm:10, md:16, lg:22, xl:32, xxl:44 };
export const R = { sm:10, md:16, lg:22, pill:999 };

/* ---------- the switch ---------- */
const KEY = 'nemea:theme';
const Ctx = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('dark');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => { if (v === 'light' || v === 'dark') setMode(v); })
      .finally(() => setReady(true));
  }, []);

  const value = useMemo(() => {
    const C = mode === 'light' ? LIGHT : DARK;
    return {
      C,
      T: makeT(C),
      MUSCLE_C: mode === 'light' ? MUSCLE_LIGHT : MUSCLE_DARK,
      mode,
      toggle: () => {
        const next = mode === 'light' ? 'dark' : 'light';
        setMode(next);
        AsyncStorage.setItem(KEY, next).catch(() => {});
      },
    };
  }, [mode]);

  if (!ready) return null;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const v = useContext(Ctx);
  // a sensible fallback so a component rendered outside the provider still works
  return v || { C: DARK, T: makeT(DARK), MUSCLE_C: MUSCLE_DARK, mode:'dark', toggle: () => {} };
}

/* default export kept so any stray `import { C }` still resolves to dark */
export const C = DARK;
export const T = makeT(DARK);
export const MUSCLE_C = MUSCLE_DARK;
