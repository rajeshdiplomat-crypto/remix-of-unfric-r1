import { get, set, del, createStore } from "idb-keyval";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

/**
 * IndexedDB store for React Query cache persistence.
 * Uses idb-keyval for a simple key-value store in IndexedDB.
 */
const idbStore = createStore("unfric-cache", "query-cache");

/**
 * Async storage adapter wrapping idb-keyval for TanStack Query persister.
 */
const idbStorage = {
  getItem: async (key: string): Promise<string | null> => {
    console.log("[IDB-Persister] Reading cache from IndexedDB…");
    const val = await get<string>(key, idbStore);
    if (val) {
      console.log(`[IDB-Persister] ✅ Restored cache (${(val.length / 1024).toFixed(1)} KB)`);
    } else {
      console.log("[IDB-Persister] ⚠️ No cached data found in IndexedDB");
    }
    return val ?? null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    console.log(`[IDB-Persister] 💾 Writing cache to IndexedDB (${(value.length / 1024).toFixed(1)} KB)`);
    await set(key, value, idbStore);
    console.log(`[IDB-Persister] ✅ Successfully saved [${key}] to IndexedDB`);
  },
  removeItem: async (key: string): Promise<void> => {
    console.log("[IDB-Persister] 🗑️ Removing cache from IndexedDB");
    await del(key, idbStore);
  },
};

/**
 * TanStack Query persister backed by IndexedDB.
 * maxAge: 7 days — cached data older than this is discarded on restore.
 */
export const idbPersister = createAsyncStoragePersister({
  storage: idbStorage,
  key: "unfric-react-query",
  throttleTime: 1000, // debounce writes to IDB
});
