import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/contexts/SettingsContext";
import {
  isTimeToNotify,
  sendBrowserNotification,
  cleanOldNotificationKeys
} from "@/lib/notifications";

/**
 * Hook for managing notification permissions (simplified).
 */
export function useNotificationPermission() {
  const supported = typeof Notification !== "undefined";
  const permission = supported ? Notification.permission : "denied";

  const requestPermission = async () => {
    if (!supported) return "denied";
    const result = await Notification.requestPermission();
    // We don't bother with local state here because the permission changes globally 
    // and usually requires a fresh check or page reload anyway.
    return result;
  };

  return { permission, supported, requestPermission };
}

/**
 * Main hook: runs a 60-second interval that checks if it's time to fire reminders.
 * Now consumes settings from the unified SettingsContext.
 */
export function useNotificationScheduler(): void {
  const { user } = useAuth();
  const { settings, loaded } = useSettings();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Only run if user is logged in, settings are loaded, and browser permissions are granted
    if (!user || !loaded) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

    // Clean up old "sent today" flags from previous days on mount
    cleanOldNotificationKeys();

    const check = () => {
      if (settings.notification_diary_prompt && isTimeToNotify(settings.reminder_time_diary)) {
        sendBrowserNotification("diary");
      }
      if (settings.notification_task_reminder && isTimeToNotify(settings.reminder_time_habits)) {
        sendBrowserNotification("habits");
      }
      if (settings.notification_emotion_checkin && isTimeToNotify(settings.reminder_time_emotions)) {
        sendBrowserNotification("emotions");
      }
    };

    // Initial check
    check();

    // Set up 60s interval
    intervalRef.current = setInterval(check, 60_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, loaded, settings]);
}

