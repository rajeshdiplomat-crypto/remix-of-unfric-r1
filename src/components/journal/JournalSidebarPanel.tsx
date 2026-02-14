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
  compact?: boolean;
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
    compact = false,
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

    const entriesDates = useMemo(() => {
      // Only mark dates that have actual written content (not just empty templates)
      const datesWithContent = entries.filter((e) => {
        if (!e.preview || e.preview.trim() === "") return false;
        // Exclude entries where preview is just the title or empty headings
        const titleOnly = e.title && e.preview.trim() === e.title.trim();
        return !titleOnly;
      });
      return new Set(datesWithContent.map((e) => e.entryDate));
    }, [entries]);

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
            className={cn("rounded-2xl shadow-sm border overflow-hidden", compact && "rounded-xl")}
            style={{
              backgroundColor: skin?.cardBg || "white",
              borderColor: skin?.border || "#f1f5f9",
            }}
          >
            {/* Header */}
            <div
              className={cn("flex items-center justify-between border-b", compact ? "px-2.5 py-1.5" : "px-4 py-3")}
              style={{ borderColor: `${skin?.border}50` || "#f8fafc" }}
            >
              <div className="flex items-center gap-1.5">
                {onToggleCollapse && (
                  <button
                    onClick={onToggleCollapse}
                    className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                    title="Collapse panel"
                  >
                    <ArrowLeftToLine className="h-3.5 w-3.5" style={{ color: skin?.mutedText || "#94a3b8" }} />
                  </button>
                )}
                <span className={cn("font-semibold text-foreground", compact ? "text-xs" : "text-sm")}>
                  {format(currentMonth, "MMM yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-1 hover:bg-muted rounded transition-colors"
                >
                  <ChevronLeft className={cn(compact ? "h-3 w-3" : "h-4 w-4", "text-muted-foreground")} />
                </button>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-1 hover:bg-muted rounded transition-colors"
                >
                  <ChevronRight className={cn(compact ? "h-3 w-3" : "h-4 w-4", "text-muted-foreground")} />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className={cn(compact ? "p-1.5" : "p-3")}>
              <div className="grid grid-cols-7 gap-0">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                  <div key={i} className={cn("text-[9px] font-semibold text-muted-foreground text-center", compact ? "py-0" : "py-0.5")}>
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {Array.from({ length: daysInMonth[0].getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className={cn(compact ? "h-7" : "aspect-square")} />
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
                        "flex items-center justify-center font-medium transition-all relative",
                        compact ? "h-7 w-full text-[10px]" : "aspect-square text-xs",
                        isSelected
                          ? "text-primary font-bold"
                          : isTodayDate
                            ? "text-foreground font-semibold"
                            : hasEntryOnDay
                              ? "text-foreground"
                              : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {format(day, "d")}
                      {hasEntryOnDay && !isSelected && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
                      )}
                      {isSelected && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-3 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  onDateSelect(new Date());
                  setCurrentMonth(new Date());
                }}
                className={cn("w-full text-xs font-medium text-foreground hover:bg-muted rounded-lg transition-colors", compact ? "mt-1 py-1" : "mt-3 py-2")}
              >
                Today
              </button>
            </div>
          </div>
        )}

      </div>
    );
  },
);
