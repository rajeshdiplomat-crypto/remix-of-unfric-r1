import { useState, useMemo, useEffect } from "react";
import { useDatePreferences } from "@/hooks/useDatePreferences";
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

// Color palette for different task types
const TASK_COLORS = [
  { bg: "bg-gradient-to-br from-rose-500 to-pink-600", border: "border-rose-200", light: "bg-rose-50" },
  { bg: "bg-gradient-to-br from-blue-500 to-indigo-600", border: "border-blue-200", light: "bg-blue-50" },
  { bg: "bg-gradient-to-br from-emerald-500 to-teal-600", border: "border-emerald-200", light: "bg-emerald-50" },
  { bg: "bg-gradient-to-br from-amber-500 to-orange-600", border: "border-amber-200", light: "bg-amber-50" },
  { bg: "bg-gradient-to-br from-purple-500 to-violet-600", border: "border-purple-200", light: "bg-purple-50" },
  { bg: "bg-gradient-to-br from-cyan-500 to-sky-600", border: "border-cyan-200", light: "bg-cyan-50" },
];

// Map tags/keywords to icons and colors
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
  } else if (
    title.includes("meeting") ||
    title.includes("call") ||
    title.includes("team") ||
    tags.includes("meeting")
  ) {
    icon = Users;
  } else if (title.includes("email") || title.includes("mail") || tags.includes("email")) {
    icon = Mail;
  } else if (
    title.includes("lunch") ||
    title.includes("dinner") ||
    title.includes("breakfast") ||
    title.includes("eat")
  ) {
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

// Parse time string to minutes from midnight
const parseTimeToMinutes = (timeStr: string | null): number => {
  if (!timeStr) return 9 * 60; // Default 9 AM
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + (minutes || 0);
};

// Format minutes to readable time
const formatTime = (minutes: number): string => {
  const normalizedMinutes = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalizedMinutes / 60);
  const mins = normalizedMinutes % 60;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
};

// Format duration to readable string
const formatDuration = (minutes: number): string => {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
    return `${hours}h ${mins}min`;
  }
  return `${minutes} min`;
};

// Calculate duration in minutes between start and end time
const getTaskDuration = (startTime: string | null, endTime: string | null): number => {
  if (!startTime) return 30;
  if (!endTime) return 30; // Default 30 minutes if no end time

  const startMinutes = parseTimeToMinutes(startTime);
  let endMinutes = parseTimeToMinutes(endTime);

  // Handle overnight tasks
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  return endMinutes - startMinutes;
};

// Height per hour in pixels - reduced for better fit
const HOUR_HEIGHT = 60;

export function BoardView({ tasks, onTaskClick, onCompleteTask }: BoardViewProps) {
  const { formatDate: fmtDate } = useDatePreferences();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Get tasks for selected date first (needed to calculate dynamic timeline)
  const dayTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        if (!task.due_date) return false;
        return isSameDay(parseISO(task.due_date), selectedDate);
      })
      .sort((a, b) => parseTimeToMinutes(a.due_time) - parseTimeToMinutes(b.due_time));
  }, [tasks, selectedDate]);

  // Full 24-hour timeline (12:00 AM to 11:59 PM)
  const timelineStart = 0; // 12:00 AM (midnight)
  const timelineEnd = 24 * 60 - 1; // 11:59 PM (1439 minutes)
  const totalHours = 24;

  // Generate hour markers dynamically
  const hourMarkers = useMemo(() => {
    const markers: { minutes: number; label: string }[] = [];
    const startHour = timelineStart / 60;
    const endHour = timelineEnd / 60;
    for (let hour = startHour; hour <= endHour; hour++) {
      markers.push({
        minutes: hour * 60,
        label: formatTime(hour * 60),
      });
    }
    return markers;
  }, [timelineStart, timelineEnd]);

  // Calculate pixel position for a given time
  const getPixelPosition = (minutes: number): number => {
    const minutesFromStart = minutes - timelineStart;
    return (minutesFromStart / 60) * HOUR_HEIGHT;
  };

  // Check if current time is visible in timeline
  const isToday = isSameDay(selectedDate, today);
  const isCurrentTimeVisible = currentTimeMinutes >= timelineStart && currentTimeMinutes <= timelineEnd;
  const currentTimePosition = getPixelPosition(currentTimeMinutes);

  // Get remaining time for ongoing tasks
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

  // Build list of task events only (no gaps to avoid overlapping)
  const timelineEvents = useMemo(() => {
    const events: Array<{
      type: "task";
      startMinutes: number;
      endMinutes: number;
      task: QuadrantTask;
      taskIndex: number;
    }> = [];

    if (dayTasks.length === 0) {
      return events;
    }

    // Add all tasks
    dayTasks.forEach((task, idx) => {
      const startMinutes = parseTimeToMinutes(task.due_time);
      const duration = getTaskDuration(task.due_time, task.end_time);
      const endMinutes = startMinutes + duration;

      events.push({
        type: "task",
        startMinutes,
        endMinutes,
        task,
        taskIndex: idx,
      });
    });

    return events;
  }, [dayTasks]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
      {/* Header with date navigation */}
      <div className="shrink-0 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="font-semibold text-lg text-slate-800 dark:text-slate-100">Day Planner</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={() => setSelectedDate(addDays(selectedDate, -1))}
            >
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
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-6 px-4 pb-3 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-slate-600 dark:text-slate-400">
              {dayTasks.length} task{dayTasks.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-600 dark:text-slate-400">
              {dayTasks.filter((t) => t.is_completed).length} completed
            </span>
          </div>
          {isToday && (
            <div className="flex items-center gap-1.5">
              <Timer className="h-3.5 w-3.5 text-rose-500" />
              <span className="text-rose-600 dark:text-rose-400 font-medium">{formatTime(currentTimeMinutes)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Timeline content */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative flex" style={{ minHeight: `${totalHours * HOUR_HEIGHT}px` }}>
          {/* Hour labels column */}
          <div className="w-20 shrink-0 border-r border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 pt-2">
            {hourMarkers.map(({ minutes, label }, index) => (
              <div
                key={minutes}
                className="absolute left-0 w-20 flex items-start justify-end pr-3"
                style={{
                  top: `${getPixelPosition(minutes) + 8}px`, // Add 8px offset for padding
                }}
              >
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 -translate-y-1/2">{label}</span>
              </div>
            ))}
          </div>

          {/* Timeline content area */}
          <div className="flex-1 relative pt-2">
            {/* Hour grid lines */}
            {hourMarkers.map(({ minutes }) => (
              <div
                key={minutes}
                className="absolute left-0 right-0 border-t border-slate-100 dark:border-slate-800"
                style={{ top: `${getPixelPosition(minutes) + 8}px` }}
              />
            ))}

            {/* Timeline spine - vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 via-blue-400 to-blue-300 dark:from-blue-600 dark:via-blue-500 dark:to-blue-600" />

            {/* Current time indicator - extends full width */}
            {isToday && isCurrentTimeVisible && (
              <>
                {/* Line extending into hour labels area */}
                <div
                  className="absolute -left-20 right-0 flex items-center z-30 pointer-events-none"
                  style={{ top: `${currentTimePosition + 8}px` }}
                >
                  <div className="flex-1 h-[2px] bg-rose-500" />
                </div>
                {/* Pulse dot on the timeline spine */}
                <div
                  className="absolute z-30 pointer-events-none"
                  style={{ top: `${currentTimePosition + 8}px`, left: '18px' }}
                >
                  <div className="w-3 h-3 rounded-full bg-rose-500 shadow-lg shadow-rose-300 dark:shadow-rose-900 animate-pulse -translate-y-1/2" />
                </div>
              </>
            )}

            {/* Empty state */}
            {dayTasks.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <Calendar className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">No tasks scheduled</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
                  {isToday
                    ? "Add tasks with a start time to see them in the planner"
                    : fmtDate(selectedDate, "weekdayFull")}
                </p>
              </div>
            )}

            {/* Timeline events - Tasks only */}
            {timelineEvents.map((event) => {
              const task = event.task;
              const taskIndex = event.taskIndex;
              const { icon: Icon, bg, border } = getTaskStyle(task, taskIndex);
              const status = computeTaskStatus(task);
              const remaining = getRemainingTime(task);
              const isOngoing = remaining !== null;
              const duration = event.endMinutes - event.startMinutes;
              const position = getPixelPosition(event.startMinutes);

              // Task card height = exact duration height (no minimum)
              // 60px per hour, so 15min = 15px, 30min = 30px, 1hr = 60px
              const taskHeight = (duration / 60) * HOUR_HEIGHT;
              const isCompact = taskHeight < 50; // Compact layout for short tasks

              return (
                <div
                  key={task.id}
                  className="absolute left-10 right-4"
                  style={{
                    top: `${position + 8}px`, // Add 8px offset to match hour labels
                    height: `${Math.max(taskHeight, 24)}px`, // Min 24px for very short tasks
                  }}
                >
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      "absolute -left-[14px] w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 shadow-sm z-10",
                      task.is_completed
                        ? "bg-emerald-500"
                        : isOngoing
                          ? "bg-rose-500 animate-pulse"
                          : bg.replace("bg-gradient-to-br", "bg").split(" ")[1],
                    )}
                    style={{ top: `${Math.min(8, taskHeight / 2 - 6)}px` }}
                  />

                  {/* Task card with exact height based on duration */}
                  <div
                    onClick={() => onTaskClick(task)}
                    className={cn(
                      "group relative ml-4 h-full rounded-lg border-2 cursor-pointer transition-all duration-200 overflow-hidden",
                      "hover:shadow-lg hover:scale-[1.01]",
                      task.is_completed
                        ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-70"
                        : cn("bg-white dark:bg-slate-800", border, "hover:border-blue-400 dark:hover:border-blue-500"),
                      isOngoing && "ring-2 ring-rose-400 ring-offset-1 dark:ring-offset-slate-900 border-rose-300",
                      status === "overdue" && !task.is_completed && "border-red-300 bg-red-50 dark:bg-red-900/20",
                    )}
                  >
                    {isCompact ? (
                      /* Compact layout for short tasks (< 50px height) */
                      <div className="flex items-center gap-2 px-2 h-full">
                        {/* Small icon */}
                        <div
                          className={cn(
                            "w-6 h-6 rounded flex items-center justify-center shrink-0",
                            bg,
                            task.is_completed && "opacity-50",
                          )}
                        >
                          <Icon className="h-3 w-3 text-white" />
                        </div>

                        {/* Title */}
                        <span
                          className={cn(
                            "text-xs font-medium text-slate-800 dark:text-slate-100 truncate flex-1",
                            task.is_completed && "line-through opacity-60",
                          )}
                        >
                          {task.title}
                        </span>

                        {/* Time range */}
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatTime(event.startMinutes)}-{formatTime(event.endMinutes)}
                        </span>

                        {/* Urgency/Importance badges - compact */}
                        {(task.urgency === "high" || task.importance === "high") && (
                          <div className="flex gap-0.5 shrink-0">
                            {task.urgency === "high" && (
                              <span className="w-2 h-2 rounded-full bg-red-500" title="Urgent" />
                            )}
                            {task.importance === "high" && (
                              <span className="w-2 h-2 rounded-full bg-amber-500" title="Important" />
                            )}
                          </div>
                        )}

                        {/* Complete button - small */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCompleteTask?.(task);
                          }}
                          className="shrink-0"
                        >
                          {task.is_completed ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <Circle className="h-4 w-4 text-slate-300 hover:text-blue-500" />
                          )}
                        </button>
                      </div>
                    ) : (
                      /* Full layout for longer tasks */
                      <div className="flex items-start gap-2 p-2 h-full">
                        {/* Icon with gradient background */}
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                            bg,
                            task.is_completed && "opacity-50",
                          )}
                        >
                          <Icon className="h-4 w-4 text-white" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 overflow-hidden">
                          {/* Time and duration row */}
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

                          {/* Title */}
                          <h3
                            className={cn(
                              "text-sm font-semibold text-slate-800 dark:text-slate-100 truncate",
                              task.is_completed && "line-through opacity-60",
                            )}
                          >
                            {task.title}
                          </h3>

                          {/* Urgency/Importance badges - full */}
                          <div className="flex items-center gap-1 mt-1">
                            {task.urgency === "high" && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 font-medium flex items-center gap-0.5">
                                <Zap className="h-2.5 w-2.5" />
                                Urgent
                              </span>
                            )}
                            {task.urgency === "low" && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                                Not Urgent
                              </span>
                            )}
                            {task.importance === "high" && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-medium flex items-center gap-0.5">
                                <Star className="h-2.5 w-2.5" />
                                Important
                              </span>
                            )}
                            {task.importance === "low" && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                                Not Important
                              </span>
                            )}
                          </div>

                          {/* Tags - only show if card is tall enough */}
                          {task.tags && task.tags.length > 0 && taskHeight >= 80 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {task.tags.slice(0, 2).map((tag, tagIdx) => (
                                <span
                                  key={tag}
                                  className={cn(
                                    "px-1.5 py-0.5 text-[9px] font-medium rounded-full",
                                    tagIdx === 0
                                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                      : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
                                  )}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Complete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCompleteTask?.(task);
                          }}
                          className="shrink-0 transition-transform hover:scale-110 focus:outline-none"
                        >
                          {task.is_completed ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <Circle
                              className={cn(
                                "h-5 w-5 transition-colors",
                                status === "overdue"
                                  ? "text-red-400 hover:text-red-500"
                                  : "text-slate-300 dark:text-slate-600 hover:text-blue-500",
                              )}
                            />
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
