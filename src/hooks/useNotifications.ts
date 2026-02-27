import { useEffect, useRef, useCallback, useState, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext } from "@/hooks/useAuth";

type NotificationPermissionState = "default" | "granted" | "denied";

interface ReminderSettings {
  notification_diary_prompt: boolean;
  notification_task_reminder: boolean;
  notification_emotion_checkin: boolean;
  daily_reset_time: string;
  reminder_time_diary: string;
  reminder_time_habits: string;
  reminder_time_emotions: string;
}

const SETTINGS_CACHE_KEY = "unfric_reminder_settings";

const NOTIFICATION_TITLES: Record<string, { title: string; body: string; tag: string }> = {
  diary: {
    title: "📝 Journal Reminder",
    body: "Time to write in your journal. A few minutes of reflection goes a long way.",
    tag: "unfric-diary",
  },
  habits: {
    title: "✅ Habit Check-in",
    body: "Don't forget to check in on your habits today!",
    tag: "unfric-habits",
  },
  emotions: {
    title: "💛 Emotion Check-in",
    body: "How are you feeling right now? Take a moment to log your emotions.",
    tag: "unfric-emotions",
  },
};

function getSentKey(type: string): string {
  const today = new Date().toISOString().split("T")[0];
  return `unfric_notif_sent_${type}_${today}`;
}

function wasSentToday(type: string): boolean {
  return localStorage.getItem(getSentKey(type)) === "1";
}

function markSentToday(type: string): void {
  localStorage.setItem(getSentKey(type), "1");
}

function cleanOldKeys(): void {
  const today = new Date().toISOString().split("T")[0];
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith("unfric_notif_sent_") && !key.endsWith(today)) {
      localStorage.removeItem(key);
    }
  }
}

function cacheSettings(settings: ReminderSettings): void {
  try {
    localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn("[Notifications] Failed to cache settings:", e);
  }
}

function loadCachedSettings(): ReminderSettings | null {
  try {
    const raw = localStorage.getItem(SETTINGS_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ReminderSettings;
  } catch {
    return null;
  }
}

function sendNotification(type: string): void {
  const config = NOTIFICATION_TITLES[type];
  if (!config) return;
  if (wasSentToday(type)) return;

  try {
    const notif = new Notification(config.title, {
      body: config.body,
      tag: config.tag,
      icon: "/favicon.png",
      badge: "/favicon.png",
    });
    notif.onclick = () => {
      window.focus();
      const routes: Record<string, string> = {
        diary: "/journal",
        habits: "/habits",
        emotions: "/emotions",
      };
      if (routes[type]) {
        window.location.href = routes[type];
      }
    };
    markSentToday(type);
  } catch (e) {
    console.warn("[Notifications] Failed to send:", e);
  }
}

function isTimeToNotify(reminderTime: string): boolean {
  const now = new Date();
  const [targetH, targetM] = reminderTime.split(":").map(Number);
  const nowH = now.getHours();
  const nowM = now.getMinutes();

  const targetMinutes = targetH * 60 + targetM;
  const nowMinutes = nowH * 60 + nowM;
  return nowMinutes >= targetMinutes && nowMinutes < targetMinutes + 5;
}

function parseSettings(data: any): ReminderSettings {
  return {
    notification_diary_prompt: data.notification_diary_prompt ?? true,
    notification_task_reminder: data.notification_task_reminder ?? true,
    notification_emotion_checkin: data.notification_emotion_checkin ?? true,
    daily_reset_time: data.daily_reset_time ?? "08:00",
    reminder_time_diary: data.reminder_time_diary ?? data.daily_reset_time ?? "08:00",
    reminder_time_habits: data.reminder_time_habits ?? data.daily_reset_time ?? "08:00",
    reminder_time_emotions: data.reminder_time_emotions ?? data.daily_reset_time ?? "08:00",
  };
}

export function useNotificationPermission(): {
  permission: NotificationPermissionState;
  supported: boolean;
  requestPermission: () => Promise<NotificationPermissionState>;
} {
  const [permission, setPermission] = useState<NotificationPermissionState>(
    typeof Notification !== "undefined" ? Notification.permission as NotificationPermissionState : "default"
  );
  const supported = typeof Notification !== "undefined";

  const requestPermission = useCallback(async () => {
    if (!supported) return "denied" as NotificationPermissionState;
    const result = await Notification.requestPermission();
    setPermission(result as NotificationPermissionState);
    return result as NotificationPermissionState;
  }, [supported]);

  return { permission, supported, requestPermission };
}

/**
 * Main hook: runs a 60-second interval that checks if it's time to fire reminders.
 * Caches settings in localStorage so reminders work even when logged out.
 */
export function useNotificationScheduler(): void {
  // Safely access auth context – if rendered outside AuthProvider (e.g. during
  // HMR boundary re-evaluation), fall back gracefully instead of crashing.
  const authContext = useContext(AuthContext);
  const user = authContext?.user ?? null;
  const settingsRef = useRef<ReminderSettings | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch settings from DB when logged in, or load from cache when logged out
  useEffect(() => {
    if (user) {
      // Logged in: fetch from DB and cache
      const fetchSettings = async () => {
        const { data } = await supabase
          .from("user_settings")
          .select("notification_diary_prompt, notification_task_reminder, notification_emotion_checkin, daily_reset_time, reminder_time_diary, reminder_time_habits, reminder_time_emotions")
          .eq("user_id", user.id)
          .maybeSingle();

        if (data) {
          const settings = parseSettings(data);
          settingsRef.current = settings;
          cacheSettings(settings);
        }
      };

      fetchSettings();

      const channel = supabase
        .channel("notif-settings")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "user_settings",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const settings = parseSettings(payload.new);
            settingsRef.current = settings;
            cacheSettings(settings);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      // Logged out: load from cache
      const cached = loadCachedSettings();
      if (cached) {
        settingsRef.current = cached;
      }
    }
  }, [user]);

  // Run checker every 60 seconds
  useEffect(() => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

    cleanOldKeys();

    const check = () => {
      const s = settingsRef.current;
      if (!s) return;

      if (s.notification_diary_prompt && isTimeToNotify(s.reminder_time_diary)) sendNotification("diary");
      if (s.notification_task_reminder && isTimeToNotify(s.reminder_time_habits)) sendNotification("habits");
      if (s.notification_emotion_checkin && isTimeToNotify(s.reminder_time_emotions)) sendNotification("emotions");
    };

    check();
    intervalRef.current = setInterval(check, 60_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user]);
}
