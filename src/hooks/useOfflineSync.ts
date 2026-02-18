import { useEffect, useRef } from "react";
import { useOnlineStatus } from "./useOnlineStatus";
import { flushOfflineQueue, getQueue } from "@/lib/offlineQueue";
import { toast } from "sonner";

/**
 * Automatically flushes the offline queue when connectivity is restored.
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

    // If we just came back online and have queued operations, flush them
    if (wasOffline.current) {
      wasOffline.current = false;
      const queue = getQueue();
      if (queue.length > 0) {
        flushOfflineQueue().then(({ synced, failed }) => {
          if (synced > 0) {
            toast.success(`Synced ${synced} offline change${synced > 1 ? "s" : ""}`);
          }
          if (failed > 0) {
            toast.error(`${failed} change${failed > 1 ? "s" : ""} failed to sync`);
          }
        });
      }
    }
  }, [isOnline]);
}
