import { supabase } from "@/integrations/supabase/client";
import { enqueueOfflineOperation } from "./offlineQueue";
import { toast } from "sonner";

interface OfflineOptions {
  successMessage?: string;
  offlineMessage?: string;
  errorMessage?: string;
  /** If true, suppress the error toast (useful for fetch operations) */
  silent?: boolean;
}

// ─── Fetch (read) ────────────────────────────────────────────────────
/**
 * Wraps any async fetch. When offline, resolves with `{ data: null, offline: true }`
 * silently — no error toast, no throw.
 */
export async function offlineAwareFetch<T>(
  fetchFn: () => Promise<{ data: T | null; error: any }>,
  options?: OfflineOptions,
): Promise<{ data: T | null; offline: boolean; error: any | null }> {
  if (!navigator.onLine) {
    return { data: null, offline: true, error: null };
  }

  try {
    const { data, error } = await fetchFn();
    if (error) {
      // Could have gone offline mid-request
      if (!navigator.onLine) return { data: null, offline: true, error: null };
      if (!options?.silent) console.error("[offlineAwareFetch]", error);
      return { data: null, offline: false, error };
    }
    return { data, offline: false, error: null };
  } catch (err) {
    if (!navigator.onLine) return { data: null, offline: true, error: null };
    if (!options?.silent) console.error("[offlineAwareFetch]", err);
    return { data: null, offline: false, error: err };
  }
}

// ─── Insert ──────────────────────────────────────────────────────────
/**
 * Wraps a Supabase insert with offline fallback.
 * When offline, queues the operation for later sync.
 */
export async function offlineAwareInsert(
  table: string,
  data: Record<string, any>,
  options?: OfflineOptions,
): Promise<{ offline: boolean; error: any | null; data?: any }> {
  if (!navigator.onLine) {
    enqueueOfflineOperation({ table, operation: "insert", data });
    toast.info(options?.offlineMessage || "Saved offline — will sync when connected");
    return { offline: true, error: null };
  }

  const { data: result, error } = await (supabase.from(table as any) as any).insert(data).select().single();
  if (error) {
    if (!navigator.onLine) {
      enqueueOfflineOperation({ table, operation: "insert", data });
      toast.info(options?.offlineMessage || "Saved offline — will sync when connected");
      return { offline: true, error: null };
    }
    if (!options?.silent) toast.error(options?.errorMessage || "Failed to save");
    return { offline: false, error };
  }
  if (options?.successMessage) toast.success(options.successMessage);
  return { offline: false, error: null, data: result };
}

// ─── Update ──────────────────────────────────────────────────────────
/**
 * Wraps a Supabase update with offline fallback.
 * Data must include `id` for the offline queue to work correctly.
 */
export async function offlineAwareUpdate(
  table: string,
  id: string,
  data: Record<string, any>,
  options?: OfflineOptions,
): Promise<{ offline: boolean; error: any | null }> {
  if (!navigator.onLine) {
    enqueueOfflineOperation({ table, operation: "update", data: { id, ...data } });
    toast.info(options?.offlineMessage || "Saved offline — will sync when connected");
    return { offline: true, error: null };
  }

  const { error } = await (supabase.from(table as any) as any).update(data).eq("id", id);
  if (error) {
    if (!navigator.onLine) {
      enqueueOfflineOperation({ table, operation: "update", data: { id, ...data } });
      toast.info(options?.offlineMessage || "Saved offline — will sync when connected");
      return { offline: true, error: null };
    }
    if (!options?.silent) toast.error(options?.errorMessage || "Failed to save");
    return { offline: false, error };
  }
  if (options?.successMessage) toast.success(options.successMessage);
  return { offline: false, error: null };
}

// ─── Upsert ──────────────────────────────────────────────────────────
/**
 * Wraps a Supabase upsert with offline fallback.
 */
export async function offlineAwareUpsert(
  table: string,
  data: Record<string, any>,
  options?: OfflineOptions & { onConflict?: string },
): Promise<{ offline: boolean; error: any | null }> {
  if (!navigator.onLine) {
    enqueueOfflineOperation({ table, operation: "upsert", data });
    toast.info(options?.offlineMessage || "Saved offline — will sync when connected");
    return { offline: true, error: null };
  }

  const query = (supabase.from(table as any) as any).upsert(data, options?.onConflict ? { onConflict: options.onConflict } : undefined);
  const { error } = await query;
  if (error) {
    if (!navigator.onLine) {
      enqueueOfflineOperation({ table, operation: "upsert", data });
      toast.info(options?.offlineMessage || "Saved offline — will sync when connected");
      return { offline: true, error: null };
    }
    if (!options?.silent) toast.error(options?.errorMessage || "Failed to save");
    return { offline: false, error };
  }
  if (options?.successMessage) toast.success(options.successMessage);
  return { offline: false, error: null };
}

// ─── Delete ──────────────────────────────────────────────────────────
/**
 * Wraps a Supabase delete. Deletes cannot be easily queued offline,
 * so we inform the user they need to be online for this action.
 */
export async function offlineAwareDelete(
  table: string,
  id: string,
  options?: OfflineOptions,
): Promise<{ offline: boolean; error: any | null }> {
  if (!navigator.onLine) {
    toast.info("You're offline — deletions require a connection");
    return { offline: true, error: null };
  }

  const { error } = await (supabase.from(table as any) as any).delete().eq("id", id);
  if (error) {
    if (!options?.silent) toast.error(options?.errorMessage || "Failed to delete");
    return { offline: false, error };
  }
  if (options?.successMessage) toast.success(options.successMessage);
  return { offline: false, error: null };
}

// ─── Utility ─────────────────────────────────────────────────────────
/**
 * Check if we're offline. Use in catch blocks to suppress error toasts.
 */
export function isOfflineError(): boolean {
  return !navigator.onLine;
}
