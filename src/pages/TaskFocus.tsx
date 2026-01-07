import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Check,
  Clock,
  Hourglass,
  Timer,
  Sparkles,
  Volume2,
  VolumeX,
  ArrowUp,
  ArrowDown,
  RefreshCcw,
} from "lucide-react";
import { QuadrantTask, Subtask } from "@/components/tasks/types";

type FocusMode = "countdown" | "pomodoro" | "stopwatch";
type PomodoroPhase = "focus" | "break";
type AmbientNoise = "off" | "white" | "pink" | "brown";

const COUNTDOWN_PRESETS = [
  { label: "25 min", minutes: 25 },
  { label: "50 min", minutes: 50 },
  { label: "90 min", minutes: 90 },
];

const POMODORO_PRESETS = [
  { label: "25/5", focus: 25, break: 5 },
  { label: "50/10", focus: 50, break: 10 },
  { label: "90/15", focus: 90, break: 15 },
];

const QUOTES = [
  "One thing. Done well.",
  "Start gently. Stay steady.",
  "Clarity over intensity.",
  "Small progress, repeated, becomes momentum.",
  "Focus is a form of self-respect.",
  "Do the next right thing.",
];

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function formatMMSS(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${pad2(m)}:${pad2(r)}`;
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

/**
 * Very lightweight noise generator (no external assets).
 * "Workable ambient sounds" without needing MP3 files.
 */
function createNoiseNode(ctx: AudioContext, type: AmbientNoise) {
  const bufferSize = 4096;
  const node = ctx.createScriptProcessor(bufferSize, 1, 1);

  // pink/brown helpers
  let b0 = 0,
    b1 = 0,
    b2 = 0,
    b3 = 0,
    b4 = 0,
    b5 = 0,
    b6 = 0;
  let lastOut = 0;

  node.onaudioprocess = (e) => {
    const out = e.outputBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;

      if (type === "white") {
        out[i] = white;
      } else if (type === "pink") {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        b6 = white * 0.115926;
        out[i] = pink * 0.11;
      } else if (type === "brown") {
        // brown = integrated white noise
        const brown = (lastOut + 0.02 * white) / 1.02;
        lastOut = brown;
        out[i] = brown * 3.5;
      } else {
        out[i] = 0;
      }
    }
  };

  return node;
}

export default function TaskFocus() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [task, setTask] = useState<QuadrantTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---- Focus session state
  const [mode, setMode] = useState<FocusMode>("countdown");

  // countdown
  const [countdownMinutes, setCountdownMinutes] = useState(25);
  const [countdownRemaining, setCountdownRemaining] = useState(25 * 60);

  // pomodoro
  const [pomoFocusMinutes, setPomoFocusMinutes] = useState(25);
  const [pomoBreakMinutes, setPomoBreakMinutes] = useState(5);
  const [pomoPhase, setPomoPhase] = useState<PomodoroPhase>("focus");
  const [pomoRemaining, setPomoRemaining] = useState(25 * 60);
  const [autoAdvance, setAutoAdvance] = useState<boolean>(() => {
    try {
      return localStorage.getItem("inbalance_focus_auto_advance") === "1";
    } catch {
      return true;
    }
  });

  // stopwatch
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);

  // running / accounting
  const [isRunning, setIsRunning] = useState(false);
  const [sessionFocusSeconds, setSessionFocusSeconds] = useState(0); // counts only focus time (not breaks)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- Intention / notes (local-only, per task)
  const [intention, setIntention] = useState("");
  const [sessionNote, setSessionNote] = useState("");

  // ---- Subtasks (editable)
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const subtaskSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- Quote
  const [quote, setQuote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  // ---- Ambient sound (noise)
  const [noise, setNoise] = useState<AmbientNoise>("off");
  const [volume, setVolume] = useState<number>(() => {
    try {
      const v = Number(localStorage.getItem("inbalance_focus_noise_volume"));
      return Number.isFinite(v) ? clamp01(v) : 0.18;
    } catch {
      return 0.18;
    }
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<ScriptProcessorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  // ---- Background (optional)
  const bg = useMemo(() => {
    try {
      const raw = localStorage.getItem("inbalance_focus_bg");
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { type?: "image" | "video"; url?: string; overlay?: number };
      if (!parsed?.url) return null;
      return {
        type: parsed.type ?? "image",
        url: parsed.url,
        overlay: typeof parsed.overlay === "number" ? clamp01(parsed.overlay) : 0.55,
      };
    } catch {
      return null;
    }
  }, []);

  // ---- Fetch task
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
      setSubtasks(fetchedTask.subtasks || []);

      // restore intention/note
      try {
        const key = `inbalance_focus_meta_${fetchedTask.id}`;
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw) as { intention?: string; note?: string };
          setIntention(parsed.intention ?? "");
          setSessionNote(parsed.note ?? "");
        }
      } catch {
        // ignore
      }

      setLoading(false);
    }

    fetchTask();
  }, [taskId, user]);

  // ---- Persist intention/note locally
  useEffect(() => {
    if (!task) return;
    try {
      const key = `inbalance_focus_meta_${task.id}`;
      localStorage.setItem(key, JSON.stringify({ intention, note: sessionNote }));
    } catch {
      // ignore
    }
  }, [task, intention, sessionNote]);

  // ---- Audio noise lifecycle
  useEffect(() => {
    // cleanup helper
    const stop = () => {
      try {
        noiseNodeRef.current?.disconnect();
        gainRef.current?.disconnect();
      } catch {}
      noiseNodeRef.current = null;
      gainRef.current = null;

      try {
        audioCtxRef.current?.close();
      } catch {}
      audioCtxRef.current = null;
    };

    if (noise === "off") {
      stop();
      return;
    }

    // start
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const gain = ctx.createGain();
      gain.gain.value = clamp01(volume) * 0.35; // keep it subtle / luxury
      const node = createNoiseNode(ctx, noise);

      node.connect(gain);
      gain.connect(ctx.destination);

      audioCtxRef.current = ctx;
      gainRef.current = gain;
      noiseNodeRef.current = node;
    } catch {
      toast({ title: "Audio not available", description: "Your browser blocked audio playback." });
      setNoise("off");
    }

    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noise]);

  useEffect(() => {
    try {
      localStorage.setItem("inbalance_focus_noise_volume", String(clamp01(volume)));
    } catch {}
    if (gainRef.current) {
      gainRef.current.gain.value = clamp01(volume) * 0.35;
    }
  }, [volume]);

  // ---- Timer engine (single interval)
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }

    intervalRef.current = setInterval(() => {
      // Stopwatch: count up (always counts as focus time)
      if (mode === "stopwatch") {
        setStopwatchSeconds((s) => s + 1);
        setSessionFocusSeconds((s) => s + 1);
        return;
      }

      // Countdown
      if (mode === "countdown") {
        setCountdownRemaining((prev) => {
          if (prev <= 1) {
            // stop
            setIsRunning(false);
            toast({ title: "Focus complete", description: "Clean finish. Save your session?" });
            return 0;
          }
          setSessionFocusSeconds((s) => s + 1);
          return prev - 1;
        });
        return;
      }

      // Pomodoro
      setPomoRemaining((prev) => {
        if (prev <= 1) {
          // phase transition
          if (pomoPhase === "focus") {
            toast({ title: "Focus block done", description: "Take a short break." });
            setPomoPhase("break");
            return pomoBreakMinutes * 60;
          } else {
            toast({ title: "Break done", description: "Back to focus." });
            setPomoPhase("focus");
            return pomoFocusMinutes * 60;
          }
        }

        if (pomoPhase === "focus") setSessionFocusSeconds((s) => s + 1);
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
    // we intentionally read pomoPhase/pomoFocusMinutes/pomoBreakMinutes live via state closures
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, mode, toast]);

  // ---- Auto-advance behavior for pomodoro (optional)
  useEffect(() => {
    if (mode !== "pomodoro") return;
    if (!autoAdvance && isRunning) {
      // if auto-advance is disabled, pause at phase boundaries.
      // We detect boundary when remaining resets exactly to a full phase length.
      const full = pomoPhase === "focus" ? pomoFocusMinutes * 60 : pomoBreakMinutes * 60;
      if (pomoRemaining === full) setIsRunning(false);
    }
  }, [autoAdvance, mode, isRunning, pomoRemaining, pomoPhase, pomoFocusMinutes, pomoBreakMinutes]);

  // ---- Derived values
  const focusedMinutesThisSession = useMemo(() => Math.floor(sessionFocusSeconds / 60), [sessionFocusSeconds]);

  const totalFocused = useMemo(() => {
    if (!task) return 0;
    return (task.total_focus_minutes || 0) + focusedMinutesThisSession;
  }, [task, focusedMinutesThisSession]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 5) return "Late night focus";
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    if (h < 21) return "Good evening";
    return "Good night";
  }, []);

  const primarySubtask = useMemo(() => {
    const open = subtasks?.filter((s) => !s.completed) ?? [];
    return open[0] ?? null;
  }, [subtasks]);

  const progress = useMemo(() => {
    if (mode === "stopwatch") return 0;
    if (mode === "countdown") {
      const total = countdownMinutes * 60;
      if (!total) return 0;
      return clamp01((total - countdownRemaining) / total);
    }
    // pomodoro
    const total = (pomoPhase === "focus" ? pomoFocusMinutes : pomoBreakMinutes) * 60;
    if (!total) return 0;
    return clamp01((total - pomoRemaining) / total);
  }, [mode, countdownMinutes, countdownRemaining, pomoPhase, pomoFocusMinutes, pomoBreakMinutes, pomoRemaining]);

  const timeLabel = useMemo(() => {
    if (mode === "stopwatch") return formatMMSS(stopwatchSeconds);
    if (mode === "countdown") return formatMMSS(countdownRemaining);
    return formatMMSS(pomoRemaining);
  }, [mode, stopwatchSeconds, countdownRemaining, pomoRemaining]);

  // ---- Controls
  const start = async () => {
    // first user action should resume AudioContext if needed
    if (noise !== "off" && audioCtxRef.current?.state === "suspended") {
      try {
        await audioCtxRef.current.resume();
      } catch {}
    }
    setIsRunning(true);
  };

  const pause = () => setIsRunning(false);

  const reset = () => {
    setIsRunning(false);
    setSessionFocusSeconds(0);

    setStopwatchSeconds(0);

    setCountdownRemaining(countdownMinutes * 60);

    setPomoPhase("focus");
    setPomoRemaining(pomoFocusMinutes * 60);
  };

  const setCountdownPreset = (m: number) => {
    setMode("countdown");
    setIsRunning(false);
    setCountdownMinutes(m);
    setCountdownRemaining(m * 60);
  };

  const setPomodoroPreset = (f: number, b: number) => {
    setMode("pomodoro");
    setIsRunning(false);
    setPomoFocusMinutes(f);
    setPomoBreakMinutes(b);
    setPomoPhase("focus");
    setPomoRemaining(f * 60);
  };

  const saveSubtasks = (next: Subtask[]) => {
    setSubtasks(next);

    if (!task || !user) return;
    if (subtaskSaveTimer.current) clearTimeout(subtaskSaveTimer.current);

    subtaskSaveTimer.current = setTimeout(async () => {
      await supabase
        .from("tasks")
        .update({ subtasks: next as any })
        .eq("id", task.id)
        .eq("user_id", user.id);
    }, 350);
  };

  const toggleSubtask = (idx: number) => {
    const next = [...subtasks];
    const current = next[idx];
    next[idx] = { ...current, completed: !current.completed };
    saveSubtasks(next);
  };

  const moveSubtask = (idx: number, dir: -1 | 1) => {
    const to = idx + dir;
    if (to < 0 || to >= subtasks.length) return;
    const next = [...subtasks];
    const [item] = next.splice(idx, 1);
    next.splice(to, 0, item);
    saveSubtasks(next);
  };

  const saveSession = async () => {
    if (!task || !user) return;

    const totalMinutes = (task.total_focus_minutes || 0) + focusedMinutesThisSession;

    const { error: updateError } = await supabase
      .from("tasks")
      .update({ total_focus_minutes: totalMinutes })
      .eq("id", task.id)
      .eq("user_id", user.id);

    if (updateError) {
      toast({ title: "Error saving session", variant: "destructive" });
      return;
    }

    toast({ title: "Session saved", description: `Added ${focusedMinutesThisSession} min of focus` });
    navigate("/tasks");
  };

  const markComplete = async () => {
    if (!task || !user) return;

    const { error: updateError } = await supabase
      .from("tasks")
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
        total_focus_minutes: (task.total_focus_minutes || 0) + focusedMinutesThisSession,
      })
      .eq("id", task.id)
      .eq("user_id", user.id);

    if (updateError) {
      toast({ title: "Error completing task", variant: "destructive" });
      return;
    }

    toast({ title: "Task completed", description: "Beautiful work." });
    navigate("/tasks");
  };

  const refreshQuote = () => setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  // ---- Loading / errors
  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading focus mode...</div>
      </div>
    );
  }

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

  // ---- UI
  return (
    <div className="min-h-[100dvh] relative overflow-hidden bg-background">
      {/* Background (optional) */}
      {bg?.type === "image" && (
        <img src={bg.url} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      )}
      {bg?.type === "video" && (
        <video className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline src={bg.url} />
      )}
      {/* Overlay to keep it luxury & readable */}
      <div className="absolute inset-0 bg-background/70" style={{ opacity: bg ? bg.overlay : 1 }} />
      {/* Subtle vignette */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-background/0 via-background/20 to-background/60" />

      <div className="relative z-10 min-h-[100dvh] flex flex-col">
        {/* Header */}
        <header className="px-5 sm:px-8 py-4 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/tasks")} className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Deep Focus</span>
                <span className="text-[10px] text-muted-foreground">•</span>
                <span className="text-[10px] text-muted-foreground">{greeting}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-semibold leading-tight">{task.title}</h1>

              {task.due_date && (
                <div className="text-xs text-muted-foreground">
                  Due{" "}
                  {new Date(task.due_date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                  {task.due_time ? ` • ${task.due_time}` : ""}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{totalFocused} min focused</span>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <Button variant="outline" size="sm" className="rounded-xl h-8 px-3" onClick={refreshQuote}>
                <RefreshCcw className="h-3.5 w-3.5 mr-2" />
                Quote
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="rounded-xl h-8 px-3"
                onClick={() => setNoise((v) => (v === "off" ? "pink" : "off"))}
              >
                {noise === "off" ? (
                  <>
                    <VolumeX className="h-3.5 w-3.5 mr-2" />
                    Sound
                  </>
                ) : (
                  <>
                    <Volume2 className="h-3.5 w-3.5 mr-2" />
                    Sound
                  </>
                )}
              </Button>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 px-5 sm:px-8 pb-8">
          <div className="grid gap-5 lg:grid-cols-[1.25fr_0.95fr] items-start">
            {/* LEFT: Timer card */}
            <section className="rounded-3xl border border-border/60 bg-background/55 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="px-5 sm:px-7 pt-6 pb-5 border-b border-border/50">
                {/* Mode pills */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={mode === "countdown" ? "default" : "outline"}
                    size="sm"
                    className="rounded-full h-8 px-4"
                    onClick={() => {
                      setIsRunning(false);
                      setMode("countdown");
                      setCountdownRemaining(countdownMinutes * 60);
                    }}
                  >
                    <Hourglass className="h-3.5 w-3.5 mr-2" />
                    Countdown
                  </Button>

                  <Button
                    variant={mode === "pomodoro" ? "default" : "outline"}
                    size="sm"
                    className="rounded-full h-8 px-4"
                    onClick={() => {
                      setIsRunning(false);
                      setMode("pomodoro");
                      setPomoPhase("focus");
                      setPomoRemaining(pomoFocusMinutes * 60);
                    }}
                  >
                    <Timer className="h-3.5 w-3.5 mr-2" />
                    Pomodoro
                  </Button>

                  <Button
                    variant={mode === "stopwatch" ? "default" : "outline"}
                    size="sm"
                    className="rounded-full h-8 px-4"
                    onClick={() => {
                      setIsRunning(false);
                      setMode("stopwatch");
                      setStopwatchSeconds(0);
                    }}
                  >
                    <Clock className="h-3.5 w-3.5 mr-2" />
                    Stopwatch
                  </Button>
                </div>

                {/* Presets */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {mode === "countdown" &&
                    COUNTDOWN_PRESETS.map((p) => (
                      <Button
                        key={p.minutes}
                        variant={countdownMinutes === p.minutes ? "default" : "outline"}
                        size="sm"
                        className="rounded-full h-8 px-4"
                        onClick={() => setCountdownPreset(p.minutes)}
                        disabled={isRunning}
                      >
                        {p.label}
                      </Button>
                    ))}

                  {mode === "pomodoro" &&
                    POMODORO_PRESETS.map((p) => (
                      <Button
                        key={p.label}
                        variant={pomoFocusMinutes === p.focus && pomoBreakMinutes === p.break ? "default" : "outline"}
                        size="sm"
                        className="rounded-full h-8 px-4"
                        onClick={() => setPomodoroPreset(p.focus, p.break)}
                        disabled={isRunning}
                      >
                        {p.label}
                      </Button>
                    ))}

                  {mode === "pomodoro" && (
                    <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span className="capitalize">{pomoPhase}</span>
                      <span className="text-muted-foreground/60">•</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-full px-3"
                        onClick={() => {
                          const next = !autoAdvance;
                          setAutoAdvance(next);
                          try {
                            localStorage.setItem("inbalance_focus_auto_advance", next ? "1" : "0");
                          } catch {}
                        }}
                      >
                        Auto-advance: {autoAdvance ? "On" : "Off"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Clock ring */}
              <div className="px-5 sm:px-7 py-7">
                <div className="flex items-center justify-center">
                  <div className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px]">
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        cx="160"
                        cy="160"
                        r="145"
                        fill="none"
                        stroke="hsl(var(--border))"
                        strokeOpacity="0.6"
                        strokeWidth="10"
                      />
                      <circle
                        cx="160"
                        cy="160"
                        r="145"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="10"
                        strokeDasharray={2 * Math.PI * 145}
                        strokeDashoffset={2 * Math.PI * 145 * (1 - progress)}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 800ms ease" }}
                      />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-[52px] sm:text-[64px] font-semibold tracking-[-0.02em]">{timeLabel}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {mode === "stopwatch" ? "elapsed" : "remaining"}
                      </div>

                      {focusedMinutesThisSession > 0 && (
                        <div className="mt-3 text-sm text-muted-foreground">
                          This session: <span className="text-foreground">{focusedMinutesThisSession} min</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                  {!isRunning ? (
                    <Button size="lg" className="rounded-2xl px-7 h-12" onClick={start}>
                      <Play className="w-5 h-5 mr-2" />
                      Start
                    </Button>
                  ) : (
                    <Button size="lg" variant="outline" className="rounded-2xl px-7 h-12" onClick={pause}>
                      <Pause className="w-5 h-5 mr-2" />
                      Pause
                    </Button>
                  )}

                  <Button size="lg" variant="ghost" className="rounded-2xl px-6 h-12" onClick={reset}>
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Reset
                  </Button>
                </div>

                {/* Bottom actions */}
                <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                  <Button variant="outline" className="rounded-2xl h-11 px-6" onClick={saveSession}>
                    Save & Exit
                  </Button>
                  <Button className="rounded-2xl h-11 px-6" onClick={markComplete}>
                    <Check className="w-4 h-4 mr-2" />
                    Mark Complete
                  </Button>
                </div>
              </div>
            </section>

            {/* RIGHT: Intention + Subtasks + Ambient */}
            <aside className="space-y-5">
              {/* Quote */}
              <div className="rounded-3xl border border-border/60 bg-background/55 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
                <div className="px-5 sm:px-7 py-5 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Focus cue</div>
                    <div className="mt-2 text-base font-medium leading-snug">{quote}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl"
                    onClick={refreshQuote}
                    aria-label="Refresh quote"
                  >
                    <RefreshCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Intention */}
              <div className="rounded-3xl border border-border/60 bg-background/55 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
                <div className="px-5 sm:px-7 py-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Intention</div>
                      <div className="mt-1 text-sm text-muted-foreground">Keep it simple. One outcome.</div>
                    </div>
                  </div>

                  <input
                    value={intention}
                    onChange={(e) => setIntention(e.target.value)}
                    placeholder="e.g., Finish the first draft (no perfecting)"
                    className="w-full h-11 rounded-2xl border border-border/60 bg-background/60 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />

                  <textarea
                    value={sessionNote}
                    onChange={(e) => setSessionNote(e.target.value)}
                    placeholder="Optional note — what does “done” look like?"
                    className="w-full min-h-[90px] rounded-2xl border border-border/60 bg-background/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>
              </div>

              {/* Subtasks */}
              <div className="rounded-3xl border border-border/60 bg-background/55 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
                <div className="px-5 sm:px-7 py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Focus to-dos</div>
                      <div className="mt-1 text-sm text-muted-foreground">One priority at a time.</div>
                    </div>

                    {primarySubtask ? (
                      <span className="text-xs rounded-full border border-border/60 bg-background/60 px-3 py-1 text-muted-foreground">
                        Next: <span className="text-foreground">{primarySubtask.title}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No subtasks</span>
                    )}
                  </div>

                  <div className="mt-4 space-y-2">
                    {subtasks?.length ? (
                      subtasks.map((s, idx) => (
                        <div
                          key={(s as any).id ?? `${s.title}-${idx}`}
                          className="flex items-center gap-2 rounded-2xl border border-border/50 bg-background/50 px-3 py-2"
                        >
                          <button
                            onClick={() => toggleSubtask(idx)}
                            className="h-6 w-6 rounded-lg border border-border/60 bg-background/60 flex items-center justify-center"
                            aria-label={s.completed ? "Mark incomplete" : "Mark complete"}
                            type="button"
                          >
                            {s.completed ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <span className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <div
                              className={`text-sm truncate ${s.completed ? "text-muted-foreground line-through" : "text-foreground"}`}
                            >
                              {s.title}
                            </div>
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
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-xl"
                              onClick={() => moveSubtask(idx, 1)}
                              disabled={idx === subtasks.length - 1}
                              aria-label="Move down"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-border/50 bg-background/50 px-4 py-4 text-sm text-muted-foreground">
                        No subtasks yet — add them from the Tasks page.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Ambient */}
              <div className="rounded-3xl border border-border/60 bg-background/55 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
                <div className="px-5 sm:px-7 py-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Ambient</div>
                      <div className="mt-1 text-sm text-muted-foreground">Subtle, non-distracting sound.</div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full h-8 px-4"
                      onClick={() => setNoise((v) => (v === "off" ? "pink" : "off"))}
                    >
                      {noise === "off" ? (
                        <>
                          <VolumeX className="h-3.5 w-3.5 mr-2" />
                          Off
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-3.5 w-3.5 mr-2" />
                          On
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(["off", "pink", "brown", "white"] as AmbientNoise[]).map((t) => (
                      <Button
                        key={t}
                        variant={noise === t ? "default" : "outline"}
                        size="sm"
                        className="rounded-full h-8 px-4 capitalize"
                        onClick={() => setNoise(t)}
                      >
                        {t}
                      </Button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-14">Vol</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-full"
                      aria-label="Ambient volume"
                    />
                    <span className="text-xs text-muted-foreground w-12 text-right">{Math.round(volume * 100)}%</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
