import { useState, useMemo, useEffect } from "react";
import { format, parseISO, addDays, isToday, isBefore, isAfter, subDays } from "date-fns";
import { Edit2, Flame, Zap, Target, Clock, TrendingUp, Calendar, CheckCircle2, XCircle, SkipForward, StickyNote, Sparkles, Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { loadActivityImage, saveActivityImage } from "./ActivityImageUpload";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  name: string;
  category: string;
  priority: string;
  description: string;
  frequencyPattern: boolean[];
  numberOfDays: number;
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
    if (activity) {
      setImageUrl(loadActivityImage(activity.id));
    } else {
      setImageUrl(null);
    }
  }, [activity?.id, activity?.completions]);

  // Helper functions
  const getEndDate = (act: ActivityItem) => addDays(parseISO(act.startDate), act.numberOfDays - 1);

  const getDaysLeft = (act: ActivityItem) => {
    const endDate = getEndDate(act);
    const today = new Date();
    const diff = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

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
  const getMissedSessions = (act: ActivityItem) => Math.max(0, getPastScheduledSessions(act) - getCompletedSessions(act));
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
        if (act.completions[dateStr]) {
          streak++;
        } else if (!isToday(checkDate)) {
          break;
        }
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
        } else {
          current = 0;
        }
      }
      checkDate = addDays(checkDate, 1);
    }
    return longest;
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
    if (actualByToday >= expectedByToday) return "on-track";
    return "behind";
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
        completion: isPlanned ? (isCompleted ? 100 : 0) : null,
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
    const sessions = [];
    const startDate = parseISO(act.startDate);
    const endDate = getEndDate(act);
    const today = new Date();
    let checkDate = isBefore(today, endDate) ? today : endDate;
    while (!isBefore(checkDate, startDate) && sessions.length < 30) {
      const dateStr = format(checkDate, "yyyy-MM-dd");
      const dayOfWeek = (checkDate.getDay() + 6) % 7;
      const isPlanned = act.frequencyPattern[dayOfWeek];
      const isCompleted = act.completions[dateStr];
      const isSkipped = act.skipped?.[dateStr];
      const hasNote = act.notes?.[dateStr];
      let status: "done" | "missed" | "skipped" | "not-scheduled" = "not-scheduled";
      if (isPlanned) {
        if (isCompleted) status = "done";
        else if (isSkipped) status = "skipped";
        else if (!isToday(checkDate)) status = "missed";
      }
      sessions.push({ date: checkDate, dateStr, status, hasNote: !!hasNote });
      checkDate = subDays(checkDate, 1);
    }
    return sessions.filter(s => {
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
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleImageUpload(file);
    }
  };

  const handleRemoveImage = () => {
    if (!activity) return;
    saveActivityImage(activity.id, null);
    setImageUrl(null);
    onImageChange(activity.id, null);
  };

  const handleMarkTodayDone = () => {
    if (activity && isTodayScheduled(activity)) {
      onToggleCompletion(activity.id, new Date());
    }
  };

  const handleSkipToday = () => {
    if (activity && isTodayScheduled(activity)) {
      onSkipDay(activity.id, new Date());
    }
  };

  // Default state - no activity selected
  if (!activity) {
    return (
      <div className="w-[400px] h-[calc(100vh-32px)] sticky top-4 bg-card border border-border rounded-xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">Activity Assistant</h3>
              <p className="text-xs text-muted-foreground">Track your progress</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-4 space-y-4">
          {/* Upload placeholder */}
          <Card className="border-dashed border-2 border-muted-foreground/30 bg-muted/20 p-6">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Upload Image</p>
              <p className="text-xs text-muted-foreground">Select an activity to upload cover</p>
            </div>
          </Card>

          {/* Select activity placeholder */}
          <Card className="p-6 text-center">
            <Target className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Select an activity to preview</p>
            <p className="text-xs text-muted-foreground mt-1">Click any activity card on the left</p>
          </Card>
        </div>
      </div>
    );
  }

  const category = CATEGORIES[activity.category];
  const onTrackStatus = getOnTrackStatus(activity);
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const isTodayDone = activity.completions[todayStr];
  const todayScheduled = isTodayScheduled(activity);
  const trendData = getLast7DaysTrend(activity);
  const heatData = getLast30DaysHeat(activity);
  const sessionHistory = getSessionHistory(activity);

  return (
    <div className="w-[400px] h-[calc(100vh-32px)] sticky top-4 bg-card border border-border rounded-xl flex flex-col overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {/* Cover Image Section */}
          {imageUrl ? (
            <div className="relative h-36 w-full group">
              <img src={imageUrl} alt={activity.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h2 className="text-lg font-bold text-white">{activity.name}</h2>
                <p className="text-xs text-white/70 line-clamp-1">{activity.description}</p>
              </div>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 bg-black/40 hover:bg-black/60 text-white"
                  onClick={handleRemoveImage}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 border-b border-border">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{activity.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{activity.description}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => onEdit(activity)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Image drop zone */}
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer",
                  isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/30 hover:border-muted-foreground/50"
                )}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById("panel-image-upload")?.click()}
              >
                <div className="flex flex-col items-center text-center">
                  <ImageIcon className="h-6 w-6 text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">Drop image or click to upload</p>
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

          {/* Pills row */}
          <div className="px-4 py-3 flex items-center gap-2 flex-wrap border-b border-border">
            <Badge
              variant="secondary"
              style={{
                backgroundColor: `hsl(${category?.color || "0 0% 50%"} / 0.2)`,
                color: `hsl(${category?.color || "0 0% 50%"})`,
              }}
            >
              {category?.label.split(" ")[0] || activity.category}
            </Badge>
            <Badge variant="outline">{activity.priority}</Badge>
            <Badge
              className={cn(
                "text-xs",
                onTrackStatus === "on-track" && "bg-green-500/20 text-green-600 border-green-500/30",
                onTrackStatus === "behind" && "bg-red-500/20 text-red-600 border-red-500/30",
                onTrackStatus === "upcoming" && "bg-blue-500/20 text-blue-600 border-blue-500/30"
              )}
            >
              {onTrackStatus === "on-track" ? "On track" : onTrackStatus === "behind" ? "Behind" : "Upcoming"}
            </Badge>
          </div>

          <div className="p-4 space-y-4">
            {/* KPI Grid */}
            <div className="grid grid-cols-3 gap-2">
              <Card className="p-2.5 text-center">
                <p className="text-xl font-bold text-foreground">{getCompletionPercent(activity)}%</p>
                <p className="text-[10px] text-muted-foreground">Completion</p>
              </Card>
              <Card className="p-2.5 text-center">
                <p className="text-xl font-bold text-foreground flex items-center justify-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                  {getCurrentStreak(activity)}
                </p>
                <p className="text-[10px] text-muted-foreground">Streak</p>
              </Card>
              <Card className="p-2.5 text-center">
                <p className="text-xl font-bold text-foreground flex items-center justify-center gap-1">
                  <Zap className="h-3.5 w-3.5 text-yellow-500" />
                  {getLongestStreak(activity)}
                </p>
                <p className="text-[10px] text-muted-foreground">Best</p>
              </Card>
              <Card className="p-2.5 text-center">
                <p className="text-xl font-bold text-foreground">{getSessionsLeft(activity)}</p>
                <p className="text-[10px] text-muted-foreground">Left</p>
              </Card>
              <Card className="p-2.5 text-center">
                <p className="text-xl font-bold text-foreground">{getDaysLeft(activity)}</p>
                <p className="text-[10px] text-muted-foreground">Days</p>
              </Card>
              <Card className="p-2.5 text-center flex flex-col items-center justify-center">
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px] px-1.5",
                    onTrackStatus === "on-track" && "bg-green-500/20 text-green-600",
                    onTrackStatus === "behind" && "bg-red-500/20 text-red-600"
                  )}
                >
                  {onTrackStatus === "on-track" ? "On track" : "Behind"}
                </Badge>
                <p className="text-[10px] text-muted-foreground mt-1">Status</p>
              </Card>
            </div>

            {/* Schedule Block */}
            <Card className="p-3">
              <h4 className="font-medium text-foreground text-sm mb-2 flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Schedule
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Date Range</p>
                  <p className="font-medium text-foreground">
                    {format(parseISO(activity.startDate), "MMM d")} → {format(getEndDate(activity), "MMM d")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium text-foreground">{activity.numberOfDays} days</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Frequency</p>
                  <p className="font-medium text-foreground">{activity.frequencyPattern.filter(Boolean).length} days/week</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Days</p>
                  <p className="font-medium text-foreground">
                    {activity.frequencyPattern.map((d, i) => d ? FULL_DAY_LABELS[i].charAt(0) : "").filter(Boolean).join("")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Scheduled</p>
                  <p className="font-medium text-foreground">{getScheduledSessions(activity)} sessions</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Completed / Missed</p>
                  <p className="font-medium text-foreground">
                    <span className="text-green-600">{getCompletedSessions(activity)}</span>
                    <span className="text-muted-foreground"> / </span>
                    <span className="text-red-500">{getMissedSessions(activity)}</span>
                  </p>
                </div>
              </div>
            </Card>

            {/* 7-Day Trend Chart */}
            <Card className="p-3">
              <h4 className="font-medium text-foreground text-sm mb-2 flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                Last 7 Days
              </h4>
              <div className="h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <XAxis dataKey="day" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-popover border border-border rounded-md px-2 py-1 text-xs shadow-md">
                              <p className="font-medium">{data.date}</p>
                              <p className="text-muted-foreground">
                                {data.planned ? (data.completed ? "Done ✓" : "Missed") : "Not scheduled"}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey={(d: typeof trendData[0]) => (d.planned ? (d.completed ? 100 : 20) : 5)}
                      fill="hsl(var(--primary))"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* 30-Day Heat Strip */}
            <Card className="p-3">
              <h4 className="font-medium text-foreground text-sm mb-2">Last 30 Days</h4>
              <div className="flex flex-wrap gap-1">
                {heatData.map((day, idx) => (
                  <Tooltip key={idx}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "h-4 w-4 rounded-sm transition-colors",
                          !day.isPlanned && "bg-muted/30",
                          day.isPlanned && !day.isCompleted && !day.isSkipped && "bg-red-500/40",
                          day.isCompleted && "bg-green-500",
                          day.isSkipped && "bg-yellow-500/50",
                          day.isToday && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                        )}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p>{format(day.date, "MMM d")}</p>
                      <p className="text-muted-foreground">
                        {!day.isPlanned ? "Not scheduled" : day.isCompleted ? "Completed" : day.isSkipped ? "Skipped" : "Missed"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </Card>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex-1">
                      <Button
                        variant={isTodayDone ? "secondary" : "default"}
                        size="sm"
                        className="w-full gap-1.5"
                        onClick={handleMarkTodayDone}
                        disabled={!todayScheduled}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {isTodayDone ? "Done ✓" : "Mark Today"}
                      </Button>
                    </div>
                  </TooltipTrigger>
                  {!todayScheduled && (
                    <TooltipContent>
                      <p>Not scheduled today</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleSkipToday} disabled={!todayScheduled}>
                <SkipForward className="h-3.5 w-3.5" />
                Skip
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onEdit(activity)}>
                <Edit2 className="h-3.5 w-3.5" />
                Edit
              </Button>
            </div>

            {/* Session History */}
            <Card className="p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-foreground text-sm">Session History</h4>
                <div className="flex gap-1">
                  {(["all", "done", "missed"] as const).map((filter) => (
                    <Button
                      key={filter}
                      variant={sessionFilter === filter ? "secondary" : "ghost"}
                      size="sm"
                      className="h-6 px-2 text-[10px]"
                      onClick={() => setSessionFilter(filter)}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {sessionHistory.slice(0, 14).map((session, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 text-xs border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-16">{format(session.date, "MMM d")}</span>
                      {session.hasNote && <StickyNote className="h-3 w-3 text-muted-foreground" />}
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px] px-1.5",
                        session.status === "done" && "bg-green-500/20 text-green-600",
                        session.status === "missed" && "bg-red-500/20 text-red-600",
                        session.status === "skipped" && "bg-yellow-500/20 text-yellow-600",
                        session.status === "not-scheduled" && "bg-muted text-muted-foreground"
                      )}
                    >
                      {session.status === "done" && <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />}
                      {session.status === "missed" && <XCircle className="h-2.5 w-2.5 mr-0.5" />}
                      {session.status === "skipped" && <SkipForward className="h-2.5 w-2.5 mr-0.5" />}
                      {session.status.charAt(0).toUpperCase() + session.status.slice(1).replace("-", " ")}
                    </Badge>
                  </div>
                ))}
                {sessionHistory.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">No sessions found</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}