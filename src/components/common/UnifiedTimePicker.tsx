import { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTimeFormat } from "@/hooks/useTimeFormat";

interface UnifiedTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  intervalMinutes?: 15 | 30 | 60;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
}

/**
 * Unified time picker Select dropdown that respects the global 12h/24h setting.
 * Generates time slots at the specified interval (default 30 min).
 * Value is always stored in 24h "HH:mm" format internally.
 */
export function UnifiedTimePicker({
  value,
  onChange,
  intervalMinutes = 30,
  placeholder = "Select time",
  className,
  triggerClassName,
}: UnifiedTimePickerProps) {
  const { formatTime } = useTimeFormat();

  const slots = useMemo(() => {
    const result: { value: string; label: string }[] = [];
    for (let mins = 0; mins < 1440; mins += intervalMinutes) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      const val = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      result.push({ value: val, label: formatTime(val) });
    }
    return result;
  }, [intervalMinutes, formatTime]);

  return (
    <Select value={value || ""} onValueChange={onChange}>
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder={placeholder}>
          {value ? formatTime(value) : placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className={`max-h-60 z-[9999] ${className || ""}`}>
        {slots.map((slot) => (
          <SelectItem key={slot.value} value={slot.value}>
            {slot.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
