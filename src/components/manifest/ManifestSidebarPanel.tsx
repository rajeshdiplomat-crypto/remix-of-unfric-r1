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
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  ArrowLeftToLine,
  PanelLeft,
  Target,
  Flame,
  TrendingUp,
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
  }: ManifestSidebarPanelProps) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const activeGoals = useMemo(() => goals.filter((g) => !g.is_completed && !g.is_locked), [goals]);
    const totalVisions = activeGoals.length;

    const daysInMonth = useMemo(() => {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    // Get practice counts per date
    const practiceCountByDate = useMemo(() => {
      const counts: Record<string, number> = {};
      practices.forEach((p) => {
        if (p.locked) {
          counts[p.entry_date] = (counts[p.entry_date] || 0) + 1;
        }
      });
      return counts;
    }, [practices]);

    const hasPractice = useCallback(
      (date: Date) => !!practiceCountByDate[format(date, "yyyy-MM-dd")],
      [practiceCountByDate]
    );

    const getPracticeCount = useCallback(
      (date: Date) => practiceCountByDate[format(date, "yyyy-MM-dd")] || 0,
      [practiceCountByDate]
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

    // Progress messages
    const getManifestingSentence = () => {
      if (activeCount === 0) return "Create your first vision to begin";
      if (activeCount === 1) return "Manifesting 1 vision";
      return `Manifesting ${activeCount} visions`;
    };

    const getStreakSentence = () => {
      if (streak === 0) return "Start your manifesting journey today";
      if (streak === 1) return "Day 1 - Great start!";
      if (streak < 7) return `Day ${streak} - Building momentum`;
      if (streak < 30) return `Day ${streak} - Amazing consistency!`;
      return `Day ${streak} - Master manifestor!`;
    };

    const getMomentumSentence = () => {
      if (avgMomentum === 0) return "Complete your first practice";
      if (avgMomentum < 30) return "Keep going, momentum is building";
      if (avgMomentum < 60) return "Good progress this week";
      if (avgMomentum < 80) return "Strong momentum!";
      return "Peak manifestation energy!";
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
        {/* Progress Box - Above Calendar */}
        <div className="bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 dark:from-teal-900/20 dark:via-cyan-900/20 dark:to-emerald-900/20 rounded-2xl shadow-sm border border-teal-100/50 dark:border-teal-800/50 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-teal-100/30 dark:border-teal-800/30">
            <div className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
              <TrendingUp className="h-4 w-4 text-teal-600" />
            </div>
            <span className="text-sm font-semibold text-teal-800 dark:text-teal-200">Your Progress</span>
          </div>
          <div className="p-3 space-y-2">
            <div className="flex items-start gap-3 bg-white/60 dark:bg-slate-800/60 rounded-xl p-2.5 border border-white/50 dark:border-slate-700/50">
              <div className="p-1 bg-teal-100 dark:bg-teal-900/50 rounded-lg mt-0.5">
                <Target className="h-3 w-3 text-teal-600" />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{getManifestingSentence()}</p>
            </div>
            <div className="flex items-start gap-3 bg-white/60 dark:bg-slate-800/60 rounded-xl p-2.5 border border-white/50 dark:border-slate-700/50">
              <div className="p-1 bg-orange-100 dark:bg-orange-900/50 rounded-lg mt-0.5">
                <Flame className="h-3 w-3 text-orange-600" />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{getStreakSentence()}</p>
            </div>
            <div className="flex items-start gap-3 bg-white/60 dark:bg-slate-800/60 rounded-xl p-2.5 border border-white/50 dark:border-slate-700/50">
              <div className="p-1 bg-cyan-100 dark:bg-cyan-900/50 rounded-lg mt-0.5">
                <TrendingUp className="h-3 w-3 text-cyan-600" />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{getMomentumSentence()}</p>
            </div>
            {/* Analytics Button */}
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
                const practiceCount = getPracticeCount(day);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => onDateSelect(day)}
                    className={cn(
                      "aspect-square rounded-lg text-[10px] font-medium transition-all relative flex flex-col items-center justify-center gap-0",
                      isSelected
                        ? "bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-md"
                        : hasPracticeOnDay
                          ? "bg-teal-50 text-teal-700 ring-1 ring-teal-200 hover:bg-teal-100 dark:bg-teal-900/30 dark:text-teal-300 dark:ring-teal-800"
                          : isTodayDate
                            ? "bg-cyan-50 text-cyan-600 ring-1 ring-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300"
                            : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    <span>{format(day, "d")}</span>
                    {hasPracticeOnDay && totalVisions > 0 && (
                      <span className={cn(
                        "text-[7px] leading-none",
                        isSelected ? "text-white/80" : "text-teal-500 dark:text-teal-400"
                      )}>
                        {practiceCount}/{totalVisions}
                      </span>
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
              className="w-full mt-3 py-2 text-xs font-medium text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
            >
              Jump to Today
            </button>
          </div>
        </div>
      </div>
    );
  }
);
