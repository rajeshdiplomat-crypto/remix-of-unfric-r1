import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { AmbientClock } from "@/components/tasks/AmbientClock";
import { TimeToolsPanel } from "@/components/tasks/TimeToolsPanel";
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
import { AllTasksList } from "@/components/tasks/AllTasksList";
import { DeepFocusPrompt } from "@/components/tasks/DeepFocusPrompt";
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
      <DeepFocus
        tasks={tasks}
        onUpdateTask={(updated) => {
          setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
        }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 px-2 md:px-4 overflow-x-hidden">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Organize your tasks by focus and see what truly matters today.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <ViewSwitcher view={view} onViewChange={setView} />
          <Button onClick={openNewTaskDrawer} className="flex-1 md:flex-none">
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <QuadrantToolbar
        mode={quadrantMode}
        onModeChange={setQuadrantMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Summary Strip */}
      <SummaryStrip tasks={filteredTasks} />

      {/* Main Layout: Content + Ambient Right Column */}
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-y-auto">
          {/* Insights Panel */}
          <TasksInsights tasks={filteredTasks} />

          {/* Task Views - Left List + Right Quadrant/Board */}
          <div className="flex flex-col lg:flex-row gap-4 min-h-0">
            {/* Left - All Tasks List */}
            <div className="w-full lg:w-[320px] flex-shrink-0 order-2 lg:order-1">
              <AllTasksList
                tasks={filteredTasks}
                onTaskClick={openTaskDetail}
                onStartTask={handleStartTask}
                onCompleteTask={handleCompleteTask}
              />
            </div>

            {/* Right - Quadrant or Board */}
            <div className="flex-1 min-w-0 order-1 lg:order-2 overflow-x-auto">
              <div className="min-w-[900px] w-full">
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
          </div>
        </div>

        {/* Ambient Right Column - Clock & Tools */}
        <div className="hidden xl:flex flex-col w-[200px] flex-shrink-0">
          {/* Ambient Clock - Always visible, non-interactive */}
          <AmbientClock />
          
          {/* Time Tools - Collapsible */}
          <TimeToolsPanel />
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
