import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { X, Play, Plus, Trash2, Bell, Volume2, CalendarIcon } from "lucide-react";
import { format, parseISO, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UnifiedDatePicker } from "@/components/common/UnifiedDatePicker";
import { UnifiedTimePicker } from "@/components/common/UnifiedTimePicker";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { QuadrantTask, Urgency, Importance, Subtask, suggestTimeOfDay, getDefaultEndTime } from "./types";
import { useTimeFormat } from "@/hooks/useTimeFormat";

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
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const timeInputRef = useRef<HTMLInputElement>(null);
  const { timeFormat, formatTime, formatHour } = useTimeFormat();

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
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg p-0 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex flex-col h-full min-h-0">
          {/* Blue gradient header — matches Manifest's teal header style */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-4 text-white flex-shrink-0">
            <DialogTitle className="text-lg font-semibold text-white">
              {isNew ? "Create New Task" : "Task Details"}
            </DialogTitle>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6">
            {/* Title — hidden when schedule is open */}
            {!scheduleOpen && (
              <div>
                <Label className="text-sm font-medium">Title *</Label>
                <Input
                  value={formData.title || ""}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="What needs to be done?"
                  className="mt-1.5"
                />
              </div>
            )}

            {/* Description — hidden when schedule is open */}
            {!scheduleOpen && (
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
            )}

            {/* Subtasks — hidden when schedule is open */}
            {!scheduleOpen && (
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
            )}

            {/* Schedule Section — Compact Horizontal Layout */}
            <div className="space-y-3 p-4 bg-muted/20 rounded-xl">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Schedule</Label>

              {/* Row 1: Date + Start + End — all inline */}
              <div className="grid grid-cols-3 gap-2">
                {/* Date */}
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">Date</Label>
                  <UnifiedDatePicker
                    value={formData.due_date ? new Date(formData.due_date) : undefined}
                    onChange={(date) => updateField("due_date", date?.toISOString() || null)}
                    placeholder="Pick"
                    displayFormat="dd MMM"
                    triggerClassName="w-full h-8 text-xs"
                    icon={<CalendarIcon className="h-3 w-3 opacity-50" />}
                  />
                </div>

                {/* Start Time */}
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">Start</Label>
                  <UnifiedTimePicker
                    value={formData.due_time || "09:00"}
                    onChange={(v) => updateField("due_time", v)}
                    triggerClassName="h-8 text-xs w-full"
                  />
                </div>

                {/* End Time */}
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">End</Label>
                  <UnifiedTimePicker
                    value={formData.end_time || "10:00"}
                    onChange={(v) => updateField("end_time", v)}
                    triggerClassName="h-8 text-xs w-full"
                  />
                </div>
              </div>

              {/* Row 2: Duration chips — quick set */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-muted-foreground mr-1">Duration:</span>
                {[
                  { label: "30m", mins: 30 },
                  { label: "1h", mins: 60 },
                  { label: "1.5h", mins: 90 },
                  { label: "2h", mins: 120 },
                  { label: "3h", mins: 180 },
                ].map(({ label, mins }) => {
                  // Check if currently matching
                  const isActive = (() => {
                    if (!formData.due_time || !formData.end_time) return false;
                    const [sh, sm] = formData.due_time.split(":").map(Number);
                    const [eh, em] = formData.end_time.split(":").map(Number);
                    let total = eh * 60 + em - (sh * 60 + sm);
                    if (total < 0) total += 24 * 60;
                    return total === mins;
                  })();

                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        if (!formData.due_time) {
                          updateField("due_time", "09:00");
                        }
                        const startTime = formData.due_time || "09:00";
                        const [sh, sm] = startTime.split(":").map(Number);
                        const totalMins = sh * 60 + sm + mins;
                        const endH = Math.floor(totalMins / 60) % 24;
                        const endM = totalMins % 60;
                        updateField("end_time", `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`);
                      }}
                      className={cn(
                        "px-2.5 py-1 text-[10px] font-medium rounded-full border transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:border-primary/50",
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Row 3: Recurring toggle */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={formData.tags?.includes("recurring") ? "default" : "outline"}
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
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
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Repeat every</span>
                    <Select defaultValue="1">
                      <SelectTrigger className="w-14 h-7 text-xs">
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
                      <SelectTrigger className="w-18 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">day</SelectItem>
                        <SelectItem value="week">week</SelectItem>
                        <SelectItem value="month">month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

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
                              updateField("tags", currentTags.filter((t) => t !== tag));
                            } else {
                              updateField("tags", [...currentTags, tag]);
                            }
                          }}
                          className={cn(
                            "w-7 h-7 rounded-full text-xs font-medium transition-colors",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80 text-muted-foreground",
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}

                    <span className="text-xs text-muted-foreground ml-2">Until</span>
                    <UnifiedDatePicker
                      value={undefined}
                      onChange={() => {}}
                      placeholder="Jul 07, 2026"
                      triggerClassName="h-7 text-xs gap-1"
                      icon={<CalendarIcon className="h-3 w-3 opacity-50" />}
                    />
                  </div>
                </div>
              )}

              {/* Day Schedule visual (collapsible, scrollable, 30-min slots) */}
              {formData.due_date && (
                <div>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors flex items-center gap-1"
                    onClick={() => setScheduleOpen(!scheduleOpen)}
                  >
                    <span className={cn("transition-transform", scheduleOpen && "rotate-90")}>▶</span>
                    {scheduleOpen ? "Hide day schedule" : "View day schedule"}
                  </button>
                  {scheduleOpen && (
                  <div className="mt-2 w-full bg-background rounded-lg border shadow-sm overflow-hidden">
                    <div className="flex-1 overflow-y-auto">
                      <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
                        <tbody>
                          {Array.from({ length: 48 }, (_, i) => {
                            const hour = Math.floor(i / 2);
                            const min = i % 2 === 0 ? "00" : "30";
                            const timeVal = `${hour.toString().padStart(2, "0")}:${min}`;
                            const isBusy = busySlots.some((slot) => {
                              const [sh, sm] = slot.start.split(":").map(Number);
                              const [eh, em] = slot.end.split(":").map(Number);
                              const slotStart = sh * 60 + sm;
                              const slotEnd = eh * 60 + em;
                              const rowStart = hour * 60 + (i % 2 === 0 ? 0 : 30);
                              return rowStart >= slotStart && rowStart < slotEnd;
                            });
                            const busyTask = busySlots.find((slot) => {
                              const [sh, sm] = slot.start.split(":").map(Number);
                              return sh * 60 + sm === hour * 60 + (i % 2 === 0 ? 0 : 30);
                            });
                            const isCurrentStart = formData.due_time === timeVal;
                            const isCurrentSlot = formData.due_time && formData.end_time && (() => {
                              const [sh, sm] = formData.due_time!.split(":").map(Number);
                              const [eh, em] = formData.end_time!.split(":").map(Number);
                              const rowStart = hour * 60 + (i % 2 === 0 ? 0 : 30);
                              return rowStart >= sh * 60 + sm && rowStart < eh * 60 + em;
                            })();

                            return (
                              <tr
                                key={i}
                                className={cn(
                                  "h-[28px] cursor-pointer transition-colors",
                                  isCurrentSlot ? "bg-primary/15" : isBusy ? "bg-destructive/8" : i % 2 === 0 ? "bg-muted/10" : "",
                                  "hover:bg-primary/10"
                                )}
                                onClick={() => {
                                  updateField("due_time", timeVal);
                                  const endMins = hour * 60 + (i % 2 === 0 ? 0 : 30) + 60;
                                  const endH = Math.floor(endMins / 60) % 24;
                                  const endM = endMins % 60;
                                  updateField("end_time", `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`);
                                }}
                              >
                                <td className="w-12 pr-1.5 text-right text-[9px] font-medium text-muted-foreground border-r border-border/40 bg-muted/30">
                                  {i % 2 === 0 ? formatHour(hour) : ""}
                                </td>
                                <td className={cn("pl-2 text-[10px]", i < 47 && "border-b border-border/20")}>
                                  {isCurrentStart && (
                                    <span className="font-semibold text-primary">
                                      {formatTime(formData.due_time!)}–{formatTime(formData.end_time!)}
                                    </span>
                                  )}
                                  {!isCurrentStart && busyTask && (
                                    <span className="font-medium text-destructive">{busyTask.title}</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  )}
                </div>
              )}
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
            <div className="space-y-3 p-4 bg-muted/30 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Reminder</Label>
                </div>
                <Switch
                  checked={!!formData.reminder_at}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      // Default: task date + task start time - 30 minutes
                      let reminderDate: Date;
                      if (formData.due_date && formData.due_time) {
                        const taskDate = new Date(formData.due_date);
                        const [h, m] = formData.due_time.split(":").map(Number);
                        taskDate.setHours(h, m, 0, 0);
                        reminderDate = new Date(taskDate.getTime() - 30 * 60 * 1000);
                      } else if (formData.due_date) {
                        // Has date but no time — default to 9:00 AM on that day
                        const taskDate = new Date(formData.due_date);
                        taskDate.setHours(9, 0, 0, 0);
                        reminderDate = new Date(taskDate.getTime() - 30 * 60 * 1000);
                      } else {
                        // No date set — default to 30 min from now
                        reminderDate = new Date(Date.now() + 30 * 60 * 1000);
                      }
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
                  <Select
                    value={formData.reminder_at ? format(new Date(formData.reminder_at), "HH:mm") : ""}
                    onValueChange={(v) => {
                      const current = formData.reminder_at ? new Date(formData.reminder_at) : new Date();
                      const [h, m] = v.split(":").map(Number);
                      current.setHours(h, m);
                      updateField("reminder_at", current.toISOString());
                    }}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Time" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 z-[9999]">
                      {Array.from({ length: 48 }, (_, i) => {
                        const h = Math.floor(i / 2);
                        const m2 = i % 2 === 0 ? "00" : "30";
                        const val = `${h.toString().padStart(2, "0")}:${m2}`;
                        return (
                          <SelectItem key={val} value={val}>
                            {formatTime(val)}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
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
      </DialogContent>
    </Dialog>
  );
}
