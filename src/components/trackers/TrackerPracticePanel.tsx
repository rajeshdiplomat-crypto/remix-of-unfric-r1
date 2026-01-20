import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, isToday, isBefore, startOfDay, parseISO, subDays, isAfter, addDays } from "date-fns";
import {
  X,
  Flame,
  CheckCircle2,
  SkipForward,
  Calendar as CalendarIcon,
  Target,
  TrendingUp,
  Zap,
  Clock,
  Edit2,
  LayoutGrid,
  CalendarDays,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EntryImageUpload } from "@/components/common/EntryImageUpload";
import { loadActivityImage, saveActivityImage } from "./ActivityImageUpload";
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
  notes?: Record<string, string>;
  skipped?: Record<string, boolean>;
  time?: string;
  duration?: number;
}

const CATEGORIES: Record<string, { label: string; color: string }> = {
  health: { label: "Health & Wellness", color: "142 71% 45%" },
  growth: { label: "Personal Growth", color: "262 83% 58%" },
  career: { label: "Career", color: "221 83% 53%" },
  education: { label: "Education", color: "25 95% 53%" },
  wellbeing: { label: "Wellbeing", color: "339 81% 51%" },
};

type ViewMode = "grid" | "calendar" | "list";

interface TrackerPracticePanelProps {
  activity: ActivityItem | null;
  selectedDate: Date;
  onClose: () => void;
  onEdit: (activity: ActivityItem) => void;
  onToggleCompletion: (activityId: string, date: Date) => void;
  onSkipDay: (activityId: string, date: Date) => void;
  onImageChange: (activityId: string, imageUrl: string | null) => void;
  userName?: string;
}

export function TrackerPracticePanel({
  activity,
  selectedDate,
  onClose,
  onEdit,
  onToggleCompletion,
  onSkipDay,
  onImageChange,
  userName = "there",
}: TrackerPracticePanelProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  useEffect(() => {
    if (activity) setImageUrl(loadActivityImage(activity.id));
    else setImageUrl(null);
  }, [activity?.id]);

  const getEndDate = (act: ActivityItem) =>
    computeEndDateForHabitDays(parseISO(act.startDate), act.frequencyPattern, act.habitDays);

  const isPlannedForDate = (act: ActivityItem, date: Date) => {
    const startDate = parseISO(act.startDate);
    const endDate = getEndDate(act);
    if (isBefore(date, startDate) || isAfter(date, endDate)) return false;
    const dayOfWeek = (date.getDay() + 6) % 7;
    return act.frequencyPattern[dayOfWeek];
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    if (hour < 21) return "Good evening";
    return "Good night";
  };

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const isViewingToday = isToday(selectedDate);
  const isViewingPast = isBefore(startOfDay(selectedDate), startOfDay(new Date()));
  const categoryInfo = activity ? CATEGORIES[activity.category] || CATEGORIES.health : CATEGORIES.health;
  const isScheduledToday = activity ? isPlannedForDate(activity, selectedDate) : false;
  const isCompletedToday = activity ? !!activity.completions[dateStr] : false;
  const isSkippedToday = activity ? !!activity.skipped?.[dateStr] : false;

  const stats = useMemo(() => {
    if (!activity) {
      return { currentStreak: 0, longestStreak: 0, totalCompletions: 0, daysLeft: 0, completionRate: 0 };
    }

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let checkDate = new Date();

    while (true) {
      const dateStr = format(checkDate, "yyyy-MM-dd");
      const dayOfWeek = (checkDate.getDay() + 6) % 7;
      const isPlanned = activity.frequencyPattern[dayOfWeek];

      if (isPlanned) {
        if (activity.completions[dateStr]) currentStreak++;
        else if (format(checkDate, "yyyy-MM-dd") !== format(new Date(), "yyyy-MM-dd")) break;
      }

      checkDate = subDays(checkDate, 1);
      if (isBefore(checkDate, parseISO(activity.startDate))) break;
    }

    const startDate = parseISO(activity.startDate);
    const endDate = getEndDate(activity);
    checkDate = startDate;

    while (!isAfter(checkDate, endDate)) {
      const dateStr = format(checkDate, "yyyy-MM-dd");
      const dayOfWeek = (checkDate.getDay() + 6) % 7;

      if (activity.frequencyPattern[dayOfWeek]) {
        if (activity.completions[dateStr]) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else tempStreak = 0;
      }

      checkDate = addDays(checkDate, 1);
    }

    const totalCompletions = Object.values(activity.completions).filter(Boolean).length;
    const today = new Date();
    const daysLeft = Math.max(0, Math.ceil((getEndDate(activity).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

    let scheduled = 0;
    let completed = 0;
    checkDate = startDate;
    while (!isAfter(checkDate, today) && !isAfter(checkDate, endDate)) {
      const dateStr = format(checkDate, "yyyy-MM-dd");
      const dayOfWeek = (checkDate.getDay() + 6) % 7;
      if (activity.frequencyPattern[dayOfWeek]) {
        scheduled++;
        if (activity.completions[dateStr]) completed++;
      }
      checkDate = addDays(checkDate, 1);
    }
    const completionRate = scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;

    return { currentStreak, longestStreak, totalCompletions, daysLeft, completionRate };
  }, [activity]);

  const last7Days = useMemo(() => {
    if (!activity) return [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "yyyy-MM-dd");
      const isPlanned = isPlannedForDate(activity, date);
      const isCompleted = activity.completions[dateStr];
      const isSkipped = activity.skipped?.[dateStr];
      data.push({
        date,
        dateStr,
        isPlanned,
        isCompleted,
        isSkipped,
        isToday: isToday(date),
        dayName: format(date, "EEE"),
      });
    }
    return data;
  }, [activity]);

  const handleImageUpload = (url: string | null) => {
    if (!activity) return;
    saveActivityImage(activity.id, url);
    setImageUrl(url);
    onImageChange(activity.id, url);
  };

  const handleMarkComplete = () => {
    if (activity && isScheduledToday) onToggleCompletion(activity.id, selectedDate);
  };

  const handleSkip = () => {
    if (activity && isScheduledToday) onSkipDay(activity.id, selectedDate);
  };

  // Empty state
  if (!activity) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
        <div className="relative h-44 bg-gradient-to-br from-teal-500 via-cyan-500 to-emerald-500 flex items-end">
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="relative z-10 p-5">
            <h2 className="text-xl font-bold text-white">
              {getGreeting()}, {userName}
            </h2>
            <p className="text-white/80 text-sm mt-1">Select an activity to start tracking</p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="rounded-2xl border-dashed border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-8 text-center max-w-sm">
            <Target className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">No Activity Selected</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Click on an activity card to view details and track your progress.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
      {/* Compact Header */}
      <div className="relative h-32 w-full overflow-hidden flex-shrink-0">
        <EntryImageUpload
          currentImageUrl={imageUrl}
          presetType="trackers"
          category={activity.category || "health"}
          onImageChange={handleImageUpload}
          className="w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />

        {/* Close & Edit buttons */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/30 text-white hover:bg-black/50"
          onClick={onClose}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-10 h-7 w-7 rounded-full bg-black/30 text-white hover:bg-black/50"
          onClick={() => onEdit(activity)}
        >
          <Edit2 className="h-3.5 w-3.5" />
        </Button>

        {/* Activity Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className="text-[10px] rounded-full bg-white/20 text-white backdrop-blur-sm">
              {categoryInfo.label.split(" ")[0]}
            </Badge>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/80 text-white font-medium flex items-center gap-1">
              <Flame className="h-2.5 w-2.5" /> {stats.currentStreak}
            </span>
          </div>
          <h2 className="font-semibold text-white text-sm leading-tight line-clamp-1">{activity.name}</h2>
        </div>
      </div>

      {/* Main Action - BIG Mark Complete Button */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
        <p className="text-xs text-slate-500 mb-2 text-center">
          {isViewingToday ? "Today's Check-in" : format(selectedDate, "EEEE, MMM d")}
        </p>

        {isScheduledToday ? (
          isCompletedToday ? (
            <div
              className="flex items-center justify-center gap-3 p-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white cursor-pointer hover:from-green-600 hover:to-emerald-600 transition-all"
              onClick={handleMarkComplete}
            >
              <CheckCircle2 className="h-6 w-6" />
              <div className="text-left">
                <p className="font-semibold">Completed! ✓</p>
                <p className="text-xs text-white/80">Tap to undo</p>
              </div>
            </div>
          ) : isSkippedToday ? (
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
              <SkipForward className="h-6 w-6" />
              <p className="font-medium">Skipped for today</p>
            </div>
          ) : isViewingPast ? (
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
              <X className="h-6 w-6" />
              <p className="font-medium">Missed</p>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={handleMarkComplete}
                className="flex-1 h-14 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white text-base font-semibold shadow-lg shadow-teal-500/25"
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Mark Complete
              </Button>
              <Button variant="outline" onClick={handleSkip} className="h-14 w-14 rounded-xl">
                <SkipForward className="h-5 w-5" />
              </Button>
            </div>
          )
        ) : (
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-center">
            <p className="text-sm text-slate-500">Not scheduled for this day</p>
          </div>
        )}
      </div>

      {/* View Toggle */}
      <div className="px-4 pt-3 flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Progress</p>
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              viewMode === "grid" ? "bg-white dark:bg-slate-700 shadow-sm" : "text-slate-400 hover:text-slate-600",
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              viewMode === "calendar" ? "bg-white dark:bg-slate-700 shadow-sm" : "text-slate-400 hover:text-slate-600",
            )}
          >
            <CalendarDays className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              viewMode === "list" ? "bg-white dark:bg-slate-700 shadow-sm" : "text-slate-400 hover:text-slate-600",
            )}
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Content based on view mode */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {viewMode === "grid" && (
          <>
            {/* Quick Stats - 2x2 Grid */}
            <div className="grid grid-cols-2 gap-2">
              <Card className="rounded-xl p-3 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-100 dark:border-orange-900/50">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Flame className="h-4 w-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-800 dark:text-white">{stats.currentStreak}</p>
                    <p className="text-[10px] text-slate-500">Current Streak</p>
                  </div>
                </div>
              </Card>
              <Card className="rounded-xl p-3 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border-yellow-100 dark:border-yellow-900/50">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-800 dark:text-white">{stats.longestStreak}</p>
                    <p className="text-[10px] text-slate-500">Best Streak</p>
                  </div>
                </div>
              </Card>
              <Card className="rounded-xl p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-100 dark:border-green-900/50">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-800 dark:text-white">{stats.completionRate}%</p>
                    <p className="text-[10px] text-slate-500">Completion</p>
                  </div>
                </div>
              </Card>
              <Card className="rounded-xl p-3 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-100 dark:border-blue-900/50">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <CalendarIcon className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-800 dark:text-white">{stats.daysLeft}</p>
                    <p className="text-[10px] text-slate-500">Days Left</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* This Week Progress */}
            <Card className="rounded-xl p-4">
              <p className="text-xs font-medium text-slate-500 mb-3">This Week</p>
              <div className="flex justify-between">
                {last7Days.map((day, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">{day.dayName}</span>
                    <button
                      onClick={() => {
                        if (day.isPlanned && !isAfter(day.date, new Date())) {
                          onToggleCompletion(activity.id, day.date);
                        }
                      }}
                      disabled={!day.isPlanned || isAfter(day.date, new Date())}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                        day.isCompleted
                          ? "bg-green-500 text-white"
                          : day.isSkipped
                            ? "bg-amber-400 text-white"
                            : day.isPlanned
                              ? "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                              : "bg-transparent",
                        day.isToday && !day.isCompleted && "ring-2 ring-teal-400",
                      )}
                    >
                      {day.isCompleted && <CheckCircle2 className="h-4 w-4" />}
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {viewMode === "calendar" && (
          <Card className="rounded-xl p-4">
            <p className="text-xs font-medium text-slate-500 mb-3">Last 30 Days</p>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 30 }, (_, i) => {
                const date = subDays(new Date(), 29 - i);
                const dateStr = format(date, "yyyy-MM-dd");
                const isPlanned = isPlannedForDate(activity, date);
                const isCompleted = activity.completions[dateStr];
                const isSkipped = activity.skipped?.[dateStr];
                const isTodayDate = isToday(date);

                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (isPlanned && !isAfter(date, new Date())) {
                        onToggleCompletion(activity.id, date);
                      }
                    }}
                    disabled={!isPlanned || isAfter(date, new Date())}
                    className={cn(
                      "aspect-square rounded-md text-[10px] font-medium transition-all flex items-center justify-center",
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isSkipped
                          ? "bg-amber-400 text-white"
                          : isPlanned
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                            : "bg-transparent text-slate-300",
                      isTodayDate && !isCompleted && "ring-2 ring-teal-400",
                    )}
                    title={format(date, "MMM d")}
                  >
                    {format(date, "d")}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-slate-500">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span>Done</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-amber-400" />
                <span>Skipped</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700" />
                <span>Planned</span>
              </div>
            </div>
          </Card>
        )}

        {viewMode === "list" && (
          <Card className="rounded-xl p-4">
            <p className="text-xs font-medium text-slate-500 mb-3">Activity Details</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm text-slate-600 dark:text-slate-400">Started</span>
                <span className="text-sm font-medium text-slate-800 dark:text-white">
                  {format(parseISO(activity.startDate), "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm text-slate-600 dark:text-slate-400">Total Sessions</span>
                <span className="text-sm font-medium text-slate-800 dark:text-white">{stats.totalCompletions}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm text-slate-600 dark:text-slate-400">Habit Days Goal</span>
                <span className="text-sm font-medium text-slate-800 dark:text-white">{activity.habitDays}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm text-slate-600 dark:text-slate-400">Days Remaining</span>
                <span className="text-sm font-medium text-slate-800 dark:text-white">{stats.daysLeft}</span>
              </div>
              {activity.time && (
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Scheduled Time</span>
                  <span className="text-sm font-medium text-slate-800 dark:text-white flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {activity.time}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">Completion Rate</span>
                <span className="text-sm font-medium text-green-600">{stats.completionRate}%</span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
