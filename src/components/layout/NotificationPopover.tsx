import { useState, useEffect } from "react";
import { Bell, BellOff, Clock, PenLine, Heart, CheckSquare } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useNotificationPermission } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NotificationSettings {
  notification_diary_prompt: boolean;
  notification_task_reminder: boolean;
  notification_emotion_checkin: boolean;
  reminder_time_diary: string;
  reminder_time_habits: string;
  reminder_time_emotions: string;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  notification_diary_prompt: true,
  notification_task_reminder: true,
  notification_emotion_checkin: true,
  reminder_time_diary: "08:00",
  reminder_time_habits: "08:00",
  reminder_time_emotions: "08:00",
};

const REMINDER_ITEMS = [
  {
    key: "notification_diary_prompt" as const,
    timeKey: "reminder_time_diary" as const,
    label: "Journal",
    icon: PenLine,
  },
  {
    key: "notification_task_reminder" as const,
    timeKey: "reminder_time_habits" as const,
    label: "Habits",
    icon: CheckSquare,
  },
  {
    key: "notification_emotion_checkin" as const,
    timeKey: "reminder_time_emotions" as const,
    label: "Emotions",
    icon: Heart,
  },
];

interface NotificationPopoverProps {
  iconClassName?: string;
}

export function NotificationPopover({ iconClassName }: NotificationPopoverProps) {
  const { permission, supported, requestPermission } = useNotificationPermission();
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);

  // Fetch settings
  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
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
    fetch();
  }, [user]);

  const enabledCount = REMINDER_ITEMS.filter((r) => settings[r.key]).length;

  const handleToggle = async (key: keyof NotificationSettings) => {
    if (!user) return;

    // If enabling and no permission, request it
    if (!settings[key] && permission !== "granted") {
      const result = await requestPermission();
      if (result !== "granted") {
        toast.error("Please allow notifications in your browser settings.");
        return;
      }
    }

    const newVal = !settings[key];
    setSettings((s) => ({ ...s, [key]: newVal }));

    const { error } = await supabase
      .from("user_settings")
      .update({ [key]: newVal })
      .eq("user_id", user.id);

    if (error) {
      setSettings((s) => ({ ...s, [key]: !newVal }));
      toast.error("Failed to update setting.");
    }
  };

  const allEnabled = enabledCount === REMINDER_ITEMS.length;
  const someEnabled = enabledCount > 0 && !allEnabled;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={iconClassName} title="Notifications">
          <div className="relative">
            <Bell className="h-4 w-4" />
            {enabledCount > 0 && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
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
              Reminders
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground">
            {enabledCount}/{REMINDER_ITEMS.length} active
          </span>
        </div>

        <Separator className="bg-border/50" />

        {/* Permission Banner */}
        {supported && permission !== "granted" && (
          <button
            onClick={requestPermission}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-primary hover:bg-primary/5 transition-colors"
          >
            <BellOff className="h-3.5 w-3.5" />
            <span>Enable browser notifications</span>
          </button>
        )}

        {!supported && (
          <div className="px-4 py-2.5 text-xs text-muted-foreground">
            Notifications not supported in this browser.
          </div>
        )}

        {/* Reminder Toggles */}
        <div className="py-1">
          {REMINDER_ITEMS.map((item) => {
            const Icon = item.icon;
            const enabled = settings[item.key] as boolean;
            return (
              <div
                key={item.key}
                className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={cn("h-3.5 w-3.5", enabled ? "text-primary" : "text-muted-foreground")} />
                  <div>
                    <span className="text-xs font-medium text-foreground">{item.label}</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">
                        {settings[item.timeKey] as string}
                      </span>
                    </div>
                  </div>
                </div>
                <Switch
                  checked={enabled}
                  onCheckedChange={() => handleToggle(item.key)}
                  className="scale-75"
                />
              </div>
            );
          })}
        </div>

        <Separator className="bg-border/50" />

        {/* Footer */}
        <div className="px-4 py-2.5 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            Set times in Settings
          </span>
          <a
            href="/settings"
            className="text-[10px] text-primary hover:underline"
          >
            Open Settings
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}
