import { useState } from "react";
import { Plus, GripVertical, Play, CheckCircle, AlertTriangle, Calendar, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { QuadrantTask, BOARD_COLUMNS, computeTaskStatus } from "./types";

interface BoardViewProps {
  mode: string;
  tasks: QuadrantTask[];
  onTaskClick: (task: QuadrantTask) => void;
  onDragStart: (e: React.DragEvent, task: QuadrantTask) => void;
  onDrop: (columnId: string) => void;
  onQuickAdd: (title: string, columnId: string) => void;
  onStartTask?: (task: QuadrantTask) => void;
  onCompleteTask?: (task: QuadrantTask) => void;
}

export function BoardView({ 
  mode, 
  tasks, 
  onTaskClick, 
  onDragStart, 
  onDrop, 
  onQuickAdd,
  onStartTask,
  onCompleteTask,
}: BoardViewProps) {
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null);
  const [quickAddValue, setQuickAddValue] = useState("");

  // Always use status-based columns
  const columns = BOARD_COLUMNS;

  const getTasksForColumn = (columnId: string): QuadrantTask[] => {
    return tasks.filter(task => {
      const status = computeTaskStatus(task);
      return status === columnId;
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

  const getColumnIcon = (columnId: string) => {
    switch (columnId) {
      case 'overdue': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'upcoming': return <Calendar className="h-4 w-4 text-primary" />;
      case 'ongoing': return <Play className="h-4 w-4 text-chart-1" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
      default: return null;
    }
  };

  const Column = ({ column, index }: { column: typeof columns[0]; index: number }) => {
    const columnTasks = getTasksForColumn(column.id);
    const completedCount = columnTasks.filter(t => t.is_completed).length;
    const progress = columnTasks.length > 0 ? (completedCount / columnTasks.length) * 100 : 0;

    return (
      <div
        onDragOver={handleDragOver}
        onDrop={() => onDrop(column.id)}
        className="flex flex-col min-w-[280px] max-w-[320px] bg-card/50 rounded-2xl border border-border/50"
      >
        {/* Column Header */}
        <div className="p-4 border-b border-border/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getColumnIcon(column.id)}
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                {column.title}
              </h3>
              <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-primary/10 text-primary">
                {columnTasks.length}
              </Badge>
            </div>
          </div>
          {column.id !== 'completed' && <Progress value={progress} className="h-1" />}
        </div>

        {/* Task List */}
        <div className="flex-1 p-3 space-y-2 overflow-y-auto min-h-[200px] max-h-[500px]">
          {columnTasks.map((task) => (
            <div
              key={task.id}
              draggable
              onDragStart={(e) => onDragStart(e, task)}
              className={cn(
                "group p-3 bg-background rounded-xl border border-border/30",
                "hover:shadow-md hover:border-border transition-all cursor-pointer",
                task.is_completed && "opacity-60"
              )}
            >
              <div className="flex items-start gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground/40 opacity-0 group-hover:opacity-100 mt-0.5 cursor-grab" />
                
                {/* Complete checkbox for non-completed */}
                {column.id !== 'completed' && (
                  <Checkbox
                    checked={task.is_completed}
                    onCheckedChange={() => onCompleteTask?.(task)}
                    className="mt-0.5"
                  />
                )}
                
                <div className="flex-1 min-w-0" onClick={() => onTaskClick(task)}>
                  <p className={cn(
                    "text-sm font-medium text-foreground",
                    task.is_completed && "line-through"
                  )}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    {task.due_date && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {new Date(task.due_date).toLocaleDateString()}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                      {task.time_of_day}
                    </Badge>
                  </div>
                </div>
                
                {/* Start button for upcoming tasks */}
                {column.id === 'upcoming' && onStartTask && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartTask(task);
                    }}
                  >
                    <Play className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          {columnTasks.length === 0 && (
            <div className="flex items-center justify-center h-20 text-muted-foreground/60 text-sm italic">
              No {column.title.toLowerCase()} tasks
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
            column.id !== 'overdue' && column.id !== 'completed' && (
              <button
                onClick={() => setAddingToColumn(column.id)}
                className="flex items-center gap-2 w-full p-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add task
              </button>
            )
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-x-auto">
      <div className="flex gap-4 h-full pb-4">
        {columns.map((column, index) => (
          <Column key={column.id} column={column} index={index} />
        ))}
      </div>
    </div>
  );
}
