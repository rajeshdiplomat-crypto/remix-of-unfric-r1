import { useMemo, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTimeFormat } from "@/hooks/useTimeFormat";
import { cn } from "@/lib/utils";

interface UnifiedTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  intervalMinutes?: 5 | 10 | 15 | 30 | 60;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
}

export function UnifiedTimePicker({
  value,
  onChange,
  intervalMinutes = 15,
  placeholder: _placeholder,
  className: _className,
  triggerClassName,
}: UnifiedTimePickerProps) {
  const { timeFormat, formatTime } = useTimeFormat();
  const is12h = timeFormat === "12h";

  const parsed = useMemo(() => {
    const [hStr, mStr] = (value || "08:00").split(":");
    const h24 = parseInt(hStr, 10) || 0;
    const m = parseInt(mStr, 10) || 0;
    const period: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
    const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
    return { h24, h12, m, period };
  }, [value]);

  const hours = useMemo(() => {
    if (is12h) {
      return Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i));
    }
    return Array.from({ length: 24 }, (_, i) => i);
  }, [is12h]);

  const minuteOptions = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => i);
  }, []);

  const build24h = useCallback(
    (h: number, m: number, period: "AM" | "PM") => {
      let h24 = h;
      if (is12h) {
        h24 = period === "AM" ? (h === 12 ? 0 : h) : (h === 12 ? 12 : h + 12);
      }
      return `${h24.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    },
    [is12h],
  );

  const displayTime = formatTime(value || "08:00");

  const hourRef = useRef<HTMLDivElement>(null);
  const minRef = useRef<HTMLDivElement>(null);

  const scrollToActive = useCallback(() => {
    setTimeout(() => {
      hourRef.current?.querySelector("[data-active=true]")?.scrollIntoView({ block: "center" });
      minRef.current?.querySelector("[data-active=true]")?.scrollIntoView({ block: "center" });
    }, 50);
  }, []);

  return (
    <Popover onOpenChange={(open) => open && scrollToActive()}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("font-normal tabular-nums", triggerClassName)}
        >
          {displayTime}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2 z-[9999]" align="start">
        <div className="flex gap-1">
          {/* Hours */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Hr</span>
            <ScrollArea className="h-48 w-12">
              <div ref={hourRef} className="flex flex-col gap-0.5 p-0.5">
                {hours.map((h) => {
                  const active = is12h ? h === parsed.h12 : h === parsed.h24;
                  return (
                    <button
                      key={h}
                      data-active={active}
                      onClick={() => onChange(build24h(h, parsed.m, parsed.period))}
                      className={cn(
                        "h-7 w-full rounded text-xs transition-colors",
                        active
                          ? "bg-accent text-accent-foreground font-medium"
                          : "hover:bg-muted text-foreground",
                      )}
                    >
                      {is12h ? h : h.toString().padStart(2, "0")}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Minutes */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Min</span>
            <ScrollArea className="h-48 w-12">
              <div ref={minRef} className="flex flex-col gap-0.5 p-0.5">
                {minuteOptions.map((m) => {
                  const active = m === parsed.m;
                  return (
                    <button
                      key={m}
                      data-active={active}
                      onClick={() => {
                        const h = is12h ? parsed.h12 : parsed.h24;
                        onChange(build24h(h, m, parsed.period));
                      }}
                      className={cn(
                        "h-7 w-full rounded text-xs transition-colors",
                        active
                          ? "bg-accent text-accent-foreground font-medium"
                          : "hover:bg-muted text-foreground",
                      )}
                    >
                      {m.toString().padStart(2, "0")}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* AM/PM */}
          {is12h && (
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">&nbsp;</span>
              <div className="flex flex-col gap-1 pt-0.5">
                {(["AM", "PM"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => onChange(build24h(parsed.h12, parsed.m, p))}
                    className={cn(
                      "h-7 w-10 rounded text-xs transition-colors",
                      p === parsed.period
                        ? "bg-accent text-accent-foreground font-medium"
                        : "hover:bg-muted text-foreground",
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
