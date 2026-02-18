import { useState, useEffect, useMemo } from "react";
import { Bell, BellOff, Clock, PenLine, Heart, CheckSquare } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useNotificationPermission } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ReminderState {
  notification_diary_prompt: boolean;
  notification_task_reminder: boolean;
  notification_emotion_checkin: boolean;
  reminder_time_diary: string;
  reminder_time_habits: string;
  reminder_time_emotions: string;
}

const DEFAULT_STATE: ReminderState = {
  notification_diary_prompt: true,
  notification_task_reminder: true,
  notification_emotion_checkin: true,
  reminder_time_diary: "08:00",
  reminder_time_habits: "08:00",
  reminder_time_emotions: "08:00",
};

const REMINDERS = [
  {
    enableKey: "notification_diary_prompt" as const,
    timeKey: "reminder_time_diary" as const,
    label: "Journal reminder",
    description: "Time to write in your journal",
    icon: PenLine,
  },
  {
    enableKey: "notification_task_reminder" as const,
    timeKey: "reminder_time_habits" as const,
    label: "Habit check-in",
    description: "Check in on your habits today",
    icon: CheckSquare,
  },
  {
    enableKey: "notification_emotion_checkin" as const,
    timeKey: "reminder_time_emotions" as const,
    label: "Emotion check-in",
    description: "How are you feeling right now?",
    icon: Heart,
  },
];

/** Returns true if the reminder time has passed today */
function hasTimePassed(timeStr: string): boolean {
  const now = new Date();
  const [h, m] = timeStr.split(":").map(Number);
  return now.getHours() * 60 + now.getMinutes() >= h * 60 + m;
}

/** Check if the user has already dismissed/acted on this reminder today */
function wasDismissedToday(type: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  return localStorage.getItem(`unfric_notif_seen_${type}_${today}`) === "1";
}

function markDismissed(type: string): void {
  const today = new Date().toISOString().split("T")[0];
  localStorage.setItem(`unfric_notif_seen_${type}_${today}`, "1");
}

interface NotificationPopoverProps {
  iconClassName?: string;
}

export function NotificationPopover({ iconClassName }: NotificationPopoverProps) {
  const { permission, supported, requestPermission } = useNotificationPermission();
  const { user } = useAuth();
  const [settings, setSettings] = useState<ReminderState>(DEFAULT_STATE);
  const [now, setNow] = useState(Date.now());

  // Refresh every 60s to update pending state
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Fetch settings
  useEffect(() => {
    if (!user) return;
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("user_settings")
        .select("notification_diary_prompt, notification_task_reminder, notification_emotion_checkin, reminder_time_diary, reminder_time_habits, reminder_time_emotions")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setSettings({
          notification_diary_prompt: data.notification_diary_prompt ?? true,
          notification_task_reminder: data.notification_task_reminder ?? true,
          notification_emotion_checkin: data.notification_emotion_checkin ?? true,
          reminder_time_diary: data.reminder_time_diary ?? "08:00",
          reminder_time_habits: data.reminder_time_habits ?? "08:00",
          reminder_time_emotions: data.reminder_time_emotions ?? "08:00",
        });
      }
    };
    fetchSettings();
  }, [user]);

  // Compute pending reminders (enabled + time passed + not dismissed)
  const pendingReminders = useMemo(() => {
    return REMINDERS.filter((r) => {
      const enabled = settings[r.enableKey];
      if (!enabled) return false;
      const time = settings[r.timeKey];
      return hasTimePassed(time) && !wasDismissedToday(r.enableKey);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, now]);

  const upcomingReminders = useMemo(() => {
    return REMINDERS.filter((r) => {
      const enabled = settings[r.enableKey];
      if (!enabled) return false;
      const time = settings[r.timeKey];
      return !hasTimePassed(time);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, now]);

  const hasPending = pendingReminders.length > 0;

  const handleOpenChange = (open: boolean) => {
    // When closing, mark all pending as dismissed
    if (!open && hasPending) {
      pendingReminders.forEach((r) => markDismissed(r.enableKey));
      setNow(Date.now()); // force re-compute
    }
  };

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={iconClassName} title="Notifications">
          <div className="relative">
            <Bell className="h-4 w-4" />
            {hasPending && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
            )}
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-72 p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-foreground/70" />
            <span className="text-xs font-medium uppercase tracking-widest text-foreground/70">
              Notifications
            </span>
          </div>
        </div>

        <Separator className="bg-border/50" />

        {/* Permission Banner */}
        {supported && permission !== "granted" && (
          <>
            <button
              onClick={requestPermission}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-primary hover:bg-primary/5 transition-colors"
            >
              <BellOff className="h-3.5 w-3.5" />
              <span>Enable browser notifications</span>
            </button>
            <Separator className="bg-border/50" />
          </>
        )}

        {/* Pending Reminders */}
        {pendingReminders.length > 0 && (
          <div className="py-1">
            <div className="px-4 py-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-primary">
                Pending
              </span>
            </div>
            {pendingReminders.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.enableKey}
                  className="flex items-start gap-2.5 px-4 py-2.5 hover:bg-muted/40 transition-colors"
                >
                  <div className="mt-0.5 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-3 w-3 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-medium text-foreground block">{item.label}</span>
                    <span className="text-[11px] text-muted-foreground">{item.description}</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">
                        {settings[item.timeKey]}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Upcoming Reminders */}
        {upcomingReminders.length > 0 && (
          <div className="py-1">
            {pendingReminders.length > 0 && <Separator className="bg-border/50 mb-1" />}
            <div className="px-4 py-1.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Upcoming
              </span>
            </div>
            {upcomingReminders.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.enableKey}
                  className="flex items-start gap-2.5 px-4 py-2 hover:bg-muted/40 transition-colors"
                >
                  <div className="mt-0.5 h-6 w-6 rounded-full bg-muted/60 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs text-foreground/80 block">{item.label}</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">
                        {settings[item.timeKey]}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {pendingReminders.length === 0 && upcomingReminders.length === 0 && (
          <div className="px-4 py-6 text-center">
            <Bell className="h-5 w-5 text-muted-foreground/40 mx-auto mb-2" />
            <span className="text-xs text-muted-foreground">No reminders active</span>
          </div>
        )}

        <Separator className="bg-border/50" />

        {/* Footer */}
        <div className="px-4 py-2.5 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            Manage in Settings
          </span>
          <a href="/settings" className="text-[10px] text-primary hover:underline">
            Settings
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}
