import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useTimezone() {
  const [timezone, setTimezone] = useState<string>(Intl.DateTimeFormat().resolvedOptions().timeZone);

  useEffect(() => {
    const fetchTimezone = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.from("user_settings").select("timezone").eq("user_id", user.id).single();

      if (data?.timezone) {
        setTimezone(data.timezone);
      }
    };

    fetchTimezone();
  }, []);

  const getTimeInTimezone = useCallback(
    (date: Date) => {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      };

      const parts = new Intl.DateTimeFormat("en-US", options).formatToParts(date);

      return {
        hours: parseInt(parts.find((p) => p.type === "hour")?.value || "0"),
        minutes: parseInt(parts.find((p) => p.type === "minute")?.value || "0"),
        seconds: parseInt(parts.find((p) => p.type === "second")?.value || "0"),
      };
    },
    [timezone],
  );

  const formatInTimezone = useCallback(
    (date: Date, options: Intl.DateTimeFormatOptions) => {
      return new Intl.DateTimeFormat("en-US", { ...options, timeZone: timezone }).format(date);
    },
    [timezone],
  );

  return { timezone, getTimeInTimezone, formatInTimezone };
}
