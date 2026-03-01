
/**
 * Shared utility for notification and reminder logic across the app.
 * Consolidates time-checking and persistence logic.
 */

export interface NotificationConfig {
    title: string;
    body: string;
    tag: string;
    route: string;
}

export const NOTIFICATION_CONFIGS: Record<string, NotificationConfig> = {
    diary: {
        title: "📝 Journal Reminder",
        body: "Time to write in your journal. A few minutes of reflection goes a long way.",
        tag: "unfric-diary",
        route: "/journal",
    },
    habits: {
        title: "✅ Habit Check-in",
        body: "Don't forget to check in on your habits today!",
        tag: "unfric-habits",
        route: "/habits",
    },
    emotions: {
        title: "💛 Emotion Check-in",
        body: "How are you feeling right now? Take a moment to log your emotions.",
        tag: "unfric-emotions",
        route: "/emotions",
    },
};

/** 
 * Returns true if the current time is exactly (or within 5 min after) the reminder time.
 * Used for firing the actual browser notification.
 */
export function isTimeToNotify(reminderTime: string): boolean {
    if (!reminderTime) return false;
    const now = new Date();
    const [targetH, targetM] = reminderTime.split(":").map(Number);
    const nowH = now.getHours();
    const nowM = now.getMinutes();

    const targetMinutes = targetH * 60 + targetM;
    const nowMinutes = nowH * 60 + nowM;

    // Note: We use a 5-minute window to ensure the 60s check doesn't miss it,
    // but wasSentToday will prevent multiple fires.
    return nowMinutes >= targetMinutes && nowMinutes < targetMinutes + 5;
}

/** 
 * Returns true if the reminder time has already passed today.
 * Used for showing the "Pending" dot in the UI Popover.
 */
export function hasTimePassed(timeStr: string): boolean {
    if (!timeStr) return false;
    const now = new Date();
    const [h, m] = timeStr.split(":").map(Number);
    return now.getHours() * 60 + now.getMinutes() >= h * 60 + m;
}

/**
 * Persistence keys and helpers for tracking notification state.
 * 'sent' = browser notification was fired.
 * 'seen' = user dismissed the dot in the UI Popover.
 */

function getTodayString(): string {
    return new Date().toISOString().split("T")[0];
}

export function wasSentToday(type: string): boolean {
    return localStorage.getItem(`unfric_notif_sent_${type}_${getTodayString()}`) === "1";
}

export function markSentToday(type: string): void {
    localStorage.setItem(`unfric_notif_sent_${type}_${getTodayString()}`, "1");
}

export function wasSeenToday(type: string): boolean {
    return localStorage.getItem(`unfric_notif_seen_${type}_${getTodayString()}`) === "1";
}

export function markSeenToday(type: string): void {
    localStorage.setItem(`unfric_notif_seen_${type}_${getTodayString()}`, "1");
}

export function clearSentToday(type: string): void {
    localStorage.removeItem(`unfric_notif_sent_${type}_${getTodayString()}`);
}

/** 
 * Clean up old localStorage keys from previous days 
 */
export function cleanOldNotificationKeys(): void {
    const today = getTodayString();
    const prefixes = ["unfric_notif_sent_", "unfric_notif_seen_"];

    for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (!key) continue;

        const isOurKey = prefixes.some(p => key.startsWith(p));
        if (isOurKey && !key.endsWith(today)) {
            localStorage.removeItem(key);
        }
    }
}

/**
 * Native Browser Notification wrapper
 */
export function sendBrowserNotification(type: string): void {
    const config = NOTIFICATION_CONFIGS[type];
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
            if (config.route) {
                window.location.href = config.route;
            }
        };

        markSentToday(type);
    } catch (e) {
        console.warn("[Notifications] Failed to send:", e);
    }
}
