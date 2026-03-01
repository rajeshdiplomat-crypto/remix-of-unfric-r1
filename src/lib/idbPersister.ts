import { get, set, del, createStore } from "idb-keyval";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

/**
 * IndexedDB store for React Query cache persistence.
 */
const idbStore = createStore("unfric-cache", "query-cache");

/**
 * Request persistent storage for the PWA if available.
 * This helps prevent the browser from automatically evicting the cache when disk space is low.
 */
if (typeof navigator !== "undefined" && navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().then((persistent) => {
    if (persistent) {
      console.log("[PWA-Storage] 🛡️ IndexedDB storage is now persistent");
    }
  }).catch(err => {
    console.warn("[PWA-Storage] ⚠️ Failed to request persistent storage:", err);
  });
}

/**
 * Async storage adapter wrapping idb-keyval for TanStack Query persister.
 */
const idbStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const val = await get<string>(key, idbStore);
      if (val) {
        console.log(`[IDB] ✅ Restored cache (${(val.length / 1024).toFixed(1)} KB)`);
      }
      return val ?? null;
    } catch (err) {
      console.error("[IDB] ❌ Failed to read from IndexedDB:", err);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await set(key, value, idbStore);
      console.log(`[IDB] 💾 Saved [${key}] (${(value.length / 1024).toFixed(1)} KB)`);
    } catch (err) {
      // Handle QuotaExceededError or other write failures
      console.error("[IDB] ❌ Failed to write to IndexedDB:", err);

      // If quota exceeded, we might want to clear the storage
      if (err instanceof Error && err.name === 'QuotaExceededError') {
        console.warn("[IDB] ⚠️ Storage quota exceeded. Clearing cache...");
        await del(key, idbStore).catch(() => { });
      }
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await del(key, idbStore);
    } catch (err) {
      console.error("[IDB] ❌ Failed to remove from IndexedDB:", err);
    }
  },
};

/**
 * TanStack Query persister backed by IndexedDB.
 */
export const idbPersister = createAsyncStoragePersister({
  storage: idbStorage,
  key: "unfric-react-query",
  throttleTime: 2000, // Debounce writes more aggressively for mobile battery life
});
