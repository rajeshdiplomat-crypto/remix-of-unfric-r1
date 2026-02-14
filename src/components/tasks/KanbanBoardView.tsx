import { useMemo, useState } from "react";
import { Plus, Calendar, Check, Play, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuadrantTask, QuadrantMode, QUADRANT_MODES, computeTaskStatus, computeDateBucket, suggestTimeOfDay } from "./types";
import { format } from "date-fns";

interface KanbanBoardViewProps {
  tasks: QuadrantTask[];
  onTaskClick: (task: QuadrantTask) => void;
  onQuickAdd: (title: string, columnId: string) => void;
  onDrop: (columnId: string, task: QuadrantTask) => void;
  onStartTask: (task: QuadrantTask) => void;
  onCompleteTask: (task: QuadrantTask) => void;
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
    <Card
      draggable
      onDragStart={(e) => e.dataTransfer.setData("task-id", task.id)}
      onClick={onClick}
      className={cn(
        "group p-3 cursor-pointer hover:shadow-md transition-shadow",
        task.is_completed
          ? "bg-muted/50 border-border"
          : task.status === "overdue"
            ? "bg-destructive/10 border-destructive/30 shadow-sm"
            : "bg-background border-border shadow-sm",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-medium text-foreground leading-snug mb-1 truncate",
            task.is_completed && "line-through text-muted-foreground"
          )}>{task.title}</p>

          <div className="flex items-center gap-1.5 flex-wrap">
            {task.due_date && (
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(new Date(task.due_date), "d/M")}
              </span>
            )}
            {task.due_time && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {task.due_time}{task.end_time ? ` - ${task.end_time}` : ""}
              </span>
            )}
            {getDuration(task) && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {getDuration(task)}
              </span>
            )}
            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-primary/30 text-primary">
              {getQuadrantLabel(task)}
            </Badge>
            {task.tags?.slice(0, 1).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[9px] px-1.5 py-0">
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
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
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
    </Card>
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
  onQuickAdd,
  onDrop,
  onStartTask,
  onCompleteTask,
}: KanbanBoardViewProps) {
  const [boardMode, setBoardMode] = useState<QuadrantMode>("urgent-important");
  const [quickAddCol, setQuickAddCol] = useState<string | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState("");

  const activeQuadrants = QUADRANT_MODES[boardMode].quadrants;

  const columnTasks = useMemo(() => {
    const map: Record<string, QuadrantTask[]> = {};
    activeQuadrants.forEach((q) => (map[q.id] = []));
    tasks.forEach((t) => {
      for (const q of activeQuadrants) {
        if (filterTaskForQuadrant(t, boardMode, q.id)) {
          map[q.id].push(t);
          break;
        }
      }
    });
    return map;
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

  const submitQuickAdd = (quadrantId: string) => {
    if (quickAddTitle.trim()) {
      onQuickAdd(quickAddTitle.trim(), `${boardMode}:${quadrantId}`);
      setQuickAddTitle("");
      setQuickAddCol(null);
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

            {/* Cards */}
            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
              {columnTasks[col.id]?.map((task) => (
                <KanbanCard key={task.id} task={task} onClick={() => onTaskClick(task)} onStartTask={onStartTask} onCompleteTask={onCompleteTask} />
              ))}
            </div>

            {/* Quick add */}
            {quickAddCol === col.id ? (
              <div className="mt-2 space-y-1">
                <Input
                  autoFocus
                  value={quickAddTitle}
                  onChange={(e) => setQuickAddTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitQuickAdd(col.id);
                    if (e.key === "Escape") setQuickAddCol(null);
                  }}
                  placeholder="Task title..."
                  className="h-8 text-sm"
                />
                <div className="flex gap-1">
                  <Button size="sm" className="h-7 text-[10px] flex-1" onClick={() => submitQuickAdd(col.id)}>
                    Add
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => setQuickAddCol(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-7 text-[10px] text-muted-foreground w-full justify-start"
                onClick={() => setQuickAddCol(col.id)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add task
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
