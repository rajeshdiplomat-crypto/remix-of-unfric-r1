import { useState, useMemo } from "react";
import { format, parseISO, addDays, isToday, isBefore, isAfter, subDays, eachDayOfInterval, startOfMonth, endOfMonth } from "date-fns";
import { X, Edit2, Copy, Archive, MoreVertical, Flame, Zap, Target, Clock, TrendingUp, Calendar, CheckCircle2, XCircle, SkipForward, StickyNote, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { ActivityImageUpload, loadActivityImage, saveActivityImage } from "./ActivityImageUpload";
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

interface ActivityDetailsDrawerProps {
  activity: ActivityItem | null;
  open: boolean;
  onClose: () => void;
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

export function ActivityDetailsDrawer({
  activity,
  open,
  onClose,
  onEdit,
  onToggleCompletion,
  onSkipDay,
  onImageChange,
}: ActivityDetailsDrawerProps) {
  const [sessionFilter, setSessionFilter] = useState<"all" | "done" | "missed" | "skipped">("all");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Load image on activity change
  useMemo(() => {
    if (activity) {
      setImageUrl(loadActivityImage(activity.id));
    }
  }, [activity?.id]);

  if (!activity) return null;

  const getEndDate = () => addDays(parseISO(activity.startDate), activity.numberOfDays - 1);

  const getDaysLeft = () => {
    const endDate = getEndDate();
    const today = new Date();
    const diff = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const isPlannedForDate = (date: Date) => {
    const startDate = parseISO(activity.startDate);
    const endDate = getEndDate();
    if (isBefore(date, startDate) || isAfter(date, endDate)) return false;
    const dayOfWeek = (date.getDay() + 6) % 7;
    return activity.frequencyPattern[dayOfWeek];
  };

  const isTodayScheduled = () => {
    const today = new Date();
    return isPlannedForDate(today);
  };

  const getScheduledSessions = () => {
    let count = 0;
    const startDate = parseISO(activity.startDate);
    const endDate = getEndDate();
    let currentDate = startDate;
    while (!isAfter(currentDate, endDate)) {
      const dayOfWeek = (currentDate.getDay() + 6) % 7;
      if (activity.frequencyPattern[dayOfWeek]) count++;
      currentDate = addDays(currentDate, 1);
    }
    return count;
  };

  const getPastScheduledSessions = () => {
    let count = 0;
    const startDate = parseISO(activity.startDate);
    const today = new Date();
    const endDate = getEndDate();
    const effectiveEnd = isBefore(today, endDate) ? today : endDate;
    let currentDate = startDate;
    while (!isAfter(currentDate, effectiveEnd)) {
      const dayOfWeek = (currentDate.getDay() + 6) % 7;
      if (activity.frequencyPattern[dayOfWeek]) count++;
      currentDate = addDays(currentDate, 1);
    }
    return count;
  };

  const getCompletedSessions = () => Object.values(activity.completions).filter(Boolean).length;
  
  const getSessionsLeft = () => Math.max(0, getScheduledSessions() - getCompletedSessions());

  const getCompletionPercent = () => {
    const scheduled = getPastScheduledSessions();
    if (scheduled === 0) return 0;
    return Math.round((getCompletedSessions() / scheduled) * 100);
  };

  const getCurrentStreak = () => {
    let streak = 0;
    let checkDate = new Date();
    while (true) {
      const dateStr = format(checkDate, "yyyy-MM-dd");
      const dayOfWeek = (checkDate.getDay() + 6) % 7;
      const isPlanned = activity.frequencyPattern[dayOfWeek];
      if (isPlanned) {
        if (activity.completions[dateStr]) {
          streak++;
        } else if (!isToday(checkDate)) {
          break;
        }
      }
      checkDate = subDays(checkDate, 1);
      if (isBefore(checkDate, parseISO(activity.startDate))) break;
    }
    return streak;
  };

  const getLongestStreak = () => {
    let longest = 0;
    let current = 0;
    const startDate = parseISO(activity.startDate);
    const endDate = getEndDate();
    let checkDate = startDate;
    while (!isAfter(checkDate, endDate)) {
      const dateStr = format(checkDate, "yyyy-MM-dd");
      const dayOfWeek = (checkDate.getDay() + 6) % 7;
      if (activity.frequencyPattern[dayOfWeek]) {
        if (activity.completions[dateStr]) {
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

  // On-track status
  const getOnTrackStatus = () => {
    const startDate = parseISO(activity.startDate);
    const today = new Date();
    if (isBefore(today, startDate)) return "upcoming";
    
    let expectedByToday = 0;
    let currentDate = startDate;
    while (!isAfter(currentDate, today)) {
      const dayOfWeek = (currentDate.getDay() + 6) % 7;
      if (activity.frequencyPattern[dayOfWeek]) expectedByToday++;
      currentDate = addDays(currentDate, 1);
    }
    
    const actualByToday = getCompletedSessions();
    if (actualByToday >= expectedByToday) return "on-track";
    return "behind";
  };

  // Last 7 days trend
  const getLast7DaysTrend = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "yyyy-MM-dd");
      const dayOfWeek = (date.getDay() + 6) % 7;
      const isPlanned = activity.frequencyPattern[dayOfWeek] && isPlannedForDate(date);
      const isCompleted = activity.completions[dateStr];
      
      data.push({
        day: format(date, "EEE"),
        date: format(date, "MMM d"),
        completion: isPlanned ? (isCompleted ? 100 : 0) : null,
        planned: isPlanned,
        completed: isCompleted,
      });
    }
    return data;
  };

  // Heat strip for last 30 days
  const getLast30DaysHeat = () => {
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "yyyy-MM-dd");
      const isPlanned = isPlannedForDate(date);
      const isCompleted = activity.completions[dateStr];
      const isSkipped = activity.skipped?.[dateStr];
      
      data.push({
        date,
        dateStr,
        isPlanned,
        isCompleted,
        isSkipped,
        isToday: isToday(date),
      });
    }
    return data;
  };

  // Session history
  const getSessionHistory = () => {
    const sessions = [];
    const startDate = parseISO(activity.startDate);
    const endDate = getEndDate();
    const today = new Date();
    let checkDate = isBefore(today, endDate) ? today : endDate;
    
    while (!isBefore(checkDate, startDate)) {
      const dateStr = format(checkDate, "yyyy-MM-dd");
      const dayOfWeek = (checkDate.getDay() + 6) % 7;
      const isPlanned = activity.frequencyPattern[dayOfWeek];
      const isCompleted = activity.completions[dateStr];
      const isSkipped = activity.skipped?.[dateStr];
      const hasNote = activity.notes?.[dateStr];
      
      let status: "done" | "missed" | "skipped" | "not-scheduled" = "not-scheduled";
      if (isPlanned) {
        if (isCompleted) status = "done";
        else if (isSkipped) status = "skipped";
        else if (!isToday(checkDate)) status = "missed";
      }
      
      sessions.push({
        date: checkDate,
        dateStr,
        status,
        hasNote: !!hasNote,
      });
      
      checkDate = subDays(checkDate, 1);
    }
    
    return sessions.filter(s => {
      if (sessionFilter === "all") return true;
      return s.status === sessionFilter;
    });
  };

  const handleImageChange = (url: string | null) => {
    saveActivityImage(activity.id, url);
    setImageUrl(url);
    onImageChange(activity.id, url);
  };

  const handleMarkTodayDone = () => {
    if (isTodayScheduled()) {
      onToggleCompletion(activity.id, new Date());
    }
  };

  const handleSkipToday = () => {
    if (isTodayScheduled()) {
      onSkipDay(activity.id, new Date());
    }
  };

  const onTrackStatus = getOnTrackStatus();
  const category = CATEGORIES[activity.category];
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const isTodayDone = activity.completions[todayStr];

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="w-[520px] sm:max-w-[520px] p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 bg-card border-b border-border">
            {/* Cover Image */}
            {imageUrl ? (
              <div className="relative h-32 w-full group">
                <img 
                  src={imageUrl} 
                  alt={activity.name} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h2 className="text-lg font-bold text-white">{activity.name}</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 bg-black/30 hover:bg-black/50 text-white"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <SheetHeader className="p-4 pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <SheetTitle className="text-lg">{activity.name}</SheetTitle>
                    <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(activity)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </SheetHeader>
            )}
            
            {/* Pills row */}
            <div className="px-4 py-2 flex items-center gap-2 flex-wrap">
              <Badge 
                variant="secondary"
                style={{ 
                  backgroundColor: `hsl(${category?.color || "0 0% 50%"} / 0.2)`,
                  color: `hsl(${category?.color || "0 0% 50%"})`
                }}
              >
                {category?.label.split(" ")[0] || activity.category}
              </Badge>
              <Badge variant="outline">{activity.priority}</Badge>
              <Badge 
                variant={onTrackStatus === "on-track" ? "default" : "destructive"}
                className={cn(
                  onTrackStatus === "on-track" && "bg-green-500/20 text-green-600 hover:bg-green-500/30",
                  onTrackStatus === "behind" && "bg-red-500/20 text-red-600 hover:bg-red-500/30"
                )}
              >
                {onTrackStatus === "on-track" ? "On track" : onTrackStatus === "behind" ? "Behind" : "Upcoming"}
              </Badge>
            </div>

            {/* Image upload if no image */}
            {!imageUrl && (
              <div className="px-4 pb-3">
                <ActivityImageUpload
                  imageUrl={null}
                  onImageChange={handleImageChange}
                  compact
                />
              </div>
            )}
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* KPI Strip */}
              <div className="grid grid-cols-3 gap-2">
                <Card className="p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{getCompletionPercent()}%</p>
                  <p className="text-[10px] text-muted-foreground">Completion</p>
                </Card>
                <Card className="p-3 text-center">
                  <p className="text-2xl font-bold text-foreground flex items-center justify-center gap-1">
                    <Flame className="h-4 w-4 text-orange-500" />
                    {getCurrentStreak()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Streak</p>
                </Card>
                <Card className="p-3 text-center">
                  <p className="text-2xl font-bold text-foreground flex items-center justify-center gap-1">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    {getLongestStreak()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Best</p>
                </Card>
                <Card className="p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{getSessionsLeft()}</p>
                  <p className="text-[10px] text-muted-foreground">Sessions left</p>
                </Card>
                <Card className="p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{getDaysLeft()}</p>
                  <p className="text-[10px] text-muted-foreground">Days left</p>
                </Card>
                <Card className="p-3 text-center">
                  <Badge 
                    variant="secondary"
                    className={cn(
                      "text-xs",
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
              <Card className="p-4">
                <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Schedule
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Date Range</p>
                    <p className="font-medium text-foreground">
                      {format(parseISO(activity.startDate), "MMM d")} → {format(getEndDate(), "MMM d")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-medium text-foreground">{activity.numberOfDays} calendar days</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Frequency</p>
                    <p className="font-medium text-foreground">
                      {activity.frequencyPattern.filter(Boolean).length} days/week
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Days</p>
                    <p className="font-medium text-foreground">
                      {activity.frequencyPattern.map((active, i) => active ? FULL_DAY_LABELS[i] : null).filter(Boolean).join(", ")}
                    </p>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-border grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-foreground">{getScheduledSessions()}</p>
                      <p className="text-[10px] text-muted-foreground">Scheduled</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-green-600">{getCompletedSessions()}</p>
                      <p className="text-[10px] text-muted-foreground">Completed</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-red-500">{getPastScheduledSessions() - getCompletedSessions()}</p>
                      <p className="text-[10px] text-muted-foreground">Missed</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{getSessionsLeft()}</p>
                      <p className="text-[10px] text-muted-foreground">Left</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Charts */}
              <Card className="p-4">
                <h4 className="font-medium text-foreground mb-3">Last 7 Days</h4>
                <div className="h-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getLast7DaysTrend()} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <RechartsTooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-popover text-popover-foreground p-2 rounded shadow text-xs">
                                <p className="font-medium">{data.date}</p>
                                <p>{data.planned ? (data.completed ? "Completed" : "Missed") : "Not scheduled"}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="completion" 
                        fill="hsl(var(--primary))" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* 30-Day Heat Strip */}
              <Card className="p-4">
                <h4 className="font-medium text-foreground mb-3">Last 30 Days</h4>
                <div className="flex flex-wrap gap-1">
                  {getLast30DaysHeat().map((day, i) => (
                    <TooltipProvider key={i}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "h-4 w-4 rounded-sm transition-colors",
                              day.isCompleted && "bg-green-500",
                              !day.isCompleted && day.isPlanned && !day.isToday && "bg-red-500/50",
                              day.isSkipped && "bg-yellow-500/50",
                              !day.isPlanned && "bg-muted/30",
                              day.isToday && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{format(day.date, "MMM d")}</p>
                          <p className="text-xs">
                            {day.isCompleted ? "Completed" : day.isSkipped ? "Skipped" : day.isPlanned ? "Missed" : "Not scheduled"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </Card>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        className="flex-1 gap-2" 
                        size="sm"
                        disabled={!isTodayScheduled() || isTodayDone}
                        onClick={handleMarkTodayDone}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {isTodayDone ? "Done Today" : "Mark Today Done"}
                      </Button>
                    </TooltipTrigger>
                    {!isTodayScheduled() && (
                      <TooltipContent>
                        <p>Not scheduled today</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-2"
                  disabled={!isTodayScheduled()}
                  onClick={handleSkipToday}
                >
                  <SkipForward className="h-4 w-4" />
                  Skip
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-2"
                  onClick={() => onEdit(activity)}
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </Button>
              </div>

              {/* Session History */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-foreground">Session History</h4>
                  <div className="flex gap-1">
                    {(["all", "done", "missed", "skipped"] as const).map((filter) => (
                      <Button
                        key={filter}
                        variant={sessionFilter === filter ? "default" : "ghost"}
                        size="sm"
                        className="h-6 px-2 text-xs capitalize"
                        onClick={() => setSessionFilter(filter)}
                      >
                        {filter}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {getSessionHistory().slice(0, 20).map((session, i) => (
                    <div 
                      key={i}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        {session.status === "done" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        {session.status === "missed" && <XCircle className="h-4 w-4 text-red-500" />}
                        {session.status === "skipped" && <SkipForward className="h-4 w-4 text-yellow-500" />}
                        {session.status === "not-scheduled" && <div className="h-4 w-4" />}
                        <span className="text-sm text-foreground">{format(session.date, "EEE, MMM d")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.hasNote && <StickyNote className="h-3 w-3 text-muted-foreground" />}
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "text-[10px] capitalize",
                            session.status === "done" && "bg-green-500/20 text-green-600",
                            session.status === "missed" && "bg-red-500/20 text-red-600",
                            session.status === "skipped" && "bg-yellow-500/20 text-yellow-600"
                          )}
                        >
                          {session.status.replace("-", " ")}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
