import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

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
import { TasksClockWidget } from "@/components/tasks/TasksClockWidget";
import { UnifiedTaskDrawer } from "@/components/tasks/UnifiedTaskDrawer";
import { DeepFocusPrompt } from "@/components/tasks/DeepFocusPromptModal";
import { PageHero, PAGE_HERO_TEXT } from "@/components/common/PageHero";
import { PageLoadingScreen } from "@/components/common/PageLoadingScreen";

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
  suggestTimeOfDay,
  computeDateBucket,
} from "@/components/tasks/types";

// Sample data
const SAMPLE_TASKS: QuadrantTask[] = [
  {
    id: "sample-1",
    title: "Prepare launch checklist",
    description: "Complete all pre-launch requirements",
    due_date: new Date().toISOString(),
    due_time: "14:00",
    end_time: "15:00",
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
    id: "sample-2",
    title: "Q3 report analysis",
    description: "Analyze quarterly performance metrics",
    due_date: new Date(Date.now() - 86400000).toISOString(),
    due_time: "09:00",
    end_time: null,
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
    id: "sample-3",
    title: "Review marketing assets",
    description: "Review and approve marketing materials",
    due_date: new Date().toISOString(),
    due_time: "10:00",
    end_time: "10:30",
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
    id: "sample-4",
    title: "Draft Q4 objectives",
    description: "Plan next quarter goals",
    due_date: new Date(Date.now() + 86400000 * 3).toISOString(),
    due_time: "21:00",
    end_time: null,
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
    id: "sample-5",
    title: "Weekly team sync prep",
    description: "Prepare agenda for team meeting",
    due_date: new Date(Date.now() + 86400000).toISOString(),
    due_time: "09:00",
    end_time: "09:30",
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
    id: "sample-6",
    title: "Explore automation tools",
    description: "Research automation options",
    due_date: new Date(Date.now() + 86400000 * 5).toISOString(),
    due_time: null,
    end_time: null,
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

  const [view, setView] = useState<"board" | "quadrant">("board");
  const [quadrantMode, setQuadrantMode] = useState<QuadrantMode>("urgent-important");
  const [searchQuery, setSearchQuery] = useState("");

  const [tasks, setTasks] = useState<QuadrantTask[]>([]);
  const [loading, setLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<QuadrantTask | null>(null);
  const [isNewTask, setIsNewTask] = useState(false);

  const [focusPromptOpen, setFocusPromptOpen] = useState(false);
  const [focusPromptTask, setFocusPromptTask] = useState<QuadrantTask | null>(null);

  // ✅ NEW: collapse left panel
  const [allTasksCollapsed, setAllTasksCollapsed] = useState(false);

  useEffect(() => {
    if (!user) {
      setTasks(SAMPLE_TASKS);
      setLoading(false);
      return;
    }
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTasks((prev) =>
        prev.map((t) => ({
          ...t,
          status: computeTaskStatus(t),
        })),
      );
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
      const quadrantTasks: QuadrantTask[] = data.map((t: any) => {
        const dueTime = t.due_time || null;
        const task: QuadrantTask = {
          id: t.id,
          title: t.title,
          description: t.description,
          due_date: t.due_date,
          due_time: dueTime,
          end_time: t.end_time || null,
          priority: t.priority || "medium",
          is_completed: t.is_completed || false,
          completed_at: t.completed_at,
          created_at: t.created_at,
          started_at: t.started_at || null,
          reminder_at: t.reminder_at || null,
          alarm_enabled: t.alarm_enabled || false,
          total_focus_minutes: t.total_focus_minutes || 0,
          urgency: (t.urgency || "low") as Urgency,
          importance: (t.importance || "low") as Importance,
          status: "upcoming" as Status,
          time_of_day: (t.time_of_day || suggestTimeOfDay(dueTime)) as TimeOfDay,
          date_bucket: computeDateBucket(t.due_date) as DateBucket,
          tags: t.tags || [],
          subtasks: (t.subtasks as any[]) || [],
          quadrant_assigned: !!(t.urgency || t.importance),
        };
        task.status = computeTaskStatus(task);
        return task;
      });

      // Don't use sample data for logged-in users - show empty state
      setTasks(quadrantTasks);
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

  const handleSaveTask = async (task: QuadrantTask) => {
    task.status = computeTaskStatus(task);

    // Update local state immediately for responsiveness
    if (isNewTask) {
      setTasks((prev) => [task, ...prev]);
    } else {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    }

    // Sync to Supabase if user is logged in
    if (user) {
      const { error } = await supabase.from("tasks").upsert({
        id: task.id,
        user_id: user.id,
        title: task.title,
        description: task.description || null,
        due_date: task.due_date || null,
        due_time: task.due_time || null,
        priority: task.priority,
        urgency: task.urgency,
        importance: task.importance,
        time_of_day: task.time_of_day,
        is_completed: task.is_completed,
        completed_at: task.completed_at || null,
        started_at: task.started_at || null,
        reminder_at: task.reminder_at || null,
        alarm_enabled: task.alarm_enabled,
        subtasks: task.subtasks as any,
        tags: task.tags,
        total_focus_minutes: task.total_focus_minutes,
      } as any);

      if (error) {
        toast({ title: "Sync failed", description: error.message, variant: "destructive" });
        return;
      }
    }

    toast({
      title: isNewTask ? "Created!" : "Updated!",
      description: isNewTask ? "Your task has been created" : "Task has been updated",
    });
    setDrawerOpen(false);
  };

  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setDrawerOpen(false);

    if (user) {
      await supabase.from("tasks").delete().eq("id", id).eq("user_id", user.id);
    }

    toast({ title: "Deleted", description: "Task has been removed" });
  };

  const handleStartTask = async (task: QuadrantTask) => {
    const updated: QuadrantTask = {
      ...task,
      started_at: task.started_at || new Date().toISOString(),
      status: "ongoing",
    };

    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    setSelectedTask(updated);

    // Sync started status to Supabase
    if (user) {
      await supabase
        .from("tasks")
        .update({
          is_completed: false,
          completed_at: null,
          started_at: updated.started_at,
        } as any)
        .eq("id", task.id)
        .eq("user_id", user.id);
    }

    toast({ title: "Started!", description: "Task moved to Ongoing" });

    setFocusPromptTask(updated);
    setFocusPromptOpen(true);
  };

  const handleCompleteTask = async (task: QuadrantTask) => {
    const completedAt = new Date().toISOString();
    const updated: QuadrantTask = {
      ...task,
      is_completed: true,
      completed_at: completedAt,
      status: "completed",
    };

    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    setDrawerOpen(false);

    // Sync completion to Supabase
    if (user) {
      await supabase
        .from("tasks")
        .update({
          is_completed: true,
          completed_at: completedAt,
        })
        .eq("id", task.id)
        .eq("user_id", user.id);

      // SYNC: If this is a habit-linked task, also mark the habit as complete
      if (task.tags?.includes("Habit") && task.due_date) {
        // Find the habit by matching the task title
        const { data: habits } = await supabase
          .from("habits")
          .select("id, name")
          .eq("user_id", user.id)
          .eq("name", task.title);

        if (habits && habits.length > 0) {
          const habitId = habits[0].id;
          const completedDate = task.due_date.split("T")[0]; // Format: yyyy-MM-dd

          // Check if already marked complete
          const { data: existing } = await supabase
            .from("habit_completions")
            .select("id")
            .eq("habit_id", habitId)
            .eq("completed_date", completedDate);

          // Only insert if not already complete
          if (!existing || existing.length === 0) {
            await supabase.from("habit_completions").insert({
              habit_id: habitId,
              user_id: user.id,
              completed_date: completedDate,
            });
          }
        }
      }
    }

    toast({ title: "Completed!", description: "Task marked as done" });
  };

  const handleStartFocus = (task: QuadrantTask) => {
    if (!task.started_at) {
      const updated: QuadrantTask = {
        ...task,
        started_at: new Date().toISOString(),
        status: "ongoing",
      };
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    }

    setDrawerOpen(false);
    setFocusPromptOpen(false);
    navigate(`/tasks/focus/${task.id}`);
  };

  const handleBoardQuickAdd = async (title: string, columnId: string) => {
    const newTask = createDefaultTask({
      title,
      status: columnId as Status,
      started_at: columnId === "ongoing" ? new Date().toISOString() : null,
      is_completed: columnId === "completed",
      completed_at: columnId === "completed" ? new Date().toISOString() : null,
      quadrant_assigned: true,
    });

    setTasks((prev) => [newTask, ...prev]);

    // Sync to Supabase
    if (user) {
      await supabase.from("tasks").insert({
        id: newTask.id,
        user_id: user.id,
        title: newTask.title,
        description: newTask.description || null,
        due_date: newTask.due_date || null,
        due_time: newTask.due_time || null,
        priority: newTask.priority,
        urgency: newTask.urgency,
        importance: newTask.importance,
        time_of_day: newTask.time_of_day,
        is_completed: newTask.is_completed,
        completed_at: newTask.completed_at || null,
        started_at: newTask.started_at || null,
        tags: newTask.tags,
        subtasks: newTask.subtasks as any,
      } as any);
    }

    toast({ title: "Task added" });
  };

  const handleBoardDrop = async (columnId: string, task: QuadrantTask) => {
    const updated: QuadrantTask = { ...task };

    if (columnId === "ongoing") {
      updated.started_at = updated.started_at || new Date().toISOString();
      updated.is_completed = false;
      updated.completed_at = null;
    } else if (columnId === "completed") {
      updated.is_completed = true;
      updated.completed_at = new Date().toISOString();
    } else if (columnId === "upcoming") {
      updated.started_at = null;
      updated.is_completed = false;
      updated.completed_at = null;
    }

    updated.status = computeTaskStatus(updated);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));

    // Sync to Supabase
    if (user) {
      await supabase
        .from("tasks")
        .update({
          is_completed: updated.is_completed,
          completed_at: updated.completed_at,
          started_at: updated.started_at,
        } as any)
        .eq("id", task.id)
        .eq("user_id", user.id);
    }

    toast({ title: "Task updated" });
  };

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((t) => t.title.toLowerCase().includes(q));
  }, [tasks, searchQuery]);

  const [contentReady, setContentReady] = useState(false);

  useEffect(() => {
    if (!loading) {
      // Slight delay for smooth transition from loading screen
      const timer = setTimeout(() => setContentReady(true), 100);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading) {
    return <PageLoadingScreen module="tasks" />;
  }

  const gridCols = allTasksCollapsed
    ? "xl:grid-cols-[72px_minmax(0,1fr)]"
    : "xl:grid-cols-[minmax(300px,340px)_minmax(0,1fr)]";

  return (
    <div
      className={cn(
        "h-full w-full flex flex-col bg-background overflow-x-hidden",
        "transition-all duration-500 ease-out",
        contentReady ? "opacity-100" : "opacity-0",
      )}
    >
      {/* Hero */}
      <PageHero
        storageKey="tasks_hero_src"
        typeKey="tasks_hero_type"
        badge={PAGE_HERO_TEXT.tasks.badge}
        title={PAGE_HERO_TEXT.tasks.title}
        subtitle={PAGE_HERO_TEXT.tasks.subtitle}
      />

      <div className="w-full flex-1 min-h-0 px-6 lg:px-8 pt-6">
        <div className="w-full min-w-0 flex flex-col gap-6 min-h-0">
          <TasksHeader
            view={view}
            onViewChange={setView}
            quadrantMode={quadrantMode}
            onQuadrantModeChange={setQuadrantMode}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onNewTask={openNewTaskDrawer}
          />

          <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_280px] gap-6 items-stretch">
            <div className="flex flex-col gap-4">
              <TopFocusBar tasks={filteredTasks} onStartFocus={handleStartFocus} />
              <InsightsPanel tasks={filteredTasks} compactMode />
            </div>
            <div className="h-[280px]">
              <TasksClockWidget />
            </div>
          </div>

          <div className={`flex-1 grid grid-cols-1 ${gridCols} gap-8 min-h-0 min-w-0`}>
            {/* Left */}
            <div className="min-h-0 min-w-0">
              <AllTasksList
                tasks={filteredTasks}
                onTaskClick={openTaskDetail}
                onStartTask={handleStartTask}
                onCompleteTask={handleCompleteTask}
                onDeleteTask={(task) => handleDeleteTask(task.id)}
                collapsed={allTasksCollapsed}
                onToggleCollapse={() => setAllTasksCollapsed((v) => !v)}
              />
            </div>

            {/* Right */}
            <div className="min-h-0 overflow-auto w-full min-w-0">
              {view === "quadrant" && (
                <QuadrantGrid
                  mode={quadrantMode}
                  tasks={filteredTasks}
                  onTaskClick={openTaskDetail}
                  onStartTask={handleStartTask}
                  onCompleteTask={handleCompleteTask}
                />
              )}

              {view === "board" && (
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

          <DeepFocusPrompt
            open={focusPromptOpen}
            task={focusPromptTask}
            onClose={() => setFocusPromptOpen(false)}
            onStartFocus={() => focusPromptTask && handleStartFocus(focusPromptTask)}
            onSkip={() => setFocusPromptOpen(false)}
          />
        </div>
      </div>
    </div>
  );
}
