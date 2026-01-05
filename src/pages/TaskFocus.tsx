import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Pause, RotateCcw, Check, Clock } from "lucide-react";
import { QuadrantTask, Subtask } from "@/components/tasks/types";

const TIMER_PRESETS = [
  { label: "25 min", minutes: 25 },
  { label: "50 min", minutes: 50 },
  { label: "90 min", minutes: 90 },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function TaskFocus() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [task, setTask] = useState<QuadrantTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Timer state
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionMinutes, setSessionMinutes] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Fetch task from database
  useEffect(() => {
    async function fetchTask() {
      if (!taskId) {
        setError("No task ID provided");
        setLoading(false);
        return;
      }

      if (!user) {
        setError("Please log in to access focus mode");
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", taskId)
        .eq("user_id", user.id)
        .single();

      if (fetchError || !data) {
        setError("Task not found");
        setLoading(false);
        return;
      }

      const fetchedTask: QuadrantTask = {
        id: data.id,
        title: data.title,
        description: data.description,
        due_date: data.due_date,
        due_time: data.due_time,
        priority: data.priority || "medium",
        is_completed: data.is_completed || false,
        completed_at: data.completed_at,
        created_at: data.created_at,
        started_at: data.started_at,
        reminder_at: data.reminder_at,
        alarm_enabled: data.alarm_enabled || false,
        total_focus_minutes: data.total_focus_minutes || 0,
        urgency: (data.urgency || "low") as "low" | "high",
        importance: (data.importance || "low") as "low" | "high",
        status: "ongoing",
        time_of_day: (data.time_of_day || "morning") as "morning" | "afternoon" | "evening" | "night",
        date_bucket: "today",
        tags: data.tags || [],
        subtasks: (data.subtasks as unknown as Subtask[]) || [],
        quadrant_assigned: true,
      };

      setTask(fetchedTask);
      setLoading(false);
    }

    fetchTask();
  }, [taskId, user]);

  // Timer logic
  useEffect(() => {
    if (isRunning && secondsRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            // Calculate session time
            if (startTimeRef.current) {
              const elapsed = Math.floor((Date.now() - startTimeRef.current) / 60000);
              setSessionMinutes((prev) => prev + elapsed);
              startTimeRef.current = null;
            }
            toast({ title: "Timer complete!", description: "Great focus session!" });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, secondsRemaining, toast]);

  const handleStart = () => {
    if (!isRunning) {
      startTimeRef.current = Date.now();
      setIsRunning(true);
    }
  };

  const handlePause = () => {
    if (isRunning) {
      setIsRunning(false);
      if (startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 60000);
        setSessionMinutes((prev) => prev + elapsed);
        startTimeRef.current = null;
      }
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsRemaining(timerMinutes * 60);
    startTimeRef.current = null;
  };

  const handlePresetChange = (minutes: number) => {
    setTimerMinutes(minutes);
    setSecondsRemaining(minutes * 60);
    setIsRunning(false);
    startTimeRef.current = null;
  };

  const handleSaveSession = async () => {
    if (!task || !user) return;

    const totalMinutes = task.total_focus_minutes + sessionMinutes;

    const { error: updateError } = await supabase
      .from("tasks")
      .update({ total_focus_minutes: totalMinutes })
      .eq("id", task.id)
      .eq("user_id", user.id);

    if (updateError) {
      toast({ title: "Error saving session", variant: "destructive" });
      return;
    }

    toast({ title: "Session saved!", description: `Added ${sessionMinutes} minutes of focus time` });
    navigate("/tasks");
  };

  const handleMarkComplete = async () => {
    if (!task || !user) return;

    const { error: updateError } = await supabase
      .from("tasks")
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
        total_focus_minutes: task.total_focus_minutes + sessionMinutes,
      })
      .eq("id", task.id)
      .eq("user_id", user.id);

    if (updateError) {
      toast({ title: "Error completing task", variant: "destructive" });
      return;
    }

    toast({ title: "Task completed!", description: "Great work!" });
    navigate("/tasks");
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading focus mode...</div>
      </div>
    );
  }

  // Error state
  if (error || !task) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">{error || "Task not found"}</p>
          <Button variant="outline" onClick={() => navigate("/tasks")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tasks
          </Button>
        </div>
      </div>
    );
  }

  const progress = ((timerMinutes * 60 - secondsRemaining) / (timerMinutes * 60)) * 100;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/tasks")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Deep Focus</p>
            <h1 className="text-lg font-medium">{task.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{task.total_focus_minutes + sessionMinutes} min focused</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Timer presets */}
        <div className="flex gap-2 mb-8">
          {TIMER_PRESETS.map((preset) => (
            <Button
              key={preset.minutes}
              variant={timerMinutes === preset.minutes ? "default" : "outline"}
              size="sm"
              onClick={() => handlePresetChange(preset.minutes)}
              disabled={isRunning}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        {/* Timer display */}
        <div className="relative w-64 h-64 mb-8">
          {/* Progress ring */}
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="120"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="8"
              strokeDasharray={2 * Math.PI * 120}
              strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          {/* Time display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-light tracking-wider">
              {formatTime(secondsRemaining)}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-4 mb-8">
          {!isRunning ? (
            <Button size="lg" onClick={handleStart}>
              <Play className="w-5 h-5 mr-2" />
              Start
            </Button>
          ) : (
            <Button size="lg" variant="outline" onClick={handlePause}>
              <Pause className="w-5 h-5 mr-2" />
              Pause
            </Button>
          )}
          <Button size="lg" variant="ghost" onClick={handleReset}>
            <RotateCcw className="w-5 h-5 mr-2" />
            Reset
          </Button>
        </div>

        {/* Session info */}
        {sessionMinutes > 0 && (
          <p className="text-sm text-muted-foreground mb-8">
            This session: {sessionMinutes} min
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button variant="outline" onClick={handleSaveSession}>
            Save & Exit
          </Button>
          <Button onClick={handleMarkComplete}>
            <Check className="w-4 h-4 mr-2" />
            Mark Complete
          </Button>
        </div>
      </main>
    </div>
  );
}
