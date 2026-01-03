import { useState } from "react";
import { Play, Check, Calendar, Clock, ChevronsLeft, ChevronsRight, ListChecks } from "lucide-react";
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

  /** NEW */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

type FilterTab = "all" | "upcoming" | "ongoing" | "completed" | "overdue";

export function AllTasksList({
  tasks,
  onTaskClick,
  onStartTask,
  onCompleteTask,
  collapsed = false,
  onToggleCollapse,
}: AllTasksListProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const filteredTasks = activeTab === "all" ? tasks : tasks.filter((t) => computeTaskStatus(t) === activeTab);

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

    return (
      <div
        className={cn(
          "group p-3 bg-background rounded-xl border border-border/50 transition-all",
          "hover:shadow-md hover:border-border cursor-pointer",
          isCompleted && "opacity-60",
        )}
      >
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0" onClick={() => onTaskClick(task)}>
            <p className={cn("text-sm font-medium text-foreground truncate", isCompleted && "line-through")}>
              {task.title}
            </p>

            <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
              {task.due_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(task.due_date), "MMM d")}
                </span>
              )}
              {task.due_time && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {task.due_time}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1 mt-2">
              {getUrgencyBadge(task.urgency)}
              {getImportanceBadge(task.importance)}
              {getTimeOfDayBadge(task.time_of_day)}
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {!isCompleted && status !== "completed" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-70 hover:opacity-100 hover:bg-primary/10 hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartTask(task);
                }}
                title="Start / Deep Focus"
              >
                <Play className="h-3.5 w-3.5" />
              </Button>
            )}
            {!isCompleted && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-70 hover:opacity-100 hover:bg-chart-1/10 hover:text-chart-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onCompleteTask(task);
                }}
                title="Mark Complete"
              >
                <Check className="h-3.5 w-3.5" />
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
      <div className="flex flex-col h-full min-h-0 bg-card/50 rounded-2xl border border-border/50 items-center py-3 gap-3 overflow-hidden">
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
    <div className="flex flex-col h-full min-h-0 bg-card/50 rounded-2xl border border-border/50 overflow-hidden">
      {/* Header - fixed, never scrolls */}
      <div className="p-4 border-b border-border/30 flex items-center justify-between flex-shrink-0">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">All Tasks</h2>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl"
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
        className="flex-1 flex flex-col min-h-0 overflow-hidden"
      >
        <div className="px-3 pt-3">
          <TabsList className="w-full grid grid-cols-5 h-8 bg-muted/30">
            <TabsTrigger value="all" className="text-xs px-1">
              All ({counts.all})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="text-xs px-1">
              Up ({counts.upcoming})
            </TabsTrigger>
            <TabsTrigger value="ongoing" className="text-xs px-1">
              On ({counts.ongoing})
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs px-1">
              Done ({counts.completed})
            </TabsTrigger>
            <TabsTrigger value="overdue" className="text-xs px-1 text-destructive">
              Due ({counts.overdue})
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1 px-3 pb-3">
          <div className="space-y-2 mt-3">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => <TaskCard key={task.id} task={task} />)
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground/60 text-sm italic">
                No {activeTab === "all" ? "" : activeTab} tasks
              </div>
            )}
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
