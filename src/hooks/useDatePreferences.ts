import { useState, useEffect, useCallback, useMemo } from "react";
import { format as dateFnsFormat } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export type DateFormatType = "MM/DD" | "DD/MM" | "MM/DD/YYYY" | "DD/MM/YYYY";
export type WeekStartType = "sunday" | "monday";

interface DatePreferences {
  dateFormat: DateFormatType;
  weekStartsOn: 0 | 1;
  /**
   * Format a Date using a semantic pattern key.
   * Keys: "short" → "MMM d" / "d MMM", "full" → "MMM d, yyyy" / "d MMM yyyy",
   *        "weekday" → "EEE, MMM d" / "EEE, d MMM", "weekdayFull" → "EEEE, MMMM d" / "EEEE, d MMMM",
   *        "monthYear" → "MMM yyyy", or pass a raw date-fns pattern.
   */
  formatDate: (date: Date | number, pattern?: string) => string;
  loaded: boolean;
}

/**
 * Maps a semantic key to a date-fns format string, respecting MM/DD vs DD/MM preference.
 */
function resolvePattern(key: string, isDayFirst: boolean): string {
  switch (key) {
    case "short":
      return isDayFirst ? "d MMM" : "MMM d";
    case "full":
      return isDayFirst ? "d MMM yyyy" : "MMM d, yyyy";
    case "weekday":
      return isDayFirst ? "EEE, d MMM" : "EEE, MMM d";
    case "weekdayFull":
      return isDayFirst ? "EEEE, d MMMM" : "EEEE, MMMM d";
    case "monthYear":
      return "MMM yyyy";
    case "dayMonth":
      return isDayFirst ? "d MMM" : "MMM d";
    default:
      // Raw date-fns pattern — return as-is
      return key;
  }
}

export function useDatePreferences(): DatePreferences {
  const [dateFormat, setDateFormat] = useState<DateFormatType>("MM/DD");
  const [weekStart, setWeekStart] = useState<WeekStartType>("monday");
  const [loaded, setLoaded] = useState(false);

  const fetchPrefs = useCallback(async () => {
    try {
      const { data: res, error } = await supabase.functions.invoke("manage-settings", {
        body: { action: "fetch_settings" }
      });
      if (error) throw error;
      const data = res?.data;
      if (data) {
        if (data.date_format) setDateFormat(data.date_format as DateFormatType);
        if (data.start_of_week) setWeekStart(data.start_of_week as WeekStartType);
      }
    } catch (err) {
      console.error("Failed to fetch date preferences:", err);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchPrefs();

    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchPrefs();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const channel = supabase
      .channel("date-pref-changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "user_settings" },
        (payload) => {
          const p = payload.new as any;
          if (p?.date_format) setDateFormat(p.date_format);
          if (p?.start_of_week) setWeekStart(p.start_of_week);
        }
      )
      .subscribe();

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      supabase.removeChannel(channel);
    };
  }, [fetchPrefs]);

  const weekStartsOn = useMemo<0 | 1>(() => (weekStart === "sunday" ? 0 : 1), [weekStart]);

  const isDayFirst = useMemo(() => dateFormat.startsWith("DD"), [dateFormat]);

  const formatDate = useCallback(
    (date: Date | number, pattern: string = "short") => {
      const resolved = resolvePattern(pattern, isDayFirst);
      return dateFnsFormat(date, resolved);
    },
    [isDayFirst],
  );

  return { dateFormat, weekStartsOn, formatDate, loaded };
}
