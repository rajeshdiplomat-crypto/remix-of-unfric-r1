import { useState, useMemo } from "react";
import {
  Plus,
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { QuadrantTask, computeTaskStatus } from "./types";
import { format, parseISO, isSameDay, addDays, subDays } from "date-fns";

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
    return { icon: Dumbbell, color: "bg-blue-500" };
  if (title.includes("bike") || title.includes("cycle") || title.includes("commute"))
    return { icon: Bike, color: "bg-teal-500" };
  if (title.includes("meeting") || title.includes("call") || title.includes("team") || tags.includes("meeting"))
    return { icon: Users, color: "bg-amber-600" };
  if (title.includes("email") || title.includes("mail") || tags.includes("email"))
    return { icon: Mail, color: "bg-slate-500" };
  if (
    title.includes("lunch") ||
    title.includes("dinner") ||
    title.includes("breakfast") ||
    title.includes("eat") ||
    tags.includes("food")
  )
    return { icon: UtensilsCrossed, color: "bg-green-500" };
  if (title.includes("work") || title.includes("project") || tags.includes("work"))
    return { icon: Briefcase, color: "bg-indigo-500" };
  if (title.includes("read") || title.includes("study") || title.includes("learn") || tags.includes("learning"))
    return { icon: BookOpen, color: "bg-purple-500" };
  if (title.includes("music") || title.includes("practice") || tags.includes("music"))
    return { icon: Music, color: "bg-pink-500" };
  if (title.includes("shop") || title.includes("buy") || title.includes("groceries") || tags.includes("shopping"))
    return { icon: ShoppingCart, color: "bg-orange-500" };
  if (title.includes("morning") || title.includes("wake") || title.includes("rise"))
    return { icon: Coffee, color: "bg-amber-500" };
  if (tags.includes("health") || tags.includes("wellness")) return { icon: Heart, color: "bg-rose-500" };

  return { icon: Star, color: "bg-primary" };
};

// Parse time string to minutes from midnight
const parseTimeToMinutes = (timeStr: string | null): number => {
  if (!timeStr) return 9 * 60;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + (minutes || 0);
};

// Format minutes to time string
const formatTimeShort = (minutes: number): string => {
  // Handle 24+ hours (wrap around)
  const normalizedMinutes = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalizedMinutes / 60);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours} ${period}`;
};

// Calculate duration in minutes between start and end time
const getTaskDuration = (startTime: string | null, endTime: string | null): number => {
  if (!startTime) return 60;
  if (!endTime) return 120; // Default 2 hours if no end time

  const startMinutes = parseTimeToMinutes(startTime);
  let endMinutes = parseTimeToMinutes(endTime);

  // Handle overnight tasks
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  return endMinutes - startMinutes;
};

export function BoardView({ tasks, onTaskClick, onCompleteTask }: BoardViewProps) {
  const today = new Date();
  const [scrollOffset, setScrollOffset] = useState(0);
  const [visibleDayCount, setVisibleDayCount] = useState(3); // 1-7 days visible

  // Generate all dates: today + next 6 days (7 total)
  const allDates = useMemo(() => {
    const dates: Date[] = [];
    for (let i = 0; i <= 6; i++) {
      dates.push(addDays(today, i));
    }
    return dates;
  }, [today]);

  // Visible dates based on selected day count
  const visibleDates = allDates.slice(scrollOffset, scrollOffset + visibleDayCount);
  const canScrollLeft = scrollOffset > 0;
  const canScrollRight = scrollOffset < allDates.length - visibleDayCount;

  // Time slots for Y axis - 24 hours (6 AM to 6 AM next day)
  const timeSlots = useMemo(() => {
    const slots: number[] = [];
    // Start at 6 AM (360 minutes), go through 24 hours
    for (let i = 0; i < 24; i++) {
      const hour = (6 + i) % 24;
      slots.push(hour * 60);
    }
    return slots;
  }, []);

  // Get tasks for a specific date
  const getTasksForDate = (date: Date): QuadrantTask[] => {
    return tasks
      .filter((task) => {
        if (!task.due_date) return false;
        return isSameDay(parseISO(task.due_date), date);
      })
      .sort((a, b) => parseTimeToMinutes(a.due_time) - parseTimeToMinutes(b.due_time));
  };

  // Current time calculation for 24-hour timeline starting at 6 AM
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Timeline starts at 6 AM (360) and goes to 6 AM next day (360 + 1440)
  const timelineStart = 6 * 60; // 6 AM = 360 minutes
  const timelineDuration = 24 * 60; // 24 hours

  // Calculate position (handle wrap around for times before 6 AM)
  let adjustedCurrentMinutes = currentMinutes;
  if (currentMinutes < timelineStart) {
    adjustedCurrentMinutes = currentMinutes + 24 * 60; // Treat as next day morning
  }
  const currentTimePercent = ((adjustedCurrentMinutes - timelineStart) / timelineDuration) * 100;
  const showCurrentTime = true; // Always show since we cover 24 hours

  // Convert time slot to position in our 24-hour timeline
  const getTimePosition = (minutes: number): number => {
    let adjusted = minutes;
    if (minutes < timelineStart) {
      adjusted = minutes + 24 * 60;
    }
    return ((adjusted - timelineStart) / timelineDuration) * 100;
  };

  return (
    <div className="h-full flex flex-col bg-card/30 rounded-2xl border border-border/50 overflow-hidden">
      {/* Header - Day count selector + Date columns */}
      <div className="shrink-0 border-b border-border/50 bg-background/95 backdrop-blur">
        {/* Day count selector */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
          <span className="text-xs text-muted-foreground">Days:</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6, 7].map((count) => (
              <button
                key={count}
                onClick={() => {
                  setVisibleDayCount(count);
                  setScrollOffset(0); // Reset scroll when changing view
                }}
                className={cn(
                  "w-6 h-6 rounded text-xs font-medium transition-colors",
                  visibleDayCount === count
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground",
                )}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center">
          {/* Time column header */}
          <div className="w-16 shrink-0 p-2 border-r border-border/30 flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={!canScrollLeft}
              onClick={() => setScrollOffset(Math.max(0, scrollOffset - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Date headers */}
          {visibleDates.map((date) => {
            const isToday = isSameDay(date, today);
            const dateTasks = getTasksForDate(date);

            return (
              <div
                key={date.toISOString()}
                className={cn("flex-1 p-3 border-r border-border/30 text-center", isToday && "bg-primary/5")}
              >
                <span className="text-xs text-muted-foreground font-medium uppercase">{format(date, "EEE")}</span>
                <div className={cn("text-2xl font-bold mt-0.5", isToday ? "text-primary" : "text-foreground")}>
                  {format(date, "d")}
                </div>
                <span className="text-xs text-muted-foreground">{format(date, "MMM")}</span>
                {dateTasks.length > 0 && (
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {dateTasks.length} task{dateTasks.length !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
            );
          })}

          {/* Right scroll button */}
          <div className="w-10 shrink-0 p-2 flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={!canScrollRight}
              onClick={() => setScrollOffset(Math.min(allDates.length - visibleDayCount, scrollOffset + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Timeline grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex min-h-full">
          {/* Time labels (Y axis) - 24 hours */}
          <div className="w-16 shrink-0 border-r border-border/30 bg-background/50">
            {timeSlots.map((minutes) => (
              <div key={minutes} className="h-14 flex items-start justify-end pr-2 pt-0.5 border-b border-border/10">
                <span className="text-[10px] text-muted-foreground font-medium">{formatTimeShort(minutes)}</span>
              </div>
            ))}
          </div>

          {/* Date columns */}
          {visibleDates.map((date) => {
            const isToday = isSameDay(date, today);
            const dateTasks = getTasksForDate(date);

            return (
              <div
                key={date.toISOString()}
                className={cn("flex-1 border-r border-border/30 relative", isToday && "bg-primary/5")}
              >
                {/* Time slot grid lines */}
                {timeSlots.map((minutes) => (
                  <div key={minutes} className="h-14 border-b border-border/10" />
                ))}

                {/* Current time indicator */}
                {isToday && showCurrentTime && (
                  <div
                    className="absolute left-0 right-0 h-0.5 bg-destructive z-20 flex items-center"
                    style={{ top: `${Math.min(Math.max(currentTimePercent, 0), 100)}%` }}
                  >
                    <div className="w-2 h-2 rounded-full bg-destructive -ml-1" />
                  </div>
                )}

                {/* Tasks */}
                {dateTasks.map((task) => {
                  const { icon: Icon, color } = getTaskIcon(task);
                  const startMinutes = parseTimeToMinutes(task.due_time);
                  const duration = getTaskDuration(task.due_time, task.end_time);

                  const topPercent = getTimePosition(startMinutes);
                  const heightPercent = (duration / timelineDuration) * 100;

                  const status = computeTaskStatus(task);

                  return (
                    <div
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className={cn(
                        "absolute left-1 right-1 rounded-lg border cursor-pointer transition-all hover:shadow-lg hover:z-20 overflow-hidden",
                        task.is_completed
                          ? "bg-muted/50 border-border/30 opacity-60"
                          : "bg-background border-border/50 hover:border-primary/50",
                        status === "ongoing" && "ring-2 ring-primary/40",
                        status === "overdue" && !task.is_completed && "border-destructive/50 bg-destructive/5",
                      )}
                      style={{
                        top: `${Math.max(0, topPercent)}%`,
                        height: `${Math.max(heightPercent, 2.5)}%`,
                        minHeight: "36px",
                      }}
                    >
                      <div className="p-1.5 h-full flex flex-col">
                        <div className="flex items-start gap-1.5">
                          <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0", color)}>
                            <Icon className="h-3 w-3 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "text-xs font-medium truncate leading-tight",
                                task.is_completed && "line-through",
                              )}
                            >
                              {task.title}
                            </p>
                            <p className="text-[9px] text-muted-foreground">
                              {formatTimeShort(startMinutes)} - {formatTimeShort(startMinutes + duration)}
                            </p>
                          </div>
                        </div>

                        {/* Complete button - only show if enough height */}
                        {heightPercent > 4 && (
                          <div className="mt-auto flex justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCompleteTask?.(task);
                              }}
                            >
                              {task.is_completed ? (
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                              ) : (
                                <Circle
                                  className={cn(
                                    "h-4 w-4 transition-colors",
                                    status === "overdue"
                                      ? "text-destructive"
                                      : "text-muted-foreground/40 hover:text-primary",
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
            );
          })}

          {/* Right padding column */}
          <div className="w-10 shrink-0" />
        </div>
      </div>
    </div>
  );
}
