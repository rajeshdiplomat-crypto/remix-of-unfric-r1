import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing Supabase environment variables!");
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: window.localStorage,
    storageKey: "sb-session",
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: (url, options) => {
      // 1. Prevent Service Worker cache poisoning (Your addition)
      const fetchOptions: RequestInit = {
        ...options,
        cache: "no-store",
      };

      // 2. Prevent infinite hangs or lock errors when fully offline
      if (!navigator.onLine) {
        return Promise.reject(new Error('App is currently offline.'));
      }

      // 3. Execute the strictly un-cached network request
      return fetch(url, fetchOptions);
    },
  },
});
