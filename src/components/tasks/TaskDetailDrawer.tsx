import { X, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { QuadrantTask, Urgency, Importance, Status, TimeOfDay, DateBucket } from "./types";

interface TaskDetailDrawerProps {
  task: QuadrantTask | null;
  onClose: () => void;
  onUpdate: (task: QuadrantTask) => void;
  onSubtaskToggle: (taskId: string, subtaskId: string) => void;
}

export function TaskDetailDrawer({ task, onClose, onUpdate, onSubtaskToggle }: TaskDetailDrawerProps) {
  if (!task) return null;

  const handleFieldChange = <K extends keyof QuadrantTask>(field: K, value: QuadrantTask[K]) => {
    onUpdate({ ...task, [field]: value });
  };

  return (
    <div className={cn(
      "fixed right-0 top-0 h-full w-96 bg-card border-l border-border shadow-2xl z-50",
      "animate-slide-in-right"
    )}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Task Details</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Title */}
          <div>
            <Input
              value={task.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              className="text-lg font-semibold border-0 px-0 focus-visible:ring-0"
              placeholder="Task title"
            />
            <div className="flex gap-2 mt-2">
              {task.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Subtasks */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Subtasks
            </h3>
            <div className="space-y-2">
              {task.subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-3">
                  <Checkbox
                    checked={subtask.completed}
                    onCheckedChange={() => onSubtaskToggle(task.id, subtask.id)}
                    className="h-5 w-5"
                  />
                  <span className={cn(
                    "text-sm",
                    subtask.completed && "line-through text-muted-foreground"
                  )}>
                    {subtask.title}
                  </span>
                </div>
              ))}
              {task.subtasks.length === 0 && (
                <p className="text-sm text-muted-foreground italic">No subtasks</p>
              )}
            </div>
          </div>

          {/* Attributes */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Attributes
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Urgency</label>
                <Select 
                  value={task.urgency} 
                  onValueChange={(v) => handleFieldChange('urgency', v as Urgency)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Importance</label>
                <Select 
                  value={task.importance} 
                  onValueChange={(v) => handleFieldChange('importance', v as Importance)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                <Select 
                  value={task.status} 
                  onValueChange={(v) => handleFieldChange('status', v as Status)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Date</label>
                <Select 
                  value={task.date_bucket} 
                  onValueChange={(v) => handleFieldChange('date_bucket', v as DateBucket)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="tomorrow">Tomorrow</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Time of Day</label>
                <Select 
                  value={task.time_of_day} 
                  onValueChange={(v) => handleFieldChange('time_of_day', v as TimeOfDay)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                    <SelectItem value="night">Night</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {task.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="px-3 py-1">
                  {tag}
                </Badge>
              ))}
              {task.tags.length === 0 && (
                <p className="text-sm text-muted-foreground italic">No tags</p>
              )}
            </div>
          </div>

          {/* Focus */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Focus
            </h3>
            <Button className="w-full bg-primary hover:bg-primary/90">
              <Play className="h-4 w-4 mr-2" />
              Start Deep Focus
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
