/* ---------------------------------------------------------------
   What a tab is for, said once.

   The first time somebody opens a tab they get one card: the tab's
   name, and a line saying what it does. Then never again.

   Two lines each: what the tab is, then the one thing that is not
   visible from looking at it — usually what it is worth in Reppo
   Score. Neither line says "this is the Discover tab".

   Keep them under about forty-two characters. The card is narrow on
   purpose, and a line that wraps to a third line stops looking like
   two lines and starts looking like a paragraph, which is the thing
   this was rewritten to stop being.

   Only three things earn Reppo Score, so only three of these
   mention it. Promising points on a tab that cannot give them is
   worse than saying nothing.
   --------------------------------------------------------------- */
import AsyncStorage from '@react-native-async-storage/async-storage';

/* Bumped when the wording changes materially. Anybody who saw the
   old note gets the new one once, which is the point of writing a
   better one. */
const KEY = 'reppo.tabNotes.seen.v2';

export const TAB_NOTES = {
  train: {
    title: 'Train',
    message: 'Workouts built for your kit and your time.'
      + '\nFinishing one is +5 Reppo Score.',
  },
  food: {
    title: 'Food',
    message: 'Everything you eat, in calories and macros.'
      + '\nAgainst a daily goal set for your body.',
  },
  feed: {
    title: 'Discover',
    message: 'Photos from everyone else using Reppo.'
      + '\nPost one a day, for +2 Reppo Score.',
  },
  you: {
    title: 'Challenges',
    message: 'A live sixty-second race against somebody.'
      + '\nA win is +2 Reppo Score.',
  },
  journey: {
    title: 'You',
    message: 'Your Reppo Score, and the league it earns.'
      + '\nEvery 50 points is a promotion.',
  },
};

/* Read once at boot. A tab change should not wait on storage before
   it can decide whether to say anything — by the time somebody has
   pressed a tab the answer has to be in hand. */
export async function seenTabs() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function markSeen(tab, seen) {
  const next = seen.includes(tab) ? seen : [...seen, tab];
  try { await AsyncStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}
