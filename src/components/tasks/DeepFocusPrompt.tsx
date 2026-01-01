import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Pause, Play, RotateCcw, CheckCircle2, ListChecks, StickyNote, BarChart3 } from "lucide-react";

import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

import type { QuadrantTask } from "@/components/tasks/types";

type FocusMode = "pomodoro" | "countdown" | "stopwatch";
type PomodoroPhase = "focus" | "break";

const POMODORO_FOCUS_MIN = 25;
const POMODORO_BREAK_MIN = 5;

const COUNTDOWN_PRESETS = [10, 15, 25, 45, 60];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatMMSS(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${pad2(m)}:${pad2(s)}`;
}

function Ring({
  progress,
  size = 220,
  stroke = 10,
}: {
  progress: number; // 0..1
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(1, Math.max(0, progress)));

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="hsl(var(--border))"
        strokeWidth={stroke}
        fill="none"
        opacity="0.35"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="hsl(var(--primary))"
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

export default function PremiumDeepFocus({
  tasks,
  onUpdateTask,
}: {
  tasks: QuadrantTask[];
  onUpdateTask: (updated: QuadrantTask) => Promise<void> | void;
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const task = useMemo(() => tasks.find((t) => t.id === id) || null, [tasks, id]);

  // ---- Modes
  const [mode, setMode] = useState<FocusMode>("pomodoro");
  const [phase, setPhase] = useState<PomodoroPhase>("focus");

  // countdown duration (minutes)
  const [countdownMin, setCountdownMin] = useState<number>(25);

  // timer state
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(POMODORO_FOCUS_MIN * 60); // used for pomodoro + countdown
  const [stopwatchSec, setStopwatchSec] = useState(0); // used for stopwatch

  const startedAtRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  // ---- Local UI state for subtasks/notes
  const [newSubtask, setNewSubtask] = useState("");
  const [notes, setNotes] = useState("");

  // init notes when task loads
  useEffect(() => {
    setNotes(task?.description || "");
  }, [task?.id]);

  // when mode changes, reset timer to correct baseline (without starting)
  useEffect(() => {
    setRunning(false);
    startedAtRef.current = null;

    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = null;

    if (mode === "pomodoro") {
      setPhase("focus");
      setSecondsLeft(POMODORO_FOCUS_MIN * 60);
    } else if (mode === "countdown") {
      setSecondsLeft(countdownMin * 60);
    } else {
      setStopwatchSec(0);
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // when countdownMin changes while in countdown mode (and not running), update secondsLeft
  useEffect(() => {
    if (mode !== "countdown") return;
    if (running) return;
    setSecondsLeft(countdownMin * 60);
  }, [countdownMin, mode, running]);

  // ticking
  useEffect(() => {
    if (!running) return;

    intervalRef.current = window.setInterval(() => {
      if (mode === "stopwatch") {
        setStopwatchSec((s) => s + 1);
        return;
      }

      setSecondsLeft((s) => {
        const next = s - 1;
        if (next <= 0) return 0;
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [running, mode]);

  // when timer hits zero for pomodoro/countdown
  useEffect(() => {
    if (!running) return;
    if (mode === "stopwatch") return;
    if (secondsLeft > 0) return;

    setRunning(false);
    startedAtRef.current = null;

    // commit focus minutes
    const minutes = mode === "pomodoro" ? (phase === "focus" ? POMODORO_FOCUS_MIN : POMODORO_BREAK_MIN) : countdownMin;

    void commitFocus(minutes, mode === "pomodoro" && phase === "break" ? "Break finished" : "Session finished");

    // auto switch pomodoro phase
    if (mode === "pomodoro") {
      if (phase === "focus") {
        setPhase("break");
        setSecondsLeft(POMODORO_BREAK_MIN * 60);
      } else {
        setPhase("focus");
        setSecondsLeft(POMODORO_FOCUS_MIN * 60);
      }
    } else {
      // countdown resets to same duration
      setSecondsLeft(countdownMin * 60);
    }
  }, [secondsLeft, running, mode, phase, countdownMin]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!task) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-muted-foreground">
          Task not found.{" "}
          <button className="underline" onClick={() => navigate("/tasks")}>
            Go back
          </button>
        </div>
      </div>
    );
  }

  async function commitFocus(minutes: number, title = "Focus saved") {
    const updated: QuadrantTask = {
      ...task,
      total_focus_minutes: (task.total_focus_minutes || 0) + minutes,
      started_at: task.started_at || new Date().toISOString(),
    };

    await onUpdateTask(updated);

    toast({
      title,
      description: `+${minutes} min added to "${task.title}"`,
    });
  }

  async function saveNotes() {
    const updated: QuadrantTask = { ...task, description: notes };
    await onUpdateTask(updated);
    toast({ title: "Saved", description: "Notes updated" });
  }

  async function toggleSubtask(subId: string) {
    const subtasks = (task.subtasks || []).map((s) => (s.id === subId ? { ...s, completed: !s.completed } : s));
    const updated: QuadrantTask = { ...task, subtasks };
    await onUpdateTask(updated);
  }

  async function addSubtask() {
    const title = newSubtask.trim();
    if (!title) return;

    const subtasks = [
      ...(task.subtasks || []),
      { id: Math.random().toString(36).slice(2, 9), title, completed: false },
    ];
    const updated: QuadrantTask = { ...task, subtasks };
    await onUpdateTask(updated);
    setNewSubtask("");
  }

  async function markDone() {
    const updated: QuadrantTask = {
      ...task,
      is_completed: true,
      completed_at: new Date().toISOString(),
    };
    await onUpdateTask(updated);
    toast({ title: "Done!", description: "Task marked completed" });
    navigate("/tasks");
  }

  const durationSeconds = useMemo(() => {
    if (mode === "pomodoro") return (phase === "focus" ? POMODORO_FOCUS_MIN : POMODORO_BREAK_MIN) * 60;
    if (mode === "countdown") return countdownMin * 60;
    return Math.max(1, stopwatchSec);
  }, [mode, phase, countdownMin, stopwatchSec]);

  const progress = useMemo(() => {
    if (mode === "stopwatch") return 0.25; // subtle static ring for stopwatch
    return 1 - secondsLeft / durationSeconds;
  }, [mode, secondsLeft, durationSeconds]);

  const endTimeLabel = useMemo(() => {
    if (!running) return "";
    if (mode === "stopwatch") return "";
    const ends = new Date(Date.now() + secondsLeft * 1000);
    return `Ends at ${format(ends, "h:mm a")}`;
  }, [running, mode, secondsLeft]);

  const completedSubtasks = (task.subtasks || []).filter((s) => s.completed).length;
  const totalSubtasks = (task.subtasks || []).length;
  const subtaskProgress = totalSubtasks ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const mainTime = mode === "stopwatch" ? formatMMSS(stopwatchSec) : formatMMSS(secondsLeft);

  const modeLabel =
    mode === "pomodoro"
      ? phase === "focus"
        ? "Pomodoro · Focus"
        : "Pomodoro · Break"
      : mode === "countdown"
        ? "Countdown"
        : "Stopwatch";

  function onStartPause() {
    setRunning((v) => !v);
  }

  function onReset() {
    setRunning(false);
    startedAtRef.current = null;

    if (mode === "pomodoro") {
      setPhase("focus");
      setSecondsLeft(POMODORO_FOCUS_MIN * 60);
    } else if (mode === "countdown") {
      setSecondsLeft(countdownMin * 60);
    } else {
      setStopwatchSec(0);
    }
  }

  async function onFinishSession() {
    setRunning(false);

    if (mode === "stopwatch") {
      const minutes = Math.max(1, Math.round(stopwatchSec / 60));
      await commitFocus(minutes, "Stopwatch saved");
      setStopwatchSec(0);
      return;
    }

    const minutes = mode === "pomodoro" ? (phase === "focus" ? POMODORO_FOCUS_MIN : POMODORO_BREAK_MIN) : countdownMin;
    await commitFocus(minutes, "Session saved");
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* Premium background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/30" />
      <div className="absolute inset-0 [background:radial-gradient(900px_500px_at_30%_10%,rgba(0,0,0,0.10),transparent_60%)]" />
      <div className="absolute inset-0 [background:radial-gradient(900px_500px_at_70%_30%,rgba(0,0,0,0.08),transparent_55%)]" />

      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-4 md:px-6 py-6">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <Button variant="ghost" className="gap-2" onClick={() => navigate("/tasks")}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>

          <div className="min-w-0 text-right">
            <div className="text-[12px] uppercase tracking-[0.14em] text-muted-foreground">{modeLabel}</div>
            <div className="text-[16px] font-semibold text-foreground truncate">{task.title}</div>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-4">
          {/* LEFT: Timer */}
          <Card className="rounded-3xl border border-border/40 bg-card/55 backdrop-blur-md shadow-sm">
            <CardContent className="p-5 md:p-6">
              {/* Mode switch */}
              <Tabs value={mode} onValueChange={(v) => setMode(v as FocusMode)}>
                <TabsList className="w-full grid grid-cols-3 rounded-2xl bg-muted/30 p-1">
                  <TabsTrigger value="pomodoro" className="rounded-xl">
                    Pomodoro
                  </TabsTrigger>
                  <TabsTrigger value="countdown" className="rounded-xl">
                    Countdown
                  </TabsTrigger>
                  <TabsTrigger value="stopwatch" className="rounded-xl">
                    Stopwatch
                  </TabsTrigger>
                </TabsList>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {task.urgency === "high" && (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                        Urgent
                      </Badge>
                    )}
                    {task.importance === "high" && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                        Important
                      </Badge>
                    )}
                    {!!task.due_date && (
                      <Badge variant="outline">
                        {format(new Date(task.due_date), "MMM d")}
                        {task.due_time ? ` • ${task.due_time}` : ""}
                      </Badge>
                    )}
                  </div>

                  {mode === "countdown" && (
                    <div className="flex items-center gap-2">
                      {COUNTDOWN_PRESETS.map((m) => (
                        <button
                          key={m}
                          type="button"
                          className={cn(
                            "h-8 px-3 rounded-xl text-[12px] border border-border/40 bg-background/60 hover:bg-background/80 transition",
                            countdownMin === m && "border-primary/40 bg-primary/10 text-foreground",
                          )}
                          onClick={() => setCountdownMin(m)}
                          disabled={running}
                          title={running ? "Pause to change" : ""}
                        >
                          {m}m
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Timer face */}
                <div className="mt-6 flex items-center justify-center">
                  <div className="relative flex items-center justify-center">
                    <Ring progress={progress} />

                    <div className="absolute text-center">
                      <div className="text-[56px] md:text-[64px] font-semibold tracking-tight text-foreground leading-none">
                        {mainTime}
                      </div>
                      <div className="mt-2 text-[12px] text-muted-foreground">
                        {endTimeLabel || (mode === "stopwatch" ? "Track your focus time" : "Ready when you are")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="mt-6 flex items-center justify-center gap-2">
                  <Button onClick={onStartPause} className="h-11 rounded-2xl px-6">
                    {running ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                    {running ? "Pause" : "Start"}
                  </Button>

                  <Button variant="outline" onClick={onReset} className="h-11 rounded-2xl px-4">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>

                  <Button variant="outline" onClick={onFinishSession} className="h-11 rounded-2xl px-4">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Save
                  </Button>

                  <Button variant="secondary" onClick={markDone} className="h-11 rounded-2xl px-4">
                    Mark Done
                  </Button>
                </div>

                {/* Pomodoro hint */}
                {mode === "pomodoro" && (
                  <div className="mt-4 flex items-center justify-center text-[12px] text-muted-foreground">
                    Focus {POMODORO_FOCUS_MIN}m • Break {POMODORO_BREAK_MIN}m • Auto-switches
                  </div>
                )}
              </Tabs>
            </CardContent>
          </Card>

          {/* RIGHT: Panel */}
          <Card className="rounded-3xl border border-border/40 bg-card/55 backdrop-blur-md shadow-sm">
            <CardContent className="p-5 md:p-6">
              <Tabs defaultValue="subtasks">
                <TabsList className="w-full grid grid-cols-3 rounded-2xl bg-muted/30 p-1">
                  <TabsTrigger value="subtasks" className="rounded-xl gap-2">
                    <ListChecks className="h-4 w-4" /> Subtasks
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="rounded-xl gap-2">
                    <StickyNote className="h-4 w-4" /> Notes
                  </TabsTrigger>
                  <TabsTrigger value="stats" className="rounded-xl gap-2">
                    <BarChart3 className="h-4 w-4" /> Stats
                  </TabsTrigger>
                </TabsList>

                {/* Subtasks */}
                <TabsContent value="subtasks" className="mt-4">
                  <div className="text-[12px] uppercase tracking-[0.14em] text-muted-foreground mb-3">
                    Now: {running ? "In session" : "Ready"}
                  </div>

                  <div className="space-y-2">
                    {(task.subtasks || []).map((s) => (
                      <button
                        key={s.id}
                        onClick={() => toggleSubtask(s.id)}
                        className={cn(
                          "w-full flex items-center justify-between gap-3 rounded-2xl border border-border/40 bg-background/60 px-4 py-3 text-left transition hover:bg-background/80",
                          s.completed && "opacity-80",
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={cn(
                              "h-4 w-4 rounded border border-border/60",
                              s.completed && "bg-primary border-primary",
                            )}
                          />
                          <span className={cn("text-[14px] text-foreground truncate", s.completed && "line-through")}>
                            {s.title}
                          </span>
                        </div>
                        {s.completed && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Input
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      placeholder="Add subtask and press Enter"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addSubtask();
                      }}
                      className="rounded-2xl"
                    />
                    <Button onClick={addSubtask} className="rounded-2xl px-5">
                      Add
                    </Button>
                  </div>

                  <div className="mt-5">
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                      <span>Progress</span>
                      <span>{subtaskProgress}%</span>
                    </div>
                    <Progress value={subtaskProgress} />
                    <div className="mt-2 text-[12px] text-muted-foreground">
                      {completedSubtasks} of {totalSubtasks} completed
                    </div>
                  </div>
                </TabsContent>

                {/* Notes */}
                <TabsContent value="notes" className="mt-4">
                  <div className="text-[12px] uppercase tracking-[0.14em] text-muted-foreground mb-3">Notes</div>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Write your notes, plan, or key points here..."
                    className="min-h-[240px] rounded-2xl"
                  />
                  <div className="mt-3 flex justify-end">
                    <Button onClick={saveNotes} className="rounded-2xl px-6">
                      Save Notes
                    </Button>
                  </div>
                </TabsContent>

                {/* Stats */}
                <TabsContent value="stats" className="mt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="rounded-2xl border border-border/40 bg-background/60">
                      <CardContent className="p-4">
                        <div className="text-[12px] text-muted-foreground">Total Focus</div>
                        <div className="text-[28px] font-semibold text-foreground">
                          {task.total_focus_minutes || 0}m
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl border border-border/40 bg-background/60">
                      <CardContent className="p-4">
                        <div className="text-[12px] text-muted-foreground">Subtasks</div>
                        <div className="text-[28px] font-semibold text-foreground">
                          {completedSubtasks}/{totalSubtasks}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="mt-4 rounded-2xl border border-border/40 bg-background/60 p-4">
                    <div className="text-[12px] text-muted-foreground">Today</div>
                    <div className="mt-1 text-[14px] text-foreground">Keep it simple: one session at a time.</div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
