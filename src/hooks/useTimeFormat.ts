import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type TimeFormatType = "12h" | "24h";

export function useTimeFormat() {
  const [timeFormat, setTimeFormat] = useState<TimeFormatType>("24h");
  const [loaded, setLoaded] = useState(false);

  const fetchFormat = useCallback(async () => {
    try {
      const { data: res, error } = await supabase.functions.invoke("manage-settings", {
        body: { action: "fetch_settings" }
      });
      if (error) throw error;
      if (res?.data?.time_format) {
        setTimeFormat(res.data.time_format as TimeFormatType);
      }
    } catch (err) {
      console.error("Failed to fetch time format:", err);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchFormat();

    // Re-fetch when navigating back or switching tabs
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchFormat();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    // Also subscribe to realtime changes on user_settings
    const channel = supabase
      .channel("time-format-changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "user_settings" },
        (payload) => {
          if ((payload.new as any)?.time_format) {
            setTimeFormat((payload.new as any).time_format as TimeFormatType);
          }
        }
      )
      .subscribe();

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      supabase.removeChannel(channel);
    };
  }, [fetchFormat]);

  const formatTime = useCallback(
    (time: string | null): string => {
      if (!time) return "";
      const [h, m] = time.split(":").map(Number);
      if (isNaN(h) || isNaN(m)) return time;
      if (timeFormat === "12h") {
        const period = h >= 12 ? "PM" : "AM";
        const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
      }
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    },
    [timeFormat],
  );

  const formatHour = useCallback(
    (hour: number): string => {
      if (timeFormat === "12h") {
        if (hour === 0) return "12 AM";
        if (hour === 12) return "12 PM";
        return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
      }
      return `${hour.toString().padStart(2, "0")}:00`;
    },
    [timeFormat],
  );

  return { timeFormat, formatTime, formatHour, loaded };
}
