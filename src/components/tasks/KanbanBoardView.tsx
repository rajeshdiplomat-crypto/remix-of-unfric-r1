import { useEffect, useMemo, useState } from "react";
import { Calendar, Check, Play, Pause, Loader2, ChevronDown, Trash2 } from "lucide-react";
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
  onDeleteTask?: (task: QuadrantTask) => void;
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
  if (task.is_completed) return "border-l-muted-foreground/20";
  if (task.status === "overdue") return "border-l-destructive";
  if (task.urgency === "high" && task.importance === "high") return "border-l-destructive";
  if (task.urgency === "high") return "border-l-foreground/40";
  if (task.importance === "high") return "border-l-foreground/25";
  return "border-l-muted-foreground/10";
}

function KanbanCard({
  task,
  onClick,
  onStartTask,
  onCompleteTask,
  onDeleteTask,
}: {
  task: QuadrantTask;
  onClick: () => void;
  onStartTask: (task: QuadrantTask) => void;
  onCompleteTask: (task: QuadrantTask) => void;
  onDeleteTask?: (task: QuadrantTask) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("task-id", task.id)}
      onClick={onClick}
      className={cn(
        "group p-2.5 cursor-pointer transition-all rounded-sm border-l-[3px]",
        "bg-background/40 backdrop-blur-md border border-foreground/5",
        "hover:bg-background/60 hover:shadow-md hover:border-foreground/10",
        "active:scale-[0.98] active:transition-transform active:duration-75",
        getPriorityBorderClass(task),
        task.is_completed && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-[13px] font-light text-foreground leading-snug mb-1.5 truncate",
            task.is_completed && "line-through text-muted-foreground"
          )}>{task.title}</p>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-nowrap">
            {task.due_date && (
              <span className="text-[10px] tracking-[0.3em] uppercase opacity-50 shrink-0">
                {format(new Date(task.due_date), "d/M")}
              </span>
            )}
            {task.due_time && (
              <span className="text-[10px] tracking-[0.15em] opacity-50 shrink-0 tabular-nums">
                {task.due_time}{task.end_time ? `–${task.end_time}` : ""}
              </span>
            )}
            {getDuration(task) && (
              <span className="text-[10px] tracking-[0.15em] opacity-50 shrink-0 tabular-nums">
                {getDuration(task)}
              </span>
            )}
            <span className="text-[10px] tracking-[0.3em] uppercase opacity-40 font-medium shrink-0">
              {getQuadrantLabel(task)}
            </span>
            {task.tags?.slice(0, 1).map((tag) => (
              <span key={tag} className="text-[10px] tracking-[0.2em] uppercase opacity-40 shrink-0">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-0.5 shrink-0">
          {!task.is_completed && task.status !== "ongoing" && (
            <button
              onClick={(e) => { e.stopPropagation(); onStartTask(task); }}
              className="h-6 w-6 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
              title="Start task"
            >
              <Play className="h-3 w-3" strokeWidth={1.5} />
            </button>
          )}
          {task.status === "ongoing" && !task.is_completed && (
            <button
              onClick={(e) => { e.stopPropagation(); onStartTask(task); }}
              className="h-6 w-6 rounded-sm flex items-center justify-center text-foreground bg-foreground/10 transition-colors"
              title="Pause task"
            >
              <Pause className="h-3 w-3" strokeWidth={1.5} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onCompleteTask(task); }}
            className={cn(
              "h-6 w-6 rounded-sm flex items-center justify-center transition-colors",
              task.is_completed
                ? "text-foreground bg-foreground/10"
                : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
            )}
            title={task.is_completed ? "Mark incomplete" : "Mark complete"}
          >
            <Check className="h-3 w-3" strokeWidth={1.5} />
          </button>
          {onDeleteTask && (
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteTask(task); }}
              className="h-6 w-6 rounded-sm flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
              title="Delete task"
            >
              <Trash2 className="h-3 w-3" strokeWidth={1.5} />
            </button>
          )}
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
  onDeleteTask,
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
      onDrop(`${boardMode}:${quadrantId}`, task);
    }
  };

  return (
    <div className="space-y-4 relative">
      {/* Film grain texture overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />

      {/* Board Mode Selector */}
      <div className="flex items-center gap-1 border-b border-border/40 pb-2 relative z-20">
        {MODE_LABELS.map(({ mode, label }) => (
          <Button
            key={mode}
            variant={boardMode === mode ? "default" : "ghost"}
            size="sm"
            className="h-7 text-[10px] tracking-[0.3em] uppercase rounded-sm"
            onClick={() => setBoardMode(mode)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Dynamic Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-h-[300px] relative z-20">
        {activeQuadrants.map((col) => (
          <div
            key={col.id}
            className="flex flex-col min-h-0 rounded-sm bg-foreground/[0.02] backdrop-blur-sm border border-foreground/[0.04] p-3"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(col.id, e)}
          >
            {/* Column header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: col.color }} />
                <span className="text-[10px] tracking-[0.3em] uppercase opacity-50 font-medium text-foreground">
                  {col.title}
                </span>
              </div>
              <span className="text-[10px] tracking-[0.15em] opacity-40 tabular-nums">
                {columnTasks[col.id]?.length || 0}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
              {columnTasks[col.id]?.map((task) => (
                <KanbanCard key={task.id} task={task} onClick={() => onTaskClick(task)} onStartTask={onStartTask} onCompleteTask={onCompleteTask} onDeleteTask={onDeleteTask} />
              ))}

              {columnCompleted[col.id]?.length > 0 && (
                <Collapsible
                  open={completedOpenMap[col.id] || false}
                  onOpenChange={(open) => setCompletedOpenMap(prev => ({ ...prev, [col.id]: open }))}
                >
                  <CollapsibleTrigger className="flex items-center gap-1.5 w-full py-1.5 text-[10px] tracking-[0.3em] uppercase opacity-40 hover:opacity-60 transition-opacity">
                    <ChevronDown className={cn("h-3 w-3 transition-transform", completedOpenMap[col.id] && "rotate-180")} strokeWidth={1.5} />
                    <span>Done ({columnCompleted[col.id].length})</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1.5">
                    {columnCompleted[col.id].map((task) => (
                      <KanbanCard key={task.id} task={task} onClick={() => onTaskClick(task)} onStartTask={onStartTask} onCompleteTask={onCompleteTask} onDeleteTask={onDeleteTask} />
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
