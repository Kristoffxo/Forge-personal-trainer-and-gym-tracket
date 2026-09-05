/* ---------------------------------------------------------------
   Supabase connection.
   The publishable key is safe in the app — the database's Row Level
   Security decides what each signed-in person may touch.
   --------------------------------------------------------------- */
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://emzuykgqysezhlscmlhv.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_8RBXWNO2KpLR5jHcZfWmFQ_N9cZ266R';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: AsyncStorage,      // keeps you signed in between launches
    persistSession: true,
    autoRefreshToken: true,
    /* On the web a password-reset link comes back as tokens in the
       URL hash, and somebody has to read them. With this off the
       link opened the app, did nothing, and left the person exactly
       as locked out as before. Web only: there is no URL to read on
       a phone, and a native build should not go looking for one. */
    detectSessionInUrl: Platform.OS === 'web',
  },
});
