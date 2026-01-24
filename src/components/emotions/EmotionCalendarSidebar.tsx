import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { QuadrantType, QUADRANTS, EmotionEntry } from "./types";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useTimezone } from "@/hooks/useTimezone";
import { getTodayInTimezone, getStartOfTodayInTimezone } from "@/lib/formatDate";

interface EmotionCalendarSidebarProps {
  entries: EmotionEntry[];
  onDateClick?: (date: string, entries: EmotionEntry[]) => void;
}

export function EmotionCalendarSidebar({ entries, onDateClick }: EmotionCalendarSidebarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { timezone } = useTimezone();

  const { days, firstDayOfWeek, entriesByDate, today, todayStr } = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    const firstDayOfWeek = start.getDay();

    const entriesByDate: Record<string, EmotionEntry[]> = {};
    entries.forEach((entry) => {
      if (!entriesByDate[entry.entry_date]) entriesByDate[entry.entry_date] = [];
      entriesByDate[entry.entry_date].push(entry);
    });

    // Get today in user's timezone
    const todayStr = getTodayInTimezone(timezone);
    const today = getStartOfTodayInTimezone(timezone);

    return { days, firstDayOfWeek, entriesByDate, today, todayStr };
  }, [currentMonth, entries, timezone]);

  const getDominant = (dayEntries: EmotionEntry[]): QuadrantType | null => {
    if (dayEntries.length === 0) return null;
    const counts: Record<QuadrantType, number> = {
      "high-pleasant": 0,
      "high-unpleasant": 0,
      "low-unpleasant": 0,
      "low-pleasant": 0,
    };
    dayEntries.forEach((e) => e.quadrant && counts[e.quadrant]++);
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as QuadrantType;
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-900/20 dark:to-orange-900/20 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-rose-500" />
          <span className="font-semibold text-sm text-slate-800 dark:text-white">Calendar</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg"
            onClick={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium min-w-[70px] text-center text-slate-600 dark:text-slate-300">
            {format(currentMonth, "MMM yyyy")}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg"
            onClick={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-3">
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="text-center text-[10px] font-medium text-slate-400 py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`e-${i}`} className="h-8" />
          ))}
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const dayEntries = entriesByDate[dateStr] || [];
            const dominant = getDominant(dayEntries);
            const isToday = dateStr === todayStr;
            const isFuture = day > today;

            return (
              <div
                key={dateStr}
                onClick={() => dayEntries.length > 0 && onDateClick?.(dateStr, dayEntries)}
                className={`h-8 rounded-md flex flex-col items-center justify-center text-[11px] font-medium transition-all ${
                  dayEntries.length > 0 ? "cursor-pointer hover:scale-110" : ""
                } ${isToday ? "ring-2 ring-rose-500 ring-offset-1" : ""} ${isFuture ? "opacity-30" : ""}`}
                style={
                  dominant && !isFuture
                    ? { backgroundColor: QUADRANTS[dominant].color, color: "white" }
                    : { backgroundColor: "rgb(241 245 249)" }
                }
              >
                {format(day, "d")}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-700">
          {Object.entries(QUADRANTS).map(([key, info]) => (
            <div key={key} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: info.color }} />
              <span className="text-[9px] text-slate-500">{info.label.split(",")[0]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
