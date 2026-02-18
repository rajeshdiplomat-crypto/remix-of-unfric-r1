import { supabase } from "@/integrations/supabase/client";

const QUEUE_KEY = "unfric_offline_queue";

export interface QueuedOperation {
  id: string;
  table: string;
  operation: "insert" | "update" | "upsert";
  data: Record<string, any>;
  timestamp: number;
}

export function enqueueOfflineOperation(op: Omit<QueuedOperation, "id" | "timestamp">) {
  const queue = getQueue();
  queue.push({
    ...op,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function getQueue(): QueuedOperation[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

export async function flushOfflineQueue(): Promise<{ synced: number; failed: number }> {
  const queue = getQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;
  const remaining: QueuedOperation[] = [];

  for (const op of queue) {
    try {
      let result;
      const tableName = op.table as any;

      if (op.operation === "insert") {
        result = await (supabase.from(tableName) as any).insert(op.data);
      } else if (op.operation === "update") {
        const { id, ...rest } = op.data;
        result = await (supabase.from(tableName) as any).update(rest).eq("id", id);
      } else if (op.operation === "upsert") {
        result = await (supabase.from(tableName) as any).upsert(op.data);
      }

      if (result?.error) {
        console.warn("[OfflineQueue] Sync error:", result.error);
        remaining.push(op);
        failed++;
      } else {
        synced++;
      }
    } catch (err) {
      console.warn("[OfflineQueue] Network error:", err);
      remaining.push(op);
      failed++;
    }
  }

  if (remaining.length > 0) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  } else {
    clearQueue();
  }

  return { synced, failed };
}
