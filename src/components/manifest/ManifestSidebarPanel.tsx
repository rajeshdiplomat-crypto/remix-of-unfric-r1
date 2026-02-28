import { useState, useMemo, useCallback, memo, useEffect } from "react";
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
  isPast,
  getMonth,
  getYear,
  setMonth as setMonthDate,
  setYear as setYearDate,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  PanelLeft,
  BarChart3,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { type ManifestGoal, type ManifestDailyPractice } from "./types";

interface ManifestSidebarPanelProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  goals: ManifestGoal[];
  practices: ManifestDailyPractice[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  activeCount?: number;
  streak?: number;
  avgMomentum?: number;
  onOpenAnalytics?: () => void;
  section?: "calendar" | "progress" | "all";
  selectedGoalId?: string;
}

export const ManifestSidebarPanel = memo(
  ({
    selectedDate,
    onDateSelect,
    goals,
    practices,
    isCollapsed = false,
    onToggleCollapse,
    activeCount = 0,
    streak = 0,
    avgMomentum = 0,
    onOpenAnalytics,
    section = "all",
    selectedGoalId = "all",
  }: ManifestSidebarPanelProps) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [insightIndex, setInsightIndex] = useState(0);

    const activeGoals = useMemo(() => goals.filter((g) => !g.is_completed && !g.is_locked), [goals]);
    const totalRealities = activeGoals.length;

    const daysInMonth = useMemo(() => {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    // Get practice counts per date (filtered by selected goal)
    const practiceCountByDate = useMemo(() => {
      const counts: Record<string, number> = {};
      practices.forEach((p) => {
        if (p.locked && (selectedGoalId === "all" || p.goal_id === selectedGoalId)) {
          counts[p.entry_date] = (counts[p.entry_date] || 0) + 1;
        }
      });
      return counts;
    }, [practices, selectedGoalId]);

    // Effective total realities for ratio calculation
    const effectiveTotalRealities = selectedGoalId === "all" ? totalRealities : 1;

    const hasPractice = useCallback(
      (date: Date) => !!practiceCountByDate[format(date, "yyyy-MM-dd")],
      [practiceCountByDate]
    );

    const getPracticeCount = useCallback(
      (date: Date) => practiceCountByDate[format(date, "yyyy-MM-dd")] || 0,
      [practiceCountByDate]
    );

    // Calculate analytics for insights
    const analytics = useMemo(() => {
      const lockedPractices = practices.filter((p) => p.locked);
      
      // Total visualization time
      const totalVizMinutes = lockedPractices.reduce((sum, p) => {
        const vizCount = p.visualization_count || 0;
        const goal = goals.find((g) => g.id === p.goal_id);
        const vizDuration = goal?.visualization_minutes || 3;
        return sum + vizCount * vizDuration;
      }, 0);

      // Total visualizations
      const totalVisualizations = lockedPractices.reduce(
        (sum, p) => sum + (p.visualization_count || 0),
        0
      );

      // Total actions
      const totalActions = lockedPractices.reduce((sum, p) => sum + (p.act_count || 0), 0);

      // Total proofs
      const totalProofs = lockedPractices.reduce(
        (sum, p) => sum + (p.proofs?.length || 0),
        0
      );

      // Unique practice days
      const uniquePracticeDays = new Set(lockedPractices.map((p) => p.entry_date)).size;

      // Most visualized goal
      const goalVizCounts: Record<string, number> = {};
      lockedPractices.forEach((p) => {
        goalVizCounts[p.goal_id] = (goalVizCounts[p.goal_id] || 0) + (p.visualization_count || 0);
      });
      const mostVisualizedGoalId = Object.entries(goalVizCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
      const mostVisualizedGoal = goals.find((g) => g.id === mostVisualizedGoalId);

      return {
        totalVizMinutes,
        totalVisualizations,
        totalActions,
        totalProofs,
        uniquePracticeDays,
        mostVisualizedGoal,
      };
    }, [practices, goals]);

    // Generate insight sentences
    const insights = useMemo(() => {
      const sentences: string[] = [];

      if (analytics.totalVizMinutes > 0) {
        const hours = Math.floor(analytics.totalVizMinutes / 60);
        const mins = analytics.totalVizMinutes % 60;
        if (hours > 0) {
          sentences.push(`You've spent ${hours}h ${mins}m visualizing your realities`);
        } else {
          sentences.push(`You've spent ${mins} minutes visualizing your realities`);
        }
      }

      if (analytics.totalVisualizations > 0) {
        sentences.push(`You've completed ${analytics.totalVisualizations} visualization sessions`);
      }

      if (analytics.totalActions > 0) {
        sentences.push(`You've taken ${analytics.totalActions} aligned actions so far`);
      }

      if (analytics.totalProofs > 0) {
        sentences.push(`You've collected ${analytics.totalProofs} proofs of manifestation`);
      }

      if (streak > 0) {
        if (streak === 1) {
          sentences.push(`Day 1 of your manifestation journey - great start!`);
        } else if (streak < 7) {
          sentences.push(`${streak} day streak - you're building momentum!`);
        } else if (streak < 30) {
          sentences.push(`${streak} day streak - amazing consistency!`);
        } else {
          sentences.push(`${streak} day streak - you're a master manifestor!`);
        }
      }

      if (analytics.mostVisualizedGoal) {
        sentences.push(`"${analytics.mostVisualizedGoal.title.slice(0, 30)}${analytics.mostVisualizedGoal.title.length > 30 ? '...' : ''}" is your most practiced reality`);
      }

      if (analytics.uniquePracticeDays > 0) {
        sentences.push(`You've practiced on ${analytics.uniquePracticeDays} different days`);
      }

      if (activeCount > 0) {
        sentences.push(`You're actively manifesting ${activeCount} ${activeCount === 1 ? 'reality' : 'realities'}`);
      }

      if (avgMomentum > 50) {
        sentences.push(`Your momentum is at ${avgMomentum}% - keep it up!`);
      }

      // Add fallback if no insights
      if (sentences.length === 0) {
        sentences.push("Start your manifestation journey today!");
        sentences.push("Create your first reality to begin");
        sentences.push("Small steps lead to big transformations");
      }

      return sentences;
    }, [analytics, streak, activeCount, avgMomentum]);

    // Auto-shuffle insights every 5 seconds
    useEffect(() => {
      if (insights.length <= 3) return;
      
      const interval = setInterval(() => {
        setInsightIndex((prev) => (prev + 1) % (insights.length - 2));
      }, 5000);

      return () => clearInterval(interval);
    }, [insights.length]);

    // Get current 3 insights to display
    const displayedInsights = useMemo(() => {
      if (insights.length <= 3) return insights;
      return [
        insights[insightIndex % insights.length],
        insights[(insightIndex + 1) % insights.length],
        insights[(insightIndex + 2) % insights.length],
      ];
    }, [insights, insightIndex]);

    if (isCollapsed) {
      return (
        <div className="flex flex-col items-center py-4 gap-3 h-full">
          {/* Expand button */}
          <button
            onClick={onToggleCollapse}
            className="p-2.5 rounded-xl shadow-sm border transition-colors bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
            title="Expand panel"
          >
            <PanelLeft className="h-5 w-5 text-slate-500" />
          </button>
          
          {/* Quick stats icons */}
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

          {/* Streak indicator */}
          {streak > 0 && (
            <div className="mt-auto mb-4 flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <span className="text-xs font-bold text-orange-600">{streak}</span>
              </div>
              <span className="text-[9px] text-slate-400">streak</span>
            </div>
          )}
        </div>
      );
    }

    const showProgress = section === "all" || section === "progress";
    const showCalendar = section === "all" || section === "calendar";

    return (
      <div className="w-full h-full overflow-auto space-y-4 pb-4">
        {/* Progress Box - Auto-shuffling Insights */}
        {showProgress && (
          <div className="bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 dark:from-teal-900/20 dark:via-cyan-900/20 dark:to-emerald-900/20 rounded-2xl shadow-sm border border-teal-100/50 dark:border-teal-800/50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-teal-100/30 dark:border-teal-800/30">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                  <BarChart3 className="h-4 w-4 text-teal-600" />
                </div>
                <span className="text-sm font-semibold text-teal-800 dark:text-teal-200">Your Progress</span>
              </div>
            </div>
            <div className="p-3 space-y-2">
              {displayedInsights.map((insight, i) => (
                <div 
                  key={`${insightIndex}-${i}`}
                  className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-2.5 border border-white/50 dark:border-slate-700/50 transition-all duration-500"
                >
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{insight}</p>
                </div>
              ))}
              {onOpenAnalytics && (
                <Button
                  onClick={onOpenAnalytics}
                  variant="outline"
                  className="w-full h-9 rounded-xl border-teal-200 dark:border-teal-800 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 text-xs font-medium"
                >
                  <BarChart3 className="h-3.5 w-3.5 mr-2" />
                  View Advanced Analytics
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Calendar Card */}
        {showCalendar && (
          <div className="rounded-2xl shadow-sm border overflow-hidden bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
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
                  <div key={`empty-${i}`} className="h-9" />
                ))}
                {daysInMonth.map((day) => {
                  const isSelected = isSameDay(day, selectedDate);
                  const isTodayDate = isToday(day);
                  const hasPracticeOnDay = hasPractice(day);
                  const practiceCount = getPracticeCount(day);

                  return (
                    (() => {
                      const ratio = effectiveTotalRealities > 0 ? practiceCount / effectiveTotalRealities : 0;
                      const isPastDay = isPast(day) && !isTodayDate;

                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => onDateSelect(day)}
                          className={cn(
                            "h-9 rounded-lg text-[10px] font-medium transition-all relative flex flex-col items-center justify-center gap-0",
                            isSelected
                              ? "bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-md"
                              : ratio === 1 && hasPracticeOnDay
                                ? "bg-emerald-500/70 text-white dark:bg-emerald-600/60"
                                : ratio > 0 && hasPracticeOnDay
                                  ? "bg-amber-400/40 text-amber-700 dark:bg-amber-500/30 dark:text-amber-300"
                                  : isPastDay && effectiveTotalRealities > 0
                                    ? "bg-red-100/40 text-slate-500 dark:bg-red-900/20 dark:text-slate-400"
                                    : isTodayDate
                                      ? "bg-cyan-50 text-cyan-600 ring-1 ring-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300"
                                      : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                          )}
                        >
                          <span>{format(day, "d")}</span>
                          {hasPracticeOnDay && effectiveTotalRealities > 0 && (
                            <span className={cn(
                              "text-[7px] leading-none",
                              isSelected || ratio === 1 ? "text-white/80" : ratio > 0 ? "text-amber-600 dark:text-amber-300" : "text-teal-500 dark:text-teal-400"
                            )}>
                              {practiceCount}/{effectiveTotalRealities}
                            </span>
                          )}
                        </button>
                      );
                    })()
                  );
                })}
              </div>

              {/* Legend */}
              {effectiveTotalRealities > 0 && (
                <div className="flex items-center justify-center gap-3 mt-2 text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/70" /> All</div>
                  <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-amber-400/40" /> Partial</div>
                  <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-red-100/40 dark:bg-red-900/20" /> Missed</div>
                </div>
              )}

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
        )}

      </div>
    );
  }
);