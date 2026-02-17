import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type TimeFormatType = "12h" | "24h";

export function useTimeFormat() {
  const [timeFormat, setTimeFormat] = useState<TimeFormatType>("24h");

  useEffect(() => {
    const fetchFormat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("user_settings")
        .select("time_format")
        .eq("user_id", user.id)
        .maybeSingle();
      if ((data as any)?.time_format) {
        setTimeFormat((data as any).time_format as TimeFormatType);
      }
    };
    fetchFormat();
  }, []);

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

  return { timeFormat, formatTime, formatHour };
}
