/* ============================================================
   Two palettes, one shape — now in two families.

   Light and dark decide the neutrals. Men and women decide the
   accents, and tint the neutrals with them: the men's side is
   cool and steel-blue, the women's warm and pink. Nothing is
   hard-coded anywhere else, so both switches are instant.

   The keys never change. `C.ember` is "the colour this app leads
   with" — blue on one side, pink on the other — and every screen
   goes on reading it without knowing which side it is on.
   ============================================================ */
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSide, WOMEN } from './side';

/* ---------- neutrals ---------- */
const NEUTRAL = {
  dark: {
    men: {
      bg:'#080B12', surface:'#111722', raised:'#19212F', line:'#26313F',
      text:'#FFFFFF', dim:'#9AA7BD', faint:'#69768C', onAccent:'#06090F',
      veil:'rgba(6,10,18,0.62)', heroVeil:'rgba(6,10,18,0.55)',
    },
    women: {
      bg:'#120A10', surface:'#1D1219', raised:'#281A23', line:'#3A2530',
      text:'#FFFFFF', dim:'#C4A8B5', faint:'#8E7280', onAccent:'#140A11',
      veil:'rgba(20,8,14,0.62)', heroVeil:'rgba(20,8,14,0.55)',
    },
  },
  light: {
    men: {
      bg:'#F1F5FB', surface:'#FFFFFF', raised:'#E7EDF7', line:'#D6E0EE',
      text:'#0A1018', dim:'#4F5D70', faint:'#7C8A9D', onAccent:'#FFFFFF',
      veil:'rgba(8,12,20,0.44)', heroVeil:'rgba(8,12,20,0.46)',
    },
    women: {
      bg:'#FDF5F8', surface:'#FFFFFF', raised:'#F8E9EF', line:'#EFD8E1',
      text:'#1A0E14', dim:'#6B5460', faint:'#9B8490', onAccent:'#FFFFFF',
      veil:'rgba(26,10,18,0.44)', heroVeil:'rgba(26,10,18,0.46)',
    },
  },
};

/* ---------- accents ----------
   Five hues that have to stay apart from each other, because the
   tab bar colours by them. Same job on both sides, different family. */
const ACCENT = {
  dark: {
    men: {
      ember:'#3B82F6', amber:'#F5A524', gold:'#22D3EE',
      violet:'#7C6BFF', teal:'#38BDF8', lime:'#4ADE80',
      taupe:'#AEC3E0',
    },
    women: {
      ember:'#FF4D8D', amber:'#FBBF24', gold:'#FF8FB8',
      violet:'#C084FC', teal:'#FB7185', lime:'#4ADE80',
      taupe:'#E7C2D3',
    },
  },
  light: {
    men: {
      ember:'#1D62D8', amber:'#B77908', gold:'#0E8FAA',
      violet:'#5B45D6', teal:'#1478B8', lime:'#2FA45C',
      taupe:'#7E93AF',
    },
    women: {
      ember:'#D6246B', amber:'#C98A0A', gold:'#C74B85',
      violet:'#8B44D6', teal:'#D94A63', lime:'#2FA45C',
      taupe:'#B08398',
    },
  },
};

/* Fixed whatever the side — a macro is a macro, and danger is red. */
const CONSTANT_DARK = {
  protein:'#EF4444', carbs:'#FBBF24', fat:'#22D3EE',
  danger:'#EF4444', white:'#FFFFFF',
};
const CONSTANT_LIGHT = {
  protein:'#D32F2F', carbs:'#C98A0A', fat:'#0E9BB5',
  danger:'#D32F2F', white:'#FFFFFF',
};

export function palette(mode = 'dark', side = 'men') {
  const m = mode === 'light' ? 'light' : 'dark';
  const s = side === WOMEN ? 'women' : 'men';
  return {
    mode: m,
    side: s,
    ...NEUTRAL[m][s],
    ...ACCENT[m][s],
    ...(m === 'light' ? CONSTANT_LIGHT : CONSTANT_DARK),
  };
}

/* kept so anything still importing these by name resolves */
export const DARK = palette('dark', 'men');
export const LIGHT = palette('light', 'men');

/* ---------- muscle colours ----------
   Readable on both modes. The women's set pushes the lower body
   forward, because that is where its sessions live. */
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
const MUSCLE_WOMEN_DARK = {
  ...MUSCLE_DARK,
  Glutes:'#FF4D8D', Thighs:'#F472B6', Quads:'#FB7185', Hamstrings:'#C084FC',
  Calves:'#FF8FB8',
  /* the upper body moves out of blue as well — one cold dot on a
     screen this warm reads as a mistake rather than a category */
  Back:'#C084FC', Chest:'#FB7185', Biceps:'#E879F9', Triceps:'#E879F9',
  Shoulders:'#FBBF24', Core:'#FACC15',
  'Lower back':'#F9A8D4', Hips:'#F472B6', 'Inner thigh':'#FB7185',
  'Upper back':'#C084FC', Ribs:'#FCD34D',
};
const MUSCLE_WOMEN_LIGHT = {
  ...MUSCLE_LIGHT,
  Glutes:'#D6246B', Thighs:'#C74B85', Quads:'#C0455E', Hamstrings:'#8B44D6',
  Calves:'#B8477E',
  Back:'#8B44D6', Chest:'#C0455E', Biceps:'#A836C0', Triceps:'#A836C0',
  Shoulders:'#B9761A', Core:'#A8862A',
  'Lower back':'#BE4A80', Hips:'#C2557A', 'Inner thigh':'#C0455E',
  'Upper back':'#8B44D6', Ribs:'#A8862A',
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
const KEY = 'nemea:theme';
const Ctx = createContext(null);

export function ThemeProvider({ children }) {
  const { side } = useSide();
  const [mode, setMode] = useState('dark');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => { if (v === 'light' || v === 'dark') setMode(v); })
      .finally(() => setReady(true));
  }, []);

  const value = useMemo(() => {
    const C = palette(mode, side);
    const women = side === WOMEN;
    return {
      C,
      T: makeT(C),
      MUSCLE_C: mode === 'light'
        ? (women ? MUSCLE_WOMEN_LIGHT : MUSCLE_LIGHT)
        : (women ? MUSCLE_WOMEN_DARK : MUSCLE_DARK),
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
    C: DARK, T: makeT(DARK), MUSCLE_C: MUSCLE_DARK,
    mode:'dark', side:'men', toggle: () => {},
  };
}

/* default export kept so any stray `import { C }` still resolves to dark */
export const C = DARK;
export const T = makeT(DARK);
export const MUSCLE_C = MUSCLE_DARK;
