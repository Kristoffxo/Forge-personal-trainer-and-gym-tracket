/* ---------------------------------------------------------------
   What a tab is for, said once.

   The first time somebody opens a tab they get one card: the tab's
   name, and a line saying what it does. Then never again.

   Half a line each. "Discover" does not need "this is the Discover
   tab" — it needs the one thing that is not visible from looking at
   it, which is usually what the tab is worth in Reppo Score. A
   paragraph in a box in front of somebody who has just arrived
   reads as terms and conditions.

   Only three things earn Reppo Score, so only three of these
   mention it. Promising points on a tab that cannot give them is
   worse than saying nothing.
   --------------------------------------------------------------- */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'reppo.tabNotes.seen.v1';

export const TAB_NOTES = {
  train: { title: 'Train', message: 'Today’s workout. Finishing it is +5 Reppo Score.' },
  food:  { title: 'Food',  message: 'Track what you eat.' },
  feed:  { title: 'Discover', message: 'Post a photo. +2 Reppo Score.' },
  you:   { title: 'Challenges', message: 'Race somebody live. A win is +2.' },
  journey: { title: 'You', message: 'Your score, your leagues, your calendar.' },
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
