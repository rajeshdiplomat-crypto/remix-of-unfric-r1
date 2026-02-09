import { useMemo, useState } from "react";
import { Plus, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuadrantTask, QuadrantMode, QUADRANT_MODES, computeTaskStatus, computeDateBucket } from "./types";
import { InsightsPanel } from "./InsightsPanel";
import { format } from "date-fns";

interface KanbanColumn {
  id: string;
  title: string;
  color: string;
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: "todo", title: "To Do", color: "hsl(var(--primary))" },
  { id: "in_progress", title: "In Progress", color: "hsl(var(--chart-1))" },
  { id: "in_review", title: "In Review", color: "hsl(var(--chart-2))" },
  { id: "done", title: "Done", color: "hsl(var(--muted-foreground))" },
];

function mapTaskToColumn(task: QuadrantTask): string {
  const status = computeTaskStatus(task);
  if (status === "completed") return "done";
  if (status === "ongoing") return "in_progress";
  if (status === "overdue") return "todo";
  return "todo";
}

interface KanbanBoardViewProps {
  tasks: QuadrantTask[];
  onTaskClick: (task: QuadrantTask) => void;
  onQuickAdd: (title: string, columnId: string) => void;
  onDrop: (columnId: string, task: QuadrantTask) => void;
  onStartTask: (task: QuadrantTask) => void;
  onCompleteTask: (task: QuadrantTask) => void;
}

function KanbanCard({ task, onClick }: { task: QuadrantTask; onClick: () => void }) {
  const priorityColor = task.priority === "high"
    ? "border-destructive/30"
    : task.priority === "medium"
    ? "border-chart-1/30"
    : "border-border/40";

  return (
    <Card
      draggable
      onDragStart={(e) => e.dataTransfer.setData("task-id", task.id)}
      onClick={onClick}
      className={cn(
        "p-3 cursor-pointer hover:shadow-md transition-shadow border-l-2",
        priorityColor,
      )}
    >
      <p className="text-sm font-medium text-foreground leading-snug mb-1">{task.title}</p>

      {task.description && (
        <p className="text-[10px] text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {task.due_date && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {format(new Date(task.due_date), "MMM d")}
            {task.due_time && ` ${task.due_time}`}
            {task.end_time && task.end_time !== task.due_time && `-${task.end_time}`}
          </span>
        )}
        {task.priority && (
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] px-1.5 py-0",
              task.priority === "high" && "border-destructive/40 text-destructive",
              task.priority === "medium" && "border-chart-1/40 text-chart-1",
              task.priority === "low" && "border-muted-foreground/40 text-muted-foreground",
            )}
          >
            {task.priority}
          </Badge>
        )}
        {task.tags?.slice(0, 2).map((tag) => (
          <Badge key={tag} variant="secondary" className="text-[9px] px-1.5 py-0">
            {tag}
          </Badge>
        ))}
      </div>
    </Card>
  );
}

export function KanbanBoardView({
  tasks,
  onTaskClick,
  onQuickAdd,
  onDrop,
  onStartTask,
  onCompleteTask,
}: KanbanBoardViewProps) {
  const [quickAddCol, setQuickAddCol] = useState<string | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState("");

  const columnTasks = useMemo(() => {
    const map: Record<string, QuadrantTask[]> = {};
    KANBAN_COLUMNS.forEach((col) => (map[col.id] = []));
    tasks.forEach((t) => {
      const colId = mapTaskToColumn(t);
      if (map[colId]) map[colId].push(t);
    });
    return map;
  }, [tasks]);

  // Build 4 quadrant-mode mini-boards
  const quadrantBoards = useMemo(() => {
    const modes: { mode: QuadrantMode; label: string; icon: string }[] = [
      { mode: "urgent-important", label: "Urgent × Important", icon: "📋" },
      { mode: "status", label: "Status", icon: "📊" },
      { mode: "date", label: "Date", icon: "📅" },
      { mode: "time", label: "Time of Day", icon: "🕐" },
    ];

    return modes.map(({ mode, label, icon }) => {
      const config = QUADRANT_MODES[mode];
      const quadrantData = config.quadrants.map((q) => {
        const qTasks = tasks.filter((task) => {
          switch (mode) {
            case "urgent-important":
              if (q.id === "urgent-important") return task.urgency === "high" && task.importance === "high";
              if (q.id === "urgent-not-important") return task.urgency === "high" && task.importance === "low";
              if (q.id === "not-urgent-important") return task.urgency === "low" && task.importance === "high";
              if (q.id === "not-urgent-not-important") return task.urgency === "low" && task.importance === "low";
              return false;
            case "status":
              return computeTaskStatus(task) === q.id;
            case "date":
              return computeDateBucket(task.due_date) === q.id;
            case "time":
              return task.time_of_day === q.id;
            default:
              return false;
          }
        });
        return { ...q, tasks: qTasks };
      });
      return { mode, label, icon, quadrants: quadrantData };
    });
  }, [tasks]);

  const handleDrop = (columnId: string, e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("task-id");
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      const statusMap: Record<string, string> = {
        todo: "upcoming",
        in_progress: "ongoing",
        in_review: "ongoing",
        done: "completed",
      };
      onDrop(statusMap[columnId] || "upcoming", task);
    }
  };

  const submitQuickAdd = (colId: string) => {
    if (quickAddTitle.trim()) {
      const statusMap: Record<string, string> = {
        todo: "upcoming",
        in_progress: "ongoing",
        in_review: "ongoing",
        done: "completed",
      };
      onQuickAdd(quickAddTitle.trim(), statusMap[colId] || "upcoming");
      setQuickAddTitle("");
      setQuickAddCol(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Insights + 4 Quadrant Boards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
        <InsightsPanel tasks={tasks} compactMode={true} />

        {/* 4 Quadrant Mini-Boards in a 2x2 grid */}
        <div className="grid grid-cols-2 gap-3">
          {quadrantBoards.map((board) => (
            <Card key={board.mode} className="p-3 rounded-xl border border-border/30">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-sm">{board.icon}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground">
                  {board.label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {board.quadrants.map((q) => (
                  <div
                    key={q.id}
                    className="rounded-lg p-2 bg-muted/30 border border-border/20 min-h-[60px]"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full" style={{ background: q.color }} />
                        <span className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground truncate max-w-[70px]">
                          {q.title}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-[8px] px-1 py-0 min-w-[16px] justify-center h-4">
                        {q.tasks.length}
                      </Badge>
                    </div>
                    {q.tasks.length > 0 ? (
                      <div className="space-y-0.5">
                        {q.tasks.slice(0, 2).map((t) => (
                          <p
                            key={t.id}
                            className="text-[9px] text-foreground truncate cursor-pointer hover:text-primary"
                            onClick={() => onTaskClick(t)}
                          >
                            {t.title}
                          </p>
                        ))}
                        {q.tasks.length > 2 && (
                          <p className="text-[8px] text-muted-foreground">+{q.tasks.length - 2} more</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-[8px] text-muted-foreground/50 italic">No tasks</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-h-[300px]">
      {KANBAN_COLUMNS.map((col) => (
        <div
          key={col.id}
          className="flex flex-col min-h-0 rounded-xl bg-muted/20 border border-border/30 p-3"
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
              <KanbanCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
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
