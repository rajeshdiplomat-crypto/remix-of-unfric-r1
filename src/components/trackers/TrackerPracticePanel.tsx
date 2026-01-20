import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  format,
  isToday,
  isBefore,
  startOfDay,
  parseISO,
  subDays,
  isAfter,
  addDays,
} from "date-fns";
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

  // Calculate derived values (these don't need to be memoized since they're simple)
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const isViewingToday = isToday(selectedDate);
  const isViewingPast = isBefore(startOfDay(selectedDate), startOfDay(new Date()));
  const categoryInfo = activity ? (CATEGORIES[activity.category] || CATEGORIES.health) : CATEGORIES.health;
  const isScheduledToday = activity ? isPlannedForDate(activity, selectedDate) : false;
  const isCompletedToday = activity ? !!activity.completions[dateStr] : false;
  const isSkippedToday = activity ? !!activity.skipped?.[dateStr] : false;

  // Calculate stats - always call this hook, but return empty values if no activity
  const stats = useMemo(() => {
    if (!activity) {
      return { currentStreak: 0, longestStreak: 0, totalCompletions: 0, daysLeft: 0, completionRate: 0 };
    }

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let checkDate = new Date();

    // Current streak
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

    // Longest streak
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

    // Total completions
    const totalCompletions = Object.values(activity.completions).filter(Boolean).length;

    // Days remaining
    const today = new Date();
    const daysLeft = Math.max(0, Math.ceil((getEndDate(activity).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

    // Completion rate
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

  // Get last 30 days heatmap data - always call this hook
  const heatmapData = useMemo(() => {
    if (!activity) return [];
    
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "yyyy-MM-dd");
      const isPlanned = isPlannedForDate(activity, date);
      const isCompleted = activity.completions[dateStr];
      const isSkipped = activity.skipped?.[dateStr];
      data.push({ date, dateStr, isPlanned, isCompleted, isSkipped, isToday: isToday(date) });
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

  // Empty state - now AFTER all hooks
  if (!activity) {
    return (
      <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden">
        {/* Header with greeting */}
        <div className="relative h-48 bg-gradient-to-br from-teal-500 via-cyan-500 to-emerald-500 flex items-end">
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="relative z-10 p-6">
            <h2 className="text-2xl font-bold text-white">{getGreeting()}, {userName}</h2>
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
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Header with Vision Image */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
        {/* Vision Image */}
        <div className="relative h-36 w-full overflow-hidden">
          <EntryImageUpload
            currentImageUrl={imageUrl}
            presetType="trackers"
            category={activity.category || "health"}
            onImageChange={handleImageUpload}
            className="w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
          
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/30 text-white hover:bg-black/50"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Edit button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-12 h-8 w-8 rounded-full bg-black/30 text-white hover:bg-black/50"
            onClick={() => onEdit(activity)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-3">
          <div className="flex items-start justify-between mb-2">
            <div className="flex gap-1.5 flex-wrap">
              {!isViewingToday && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 font-medium flex items-center gap-1">
                  <CalendarIcon className="h-2.5 w-2.5" /> {format(selectedDate, "MMM d, yyyy")}
                </span>
              )}
              <Badge
                variant="secondary"
                className="text-[10px] rounded-full"
                style={{
                  backgroundColor: `hsl(${categoryInfo.color} / 0.15)`,
                  color: `hsl(${categoryInfo.color})`,
                }}
              >
                {categoryInfo.label.split(" ")[0]}
              </Badge>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 font-medium flex items-center gap-1">
                <Flame className="h-2.5 w-2.5" /> {stats.currentStreak} day streak
              </span>
            </div>
          </div>

          <h2 className="font-semibold text-slate-800 dark:text-white text-base leading-tight">{activity.name}</h2>
          {activity.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{activity.description}</p>
          )}

          {/* Metadata */}
          <div className="flex gap-3 mt-2 text-xs text-slate-500">
            <div>
              <span className="text-slate-400">Started:</span>{" "}
              <span className="font-medium text-slate-600 dark:text-slate-300">
                {format(parseISO(activity.startDate), "MMM d, yyyy")}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Sessions:</span>{" "}
              <span className="font-medium text-slate-600 dark:text-slate-300">{stats.totalCompletions}</span>
            </div>
            {activity.time && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span className="font-medium text-slate-600 dark:text-slate-300">{activity.time}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Today's Action Card */}
          {isScheduledToday && (
            <Card className="rounded-xl p-4 border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
                {isViewingToday ? "Today's Check-in" : format(selectedDate, "EEEE, MMM d")}
              </h3>

              {isCompletedToday ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Completed!</p>
                    <p className="text-xs text-green-600 dark:text-green-400">Great job staying consistent</p>
                  </div>
                  {isViewingToday && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto text-green-600 hover:text-green-700 hover:bg-green-100"
                      onClick={handleMarkComplete}
                    >
                      Undo
                    </Button>
                  )}
                </div>
              ) : isSkippedToday ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <SkipForward className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Skipped</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">That's okay, rest is important too</p>
                  </div>
                </div>
              ) : isViewingPast ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <X className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">Missed</p>
                    <p className="text-xs text-red-600 dark:text-red-400">This day was not completed</p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={handleMarkComplete}
                    className="flex-1 h-11 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark Complete
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSkip}
                    className="h-11 rounded-xl"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </Card>
          )}

          {!isScheduledToday && (
            <Card className="rounded-xl p-4 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <p className="text-sm text-slate-500 text-center">Not scheduled for this day</p>
            </Card>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-lg font-semibold">
                <Flame className="h-4 w-4 text-orange-500" />
                {stats.currentStreak}
              </div>
              <p className="text-[11px] text-muted-foreground">Current Streak</p>
            </Card>
            <Card className="rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-lg font-semibold">
                <Zap className="h-4 w-4 text-yellow-500" />
                {stats.longestStreak}
              </div>
              <p className="text-[11px] text-muted-foreground">Best Streak</p>
            </Card>
            <Card className="rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-lg font-semibold">
                <TrendingUp className="h-4 w-4 text-green-500" />
                {stats.completionRate}%
              </div>
              <p className="text-[11px] text-muted-foreground">Completion Rate</p>
            </Card>
            <Card className="rounded-xl p-3 text-center">
              <div className="text-lg font-semibold">{stats.daysLeft}</div>
              <p className="text-[11px] text-muted-foreground">Days Left</p>
            </Card>
          </div>

          {/* 30-Day Heatmap */}
          <Card className="rounded-xl p-4 border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Last 30 Days</h3>
            <div className="grid grid-cols-10 gap-1">
              {heatmapData.map((day, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (day.isPlanned && !isAfter(day.date, new Date())) {
                      onToggleCompletion(activity.id, day.date);
                    }
                  }}
                  disabled={!day.isPlanned || isAfter(day.date, new Date())}
                  className={cn(
                    "aspect-square rounded-md transition-all",
                    day.isCompleted
                      ? "bg-green-500"
                      : day.isSkipped
                        ? "bg-amber-400"
                        : day.isPlanned
                          ? "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600"
                          : "bg-transparent",
                    day.isToday && "ring-2 ring-teal-400 ring-offset-1 ring-offset-background",
                  )}
                  title={format(day.date, "MMM d")}
                />
              ))}
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
        </div>
      </ScrollArea>
    </div>
  );
}
