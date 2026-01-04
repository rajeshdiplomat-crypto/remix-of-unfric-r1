import { useEffect, useState } from "react";
import { addDays, format, isAfter, isBefore, isToday, parseISO, subDays } from "date-fns";
import {
  Edit2,
  Flame,
  Zap,
  TrendingUp,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  SkipForward,
  StickyNote,
  Sparkles,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { cn } from "@/lib/utils";
import { computeEndDateForHabitDays } from "@/lib/dateUtils";
import { loadActivityImage, saveActivityImage } from "./ActivityImageUpload";

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
}

interface ActivityDetailPanelProps {
  activity: ActivityItem | null;
  onEdit: (activity: ActivityItem) => void;
  onToggleCompletion: (activityId: string, date: Date) => void;
  onSkipDay: (activityId: string, date: Date) => void;
  onImageChange: (activityId: string, imageUrl: string | null) => void;
}

const CATEGORIES: Record<string, { label: string; color: string }> = {
  health: { label: "Health & Wellness", color: "142 71% 45%" },
  growth: { label: "Personal Growth", color: "262 83% 58%" },
  career: { label: "Career", color: "221 83% 53%" },
  education: { label: "Education", color: "25 95% 53%" },
  wellbeing: { label: "Wellbeing", color: "339 81% 51%" },
};

const FULL_DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function ActivityDetailPanel({
  activity,
  onEdit,
  onToggleCompletion,
  onSkipDay,
  onImageChange,
}: ActivityDetailPanelProps) {
  const [sessionFilter, setSessionFilter] = useState<"all" | "done" | "missed" | "skipped">("all");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  const isTodayScheduled = (act: ActivityItem) => isPlannedForDate(act, new Date());

  const getScheduledSessions = (act: ActivityItem) => {
    let count = 0;
    const startDate = parseISO(act.startDate);
    const endDate = getEndDate(act);
    let currentDate = startDate;
    while (!isAfter(currentDate, endDate)) {
      const dayOfWeek = (currentDate.getDay() + 6) % 7;
      if (act.frequencyPattern[dayOfWeek]) count++;
      currentDate = addDays(currentDate, 1);
    }
    return count;
  };

  const getPastScheduledSessions = (act: ActivityItem) => {
    let count = 0;
    const startDate = parseISO(act.startDate);
    const today = new Date();
    const endDate = getEndDate(act);
    const effectiveEnd = isBefore(today, endDate) ? today : endDate;

    let currentDate = startDate;
    while (!isAfter(currentDate, effectiveEnd)) {
      const dayOfWeek = (currentDate.getDay() + 6) % 7;
      if (act.frequencyPattern[dayOfWeek]) count++;
      currentDate = addDays(currentDate, 1);
    }
    return count;
  };

  const getCompletedSessions = (act: ActivityItem) => Object.values(act.completions).filter(Boolean).length;

  const getMissedSessions = (act: ActivityItem) =>
    Math.max(0, getPastScheduledSessions(act) - getCompletedSessions(act));

  const getSessionsLeft = (act: ActivityItem) => Math.max(0, getScheduledSessions(act) - getCompletedSessions(act));

  const getCompletionPercent = (act: ActivityItem) => {
    const scheduled = getPastScheduledSessions(act);
    if (scheduled === 0) return 0;
    return Math.round((getCompletedSessions(act) / scheduled) * 100);
  };

  const getCurrentStreak = (act: ActivityItem) => {
    let streak = 0;
    let checkDate = new Date();
    while (true) {
      const dateStr = format(checkDate, "yyyy-MM-dd");
      const dayOfWeek = (checkDate.getDay() + 6) % 7;
      const isPlanned = act.frequencyPattern[dayOfWeek];

      if (isPlanned) {
        if (act.completions[dateStr]) streak++;
        else if (!isToday(checkDate)) break;
      }

      checkDate = subDays(checkDate, 1);
      if (isBefore(checkDate, parseISO(act.startDate))) break;
    }
    return streak;
  };

  const getLongestStreak = (act: ActivityItem) => {
    let longest = 0;
    let current = 0;
    const startDate = parseISO(act.startDate);
    const endDate = getEndDate(act);

    let checkDate = startDate;
    while (!isAfter(checkDate, endDate)) {
      const dateStr = format(checkDate, "yyyy-MM-dd");
      const dayOfWeek = (checkDate.getDay() + 6) % 7;

      if (act.frequencyPattern[dayOfWeek]) {
        if (act.completions[dateStr]) {
          current++;
          longest = Math.max(longest, current);
        } else current = 0;
      }

      checkDate = addDays(checkDate, 1);
    }
    return longest;
  };

  const getDaysLeft = (act: ActivityItem) => {
    const endDate = getEndDate(act);
    const today = new Date();
    const diff = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const getOnTrackStatus = (act: ActivityItem) => {
    const startDate = parseISO(act.startDate);
    const today = new Date();
    if (isBefore(today, startDate)) return "upcoming";

    let expectedByToday = 0;
    let currentDate = startDate;
    while (!isAfter(currentDate, today)) {
      const dayOfWeek = (currentDate.getDay() + 6) % 7;
      if (act.frequencyPattern[dayOfWeek]) expectedByToday++;
      currentDate = addDays(currentDate, 1);
    }

    const actualByToday = getCompletedSessions(act);
    return actualByToday >= expectedByToday ? "on-track" : "behind";
  };

  const getLast7DaysTrend = (act: ActivityItem) => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "yyyy-MM-dd");
      const isPlanned = isPlannedForDate(act, date);
      const isCompleted = act.completions[dateStr];

      data.push({
        day: format(date, "EEE"),
        date: format(date, "MMM d"),
        planned: isPlanned ? 1 : 0,
        completed: isCompleted ? 1 : 0,
      });
    }
    return data;
  };

  const getLast30DaysHeat = (act: ActivityItem) => {
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "yyyy-MM-dd");
      const isPlanned = isPlannedForDate(act, date);
      const isCompleted = act.completions[dateStr];
      const isSkipped = act.skipped?.[dateStr];
      data.push({ date, dateStr, isPlanned, isCompleted, isSkipped, isToday: isToday(date) });
    }
    return data;
  };

  const getSessionHistory = (act: ActivityItem) => {
    const sessions: Array<{
      date: Date;
      dateStr: string;
      status: "done" | "missed" | "skipped" | "not-scheduled";
      hasNote: boolean;
    }> = [];

    const startDate = parseISO(act.startDate);
    const endDate = getEndDate(act);
    const today = new Date();
    let checkDate = isBefore(today, endDate) ? today : endDate;

    while (!isBefore(checkDate, startDate) && sessions.length < 30) {
      const dateStr = format(checkDate, "yyyy-MM-dd");
      const isPlanned = isPlannedForDate(act, checkDate);
      const isCompleted = act.completions[dateStr];
      const isSkipped = act.skipped?.[dateStr];
      const hasNote = !!act.notes?.[dateStr];

      let status: "done" | "missed" | "skipped" | "not-scheduled" = "not-scheduled";
      if (isPlanned) {
        if (isCompleted) status = "done";
        else if (isSkipped) status = "skipped";
        else if (!isToday(checkDate)) status = "missed";
      }

      sessions.push({ date: checkDate, dateStr, status, hasNote });
      checkDate = subDays(checkDate, 1);
    }

    return sessions.filter((s) => {
      if (sessionFilter === "all") return true;
      return s.status === sessionFilter;
    });
  };

  const handleImageUpload = (file: File) => {
    if (!activity) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      saveActivityImage(activity.id, url);
      setImageUrl(url);
      onImageChange(activity.id, url);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleImageUpload(file);
  };

  const handleRemoveImage = () => {
    if (!activity) return;
    saveActivityImage(activity.id, null);
    setImageUrl(null);
    onImageChange(activity.id, null);
  };

  const handleMarkTodayDone = () => {
    if (activity && isTodayScheduled(activity)) onToggleCompletion(activity.id, new Date());
  };

  const handleSkipToday = () => {
    if (activity && isTodayScheduled(activity)) onSkipDay(activity.id, new Date());
  };

  // Empty state
  if (!activity) {
    return (
      <div className="w-full h-full">
        <div className="rounded-2xl border border-border/60 bg-card/60 overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold leading-tight">Activity Details</h3>
                <p className="text-xs text-muted-foreground">Select an activity to preview</p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <Card className="rounded-xl border-dashed border-2 border-border/60 bg-muted/20 p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">Cover image</p>
                  <p className="text-xs text-muted-foreground">Pick an activity to upload</p>
                </div>
              </div>
            </Card>

            <Card className="rounded-xl p-5">
              <p className="text-sm font-medium text-muted-foreground">Nothing selected</p>
              <p className="text-xs text-muted-foreground mt-1">Click any activity card on the left.</p>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const category = CATEGORIES[activity.category];
  const onTrackStatus = getOnTrackStatus(activity);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayScheduled = isTodayScheduled(activity);
  const isTodayDone = !!activity.completions[todayStr];

  const trendData = getLast7DaysTrend(activity);
  const heatData = getLast30DaysHeat(activity);
  const sessionHistory = getSessionHistory(activity);

  return (
    <div className="w-full h-full">
      <div className="rounded-2xl border border-border/60 bg-card/60 overflow-hidden h-full">
        <ScrollArea className="h-full">
          {/* Cover */}
          {imageUrl ? (
            <div className="relative h-36 w-full">
              <img src={imageUrl} alt={activity.name} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-white truncate">{activity.name}</h2>
                    <p className="text-xs text-white/75 line-clamp-1">{activity.description}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 rounded-xl bg-black/30 text-white hover:bg-black/45"
                      onClick={() => onEdit(activity)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 rounded-xl bg-black/30 text-white hover:bg-black/45"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 border-b border-border/50">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold truncate">{activity.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{activity.description}</p>
                </div>

                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => onEdit(activity)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>

              {/* drop zone */}
              <div
                className={cn(
                  "mt-3 rounded-xl border border-border/60 bg-muted/20 p-3 transition-colors cursor-pointer",
                  isDragging && "ring-2 ring-primary/30",
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById("panel-image-upload")?.click()}
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight">Add cover image</p>
                    <p className="text-xs text-muted-foreground">Drop file or click to browse</p>
                  </div>
                </div>

                <input
                  id="panel-image-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                />
              </div>
            </div>
          )}

          {/* Pills */}
          <div className="px-4 py-3 flex items-center gap-2 flex-wrap border-b border-border/50">
            <Badge
              variant="secondary"
              className="rounded-full"
              style={{
                backgroundColor: `hsl(${category?.color || "0 0% 50%"} / 0.16)`,
                color: `hsl(${category?.color || "0 0% 50%"})`,
              }}
            >
              {category?.label.split(" ")[0] || activity.category}
            </Badge>

            <Badge variant="outline" className="rounded-full">
              {activity.priority}
            </Badge>

            <Badge
              className={cn(
                "rounded-full",
                onTrackStatus === "on-track" && "bg-green-500/15 text-green-700 border border-green-500/20",
                onTrackStatus === "behind" && "bg-red-500/15 text-red-700 border border-red-500/20",
                onTrackStatus === "upcoming" && "bg-blue-500/15 text-blue-700 border border-blue-500/20",
              )}
            >
              {onTrackStatus === "on-track" ? "On track" : onTrackStatus === "behind" ? "Behind" : "Upcoming"}
            </Badge>
          </div>

          <div className="p-4 space-y-4">
            {/* KPI grid */}
            <div className="grid grid-cols-3 gap-2">
              <Card className="rounded-xl p-3 text-center">
                <p className="text-lg font-semibold">{getCompletionPercent(activity)}%</p>
                <p className="text-[11px] text-muted-foreground">Completion</p>
              </Card>

              <Card className="rounded-xl p-3 text-center">
                <p className="text-lg font-semibold inline-flex items-center justify-center gap-1">
                  <Flame className="h-4 w-4 text-orange-500" />
                  {getCurrentStreak(activity)}
                </p>
                <p className="text-[11px] text-muted-foreground">Streak</p>
              </Card>

              <Card className="rounded-xl p-3 text-center">
                <p className="text-lg font-semibold inline-flex items-center justify-center gap-1">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  {getLongestStreak(activity)}
                </p>
                <p className="text-[11px] text-muted-foreground">Best</p>
              </Card>

              <Card className="rounded-xl p-3 text-center">
                <p className="text-lg font-semibold">{getSessionsLeft(activity)}</p>
                <p className="text-[11px] text-muted-foreground">Left</p>
              </Card>

              <Card className="rounded-xl p-3 text-center">
                <p className="text-lg font-semibold">{getDaysLeft(activity)}</p>
                <p className="text-[11px] text-muted-foreground">Days</p>
              </Card>

              <Card className="rounded-xl p-3 text-center">
                <p className="text-lg font-semibold">{getMissedSessions(activity)}</p>
                <p className="text-[11px] text-muted-foreground">Missed</p>
              </Card>
            </div>

            {/* Schedule */}
            <Card className="rounded-2xl p-4">
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <CalendarIcon className="h-4 w-4 text-primary" />
                Schedule
              </h4>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Date Range</p>
                  <p className="font-medium">
                    {format(parseISO(activity.startDate), "MMM d")} → {format(getEndDate(activity), "MMM d")}
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground">Habit Days</p>
                  <p className="font-medium">{activity.habitDays} sessions</p>
                </div>

                <div>
                  <p className="text-muted-foreground">Frequency</p>
                  <p className="font-medium">{activity.frequencyPattern.filter(Boolean).length} days/week</p>
                </div>

                <div>
                  <p className="text-muted-foreground">Days</p>
                  <p className="font-medium">
                    {activity.frequencyPattern
                      .map((d, i) => (d ? FULL_DAY_LABELS[i].charAt(0) : ""))
                      .filter(Boolean)
                      .join("")}
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground">Scheduled</p>
                  <p className="font-medium">{getScheduledSessions(activity)} sessions</p>
                </div>

                <div>
                  <p className="text-muted-foreground">Completed / Missed</p>
                  <p className="font-medium">
                    <span className="text-green-700">{getCompletedSessions(activity)}</span>
                    <span className="text-muted-foreground"> / </span>
                    <span className="text-red-700">{getMissedSessions(activity)}</span>
                  </p>
                </div>
              </div>
            </Card>

            {/* Last 7 days */}
            <Card className="rounded-2xl p-4">
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                Last 7 Days
              </h4>

              <div className="h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload as any;
                          return (
                            <div className="bg-popover border border-border rounded-xl px-3 py-2 text-xs shadow-md">
                              <p className="font-medium">{d.date}</p>
                              <p className="text-muted-foreground">
                                {d.planned ? (d.completed ? "Done ✓" : "Missed") : "Not scheduled"}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey={(d: any) => (d.planned ? (d.completed ? 100 : 18) : 6)}
                      fill="hsl(var(--primary))"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* 30 days heat */}
            <Card className="rounded-2xl p-4">
              <h4 className="text-sm font-semibold mb-3">Last 30 Days</h4>

              <TooltipProvider>
                <div className="flex flex-wrap gap-1">
                  {heatData.map((day, idx) => (
                    <Tooltip key={idx}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "h-4 w-4 rounded-md transition-colors",
                            !day.isPlanned && "bg-muted/30",
                            day.isPlanned && !day.isCompleted && !day.isSkipped && "bg-red-500/35",
                            day.isCompleted && "bg-green-500",
                            day.isSkipped && "bg-yellow-500/45",
                            day.isToday && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs rounded-xl">
                        <p className="font-medium">{format(day.date, "MMM d")}</p>
                        <p className="text-muted-foreground">
                          {!day.isPlanned
                            ? "Not scheduled"
                            : day.isCompleted
                              ? "Completed"
                              : day.isSkipped
                                ? "Skipped"
                                : "Missed"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </TooltipProvider>
            </Card>

            {/* Quick actions */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={isTodayDone ? "secondary" : "default"}
                size="sm"
                className="h-9 rounded-xl"
                onClick={handleMarkTodayDone}
                disabled={!todayScheduled}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {isTodayDone ? "Done" : "Mark"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl"
                onClick={handleSkipToday}
                disabled={!todayScheduled}
              >
                <SkipForward className="h-4 w-4 mr-2" />
                Skip
              </Button>

              <Button variant="outline" size="sm" className="h-9 rounded-xl" onClick={() => onEdit(activity)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>

            {/* Session history */}
            <Card className="rounded-2xl p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h4 className="text-sm font-semibold">Session History</h4>

                {/* segmented filter (new-gen) */}
                <div className="inline-flex items-center rounded-xl bg-muted/40 p-1">
                  {(["all", "done", "missed", "skipped"] as const).map((f) => (
                    <Button
                      key={f}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-7 px-2.5 text-[11px] rounded-lg",
                        sessionFilter === f
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                      onClick={() => setSessionFilter(f)}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                {sessionHistory.slice(0, 14).map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl px-2 py-2 text-xs hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-16">{format(s.date, "MMM d")}</span>
                      {s.hasNote && <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />}
                    </div>

                    <Badge
                      variant="secondary"
                      className={cn(
                        "rounded-full text-[11px]",
                        s.status === "done" && "bg-green-500/15 text-green-700",
                        s.status === "missed" && "bg-red-500/15 text-red-700",
                        s.status === "skipped" && "bg-yellow-500/15 text-yellow-700",
                        s.status === "not-scheduled" && "bg-muted text-muted-foreground",
                      )}
                    >
                      {s.status === "done" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {s.status === "missed" && <XCircle className="h-3 w-3 mr-1" />}
                      {s.status === "skipped" && <SkipForward className="h-3 w-3 mr-1" />}
                      {s.status.replace("-", " ")}
                    </Badge>
                  </div>
                ))}

                {sessionHistory.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">No sessions found</p>
                )}
              </div>
            </Card>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
