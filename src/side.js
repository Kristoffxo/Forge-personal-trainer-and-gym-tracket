/* ---------------------------------------------------------------
   Men, women and seniors.

   One switch, at the top of every screen. It changes what the app
   trains, and nothing about how it looks:

     men      unchanged — the whole library, gym and home
     women    leads with glutes, thighs and calves, keeps the upper
              body but trains less of it, and adds the period-pain
              sessions the men's side has no reason to show
     seniors  home only. No gym, no barbell, no jumping, nothing that
              loads a joint under weight. Every session is a chair, a
              wall, the floor and a band, and every exercise carries
              step-by-step instructions rather than a rep scheme.

   It is remembered on the device, and the first time round it is
   guessed from what onboarding already asked. Guessed, not fixed —
   anybody can move it, and plenty will.
   --------------------------------------------------------------- */
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'nemea:side';         // see the note in src/lang.js

export const MEN = 'men';
export const WOMEN = 'women';
/* Seniors is off the switch for now. The constant stays because a
   phone that last had it selected still has 'seniors' in storage,
   and `isSide` has to reject it so that phone lands back on Men
   rather than on a mode with no way out of it. */
export const SENIORS = 'seniors';

export const SIDES = [MEN, WOMEN];
const isSide = (v) => SIDES.indexOf(v) !== -1;

const Ctx = createContext(null);

export function SideProvider({ children }) {
  const [side, setSideState] = useState(MEN);
  const [chosen, setChosen] = useState(false);   // has anybody actually picked?
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (isSide(v)) { setSideState(v); setChosen(true); }
      })
      .finally(() => setReady(true));
  }, []);

  const value = useMemo(() => {
    const set = (next) => {
      const s = isSide(next) ? next : MEN;
      setSideState(s);
      setChosen(true);
      AsyncStorage.setItem(KEY, s).catch(() => {});
    };
    return {
      side,
      isWomen: side === WOMEN,
      isSenior: false,
      chosen,
      setSide: set,
      /* kept for anything still calling it; three sides need setSide */
      toggle: () => set(side === MEN ? WOMEN : MEN),
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
    side: MEN, isWomen: false, isSenior: false, chosen: false,
    setSide: () => {}, toggle: () => {}, seedFrom: () => {},
  };
}
