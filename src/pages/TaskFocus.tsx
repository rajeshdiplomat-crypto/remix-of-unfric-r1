import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { ArrowLeft, Play, Pause, RotateCcw, Check, Clock, Timer, Sparkles, Maximize2, Minimize2 } from "lucide-react";

import { format } from "date-fns";
import { QuadrantTask, Subtask } from "@/components/tasks/types";

const TIMER_PRESETS = [
  { label: "25 min", minutes: 25 },
  { label: "50 min", minutes: 50 },
  { label: "90 min", minutes: 90 },
] as const;

type TimerMode = "countdown" | "stopwatch" | "pomodoro";
type PomodoroPhase = "focus" | "break";

const POMODORO = {
  focusMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  roundsPerSet: 4,
} as const;

function formatMMSS(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
}

function getGreeting(d: Date) {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function TaskFocus() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [task, setTask] = useState<QuadrantTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI
  const [clearMode, setClearMode] = useState(false);

  // Clock/Greeting
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Timer Modes
  const [mode, setMode] = useState<TimerMode>("countdown");

  // Countdown & Pomodoro share secondsRemaining
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);

  // Stopwatch
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);

  // Pomodoro state
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>("focus");
  const [pomodoroRound, setPomodoroRound] = useState(1);

  // Running + session tracking
  const [isRunning, setIsRunning] = useState(false);
  const [focusedSeconds, setFocusedSeconds] = useState(0);

  const sessionMinutes = useMemo(() => Math.floor(focusedSeconds / 60), [focusedSeconds]);

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

  // Main ticking interval (single interval, stable)
  useEffect(() => {
    if (!isRunning) return;

    const id = setInterval(() => {
      // Stopwatch
      if (mode === "stopwatch") {
        setStopwatchSeconds((s) => s + 1);
        setFocusedSeconds((s) => s + 1);
        return;
      }

      // Countdown or Pomodoro
      setSecondsRemaining((prev) => {
        const next = prev - 1;

        // count focus time only when appropriate
        const shouldCountFocus = mode === "countdown" || (mode === "pomodoro" && pomodoroPhase === "focus");
        if (shouldCountFocus) setFocusedSeconds((s) => s + 1);

        if (next > 0) return next;

        // Reached 0
        if (mode === "countdown") {
          setIsRunning(false);
          toast({ title: "Timer complete!", description: "Great focus session." });
          return 0;
        }

        // Pomodoro phase switch (auto-continues)
        if (pomodoroPhase === "focus") {
          const isLongBreak = pomodoroRound >= POMODORO.roundsPerSet;
          const breakMin = isLongBreak ? POMODORO.longBreakMin : POMODORO.shortBreakMin;

          setPomodoroPhase("break");
          toast({
            title: "Focus complete",
            description: isLongBreak ? "Long break time." : "Short break time.",
          });

          return breakMin * 60;
        } else {
          // break -> focus
          const nextRound = pomodoroRound >= POMODORO.roundsPerSet ? 1 : pomodoroRound + 1;
          setPomodoroRound(nextRound);
          setPomodoroPhase("focus");
          toast({ title: "Back to focus", description: "Let’s continue." });
          return POMODORO.focusMin * 60;
        }
      });
    }, 1000);

    return () => clearInterval(id);
  }, [isRunning, mode, pomodoroPhase, pomodoroRound, toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement | null)?.isContentEditable) return;

      if (e.code === "Space") {
        e.preventDefault();
        setIsRunning((r) => !r);
        return;
      }

      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        handleReset();
        return;
      }

      if (mode === "countdown" && !isRunning) {
        if (e.key === "1") handlePresetChange(25);
        if (e.key === "2") handlePresetChange(50);
        if (e.key === "3") handlePresetChange(90);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, isRunning, timerMinutes]);

  const handleStart = () => {
    if (!isRunning) setIsRunning(true);
  };

  const handlePause = () => {
    if (isRunning) setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);

    if (mode === "stopwatch") {
      setStopwatchSeconds(0);
      return;
    }

    if (mode === "pomodoro") {
      setPomodoroPhase("focus");
      setPomodoroRound(1);
      setSecondsRemaining(POMODORO.focusMin * 60);
      return;
    }

    // countdown
    setSecondsRemaining(timerMinutes * 60);
  };

  const handlePresetChange = (minutes: number) => {
    if (isRunning) return;
    setMode("countdown");
    setTimerMinutes(minutes);
    setSecondsRemaining(minutes * 60);
    setPomodoroPhase("focus");
    setPomodoroRound(1);
    setStopwatchSeconds(0);
  };

  const applyMode = (nextMode: TimerMode) => {
    if (isRunning) return;
    setIsRunning(false);
    setMode(nextMode);

    if (nextMode === "stopwatch") {
      setStopwatchSeconds(0);
      return;
    }

    if (nextMode === "pomodoro") {
      setPomodoroPhase("focus");
      setPomodoroRound(1);
      setSecondsRemaining(POMODORO.focusMin * 60);
      return;
    }

    // countdown
    setTimerMinutes(25);
    setSecondsRemaining(25 * 60);
    setPomodoroPhase("focus");
    setPomodoroRound(1);
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
      description: sessionMinutes > 0 ? `Added ${sessionMinutes} min of focus time` : "Saved. Nice work.",
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

  const totalFocusedLabel = `${task.total_focus_minutes + sessionMinutes} min focused`;
  const dueLabel = task.due_date
    ? `${format(new Date(task.due_date), "MMM d")}${task.due_time ? ` • ${task.due_time}` : ""}`
    : null;

  const timerTitle =
    mode === "pomodoro"
      ? pomodoroPhase === "focus"
        ? `Pomodoro • Focus (${pomodoroRound}/${POMODORO.roundsPerSet})`
        : `Pomodoro • Break (${pomodoroRound}/${POMODORO.roundsPerSet})`
      : mode === "stopwatch"
        ? "Stopwatch"
        : "Countdown";

  const displayTime = mode === "stopwatch" ? formatMMSS(stopwatchSeconds) : formatMMSS(secondsRemaining);

  const progress = useMemo(() => {
    if (mode === "stopwatch") return 0;

    const total =
      mode === "pomodoro"
        ? pomodoroPhase === "focus"
          ? POMODORO.focusMin * 60
          : (pomodoroRound >= POMODORO.roundsPerSet ? POMODORO.longBreakMin : POMODORO.shortBreakMin) * 60
        : timerMinutes * 60;

    if (total <= 0) return 0;
    const elapsed = Math.max(0, total - secondsRemaining);
    return (elapsed / total) * 100;
  }, [mode, pomodoroPhase, pomodoroRound, secondsRemaining, timerMinutes]);

  const circumference = 2 * Math.PI * 120;
  const dashOffset = circumference * (1 - Math.min(100, Math.max(0, progress)) / 100);

  return (
    <div className="min-h-[100dvh] bg-background relative overflow-hidden">
      {/* Soft, theme-safe backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-background to-muted/30" />

      <div className="relative mx-auto w-full max-w-6xl px-4 md:px-6 py-5">
        {/* Header */}
        {!clearMode && (
          <header className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Button variant="ghost" size="icon" onClick={() => navigate("/tasks")} className="rounded-xl">
                <ArrowLeft className="w-5 h-5" />
              </Button>

              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  Deep Focus
                </p>
                <h1 className="text-lg font-medium truncate">{task.title}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{format(now, "h:mm a")}</span>
              </div>

              <Button variant="outline" onClick={() => setClearMode(true)} className="rounded-xl">
                <Maximize2 className="w-4 h-4 mr-2" />
                Clear mode
              </Button>
            </div>
          </header>
        )}

        {/* Main */}
        <main className={clearMode ? "grid place-items-center" : "grid gap-6 items-start lg:grid-cols-[1.25fr_0.75fr]"}>
          {/* Left: Timer */}
          <section className={clearMode ? "w-full max-w-xl" : ""}>
            <Card className="rounded-2xl border-border bg-card/95 shadow-sm">
              <CardContent className="p-6 md:p-8">
                {clearMode && (
                  <div className="mb-5 flex items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/tasks")} className="rounded-xl">
                      <ArrowLeft className="w-5 h-5" />
                    </Button>

                    <div className="text-center">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        {getGreeting(now)}
                      </p>
                      <p className="text-sm text-muted-foreground">{format(now, "h:mm a")}</p>
                    </div>

                    <Button variant="outline" onClick={() => setClearMode(false)} className="rounded-xl">
                      <Minimize2 className="w-4 h-4 mr-2" />
                      Exit
                    </Button>
                  </div>
                )}

                {/* Mode switch */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-2">
                      <Timer className="h-3.5 w-3.5" />
                      {timerTitle}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {mode === "pomodoro"
                        ? "Work in focused intervals with breaks."
                        : mode === "stopwatch"
                          ? "Open-ended deep work session."
                          : "Set a duration and stay in the zone."}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 rounded-2xl border border-border bg-muted/30 p-1">
                    <Button
                      variant={mode === "countdown" ? "secondary" : "ghost"}
                      size="sm"
                      className="rounded-xl text-xs"
                      onClick={() => applyMode("countdown")}
                      disabled={isRunning}
                    >
                      Countdown
                    </Button>
                    <Button
                      variant={mode === "stopwatch" ? "secondary" : "ghost"}
                      size="sm"
                      className="rounded-xl text-xs"
                      onClick={() => applyMode("stopwatch")}
                      disabled={isRunning}
                    >
                      Stopwatch
                    </Button>
                    <Button
                      variant={mode === "pomodoro" ? "secondary" : "ghost"}
                      size="sm"
                      className="rounded-xl text-xs"
                      onClick={() => applyMode("pomodoro")}
                      disabled={isRunning}
                    >
                      Pomodoro
                    </Button>
                  </div>
                </div>

                {/* Presets (countdown only) */}
                {mode === "countdown" && (
                  <div className="flex flex-wrap gap-2 mb-7">
                    {TIMER_PRESETS.map((preset) => (
                      <Button
                        key={preset.minutes}
                        variant={timerMinutes === preset.minutes ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePresetChange(preset.minutes)}
                        disabled={isRunning}
                        className="rounded-xl"
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Timer display */}
                <div className="flex items-center justify-center">
                  <div className="relative w-72 h-72 md:w-80 md:h-80">
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        cx="50%"
                        cy="50%"
                        r="120"
                        fill="none"
                        stroke="hsl(var(--muted))"
                        strokeWidth="10"
                        opacity={0.55}
                      />
                      {mode !== "stopwatch" && (
                        <circle
                          cx="50%"
                          cy="50%"
                          r="120"
                          fill="none"
                          stroke="hsl(var(--primary))"
                          strokeWidth="10"
                          strokeDasharray={circumference}
                          strokeDashoffset={dashOffset}
                          strokeLinecap="round"
                          className="motion-safe:transition-[stroke-dashoffset] motion-safe:duration-500"
                        />
                      )}
                    </svg>

                    <div className="absolute inset-0 grid place-items-center text-center">
                      {mode === "pomodoro" && (
                        <div className="mb-3 flex items-center justify-center gap-2">
                          <Badge variant="outline" className="rounded-full">
                            {pomodoroPhase === "focus" ? "Focus" : "Break"}
                          </Badge>
                          <Badge variant="outline" className="rounded-full">
                            Round {pomodoroRound}/{POMODORO.roundsPerSet}
                          </Badge>
                        </div>
                      )}

                      <div className="text-6xl font-light tracking-tight tabular-nums">{displayTime}</div>

                      <div className="mt-2 text-sm text-muted-foreground">
                        Session: {formatMMSS(focusedSeconds)} • Total: {totalFocusedLabel}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                  {!isRunning ? (
                    <Button size="lg" onClick={handleStart} className="rounded-2xl px-7">
                      <Play className="w-5 h-5 mr-2" />
                      Start
                    </Button>
                  ) : (
                    <Button size="lg" variant="outline" onClick={handlePause} className="rounded-2xl px-7">
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
                <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:justify-between">
                  <Button variant="outline" onClick={handleSaveSession} className="rounded-2xl">
                    Save & Exit
                  </Button>

                  <Button onClick={handleMarkComplete} className="rounded-2xl">
                    <Check className="w-4 h-4 mr-2" />
                    Mark Complete
                  </Button>
                </div>

                <div className="mt-5 text-xs text-muted-foreground text-center">
                  Shortcuts: <span className="font-medium">Space</span> start/pause •{" "}
                  <span className="font-medium">R</span> reset • <span className="font-medium">1/2/3</span> presets
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Right: Details panel */}
          {!clearMode && (
            <aside className="lg:sticky lg:top-6">
              <Card className="rounded-2xl border-border bg-card/95 shadow-sm">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{getGreeting(now)}</p>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <div className="text-sm text-muted-foreground">{format(now, "EEE, MMM d")}</div>
                      <div className="text-sm text-muted-foreground">{format(now, "h:mm a")}</div>
                    </div>
                  </div>

                  <div className="h-px bg-border my-5" />

                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {task.urgency === "high" && (
                        <Badge variant="outline" className="rounded-full">
                          Urgent
                        </Badge>
                      )}
                      {task.importance === "high" && (
                        <Badge variant="outline" className="rounded-full">
                          Important
                        </Badge>
                      )}
                      {!!dueLabel && (
                        <Badge variant="outline" className="rounded-full">
                          Due {dueLabel}
                        </Badge>
                      )}
                    </div>

                    {!!task.description && (
                      <div>
                        <p className="text-sm font-medium">Intent</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>
                      </div>
                    )}

                    {Array.isArray(task.tags) && task.tags.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Tags</p>
                        <div className="flex flex-wrap gap-2">
                          {task.tags.slice(0, 8).map((t) => (
                            <Badge key={t} variant="secondary" className="rounded-full">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="h-px bg-border my-5" />

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-border bg-muted/20 p-3">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">This session</p>
                        <p className="mt-1 text-lg font-medium tabular-nums">{formatMMSS(focusedSeconds)}</p>
                      </div>

                      <div className="rounded-2xl border border-border bg-muted/20 p-3">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Total focus</p>
                        <p className="mt-1 text-lg font-medium tabular-nums">
                          {task.total_focus_minutes + sessionMinutes}m
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-muted/10 p-4">
                      <p className="text-sm font-medium">Tip</p>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                        Keep one clear outcome in mind. If you get distracted, write it down and come back.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </aside>
          )}
        </main>
      </div>
    </div>
  );
}
