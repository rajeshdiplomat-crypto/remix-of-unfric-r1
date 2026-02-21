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

/**
 * Wraps a Supabase insert with offline fallback.
 * When offline, queues the operation for later sync.
 */
export async function offlineAwareInsert(
  table: string,
  data: Record<string, any>,
  options?: OfflineOptions
): Promise<{ offline: boolean; error: any | null; data?: any }> {
  if (!navigator.onLine) {
    enqueueOfflineOperation({ table, operation: "insert", data });
    toast.info(options?.offlineMessage || "Saved offline — will sync when connected");
    return { offline: true, error: null };
  }

  const { data: result, error } = await (supabase.from(table as any) as any).insert(data).select().single();
  if (error) {
    if (!options?.silent) toast.error(options?.errorMessage || "Failed to save");
    return { offline: false, error };
  }
  if (options?.successMessage) toast.success(options.successMessage);
  return { offline: false, error: null, data: result };
}

/**
 * Wraps a Supabase update with offline fallback.
 * Data must include `id` for the offline queue to work correctly.
 */
export async function offlineAwareUpdate(
  table: string,
  id: string,
  data: Record<string, any>,
  options?: OfflineOptions
): Promise<{ offline: boolean; error: any | null }> {
  if (!navigator.onLine) {
    enqueueOfflineOperation({ table, operation: "update", data: { id, ...data } });
    toast.info(options?.offlineMessage || "Saved offline — will sync when connected");
    return { offline: true, error: null };
  }

  const { error } = await (supabase.from(table as any) as any).update(data).eq("id", id);
  if (error) {
    if (!options?.silent) toast.error(options?.errorMessage || "Failed to save");
    return { offline: false, error };
  }
  if (options?.successMessage) toast.success(options.successMessage);
  return { offline: false, error: null };
}

/**
 * Wraps a Supabase upsert with offline fallback.
 */
export async function offlineAwareUpsert(
  table: string,
  data: Record<string, any>,
  options?: OfflineOptions & { onConflict?: string }
): Promise<{ offline: boolean; error: any | null }> {
  if (!navigator.onLine) {
    enqueueOfflineOperation({ table, operation: "upsert", data });
    toast.info(options?.offlineMessage || "Saved offline — will sync when connected");
    return { offline: true, error: null };
  }

  const query = (supabase.from(table as any) as any).upsert(data, options?.onConflict ? { onConflict: options.onConflict } : undefined);
  const { error } = await query;
  if (error) {
    if (!options?.silent) toast.error(options?.errorMessage || "Failed to save");
    return { offline: false, error };
  }
  if (options?.successMessage) toast.success(options.successMessage);
  return { offline: false, error: null };
}

/**
 * Check if we're offline and show a neutral message instead of an error toast.
 * Returns true if offline (caller should skip the error toast).
 */
export function isOfflineError(): boolean {
  return !navigator.onLine;
}
