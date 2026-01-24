import { memo, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  CheckCircle2,
  Circle,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { QuadrantTask, computeTaskStatus } from "./types";
import { format } from "date-fns";

type QuadrantFilter = "all" | "ui" | "uni" | "nui" | "nuni";

const QUADRANT_FILTER_OPTIONS: { value: QuadrantFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "ui", label: "U&I" },
  { value: "uni", label: "U&NI" },
  { value: "nui", label: "NU&I" },
  { value: "nuni", label: "NU&NI" },
];

interface AllTasksListProps {
  tasks: QuadrantTask[];
  onTaskClick: (task: QuadrantTask) => void;
  onStartTask: (task: QuadrantTask) => void;
  onCompleteTask: (task: QuadrantTask) => void;
  onDeleteTask: (task: QuadrantTask) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const AllTasksList = memo(function AllTasksList({
  tasks,
  onTaskClick,
  onStartTask,
  onCompleteTask,
  onDeleteTask,
  collapsed,
  onToggleCollapse,
}: AllTasksListProps) {
  const [quadrantFilter, setQuadrantFilter] = useState<QuadrantFilter>("all");

  // Filter tasks by quadrant
  const filteredTasks = useMemo(() => {
    if (quadrantFilter === "all") return tasks;

    return tasks.filter((task) => {
      const isUrgent = task.urgency === "high";
      const isImportant = task.importance === "high";

      switch (quadrantFilter) {
        case "ui":
          return isUrgent && isImportant;
        case "uni":
          return isUrgent && !isImportant;
        case "nui":
          return !isUrgent && isImportant;
        case "nuni":
          return !isUrgent && !isImportant;
        default:
          return true;
      }
    });
  }, [tasks, quadrantFilter]);

  // Sort: incomplete first, then by due date
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      const aComplete = a.is_completed || !!a.completed_at;
      const bComplete = b.is_completed || !!b.completed_at;
      if (aComplete !== bComplete) return aComplete ? 1 : -1;

      // Then by due date
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return 0;
    });
  }, [filteredTasks]);

  // Collapsed view
  if (collapsed) {
    return (
      <div className="h-full flex flex-col items-center py-4 bg-card/50 rounded-xl border border-border/50">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="mb-4"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="flex-1 flex items-center justify-center">
          <span className="text-xs text-muted-foreground -rotate-90 whitespace-nowrap">
            {tasks.length} tasks
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-card/50 rounded-xl border border-border/50 overflow-hidden">
      {/* Header with collapse button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">All Tasks</h3>
          <Badge variant="secondary" className="text-xs">
            {filteredTasks.length}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onToggleCollapse} className="h-7 w-7">
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Quadrant Filter Tabs */}
      <div className="px-3 py-2 border-b border-border/30">
        <div className="flex items-center gap-1">
          {QUADRANT_FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setQuadrantFilter(option.value)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                quadrantFilter === option.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {sortedTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No tasks found
            </div>
          ) : (
            sortedTasks.map((task) => {
              const isCompleted = task.is_completed || !!task.completed_at;
              const status = computeTaskStatus(task);
              const isOverdue = status === "overdue" && !isCompleted;

              return (
                <div
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className={cn(
                    "group p-3 rounded-lg border cursor-pointer transition-all",
                    "hover:bg-muted/50 hover:border-primary/30",
                    isCompleted
                      ? "bg-muted/30 border-border/30"
                      : isOverdue
                      ? "bg-destructive/5 border-destructive/30"
                      : "bg-background/50 border-border/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Complete toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCompleteTask(task);
                      }}
                      className="mt-0.5 shrink-0"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-sm font-medium truncate",
                            isCompleted && "line-through text-muted-foreground"
                          )}
                        >
                          {task.title}
                        </span>
                        {isOverdue && (
                          <AlertCircle className="h-3 w-3 text-destructive shrink-0" />
                        )}
                      </div>

                      {/* Meta info */}
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {task.due_date && (
                          <span>
                            {format(new Date(task.due_date), "MMM d")}
                            {task.due_time && ` · ${task.due_time}`}
                          </span>
                        )}
                        {task.urgency === "high" && task.importance === "high" && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-chart-1/50 text-chart-1">
                            U&I
                          </Badge>
                        )}
                        {task.urgency === "high" && task.importance === "low" && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-chart-2/50 text-chart-2">
                            U&NI
                          </Badge>
                        )}
                        {task.urgency === "low" && task.importance === "high" && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-chart-3/50 text-chart-3">
                            NU&I
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!isCompleted && !task.started_at && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartTask(task);
                          }}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive/70 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTask(task);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
});
