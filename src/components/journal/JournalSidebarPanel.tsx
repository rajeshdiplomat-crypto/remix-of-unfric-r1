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
}

export const JournalSidebarPanel = memo(function JournalSidebarPanel({
  selectedDate,
  onDateSelect,
  entries,
  onInsertPrompt,
  skin,
  showSection = "all",
}: JournalSidebarPanelProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dailyPrompt, setDailyPrompt] = useState(() => DAILY_PROMPTS[Math.floor(Math.random() * DAILY_PROMPTS.length)]);

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const entriesDates = useMemo(() => new Set(entries.map((e) => e.entryDate)), [entries]);

  const hasEntry = useCallback((date: Date) => entriesDates.has(format(date, "yyyy-MM-dd")), [entriesDates]);

  const recentEntries = useMemo(() => {
    return [...entries].sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()).slice(0, 5);
  }, [entries]);

  const refreshPrompt = useCallback(() => {
    setDailyPrompt(DAILY_PROMPTS[Math.floor(Math.random() * DAILY_PROMPTS.length)]);
  }, []);

  const showCalendar = showSection === "calendar" || showSection === "all";
  const showRecent = showSection === "recent" || showSection === "all";

  return (
    <div className="w-full h-full overflow-auto space-y-4 pb-4">
      {/* Calendar Card - Modern Design */}
      {showCalendar && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-violet-100 rounded-lg">
                <CalendarIcon className="h-4 w-4 text-violet-600" />
              </div>
              <span className="text-sm font-semibold text-slate-800">Calendar</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-slate-500" />
              </button>
              <span className="text-xs font-semibold text-slate-700 min-w-[80px] text-center">
                {format(currentMonth, "MMM yyyy")}
              </span>
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
                        ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md"
                        : isTodayDate
                          ? "bg-violet-50 text-violet-600 ring-1 ring-violet-200"
                          : "hover:bg-slate-100 text-slate-700",
                    )}
                  >
                    {format(day, "d")}
                    {hasEntryOnDay && !isSelected && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-violet-400" />
                    )}
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
              className="w-full mt-3 py-2 text-xs font-medium text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
            >
              Jump to Today
            </button>
          </div>
        </div>
      )}

      {/* Daily Prompt Card */}
      {showCalendar && (
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-100/50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-violet-100/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white rounded-lg shadow-sm">
                <Sparkles className="h-4 w-4 text-violet-500" />
              </div>
              <span className="text-sm font-semibold text-violet-800">Daily Prompt</span>
            </div>
            <button onClick={refreshPrompt} className="p-1.5 hover:bg-white/50 rounded-lg transition-colors">
              <RefreshCw className="h-3.5 w-3.5 text-violet-500" />
            </button>
          </div>
          <div className="p-4">
            <p className="text-sm text-violet-700 italic leading-relaxed mb-3">"{dailyPrompt}"</p>
            <button
              onClick={() => onInsertPrompt(dailyPrompt)}
              className="w-full py-2 px-4 bg-white text-violet-600 text-xs font-semibold rounded-xl border border-violet-200 hover:bg-violet-50 transition-colors shadow-sm"
            >
              Use This Prompt
            </button>
          </div>
        </div>
      )}

      {/* Recent Entries Card */}
      {showRecent && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-50">
            <div className="p-1.5 bg-emerald-100 rounded-lg">
              <BookOpen className="h-4 w-4 text-emerald-600" />
            </div>
            <span className="text-sm font-semibold text-slate-800">Recent Entries</span>
          </div>
          <div className="p-2">
            {recentEntries.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No entries yet. Start writing!</p>
            ) : (
              <div className="space-y-1">
                {recentEntries.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => onDateSelect(new Date(entry.entryDate))}
                    className={cn(
                      "w-full text-left p-2.5 rounded-xl hover:bg-slate-50 transition-colors group",
                      isSameDay(new Date(entry.entryDate), selectedDate) && "bg-violet-50",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          entry.mood === "great"
                            ? "bg-emerald-400"
                            : entry.mood === "good"
                              ? "bg-blue-400"
                              : entry.mood === "okay"
                                ? "bg-amber-400"
                                : entry.mood === "low"
                                  ? "bg-rose-400"
                                  : "bg-slate-300",
                        )}
                      />
                      <span className="text-xs font-medium text-slate-700 truncate flex-1">
                        {entry.title || "Untitled"}
                      </span>
                      <span className="text-[10px] text-slate-400">{format(new Date(entry.entryDate), "MMM d")}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
