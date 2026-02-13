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

interface HabitSidebarPanelProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  activities: ActivityItem[];
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
  onOpenAnalytics?: () => void;
}

export const HabitSidebarPanel = memo(function HabitSidebarPanel({
  selectedDate,
  onDateSelect,
  activities,
  isCollapsed,
  onToggleCollapse,
  onOpenAnalytics,
}: HabitSidebarPanelProps) {
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
          className="p-2.5 rounded-xl shadow-sm border transition-colors bg-background border-border hover:bg-muted"
          title="Expand panel"
        >
          <PanelLeft className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className="flex flex-col items-center gap-2 mt-2">
          <div
            className="p-2 rounded-lg bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
            onClick={onOpenAnalytics}
            title="View Analytics"
          >
            <BarChart3 className="h-4 w-4 text-foreground" />
          </div>
          <div
            className="p-2 rounded-lg bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
            onClick={onToggleCollapse}
            title="View Calendar"
          >
            <CalendarIcon className="h-4 w-4 text-foreground" />
          </div>
        </div>

        {analytics.totalStreak > 0 && (
          <div className="mt-auto mb-4 flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center">
              <span className="text-xs font-bold text-foreground">{analytics.totalStreak}</span>
            </div>
            <span className="text-[9px] text-muted-foreground">streak</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto space-y-4 pb-4">
      {/* Progress Box */}
      <div className="bg-muted/30 rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-background rounded-lg shadow-sm">
              <BarChart3 className="h-4 w-4 text-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">Your Progress</span>
          </div>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg bg-background hover:bg-muted shadow-sm border border-border/50 transition-colors"
              title="Collapse panel"
            >
              <ArrowLeftToLine className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
        <div className="p-3 space-y-2">
          {displayedInsights.map((insight, i) => (
            <div
              key={`${insightIndex}-${i}`}
              className="flex items-center gap-2 text-xs text-muted-foreground animate-fade-in"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-foreground/40 flex-shrink-0" />
              <span>{insight}</span>
            </div>
          ))}
        </div>

        <div className="px-3 pb-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={onOpenAnalytics}
          >
            <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
            View Analytics
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-background rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-muted">
              <CalendarIcon className="h-4 w-4 text-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">Calendar</span>
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
            <span className="text-xs font-medium text-muted-foreground min-w-[80px] text-center">
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
              <div key={i} className="text-center text-[10px] font-medium text-muted-foreground/60">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
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
                      ? "bg-foreground text-background shadow-sm"
                      : isTodayDate
                        ? "bg-foreground/10 text-foreground ring-1 ring-foreground/30"
                        : allComplete
                          ? "bg-foreground/5 text-foreground"
                          : hasActivity
                            ? "text-foreground hover:bg-muted"
                            : "text-muted-foreground hover:bg-muted/50",
                  )}
                >
                  <span>{format(day, "d")}</span>
                  {hasActivity && (
                    <span
                      className={cn(
                        "text-[8px] leading-none",
                        isSelected ? "text-background/80" : "text-muted-foreground",
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
            className="w-full mt-3 h-8 text-xs text-muted-foreground hover:text-foreground"
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
