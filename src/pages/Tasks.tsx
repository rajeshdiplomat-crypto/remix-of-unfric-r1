import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Plus, CalendarIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { ViewSwitcher } from "@/components/tasks/ViewSwitcher";
import { QuadrantToolbar } from "@/components/tasks/QuadrantToolbar";
import { TaskInbox } from "@/components/tasks/TaskInbox";
import { QuadrantGrid } from "@/components/tasks/QuadrantGrid";
import { BoardView } from "@/components/tasks/BoardView";
import { TaskDetailDrawer } from "@/components/tasks/TaskDetailDrawer";
import { SummaryStrip } from "@/components/tasks/SummaryStrip";
import { TasksInsights } from "@/components/tasks/TasksInsights";
import { 
  QuadrantTask, 
  QuadrantMode, 
  Urgency, 
  Importance, 
  Status, 
  TimeOfDay, 
  DateBucket 
} from "@/components/tasks/types";

// Sample data for demo
const SAMPLE_TASKS: Omit<QuadrantTask, 'id' | 'created_at'>[] = [
  {
    title: "Prepare launch checklist",
    description: "Complete all pre-launch requirements",
    due_date: new Date().toISOString(),
    priority: "high",
    is_completed: false,
    completed_at: null,
    urgency: "high",
    importance: "high",
    status: "ongoing",
    time_of_day: "afternoon",
    date_bucket: "today",
    tags: ["Launch", "Website redesign"],
    subtasks: [
      { id: "1", title: "Confirm final designs", completed: true },
      { id: "2", title: "Sync with engineering", completed: false },
      { id: "3", title: "QA main user flows", completed: false },
    ],
    quadrant_assigned: true,
  },
  {
    title: "Q3 report analysis",
    description: "Analyze quarterly performance metrics",
    due_date: new Date(Date.now() - 86400000).toISOString(),
    priority: "high",
    is_completed: false,
    completed_at: null,
    urgency: "high",
    importance: "high",
    status: "overdue",
    time_of_day: "morning",
    date_bucket: "yesterday",
    tags: ["Reports"],
    subtasks: [],
    quadrant_assigned: true,
  },
  {
    title: "Respond to client feedback",
    description: "Address client concerns",
    due_date: new Date(Date.now() - 86400000).toISOString(),
    priority: "high",
    is_completed: false,
    completed_at: null,
    urgency: "high",
    importance: "high",
    status: "overdue",
    time_of_day: "evening",
    date_bucket: "yesterday",
    tags: ["Client"],
    subtasks: [],
    quadrant_assigned: true,
  },
  {
    title: "Review marketing assets",
    description: "Review and approve marketing materials",
    due_date: new Date().toISOString(),
    priority: "medium",
    is_completed: false,
    completed_at: null,
    urgency: "high",
    importance: "low",
    status: "ongoing",
    time_of_day: "morning",
    date_bucket: "today",
    tags: ["Marketing"],
    subtasks: [],
    quadrant_assigned: true,
  },
  {
    title: "Reply to Slack messages",
    description: "Clear Slack backlog",
    due_date: new Date().toISOString(),
    priority: "low",
    is_completed: false,
    completed_at: null,
    urgency: "high",
    importance: "low",
    status: "ongoing",
    time_of_day: "evening",
    date_bucket: "today",
    tags: ["Communication"],
    subtasks: [],
    quadrant_assigned: true,
  },
  {
    title: "Draft Q4 objectives",
    description: "Plan next quarter goals",
    due_date: new Date(Date.now() + 86400000 * 3).toISOString(),
    priority: "medium",
    is_completed: false,
    completed_at: null,
    urgency: "low",
    importance: "high",
    status: "upcoming",
    time_of_day: "night",
    date_bucket: "week",
    tags: ["Planning"],
    subtasks: [],
    quadrant_assigned: true,
  },
  {
    title: "Weekly team sync prep",
    description: "Prepare agenda for team meeting",
    due_date: new Date(Date.now() + 86400000).toISOString(),
    priority: "medium",
    is_completed: false,
    completed_at: null,
    urgency: "low",
    importance: "high",
    status: "upcoming",
    time_of_day: "morning",
    date_bucket: "tomorrow",
    tags: ["Team"],
    subtasks: [],
    quadrant_assigned: true,
  },
  {
    title: "Explore new automation tools",
    description: "Research automation options",
    due_date: null,
    priority: "low",
    is_completed: false,
    completed_at: null,
    urgency: "low",
    importance: "low",
    status: "upcoming",
    time_of_day: "afternoon",
    date_bucket: "week",
    tags: ["Research"],
    subtasks: [],
    quadrant_assigned: true,
  },
  {
    title: "Organize inspiration board",
    description: "Curate design inspiration",
    due_date: null,
    priority: "low",
    is_completed: false,
    completed_at: null,
    urgency: "low",
    importance: "low",
    status: "upcoming",
    time_of_day: "night",
    date_bucket: "week",
    tags: ["Design"],
    subtasks: [],
    quadrant_assigned: true,
  },
  // Unassigned tasks
  {
    title: "Research AI tools",
    description: "Check new AI tools",
    due_date: null,
    priority: "low",
    is_completed: false,
    completed_at: null,
    urgency: "low",
    importance: "low",
    status: "upcoming",
    time_of_day: "night",
    date_bucket: "week",
    tags: [],
    subtasks: [],
    quadrant_assigned: false,
  },
  {
    title: "Update portfolio site",
    description: "Collect references",
    due_date: null,
    priority: "low",
    is_completed: false,
    completed_at: null,
    urgency: "low",
    importance: "low",
    status: "upcoming",
    time_of_day: "night",
    date_bucket: "week",
    tags: [],
    subtasks: [],
    quadrant_assigned: false,
  },
  {
    title: "Clean downloads folder",
    description: "Organize files",
    due_date: null,
    priority: "low",
    is_completed: false,
    completed_at: null,
    urgency: "low",
    importance: "low",
    status: "upcoming",
    time_of_day: "night",
    date_bucket: "week",
    tags: [],
    subtasks: [],
    quadrant_assigned: false,
  },
];

export default function Tasks() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // View state
  const [view, setView] = useState<'board' | 'quadrant'>('quadrant');
  const [quadrantMode, setQuadrantMode] = useState<QuadrantMode>('urgent-important');
  const [searchQuery, setSearchQuery] = useState("");
  
  // Task state
  const [tasks, setTasks] = useState<QuadrantTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState<QuadrantTask | null>(null);
  
  // Dialog/Drawer state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<QuadrantTask | null>(null);
  const [detailTask, setDetailTask] = useState<QuadrantTask | null>(null);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [dueTime, setDueTime] = useState("");
  const [priority, setPriority] = useState<string>("medium");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchTasks();
  }, [user]);

  const fetchTasks = async () => {
    if (!user) {
      // Load sample data for demo
      const sampleWithIds = SAMPLE_TASKS.map((t, i) => ({
        ...t,
        id: `sample-${i}`,
        created_at: new Date().toISOString(),
      }));
      setTasks(sampleWithIds);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Transform database tasks to QuadrantTask
      const quadrantTasks: QuadrantTask[] = data.map(t => ({
        ...t,
        urgency: t.priority === 'high' ? 'high' : 'low' as Urgency,
        importance: t.priority === 'high' ? 'high' : 'low' as Importance,
        status: t.is_completed ? 'completed' : 'ongoing' as Status,
        time_of_day: 'morning' as TimeOfDay,
        date_bucket: 'today' as DateBucket,
        tags: [],
        subtasks: [],
        quadrant_assigned: false,
      }));
      
      // If no tasks, use sample data
      if (quadrantTasks.length === 0) {
        const sampleWithIds = SAMPLE_TASKS.map((t, i) => ({
          ...t,
          id: `sample-${i}`,
          created_at: new Date().toISOString(),
        }));
        setTasks(sampleWithIds);
      } else {
        setTasks(quadrantTasks);
      }
    }
    setLoading(false);
  };

  const openDialog = (task?: QuadrantTask) => {
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
    }
    setDialogOpen(true);
  };

  const saveTask = async () => {
    if (!title.trim()) return;
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

    const newTask: QuadrantTask = {
      id: `new-${Date.now()}`,
      title,
      description,
      due_date: fullDueDate || null,
      priority,
      is_completed: false,
      completed_at: null,
      created_at: new Date().toISOString(),
      urgency: priority === 'high' ? 'high' : 'low',
      importance: priority === 'high' ? 'high' : 'low',
      status: 'upcoming',
      time_of_day: 'morning',
      date_bucket: 'today',
      tags: [],
      subtasks: [],
      quadrant_assigned: false,
    };

    if (user) {
      const { error } = await supabase.from("tasks").insert({
        user_id: user.id,
        title,
        description,
        due_date: fullDueDate,
        priority,
      });

      if (error) {
        toast({ title: "Error", description: "Failed to create task", variant: "destructive" });
        setSaving(false);
        return;
      }
    }

    setTasks(prev => [newTask, ...prev]);
    toast({ title: "Created!", description: "Your task has been created" });
    setDialogOpen(false);
    setSaving(false);
  };

  const handleQuickAdd = (taskTitle: string) => {
    const newTask: QuadrantTask = {
      id: `quick-${Date.now()}`,
      title: taskTitle,
      description: null,
      due_date: null,
      priority: 'medium',
      is_completed: false,
      completed_at: null,
      created_at: new Date().toISOString(),
      urgency: 'low',
      importance: 'low',
      status: 'upcoming',
      time_of_day: 'morning',
      date_bucket: 'today',
      tags: [],
      subtasks: [],
      quadrant_assigned: false,
    };
    setTasks(prev => [newTask, ...prev]);
    toast({ title: "Task added", description: "Drag it to a quadrant to prioritize" });
  };

  const handleBoardQuickAdd = (taskTitle: string, columnId: string) => {
    const newTask: QuadrantTask = {
      id: `board-${Date.now()}`,
      title: taskTitle,
      description: null,
      due_date: null,
      priority: 'medium',
      is_completed: false,
      completed_at: null,
      created_at: new Date().toISOString(),
      urgency: 'low',
      importance: 'low',
      status: 'upcoming',
      time_of_day: 'morning',
      date_bucket: 'today',
      tags: [],
      subtasks: [],
      quadrant_assigned: true,
    };

    // Update based on column/mode
    updateTaskForColumn(newTask, columnId);
    setTasks(prev => [newTask, ...prev]);
    toast({ title: "Task added" });
  };

  const updateTaskForColumn = (task: QuadrantTask, columnId: string) => {
    switch (quadrantMode) {
      case 'urgent-important':
        if (columnId === 'urgent-important') {
          task.urgency = 'high';
          task.importance = 'high';
        } else if (columnId === 'urgent-not-important') {
          task.urgency = 'high';
          task.importance = 'low';
        } else if (columnId === 'not-urgent-important') {
          task.urgency = 'low';
          task.importance = 'high';
        } else {
          task.urgency = 'low';
          task.importance = 'low';
        }
        break;
      case 'status':
        task.status = columnId as Status;
        break;
      case 'date':
        task.date_bucket = columnId as DateBucket;
        break;
      case 'time':
        task.time_of_day = columnId as TimeOfDay;
        break;
    }
  };

  const handleDragStart = (e: React.DragEvent, task: QuadrantTask) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (quadrantId: string) => {
    if (!draggedTask) return;

    setTasks(prev => prev.map(t => {
      if (t.id !== draggedTask.id) return t;
      
      const updated = { ...t, quadrant_assigned: true };
      
      switch (quadrantMode) {
        case 'urgent-important':
          if (quadrantId === 'urgent-important') {
            updated.urgency = 'high';
            updated.importance = 'high';
          } else if (quadrantId === 'urgent-not-important') {
            updated.urgency = 'high';
            updated.importance = 'low';
          } else if (quadrantId === 'not-urgent-important') {
            updated.urgency = 'low';
            updated.importance = 'high';
          } else {
            updated.urgency = 'low';
            updated.importance = 'low';
          }
          break;
        case 'status':
          updated.status = quadrantId as Status;
          break;
        case 'date':
          updated.date_bucket = quadrantId as DateBucket;
          // Update due_date based on bucket
          const now = new Date();
          if (quadrantId === 'yesterday') {
            updated.due_date = new Date(now.getTime() - 86400000).toISOString();
          } else if (quadrantId === 'today') {
            updated.due_date = now.toISOString();
          } else if (quadrantId === 'tomorrow') {
            updated.due_date = new Date(now.getTime() + 86400000).toISOString();
          } else {
            updated.due_date = new Date(now.getTime() + 86400000 * 3).toISOString();
          }
          break;
        case 'time':
          updated.time_of_day = quadrantId as TimeOfDay;
          break;
      }
      
      return updated;
    }));

    toast({ 
      title: "Task updated", 
      description: "Task has been moved" 
    });
    setDraggedTask(null);
  };

  const handleTaskUpdate = (updatedTask: QuadrantTask) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    setDetailTask(updatedTask);
  };

  const handleSubtaskToggle = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subtasks: t.subtasks.map(st => 
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        ),
      };
    }));
  };

  // Filter tasks by search
  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 px-2">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground mt-1">
            Organize your tasks by focus and see what truly matters today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewSwitcher view={view} onViewChange={setView} />
          <Button onClick={() => openDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Quadrant Toolbar */}
      <QuadrantToolbar
        mode={quadrantMode}
        onModeChange={setQuadrantMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNewTask={() => openDialog()}
      />

      {/* Summary Strip */}
      <SummaryStrip tasks={filteredTasks} />

      {view === 'quadrant' && (
        <>
          {/* Insights Panel */}
          <TasksInsights tasks={filteredTasks} />

          {/* Main Content - Dual Pane with Quadrant as Hero */}
          <div className="flex-1 flex gap-4 min-h-0">
            {/* Left - Task Inbox (Narrower) */}
            <div className="w-[300px] flex-shrink-0">
              <TaskInbox
                tasks={filteredTasks}
                onQuickAdd={handleQuickAdd}
                onTaskClick={setDetailTask}
                onDragStart={handleDragStart}
              />
            </div>

            {/* Right - Quadrant Grid (Hero - Takes most space) */}
            <div className="flex-1 pb-8">
              <QuadrantGrid
                mode={quadrantMode}
                tasks={filteredTasks}
                onTaskClick={setDetailTask}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              />
            </div>
          </div>
        </>
      )}

      {view === 'board' && (
        <>
          {/* Insights Panel */}
          <TasksInsights tasks={filteredTasks} />

          {/* Board View */}
          <div className="flex-1 min-h-0">
            <BoardView
              mode={quadrantMode}
              tasks={filteredTasks}
              onTaskClick={setDetailTask}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onQuickAdd={handleBoardQuickAdd}
            />
          </div>
        </>
      )}

      {/* Task Detail Drawer */}
      {detailTask && (
        <TaskDetailDrawer
          task={detailTask}
          onClose={() => setDetailTask(null)}
          onUpdate={handleTaskUpdate}
          onSubtaskToggle={handleSubtaskToggle}
        />
      )}

      {/* New Task Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
            <Button onClick={saveTask} disabled={saving || !title.trim()} className="w-full">
              {saving ? "Saving..." : selectedTask ? "Update Task" : "Create Task"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
