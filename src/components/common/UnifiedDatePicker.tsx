import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface UnifiedDatePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  /** Label shown when no date selected */
  placeholder?: string;
  /** Format string for displaying the date (date-fns) */
  displayFormat?: string;
  /** Disable dates matching this predicate */
  disabledDates?: (date: Date) => boolean;
  /** Popover alignment */
  align?: "start" | "center" | "end";
  /** Additional class for the trigger button */
  triggerClassName?: string;
  /** Icon to use instead of CalendarIcon */
  icon?: React.ReactNode;
}

/**
 * Unified date picker used across the entire app.
 * Automatically closes the popover when a date is selected.
 */
export function UnifiedDatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  displayFormat = "MMM d, yyyy",
  disabledDates,
  align = "start",
  triggerClassName,
  icon,
}: UnifiedDatePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal gap-2",
            !value && "text-muted-foreground",
            triggerClassName,
          )}
        >
          {icon || <CalendarIcon className="h-4 w-4 shrink-0" />}
          {value ? format(value, displayFormat) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-[9999]" align={align}>
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange(date);
            setOpen(false);
          }}
          disabled={disabledDates}
          initialFocus
          className="pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}
