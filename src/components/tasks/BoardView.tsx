import { useState } from "react";
import { Plus, GripVertical, Play, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { QuadrantTask, QuadrantMode, QUADRANT_MODES } from "./types";

interface BoardViewProps {
  mode: QuadrantMode;
  tasks: QuadrantTask[];
  onTaskClick: (task: QuadrantTask) => void;
  onDragStart: (e: React.DragEvent, task: QuadrantTask) => void;
  onDrop: (columnId: string) => void;
  onQuickAdd: (title: string, columnId: string) => void;
}

export function BoardView({ mode, tasks, onTaskClick, onDragStart, onDrop, onQuickAdd }: BoardViewProps) {
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null);
  const [quickAddValue, setQuickAddValue] = useState("");
  const [wipLimits, setWipLimits] = useState<Record<string, number | null>>({});

  const modeConfig = QUADRANT_MODES[mode];

  const getTasksForColumn = (columnId: string): QuadrantTask[] => {
    return tasks.filter(task => {
      if (!task.quadrant_assigned) return false;
      
      switch (mode) {
        case 'urgent-important':
          if (columnId === 'urgent-important') return task.urgency === 'high' && task.importance === 'high';
          if (columnId === 'urgent-not-important') return task.urgency === 'high' && task.importance === 'low';
          if (columnId === 'not-urgent-important') return task.urgency === 'low' && task.importance === 'high';
          if (columnId === 'not-urgent-not-important') return task.urgency === 'low' && task.importance === 'low';
          break;
        case 'status':
          return task.status === columnId;
        case 'date':
          return task.date_bucket === columnId;
        case 'time':
          return task.time_of_day === columnId;
      }
      return false;
    });
  };

  const handleQuickAdd = (e: React.KeyboardEvent, columnId: string) => {
    if (e.key === "Enter" && quickAddValue.trim()) {
      onQuickAdd(quickAddValue.trim(), columnId);
      setQuickAddValue("");
      setAddingToColumn(null);
    }
    if (e.key === "Escape") {
      setAddingToColumn(null);
      setQuickAddValue("");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const Column = ({ column, index }: { column: typeof modeConfig.quadrants[0]; index: number }) => {
    const columnTasks = getTasksForColumn(column.id);
    const completedCount = columnTasks.filter(t => t.is_completed).length;
    const progress = columnTasks.length > 0 ? (completedCount / columnTasks.length) * 100 : 0;
    const wipLimit = wipLimits[column.id];
    const isOverWip = wipLimit && columnTasks.length > wipLimit;

    return (
      <div
        onDragOver={handleDragOver}
        onDrop={() => onDrop(column.id)}
        className={cn(
          "flex flex-col min-w-[280px] max-w-[320px] bg-card/50 rounded-2xl border",
          isOverWip ? "border-destructive/50" : "border-border/50"
        )}
      >
        {/* Column Header */}
        <div className="p-4 border-b border-border/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                {column.title}
              </h3>
              <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-primary/10 text-primary">
                {columnTasks.length}
              </Badge>
            </div>
            {isOverWip && (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            )}
          </div>
          <Progress value={progress} className="h-1" />
          {wipLimit && (
            <p className={cn(
              "text-xs mt-1",
              isOverWip ? "text-destructive" : "text-muted-foreground"
            )}>
              WIP Limit: {columnTasks.length}/{wipLimit}
            </p>
          )}
        </div>

        {/* Task List */}
        <div className="flex-1 p-3 space-y-2 overflow-y-auto min-h-[200px] max-h-[500px]">
          {columnTasks.map((task) => (
            <div
              key={task.id}
              draggable
              onDragStart={(e) => onDragStart(e, task)}
              onClick={() => onTaskClick(task)}
              className={cn(
                "group p-3 bg-background rounded-xl border border-border/30",
                "hover:shadow-md hover:border-border transition-all cursor-pointer",
                task.is_completed && "opacity-60"
              )}
            >
              <div className="flex items-start gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground/40 opacity-0 group-hover:opacity-100 mt-0.5 cursor-grab" />
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium text-foreground",
                    task.is_completed && "line-through"
                  )}>
                    {task.title}
                  </p>
                  {task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {task.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mt-2">
                    {task.priority === 'high' && (
                      <Badge className="text-[10px] px-1.5 py-0 bg-destructive/10 text-destructive border-destructive/30">
                        High
                      </Badge>
                    )}
                    {task.date_bucket === 'today' && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        Today
                      </Badge>
                    )}
                  </div>
                </div>
                <Play className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0" />
              </div>
            </div>
          ))}

          {columnTasks.length === 0 && (
            <div className="flex items-center justify-center h-20 text-muted-foreground/60 text-sm italic">
              Drop tasks here
            </div>
          )}

          {/* Quick Add Input */}
          {addingToColumn === column.id ? (
            <div className="mt-2">
              <Input
                autoFocus
                value={quickAddValue}
                onChange={(e) => setQuickAddValue(e.target.value)}
                onKeyDown={(e) => handleQuickAdd(e, column.id)}
                onBlur={() => {
                  setAddingToColumn(null);
                  setQuickAddValue("");
                }}
                placeholder="Task title (Enter)"
                className="text-sm"
              />
            </div>
          ) : (
            <button
              onClick={() => setAddingToColumn(column.id)}
              className="flex items-center gap-2 w-full p-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add task
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-x-auto">
      <div className="flex gap-4 h-full pb-4">
        {modeConfig.quadrants.map((column, index) => (
          <Column key={column.id} column={column} index={index} />
        ))}
      </div>
    </div>
  );
}
