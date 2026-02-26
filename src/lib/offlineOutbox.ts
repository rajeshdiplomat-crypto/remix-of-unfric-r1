import { get, set, createStore } from "idb-keyval";
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
}

/** Read all pending operations from IndexedDB */
export async function getOutbox(): Promise<OutboxOperation[]> {
  try {
    const ops = await get<OutboxOperation[]>(OUTBOX_KEY, outboxStore);
    return ops ?? [];
  } catch {
    return [];
  }
}

/** Add an operation to the outbox */
export async function enqueueOutbox(
  op: Omit<OutboxOperation, "id" | "timestamp">,
): Promise<void> {
  const queue = await getOutbox();
  queue.push({
    ...op,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  });
  await set(OUTBOX_KEY, queue, outboxStore);
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
