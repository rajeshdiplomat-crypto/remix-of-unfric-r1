import { useState, useEffect, useRef, useMemo } from "react";
import { X, Play, Plus, Trash2, Bell, Volume2, CalendarIcon, Clock } from "lucide-react";
import { format, parseISO, isSameDay } from "date-fns";
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
import { QuadrantTask, Urgency, Importance, Subtask, suggestTimeOfDay, getDefaultEndTime } from "./types";

interface UnifiedTaskDrawerProps {
  task: QuadrantTask | null;
  isNew: boolean;
  open: boolean;
  allTasks?: QuadrantTask[]; // All tasks to show busy slots
  onClose: () => void;
  onSave: (task: QuadrantTask) => void;
  onDelete?: (taskId: string) => void;
  onStartFocus: (task: QuadrantTask) => void;
  onStartTask: (task: QuadrantTask) => void;
  onCompleteTask: (task: QuadrantTask) => void;
}

const DEFAULT_TASK: Omit<QuadrantTask, "id" | "created_at"> = {
  title: "",
  description: null,
  due_date: null,
  due_time: null,
  end_time: null,
  priority: "medium",
  is_completed: false,
  completed_at: null,
  started_at: null,
  reminder_at: null,
  alarm_enabled: false,
  total_focus_minutes: 0,
  urgency: "low",
  importance: "low",
  status: "upcoming",
  time_of_day: "morning",
  date_bucket: "today",
  quadrant_assigned: false,
  tags: [],
  subtasks: [],
};

export function UnifiedTaskDrawer({
  task,
  isNew,
  open,
  allTasks = [],
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

  // Calculate busy time slots for the selected date
  const busySlots = useMemo(() => {
    if (!formData.due_date) return [];
    const selectedDate = new Date(formData.due_date);
    return allTasks
      .filter((t) => {
        if (!t.due_date || t.id === formData.id) return false;
        return isSameDay(parseISO(t.due_date), selectedDate);
      })
      .map((t) => ({
        id: t.id,
        title: t.title,
        start: t.due_time || "09:00",
        end: t.end_time || "10:00",
      }));
  }, [formData.due_date, formData.id, allTasks]);

  const updateField = <K extends keyof QuadrantTask>(field: K, value: QuadrantTask[K]) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto-suggest time of day when due_time changes
      if (field === "due_time" && value) {
        updated.time_of_day = suggestTimeOfDay(value as string);
        // Auto-set end time to start time + 2 hours
        updated.end_time = getDefaultEndTime(value as string);
      }

      // Auto-assign to quadrant when urgency or importance is set
      if (field === "urgency" || field === "importance") {
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
    updateField("subtasks", [...(formData.subtasks || []), subtask]);
    setNewSubtask("");
  };

  const handleToggleSubtask = (subtaskId: string) => {
    updateField(
      "subtasks",
      (formData.subtasks || []).map((st) => (st.id === subtaskId ? { ...st, completed: !st.completed } : st)),
    );
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    updateField(
      "subtasks",
      (formData.subtasks || []).filter((st) => st.id !== subtaskId),
    );
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
                value={formData.title || ""}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="What needs to be done?"
                className="mt-1.5"
              />
            </div>

            {/* Description */}
            <div>
              <Label className="text-sm font-medium">Description</Label>
              <Textarea
                value={formData.description || ""}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Add more details..."
                rows={3}
                className="mt-1.5"
              />
            </div>

            {/* Subtasks */}
            <div>
              <Label className="text-sm font-medium">Subtasks</Label>
              <div className="mt-2 space-y-2">
                {(formData.subtasks || []).map((subtask) => (
                  <div key={subtask.id} className="flex items-center gap-3 group">
                    <Checkbox checked={subtask.completed} onCheckedChange={() => handleToggleSubtask(subtask.id)} />
                    <span className={cn("flex-1 text-sm", subtask.completed && "line-through text-muted-foreground")}>
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
                  <Plus className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                    placeholder="Add subtask..."
                    className="h-8 text-sm border-dashed"
                  />
                </div>
              </div>
            </div>

            {/* Date & Time Section - Matching Reference UI */}
            <div className="space-y-4 p-4 bg-muted/20 rounded-xl">
              {/* Row 1: Start date */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Start date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-9 text-sm",
                        !formData.due_date && "text-muted-foreground",
                      )}
                    >
                      {formData.due_date ? format(new Date(formData.due_date), "dd-MM-yyyy") : "Pick date"}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.due_date ? new Date(formData.due_date) : undefined}
                      onSelect={(date) => updateField("due_date", date?.toISOString() || null)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Day Schedule - Vertical Time Blocks */}
              {formData.due_date && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Day Schedule</Label>
                  <p className="text-xs text-muted-foreground">Click a time slot to set start time</p>

                  <div className="flex gap-4">
                    {/* Vertical timeline */}
                    <div className="relative w-full h-80 bg-background rounded-xl border shadow-sm overflow-hidden flex">
                      {/* Time labels on left */}
                      <div className="w-14 shrink-0 border-r border-border/40 bg-muted/30">
                        {[6, 8, 10, 12, 14, 16, 18, 20, 22].map((hour) => (
                          <div
                            key={hour}
                            className="h-[36px] flex items-center justify-end pr-2 text-xs font-medium text-muted-foreground border-b border-border/20"
                          >
                            {hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                          </div>
                        ))}
                      </div>

                      {/* Schedule area */}
                      <div className="flex-1 relative">
                        {/* Hour grid lines */}
                        {[6, 8, 10, 12, 14, 16, 18, 20, 22].map((hour, i) => (
                          <div
                            key={hour}
                            className={cn("h-[36px] border-b border-border/20", i % 2 === 0 && "bg-muted/10")}
                          />
                        ))}

                        {/* Busy slots (existing tasks) */}
                        {busySlots.map((slot) => {
                          const [sh, sm] = slot.start.split(":").map(Number);
                          const [eh, em] = slot.end.split(":").map(Number);
                          const startMins = sh * 60 + sm;
                          const endMins = eh * 60 + em;
                          const dayStart = 6 * 60;
                          const dayEnd = 22 * 60;
                          const topPercent = Math.max(0, ((startMins - dayStart) / (dayEnd - dayStart)) * 100);
                          const heightPercent = Math.min(
                            100 - topPercent,
                            ((endMins - startMins) / (dayEnd - dayStart)) * 100,
                          );

                          return (
                            <div
                              key={slot.id}
                              className="absolute left-2 right-2 bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 rounded-r px-2 py-1 overflow-hidden shadow-sm"
                              style={{ top: `${topPercent}%`, height: `${heightPercent}%`, minHeight: "24px" }}
                              title={`${slot.title}: ${slot.start} - ${slot.end}`}
                            >
                              <span className="text-xs font-medium text-red-700 dark:text-red-300 truncate block">
                                {slot.title}
                              </span>
                              <span className="text-[10px] text-red-600/70 dark:text-red-400/70">{slot.start}</span>
                            </div>
                          );
                        })}

                        {/* Current selection indicator */}
                        {formData.due_time &&
                          formData.end_time &&
                          (() => {
                            const [sh, sm] = formData.due_time.split(":").map(Number);
                            const [eh, em] = formData.end_time.split(":").map(Number);
                            const startMins = sh * 60 + sm;
                            const endMins = eh * 60 + em;
                            const dayStart = 6 * 60;
                            const dayEnd = 22 * 60;
                            const topPercent = Math.max(0, ((startMins - dayStart) / (dayEnd - dayStart)) * 100);
                            const heightPercent = Math.min(
                              100 - topPercent,
                              ((endMins - startMins) / (dayEnd - dayStart)) * 100,
                            );

                            return (
                              <div
                                className="absolute left-2 right-2 bg-primary/20 border-l-4 border-primary rounded-r px-2 py-1 flex items-center shadow-sm"
                                style={{ top: `${topPercent}%`, height: `${heightPercent}%`, minHeight: "28px" }}
                              >
                                <div>
                                  <span className="text-xs font-semibold text-primary block">New Task</span>
                                  <span className="text-[10px] text-primary/70">
                                    {formData.due_time} - {formData.end_time}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}

                        {/* Clickable time slots */}
                        <div className="absolute inset-0 flex flex-col">
                          {Array.from({ length: 16 }, (_, i) => i + 6).map((hour) => (
                            <button
                              key={hour}
                              type="button"
                              className="flex-1 hover:bg-primary/10 transition-all hover:shadow-inner border-b border-transparent"
                              onClick={() => {
                                const time = `${hour.toString().padStart(2, "0")}:00`;
                                updateField("due_time", time);
                                updateField("end_time", `${hour.toString().padStart(2, "0")}:30`);
                              }}
                              title={`Click to set ${hour}:00`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-col gap-3 text-xs text-muted-foreground pt-1">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-100 dark:bg-red-900/30 border-l-2 border-red-500 rounded-r" />
                        <span>Busy</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-primary/20 border-l-2 border-primary rounded-r" />
                        <span>This task</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-3">
                {/* Start Time - Wheel picker style */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Start time</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full h-9 text-sm justify-between">
                        {formData.due_time || "09:00"}
                        <Clock className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-2" align="start">
                      <div className="flex gap-2">
                        {/* Hours */}
                        <div className="flex-1 max-h-48 overflow-y-auto">
                          {Array.from({ length: 24 }, (_, h) => (
                            <button
                              key={h}
                              type="button"
                              onClick={() => {
                                const currentMins = formData.due_time?.split(":")[1] || "00";
                                const newTime = `${h.toString().padStart(2, "0")}:${currentMins}`;
                                updateField("due_time", newTime);
                              }}
                              className={cn(
                                "w-full py-1.5 text-center text-sm rounded hover:bg-muted",
                                formData.due_time?.startsWith(h.toString().padStart(2, "0")) &&
                                  "bg-primary text-primary-foreground",
                              )}
                            >
                              {h.toString().padStart(2, "0")}
                            </button>
                          ))}
                        </div>
                        <div className="text-muted-foreground self-center">:</div>
                        {/* Minutes */}
                        <div className="flex-1 max-h-48 overflow-y-auto">
                          {[0, 15, 30, 45].map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                const currentHours = formData.due_time?.split(":")[0] || "09";
                                const newTime = `${currentHours}:${m.toString().padStart(2, "0")}`;
                                updateField("due_time", newTime);
                              }}
                              className={cn(
                                "w-full py-1.5 text-center text-sm rounded hover:bg-muted",
                                formData.due_time?.endsWith(`:${m.toString().padStart(2, "0")}`) &&
                                  "bg-primary text-primary-foreground",
                              )}
                            >
                              {m.toString().padStart(2, "0")}
                            </button>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Duration picker (hrs + mins) */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Duration</Label>
                  <div className="flex gap-1">
                    <Select
                      value={(() => {
                        if (!formData.due_time || !formData.end_time) return "0";
                        const [sh, sm] = formData.due_time.split(":").map(Number);
                        const [eh, em] = formData.end_time.split(":").map(Number);
                        let totalMins = eh * 60 + em - (sh * 60 + sm);
                        if (totalMins < 0) totalMins += 24 * 60;
                        return String(Math.floor(totalMins / 60));
                      })()}
                      onValueChange={(hrs) => {
                        if (formData.due_time) {
                          const [sh, sm] = formData.due_time.split(":").map(Number);
                          const currentMins = formData.end_time
                            ? (() => {
                                const [eh, em] = formData.end_time.split(":").map(Number);
                                let totalMins = eh * 60 + em - (sh * 60 + sm);
                                if (totalMins < 0) totalMins += 24 * 60;
                                return totalMins % 60;
                              })()
                            : 30;
                          const totalMinutes = sh * 60 + sm + parseInt(hrs) * 60 + currentMins;
                          const endHours = Math.floor(totalMinutes / 60) % 24;
                          const endMins = totalMinutes % 60;
                          updateField(
                            "end_time",
                            `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`,
                          );
                        }
                      }}
                    >
                      <SelectTrigger className="h-9 text-sm flex-1">
                        <SelectValue placeholder="0h" />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4, 5, 6, 8, 10, 12].map((h) => (
                          <SelectItem key={h} value={String(h)}>
                            {h}h
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={(() => {
                        if (!formData.due_time || !formData.end_time) return "30";
                        const [sh, sm] = formData.due_time.split(":").map(Number);
                        const [eh, em] = formData.end_time.split(":").map(Number);
                        let totalMins = eh * 60 + em - (sh * 60 + sm);
                        if (totalMins < 0) totalMins += 24 * 60;
                        return String(totalMins % 60);
                      })()}
                      onValueChange={(mins) => {
                        if (formData.due_time) {
                          const [sh, sm] = formData.due_time.split(":").map(Number);
                          const currentHrs = formData.end_time
                            ? (() => {
                                const [eh, em] = formData.end_time.split(":").map(Number);
                                let totalMins = eh * 60 + em - (sh * 60 + sm);
                                if (totalMins < 0) totalMins += 24 * 60;
                                return Math.floor(totalMins / 60);
                              })()
                            : 0;
                          const totalMinutes = sh * 60 + sm + currentHrs * 60 + parseInt(mins);
                          const endHours = Math.floor(totalMinutes / 60) % 24;
                          const endMins = totalMinutes % 60;
                          updateField(
                            "end_time",
                            `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`,
                          );
                        }
                      }}
                    >
                      <SelectTrigger className="h-9 text-sm flex-1">
                        <SelectValue placeholder="30m" />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 15, 30, 45].map((m) => (
                          <SelectItem key={m} value={String(m)}>
                            {m}m
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* End Time - Auto calculated, can override */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">End time</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full h-9 text-sm justify-between">
                        {formData.end_time || "09:30"}
                        <Clock className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-2" align="start">
                      <div className="flex gap-2">
                        {/* Hours */}
                        <div className="flex-1 max-h-48 overflow-y-auto">
                          {Array.from({ length: 24 }, (_, h) => (
                            <button
                              key={h}
                              type="button"
                              onClick={() => {
                                const currentMins = formData.end_time?.split(":")[1] || "00";
                                const newTime = `${h.toString().padStart(2, "0")}:${currentMins}`;
                                updateField("end_time", newTime);
                              }}
                              className={cn(
                                "w-full py-1.5 text-center text-sm rounded hover:bg-muted",
                                formData.end_time?.startsWith(h.toString().padStart(2, "0")) &&
                                  "bg-primary text-primary-foreground",
                              )}
                            >
                              {h.toString().padStart(2, "0")}
                            </button>
                          ))}
                        </div>
                        <div className="text-muted-foreground self-center">:</div>
                        {/* Minutes */}
                        <div className="flex-1 max-h-48 overflow-y-auto">
                          {[0, 15, 30, 45].map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                const currentHours = formData.end_time?.split(":")[0] || "09";
                                const newTime = `${currentHours}:${m.toString().padStart(2, "0")}`;
                                updateField("end_time", newTime);
                              }}
                              className={cn(
                                "w-full py-1.5 text-center text-sm rounded hover:bg-muted",
                                formData.end_time?.endsWith(`:${m.toString().padStart(2, "0")}`) &&
                                  "bg-primary text-primary-foreground",
                              )}
                            >
                              {m.toString().padStart(2, "0")}
                            </button>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Row 3: Recurring button */}
              <div className="flex items-center">
                <Button
                  type="button"
                  variant={formData.tags?.includes("recurring") ? "default" : "outline"}
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={() => {
                    const currentTags = formData.tags || [];
                    if (currentTags.includes("recurring")) {
                      updateField(
                        "tags",
                        currentTags.filter(
                          (t) => !t.startsWith("recurring") && !t.startsWith("repeat-") && !t.startsWith("until-"),
                        ),
                      );
                    } else {
                      updateField("tags", [...currentTags, "recurring"]);
                    }
                  }}
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 1l4 4-4 4" />
                    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                    <path d="M7 23l-4-4 4-4" />
                    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                  </svg>
                  Recurring
                </Button>
              </div>

              {/* Recurring Options */}
              {formData.tags?.includes("recurring") && (
                <div className="space-y-3 pt-2 border-t border-border/30">
                  {/* Repeat every X week(s) */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Repeat every</span>
                    <Select defaultValue="1">
                      <SelectTrigger className="w-16 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select defaultValue="week">
                      <SelectTrigger className="w-20 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">day</SelectItem>
                        <SelectItem value="week">week</SelectItem>
                        <SelectItem value="month">month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Day of week circles */}
                  <div className="flex items-center gap-1.5">
                    {[
                      { key: "mon", label: "M" },
                      { key: "tue", label: "T" },
                      { key: "wed", label: "W" },
                      { key: "thu", label: "T" },
                      { key: "fri", label: "F" },
                      { key: "sat", label: "S" },
                      { key: "sun", label: "S" },
                    ].map(({ key, label }) => {
                      const isSelected = formData.tags?.includes(`repeat-${key}`);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            const tag = `repeat-${key}`;
                            const currentTags = formData.tags || [];
                            if (isSelected) {
                              updateField(
                                "tags",
                                currentTags.filter((t) => t !== tag),
                              );
                            } else {
                              updateField("tags", [...currentTags, tag]);
                            }
                          }}
                          className={cn(
                            "w-8 h-8 rounded-full text-sm font-medium transition-colors",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80 text-muted-foreground",
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}

                    {/* Until date */}
                    <span className="text-sm text-muted-foreground ml-3">Until</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 text-sm gap-1">
                          Jul 07, 2026
                          <CalendarIcon className="h-3.5 w-3.5 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" initialFocus className="pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </div>

            {/* Time of Day - Auto-derived from Due Time (locked) */}
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Time of Day (auto)</Label>
              <div className="mt-1.5 flex items-center gap-2">
                <div
                  className={cn(
                    "flex-1 h-10 px-3 py-2 rounded-md border border-input bg-muted/50 text-sm",
                    "flex items-center gap-2 text-muted-foreground cursor-not-allowed",
                  )}
                >
                  {formData.due_time ? (
                    <>
                      {formData.time_of_day === "morning" && "🌅 Morning"}
                      {formData.time_of_day === "afternoon" && "☀️ Afternoon"}
                      {formData.time_of_day === "evening" && "🌆 Evening"}
                      {formData.time_of_day === "night" && "🌙 Night"}
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
                <Select value={formData.urgency} onValueChange={(v) => updateField("urgency", v as Urgency)}>
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
                <Select value={formData.importance} onValueChange={(v) => updateField("importance", v as Importance)}>
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
                      updateField("reminder_at", reminderDate.toISOString());
                    } else {
                      updateField("reminder_at", null);
                    }
                  }}
                />
              </div>

              {formData.reminder_at && (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={formData.reminder_at ? format(new Date(formData.reminder_at), "yyyy-MM-dd") : ""}
                    onChange={(e) => {
                      const current = formData.reminder_at ? new Date(formData.reminder_at) : new Date();
                      const newDate = new Date(e.target.value);
                      newDate.setHours(current.getHours(), current.getMinutes());
                      updateField("reminder_at", newDate.toISOString());
                    }}
                    className="text-sm"
                  />
                  <Input
                    type="time"
                    value={formData.reminder_at ? format(new Date(formData.reminder_at), "HH:mm") : ""}
                    onChange={(e) => {
                      const current = formData.reminder_at ? new Date(formData.reminder_at) : new Date();
                      const [h, m] = e.target.value.split(":").map(Number);
                      current.setHours(h, m);
                      updateField("reminder_at", current.toISOString());
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
                  onCheckedChange={(checked) => updateField("alarm_enabled", checked)}
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
                  {isCompleted && <Badge className="bg-chart-1/10 text-chart-1 border-chart-1/30">Completed</Badge>}
                  {isOngoing && <Badge className="bg-primary/10 text-primary border-primary/30">Ongoing</Badge>}
                  {!isCompleted && !isOngoing && <Badge className="bg-muted/50 text-muted-foreground">Upcoming</Badge>}
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
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
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
