import { useEffect, useMemo, useState } from "react";
import { Calendar, Check, Play, Pause, Loader2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { QuadrantTask, QuadrantMode, QUADRANT_MODES, computeTaskStatus, computeDateBucket } from "./types";
import { format } from "date-fns";

interface KanbanBoardViewProps {
  tasks: QuadrantTask[];
  onTaskClick: (task: QuadrantTask) => void;
  onDrop: (columnId: string, task: QuadrantTask) => void;
  onStartTask: (task: QuadrantTask) => void;
  onCompleteTask: (task: QuadrantTask) => void;
  defaultMode?: QuadrantMode;
}

function getQuadrantLabel(task: QuadrantTask) {
  const u = task.urgency === "high";
  const i = task.importance === "high";
  if (u && i) return "U&I";
  if (u && !i) return "U&NI";
  if (!u && i) return "NU&I";
  return "NU&NI";
}

function getDuration(task: QuadrantTask) {
  if (!task.due_time || !task.end_time) return "";
  const [sh, sm] = task.due_time.split(":").map(Number);
  const [eh, em] = task.end_time.split(":").map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff <= 0) return "";
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

function getPriorityBorderClass(task: QuadrantTask) {
  if (task.is_completed) return "border-l-muted-foreground/30";
  if (task.status === "overdue") return "border-l-destructive";
  if (task.urgency === "high" && task.importance === "high") return "border-l-destructive";
  if (task.urgency === "high") return "border-l-orange-500";
  if (task.importance === "high") return "border-l-amber-500";
  return "border-l-muted-foreground/20";
}

function KanbanCard({
  task,
  onClick,
  onStartTask,
  onCompleteTask,
}: {
  task: QuadrantTask;
  onClick: () => void;
  onStartTask: (task: QuadrantTask) => void;
  onCompleteTask: (task: QuadrantTask) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("task-id", task.id)}
      onClick={onClick}
      className={cn(
        "group p-2.5 cursor-pointer hover:shadow-md transition-all rounded-lg border-l-4 border-r border-t border-b",
        getPriorityBorderClass(task),
        task.is_completed
          ? "bg-muted/50 border-border/50"
          : "bg-background border-border/50 shadow-sm",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-[13px] font-medium text-foreground leading-snug mb-1 truncate",
            task.is_completed && "line-through text-muted-foreground"
          )}>{task.title}</p>

          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-nowrap">
            {task.due_date && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-foreground/5 text-muted-foreground shrink-0">
                {format(new Date(task.due_date), "d/M")}
              </span>
            )}
            {task.due_time && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-foreground/5 text-muted-foreground shrink-0">
                {task.due_time}{task.end_time ? `–${task.end_time}` : ""}
              </span>
            )}
            {getDuration(task) && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-foreground/5 text-muted-foreground shrink-0">
                {getDuration(task)}
              </span>
            )}
            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-primary/30 text-primary shrink-0">
              {getQuadrantLabel(task)}
            </Badge>
            {task.tags?.slice(0, 1).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] px-1 py-0 h-4 shrink-0">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {!task.is_completed && task.status !== "ongoing" && (
            <button
              onClick={(e) => { e.stopPropagation(); onStartTask(task); }}
              className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              title="Start task"
            >
              <Play className="h-3 w-3" />
            </button>
          )}
          {task.status === "ongoing" && !task.is_completed && (
            <button
              onClick={(e) => { e.stopPropagation(); onStartTask(task); }}
              className="h-6 w-6 rounded-full flex items-center justify-center text-primary bg-primary/10 transition-colors"
              title="Pause task"
            >
              <Pause className="h-3 w-3" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onCompleteTask(task); }}
            className={cn(
              "h-6 w-6 rounded-full flex items-center justify-center transition-colors",
              task.is_completed
                ? "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30"
                : "text-muted-foreground hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
            )}
            title={task.is_completed ? "Mark incomplete" : "Mark complete"}
          >
            <Check className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function filterTaskForQuadrant(task: QuadrantTask, mode: QuadrantMode, quadrantId: string): boolean {
  switch (mode) {
    case "urgent-important":
      if (quadrantId === "urgent-important") return task.urgency === "high" && task.importance === "high";
      if (quadrantId === "urgent-not-important") return task.urgency === "high" && task.importance === "low";
      if (quadrantId === "not-urgent-important") return task.urgency === "low" && task.importance === "high";
      if (quadrantId === "not-urgent-not-important") return task.urgency === "low" && task.importance === "low";
      return false;
    case "status":
      return computeTaskStatus(task) === quadrantId;
    case "date":
      return computeDateBucket(task.due_date) === quadrantId;
    case "time":
      return task.time_of_day === quadrantId;
    default:
      return false;
  }
}

const MODE_LABELS: { mode: QuadrantMode; label: string }[] = [
  { mode: "urgent-important", label: "Urgent × Important" },
  { mode: "status", label: "Status" },
  { mode: "date", label: "Date" },
  { mode: "time", label: "Time of Day" },
];

export function KanbanBoardView({
  tasks,
  onTaskClick,
  onDrop,
  onStartTask,
  onCompleteTask,
  defaultMode,
}: KanbanBoardViewProps) {
  const [boardMode, setBoardMode] = useState<QuadrantMode>(defaultMode || "urgent-important");
  const [completedOpenMap, setCompletedOpenMap] = useState<Record<string, boolean>>({});

  // Sync with defaultMode when it loads from DB
  useEffect(() => {
    if (defaultMode) setBoardMode(defaultMode);
  }, [defaultMode]);

  const activeQuadrants = QUADRANT_MODES[boardMode].quadrants;

  const { columnTasks, columnCompleted } = useMemo(() => {
    const active: Record<string, QuadrantTask[]> = {};
    const completed: Record<string, QuadrantTask[]> = {};
    activeQuadrants.forEach((q) => { active[q.id] = []; completed[q.id] = []; });
    tasks.forEach((t) => {
      for (const q of activeQuadrants) {
        if (filterTaskForQuadrant(t, boardMode, q.id)) {
          (t.is_completed ? completed : active)[q.id].push(t);
          break;
        }
      }
    });
    return { columnTasks: active, columnCompleted: completed };
  }, [tasks, boardMode, activeQuadrants]);

  const handleDrop = (quadrantId: string, e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("task-id");
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      // Pass the quadrantId prefixed with mode so parent can decide what field to update
      onDrop(`${boardMode}:${quadrantId}`, task);
    }
  };

  return (
    <div className="space-y-4">
      {/* Board Mode Selector */}
      <div className="flex items-center gap-1 border-b border-border pb-2">
        {MODE_LABELS.map(({ mode, label }) => (
          <Button
            key={mode}
            variant={boardMode === mode ? "default" : "ghost"}
            size="sm"
            className="h-7 text-[10px] uppercase tracking-wider"
            onClick={() => setBoardMode(mode)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Dynamic Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-h-[300px]">
        {activeQuadrants.map((col) => (
          <div
            key={col.id}
            className="flex flex-col min-h-0 rounded-xl bg-muted/40 border border-border p-3"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(col.id, e)}
          >
            {/* Column header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ background: col.color }} />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
                  {col.title}
                </span>
              </div>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 min-w-[20px] justify-center">
                {columnTasks[col.id]?.length || 0}
              </Badge>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
              {columnTasks[col.id]?.map((task) => (
                <KanbanCard key={task.id} task={task} onClick={() => onTaskClick(task)} onStartTask={onStartTask} onCompleteTask={onCompleteTask} />
              ))}

              {columnCompleted[col.id]?.length > 0 && (
                <Collapsible
                  open={completedOpenMap[col.id] || false}
                  onOpenChange={(open) => setCompletedOpenMap(prev => ({ ...prev, [col.id]: open }))}
                >
                  <CollapsibleTrigger className="flex items-center gap-1.5 w-full py-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronDown className={cn("h-3 w-3 transition-transform", completedOpenMap[col.id] && "rotate-180")} />
                    <span className="font-medium">Done ({columnCompleted[col.id].length})</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2">
                    {columnCompleted[col.id].map((task) => (
                      <KanbanCard key={task.id} task={task} onClick={() => onTaskClick(task)} onStartTask={onStartTask} onCompleteTask={onCompleteTask} />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
