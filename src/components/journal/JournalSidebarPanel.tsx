import { useState, useMemo, useCallback, memo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  getMonth,
  getYear,
  setMonth as setMonthDate,
  setYear as setYearDate,
} from "date-fns";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Calendar as CalendarIcon,
  BookOpen,
  Clock,
  ArrowLeftToLine,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { JournalEntry, DAILY_PROMPTS, JournalSkin } from "./types";

interface JournalSidebarPanelProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  entries: JournalEntry[];
  onInsertPrompt: (prompt: string) => void;
  skin?: JournalSkin;
  showSection?: "calendar" | "recent" | "all";
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  searchQuery?: string;
}

export const JournalSidebarPanel = memo(
  ({
    selectedDate,
    onDateSelect,
    entries,
    onInsertPrompt,
    skin,
    showSection = "all",
    isCollapsed = false,
    onToggleCollapse,
    searchQuery = "",
  }: JournalSidebarPanelProps) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [dailyPrompt, setDailyPrompt] = useState(
      () => DAILY_PROMPTS[Math.floor(Math.random() * DAILY_PROMPTS.length)],
    );

    const daysInMonth = useMemo(() => {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    const entriesDates = useMemo(() => new Set(entries.map((e) => e.entryDate)), [entries]);

    const hasEntry = useCallback((date: Date) => entriesDates.has(format(date, "yyyy-MM-dd")), [entriesDates]);

    const recentEntries = useMemo(() => {
      let filtered = [...entries];
      // Filter by search query if provided
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (e) =>
            (e.title && e.title.toLowerCase().includes(query)) ||
            (e.preview && e.preview.toLowerCase().includes(query)),
        );
      }
      return filtered.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()).slice(0, 5);
    }, [entries, searchQuery]);

    const refreshPrompt = useCallback(() => {
      setDailyPrompt(DAILY_PROMPTS[Math.floor(Math.random() * DAILY_PROMPTS.length)]);
    }, []);

    // Left panel shows calendar only
    const showCalendar = showSection === "calendar" || showSection === "all";

    // Collapsed state - show only toggle button
    if (isCollapsed) {
      return (
        <div className="flex flex-col items-center py-4">
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-xl shadow-sm border transition-colors"
            style={{
              backgroundColor: skin?.cardBg || "white",
              borderColor: skin?.border || "#f1f5f9",
            }}
            title="Expand panel"
          >
            <PanelLeft className="h-5 w-5" style={{ color: skin?.text || "#475569" }} />
          </button>
        </div>
      );
    }

    return (
      <div className="w-full h-full overflow-auto space-y-4 pb-4">
        {/* Calendar Card - Modern Design */}
        {showCalendar && (
          <div
            className="rounded-2xl shadow-sm border overflow-hidden"
            style={{
              backgroundColor: skin?.cardBg || "white",
              borderColor: skin?.border || "#f1f5f9",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: `${skin?.border}50` || "#f8fafc" }}
            >
              <div className="flex items-center gap-2">
                {/* Collapse button integrated into header */}
                {onToggleCollapse && (
                  <button
                    onClick={onToggleCollapse}
                    className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                    title="Collapse panel"
                  >
                    <ArrowLeftToLine className="h-4 w-4" style={{ color: skin?.mutedText || "#94a3b8" }} />
                  </button>
                )}
                <div className="p-1.5 rounded-lg bg-muted">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-sm font-semibold text-foreground">
                  Calendar
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 text-slate-500" />
                </button>
                <div className="flex items-center gap-0.5">
                  <select
                    value={getMonth(currentMonth)}
                    onChange={(e) => setCurrentMonth(setMonthDate(currentMonth, parseInt(e.target.value)))}
                    className="bg-transparent text-[11px] font-bold text-slate-700 focus:outline-none cursor-pointer hover:text-violet-600 appearance-none text-center"
                  >
                    {Array.from({ length: 12 }).map((_, i) => (
                      <option key={i} value={i}>
                        {format(new Date(2000, i, 1), "MMM")}
                      </option>
                    ))}
                  </select>
                  <select
                    value={getYear(currentMonth)}
                    onChange={(e) => setCurrentMonth(setYearDate(currentMonth, parseInt(e.target.value)))}
                    className="bg-transparent text-[11px] font-bold text-slate-700 focus:outline-none cursor-pointer hover:text-violet-600 appearance-none text-center"
                  >
                    {Array.from({ length: 21 }).map((_, i) => {
                      const year = getYear(new Date()) - 10 + i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-3">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                  <div key={i} className="text-[10px] font-semibold text-slate-400 text-center py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: daysInMonth[0].getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                {daysInMonth.map((day) => {
                  const isSelected = isSameDay(day, selectedDate);
                  const isTodayDate = isToday(day);
                  const hasEntryOnDay = hasEntry(day);

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => onDateSelect(day)}
                      className={cn(
                        "aspect-square rounded-lg text-xs font-medium transition-all relative flex items-center justify-center",
                      isSelected
                          ? "bg-foreground text-background shadow-sm"
                          : hasEntryOnDay
                            ? "bg-muted text-foreground hover:bg-muted/80"
                            : isTodayDate
                              ? "border border-foreground/30 text-foreground"
                              : "hover:bg-muted text-muted-foreground",
                      )}
                    >
                      {format(day, "d")}
                    </button>
                  );
                })}
              </div>

              {/* Jump to Today */}
              <button
                onClick={() => {
                  onDateSelect(new Date());
                  setCurrentMonth(new Date());
                }}
                className="w-full mt-3 py-2 text-xs font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                Jump to Today
              </button>
            </div>
          </div>
        )}

      </div>
    );
  },
);
