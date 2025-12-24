import { useState } from "react";
import { Plus, GripVertical, Play, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { QuadrantTask } from "./types";

interface TaskInboxProps {
  tasks: QuadrantTask[];
  onQuickAdd: (title: string) => void;
  onTaskClick: (task: QuadrantTask) => void;
  onDragStart: (e: React.DragEvent, task: QuadrantTask) => void;
}

export function TaskInbox({ tasks, onQuickAdd, onTaskClick, onDragStart }: TaskInboxProps) {
  const [quickAddValue, setQuickAddValue] = useState("");
  const [unassignedCollapsed, setUnassignedCollapsed] = useState(false);
  const [assignedCollapsed, setAssignedCollapsed] = useState(false);

  const unassignedTasks = tasks.filter(t => !t.quadrant_assigned);
  const assignedTasks = tasks.filter(t => t.quadrant_assigned);

  const handleQuickAdd = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && quickAddValue.trim()) {
      onQuickAdd(quickAddValue.trim());
      setQuickAddValue("");
    }
  };

  const getUrgencyBadge = (task: QuadrantTask) => {
    if (task.urgency === 'high') {
      return <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-destructive/10 text-destructive border-destructive/30">Urgent</Badge>;
    }
    return <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-muted/50 text-muted-foreground border-border">Urgency: Low</Badge>;
  };

  const getImportanceBadge = (task: QuadrantTask) => {
    if (task.importance === 'high') {
      return <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-primary/10 text-primary border-primary/30">Important</Badge>;
    }
    return <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-muted/50 text-muted-foreground border-border">Importance: Mid</Badge>;
  };

  const getStatusBadge = (task: QuadrantTask) => {
    const statusColors: Record<string, string> = {
      overdue: "bg-destructive/10 text-destructive border-destructive/30",
      ongoing: "bg-chart-1/10 text-chart-1 border-chart-1/30",
      upcoming: "bg-primary/10 text-primary border-primary/30",
      completed: "bg-muted/50 text-muted-foreground border-border",
    };
    return (
      <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5 capitalize", statusColors[task.status])}>
        Status: {task.status}
      </Badge>
    );
  };

  const getTimeBadge = (task: QuadrantTask) => {
    if (!task.time_of_day) return null;
    return (
      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-muted/50 text-muted-foreground border-border capitalize">
        Time: {task.time_of_day}
      </Badge>
    );
  };

  const TaskRow = ({ task }: { task: QuadrantTask }) => (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onClick={() => onTaskClick(task)}
      className={cn(
        "group flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50",
        "hover:shadow-md hover:border-border transition-all duration-200 cursor-pointer",
        task.is_completed && "opacity-60"
      )}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
      
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium text-sm text-foreground truncate", task.is_completed && "line-through")}>
          {task.title}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {getUrgencyBadge(task)}
          {getImportanceBadge(task)}
          {getStatusBadge(task)}
          {getTimeBadge(task)}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <GripVertical className="h-4 w-4 text-muted-foreground/40" />
        <Play className="h-4 w-4 text-muted-foreground/40 hover:text-primary transition-colors" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-card/50 rounded-2xl border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border/50">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-foreground">Task Inbox</h2>
          <div className="h-6 w-6 rounded-full bg-muted/50 flex items-center justify-center">
            <span className="text-xs text-muted-foreground">⊕</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Add tasks, then drag them into a quadrant to shape your day.
        </p>
      </div>

      {/* Quick Add */}
      <div className="p-4 border-b border-border/30">
        <div className="relative">
          <Plus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={quickAddValue}
            onChange={(e) => setQuickAddValue(e.target.value)}
            onKeyDown={handleQuickAdd}
            placeholder="Add a task (Enter)"
            className="pl-9 bg-background/50 border-border/50 rounded-xl"
          />
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Unassigned Section */}
        <div>
          <button
            onClick={() => setUnassignedCollapsed(!unassignedCollapsed)}
            className="flex items-center justify-between w-full mb-3"
          >
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Unassigned
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{unassignedTasks.length}</span>
              <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", unassignedCollapsed && "-rotate-90")} />
            </div>
          </button>
          {!unassignedCollapsed && (
            <div className="space-y-2">
              {unassignedTasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
              {unassignedTasks.length === 0 && (
                <p className="text-xs text-muted-foreground italic py-2">No unassigned tasks</p>
              )}
            </div>
          )}
        </div>

        {/* Assigned Section */}
        <div>
          <button
            onClick={() => setAssignedCollapsed(!assignedCollapsed)}
            className="flex items-center justify-between w-full mb-3"
          >
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Assigned
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{assignedTasks.length}</span>
              <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", assignedCollapsed && "-rotate-90")} />
            </div>
          </button>
          {!assignedCollapsed && (
            <div className="space-y-2">
              {assignedTasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
              {assignedTasks.length === 0 && (
                <p className="text-xs text-muted-foreground italic py-2">No assigned tasks</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Hint */}
      <div className="p-4 border-t border-border/30 bg-muted/20">
        <p className="text-xs text-muted-foreground">
          Drag from here into a quadrant on the right to assign urgency, importance, status, date, or time. Use ▶ Start to jump into Deep Focus for any task.
        </p>
      </div>
    </div>
  );
}
