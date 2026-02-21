import { useEffect, useRef } from "react";
import { useOnlineStatus } from "./useOnlineStatus";
import { flushOutbox, getOutbox } from "@/lib/offlineOutbox";
import { queryClient } from "@/lib/queryClient";
import { toast } from "sonner";

/**
 * Watches connectivity and flushes the IndexedDB outbox when back online.
 * Also invalidates React Query cache so stale data gets refreshed.
 * Mount once at the app root level.
 */
export function useOfflineSync() {
  const isOnline = useOnlineStatus();
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      return;
    }

    if (wasOffline.current) {
      wasOffline.current = false;

      // Flush outbox
      getOutbox().then((queue) => {
        if (queue.length > 0) {
          flushOutbox().then(({ synced, failed }) => {
            if (synced > 0) {
              toast.success(`Synced ${synced} offline change${synced > 1 ? "s" : ""}`);
            }
            if (failed > 0) {
              toast.error(`${failed} change${failed > 1 ? "s" : ""} failed to sync`);
            }
            // Invalidate all queries to get fresh data
            queryClient.invalidateQueries();
          });
        } else {
          // No outbox items, but still refresh stale data
          queryClient.invalidateQueries();
        }
      });
    }
  }, [isOnline]);
}
