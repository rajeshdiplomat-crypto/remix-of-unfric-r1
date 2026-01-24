import { useState } from "react";
import { Play, Check, Calendar, Clock, ChevronsLeft, ChevronsRight, ListChecks, Trash2, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { QuadrantTask, computeTaskStatus } from "./types";

interface AllTasksListProps {
  tasks: QuadrantTask[];
  onTaskClick: (task: QuadrantTask) => void;
  onStartTask: (task: QuadrantTask) => void;
  onCompleteTask: (task: QuadrantTask) => void;
  onDeleteTask?: (task: QuadrantTask) => void;

  /** NEW */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

type FilterTab = "all" | "upcoming" | "ongoing" | "completed" | "overdue";
type QuadrantFilter = "all" | "ui" | "uni" | "nui" | "nuni";

export function AllTasksList({
  tasks,
  onTaskClick,
  onStartTask,
  onCompleteTask,
  onDeleteTask,
  collapsed = false,
  onToggleCollapse,
}: AllTasksListProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [quadrantFilter, setQuadrantFilter] = useState<QuadrantFilter>("all");

  // Apply all filters
  const filteredTasks = tasks.filter((t) => {
    // Status filter
    if (activeTab !== "all" && computeTaskStatus(t) !== activeTab) return false;
    // Quadrant filter
    if (quadrantFilter === "ui" && !(t.urgency === "high" && t.importance === "high")) return false;
    if (quadrantFilter === "uni" && !(t.urgency === "high" && t.importance === "low")) return false;
    if (quadrantFilter === "nui" && !(t.urgency === "low" && t.importance === "high")) return false;
    if (quadrantFilter === "nuni" && !(t.urgency === "low" && t.importance === "low")) return false;
    return true;
  });

  const counts = {
    all: tasks.length,
    upcoming: tasks.filter((t) => computeTaskStatus(t) === "upcoming").length,
    ongoing: tasks.filter((t) => computeTaskStatus(t) === "ongoing").length,
    completed: tasks.filter((t) => computeTaskStatus(t) === "completed").length,
    overdue: tasks.filter((t) => computeTaskStatus(t) === "overdue").length,
  };

  const getUrgencyBadge = (urgency: string) =>
    urgency === "high" ? (
      <Badge
        variant="outline"
        className="text-[10px] px-1.5 py-0 bg-destructive/10 text-destructive border-destructive/30"
      >
        Urgent
      </Badge>
    ) : (
      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
        Not Urgent
      </Badge>
    );

  const getImportanceBadge = (importance: string) =>
    importance === "high" ? (
      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/30">
        Important
      </Badge>
    ) : (
      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
        Not Important
      </Badge>
    );

  const getTimeOfDayBadge = (timeOfDay: string) => {
    const icons: Record<string, string> = { morning: "🌅", afternoon: "☀️", evening: "🌆", night: "🌙" };
    return (
      <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
        {icons[timeOfDay] || ""} {timeOfDay}
      </Badge>
    );
  };

  const TaskCard = ({ task }: { task: QuadrantTask }) => {
    const isCompleted = task.is_completed || !!task.completed_at;
    const status = computeTaskStatus(task);
    const isOngoing = status === "ongoing";

    return (
      <div
        className={cn(
          "group p-2.5 rounded-xl border transition-all duration-200",
          "hover:shadow-md cursor-pointer",
          isOngoing
            ? "bg-gradient-to-r from-primary/10 to-chart-1/5 border-l-3 border-l-primary border-primary/20"
            : status === "overdue"
              ? "bg-gradient-to-r from-rose-500/5 to-transparent border-rose-500/20"
              : status === "completed"
                ? "bg-gradient-to-r from-emerald-500/5 to-transparent border-emerald-500/20"
                : "bg-background/80 border-border/30",
          isCompleted && "opacity-60",
        )}
      >
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0" onClick={() => onTaskClick(task)}>
            {/* Title */}
            <p className={cn(
              "text-xs font-semibold text-foreground truncate",
              isCompleted && "line-through text-muted-foreground"
            )}>
              {task.title}
            </p>

            {/* Date/Time + Priority on same row */}
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {/* Date & Time (Start - End) */}
              {task.due_date && (
                <span className="text-[9px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
                  {format(new Date(task.due_date), "d/M")}
                  {task.due_time && (
                    <>
                      {` ${task.due_time}`}
                      {task.end_time && task.end_time !== task.due_time && `-${task.end_time}`}
                    </>
                  )}
                </span>
              )}
              {/* Urgency & Importance combined */}
              <span className={cn(
                "text-[9px] px-1.5 py-0.5 rounded font-medium",
                task.urgency === "high"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-muted/40 text-muted-foreground"
              )}>
                {task.urgency === "high" ? "U" : "NU"}
              </span>
              <span className={cn(
                "text-[9px] px-1.5 py-0.5 rounded font-medium",
                task.importance === "high"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted/40 text-muted-foreground"
              )}>
                {task.importance === "high" ? "I" : "NI"}
              </span>
              {/* Time of day */}
              {task.time_of_day && (
                <span className="text-[9px] text-muted-foreground">
                  {task.time_of_day === "morning" ? "🌅" : task.time_of_day === "afternoon" ? "☀️" : task.time_of_day === "evening" ? "🌆" : "🌙"}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons - smaller */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {!isCompleted && status !== "completed" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-lg opacity-60 hover:opacity-100 hover:bg-primary/20 hover:text-primary"
                onClick={(e) => { e.stopPropagation(); onStartTask(task); }}
                title="Start / Deep Focus"
              >
                <Play className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6 rounded-lg opacity-60 hover:opacity-100",
                isCompleted ? "hover:bg-amber-500/20 hover:text-amber-500" : "hover:bg-emerald-500/20 hover:text-emerald-500"
              )}
              onClick={(e) => { e.stopPropagation(); onCompleteTask(task); }}
              title={isCompleted ? "Mark Incomplete" : "Mark Complete"}
            >
              {isCompleted ? <RotateCcw className="h-3 w-3 text-amber-500" /> : <Check className="h-3 w-3" />}
            </Button>
            {onDeleteTask && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-lg opacity-60 hover:opacity-100 hover:bg-rose-500/20 hover:text-rose-500"
                onClick={(e) => { e.stopPropagation(); onDeleteTask(task); }}
                title="Delete Task"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ✅ Collapsed rail UI
  if (collapsed) {
    return (
      <div className="flex flex-col h-full bg-card/50 rounded-2xl border border-border/50 items-center py-3 gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl"
          onClick={onToggleCollapse}
          title="Expand All Tasks"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>

        <div className="h-10 w-10 rounded-2xl bg-muted/30 flex items-center justify-center">
          <ListChecks className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="flex flex-col items-center gap-2 mt-1">
          <Badge variant="outline" className="text-[10px] px-2 py-0.5">
            All {counts.all}
          </Badge>
          <Badge
            variant="outline"
            className="text-[10px] px-2 py-0.5 bg-destructive/10 text-destructive border-destructive/30"
          >
            Due {counts.overdue}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-card via-card/95 to-primary/5 rounded-2xl border border-primary/10 shadow-lg backdrop-blur-sm">
      {/* Header with gradient accent */}
      <div className="p-5 pb-4 border-b border-primary/10 flex items-center justify-between bg-gradient-to-r from-transparent via-primary/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary via-chart-1 to-chart-2 flex items-center justify-center shadow-md">
            <ListChecks className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-base font-bold text-foreground tracking-tight">All Tasks</h2>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl hover:bg-primary/10"
          onClick={onToggleCollapse}
          title="Collapse All Tasks"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as FilterTab)}
        className="flex-1 flex flex-col min-h-0"
      >
        <div className="px-4 pt-3 pb-2 space-y-2">
          {/* Status Pills - Slim style */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {([
              { value: "all", label: "All", count: counts.all, color: "from-slate-500 to-slate-600" },
              { value: "upcoming", label: "Up", count: counts.upcoming, color: "from-blue-500 to-indigo-500" },
              { value: "ongoing", label: "On", count: counts.ongoing, color: "from-amber-500 to-orange-500" },
              { value: "completed", label: "Done", count: counts.completed, color: "from-emerald-500 to-green-600" },
              { value: "overdue", label: "Due", count: counts.overdue, color: "from-rose-500 to-red-600" },
            ] as const).map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "px-2 py-1 rounded-full text-[11px] font-medium transition-all duration-200 flex items-center gap-1",
                  activeTab === tab.value
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-sm`
                    : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {tab.label}
                <span className={cn(
                  "text-[9px] font-bold",
                  activeTab === tab.value ? "opacity-80" : "opacity-60"
                )}>
                  {tab.count}
                </span>
              </button>
            ))}

            {/* Divider */}
            <div className="w-px h-4 bg-border/50 mx-0.5" />

            {/* Quadrant Filters - All on same line */}
            <div className="flex items-center gap-1">
              {([
                { value: "all" as QuadrantFilter, label: "All", color: "bg-primary" },
                { value: "ui" as QuadrantFilter, label: "U&I", color: "bg-gradient-to-r from-rose-500 to-red-500" },
                { value: "uni" as QuadrantFilter, label: "U&NI", color: "bg-gradient-to-r from-amber-500 to-orange-500" },
                { value: "nui" as QuadrantFilter, label: "NU&I", color: "bg-gradient-to-r from-blue-500 to-indigo-500" },
                { value: "nuni" as QuadrantFilter, label: "NU&NI", color: "bg-gradient-to-r from-slate-400 to-slate-500" },
              ]).map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setQuadrantFilter(filter.value)}
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-semibold transition-all whitespace-nowrap",
                    quadrantFilter === filter.value
                      ? `${filter.color} text-white shadow-sm`
                      : "bg-muted/40 text-muted-foreground hover:bg-muted"
                  )}
                  title={
                    filter.value === "all" ? "All Priorities" :
                      filter.value === "ui" ? "Urgent & Important" :
                        filter.value === "uni" ? "Urgent & Not Important" :
                          filter.value === "nui" ? "Not Urgent & Important" :
                            "Not Urgent & Not Important"
                  }
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Task list with improved spacing */}
        <ScrollArea className="flex-1 px-4 pb-3">
          <div className="space-y-2 mt-2">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => <TaskCard key={task.id} task={task} />)
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground/60 gap-2">
                <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center">
                  <ListChecks className="h-6 w-6" />
                </div>
                <p className="text-sm italic">No {activeTab === "all" ? "" : activeTab} tasks</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
start and