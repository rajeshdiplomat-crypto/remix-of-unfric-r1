import { get, set, createStore, update } from "idb-keyval";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * IndexedDB-backed outbox for offline write operations.
 * When the user performs a mutation while offline, we store it here.
 * On reconnect, we flush the outbox and push changes to Supabase.
 */

const outboxStore = createStore("unfric-outbox", "pending-ops");
const OUTBOX_KEY = "pending_operations";

export interface OutboxOperation {
  id: string;
  table: string;
  operation: "insert" | "update" | "upsert" | "delete";
  data: Record<string, any>;
  timestamp: number;
  retryCount?: number;
  lastError?: string;
}

/**
 * Request persistent storage for the PWA
 */
async function requestPersistence() {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      if (import.meta.env.DEV) {
        console.log(`[Outbox] Storage persisted: ${isPersisted}`);
      }
    } catch (err) {
      console.warn("[Outbox] Persistence request failed:", err);
    }
  }
}

// Trigger persistence on load
requestPersistence();

/** Read all pending operations from IndexedDB */
export async function getOutbox(): Promise<OutboxOperation[]> {
  try {
    const ops = await get<OutboxOperation[]>(OUTBOX_KEY, outboxStore);
    return ops ?? [];
  } catch {
    return [];
  }
}

/** Add an operation to the outbox with atomic squashing */
export async function enqueueOutbox(
  op: Omit<OutboxOperation, "id" | "timestamp">,
): Promise<void> {
  await update(OUTBOX_KEY, (val) => {
    const queue = (val as OutboxOperation[]) ?? [];

    // --- Squashing Logic ---
    // If we're updating the same record, merge the changes instead of adding a new entry
    if (op.operation === "update" && op.data.id) {
      const existingIdx = queue.findIndex(item =>
        item.table === op.table &&
        item.operation === "update" &&
        item.data.id === op.data.id
      );

      if (existingIdx !== -1) {
        queue[existingIdx].data = { ...queue[existingIdx].data, ...op.data };
        queue[existingIdx].timestamp = Date.now();
        return queue;
      }
    }

    // --- Append new operation ---
    queue.push({
      ...op,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0
    });
    return queue;
  }, outboxStore);
}

/** Clear the outbox */
async function clearOutbox(): Promise<void> {
  await set(OUTBOX_KEY, [], outboxStore);
}

/**
 * Flush all pending operations to Supabase.
 * Called automatically when connectivity is restored.
 */
export async function flushOutbox(): Promise<{ synced: number; failed: number }> {
  const queue = await getOutbox();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  try {
    const { data: res, error } = await supabase.functions.invoke("sync-offline", {
      body: { operations: queue }
    });

    if (error) {
      console.warn("[Outbox] Network error invoking sync-offline:", error);
      return { synced: 0, failed: queue.length };
    }

    const { synced = 0, failed = queue.length, remaining = queue } = res?.data || {};

    // Save remaining operations back to outbox
    await set(OUTBOX_KEY, remaining, outboxStore);

    return { synced, failed };
  } catch (err) {
    console.warn("[Outbox] Network error:", err);
    return { synced: 0, failed: queue.length };
  }
}

/**
 * Check if a network error occurred or if the browser is currently offline.
 */
export function isOfflineError(error?: any): boolean {
  // 1. Check if navigator says we are offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;

  // 2. Check if the error itself indicates a connection failure
  if (error) {
    const errorMsg = String(error.message || "").toLowerCase();
    const isNetworkError =
      errorMsg.includes("network error") ||
      errorMsg.includes("failed to fetch") ||
      errorMsg.includes("load failed") ||
      error.status === 0 || // 0 usually means CORS or Network failure
      error.code === "PGRST301" || // Postgrest connection error
      errorMsg.includes("timeout");

    if (isNetworkError) return true;
  }

  return false;
}
