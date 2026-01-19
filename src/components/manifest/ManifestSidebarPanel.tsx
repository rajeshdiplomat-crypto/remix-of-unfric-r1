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
  parseISO,
} from "date-fns";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Sparkles,
  ArrowLeftToLine,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type ManifestGoal, type ManifestDailyPractice } from "./types";

interface ManifestSidebarPanelProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  goals: ManifestGoal[];
  practices: ManifestDailyPractice[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const ManifestSidebarPanel = memo(
  ({
    selectedDate,
    onDateSelect,
    goals,
    practices,
    isCollapsed = false,
    onToggleCollapse,
  }: ManifestSidebarPanelProps) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const daysInMonth = useMemo(() => {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    // Get dates with practice entries
    const practiceDates = useMemo(() => {
      const dates = new Set<string>();
      practices.forEach((p) => {
        if (p.locked) {
          dates.add(p.entry_date);
        }
      });
      return dates;
    }, [practices]);

    const hasPractice = useCallback(
      (date: Date) => practiceDates.has(format(date, "yyyy-MM-dd")),
      [practiceDates]
    );

    // Recent practices for display
    const recentPractices = useMemo(() => {
      return [...practices]
        .filter((p) => p.locked)
        .sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime())
        .slice(0, 5);
    }, [practices]);

    // Get goal title by id
    const getGoalTitle = (goalId: string) => {
      const goal = goals.find((g) => g.id === goalId);
      return goal?.title || "Unknown Vision";
    };

    if (isCollapsed) {
      return (
        <div className="flex flex-col items-center py-4">
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-xl shadow-sm border transition-colors bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            title="Expand panel"
          >
            <PanelLeft className="h-5 w-5 text-slate-500" />
          </button>
        </div>
      );
    }

    return (
      <div className="w-full h-full overflow-auto space-y-4 pb-4">
        {/* Calendar Card */}
        <div className="rounded-2xl shadow-sm border overflow-hidden bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              {onToggleCollapse && (
                <button
                  onClick={onToggleCollapse}
                  className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                  title="Collapse panel"
                >
                  <ArrowLeftToLine className="h-4 w-4 text-slate-400" />
                </button>
              )}
              <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-900/30">
                <CalendarIcon className="h-4 w-4 text-teal-600" />
              </div>
              <span className="text-sm font-semibold text-slate-800 dark:text-white">Calendar</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-slate-500" />
              </button>
              <div className="flex items-center gap-0.5">
                <select
                  value={getMonth(currentMonth)}
                  onChange={(e) => setCurrentMonth(setMonthDate(currentMonth, parseInt(e.target.value)))}
                  className="bg-transparent text-[11px] font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer hover:text-teal-600 appearance-none text-center"
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
                  className="bg-transparent text-[11px] font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer hover:text-teal-600 appearance-none text-center"
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
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-3">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                <div key={i} className="text-[10px] font-semibold text-slate-400 text-center py-1">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: daysInMonth[0].getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {daysInMonth.map((day) => {
                const isSelected = isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);
                const hasPracticeOnDay = hasPractice(day);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => onDateSelect(day)}
                    className={cn(
                      "aspect-square rounded-lg text-xs font-medium transition-all relative flex items-center justify-center",
                      isSelected
                        ? "bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-md"
                        : hasPracticeOnDay
                          ? "bg-teal-50 text-teal-700 ring-1 ring-teal-200 hover:bg-teal-100 dark:bg-teal-900/30 dark:text-teal-300 dark:ring-teal-800"
                          : isTodayDate
                            ? "bg-cyan-50 text-cyan-600 ring-1 ring-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300"
                            : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    {format(day, "d")}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                onDateSelect(new Date());
                setCurrentMonth(new Date());
              }}
              className="w-full mt-3 py-2 text-xs font-medium text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
            >
              Jump to Today
            </button>
          </div>
        </div>

        {/* Recent Practices Card */}
        <div className="rounded-2xl shadow-sm border overflow-hidden bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
              <Sparkles className="h-4 w-4 text-emerald-600" />
            </div>
            <span className="text-sm font-semibold text-slate-800 dark:text-white">Recent Practices</span>
          </div>
          <div className="p-2">
            {recentPractices.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                No completed practices yet. Start manifesting!
              </p>
            ) : (
              <div className="space-y-1">
                {recentPractices.map((practice) => (
                  <button
                    key={practice.id}
                    onClick={() => onDateSelect(parseISO(practice.entry_date))}
                    className={cn(
                      "w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors",
                      isSameDay(parseISO(practice.entry_date), selectedDate) && "bg-teal-50 dark:bg-teal-900/20"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0" />
                      <span className="text-[10px] text-slate-500">
                        {format(parseISO(practice.entry_date), "MMM d")}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-snug line-clamp-1">
                      {getGoalTitle(practice.goal_id)}
                    </h4>
                    {practice.growth_note && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mt-0.5">
                        {practice.growth_note}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);
