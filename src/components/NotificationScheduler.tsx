import { useNotificationScheduler } from "@/hooks/useNotifications";

/**
 * Invisible component that runs the notification scheduler.
 * Placed inside AuthProvider so it has access to the user.
 */
export function NotificationScheduler() {
  useNotificationScheduler();
  return null;
}
