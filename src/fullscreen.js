/* ---------------------------------------------------------------
   "Something is running — get out of its way."

   The workout player lives four screens deep inside the Train tab,
   so it cannot hide the title bar and the tab bar by rendering
   differently. It says so here instead, and App reads it.

   Kept to one boolean on purpose. The moment this grows a second
   flag it stops being "hide the chrome" and becomes a layout engine
   nobody asked for.
   --------------------------------------------------------------- */
import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';

const Ctx = createContext({ full: false, setFull: () => {} });

export function FullscreenProvider({ children }) {
  const [full, setFull] = useState(false);
  const value = useMemo(() => ({ full, setFull }), [full]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFullscreen() {
  return useContext(Ctx);
}

/* Claim the whole screen for as long as this component is mounted,
   and give it back on the way out — including when somebody leaves
   by a route nobody thought about, which is the point of doing it
   in a cleanup rather than in every exit handler. */
export function useClaimFullscreen(active = true) {
  const { setFull } = useFullscreen();
  useEffect(() => {
    if (!active) return undefined;
    setFull(true);
    return () => setFull(false);
  }, [active, setFull]);
}
