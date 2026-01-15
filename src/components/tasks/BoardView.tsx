import { useState, useMemo, useEffect } from "react";
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

// Height per hour in pixels
const HOUR_HEIGHT = 80;

export function BoardView({ tasks, onTaskClick, onCompleteTask }: BoardViewProps) {
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

  // Timeline configuration (6 AM to 11 PM = 17 hours)
  const timelineStart = 6 * 60; // 6 AM
  const timelineEnd = 23 * 60; // 11 PM
  const totalHours = (timelineEnd - timelineStart) / 60;

  // Generate hour markers
  const hourMarkers = useMemo(() => {
    const markers: { minutes: number; label: string }[] = [];
    for (let hour = 6; hour <= 23; hour++) {
      markers.push({
        minutes: hour * 60,
        label: formatTime(hour * 60),
      });
    }
    return markers;
  }, []);

  // Get tasks for selected date, sorted by time
  const dayTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        if (!task.due_date) return false;
        return isSameDay(parseISO(task.due_date), selectedDate);
      })
      .sort((a, b) => parseTimeToMinutes(a.due_time) - parseTimeToMinutes(b.due_time));
  }, [tasks, selectedDate]);

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

  // Build list of events (tasks + gaps) in order
  const timelineEvents = useMemo(() => {
    const events: Array<{
      type: "task" | "gap";
      startMinutes: number;
      endMinutes: number;
      task?: QuadrantTask;
      taskIndex?: number;
    }> = [];

    let lastEnd = timelineStart;

    dayTasks.forEach((task, idx) => {
      const startMinutes = parseTimeToMinutes(task.due_time);
      const duration = getTaskDuration(task.due_time, task.end_time);
      const endMinutes = startMinutes + duration;

      // Add gap before this task if there's space
      if (startMinutes > lastEnd + 30) {
        events.push({
          type: "gap",
          startMinutes: lastEnd,
          endMinutes: startMinutes,
        });
      }

      events.push({
        type: "task",
        startMinutes,
        endMinutes,
        task,
        taskIndex: idx,
      });

      lastEnd = Math.max(lastEnd, endMinutes);
    });

    // Add final gap if needed
    if (dayTasks.length > 0 && lastEnd < timelineEnd - 60) {
      events.push({
        type: "gap",
        startMinutes: lastEnd,
        endMinutes: timelineEnd,
      });
    }

    return events;
  }, [dayTasks, timelineStart, timelineEnd]);

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
              {isToday ? "Today" : format(selectedDate, "EEE, MMM d")}
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
          <div className="w-20 shrink-0 border-r border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
            {hourMarkers.map(({ minutes, label }) => (
              <div
                key={minutes}
                className="absolute left-0 w-20 flex items-center justify-end pr-3"
                style={{
                  top: `${getPixelPosition(minutes)}px`,
                  height: `${HOUR_HEIGHT}px`,
                }}
              >
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
              </div>
            ))}
          </div>

          {/* Timeline content area */}
          <div className="flex-1 relative">
            {/* Hour grid lines */}
            {hourMarkers.map(({ minutes }) => (
              <div
                key={minutes}
                className="absolute left-0 right-0 border-t border-slate-100 dark:border-slate-800"
                style={{ top: `${getPixelPosition(minutes)}px` }}
              />
            ))}

            {/* Timeline spine - vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 via-blue-400 to-blue-300 dark:from-blue-600 dark:via-blue-500 dark:to-blue-600" />

            {/* Current time indicator */}
            {isToday && isCurrentTimeVisible && (
              <div
                className="absolute left-0 right-4 flex items-center z-30 pointer-events-none"
                style={{ top: `${currentTimePosition}px` }}
              >
                <div className="w-3 h-3 rounded-full bg-rose-500 shadow-lg shadow-rose-300 dark:shadow-rose-900 animate-pulse ml-[18px]" />
                <div className="flex-1 h-[2px] bg-rose-500" />
              </div>
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
                    : format(selectedDate, "EEEE, MMMM d")}
                </p>
              </div>
            )}

            {/* Timeline events */}
            {timelineEvents.map((event, eventIdx) => {
              if (event.type === "gap") {
                const gapDuration = event.endMinutes - event.startMinutes;
                // Position gap text in the CENTER of the gap period
                const gapCenterMinutes = event.startMinutes + gapDuration / 2;
                const centerPosition = getPixelPosition(gapCenterMinutes);

                return (
                  <div
                    key={`gap-${eventIdx}`}
                    className="absolute left-12 right-4 flex items-center pointer-events-none"
                    style={{
                      top: `${centerPosition}px`,
                      transform: "translateY(-50%)",
                    }}
                  >
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/80 dark:bg-slate-800/80 border border-dashed border-slate-300 dark:border-slate-600">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs text-slate-500 dark:text-slate-400 italic">
                        {formatDuration(gapDuration)} of free time?
                      </span>
                    </div>
                  </div>
                );
              }

              // Task event
              const task = event.task!;
              const taskIndex = event.taskIndex!;
              const { icon: Icon, bg, border, light } = getTaskStyle(task, taskIndex);
              const status = computeTaskStatus(task);
              const remaining = getRemainingTime(task);
              const isOngoing = remaining !== null;
              const duration = event.endMinutes - event.startMinutes;
              const position = getPixelPosition(event.startMinutes);

              return (
                <div
                  key={task.id}
                  className="absolute left-10 right-4"
                  style={{
                    top: `${position + 4}px`,
                  }}
                >
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      "absolute -left-[14px] w-4 h-4 rounded-full border-[3px] border-white dark:border-slate-900 shadow-sm z-10",
                      task.is_completed
                        ? "bg-emerald-500"
                        : isOngoing
                          ? "bg-rose-500 animate-pulse"
                          : bg.replace("bg-gradient-to-br", "bg").split(" ")[1],
                    )}
                    style={{ top: "14px" }}
                  />

                  {/* Task card */}
                  <div
                    onClick={() => onTaskClick(task)}
                    className={cn(
                      "group relative ml-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                      "hover:shadow-xl hover:-translate-y-1",
                      task.is_completed
                        ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-70"
                        : cn("bg-white dark:bg-slate-800", border, "hover:border-blue-400 dark:hover:border-blue-500"),
                      isOngoing && "ring-2 ring-rose-400 ring-offset-2 dark:ring-offset-slate-900 border-rose-300",
                      status === "overdue" && !task.is_completed && "border-red-300 bg-red-50 dark:bg-red-900/20",
                    )}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon with gradient background */}
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
                          bg,
                          task.is_completed && "opacity-50",
                        )}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Time label */}
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            {formatTime(event.startMinutes)} - {formatTime(event.endMinutes)}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                            {formatDuration(duration)}
                          </span>
                          {remaining !== null && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-medium animate-pulse">
                              {remaining} min left
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3
                          className={cn(
                            "font-semibold text-lg text-slate-800 dark:text-slate-100",
                            task.is_completed && "line-through opacity-60",
                          )}
                        >
                          {task.title}
                        </h3>

                        {/* Tags */}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {task.tags.slice(0, 4).map((tag, tagIdx) => (
                              <span
                                key={tag}
                                className={cn(
                                  "px-2.5 py-1 text-xs font-medium rounded-full",
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

                        {/* Subtasks progress */}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <div className="flex items-center gap-2 mt-3">
                            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{
                                  width: `${(task.subtasks.filter((s) => s.completed).length / task.subtasks.length) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Complete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCompleteTask?.(task);
                        }}
                        className="shrink-0 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full"
                      >
                        {task.is_completed ? (
                          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                        ) : (
                          <Circle
                            className={cn(
                              "h-8 w-8 transition-colors",
                              status === "overdue"
                                ? "text-red-400 hover:text-red-500"
                                : "text-slate-300 dark:text-slate-600 hover:text-blue-500",
                            )}
                          />
                        )}
                      </button>
                    </div>
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
