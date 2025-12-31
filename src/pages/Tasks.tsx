import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

import { TasksHeader } from "@/components/tasks/TasksHeader";
import { SummaryStrip } from "@/components/tasks/SummaryStrip";
import { InsightsPanel } from "@/components/tasks/InsightsPanel";
import { TopFocusBar } from "@/components/tasks/TopFocusBar";
import { AllTasksList } from "@/components/tasks/AllTasksList";
import { QuadrantGrid } from "@/components/tasks/QuadrantGrid";
import { BoardView } from "@/components/tasks/BoardView";
import { LargeClockWidget } from "@/components/tasks/LargeClockWidget";
import { UnifiedTaskDrawer } from "@/components/tasks/UnifiedTaskDrawer";
import { DeepFocusPrompt } from "@/components/tasks/DeepFocusPrompt";
import PremiumDeepFocus from "@/pages/PremiumDeepFocus";
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

// Sample data
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
    tags: ["Launch"],
    subtasks: [
      { id: "1", title: "Confirm final designs", completed: true },
      { id: "2", title: "Sync with engineering", completed: false },
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
    id: 'sample-4',
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
    id: 'sample-5',
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
    id: 'sample-6',
    title: "Explore automation tools",
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
];

export default function Tasks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { taskId } = useParams();
  
  const isFocusMode = location.pathname.includes('/focus/');
  
  const [view, setView] = useState<'board' | 'quadrant'>('quadrant');
  const [quadrantMode, setQuadrantMode] = useState<QuadrantMode>('urgent-important');
  const [searchQuery, setSearchQuery] = useState("");
  
  const [tasks, setTasks] = useState<QuadrantTask[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<QuadrantTask | null>(null);
  const [isNewTask, setIsNewTask] = useState(false);
  
  // Deep Focus prompt state
  const [focusPromptOpen, setFocusPromptOpen] = useState(false);
  const [focusPromptTask, setFocusPromptTask] = useState<QuadrantTask | null>(null);

  useEffect(() => {
    if (!user) {
      setTasks(SAMPLE_TASKS);
      setLoading(false);
      return;
    }
    fetchTasks();
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prev => prev.map(t => ({
        ...t,
        status: computeTaskStatus(t),
      })));
    }, 60000);
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
      
      setTasks(quadrantTasks.length === 0 ? SAMPLE_TASKS : quadrantTasks);
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
      started_at: task.started_at || new Date().toISOString(),
      status: 'ongoing',
    };
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    setSelectedTask(updated);
    toast({ title: "Started!", description: "Task moved to Ongoing" });
    
    // Show Deep Focus prompt
    setFocusPromptTask(updated);
    setFocusPromptOpen(true);
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
    if (!task.started_at) {
      const updated: QuadrantTask = {
        ...task,
        started_at: new Date().toISOString(),
        status: 'ongoing',
      };
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    }
    setDrawerOpen(false);
    setFocusPromptOpen(false);
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

  if (isFocusMode) {
    return (
      <PremiumDeepFocus
        tasks={tasks}
        onUpdateTask={async (updated) => {
          setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
          // Persist to database
          if (user) {
            await supabase.from("tasks").update({
              is_completed: updated.is_completed,
              completed_at: updated.completed_at,
            }).eq("id", updated.id).eq("user_id", user.id);
          }
        }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 py-2 overflow-x-hidden bg-background w-full flex-1">
      {/* Header - Remove timer widget from here */}
      <TasksHeader
        view={view}
        onViewChange={setView}
        quadrantMode={quadrantMode}
        onQuadrantModeChange={setQuadrantMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNewTask={openNewTaskDrawer}
      />

      {/* Summary Strip */}
      <SummaryStrip tasks={filteredTasks} />

      {/* Clock Widget Row - Larger */}
      <div className="w-full">
        <LargeClockWidget />
      </div>

      {/* Insights Panel Row - Below Clock */}
      <InsightsPanel tasks={filteredTasks} />

      {/* Top Focus Bar */}
      <TopFocusBar tasks={filteredTasks} onStartFocus={handleStartFocus} />

      {/* Task Views - Full Width */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-4 min-h-0">
        {/* All Tasks List */}
        <div className="min-h-0 overflow-y-auto">
          <AllTasksList
            tasks={filteredTasks}
            onTaskClick={openTaskDetail}
            onStartTask={handleStartTask}
            onCompleteTask={handleCompleteTask}
          />
        </div>

        {/* Quadrant/Board View - Full remaining width */}
        <div className="min-h-0 overflow-auto w-full">
          {view === 'quadrant' && (
            <QuadrantGrid
              mode={quadrantMode}
              tasks={filteredTasks}
              onTaskClick={openTaskDetail}
              onStartTask={handleStartTask}
              onCompleteTask={handleCompleteTask}
            />
          )}

          {view === 'board' && (
            <BoardView
              mode="status"
              tasks={filteredTasks}
              onTaskClick={openTaskDetail}
              onDragStart={() => {}}
              onDrop={handleBoardDrop}
              onQuickAdd={handleBoardQuickAdd}
              onStartTask={handleStartTask}
              onCompleteTask={handleCompleteTask}
            />
          )}
        </div>
      </div>

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

      {/* Deep Focus Prompt */}
      <DeepFocusPrompt
        open={focusPromptOpen}
        task={focusPromptTask}
        onClose={() => setFocusPromptOpen(false)}
        onStartFocus={() => focusPromptTask && handleStartFocus(focusPromptTask)}
        onSkip={() => setFocusPromptOpen(false)}
      />
    </div>
  );
}