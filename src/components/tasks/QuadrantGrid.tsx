import { useState } from "react";
import {
  Play,
  Check,
  Flame,
  Clock,
  Sparkles,
  Archive,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  QuadrantTask,
  QuadrantMode,
  QuadrantConfig,
  QUADRANT_MODES,
  computeTaskStatus,
  computeDateBucket,
} from "./types";
import { QuadrantViewAllDrawer } from "./QuadrantViewAllDrawer";

interface QuadrantGridProps {
  mode: QuadrantMode;
  tasks: QuadrantTask[];
  onTaskClick: (task: QuadrantTask) => void;
  onStartTask: (task: QuadrantTask) => void;
  onCompleteTask: (task: QuadrantTask) => void;
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  flame: Flame,
  clock: Clock,
  sparkles: Sparkles,
  archive: Archive,
  "alert-triangle": AlertTriangle,
  play: Play,
  calendar: Calendar,
  "check-circle": CheckCircle,
  sun: Sun,
  sunrise: Sunrise,
  sunset: Sunset,
  moon: Moon,
};

export function QuadrantGrid({ mode, tasks, onTaskClick, onStartTask, onCompleteTask }: QuadrantGridProps) {
  const modeConfig = QUADRANT_MODES[mode];
  const [viewAllOpen, setViewAllOpen] = useState(false);
  const [viewAllQuadrant, setViewAllQuadrant] = useState<QuadrantConfig | null>(null);
  const [viewAllTasks, setViewAllTasks] = useState<QuadrantTask[]>([]);
  const [completedCollapsed, setCompletedCollapsed] = useState<Record<string, boolean>>({});

  // Filter tasks by time radius based on mode
  const filteredByRadius = tasks.filter((task) => {
    const now = new Date();

    if (mode === "time") {
      // 24 hours radius for Time of Day view
      const cutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      if (!task.due_date) return true; // Include tasks without due date
      const taskDate = new Date(task.due_date);
      if (task.due_time) {
        const [h, m] = task.due_time.split(":").map(Number);
        taskDate.setHours(h, m, 0, 0);
      } else {
        taskDate.setHours(23, 59, 59, 999);
      }
      return taskDate >= now && taskDate <= cutoff;
    } else {
      // 7 days radius for other views
      const cutoff = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      if (!task.due_date) return true; // Include tasks without due date
      const taskDate = new Date(task.due_date);
      taskDate.setHours(23, 59, 59, 999);
      return taskDate <= cutoff;
    }
  });

  const getTasksForQuadrant = (quadrantId: string): QuadrantTask[] => {
    return filteredByRadius.filter((task) => {
      switch (mode) {
        case "urgent-important":
          if (quadrantId === "urgent-important") return task.urgency === "high" && task.importance === "high";
          if (quadrantId === "urgent-not-important") return task.urgency === "high" && task.importance === "low";
          if (quadrantId === "not-urgent-important") return task.urgency === "low" && task.importance === "high";
          if (quadrantId === "not-urgent-not-important") return task.urgency === "low" && task.importance === "low";
          break;
        case "status":
          return computeTaskStatus(task) === quadrantId;
        case "date":
          // Dynamically compute date bucket instead of using stored value
          return computeDateBucket(task.due_date) === quadrantId;
        case "time":
          return task.time_of_day === quadrantId;
      }
      return false;
    });
  };

  const handleViewAll = (quadrant: QuadrantConfig, quadrantTasks: QuadrantTask[]) => {
    setViewAllQuadrant(quadrant);
    setViewAllTasks(quadrantTasks);
    setViewAllOpen(true);
  };

  const toggleCompleted = (quadrantId: string) => {
    setCompletedCollapsed((prev) => ({ ...prev, [quadrantId]: !prev[quadrantId] }));
  };

  const QuadrantCard = ({ quadrant, position }: { quadrant: (typeof modeConfig.quadrants)[0]; position: number }) => {
    const Icon = ICONS[quadrant.icon] || Flame;
    const quadrantTasks = getTasksForQuadrant(quadrant.id);
    const activeTasks = quadrantTasks.filter((t) => !t.is_completed && !t.completed_at);
    const completedTasks = quadrantTasks.filter((t) => t.is_completed || !!t.completed_at);
    const progress = quadrantTasks.length > 0 ? (completedTasks.length / quadrantTasks.length) * 100 : 0;
    const isCollapsed = completedCollapsed[quadrant.id] ?? true;

    const isTopLeft = position === 0;

    // Gradient colors based on position
    const gradients = [
      "from-rose-500/10 via-card to-card", // Top-left (U&I)
      "from-amber-500/10 via-card to-card", // Top-right (U&NI)
      "from-blue-500/10 via-card to-card", // Bottom-left (NU&I)
      "from-slate-500/10 via-card to-card", // Bottom-right (NU&NI)
    ];

    return (
      <div
        className={cn(
          "relative flex flex-col rounded-2xl border-2 transition-all duration-300 overflow-hidden",
          `bg-gradient-to-br ${gradients[position]}`,
          isTopLeft ? "border-primary/30 shadow-lg" : "border-border/30 shadow-sm",
          "hover:shadow-lg hover:border-border/50",
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center justify-between px-4 py-3 border-b",
            isTopLeft ? "border-primary/20 bg-primary/5" : "border-border/20",
          )}
        >
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-7 w-7 rounded-lg flex items-center justify-center shadow-sm",
                isTopLeft
                  ? "bg-gradient-to-br from-primary to-chart-1"
                  : position === 1
                    ? "bg-gradient-to-br from-amber-500 to-orange-500"
                    : position === 2
                      ? "bg-gradient-to-br from-blue-500 to-indigo-500"
                      : "bg-gradient-to-br from-slate-400 to-slate-500",
              )}
            >
              <Icon className="h-3.5 w-3.5 text-white" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{quadrant.title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={cn(
                "text-[10px] px-2 py-0.5 font-bold",
                isTopLeft ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground",
              )}
            >
              {activeTasks.length}
            </Badge>
            <div className="w-10">
              <Progress value={progress} className="h-1.5" />
            </div>
          </div>
        </div>

        {/* Active Task List */}
        <div className="flex-1 p-3 space-y-2 overflow-y-auto min-h-[120px]">
          {activeTasks.slice(0, 5).map((task) => {
            const status = computeTaskStatus(task);
            const isOngoing = status === "ongoing";

            return (
              <div
                key={task.id}
                className={cn(
                  "flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer group",
                  isOngoing
                    ? "bg-gradient-to-r from-primary/10 to-chart-1/5 border-l-3 border-l-primary border border-primary/20"
                    : "bg-background/60 border border-border/30",
                  "hover:bg-background hover:border-border hover:shadow-sm",
                )}
              >
                <div className="flex-1 min-w-0" onClick={() => onTaskClick(task)}>
                  <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                    {task.due_date && (
                      <span>
                        {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                    {task.due_time && <span>@ {task.due_time}</span>}
                    {status === "overdue" && (
                      <Badge
                        variant="outline"
                        className="text-[8px] px-1 py-0 bg-destructive/10 text-destructive border-destructive/30"
                      >
                        Overdue
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Action icons */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-lg hover:bg-primary/20 hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartTask(task);
                    }}
                    title="Start / Deep Focus"
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-lg hover:bg-emerald-500/20 hover:text-emerald-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCompleteTask(task);
                    }}
                    title="Mark Complete"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}

          {activeTasks.length === 0 && completedTasks.length === 0 && (
            <div className="flex items-center justify-center h-20 text-muted-foreground/50 text-xs italic">
              No tasks here yet
            </div>
          )}
        </div>

        {/* Collapsible Completed Section */}
        {completedTasks.length > 0 && (
          <div className="border-t border-border/30 bg-muted/20">
            <button
              onClick={() => toggleCompleted(quadrant.id)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-3 w-3 text-emerald-500" />
                <span className="font-medium">Completed ({completedTasks.length})</span>
              </div>
              {isCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
            </button>

            {!isCollapsed && (
              <div className="px-3 pb-2 space-y-1.5">
                {completedTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 cursor-pointer group opacity-70 hover:opacity-100"
                  >
                    <p
                      className="text-xs text-muted-foreground line-through truncate flex-1"
                      onClick={() => onTaskClick(task)}
                    >
                      {task.title}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:bg-amber-500/20 hover:text-amber-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCompleteTask(task);
                      }}
                      title="Mark Incomplete"
                    >
                      <RotateCcw className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                ))}
                {completedTasks.length > 3 && (
                  <button
                    className="text-[10px] text-muted-foreground hover:text-primary"
                    onClick={() => handleViewAll(quadrant, quadrantTasks)}
                  >
                    +{completedTasks.length - 3} more
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer - View all */}
        {activeTasks.length > 5 && (
          <div className="px-3 py-2 border-t border-border/20">
            <button
              className="text-xs text-primary hover:underline font-medium"
              onClick={() => handleViewAll(quadrant, quadrantTasks)}
            >
              View all {quadrantTasks.length} tasks
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="relative h-full">
        {/* Axis Labels */}
        {mode === "urgent-important" && (
          <>
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
                Low Importance — High Importance
              </span>
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-6 whitespace-nowrap">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
                Low Urgency · High Urgency
              </span>
            </div>
          </>
        )}

        {/* 2x2 Grid */}
        <div className="grid grid-cols-2 gap-4 h-full pl-2">
          <QuadrantCard quadrant={modeConfig.quadrants[0]} position={0} />
          <QuadrantCard quadrant={modeConfig.quadrants[1]} position={1} />
          <QuadrantCard quadrant={modeConfig.quadrants[2]} position={2} />
          <QuadrantCard quadrant={modeConfig.quadrants[3]} position={3} />
        </div>
      </div>

      {/* View All Drawer */}
      <QuadrantViewAllDrawer
        open={viewAllOpen}
        onClose={() => setViewAllOpen(false)}
        quadrant={viewAllQuadrant}
        tasks={viewAllTasks}
        onTaskClick={onTaskClick}
        onStartTask={onStartTask}
        onCompleteTask={onCompleteTask}
      />
    </>
  );
}
