import { useMemo, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTimeFormat } from "@/hooks/useTimeFormat";

interface UnifiedTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  intervalMinutes?: 5 | 10 | 15 | 30 | 60;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
}

/**
 * Unified time picker with separate Hour / Minute / AM-PM selectors.
 * Respects the global 12h/24h setting.
 * Value is always stored in 24h "HH:mm" format internally.
 */
export function UnifiedTimePicker({
  value,
  onChange,
  intervalMinutes = 15,
  placeholder: _placeholder,
  className: _className,
  triggerClassName,
}: UnifiedTimePickerProps) {
  const { timeFormat } = useTimeFormat();
  const is12h = timeFormat === "12h";

  // Parse current value
  const parsed = useMemo(() => {
    const [hStr, mStr] = (value || "08:00").split(":");
    const h24 = parseInt(hStr, 10) || 0;
    const m = parseInt(mStr, 10) || 0;
    const period: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
    const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
    return { h24, h12, m, period };
  }, [value]);

  // Build hour options
  const hours = useMemo(() => {
    if (is12h) {
      return Array.from({ length: 12 }, (_, i) => {
        const v = i === 0 ? 12 : i;
        return { value: v.toString(), label: v.toString() };
      });
    }
    return Array.from({ length: 24 }, (_, i) => ({
      value: i.toString(),
      label: i.toString().padStart(2, "0"),
    }));
  }, [is12h]);

  // Build minute options based on interval
  const minutes = useMemo(() => {
    const result: { value: string; label: string }[] = [];
    for (let m = 0; m < 60; m += intervalMinutes) {
      result.push({ value: m.toString(), label: m.toString().padStart(2, "0") });
    }
    return result;
  }, [intervalMinutes]);

  const buildValue = useCallback(
    (h: number, m: number, period: "AM" | "PM") => {
      let h24 = h;
      if (is12h) {
        if (period === "AM") h24 = h === 12 ? 0 : h;
        else h24 = h === 12 ? 12 : h + 12;
      }
      return `${h24.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    },
    [is12h],
  );

  const onHourChange = (v: string) => {
    const h = parseInt(v, 10);
    onChange(buildValue(h, parsed.m, parsed.period));
  };

  const onMinuteChange = (v: string) => {
    const m = parseInt(v, 10);
    const h = is12h ? parsed.h12 : parsed.h24;
    onChange(buildValue(h, m, parsed.period));
  };

  const onPeriodChange = (v: string) => {
    onChange(buildValue(parsed.h12, parsed.m, v as "AM" | "PM"));
  };

  const selectTriggerBase = `${triggerClassName || ""} h-8 text-xs`;

  return (
    <div className="flex items-center gap-1">
      {/* Hour */}
      <Select value={(is12h ? parsed.h12 : parsed.h24).toString()} onValueChange={onHourChange}>
        <SelectTrigger className={`${selectTriggerBase} w-16`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-52 z-[9999]">
          {hours.map((h) => (
            <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-xs text-muted-foreground font-medium">:</span>

      {/* Minute */}
      <Select value={parsed.m.toString()} onValueChange={onMinuteChange}>
        <SelectTrigger className={`${selectTriggerBase} w-16`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-52 z-[9999]">
          {minutes.map((m) => (
            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* AM/PM (only in 12h mode) */}
      {is12h && (
        <Select value={parsed.period} onValueChange={onPeriodChange}>
          <SelectTrigger className={`${selectTriggerBase} w-16`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[9999]">
            <SelectItem value="AM">AM</SelectItem>
            <SelectItem value="PM">PM</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
