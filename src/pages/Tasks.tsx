import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

import { ViewSwitcher } from "@/components/tasks/ViewSwitcher";
import { QuadrantToolbar } from "@/components/tasks/QuadrantToolbar";
import { QuadrantGrid } from "@/components/tasks/QuadrantGrid";
import { BoardView } from "@/components/tasks/BoardView";
import { SummaryStrip } from "@/components/tasks/SummaryStrip";
import { TasksInsights } from "@/components/tasks/TasksInsights";
import { UnifiedTaskDrawer } from "@/components/tasks/UnifiedTaskDrawer";
import DeepFocus from "@/pages/DeepFocus";
import { 
  QuadrantTask, 
  QuadrantMode, 
  Urgency, 
  Importance, 
  Status, 
  TimeOfDay, 
  DateBucket,
  computeTaskStatus,
  createDefaultTask,
} from "@/components/tasks/types";

// Sample data for demo - all tasks have required fields
const SAMPLE_TASKS: QuadrantTask[] = [
  {
    id: 'sample-1',
    title: "Prepare launch checklist",
    description: "Complete all pre-launch requirements",
    due_date: new Date().toISOString(),
    due_time: "14:00",
    priority: "high",
    is_completed: false,
    completed_at: null,
    created_at: new Date().toISOString(),
    started_at: new Date().toISOString(),
    reminder_at: null,
    alarm_enabled: false,
    total_focus_minutes: 45,
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
    id: 'sample-2',
    title: "Q3 report analysis",
    description: "Analyze quarterly performance metrics",
    due_date: new Date(Date.now() - 86400000).toISOString(),
    due_time: "09:00",
    priority: "high",
    is_completed: false,
    completed_at: null,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    started_at: null,
    reminder_at: null,
    alarm_enabled: false,
    total_focus_minutes: 0,
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
    id: 'sample-3',
    title: "Respond to client feedback",
    description: "Address client concerns",
    due_date: new Date(Date.now() - 86400000).toISOString(),
    due_time: "18:00",
    priority: "high",
    is_completed: false,
    completed_at: null,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    started_at: null,
    reminder_at: null,
    alarm_enabled: false,
    total_focus_minutes: 0,
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
    id: 'sample-4',
    title: "Review marketing assets",
    description: "Review and approve marketing materials",
    due_date: new Date().toISOString(),
    due_time: "10:00",
    priority: "medium",
    is_completed: false,
    completed_at: null,
    created_at: new Date().toISOString(),
    started_at: new Date().toISOString(),
    reminder_at: null,
    alarm_enabled: false,
    total_focus_minutes: 15,
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
    id: 'sample-5',
    title: "Reply to Slack messages",
    description: "Clear Slack backlog",
    due_date: new Date().toISOString(),
    due_time: "17:00",
    priority: "low",
    is_completed: false,
    completed_at: null,
    created_at: new Date().toISOString(),
    started_at: null,
    reminder_at: null,
    alarm_enabled: false,
    total_focus_minutes: 0,
    urgency: "high",
    importance: "low",
    status: "upcoming",
    time_of_day: "evening",
    date_bucket: "today",
    tags: ["Communication"],
    subtasks: [],
    quadrant_assigned: true,
  },
  {
    id: 'sample-6',
    title: "Draft Q4 objectives",
    description: "Plan next quarter goals",
    due_date: new Date(Date.now() + 86400000 * 3).toISOString(),
    due_time: "21:00",
    priority: "medium",
    is_completed: false,
    completed_at: null,
    created_at: new Date().toISOString(),
    started_at: null,
    reminder_at: null,
    alarm_enabled: false,
    total_focus_minutes: 0,
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
    id: 'sample-7',
    title: "Weekly team sync prep",
    description: "Prepare agenda for team meeting",
    due_date: new Date(Date.now() + 86400000).toISOString(),
    due_time: "09:00",
    priority: "medium",
    is_completed: false,
    completed_at: null,
    created_at: new Date().toISOString(),
    started_at: null,
    reminder_at: null,
    alarm_enabled: false,
    total_focus_minutes: 0,
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
    id: 'sample-8',
    title: "Explore new automation tools",
    description: "Research automation options",
    due_date: new Date(Date.now() + 86400000 * 5).toISOString(),
    due_time: null,
    priority: "low",
    is_completed: false,
    completed_at: null,
    created_at: new Date().toISOString(),
    started_at: null,
    reminder_at: null,
    alarm_enabled: false,
    total_focus_minutes: 0,
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
    id: 'sample-9',
    title: "Organize inspiration board",
    description: "Curate design inspiration",
    due_date: null,
    due_time: null,
    priority: "low",
    is_completed: false,
    completed_at: null,
    created_at: new Date().toISOString(),
    started_at: null,
    reminder_at: null,
    alarm_enabled: false,
    total_focus_minutes: 0,
    urgency: "low",
    importance: "low",
    status: "upcoming",
    time_of_day: "night",
    date_bucket: "week",
    tags: ["Design"],
    subtasks: [],
    quadrant_assigned: true,
  },
];

export default function Tasks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { taskId } = useParams();
  
  // Check if we're in focus mode
  const isFocusMode = location.pathname.includes('/focus/');
  
  // View state
  const [view, setView] = useState<'board' | 'quadrant'>('quadrant');
  const [quadrantMode, setQuadrantMode] = useState<QuadrantMode>('urgent-important');
  const [searchQuery, setSearchQuery] = useState("");
  
  // Task state
  const [tasks, setTasks] = useState<QuadrantTask[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<QuadrantTask | null>(null);
  const [isNewTask, setIsNewTask] = useState(false);

  useEffect(() => {
    if (!user) {
      // Load sample data for demo
      setTasks(SAMPLE_TASKS);
      setLoading(false);
      return;
    }
    fetchTasks();
  }, [user]);

  // Recompute status for all tasks periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prev => prev.map(t => ({
        ...t,
        status: computeTaskStatus(t),
      })));
    }, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);

  const fetchTasks = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const quadrantTasks: QuadrantTask[] = data.map(t => {
        const task: QuadrantTask = {
          ...t,
          due_time: null,
          started_at: null,
          reminder_at: null,
          alarm_enabled: false,
          total_focus_minutes: 0,
          urgency: t.priority === 'high' ? 'high' : 'low' as Urgency,
          importance: t.priority === 'high' ? 'high' : 'low' as Importance,
          status: 'upcoming' as Status,
          time_of_day: 'morning' as TimeOfDay,
          date_bucket: 'today' as DateBucket,
          tags: [],
          subtasks: [],
          quadrant_assigned: true,
        };
        task.status = computeTaskStatus(task);
        return task;
      });
      
      if (quadrantTasks.length === 0) {
        setTasks(SAMPLE_TASKS);
      } else {
        setTasks(quadrantTasks);
      }
    }
    setLoading(false);
  };

  const openNewTaskDrawer = () => {
    setSelectedTask(null);
    setIsNewTask(true);
    setDrawerOpen(true);
  };

  const openTaskDetail = (task: QuadrantTask) => {
    setSelectedTask(task);
    setIsNewTask(false);
    setDrawerOpen(true);
  };

  const handleSaveTask = (task: QuadrantTask) => {
    // Compute status
    task.status = computeTaskStatus(task);
    
    if (isNewTask) {
      setTasks(prev => [task, ...prev]);
      toast({ title: "Created!", description: "Your task has been created" });
    } else {
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
      toast({ title: "Updated!", description: "Task has been updated" });
    }
    setDrawerOpen(false);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setDrawerOpen(false);
    toast({ title: "Deleted", description: "Task has been removed" });
  };

  const handleStartTask = (task: QuadrantTask) => {
    const updated: QuadrantTask = {
      ...task,
      started_at: new Date().toISOString(),
      status: 'ongoing',
    };
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    setSelectedTask(updated);
    toast({ title: "Started!", description: "Task moved to Ongoing" });
  };

  const handleCompleteTask = (task: QuadrantTask) => {
    const updated: QuadrantTask = {
      ...task,
      is_completed: true,
      completed_at: new Date().toISOString(),
      status: 'completed',
    };
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    setDrawerOpen(false);
    toast({ title: "Completed!", description: "Task marked as done" });
  };

  const handleStartFocus = (task: QuadrantTask) => {
    // Start the task if not started
    if (!task.started_at) {
      const updated: QuadrantTask = {
        ...task,
        started_at: new Date().toISOString(),
        status: 'ongoing',
      };
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    }
    setDrawerOpen(false);
    navigate(`/tasks/focus/${task.id}`);
  };

  const handleBoardQuickAdd = (title: string, columnId: string) => {
    const newTask = createDefaultTask({
      title,
      status: columnId as Status,
      started_at: columnId === 'ongoing' ? new Date().toISOString() : null,
      is_completed: columnId === 'completed',
      completed_at: columnId === 'completed' ? new Date().toISOString() : null,
      quadrant_assigned: true,
    });
    setTasks(prev => [newTask, ...prev]);
    toast({ title: "Task added" });
  };

  const handleBoardDrop = (columnId: string, task: QuadrantTask) => {
    const updated: QuadrantTask = { ...task };
    
    // Update based on column
    if (columnId === 'ongoing') {
      updated.started_at = updated.started_at || new Date().toISOString();
      updated.is_completed = false;
      updated.completed_at = null;
    } else if (columnId === 'completed') {
      updated.is_completed = true;
      updated.completed_at = new Date().toISOString();
    } else if (columnId === 'upcoming') {
      updated.started_at = null;
      updated.is_completed = false;
      updated.completed_at = null;
    }
    
    updated.status = computeTaskStatus(updated);
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    toast({ title: "Task updated" });
  };

  const handleQuadrantDrop = (quadrantId: string, task: QuadrantTask) => {
    const updated: QuadrantTask = { ...task, quadrant_assigned: true };
    
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
        if (quadrantId === 'ongoing') updated.started_at = updated.started_at || new Date().toISOString();
        if (quadrantId === 'completed') {
          updated.is_completed = true;
          updated.completed_at = new Date().toISOString();
        }
        break;
      case 'date':
        updated.date_bucket = quadrantId as DateBucket;
        const now = new Date();
        if (quadrantId === 'yesterday') updated.due_date = new Date(now.getTime() - 86400000).toISOString();
        else if (quadrantId === 'today') updated.due_date = now.toISOString();
        else if (quadrantId === 'tomorrow') updated.due_date = new Date(now.getTime() + 86400000).toISOString();
        else updated.due_date = new Date(now.getTime() + 86400000 * 3).toISOString();
        break;
      case 'time':
        updated.time_of_day = quadrantId as TimeOfDay;
        break;
    }
    
    updated.status = computeTaskStatus(updated);
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    toast({ title: "Task updated" });
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

  // If in focus mode, render the Deep Focus component
  if (isFocusMode) {
    return (
      <DeepFocus
        tasks={tasks}
        onUpdateTask={(updated) => {
          setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
        }}
      />
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
          <Button onClick={openNewTaskDrawer}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Quadrant Toolbar (without Priority/Assignee) */}
      <QuadrantToolbar
        mode={quadrantMode}
        onModeChange={setQuadrantMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Summary Strip */}
      <SummaryStrip tasks={filteredTasks} />

      {/* Insights Panel */}
      <TasksInsights tasks={filteredTasks} />

      {view === 'quadrant' && (
        <div className="flex-1 pb-8">
          <QuadrantGrid
            mode={quadrantMode}
            tasks={filteredTasks}
            onTaskClick={openTaskDetail}
            onDrop={(quadrantId) => {}}
            onDragOver={(e) => e.preventDefault()}
          />
        </div>
      )}

      {view === 'board' && (
        <div className="flex-1 min-h-0">
          <BoardView
            mode="status"
            tasks={filteredTasks}
            onTaskClick={openTaskDetail}
            onDragStart={() => {}}
            onDrop={(columnId) => {}}
            onQuickAdd={handleBoardQuickAdd}
            onStartTask={handleStartTask}
            onCompleteTask={handleCompleteTask}
          />
        </div>
      )}

      {/* Unified Task Drawer */}
      <UnifiedTaskDrawer
        task={selectedTask}
        isNew={isNewTask}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        onStartFocus={handleStartFocus}
        onStartTask={handleStartTask}
        onCompleteTask={handleCompleteTask}
      />
    </div>
  );
}
