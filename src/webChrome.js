/* ---------------------------------------------------------------
   Everything the app needs to behave like an installed app in a
   browser. A no-op on iOS and Android.

     - paints the page behind the app so overscroll and the strip
       iOS leaves for the status bar match whichever palette is on
     - keeps <meta name="theme-color"> in step with the toggle
     - takes the boot screen down once the app is actually ready

   The status bar itself is drawn by iOS, not by us: index.html asks
   for apple-mobile-web-app-status-bar-style="black", so an installed
   app gets a black bar with white glyphs that reads correctly under
   both palettes. See the note in public/index.html for why the
   translucent option is not used.
   --------------------------------------------------------------- */
import { useEffect } from 'react';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web' && typeof document !== 'undefined';

function setThemeColor(color) {
  let meta = document.querySelector('meta[name="theme-color"]:not([media])');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', color);
}

/* Called from App.js on every render of the root. */
export function useWebChrome({ bg, mode, ready }) {
  useEffect(() => {
    if (!isWeb) return;
    // Safari paints anything outside the web view with this colour, so it has
    // to follow the palette or a pale seam shows at the edges.
    document.documentElement.style.backgroundColor = bg;
    document.body.style.backgroundColor = bg;
    document.documentElement.style.colorScheme = mode === 'light' ? 'light' : 'dark';
    setThemeColor(bg);
  }, [bg, mode]);

  useEffect(() => {
    if (!isWeb || !ready) return;
    if (typeof window.__nemeaReady === 'function') window.__nemeaReady();
  }, [ready]);
}
