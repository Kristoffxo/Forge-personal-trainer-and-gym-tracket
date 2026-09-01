/* ---------------------------------------------------------------
   Men and women.

   One switch, at the top of every screen. It changes two things:

     - the colours, so the app feels like it was built for whoever
       is holding it rather than for a default person
     - the training, because the two sides genuinely want different
       sessions. The men's side is unchanged. The women's side leads
       with glutes, thighs and calves, keeps the upper body honest
       but lighter, and adds a set of sessions for period pain that
       the men's side has no reason to show.

   It is remembered on the device, and the first time round it is
   guessed from what onboarding already asked. Guessed, not fixed —
   anybody can move it, and plenty will.
   --------------------------------------------------------------- */
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'nemea:side';         // see the note in src/lang.js

export const MEN = 'men';
export const WOMEN = 'women';

const Ctx = createContext(null);

export function SideProvider({ children }) {
  const [side, setSideState] = useState(MEN);
  const [chosen, setChosen] = useState(false);   // has anybody actually picked?
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (v === MEN || v === WOMEN) { setSideState(v); setChosen(true); }
      })
      .finally(() => setReady(true));
  }, []);

  const value = useMemo(() => {
    const set = (next) => {
      const s = next === WOMEN ? WOMEN : MEN;
      setSideState(s);
      setChosen(true);
      AsyncStorage.setItem(KEY, s).catch(() => {});
    };
    return {
      side,
      isWomen: side === WOMEN,
      chosen,
      setSide: set,
      toggle: () => set(side === WOMEN ? MEN : WOMEN),
      /* Onboarding already asked. Use the answer as a starting point,
         but never overwrite a choice somebody made by hand. */
      seedFrom: (sex) => {
        if (chosen || !sex) return;
        const s = sex === 'female' ? WOMEN : MEN;
        setSideState(s);
        AsyncStorage.setItem(KEY, s).catch(() => {});
      },
    };
  }, [side, chosen]);

  if (!ready) return null;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSide() {
  return useContext(Ctx) || {
    side: MEN, isWomen: false, chosen: false,
    setSide: () => {}, toggle: () => {}, seedFrom: () => {},
  };
}
