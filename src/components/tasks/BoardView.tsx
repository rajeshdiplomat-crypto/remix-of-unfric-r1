import { useState, useMemo, useEffect } from "react";
import { useDatePreferences } from "@/hooks/useDatePreferences";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  CheckCircle2,
  Circle,
  Coffee,
  Dumbbell,
  Bike,
  Users,
  Mail,
  UtensilsCrossed,
  Briefcase,
  BookOpen,
  Music,
  ShoppingCart,
  Heart,
  Star,
  Clock,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Timer,
  Sunrise,
  Target,
  Zap,
  Sparkles,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { QuadrantTask, computeTaskStatus } from "./types";
import { format, parseISO, isSameDay, addDays } from "date-fns";

interface BoardViewProps {
  mode: string;
  tasks: QuadrantTask[];
  onTaskClick: (task: QuadrantTask) => void;
  onDragStart: (e: React.DragEvent, task: QuadrantTask) => void;
  onDrop: (columnId: string, task: QuadrantTask) => void;
  onQuickAdd: (title: string, columnId: string) => void;
  onStartTask?: (task: QuadrantTask) => void;
  onCompleteTask?: (task: QuadrantTask) => void;
}

const TASK_COLORS = [
  { bg: "bg-gradient-to-br from-rose-500 to-pink-600", border: "border-rose-200", light: "bg-rose-50" },
  { bg: "bg-gradient-to-br from-blue-500 to-indigo-600", border: "border-blue-200", light: "bg-blue-50" },
  { bg: "bg-gradient-to-br from-emerald-500 to-teal-600", border: "border-emerald-200", light: "bg-emerald-50" },
  { bg: "bg-gradient-to-br from-amber-500 to-orange-600", border: "border-amber-200", light: "bg-amber-50" },
  { bg: "bg-gradient-to-br from-purple-500 to-violet-600", border: "border-purple-200", light: "bg-purple-50" },
  { bg: "bg-gradient-to-br from-cyan-500 to-sky-600", border: "border-cyan-200", light: "bg-cyan-50" },
];

const getTaskStyle = (task: QuadrantTask, index: number) => {
  const title = task.title.toLowerCase();
  const tags = task.tags?.map((t) => t.toLowerCase()) || [];
  const colorSet = TASK_COLORS[index % TASK_COLORS.length];

  let icon = Star;

  if (title.includes("workout") || title.includes("exercise") || title.includes("gym") || tags.includes("fitness")) {
    icon = Dumbbell;
  } else if (title.includes("yoga") || title.includes("meditat") || tags.includes("health")) {
    icon = Heart;
  } else if (title.includes("bike") || title.includes("cycle") || title.includes("commute")) {
    icon = Bike;
  } else if (title.includes("meeting") || title.includes("call") || title.includes("team") || tags.includes("meeting")) {
    icon = Users;
  } else if (title.includes("email") || title.includes("mail") || tags.includes("email")) {
    icon = Mail;
  } else if (title.includes("lunch") || title.includes("dinner") || title.includes("breakfast") || title.includes("eat")) {
    icon = UtensilsCrossed;
  } else if (title.includes("work") || title.includes("project") || tags.includes("work")) {
    icon = Briefcase;
  } else if (title.includes("read") || title.includes("study") || title.includes("learn")) {
    icon = BookOpen;
  } else if (title.includes("music") || title.includes("practice")) {
    icon = Music;
  } else if (title.includes("shop") || title.includes("buy") || title.includes("groceries")) {
    icon = ShoppingCart;
  } else if (title.includes("morning") || title.includes("wake") || title.includes("rise")) {
    icon = Coffee;
  } else if (title.includes("sunrise") || title.includes("shine")) {
    icon = Sunrise;
  } else if (tags.includes("habit")) {
    icon = Target;
  } else if (task.priority === "high") {
    icon = Zap;
  } else if (task.importance === "high") {
    icon = Sparkles;
  } else if (task.urgency === "high") {
    icon = Flag;
  }

  return { icon, ...colorSet };
};

const parseTimeToMinutes = (timeStr: string | null): number => {
  if (!timeStr) return 9 * 60;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + (minutes || 0);
};

const formatTime = (minutes: number): string => {
  const normalizedMinutes = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalizedMinutes / 60);
  const mins = normalizedMinutes % 60;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
};

const formatDuration = (minutes: number): string => {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
    return `${hours}h ${mins}min`;
  }
  return `${minutes} min`;
};

const getTaskDuration = (startTime: string | null, endTime: string | null): number => {
  if (!startTime) return 30;
  if (!endTime) return 30;
  const startMinutes = parseTimeToMinutes(startTime);
  let endMinutes = parseTimeToMinutes(endTime);
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }
  return endMinutes - startMinutes;
};

// Height per hour in pixels
const HOUR_HEIGHT_DESKTOP = 60;
const HOUR_HEIGHT_MOBILE_EMPTY = 24;  // 60% reduction for empty slots
const HOUR_HEIGHT_MOBILE_ACTIVE = 60; // Full height for slots with tasks

export function BoardView({ tasks, onTaskClick, onCompleteTask }: BoardViewProps) {
  const { formatDate: fmtDate } = useDatePreferences();
  const isMobile = useIsMobile();
  const HOUR_HEIGHT = isMobile ? HOUR_HEIGHT_MOBILE_EMPTY : HOUR_HEIGHT_DESKTOP;
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const dayTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        if (!task.due_date) return false;
        return isSameDay(parseISO(task.due_date), selectedDate);
      })
      .sort((a, b) => parseTimeToMinutes(a.due_time) - parseTimeToMinutes(b.due_time));
  }, [tasks, selectedDate]);

  const timelineStart = 0;
  const timelineEnd = 24 * 60 - 1;
  const totalHours = 24;

  // On mobile, build a set of hours that contain tasks (for dynamic height)
  const activeHours = useMemo(() => {
    if (!isMobile) return new Set<number>();
    const hours = new Set<number>();
    dayTasks.forEach((task) => {
      const startMin = parseTimeToMinutes(task.due_time);
      const duration = getTaskDuration(task.due_time, task.end_time);
      const endMin = startMin + duration;
      const startHour = Math.floor(startMin / 60);
      const endHour = Math.ceil(endMin / 60);
      for (let h = startHour; h < endHour; h++) {
        hours.add(h);
      }
    });
    return hours;
  }, [dayTasks, isMobile]);

  // Calculate cumulative Y position for each hour on mobile (dynamic heights)
  const hourYPositions = useMemo(() => {
    const positions: number[] = [];
    let cumY = 0;
    for (let h = 0; h < 24; h++) {
      positions.push(cumY);
      if (isMobile) {
        cumY += activeHours.has(h) ? HOUR_HEIGHT_MOBILE_ACTIVE : HOUR_HEIGHT_MOBILE_EMPTY;
      } else {
        cumY += HOUR_HEIGHT_DESKTOP;
      }
    }
    positions.push(cumY); // position[24] = total height
    return positions;
  }, [isMobile, activeHours]);

  const totalHeight = hourYPositions[24];

  const hourMarkers = useMemo(() => {
    const markers: { minutes: number; label: string; hour: number }[] = [];
    for (let hour = 0; hour <= 23; hour++) {
      markers.push({
        minutes: hour * 60,
        label: formatTime(hour * 60),
        hour,
      });
    }
    return markers;
  }, []);

  // Get pixel position for a given minute value using dynamic hour heights
  const getPixelPosition = (minutes: number): number => {
    if (!isMobile) {
      return (minutes / 60) * HOUR_HEIGHT_DESKTOP;
    }
    const hour = Math.floor(minutes / 60);
    const minuteOffset = minutes % 60;
    const hourHeight = activeHours.has(hour) ? HOUR_HEIGHT_MOBILE_ACTIVE : HOUR_HEIGHT_MOBILE_EMPTY;
    const baseY = hourYPositions[Math.min(hour, 23)];
    return baseY + (minuteOffset / 60) * hourHeight;
  };

  const isToday = isSameDay(selectedDate, today);
  const isCurrentTimeVisible = currentTimeMinutes >= timelineStart && currentTimeMinutes <= timelineEnd;
  const currentTimePosition = getPixelPosition(currentTimeMinutes);

  const getRemainingTime = (task: QuadrantTask): number | null => {
    if (!isToday) return null;
    const startMinutes = parseTimeToMinutes(task.due_time);
    const duration = getTaskDuration(task.due_time, task.end_time);
    const endMinutes = startMinutes + duration;
    if (currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes) {
      return endMinutes - currentTimeMinutes;
    }
    return null;
  };

  const timelineEvents = useMemo(() => {
    const events: Array<{
      type: "task";
      startMinutes: number;
      endMinutes: number;
      task: QuadrantTask;
      taskIndex: number;
    }> = [];

    if (dayTasks.length === 0) return events;

    dayTasks.forEach((task, idx) => {
      const startMinutes = parseTimeToMinutes(task.due_time);
      const duration = getTaskDuration(task.due_time, task.end_time);
      const endMinutes = startMinutes + duration;
      events.push({ type: "task", startMinutes, endMinutes, task, taskIndex: idx });
    });

    return events;
  }, [dayTasks]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
      {/* Header with date navigation */}
      <div className="shrink-0 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
        {isMobile ? (
          /* Compact mobile header — slim date flipper row */
          <div className="flex items-center justify-between px-3 py-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full"
              onClick={() => setSelectedDate(addDays(selectedDate, -1))}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <button
              onClick={() => setSelectedDate(today)}
              className={cn(
                "px-2.5 py-0.5 rounded-full text-[10px] font-medium transition-all",
                isToday
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-foreground",
              )}
            >
              {isToday ? "Today" : fmtDate(selectedDate, "weekday")}
            </button>
            <span className="text-[9px] text-muted-foreground">
              {dayTasks.length} tasks
            </span>
            {isToday && (
              <span className="text-[9px] text-destructive font-medium">{formatTime(currentTimeMinutes)}</span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full"
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          /* Desktop header */
          <>
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h2 className="font-semibold text-lg text-slate-800 dark:text-slate-100">Day Planner</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => setSelectedDate(addDays(selectedDate, -1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <button
                  onClick={() => setSelectedDate(today)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                    isToday
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/50"
                      : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200",
                  )}
                >
                  {isToday ? "Today" : fmtDate(selectedDate, "weekday")}
                </button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {/* Stats bar — desktop only */}
            <div className="flex items-center gap-6 px-4 pb-3 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-slate-600 dark:text-slate-400">{dayTasks.length} task{dayTasks.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-600 dark:text-slate-400">{dayTasks.filter((t) => t.is_completed).length} completed</span>
              </div>
              {isToday && (
                <div className="flex items-center gap-1.5">
                  <Timer className="h-3.5 w-3.5 text-rose-500" />
                  <span className="text-rose-600 dark:text-rose-400 font-medium">{formatTime(currentTimeMinutes)}</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Timeline content */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative flex" style={{ minHeight: `${totalHeight}px` }}>
          {/* Hour labels column */}
          <div className={cn(
            "shrink-0 border-r border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 pt-2",
            isMobile ? "w-12" : "w-20"
          )}>
            {hourMarkers.map(({ minutes, label, hour }) => (
              <div
                key={minutes}
                className={cn(
                  "absolute left-0 flex items-start justify-end",
                  isMobile ? "w-12 pr-1" : "w-20 pr-3"
                )}
                style={{
                  top: `${hourYPositions[hour] + 8}px`,
                }}
              >
                <span className={cn(
                  "font-medium text-slate-500 dark:text-slate-400 -translate-y-1/2",
                  isMobile ? "text-[8px]" : "text-xs"
                )}>{label}</span>
              </div>
            ))}
          </div>

          {/* Timeline content area */}
          <div className="flex-1 relative pt-2">
            {/* Hour grid lines */}
            {hourMarkers.map(({ minutes, hour }) => (
              <div
                key={minutes}
                className={cn(
                  "absolute left-0 right-0 border-t",
                  isMobile && activeHours.has(hour)
                    ? "border-slate-200 dark:border-slate-700"
                    : "border-slate-100 dark:border-slate-800"
                )}
                style={{ top: `${hourYPositions[hour] + 8}px` }}
              />
            ))}

            {/* Timeline spine */}
            <div className={cn(
              "absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 via-blue-400 to-blue-300 dark:from-blue-600 dark:via-blue-500 dark:to-blue-600",
              isMobile ? "left-3" : "left-6"
            )} />

            {/* Current time indicator */}
            {isToday && isCurrentTimeVisible && (
              <>
                <div
                  className={cn(
                    "absolute right-0 flex items-center z-30 pointer-events-none",
                    isMobile ? "-left-12" : "-left-20"
                  )}
                  style={{ top: `${currentTimePosition + 8}px` }}
                >
                  <div className={cn("flex-1", isMobile ? "h-px bg-primary" : "h-[2px] bg-rose-500")} />
                </div>
                {!isMobile && (
                  <div
                    className="absolute z-30 pointer-events-none"
                    style={{ top: `${currentTimePosition + 8}px`, left: '18px' }}
                  >
                    <div className="w-3 h-3 rounded-full bg-rose-500 shadow-lg shadow-rose-300 dark:shadow-rose-900 animate-pulse -translate-y-1/2" />
                  </div>
                )}
              </>
            )}

            {/* Empty state */}
            {dayTasks.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                <div className={cn("rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4", isMobile ? "w-14 h-14" : "w-20 h-20")}>
                  <Calendar className={cn("text-slate-300 dark:text-slate-600", isMobile ? "h-7 w-7" : "h-10 w-10")} />
                </div>
                <p className={cn("text-slate-500 dark:text-slate-400 font-medium", isMobile ? "text-sm" : "text-lg")}>No tasks scheduled</p>
                <p className={cn("text-slate-400 dark:text-slate-500 mt-1 max-w-xs", isMobile ? "text-[11px]" : "text-sm")}>
                  {isToday ? "Add tasks with a start time to see them here" : fmtDate(selectedDate, "weekdayFull")}
                </p>
              </div>
            )}

            {/* Timeline events */}
            {timelineEvents.map((event) => {
              const task = event.task;
              const taskIndex = event.taskIndex;
              const { icon: Icon, bg, border } = getTaskStyle(task, taskIndex);
              const status = computeTaskStatus(task);
              const remaining = getRemainingTime(task);
              const isOngoing = remaining !== null;
              const duration = event.endMinutes - event.startMinutes;
              const position = getPixelPosition(event.startMinutes);
              const endPosition = getPixelPosition(event.endMinutes);
              const taskHeight = endPosition - position;
              const isCompact = isMobile || taskHeight < 50;

              return (
                <div
                  key={task.id}
                  className={cn("absolute", isMobile ? "left-6 right-1.5" : "left-10 right-4")}
                  style={{
                    top: `${position + 8}px`,
                    height: `${Math.max(taskHeight, isMobile ? 22 : 24)}px`,
                  }}
                >
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      "absolute w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 shadow-sm z-10",
                      isMobile ? "-left-[11px]" : "-left-[14px]",
                      task.is_completed
                        ? "bg-emerald-500"
                        : isOngoing
                          ? "bg-rose-500 animate-pulse"
                          : bg.replace("bg-gradient-to-br", "bg").split(" ")[1],
                    )}
                    style={{ top: `${Math.min(6, taskHeight / 2 - 5)}px` }}
                  />

                  {/* Task card */}
                  <div
                    onClick={() => onTaskClick(task)}
                    className={cn(
                      "group relative h-full rounded-lg border cursor-pointer transition-all duration-200 overflow-hidden",
                      isMobile ? "ml-1.5 border" : "ml-4 border-2",
                      "hover:shadow-lg hover:scale-[1.01]",
                      task.is_completed
                        ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-70"
                        : cn("bg-white dark:bg-slate-800", border, "hover:border-blue-400 dark:hover:border-blue-500"),
                      isOngoing && "ring-2 ring-rose-400 ring-offset-1 dark:ring-offset-slate-900 border-rose-300",
                      status === "overdue" && !task.is_completed && "border-red-300 bg-red-50 dark:bg-red-900/20",
                    )}
                  >
                    {isCompact ? (
                      <div className="flex items-center gap-1.5 px-2 h-full">
                        <div className={cn("w-5 h-5 rounded flex items-center justify-center shrink-0", bg, task.is_completed && "opacity-50")}>
                          <Icon className="h-2.5 w-2.5 text-white" />
                        </div>
                        <span className={cn("text-[11px] font-medium text-slate-800 dark:text-slate-100 truncate flex-1", task.is_completed && "line-through opacity-60")}>
                          {task.title}
                        </span>
                        <span className="text-[9px] text-slate-400 shrink-0">
                          {formatTime(event.startMinutes)}-{formatTime(event.endMinutes)}
                        </span>
                        {(task.urgency === "high" || task.importance === "high") && (
                          <div className="flex gap-0.5 shrink-0">
                            {task.urgency === "high" && <span className="w-1.5 h-1.5 rounded-full bg-red-500" title="Urgent" />}
                            {task.importance === "high" && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Important" />}
                          </div>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); onCompleteTask?.(task); }} className="shrink-0">
                          {task.is_completed ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Circle className="h-3.5 w-3.5 text-slate-300 hover:text-blue-500" />}
                        </button>
                      </div>
                    ) : (
                      /* Full layout for longer tasks */
                      <div className="flex items-start gap-2 p-2 h-full">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm", bg, task.is_completed && "opacity-50")}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                              {formatTime(event.startMinutes)} - {formatTime(event.endMinutes)}
                            </span>
                            <span className="text-[10px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500">
                              {formatDuration(duration)}
                            </span>
                            {remaining !== null && (
                              <span className="text-[10px] px-1 py-0.5 rounded bg-rose-100 text-rose-600 font-medium animate-pulse">
                                {remaining}m left
                              </span>
                            )}
                          </div>
                          <h3 className={cn("text-sm font-semibold text-slate-800 dark:text-slate-100 truncate", task.is_completed && "line-through opacity-60")}>
                            {task.title}
                          </h3>
                          <div className="flex items-center gap-1 mt-1">
                            {task.urgency === "high" && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 font-medium flex items-center gap-0.5">
                                <Zap className="h-2.5 w-2.5" /> Urgent
                              </span>
                            )}
                            {task.urgency === "low" && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">Not Urgent</span>
                            )}
                            {task.importance === "high" && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-medium flex items-center gap-0.5">
                                <Star className="h-2.5 w-2.5" /> Important
                              </span>
                            )}
                            {task.importance === "low" && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">Not Important</span>
                            )}
                          </div>
                          {task.tags && task.tags.length > 0 && taskHeight >= 80 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {task.tags.slice(0, 2).map((tag, tagIdx) => (
                                <span key={tag} className={cn("px-1.5 py-0.5 text-[9px] font-medium rounded-full", tagIdx === 0 ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300")}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onCompleteTask?.(task); }} className="shrink-0 transition-transform hover:scale-110 focus:outline-none">
                          {task.is_completed ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <Circle className={cn("h-5 w-5 transition-colors", status === "overdue" ? "text-red-400 hover:text-red-500" : "text-slate-300 dark:text-slate-600 hover:text-blue-500")} />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
