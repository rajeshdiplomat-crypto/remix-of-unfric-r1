import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Plus, CalendarIcon, Trash2, CheckSquare, Clock, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

const priorityColors = {
  low: "bg-green-500/20 text-green-600",
  medium: "bg-yellow-500/20 text-yellow-600",
  high: "bg-red-500/20 text-red-600",
};

const reminderOptions = [
  { value: "0", label: "At time of event" },
  { value: "5", label: "5 minutes before" },
  { value: "15", label: "15 minutes before" },
  { value: "30", label: "30 minutes before" },
  { value: "60", label: "1 hour before" },
  { value: "1440", label: "1 day before" },
];

export default function Tasks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [dueTime, setDueTime] = useState("");
  const [priority, setPriority] = useState<string>("medium");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState("15");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchTasks();
  }, [user]);

  // Check for upcoming tasks and show reminders
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      tasks.forEach((task) => {
        if (task.due_date && !task.is_completed) {
          const dueTime = new Date(task.due_date);
          const timeDiff = dueTime.getTime() - now.getTime();
          const minutesDiff = Math.floor(timeDiff / 60000);

          if (minutesDiff > 0 && minutesDiff <= 15) {
            toast({
              title: "⏰ Upcoming Task",
              description: `"${task.title}" is due in ${minutesDiff} minutes!`,
            });
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [tasks, toast]);

  const fetchTasks = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTasks(data);
    }
    setLoading(false);
  };

  const openDialog = (task?: Task) => {
    if (task) {
      setSelectedTask(task);
      setTitle(task.title);
      setDescription(task.description || "");
      if (task.due_date) {
        const date = new Date(task.due_date);
        setDueDate(date);
        setDueTime(format(date, "HH:mm"));
      } else {
        setDueDate(undefined);
        setDueTime("");
      }
      setPriority(task.priority);
    } else {
      setSelectedTask(null);
      setTitle("");
      setDescription("");
      setDueDate(undefined);
      setDueTime("");
      setPriority("medium");
      setReminderEnabled(false);
      setReminderMinutes("15");
    }
    setDialogOpen(true);
  };

  const saveTask = async () => {
    if (!user || !title.trim()) return;

    setSaving(true);

    let fullDueDate: string | undefined;
    if (dueDate) {
      const date = new Date(dueDate);
      if (dueTime) {
        const [hours, minutes] = dueTime.split(":").map(Number);
        date.setHours(hours, minutes, 0, 0);
      }
      fullDueDate = date.toISOString();
    }

    const taskData = {
      title,
      description,
      due_date: fullDueDate,
      priority,
    };

    if (selectedTask) {
      const { error } = await supabase
        .from("tasks")
        .update(taskData)
        .eq("id", selectedTask.id);

      if (error) {
        toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
      } else {
        toast({ title: "Updated!", description: "Your task has been updated" });
        fetchTasks();
        setDialogOpen(false);
      }
    } else {
      const { error } = await supabase.from("tasks").insert({
        user_id: user.id,
        ...taskData,
      });

      if (error) {
        toast({ title: "Error", description: "Failed to create task", variant: "destructive" });
      } else {
        toast({ title: "Created!", description: "Your task has been created" });
        if (reminderEnabled && dueDate) {
          toast({ title: "Reminder Set", description: `You'll be reminded ${reminderOptions.find(r => r.value === reminderMinutes)?.label}` });
        }
        fetchTasks();
        setDialogOpen(false);
      }
    }

    setSaving(false);
  };

  const toggleComplete = async (task: Task) => {
    const { error } = await supabase
      .from("tasks")
      .update({
        is_completed: !task.is_completed,
        completed_at: !task.is_completed ? new Date().toISOString() : null,
      })
      .eq("id", task.id);

    if (!error) {
      fetchTasks();
    }
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (!error) {
      fetchTasks();
      toast({ title: "Deleted", description: "Task has been removed" });
      setDialogOpen(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "pending") return !task.is_completed;
    if (filter === "completed") return task.is_completed;
    return true;
  });

  const pendingCount = tasks.filter((t) => !t.is_completed).length;
  const completedCount = tasks.filter((t) => t.is_completed).length;

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground mt-1">
            {pendingCount} pending, {completedCount} completed
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedTask ? "Edit Task" : "Create New Task"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Task Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What needs to be done?"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description (optional)</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add more details..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Due Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Due Time</label>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="time"
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Priority</label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reminder Settings */}
              <div className="space-y-3 p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <label className="text-sm font-medium">Reminder</label>
                  </div>
                  <Switch
                    checked={reminderEnabled}
                    onCheckedChange={setReminderEnabled}
                  />
                </div>
                {reminderEnabled && (
                  <Select value={reminderMinutes} onValueChange={setReminderMinutes}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reminderOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={saveTask} disabled={saving || !title.trim()} className="flex-1">
                  {saving ? "Saving..." : selectedTask ? "Update Task" : "Create Task"}
                </Button>
                {selectedTask && (
                  <Button variant="destructive" onClick={() => deleteTask(selectedTask.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All ({tasks.length})
        </Button>
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("pending")}
        >
          Pending ({pendingCount})
        </Button>
        <Button
          variant={filter === "completed" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("completed")}
        >
          Completed ({completedCount})
        </Button>
      </div>

      {filteredTasks.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <CheckSquare className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-medium text-foreground">
            {filter === "all" ? "No tasks yet" : `No ${filter} tasks`}
          </h3>
          <p className="text-muted-foreground mt-1 mb-4">
            {filter === "all" ? "Create your first task to get started." : `You don't have any ${filter} tasks.`}
          </p>
          {filter === "all" && (
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <Card
              key={task.id}
              className={cn(
                "transition-all hover:shadow-sm",
                task.is_completed && "opacity-60",
                !task.is_completed && isOverdue(task.due_date) && "border-red-500/50"
              )}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <Checkbox
                  checked={task.is_completed}
                  onCheckedChange={() => toggleComplete(task)}
                  className="h-5 w-5"
                />
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => openDialog(task)}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "font-medium",
                        task.is_completed && "line-through text-muted-foreground"
                      )}
                    >
                      {task.title}
                    </span>
                    <Badge
                      className={cn("text-xs", priorityColors[task.priority as keyof typeof priorityColors])}
                    >
                      {task.priority}
                    </Badge>
                    {!task.is_completed && isOverdue(task.due_date) && (
                      <Badge variant="destructive" className="text-xs">
                        Overdue
                      </Badge>
                    )}
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {task.description}
                    </p>
                  )}
                  {task.due_date && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <CalendarIcon className="h-3 w-3" />
                      {format(new Date(task.due_date), "PPP")}
                      <Clock className="h-3 w-3 ml-2" />
                      {format(new Date(task.due_date), "h:mm a")}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteTask(task.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
