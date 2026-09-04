/* ---------------------------------------------------------------
   What a tab is for, said once.

   The first time somebody opens a tab they get one card: the tab's
   name, and a line saying what it does. Then never again.

   One line each, and no line explains the obvious. "Discover" does
   not need "this is the Discover tab" — it needs the one thing that
   is not visible from looking at it, which is usually what the tab
   is worth in Reppo Score.

   Only three things earn Reppo Score, so only three of these
   mention it. Promising points on a tab that cannot give them is
   worse than saying nothing.
   --------------------------------------------------------------- */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'reppo.tabNotes.seen.v1';

export const TAB_NOTES = {
  train: {
    title: 'Train',
    message: 'Your workout for today, built around what you have and how long you have. '
      + 'Finishing one is +5 Reppo Score.',
  },
  food: {
    title: 'Food',
    message: 'Track the calories and macros of everything you eat, '
      + 'and plan what to eat next.',
  },
  feed: {
    title: 'Discover',
    message: 'Post a photo to be visible to the world, and see how everyone else is doing. '
      + 'A photo is +2 Reppo Score.',
  },
  you: {
    title: 'Challenges',
    message: 'Race somebody live for sixty seconds, and keep the numbers the rest of the app '
      + 'is worked out from. Winning a round is +2 Reppo Score.',
  },
  journey: {
    title: 'You',
    message: 'Your Reppo Score, the leagues it climbs, and every day you have trained. '
      + 'Every 50 points is a new league.',
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
