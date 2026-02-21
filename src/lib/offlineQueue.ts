/**
 * @deprecated — Use src/lib/offlineOutbox.ts instead.
 * This file is kept empty to avoid breaking stale imports.
 */

export interface QueuedOperation {
  id: string;
  table: string;
  operation: "insert" | "update" | "upsert";
  data: Record<string, any>;
  timestamp: number;
}

export function enqueueOfflineOperation(_op: Omit<QueuedOperation, "id" | "timestamp">) {
  // No-op — replaced by offlineOutbox.ts (IndexedDB)
  console.warn("[offlineQueue] Deprecated. Use offlineOutbox instead.");
}

export function getQueue(): QueuedOperation[] {
  return [];
}

export function clearQueue() {}

export async function flushOfflineQueue(): Promise<{ synced: number; failed: number }> {
  return { synced: 0, failed: 0 };
}
