/* ---------------------------------------------------------------
   Supabase connection.
   The publishable key is safe in the app — the database's Row Level
   Security decides what each signed-in person may touch.
   --------------------------------------------------------------- */
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://emzuykgqysezhlscmlhv.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_8RBXWNO2KpLR5jHcZfWmFQ_N9cZ266R';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: AsyncStorage,      // keeps you signed in between launches
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
