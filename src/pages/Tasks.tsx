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
import { Plus, CalendarIcon, Trash2, CheckSquare } from "lucide-react";
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
  const [priority, setPriority] = useState<string>("medium");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchTasks();
  }, [user]);

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
      setDueDate(task.due_date ? new Date(task.due_date) : undefined);
      setPriority(task.priority);
    } else {
      setSelectedTask(null);
      setTitle("");
      setDescription("");
      setDueDate(undefined);
      setPriority("medium");
    }
    setDialogOpen(true);
  };

  const saveTask = async () => {
    if (!user || !title.trim()) return;

    setSaving(true);

    const taskData = {
      title,
      description,
      due_date: dueDate?.toISOString(),
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
                task.is_completed && "opacity-60"
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
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {task.description}
                    </p>
                  )}
                  {task.due_date && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Due: {format(new Date(task.due_date), "PPP")}
                    </p>
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
