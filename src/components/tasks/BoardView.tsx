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

// Map tags/keywords to icons and colors
const getTaskIcon = (task: QuadrantTask) => {
  const title = task.title.toLowerCase();
  const tags = task.tags?.map((t) => t.toLowerCase()) || [];

  if (title.includes("workout") || title.includes("exercise") || title.includes("gym") || tags.includes("fitness"))
    return { icon: Dumbbell, color: "from-blue-500 to-blue-600", bg: "bg-blue-500" };
  if (title.includes("yoga") || title.includes("meditat"))
    return { icon: Heart, color: "from-teal-500 to-teal-600", bg: "bg-teal-500" };
  if (title.includes("bike") || title.includes("cycle") || title.includes("commute"))
    return { icon: Bike, color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-500" };
  if (title.includes("meeting") || title.includes("call") || title.includes("team") || tags.includes("meeting"))
    return { icon: Users, color: "from-amber-500 to-amber-600", bg: "bg-amber-600" };
  if (title.includes("email") || title.includes("mail") || tags.includes("email"))
    return { icon: Mail, color: "from-slate-500 to-slate-600", bg: "bg-slate-500" };
  if (title.includes("lunch") || title.includes("dinner") || title.includes("breakfast") || title.includes("eat"))
    return { icon: UtensilsCrossed, color: "from-green-500 to-green-600", bg: "bg-green-500" };
  if (title.includes("work") || title.includes("project") || tags.includes("work"))
    return { icon: Briefcase, color: "from-indigo-500 to-indigo-600", bg: "bg-indigo-500" };
  if (title.includes("read") || title.includes("study") || title.includes("learn"))
    return { icon: BookOpen, color: "from-purple-500 to-purple-600", bg: "bg-purple-500" };
  if (title.includes("music") || title.includes("practice"))
    return { icon: Music, color: "from-pink-500 to-pink-600", bg: "bg-pink-500" };
  if (title.includes("shop") || title.includes("buy") || title.includes("groceries"))
    return { icon: ShoppingCart, color: "from-orange-500 to-orange-600", bg: "bg-orange-500" };
  if (title.includes("morning") || title.includes("wake") || title.includes("rise"))
    return { icon: Coffee, color: "from-amber-400 to-amber-500", bg: "bg-amber-500" };
  if (title.includes("sunrise") || title.includes("shine"))
    return { icon: Sunrise, color: "from-rose-400 to-rose-500", bg: "bg-rose-400" };

  return { icon: Star, color: "from-primary to-primary/80", bg: "bg-primary" };
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

interface TimeSlot {
  type: "task" | "gap";
  startMinutes: number;
  endMinutes: number;
  task?: QuadrantTask;
  duration: number;
}

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

  // Timeline configuration (6 AM to 11 PM)
  const timelineStart = 6 * 60; // 6 AM
  const timelineEnd = 23 * 60; // 11 PM
  const timelineDuration = timelineEnd - timelineStart;

  // Generate hour markers
  const hourMarkers = useMemo(() => {
    const markers: number[] = [];
    for (let hour = 6; hour <= 23; hour++) {
      markers.push(hour * 60);
    }
    return markers;
  }, []);

  // Get tasks for selected date
  const dayTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        if (!task.due_date) return false;
        return isSameDay(parseISO(task.due_date), selectedDate);
      })
      .sort((a, b) => parseTimeToMinutes(a.due_time) - parseTimeToMinutes(b.due_time));
  }, [tasks, selectedDate]);

  // Build timeline slots with tasks and gaps
  const timelineSlots = useMemo(() => {
    const slots: TimeSlot[] = [];
    let lastEndMinutes = timelineStart;

    dayTasks.forEach((task) => {
      const startMinutes = parseTimeToMinutes(task.due_time);
      const duration = getTaskDuration(task.due_time, task.end_time);
      const endMinutes = startMinutes + duration;

      // Add gap if there's space before this task
      if (startMinutes > lastEndMinutes + 15) {
        const gapDuration = startMinutes - lastEndMinutes;
        slots.push({
          type: "gap",
          startMinutes: lastEndMinutes,
          endMinutes: startMinutes,
          duration: gapDuration,
        });
      }

      // Add task
      slots.push({
        type: "task",
        startMinutes,
        endMinutes,
        task,
        duration,
      });

      lastEndMinutes = Math.max(lastEndMinutes, endMinutes);
    });

    // Add final gap if there's space at end of day
    if (lastEndMinutes < timelineEnd - 60 && dayTasks.length > 0) {
      slots.push({
        type: "gap",
        startMinutes: lastEndMinutes,
        endMinutes: timelineEnd,
        duration: timelineEnd - lastEndMinutes,
      });
    }

    return slots;
  }, [dayTasks, timelineStart, timelineEnd]);

  // Calculate position percentage for a given time
  const getTimePosition = (minutes: number): number => {
    return ((minutes - timelineStart) / timelineDuration) * 100;
  };

  // Check if current time is visible in timeline
  const isCurrentTimeVisible = currentTimeMinutes >= timelineStart && currentTimeMinutes <= timelineEnd;
  const currentTimePosition = getTimePosition(currentTimeMinutes);
  const isToday = isSameDay(selectedDate, today);

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

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background via-background to-muted/20 rounded-2xl border border-border/50 overflow-hidden">
      {/* Header with date navigation */}
      <div className="shrink-0 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg">Day Planner</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setSelectedDate(addDays(selectedDate, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <button
              onClick={() => setSelectedDate(today)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                isToday ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-foreground",
              )}
            >
              {isToday ? "Today" : format(selectedDate, "EEE, MMM d")}
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-6 px-4 pb-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span>
              {dayTasks.length} task{dayTasks.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>{dayTasks.filter((t) => t.is_completed).length} completed</span>
          </div>
          {isToday && (
            <div className="flex items-center gap-1.5">
              <Timer className="h-3.5 w-3.5 text-destructive" />
              <span>{formatTime(currentTimeMinutes)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Timeline content */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative min-h-full px-4 py-6">
          {/* Hour markers on the left */}
          <div className="absolute left-4 top-6 bottom-6 w-14">
            {hourMarkers.map((minutes) => (
              <div
                key={minutes}
                className="absolute right-0 text-xs text-muted-foreground font-medium"
                style={{ top: `${getTimePosition(minutes)}%`, transform: "translateY(-50%)" }}
              >
                {formatTime(minutes)}
              </div>
            ))}
          </div>

          {/* Timeline spine */}
          <div className="absolute left-[72px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-border via-border/50 to-border rounded-full" />

          {/* Current time indicator */}
          {isToday && isCurrentTimeVisible && (
            <div
              className="absolute left-[60px] right-4 flex items-center z-30 pointer-events-none"
              style={{ top: `calc(${currentTimePosition}% + 24px)` }}
            >
              <div className="w-3 h-3 rounded-full bg-destructive shadow-lg shadow-destructive/50 animate-pulse" />
              <div className="flex-1 h-0.5 bg-destructive/80" />
            </div>
          )}

          {/* Tasks and gaps container */}
          <div className="ml-20 relative" style={{ minHeight: "800px" }}>
            {dayTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Calendar className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground font-medium">No tasks scheduled</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  {isToday ? "Add tasks with a time to see them here" : format(selectedDate, "EEEE, MMMM d")}
                </p>
              </div>
            ) : (
              timelineSlots.map((slot, index) => {
                if (slot.type === "gap" && slot.duration >= 30) {
                  // Gap slot
                  return (
                    <div
                      key={`gap-${index}`}
                      className="absolute left-0 right-0 flex items-center"
                      style={{
                        top: `${getTimePosition(slot.startMinutes)}%`,
                        height: `${(slot.duration / timelineDuration) * 100}%`,
                        minHeight: "40px",
                      }}
                    >
                      <div className="flex items-center gap-2 text-muted-foreground/60 text-sm pl-4">
                        <Clock className="h-4 w-4" />
                        <span className="italic">{formatDuration(slot.duration)} of free time?</span>
                      </div>
                    </div>
                  );
                }

                if (slot.type === "task" && slot.task) {
                  const task = slot.task;
                  const { icon: Icon, color, bg } = getTaskIcon(task);
                  const status = computeTaskStatus(task);
                  const remaining = getRemainingTime(task);
                  const isOngoing = remaining !== null;

                  return (
                    <div
                      key={task.id}
                      className="absolute left-0 right-0"
                      style={{
                        top: `${getTimePosition(slot.startMinutes)}%`,
                      }}
                    >
                      {/* Timeline dot */}
                      <div
                        className={cn(
                          "absolute -left-[26px] w-3 h-3 rounded-full border-2 border-background shadow-sm",
                          task.is_completed ? "bg-green-500" : isOngoing ? "bg-destructive animate-pulse" : bg,
                        )}
                        style={{ top: "12px" }}
                      />

                      {/* Task card */}
                      <div
                        onClick={() => onTaskClick(task)}
                        className={cn(
                          "group relative ml-2 p-3 rounded-xl border cursor-pointer transition-all duration-300",
                          "hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5",
                          task.is_completed
                            ? "bg-muted/30 border-border/30"
                            : "bg-background/80 backdrop-blur-sm border-border/50 hover:border-primary/30",
                          isOngoing && "ring-2 ring-destructive/30 border-destructive/50",
                          status === "overdue" && !task.is_completed && "border-destructive/50 bg-destructive/5",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg",
                              `bg-gradient-to-br ${color}`,
                              task.is_completed && "opacity-60",
                            )}
                          >
                            <Icon className="h-5 w-5 text-white" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {/* Time label */}
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-muted-foreground">
                                {formatTime(slot.startMinutes)} - {formatTime(slot.endMinutes)} (
                                {formatDuration(slot.duration)})
                              </span>
                              {remaining !== null && (
                                <span className="text-xs text-destructive font-medium animate-pulse">
                                  {remaining} min remaining
                                </span>
                              )}
                            </div>

                            {/* Title */}
                            <h3
                              className={cn(
                                "font-semibold text-foreground",
                                task.is_completed && "line-through opacity-60",
                              )}
                            >
                              {task.title}
                            </h3>

                            {/* Tags */}
                            {task.tags && task.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {task.tags.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-primary/10 text-primary"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Subtasks progress */}
                            {task.subtasks && task.subtasks.length > 0 && (
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>
                                    {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Complete button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCompleteTask?.(task);
                            }}
                            className="shrink-0 transition-transform hover:scale-110"
                          >
                            {task.is_completed ? (
                              <CheckCircle2 className="h-6 w-6 text-green-500" />
                            ) : (
                              <Circle
                                className={cn(
                                  "h-6 w-6 transition-colors",
                                  status === "overdue"
                                    ? "text-destructive hover:text-destructive/80"
                                    : "text-muted-foreground/40 hover:text-primary",
                                )}
                              />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return null;
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
