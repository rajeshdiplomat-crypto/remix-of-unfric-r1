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

  let synced = 0;
  let failed = 0;
  const remaining: OutboxOperation[] = [];

  for (const op of queue) {
    try {
      let result: any;
      const tableName = op.table as any;

      switch (op.operation) {
        case "insert":
          result = await (supabase.from(tableName) as any).insert(op.data);
          break;
        case "update": {
          const { id, ...rest } = op.data;
          result = await (supabase.from(tableName) as any).update(rest).eq("id", id);
          break;
        }
        case "upsert":
          result = await (supabase.from(tableName) as any).upsert(op.data);
          break;
        case "delete":
          result = await (supabase.from(tableName) as any).delete().eq("id", op.data.id);
          break;
      }

      if (result?.error) {
        console.warn("[Outbox] Sync error:", result.error);
        remaining.push(op);
        failed++;
      } else {
        synced++;
      }
    } catch (err) {
      console.warn("[Outbox] Network error:", err);
      remaining.push(op);
      failed++;
    }
  }

  await set(OUTBOX_KEY, remaining, outboxStore);
  return { synced, failed };
}
