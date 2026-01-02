import { useState, useEffect, useRef } from "react";
import { X, Play, Plus, Trash2, Bell, Volume2, CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { QuadrantTask, Urgency, Importance, Subtask, suggestTimeOfDay } from "./types";


interface UnifiedTaskDrawerProps {
  task: QuadrantTask | null;
  isNew: boolean;
  open: boolean;
  onClose: () => void;
  onSave: (task: QuadrantTask) => void;
  onDelete?: (taskId: string) => void;
  onStartFocus: (task: QuadrantTask) => void;
  onStartTask: (task: QuadrantTask) => void;
  onCompleteTask: (task: QuadrantTask) => void;
}

const DEFAULT_TASK: Omit<QuadrantTask, 'id' | 'created_at'> = {
  title: '',
  description: null,
  due_date: null,
  due_time: null,
  priority: 'medium',
  is_completed: false,
  completed_at: null,
  started_at: null,
  reminder_at: null,
  alarm_enabled: false,
  total_focus_minutes: 0,
  urgency: 'low',
  importance: 'low',
  status: 'upcoming',
  time_of_day: 'morning',
  date_bucket: 'today',
  quadrant_assigned: false,
  tags: [],
  subtasks: [],
};

export function UnifiedTaskDrawer({
  task,
  isNew,
  open,
  onClose,
  onSave,
  onDelete,
  onStartFocus,
  onStartTask,
  onCompleteTask,
}: UnifiedTaskDrawerProps) {
  const [formData, setFormData] = useState<Partial<QuadrantTask>>(DEFAULT_TASK);
  const [newSubtask, setNewSubtask] = useState("");
  const timeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task) {
      setFormData(task);
    } else {
      setFormData({
        ...DEFAULT_TASK,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      });
    }
  }, [task, open]);

  const updateField = <K extends keyof QuadrantTask>(field: K, value: QuadrantTask[K]) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-suggest time of day when due_time changes
      if (field === 'due_time' && value) {
        updated.time_of_day = suggestTimeOfDay(value as string);
      }
      
      // Auto-assign to quadrant when urgency or importance is set
      if (field === 'urgency' || field === 'importance') {
        updated.quadrant_assigned = true;
      }
      
      return updated;
    });
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    const subtask: Subtask = {
      id: `subtask-${Date.now()}`,
      title: newSubtask.trim(),
      completed: false,
    };
    updateField('subtasks', [...(formData.subtasks || []), subtask]);
    setNewSubtask("");
  };

  const handleToggleSubtask = (subtaskId: string) => {
    updateField('subtasks', (formData.subtasks || []).map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    ));
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    updateField('subtasks', (formData.subtasks || []).filter(st => st.id !== subtaskId));
  };

  const handleSave = () => {
    if (!formData.title?.trim()) return;
    
    // Ensure quadrant_assigned is true so task shows in all views
    const taskToSave = {
      ...formData,
      quadrant_assigned: true, // Always assign to quadrant so it's visible everywhere
    } as QuadrantTask;
    
    onSave(taskToSave);
    onClose();
  };

  const handleStart = () => {
    if (formData.id && !isNew) {
      onStartTask(formData as QuadrantTask);
    }
  };

  const handleComplete = () => {
    if (formData.id && !isNew) {
      onCompleteTask(formData as QuadrantTask);
    }
  };

  const handleDeepFocus = () => {
    if (formData.id && !isNew) {
      onStartFocus(formData as QuadrantTask);
    }
  };

  const isCompleted = formData.is_completed || !!formData.completed_at;
  const isOngoing = !!formData.started_at && !isCompleted;

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-w-md ml-auto h-full rounded-l-2xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <DrawerHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <DrawerTitle>{isNew ? "Create New Task" : "Task Details"}</DrawerTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DrawerHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Title */}
            <div>
              <Label className="text-sm font-medium">Title *</Label>
              <Input
                value={formData.title || ''}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="What needs to be done?"
                className="mt-1.5"
              />
            </div>

            {/* Description */}
            <div>
              <Label className="text-sm font-medium">Description</Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Add more details..."
                rows={3}
                className="mt-1.5"
              />
            </div>

            {/* Subtasks - Now right after Description */}
            <div>
              <Label className="text-sm font-medium">Subtasks</Label>
              <div className="mt-2 space-y-2">
                {(formData.subtasks || []).map((subtask) => (
                  <div key={subtask.id} className="flex items-center gap-3 group">
                    <Checkbox
                      checked={subtask.completed}
                      onCheckedChange={() => handleToggleSubtask(subtask.id)}
                    />
                    <span className={cn(
                      "flex-1 text-sm",
                      subtask.completed && "line-through text-muted-foreground"
                    )}>
                      {subtask.title}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => handleDeleteSubtask(subtask.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={handleAddSubtask}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add subtask
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                    placeholder="Type and press Enter"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Due Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Due Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal mt-1.5",
                        !formData.due_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.due_date ? format(new Date(formData.due_date), "PPP") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.due_date ? new Date(formData.due_date) : undefined}
                      onSelect={(date) => updateField('due_date', date?.toISOString() || null)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-sm font-medium">Due Time</Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      if (timeInputRef.current) {
                        timeInputRef.current.showPicker?.();
                        timeInputRef.current.focus();
                      }
                    }}
                  >
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Input
                    ref={timeInputRef}
                    type="time"
                    value={formData.due_time || ''}
                    onChange={(e) => updateField('due_time', e.target.value || null)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Time of Day - Auto-derived from Due Time (locked) */}
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Time of Day (auto)</Label>
              <div className="mt-1.5 flex items-center gap-2">
                <div className={cn(
                  "flex-1 h-10 px-3 py-2 rounded-md border border-input bg-muted/50 text-sm",
                  "flex items-center gap-2 text-muted-foreground cursor-not-allowed"
                )}>
                  {formData.due_time ? (
                    <>
                      {formData.time_of_day === 'morning' && '🌅 Morning'}
                      {formData.time_of_day === 'afternoon' && '☀️ Afternoon'}
                      {formData.time_of_day === 'evening' && '🌆 Evening'}
                      {formData.time_of_day === 'night' && '🌙 Night'}
                    </>
                  ) : (
                    <span className="italic">— Set due time first</span>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Auto-set based on due time</p>
            </div>

            {/* Quadrant Assignment */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Urgency</Label>
                <Select
                  value={formData.urgency}
                  onValueChange={(v) => updateField('urgency', v as Urgency)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">🔥 Urgent</SelectItem>
                    <SelectItem value="low">📋 Not Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Importance</Label>
                <Select
                  value={formData.importance}
                  onValueChange={(v) => updateField('importance', v as Importance)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">⭐ Important</SelectItem>
                    <SelectItem value="low">📝 Not Important</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Reminder & Alarm */}
            <div className="space-y-4 p-4 bg-muted/30 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Reminder</Label>
                </div>
                <Switch
                  checked={!!formData.reminder_at}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      const reminderDate = formData.due_date
                        ? new Date(new Date(formData.due_date).getTime() - 60 * 60 * 1000)
                        : new Date(Date.now() + 60 * 60 * 1000);
                      updateField('reminder_at', reminderDate.toISOString());
                    } else {
                      updateField('reminder_at', null);
                    }
                  }}
                />
              </div>

              {formData.reminder_at && (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={formData.reminder_at ? format(new Date(formData.reminder_at), 'yyyy-MM-dd') : ''}
                    onChange={(e) => {
                      const current = formData.reminder_at ? new Date(formData.reminder_at) : new Date();
                      const newDate = new Date(e.target.value);
                      newDate.setHours(current.getHours(), current.getMinutes());
                      updateField('reminder_at', newDate.toISOString());
                    }}
                    className="text-sm"
                  />
                  <Input
                    type="time"
                    value={formData.reminder_at ? format(new Date(formData.reminder_at), 'HH:mm') : ''}
                    onChange={(e) => {
                      const current = formData.reminder_at ? new Date(formData.reminder_at) : new Date();
                      const [h, m] = e.target.value.split(':').map(Number);
                      current.setHours(h, m);
                      updateField('reminder_at', current.toISOString());
                    }}
                    className="text-sm"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Alarm Sound</Label>
                </div>
                <Switch
                  checked={formData.alarm_enabled || false}
                  onCheckedChange={(checked) => updateField('alarm_enabled', checked)}
                />
              </div>

              {formData.alarm_enabled && (
                <p className="text-xs text-muted-foreground">
                  Alarm will play a sound and show a persistent notification when triggered.
                </p>
              )}
            </div>

            {/* Status Info (read-only for existing tasks) */}
            {!isNew && (
              <div className="p-4 bg-muted/20 rounded-xl space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</p>
                <div className="flex items-center gap-2">
                  {isCompleted && (
                    <Badge className="bg-chart-1/10 text-chart-1 border-chart-1/30">Completed</Badge>
                  )}
                  {isOngoing && (
                    <Badge className="bg-primary/10 text-primary border-primary/30">Ongoing</Badge>
                  )}
                  {!isCompleted && !isOngoing && (
                    <Badge className="bg-muted/50 text-muted-foreground">Upcoming</Badge>
                  )}
                  {formData.total_focus_minutes > 0 && (
                    <Badge variant="outline">{formData.total_focus_minutes}m focused</Badge>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {(formData.tags || []).length > 0 && (
              <div>
                <Label className="text-sm font-medium">Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags?.map((tag) => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-border space-y-3">
            {!isNew && !isCompleted && (
              <div className="flex gap-2">
                {!isOngoing && (
                  <Button variant="outline" className="flex-1" onClick={handleStart}>
                    <Play className="h-4 w-4 mr-2" />
                    Start Task
                  </Button>
                )}
                <Button variant="outline" className="flex-1" onClick={handleDeepFocus}>
                  <Play className="h-4 w-4 mr-2" />
                  Deep Focus
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleComplete}>
                  ✓ Complete
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={!formData.title?.trim()} className="flex-1">
                {isNew ? "Create Task" : "Save Changes"}
              </Button>
              {!isNew && onDelete && (
                <Button variant="destructive" size="icon" onClick={() => onDelete(formData.id!)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
