import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Check,
  Clock,
  Timer,
  Hourglass,
  ChevronUp,
  ChevronDown,
  ListChecks,
} from "lucide-react";
import { QuadrantTask, Subtask } from "@/components/tasks/types";

const TIMER_PRESETS = [
  { label: "25", minutes: 25 },
  { label: "50", minutes: 50 },
  { label: "90", minutes: 90 },
];

type FocusMode = "countdown" | "pomodoro" | "stopwatch";
type PomodoroPhase = "focus" | "break";

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
}

export default function TaskFocus() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [task, setTask] = useState<QuadrantTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Focus modes
  const [mode, setMode] = useState<FocusMode>("countdown");

  // Countdown
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);

  // Pomodoro
  const [pomoPhase, setPomoPhase] = useState<PomodoroPhase>("focus");
  const [pomoFocusMin, setPomoFocusMin] = useState(25);
  const [pomoBreakMin, setPomoBreakMin] = useState(5);
  const [pomoCycles, setPomoCycles] = useState(0);

  // Stopwatch
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Common running state
  const [isRunning, setIsRunning] = useState(false);

  // Session tracking
  const [sessionSeconds, setSessionSeconds] = useState(0);

  // Subtask saving state (small UX)
  const [savingSubtasks, setSavingSubtasks] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [now, setNow] = useState(() => new Date());

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

  // Live clock (nice premium touch)
  useEffect(() => {
    clockRef.current = setInterval(() => setNow(new Date()), 20_000);
    return () => {
      if (clockRef.current) clearInterval(clockRef.current);
    };
  }, []);

  // Timer tick
  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setSessionSeconds((s) => s + 1);

      if (mode === "stopwatch") {
        setSecondsElapsed((s) => s + 1);
        return;
      }

      // countdown / pomodoro
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // session done for this block
          setIsRunning(false);

          if (mode === "pomodoro") {
            if (pomoPhase === "focus") {
              toast({ title: "Focus block complete", description: "Take a short break." });
              setPomoPhase("break");
              return pomoBreakMin * 60;
            } else {
              toast({ title: "Break complete", description: "Back to focus." });
              setPomoPhase("focus");
              setPomoCycles((c) => c + 1);
              return pomoFocusMin * 60;
            }
          }

          toast({ title: "Timer complete!", description: "Great focus session!" });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode, toast, pomoPhase, pomoBreakMin, pomoFocusMin]);

  const sessionMinutes = useMemo(() => Math.floor(sessionSeconds / 60), [sessionSeconds]);

  const headerFocusMinutes = useMemo(() => {
    const base = task?.total_focus_minutes || 0;
    return base + sessionMinutes;
  }, [task?.total_focus_minutes, sessionMinutes]);

  const dueLabel = useMemo(() => {
    if (!task?.due_date) return "";
    const d = new Date(task.due_date);
    const date = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `${date}${task.due_time ? ` • ${task.due_time}` : ""}`;
  }, [task?.due_date, task?.due_time]);

  const displaySeconds = useMemo(() => {
    if (mode === "stopwatch") return secondsElapsed;
    return secondsRemaining;
  }, [mode, secondsElapsed, secondsRemaining]);

  const ringProgress = useMemo(() => {
    if (mode === "stopwatch") return 0;

    const total =
      mode === "pomodoro" ? (pomoPhase === "focus" ? pomoFocusMin * 60 : pomoBreakMin * 60) : timerMinutes * 60;

    if (total <= 0) return 0;
    const done = total - secondsRemaining;
    return Math.max(0, Math.min(100, (done / total) * 100));
  }, [mode, secondsRemaining, timerMinutes, pomoPhase, pomoFocusMin, pomoBreakMin]);

  const handleStart = () => {
    if (!isRunning) setIsRunning(true);
  };

  const handlePause = () => {
    if (isRunning) setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);

    if (mode === "stopwatch") {
      setSecondsElapsed(0);
    } else if (mode === "pomodoro") {
      setPomoPhase("focus");
      setSecondsRemaining(pomoFocusMin * 60);
      setPomoCycles(0);
    } else {
      setSecondsRemaining(timerMinutes * 60);
    }
  };

  const handlePresetChange = (minutes: number) => {
    // only impacts countdown for now
    setTimerMinutes(minutes);
    setSecondsRemaining(minutes * 60);
    setIsRunning(false);
  };

  const setModeSafe = (next: FocusMode) => {
    setIsRunning(false);

    // Reset display to something sensible for each mode
    if (next === "countdown") {
      setSecondsRemaining(timerMinutes * 60);
    }
    if (next === "pomodoro") {
      setPomoPhase("focus");
      setSecondsRemaining(pomoFocusMin * 60);
      setPomoCycles(0);
    }
    if (next === "stopwatch") {
      setSecondsElapsed(0);
    }

    setMode(next);
  };

  const persistSubtasks = async (updated: Subtask[]) => {
    if (!task || !user) return;
    setSavingSubtasks(true);

    // optimistic UI
    setTask({ ...task, subtasks: updated });

    const { error: updateError } = await supabase
      .from("tasks")
      .update({ subtasks: updated as any })
      .eq("id", task.id)
      .eq("user_id", user.id);

    setSavingSubtasks(false);

    if (updateError) {
      toast({ title: "Could not save subtasks", variant: "destructive" });
    }
  };

  const toggleSubtask = async (subId: string) => {
    if (!task) return;
    const updated = (task.subtasks || []).map((s) => (s.id === subId ? { ...s, completed: !s.completed } : s));
    await persistSubtasks(updated);
  };

  const moveSubtask = async (index: number, dir: -1 | 1) => {
    if (!task) return;
    const arr = [...(task.subtasks || [])];
    const next = index + dir;
    if (next < 0 || next >= arr.length) return;
    const temp = arr[index];
    arr[index] = arr[next];
    arr[next] = temp;
    await persistSubtasks(arr);
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

    toast({
      title: "Session saved!",
      description: sessionMinutes > 0 ? `Added ${sessionMinutes} minutes of focus time` : "Nothing to add yet.",
    });
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

  const circumference = 2 * Math.PI * 120;
  const dashOffset = circumference * (1 - ringProgress / 100);

  const greeting =
    now.getHours() < 12
      ? "Good morning"
      : now.getHours() < 17
        ? "Good afternoon"
        : now.getHours() < 21
          ? "Good evening"
          : "Good night";

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Premium background wash (theme-safe) */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-background via-background to-muted/20" />

      {/* Header */}
      <header className="relative z-10 border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate("/tasks")} className="rounded-2xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Deep Focus • {greeting}</p>
              <h1 className="text-base font-semibold truncate">{task.title}</h1>
              {dueLabel ? <p className="text-xs text-muted-foreground truncate">Due {dueLabel}</p> : null}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">{headerFocusMinutes} min focused</span>
            <span className="sm:hidden">{headerFocusMinutes}m</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 mx-auto max-w-6xl px-5 py-8">
        <div className="grid gap-6 lg:grid-cols-[1.25fr_.85fr] items-start">
          {/* LEFT — Timer */}
          <Card className="rounded-3xl border-border/70 bg-card/80 backdrop-blur shadow-sm">
            <div className="p-6 sm:p-7">
              {/* Mode Switch */}
              <div className="flex flex-wrap gap-2 items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full bg-muted/10 border-border">
                    {mode === "pomodoro" ? "Pomodoro" : mode === "stopwatch" ? "Stopwatch" : "Countdown"}
                  </Badge>
                  {mode === "pomodoro" && (
                    <Badge variant="outline" className="rounded-full bg-muted/10 border-border">
                      {pomoPhase === "focus" ? "Focus" : "Break"} • Cycles {pomoCycles}
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={mode === "countdown" ? "default" : "outline"}
                    size="sm"
                    className="rounded-2xl"
                    onClick={() => setModeSafe("countdown")}
                    disabled={isRunning}
                  >
                    <Hourglass className="h-4 w-4 mr-2" />
                    Countdown
                  </Button>
                  <Button
                    variant={mode === "pomodoro" ? "default" : "outline"}
                    size="sm"
                    className="rounded-2xl"
                    onClick={() => setModeSafe("pomodoro")}
                    disabled={isRunning}
                  >
                    <Timer className="h-4 w-4 mr-2" />
                    Pomodoro
                  </Button>
                  <Button
                    variant={mode === "stopwatch" ? "default" : "outline"}
                    size="sm"
                    className="rounded-2xl"
                    onClick={() => setModeSafe("stopwatch")}
                    disabled={isRunning}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Stopwatch
                  </Button>
                </div>
              </div>

              {/* Presets (Countdown only) */}
              {mode === "countdown" && (
                <div className="mt-5 flex gap-2 justify-center">
                  {TIMER_PRESETS.map((preset) => (
                    <Button
                      key={preset.minutes}
                      variant={timerMinutes === preset.minutes ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePresetChange(preset.minutes)}
                      disabled={isRunning}
                      className="rounded-2xl"
                    >
                      {preset.label} min
                    </Button>
                  ))}
                </div>
              )}

              {/* Pomodoro controls (simple, no extra UI libs) */}
              {mode === "pomodoro" && (
                <div className="mt-5 flex flex-wrap gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-2xl"
                    disabled={isRunning}
                    onClick={() => {
                      setPomoFocusMin(25);
                      setPomoBreakMin(5);
                      setSecondsRemaining(25 * 60);
                      setPomoPhase("focus");
                      setPomoCycles(0);
                    }}
                  >
                    25/5
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-2xl"
                    disabled={isRunning}
                    onClick={() => {
                      setPomoFocusMin(50);
                      setPomoBreakMin(10);
                      setSecondsRemaining(50 * 60);
                      setPomoPhase("focus");
                      setPomoCycles(0);
                    }}
                  >
                    50/10
                  </Button>
                </div>
              )}

              {/* Ring + Time */}
              <div className="mt-8 flex items-center justify-center">
                <div className="relative w-72 h-72">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="144"
                      cy="144"
                      r="120"
                      fill="none"
                      stroke="hsl(var(--muted))"
                      strokeWidth="10"
                      opacity={0.35}
                    />
                    {mode !== "stopwatch" && (
                      <circle
                        cx="144"
                        cy="144"
                        r="120"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="10"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="round"
                        className="transition-all duration-700"
                      />
                    )}
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <div className="text-6xl font-light tracking-wide text-foreground">
                      {formatTime(displaySeconds)}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {mode === "stopwatch"
                        ? "Elapsed"
                        : mode === "pomodoro"
                          ? pomoPhase === "focus"
                            ? "Focus block"
                            : "Break block"
                          : "Remaining"}
                    </div>

                    {sessionMinutes > 0 && (
                      <div className="mt-3 text-xs text-muted-foreground">
                        Session: <span className="text-foreground">{sessionMinutes} min</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="mt-8 flex flex-wrap gap-3 items-center justify-center">
                {!isRunning ? (
                  <Button size="lg" onClick={handleStart} className="rounded-2xl px-6">
                    <Play className="w-5 h-5 mr-2" />
                    Start
                  </Button>
                ) : (
                  <Button size="lg" variant="outline" onClick={handlePause} className="rounded-2xl px-6">
                    <Pause className="w-5 h-5 mr-2" />
                    Pause
                  </Button>
                )}

                <Button size="lg" variant="ghost" onClick={handleReset} className="rounded-2xl px-6">
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Reset
                </Button>
              </div>

              {/* Actions */}
              <div className="mt-8 flex flex-wrap gap-3 justify-center">
                <Button variant="outline" onClick={handleSaveSession} className="rounded-2xl px-6">
                  Save & Exit
                </Button>
                <Button onClick={handleMarkComplete} className="rounded-2xl px-6">
                  <Check className="w-4 h-4 mr-2" />
                  Mark Complete
                </Button>
              </div>
            </div>
          </Card>

          {/* RIGHT — Intention + subtasks */}
          <Card className="rounded-3xl border-border/70 bg-card/80 backdrop-blur shadow-sm">
            <div className="p-6 sm:p-7 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Intention</p>
                  <h2 className="mt-1 text-sm font-semibold">One thing. Done well.</h2>
                </div>

                <Badge variant="outline" className="rounded-full bg-muted/10 border-border">
                  <ListChecks className="h-3.5 w-3.5 mr-1" />
                  {task.subtasks?.length || 0}
                </Badge>
              </div>

              {task.description ? (
                <div className="rounded-2xl border border-border bg-muted/10 p-4">
                  <p className="text-sm text-foreground leading-relaxed">{task.description}</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-muted/10 p-4">
                  <p className="text-sm text-muted-foreground">Add a description to make this focus session clearer.</p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Subtasks</p>
                  {savingSubtasks ? <span className="text-xs text-muted-foreground">Saving…</span> : null}
                </div>

                <div className="space-y-2">
                  {(task.subtasks || []).length === 0 ? (
                    <div className="rounded-2xl border border-border bg-muted/10 p-4">
                      <p className="text-sm text-muted-foreground">
                        No subtasks yet — keep it simple, or add subtasks from the Tasks page.
                      </p>
                    </div>
                  ) : (
                    (task.subtasks || []).map((s, idx) => (
                      <div
                        key={s.id}
                        className="rounded-2xl border border-border bg-background/50 p-3 flex items-start gap-3"
                      >
                        <button
                          onClick={() => toggleSubtask(s.id)}
                          className="mt-0.5 h-5 w-5 rounded-md border border-border flex items-center justify-center"
                          aria-label={s.completed ? "Mark incomplete" : "Mark complete"}
                        >
                          {s.completed ? <Check className="h-4 w-4" /> : null}
                        </button>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm ${s.completed ? "line-through text-muted-foreground" : "text-foreground"}`}
                          >
                            {s.title}
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl"
                            onClick={() => moveSubtask(idx, -1)}
                            disabled={idx === 0}
                            aria-label="Move up"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl"
                            onClick={() => moveSubtask(idx, 1)}
                            disabled={idx === (task.subtasks?.length || 0) - 1}
                            aria-label="Move down"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
