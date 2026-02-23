import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Play,
  Pause,
  Check,
  Trash2,
  ListChecks,
  Loader2,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { QuadrantTask } from "./types";

interface AllTasksListProps {
  tasks: QuadrantTask[];
  onTaskClick: (task: QuadrantTask) => void;
  onStartTask: (task: QuadrantTask) => void;
  onCompleteTask: (task: QuadrantTask) => void;
  onDeleteTask: (task: QuadrantTask) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

type FilterTab = "all" | "upcoming" | "ongoing" | "done" | "due";
type UrgencyFilter = "all" | "U&I" | "U&NI" | "NU&I" | "NU&NI";

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
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>("all");
  const [completedOpen, setCompletedOpen] = useState(false);

  // Calculate counts for each tab
  const counts = useMemo(() => {
    const all = tasks.length;
    const upcoming = tasks.filter((t) => t.status === "upcoming" && !t.is_completed).length;
    const ongoing = tasks.filter((t) => t.status === "ongoing" && !t.is_completed).length;
    const done = tasks.filter((t) => t.is_completed).length;
    const due = tasks.filter((t) => t.status === "overdue" && !t.is_completed).length;
    return { all, upcoming, ongoing, done, due };
  }, [tasks]);

  // Filter tasks based on active tab and urgency filter
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Apply status filter
    switch (activeTab) {
      case "upcoming":
        result = result.filter((t) => t.status === "upcoming" && !t.is_completed);
        break;
      case "ongoing":
        result = result.filter((t) => t.status === "ongoing" && !t.is_completed);
        break;
      case "done":
        result = result.filter((t) => t.is_completed);
        break;
      case "due":
        result = result.filter((t) => t.status === "overdue" && !t.is_completed);
        break;
    }

    // Apply urgency/importance filter
    switch (urgencyFilter) {
      case "U&I":
        result = result.filter((t) => t.urgency === "high" && t.importance === "high");
        break;
      case "U&NI":
        result = result.filter((t) => t.urgency === "high" && t.importance === "low");
        break;
      case "NU&I":
        result = result.filter((t) => t.urgency === "low" && t.importance === "high");
        break;
      case "NU&NI":
        result = result.filter((t) => t.urgency === "low" && t.importance === "low");
        break;
    }

    return result;
  }, [tasks, activeTab, urgencyFilter]);

  const activeTasks = useMemo(() => {
    if (activeTab === "done") return filteredTasks;
    return filteredTasks.filter(t => !t.is_completed);
  }, [filteredTasks, activeTab]);

  const completedInList = useMemo(() => {
    if (activeTab === "done") return [];
    return filteredTasks.filter(t => t.is_completed);
  }, [filteredTasks, activeTab]);

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: "all", label: "All", count: counts.all },
    { id: "upcoming", label: "Up", count: counts.upcoming },
    { id: "ongoing", label: "On", count: counts.ongoing },
    { id: "done", label: "Done", count: counts.done },
    { id: "due", label: "Due", count: counts.due },
  ];

  const urgencyTabs: { id: UrgencyFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "U&I", label: "U&I" },
    { id: "U&NI", label: "U&NI" },
    { id: "NU&I", label: "NU&I" },
    { id: "NU&NI", label: "NU&NI" },
  ];

  // Format date display
  const formatDate = (task: QuadrantTask) => {
    if (!task.due_date) return "";
    const date = new Date(task.due_date);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${day}/${month}`;
  };

  // Calculate duration between start and end time
  const getDuration = (task: QuadrantTask) => {
    if (!task.due_time || !task.end_time) return "";
    const [sh, sm] = task.due_time.split(":").map(Number);
    const [eh, em] = task.end_time.split(":").map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff <= 0) return "";
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
  };

  // Get quadrant label
  const getQuadrantLabel = (task: QuadrantTask) => {
    const u = task.urgency === "high";
    const i = task.importance === "high";
    if (u && i) return "U&I";
    if (u && !i) return "U&NI";
    if (!u && i) return "NU&I";
    return "NU&NI";
  };

  // Collapsed state - just show toggle button
  if (collapsed) {
    return (
      <div className="h-full flex flex-col items-center py-4 bg-card rounded-2xl border border-border shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="h-10 w-10 rounded-full"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <ListChecks className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">All Tasks</span>
        </div>
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-8 w-8 rounded-lg"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Task list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {activeTasks.length === 0 && completedInList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No tasks found
            </div>
          ) : (
            <>
              {activeTasks.map((task) => (
                <TaskRow key={task.id} task={task} onTaskClick={onTaskClick} onStartTask={onStartTask} onCompleteTask={onCompleteTask} onDeleteTask={onDeleteTask} currentUserId="" formatDate={formatDate} getDuration={getDuration} getQuadrantLabel={getQuadrantLabel} />
              ))}

              {completedInList.length > 0 && (
                <Collapsible open={completedOpen} onOpenChange={setCompletedOpen}>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full py-1.5 text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", completedOpen && "rotate-180")} />
                    <span className="font-medium text-[11px]">Completed ({completedInList.length})</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1">
                    {completedInList.map((task) => (
                      <TaskRow key={task.id} task={task} onTaskClick={onTaskClick} onStartTask={onStartTask} onCompleteTask={onCompleteTask} onDeleteTask={onDeleteTask} currentUserId="" formatDate={formatDate} getDuration={getDuration} getQuadrantLabel={getQuadrantLabel} />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function TaskRow({ task, onTaskClick, onStartTask, onCompleteTask, onDeleteTask, formatDate, getDuration, getQuadrantLabel }: {
  task: QuadrantTask;
  onTaskClick: (task: QuadrantTask) => void;
  onStartTask: (task: QuadrantTask) => void;
  onCompleteTask: (task: QuadrantTask) => void;
  onDeleteTask: (task: QuadrantTask) => void;
  currentUserId: string;
  formatDate: (task: QuadrantTask) => string;
  getDuration: (task: QuadrantTask) => string;
  getQuadrantLabel: (task: QuadrantTask) => string;
}) {
  const isMobile = useIsMobile();

  return (
    <div
      onClick={() => onTaskClick(task)}
      className={cn(
        "group rounded-lg cursor-pointer transition-all",
        "hover:shadow-md",
        isMobile ? "p-2 border-l-4" : "p-2 border",
        task.is_completed
          ? isMobile
            ? "bg-muted/50 border-l-muted-foreground/30"
            : "bg-muted/50 border-border"
          : task.status === "overdue"
            ? isMobile
              ? "bg-background border-l-destructive"
              : "bg-destructive/10 border-destructive/30"
            : task.urgency === "high" && task.importance === "high"
              ? isMobile
                ? "bg-background border-l-destructive"
                : "bg-background border-border"
              : task.urgency === "high"
                ? isMobile
                  ? "bg-background border-l-orange-500"
                  : "bg-background border-border"
                : task.importance === "high"
                  ? isMobile
                    ? "bg-background border-l-amber-500"
                    : "bg-background border-border"
                  : isMobile
                    ? "bg-background border-l-muted-foreground/20"
                    : "bg-background border-border",
        !isMobile && "hover:border-primary/30",
        isMobile && "border-r border-t border-b border-border/50 shadow-sm"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={cn(
            "font-medium truncate",
            isMobile ? "text-[13px]" : "text-sm",
            task.is_completed && "line-through text-muted-foreground"
          )}>
            {task.title}
          </p>
          {/* Mobile: horizontal scrollable mini-pills row */}
          <div className={cn(
            "flex items-center gap-1 mt-1",
            isMobile ? "overflow-x-auto scrollbar-hide flex-nowrap" : "flex-wrap gap-1.5"
          )}>
            {formatDate(task) && (
              <span className={cn(
                "px-1.5 py-0.5 rounded shrink-0",
                isMobile ? "text-[10px] bg-foreground/5 text-muted-foreground" : "text-[10px] bg-muted text-muted-foreground"
              )}>{formatDate(task)}</span>
            )}
            {task.due_time && (
              <span className={cn(
                "px-1.5 py-0.5 rounded shrink-0",
                isMobile ? "text-[10px] bg-foreground/5 text-muted-foreground" : "text-[10px] bg-muted text-muted-foreground"
              )}>
                {task.due_time}{task.end_time ? `–${task.end_time}` : ""}
              </span>
            )}
            {getDuration(task) && (
              <span className={cn(
                "px-1.5 py-0.5 rounded shrink-0",
                isMobile ? "text-[10px] bg-foreground/5 text-muted-foreground" : "text-[10px] bg-muted text-muted-foreground"
              )}>{getDuration(task)}</span>
            )}
            <Badge variant="outline" className={cn(
              "px-1 py-0 h-4 border-primary/30 text-primary shrink-0",
              isMobile ? "text-[10px]" : "text-[10px]"
            )}>
              {getQuadrantLabel(task)}
            </Badge>
            {task.tags?.slice(0, 1).map((tag) => (
              <Badge key={tag} variant="secondary" className={cn(
                "px-1 py-0 h-4 shrink-0",
                isMobile ? "text-[10px]" : "text-[10px]"
              )}>{tag}</Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!task.is_completed && task.status !== "ongoing" && (
            <button onClick={(e) => { e.stopPropagation(); onStartTask(task); }} className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Start task">
              <Play className="h-3 w-3" />
            </button>
          )}
          {task.status === "ongoing" && !task.is_completed && (
            <button onClick={(e) => { e.stopPropagation(); onStartTask(task); }} className="h-6 w-6 rounded-full flex items-center justify-center text-primary bg-primary/10 transition-colors" title="Pause task">
              <Pause className="h-3 w-3" />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onCompleteTask(task); }} className={cn("h-6 w-6 rounded-full flex items-center justify-center transition-colors", task.is_completed ? "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30" : "text-muted-foreground hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20")} title={task.is_completed ? "Mark incomplete" : "Mark complete"}>
            <Check className="h-3 w-3" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDeleteTask(task); }} className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100" title="Delete task">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default AllTasksList;
