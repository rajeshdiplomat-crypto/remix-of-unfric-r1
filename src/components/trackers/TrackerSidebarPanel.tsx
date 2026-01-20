import { memo, useMemo, useState, useEffect, useCallback } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  subDays,
  parseISO,
  isBefore,
  isAfter,
} from "date-fns";
import { BarChart3, Calendar as CalendarIcon, ChevronLeft, ChevronRight, PanelLeft, ArrowLeftToLine, Flame, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { computeEndDateForHabitDays } from "@/lib/dateUtils";

interface ActivityItem {
  id: string;
  name: string;
  category: string;
  priority: string;
  description: string;
  frequencyPattern: boolean[];
  habitDays: number;
  startDate: string;
  completions: Record<string, boolean>;
  createdAt: string;
}

interface TrackerSidebarPanelProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  activities: ActivityItem[];
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
  onOpenAnalytics?: () => void;
}

export const TrackerSidebarPanel = memo(function TrackerSidebarPanel({
  selectedDate,
  onDateSelect,
  activities,
  isCollapsed,
  onToggleCollapse,
  onOpenAnalytics,
}: TrackerSidebarPanelProps) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [insightIndex, setInsightIndex] = useState(0);

  const getEndDate = (act: ActivityItem) =>
    computeEndDateForHabitDays(parseISO(act.startDate), act.frequencyPattern, act.habitDays);

  const isPlannedForDate = useCallback((act: ActivityItem, date: Date) => {
    const startDate = parseISO(act.startDate);
    const endDate = getEndDate(act);
    if (isBefore(date, startDate) || isAfter(date, endDate)) return false;
    const dayOfWeek = (date.getDay() + 6) % 7;
    return act.frequencyPattern[dayOfWeek];
  }, []);

  const activeActivities = useMemo(() => {
    const today = new Date();
    return activities.filter((a) => {
      const startDate = parseISO(a.startDate);
      const endDate = getEndDate(a);
      return !isBefore(today, startDate) && !isAfter(today, endDate);
    });
  }, [activities]);

  const daysInMonth = useMemo(() => {
    return eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  }, [currentMonth]);

  const getCompletionForDate = useCallback(
    (date: Date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      let completed = 0;
      let planned = 0;

      activities.forEach((a) => {
        if (isPlannedForDate(a, date)) {
          planned++;
          if (a.completions[dateStr]) completed++;
        }
      });

      return { completed, planned };
    },
    [activities, isPlannedForDate],
  );

  // Analytics calculations
  const analytics = useMemo(() => {
    let totalCompletions = 0;
    let totalPlanned = 0;
    let totalStreak = 0;
    let longestStreak = 0;

    activities.forEach((a) => {
      totalCompletions += Object.values(a.completions).filter(Boolean).length;

      // Calculate current streak
      let streak = 0;
      let checkDate = new Date();
      while (true) {
        const dateStr = format(checkDate, "yyyy-MM-dd");
        const dayOfWeek = (checkDate.getDay() + 6) % 7;
        const isPlanned = a.frequencyPattern[dayOfWeek];

        if (isPlanned) {
          if (a.completions[dateStr]) streak++;
          else if (format(checkDate, "yyyy-MM-dd") !== format(new Date(), "yyyy-MM-dd")) break;
        }

        checkDate = subDays(checkDate, 1);
        if (isBefore(checkDate, parseISO(a.startDate))) break;
      }
      totalStreak += streak;
      longestStreak = Math.max(longestStreak, streak);
    });

    // 7-day completion rate
    let last7Completed = 0;
    let last7Planned = 0;
    for (let i = 0; i < 7; i++) {
      const date = subDays(new Date(), i);
      const { completed, planned } = getCompletionForDate(date);
      last7Completed += completed;
      last7Planned += planned;
    }
    const weeklyRate = last7Planned > 0 ? Math.round((last7Completed / last7Planned) * 100) : 0;

    return {
      totalCompletions,
      activeCount: activeActivities.length,
      totalStreak,
      longestStreak,
      weeklyRate,
    };
  }, [activities, activeActivities, getCompletionForDate]);

  // Generate insights
  const insights = useMemo(() => {
    const messages: string[] = [];

    if (analytics.totalCompletions > 0) {
      messages.push(`You've completed ${analytics.totalCompletions} sessions total`);
    }
    if (analytics.totalStreak > 0) {
      messages.push(`Your combined streak is ${analytics.totalStreak} days`);
    }
    if (analytics.longestStreak > 0) {
      messages.push(`Your best streak is ${analytics.longestStreak} days`);
    }
    if (analytics.weeklyRate > 0) {
      messages.push(`${analytics.weeklyRate}% completion rate this week`);
    }
    if (analytics.activeCount > 0) {
      messages.push(`You're tracking ${analytics.activeCount} active habits`);
    }

    if (messages.length === 0) {
      messages.push("Start tracking to see your progress");
      messages.push("Create your first habit to begin");
      messages.push("Consistency is the key to success");
    }

    return messages;
  }, [analytics]);

  // Auto-shuffle insights
  useEffect(() => {
    const interval = setInterval(() => {
      setInsightIndex((prev) => (prev + 1) % Math.max(1, insights.length - 2));
    }, 5000);
    return () => clearInterval(interval);
  }, [insights.length]);

  const displayedInsights = useMemo(() => {
    const start = insightIndex % insights.length;
    return [
      insights[start],
      insights[(start + 1) % insights.length],
      insights[(start + 2) % insights.length],
    ].filter(Boolean);
  }, [insights, insightIndex]);

  // Collapsed view
  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center py-4 gap-3 h-full">
        <button
          onClick={onToggleCollapse}
          className="p-2.5 rounded-xl shadow-sm border transition-colors bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
          title="Expand panel"
        >
          <PanelLeft className="h-5 w-5 text-slate-500" />
        </button>

        <div className="flex flex-col items-center gap-2 mt-2">
          <div
            className="p-2 rounded-lg bg-teal-50 dark:bg-teal-900/30 cursor-pointer hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
            onClick={onOpenAnalytics}
            title="View Analytics"
          >
            <BarChart3 className="h-4 w-4 text-teal-600" />
          </div>
          <div
            className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-900/30 cursor-pointer hover:bg-cyan-100 dark:hover:bg-cyan-900/50 transition-colors"
            onClick={onToggleCollapse}
            title="View Calendar"
          >
            <CalendarIcon className="h-4 w-4 text-cyan-600" />
          </div>
        </div>

        {analytics.totalStreak > 0 && (
          <div className="mt-auto mb-4 flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <span className="text-xs font-bold text-orange-600">{analytics.totalStreak}</span>
            </div>
            <span className="text-[9px] text-slate-400">streak</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto space-y-4 pb-4">
      {/* Progress Box */}
      <div className="bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 dark:from-teal-900/20 dark:via-cyan-900/20 dark:to-emerald-900/20 rounded-2xl shadow-sm border border-teal-100/50 dark:border-teal-800/50 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-teal-100/30 dark:border-teal-800/30">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
              <BarChart3 className="h-4 w-4 text-teal-600" />
            </div>
            <span className="text-sm font-semibold text-teal-800 dark:text-teal-200">Your Progress</span>
          </div>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-600 shadow-sm border border-teal-200/50 dark:border-teal-700/50 transition-colors"
              title="Collapse panel"
            >
              <ArrowLeftToLine className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
            </button>
          )}
        </div>
        <div className="p-3 space-y-2">
          {displayedInsights.map((insight, i) => (
            <div
              key={`${insightIndex}-${i}`}
              className="flex items-center gap-2 text-xs text-teal-700 dark:text-teal-300 animate-fade-in"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
              <span>{insight}</span>
            </div>
          ))}
        </div>

        <div className="px-3 pb-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-8 text-xs text-teal-600 hover:text-teal-700 hover:bg-teal-100/50 dark:hover:bg-teal-900/30"
            onClick={onOpenAnalytics}
          >
            <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
            View Analytics
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-900/30">
              <CalendarIcon className="h-4 w-4 text-teal-600" />
            </div>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Calendar</span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 min-w-[80px] text-center">
              {format(currentMonth, "MMM yyyy")}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-3">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
              <div key={i} className="text-center text-[10px] font-medium text-slate-400">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before the first of the month */}
            {Array.from({ length: (daysInMonth[0].getDay() + 6) % 7 }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {daysInMonth.map((day) => {
              const { completed, planned } = getCompletionForDate(day);
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);
              const hasActivity = planned > 0;
              const allComplete = planned > 0 && completed === planned;

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => onDateSelect(day)}
                  className={cn(
                    "aspect-square rounded-lg text-[11px] font-medium relative transition-all flex flex-col items-center justify-center gap-0.5",
                    isSelected
                      ? "bg-teal-500 text-white shadow-sm"
                      : isTodayDate
                        ? "bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 ring-1 ring-teal-300 dark:ring-teal-700"
                        : allComplete
                          ? "bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400"
                          : hasActivity
                            ? "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                            : "text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800",
                  )}
                >
                  <span>{format(day, "d")}</span>
                  {hasActivity && (
                    <span
                      className={cn(
                        "text-[8px] leading-none",
                        isSelected ? "text-white/80" : "text-slate-400 dark:text-slate-500",
                      )}
                    >
                      {completed}/{planned}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Jump to today */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-3 h-8 text-xs text-slate-500 hover:text-slate-700"
            onClick={() => {
              setCurrentMonth(startOfMonth(new Date()));
              onDateSelect(new Date());
            }}
          >
            Jump to Today
          </Button>
        </div>
      </div>
    </div>
  );
});
