import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  ArrowLeft,
  Play,
  Pause,
  Settings2,
  Volume2,
  Music,
  Sparkles,
  X,
  Maximize,
  Eye,
  EyeOff,
  Clock,
  Quote,
  Palette,
  CloudRain,
  Waves,
  Flame,
  Trees,
  Coffee,
  Wind,
  Moon,
} from "lucide-react";
import { QuadrantTask, Subtask } from "@/components/tasks/types";

const TIMER_MODES = ["Pomodoro", "Countdown", "Stopwatch"] as const;
type TimerMode = (typeof TIMER_MODES)[number];

const GRADIENT_THEMES = [
  { id: "aurora", name: "Aurora", value: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)" },
  { id: "sunset-blush", name: "Sunset Blush", value: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)" },
  { id: "ocean-breeze", name: "Ocean Breeze", value: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
  { id: "midnight-purple", name: "Midnight", value: "linear-gradient(135deg, #0c0d13 0%, #1a1b2e 50%, #2d1b69 100%)" },
  { id: "emerald-glow", name: "Emerald", value: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)" },
  { id: "warm-flame", name: "Warm Flame", value: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)" },
  { id: "deep-space", name: "Deep Space", value: "linear-gradient(135deg, #000428 0%, #004e92 100%)" },
  { id: "royal-blue", name: "Royal Blue", value: "linear-gradient(135deg, #536976 0%, #292E49 100%)" },
  { id: "northern-lights", name: "Northern Lights", value: "linear-gradient(135deg, #43cea2 0%, #185a9d 100%)" },
  { id: "lavender-mist", name: "Lavender", value: "linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)" },
];

const WALLPAPER_THEMES = [
  {
    id: "tokyo-night",
    name: "Tokyo Night",
    url: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1920&q=80",
  },
  {
    id: "swiss-alps",
    name: "Swiss Alps",
    url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1920&q=80",
  },
  {
    id: "bali-rice",
    name: "Bali Rice Fields",
    url: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1920&q=80",
  },
  {
    id: "misty-forest",
    name: "Misty Forest",
    url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80",
  },
  { id: "maldives", name: "Maldives", url: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1920&q=80" },
  {
    id: "santorini",
    name: "Santorini",
    url: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1920&q=80",
  },
];

const AMBIENT_SOUNDS = [
  { id: "rain", name: "Rain", icon: CloudRain },
  { id: "ocean", name: "Ocean", icon: Waves },
  { id: "fireplace", name: "Fireplace", icon: Flame },
  { id: "forest", name: "Forest", icon: Trees },
  { id: "coffee-shop", name: "Coffee Shop", icon: Coffee },
  { id: "white-noise", name: "White Noise", icon: Wind },
  { id: "night", name: "Night", icon: Moon },
];

const FOCUS_QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "Deep work is the ability to focus without distraction.", author: "Cal Newport" },
  { text: "Where focus goes, energy flows.", author: "Tony Robbins" },
  { text: "You can do anything, but not everything.", author: "David Allen" },
  { text: "Starve your distractions, feed your focus.", author: "" },
  { text: "One thing at a time.", author: "" },
  { text: "Progress, not perfection.", author: "" },
  { text: "Small steps every day lead to big results.", author: "" },
  { text: "Breathe. You're doing better than you think.", author: "" },
];

const CLOCK_STYLES = [
  { id: "default", name: "Default", fontClass: "font-bold" },
  { id: "minimal", name: "Minimal", fontClass: "font-extralight" },
  { id: "serif", name: "Serif", fontClass: "font-serif font-medium" },
  { id: "mono", name: "Mono", fontClass: "font-mono font-semibold" },
];

const STORAGE_KEY = "luxuryfocus-settings";

interface FocusSettings {
  themeType: "gradient" | "wallpaper";
  themeId: string;
  clockStyle: string;
  is24Hour: boolean;
  showSeconds: boolean;
  showGreeting: boolean;
  showQuotes: boolean;
  quoteFrequency: number;
  zenMode: boolean;
  ambientVolumes: Record<string, number>;
}

const getGreeting = (hour: number): string => {
  if (hour < 5) return "Burning the midnight oil?";
  if (hour < 12) return "Good morning. Let's make today count!";
  if (hour < 17) return "Good afternoon. Stay focused!";
  if (hour < 21) return "Good evening. Finish strong!";
  return `Night. See you after a great ${format(new Date(), "EEEE")}!`;
};

export default function TaskFocus() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [task, setTask] = useState<QuadrantTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [timerMode, setTimerMode] = useState<TimerMode>("Pomodoro");
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [focusedSeconds, setFocusedSeconds] = useState(0);

  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState("themes");
  const [showSummary, setShowSummary] = useState(false);
  const [markComplete, setMarkComplete] = useState(false);

  const [settings, setSettings] = useState<FocusSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return {
      themeType: "gradient",
      themeId: "aurora",
      clockStyle: "default",
      is24Hour: false,
      showSeconds: false,
      showGreeting: true,
      showQuotes: true,
      quoteFrequency: 5,
      zenMode: false,
      ambientVolumes: {},
    };
  });

  const [currentQuote, setCurrentQuote] = useState(FOCUS_QUOTES[0]);
  const [quoteVisible, setQuoteVisible] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopwatchRef = useRef(0);

  const sessionMinutes = useMemo(() => Math.floor(focusedSeconds / 60), [focusedSeconds]);

  useEffect(() => {
    async function fetchTask() {
      if (!taskId || !user) {
        setError(!taskId ? "No task ID" : "Please log in");
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
      setTask({
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
        time_of_day: (data.time_of_day || "morning") as any,
        date_bucket: "today",
        tags: data.tags || [],
        subtasks: (data.subtasks as unknown as Subtask[]) || [],
        quadrant_assigned: true,
      });
      setLoading(false);
    }
    fetchTask();
  }, [taskId, user]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (!settings.showQuotes) return;
    const rotateQuote = () => {
      setQuoteVisible(false);
      setTimeout(() => {
        setCurrentQuote(FOCUS_QUOTES[Math.floor(Math.random() * FOCUS_QUOTES.length)]);
        setQuoteVisible(true);
      }, 500);
    };
    const interval = setInterval(rotateQuote, settings.quoteFrequency * 60 * 1000);
    return () => clearInterval(interval);
  }, [settings.showQuotes, settings.quoteFrequency]);
  useEffect(() => {
    if (timerMode !== "Stopwatch") setSecondsRemaining(timerMinutes * 60);
  }, [timerMinutes, timerMode]);
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        if (timerMode === "Stopwatch") {
          stopwatchRef.current += 1;
          setSecondsRemaining(stopwatchRef.current);
          setFocusedSeconds((s) => s + 1);
        } else {
          setSecondsRemaining((prev) => {
            if (prev <= 1) {
              handleTimerEnd();
              return 0;
            }
            return prev - 1;
          });
          setFocusedSeconds((s) => s + 1);
        }
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timerMode]);

  const handleTimerEnd = () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setShowSummary(true);
    toast({ title: "Focus session complete!", description: "Great work!" });
  };
  const handleEndSession = () => {
    setIsRunning(false);
    setShowSummary(true);
  };
  const handleSaveSession = async () => {
    if (!task || !user) return;
    await supabase
      .from("tasks")
      .update({
        total_focus_minutes: task.total_focus_minutes + sessionMinutes,
        is_completed: markComplete,
        completed_at: markComplete ? new Date().toISOString() : null,
      })
      .eq("id", task.id)
      .eq("user_id", user.id);
    toast({ title: "Session saved!", description: `Added ${sessionMinutes} min.` });
    navigate("/tasks");
  };
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };
  const formatClockTime = () => {
    const hours = settings.is24Hour ? currentTime.getHours() : currentTime.getHours() % 12 || 12;
    const minutes = currentTime.getMinutes().toString().padStart(2, "0");
    const seconds = currentTime.getSeconds().toString().padStart(2, "0");
    return settings.showSeconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`;
  };
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  };
  const progress = timerMode === "Stopwatch" ? 0 : ((timerMinutes * 60 - secondsRemaining) / (timerMinutes * 60)) * 100;
  const clockStyle = CLOCK_STYLES.find((s) => s.id === settings.clockStyle) || CLOCK_STYLES[0];
  const getBackground = () => {
    if (settings.themeType === "wallpaper") {
      const wp = WALLPAPER_THEMES.find((w) => w.id === settings.themeId);
      return wp ? `url(${wp.url})` : GRADIENT_THEMES[0].value;
    }
    return GRADIENT_THEMES.find((g) => g.id === settings.themeId)?.value || GRADIENT_THEMES[0].value;
  };

  if (loading)
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="animate-pulse text-white/60">Loading...</div>
      </div>
    );
  if (error || !task)
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-white/60">{error || "Task not found"}</p>
          <Button variant="link" onClick={() => navigate("/tasks")} className="text-white mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </div>
    );

  if (showSummary)
    return (
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
        <div
          className="absolute inset-0"
          style={{ background: getBackground(), backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
        <div className="relative z-10 w-full max-w-md bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 space-y-6">
          <div className="text-center">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center mx-auto mb-5">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-white">Session Complete!</h2>
            <p className="text-white/50 mt-2">{task.title}</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-6 text-center border border-white/10">
            <p className="text-6xl font-light text-white">{sessionMinutes}</p>
            <p className="text-sm text-white/50 mt-1">minutes focused</p>
          </div>
          <div
            className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10 cursor-pointer"
            onClick={() => setMarkComplete(!markComplete)}
          >
            <Checkbox
              checked={markComplete}
              onCheckedChange={(c) => setMarkComplete(!!c)}
              className="border-white/30"
            />
            <label className="text-sm text-white cursor-pointer flex-1">Mark task as completed</label>
          </div>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              className="flex-1 bg-white/5 border border-white/10 text-white hover:bg-white/10"
              onClick={() => navigate("/tasks")}
            >
              Skip
            </Button>
            <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleSaveSession}>
              Save Session
            </Button>
          </div>
        </div>
      </div>
    );

  return (
    <div className="fixed inset-0 overflow-hidden">
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{ background: getBackground(), backgroundSize: "cover", backgroundPosition: "center" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/40" />

      <div className="absolute top-0 left-0 right-0 z-30">
        <div className="flex items-center justify-between px-6 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/tasks")}
            className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
            >
              <Maximize className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSettings((s) => ({ ...s, zenMode: !s.zenMode }))}
              className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
            >
              {settings.zenMode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                "text-white/70 hover:text-white hover:bg-white/10 rounded-xl",
                showSettings && "bg-white/10",
              )}
            >
              <Settings2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {settings.showQuotes && !settings.zenMode && (
        <div
          className={cn(
            "absolute top-6 right-24 max-w-xs text-right transition-all duration-700 z-20",
            quoteVisible ? "opacity-100" : "opacity-0",
          )}
        >
          <p className="text-white/80 text-sm italic">"{currentQuote.text}"</p>
          {currentQuote.author && <p className="text-white/40 text-xs mt-1">— {currentQuote.author}</p>}
        </div>
      )}

      {!settings.zenMode && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 px-8">
          {settings.showGreeting && (
            <p className="text-white/90 text-xl mb-4 text-center">{getGreeting(currentTime.getHours())}</p>
          )}
          <div className={cn("text-white text-8xl md:text-9xl tracking-tight mb-8", clockStyle.fontClass)}>
            {formatClockTime()}
          </div>
          {(isRunning || secondsRemaining !== timerMinutes * 60 || timerMode === "Stopwatch") && (
            <div className="mb-8">
              <div className="bg-black/30 backdrop-blur-xl rounded-2xl px-8 py-4 border border-white/10">
                <p className="text-white/50 text-sm text-center mb-2">{task.title}</p>
                <p className="text-white text-5xl font-light text-center">{formatTime(secondsRemaining)}</p>
                {timerMode !== "Stopwatch" && <Progress value={progress} className="h-1 mt-4 bg-white/10" />}
              </div>
            </div>
          )}
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2 p-1 bg-black/30 backdrop-blur-xl rounded-full border border-white/10">
              {TIMER_MODES.map((mode) => (
                <Button
                  key={mode}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTimerMode(mode);
                    if (mode === "Pomodoro") setTimerMinutes(25);
                    if (mode === "Stopwatch") {
                      stopwatchRef.current = 0;
                      setSecondsRemaining(0);
                    }
                  }}
                  className={cn(
                    "text-sm px-5 py-2 rounded-full",
                    timerMode === mode ? "bg-white/15 text-white" : "text-white/50 hover:text-white",
                  )}
                >
                  {mode}
                </Button>
              ))}
            </div>
            <div className="flex gap-3">
              {!isRunning ? (
                <Button
                  size="lg"
                  onClick={() => setIsRunning(true)}
                  className="bg-white text-black hover:bg-white/90 px-12 py-6 text-lg rounded-2xl shadow-lg"
                >
                  <Play className="h-6 w-6 mr-2" />
                  Start Focus
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    onClick={() => setIsRunning(false)}
                    className="bg-white/10 hover:bg-white/15 text-white px-8 py-6 rounded-2xl border border-white/10"
                  >
                    <Pause className="h-5 w-5 mr-2" />
                    Pause
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleEndSession}
                    className="bg-white/10 hover:bg-white/15 text-white px-8 py-6 rounded-2xl border border-white/10"
                  >
                    End
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-6 left-6 right-6 z-30">
        <div className="flex items-center justify-between">
          <div className="flex gap-2 p-2 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/50 hover:text-white hover:bg-white/10 rounded-xl h-10 w-10"
            >
              <Music className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/50 hover:text-white hover:bg-white/10 rounded-xl h-10 w-10"
            >
              <Volume2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-4 p-3 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10">
            <div className="text-right">
              <p className="text-white/50 text-xs">Task</p>
              <p className="text-white text-sm font-medium truncate max-w-[200px]">{task.title}</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-right">
              <p className="text-white/50 text-xs">Session</p>
              <p className="text-white text-sm font-medium">{sessionMinutes}m</p>
            </div>
          </div>
        </div>
      </div>

      {showSettings && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />
          <div className="fixed top-0 right-0 h-full w-96 bg-black/80 backdrop-blur-2xl border-l border-white/10 z-50 overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">Settings</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(false)}
                  className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <Tabs value={settingsTab} onValueChange={setSettingsTab}>
                <TabsList className="w-full grid grid-cols-4 bg-white/5 rounded-xl p-1">
                  <TabsTrigger value="themes" className="rounded-lg text-xs">
                    <Palette className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="clock" className="rounded-lg text-xs">
                    <Clock className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="sounds" className="rounded-lg text-xs">
                    <Volume2 className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="quotes" className="rounded-lg text-xs">
                    <Quote className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="themes" className="space-y-4 mt-4">
                  <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSettings((s) => ({ ...s, themeType: "gradient" }))}
                      className={cn(
                        "flex-1 rounded-lg",
                        settings.themeType === "gradient" ? "bg-white/10 text-white" : "text-white/50",
                      )}
                    >
                      Gradients
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSettings((s) => ({ ...s, themeType: "wallpaper" }))}
                      className={cn(
                        "flex-1 rounded-lg",
                        settings.themeType === "wallpaper" ? "bg-white/10 text-white" : "text-white/50",
                      )}
                    >
                      Wallpapers
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(settings.themeType === "gradient" ? GRADIENT_THEMES : WALLPAPER_THEMES).map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => setSettings((s) => ({ ...s, themeId: theme.id }))}
                        className={cn(
                          "aspect-square rounded-xl overflow-hidden border-2 transition-all",
                          settings.themeId === theme.id
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-transparent hover:border-white/30",
                        )}
                        style={settings.themeType === "gradient" ? { background: (theme as any).value } : undefined}
                      >
                        {settings.themeType === "wallpaper" && (
                          <img src={(theme as any).url} alt={theme.name} className="w-full h-full object-cover" />
                        )}
                      </button>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="clock" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-2">
                    {CLOCK_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSettings((s) => ({ ...s, clockStyle: style.id }))}
                        className={cn(
                          "p-4 rounded-xl border text-center",
                          settings.clockStyle === style.id
                            ? "border-primary bg-primary/10"
                            : "border-white/10 hover:border-white/30",
                        )}
                      >
                        <span className={cn("text-2xl text-white", style.fontClass)}>12:00</span>
                        <p className="text-xs text-white/50 mt-1">{style.name}</p>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-white/10">
                    <span className="text-sm text-white/80">24-Hour</span>
                    <Switch
                      checked={settings.is24Hour}
                      onCheckedChange={(c) => setSettings((s) => ({ ...s, is24Hour: c }))}
                    />
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-white/10">
                    <span className="text-sm text-white/80">Show Seconds</span>
                    <Switch
                      checked={settings.showSeconds}
                      onCheckedChange={(c) => setSettings((s) => ({ ...s, showSeconds: c }))}
                    />
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-white/10">
                    <span className="text-sm text-white/80">Show Greeting</span>
                    <Switch
                      checked={settings.showGreeting}
                      onCheckedChange={(c) => setSettings((s) => ({ ...s, showGreeting: c }))}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="sounds" className="space-y-4 mt-4">
                  <p className="text-xs text-white/50">Mix ambient sounds for your focus environment.</p>
                  {AMBIENT_SOUNDS.map((sound) => {
                    const Icon = sound.icon;
                    const volume = settings.ambientVolumes[sound.id] || 0;
                    return (
                      <div key={sound.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-white/50" />
                            <span className="text-sm text-white/80">{sound.name}</span>
                          </div>
                          <span className="text-xs text-white/40">{volume}%</span>
                        </div>
                        <Slider
                          value={[volume]}
                          onValueChange={([v]) =>
                            setSettings((s) => ({ ...s, ambientVolumes: { ...s.ambientVolumes, [sound.id]: v } }))
                          }
                          max={100}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    );
                  })}
                </TabsContent>
                <TabsContent value="quotes" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-white/80">Show Quotes</span>
                    <Switch
                      checked={settings.showQuotes}
                      onCheckedChange={(c) => setSettings((s) => ({ ...s, showQuotes: c }))}
                    />
                  </div>
                  {settings.showQuotes && (
                    <div className="flex gap-2">
                      {[5, 10, 15, 30].map((min) => (
                        <Button
                          key={min}
                          variant="ghost"
                          size="sm"
                          onClick={() => setSettings((s) => ({ ...s, quoteFrequency: min }))}
                          className={cn(
                            "flex-1 rounded-lg",
                            settings.quoteFrequency === min ? "bg-white/10 text-white" : "text-white/50",
                          )}
                        >
                          {min}m
                        </Button>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
