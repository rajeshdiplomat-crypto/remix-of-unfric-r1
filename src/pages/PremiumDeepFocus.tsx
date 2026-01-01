import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Pause, RotateCcw, Check, Plus, Bell, BellOff, Video, Quote, Settings2, Volume2, Music, Undo2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { QuadrantTask, Subtask } from "@/components/tasks/types";
import { useToast } from "@/hooks/use-toast";
import { format, subDays } from "date-fns";
import { LineChart, Line, XAxis, ResponsiveContainer } from "recharts";

const TIMER_MODES = ['Pomodoro', 'Countdown', 'Stopwatch'] as const;
type TimerMode = typeof TIMER_MODES[number];

// Default wallpapers
const DEFAULT_WALLPAPERS = [
  { id: 'forest-1', name: 'Forest Light', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80' },
  { id: 'forest-2', name: 'Misty Woods', url: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=1920&q=80' },
  { id: 'ocean-1', name: 'Calm Ocean', url: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1920&q=80' },
  { id: 'sunset-1', name: 'Golden Sunset', url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1920&q=80' },
  { id: 'mountain-1', name: 'Mountain Mist', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80' },
  { id: 'rain-1', name: 'Rain Drops', url: 'https://images.unsplash.com/photo-1428592953211-077101b2021b?w=1920&q=80' },
  { id: 'stars-1', name: 'Starry Night', url: 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=1920&q=80' },
  { id: 'lake-1', name: 'Lake Reflections', url: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1920&q=80' },
];

// Inspirational quotes
const FOCUS_QUOTES = [
  { text: "One thing at a time.", author: "" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "Deep work is the ability to focus without distraction.", author: "Cal Newport" },
  { text: "Where focus goes, energy flows.", author: "Tony Robbins" },
  { text: "Starve your distractions, feed your focus.", author: "" },
  { text: "You can do anything, but not everything.", author: "David Allen" },
];

const STORAGE_KEY = 'inbalance-deepfocus-premium-settings';

interface DeepFocusSettings {
  wallpaperId: string;
  isVideoMode: boolean;
  showQuotes: boolean;
  quoteFrequency: number;
  ambientSounds: {
    rain: number;
    whiteNoise: number;
  };
  zenMode: boolean;
}

interface PremiumDeepFocusProps {
  tasks: QuadrantTask[];
  onUpdateTask: (task: QuadrantTask) => void;
}

export default function PremiumDeepFocus({ tasks, onUpdateTask }: PremiumDeepFocusProps) {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const task = tasks.find(t => t.id === taskId);

  // Timer state
  const [timerMode, setTimerMode] = useState<TimerMode>('Countdown');
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionMinutes, setSessionMinutes] = useState(0);
  
  // UI state
  const [activeTab, setActiveTab] = useState<'subtasks' | 'notes' | 'stats'>('subtasks');
  const [notes, setNotes] = useState("");
  const [doNotDisturb, setDoNotDisturb] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [markComplete, setMarkComplete] = useState(false);
  const [showEnvironment, setShowEnvironment] = useState(false);
  
  // Settings
  const [settings, setSettings] = useState<DeepFocusSettings>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch {}
    }
    return {
      wallpaperId: 'forest-1',
      isVideoMode: false,
      showQuotes: true,
      quoteFrequency: 5,
      ambientSounds: { rain: 0, whiteNoise: 0 },
      zenMode: false,
    };
  });

  // Quote state
  const [currentQuote, setCurrentQuote] = useState(FOCUS_QUOTES[0]);
  const [quoteVisible, setQuoteVisible] = useState(true);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const stopwatchRef = useRef(0);

  // Persist settings
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Quote rotation
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

  // Timer logic
  useEffect(() => {
    if (timerMode === 'Countdown') {
      setSecondsRemaining(timerMinutes * 60);
    }
  }, [timerMinutes, timerMode]);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = new Date();
      intervalRef.current = setInterval(() => {
        if (timerMode === 'Stopwatch') {
          stopwatchRef.current += 1;
          setSecondsRemaining(stopwatchRef.current);
        } else {
          setSecondsRemaining(prev => {
            if (prev <= 1) {
              handleTimerEnd();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, timerMode]);

  const handleTimerEnd = () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    if (startTimeRef.current) {
      const elapsed = Math.floor((new Date().getTime() - startTimeRef.current.getTime()) / 60000);
      setSessionMinutes(elapsed);
    } else {
      setSessionMinutes(timerMinutes);
    }
    
    setShowSummary(true);
    playAlarm();
    
    if (!doNotDisturb) {
      toast({ title: "Focus session complete!", description: `You focused for ${timerMinutes} minutes.` });
    }
  };

  const playAlarm = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = 800;
      gain.gain.value = 0.3;
      osc.start();
      setTimeout(() => osc.stop(), 300);
    } catch {}
  };

  const handleEndSession = () => {
    if (startTimeRef.current) {
      const elapsed = Math.floor((new Date().getTime() - startTimeRef.current.getTime()) / 60000);
      setSessionMinutes(Math.max(1, elapsed));
    }
    setIsRunning(false);
    setShowSummary(true);
  };

  const handleSaveSummary = () => {
    if (!task) return;
    const updated: QuadrantTask = {
      ...task,
      total_focus_minutes: (task.total_focus_minutes || 0) + sessionMinutes,
      is_completed: markComplete,
      completed_at: markComplete ? new Date().toISOString() : task.completed_at,
    };
    onUpdateTask(updated);
    toast({ title: "Session saved", description: `Added ${sessionMinutes} minutes of focus time.` });
    navigate('/tasks');
  };

  const handleSubtaskToggle = (subtaskId: string) => {
    if (!task) return;
    const updated: QuadrantTask = {
      ...task,
      subtasks: task.subtasks.map(st =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      ),
    };
    onUpdateTask(updated);
  };

  const handleAddSubtask = () => {
    if (!task || !newSubtask.trim()) return;
    const subtask: Subtask = {
      id: `subtask-${Date.now()}`,
      title: newSubtask.trim(),
      completed: false,
    };
    const updated: QuadrantTask = {
      ...task,
      subtasks: [...task.subtasks, subtask],
    };
    onUpdateTask(updated);
    setNewSubtask("");
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = timerMode === 'Stopwatch' ? 0 : ((timerMinutes * 60 - secondsRemaining) / (timerMinutes * 60)) * 100;
  const completedSubtasks = task?.subtasks.filter(s => s.completed).length || 0;
  const totalSubtasks = task?.subtasks.length || 0;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const endTime = useMemo(() => {
    const end = new Date();
    end.setSeconds(end.getSeconds() + secondsRemaining);
    return format(end, 'h:mm a');
  }, [secondsRemaining]);

  // Weekly stats data
  const weeklyData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      data.push({
        day: format(date, 'E').charAt(0),
        focus: Math.floor(Math.random() * 60) + 10,
      });
    }
    return data;
  }, []);

  const currentWallpaper = DEFAULT_WALLPAPERS.find(w => w.id === settings.wallpaperId) || DEFAULT_WALLPAPERS[0];

  if (!task) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-white/60">Task not found</p>
          <Button variant="link" onClick={() => navigate('/tasks')} className="text-white">Return to Tasks</Button>
        </div>
      </div>
    );
  }

  // Session Summary Modal
  if (showSummary) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
        {/* Background */}
        <div 
          className="absolute inset-0"
          style={{ 
            backgroundImage: `url(${currentWallpaper.url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
        
        {/* Modal */}
        <div className="relative z-10 w-full max-w-md bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 space-y-6">
          <div className="text-center">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center mx-auto mb-5 ring-2 ring-primary/20">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-white">Session Complete</h2>
            <p className="text-white/50 mt-2">{task.title}</p>
          </div>
          
          <div className="bg-white/5 rounded-2xl p-6 text-center border border-white/10">
            <p className="text-6xl font-light text-white">{sessionMinutes}</p>
            <p className="text-sm text-white/50 mt-1">minutes focused</p>
          </div>
          
          <div 
            className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
            onClick={() => setMarkComplete(!markComplete)}
          >
            <Checkbox 
              checked={markComplete} 
              onCheckedChange={(c) => setMarkComplete(!!c)} 
              className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
            />
            <label className="text-sm text-white cursor-pointer flex-1">
              Mark task as completed
            </label>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="ghost" 
              className="flex-1 bg-white/5 border border-white/10 text-white hover:bg-white/10" 
              onClick={() => navigate('/tasks')}
            >
              Skip
            </Button>
            <Button 
              className="flex-1 bg-primary hover:bg-primary/90" 
              onClick={handleSaveSummary}
            >
              Save Session
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Immersive Background */}
      <div 
        className="absolute inset-0 transition-all duration-1000"
        style={{
          backgroundImage: `url(${currentWallpaper.url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Gradient Overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />

      {/* Subtle vignette */}
      <div className="absolute inset-0" style={{ 
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)' 
      }} />

      {/* Film grain texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" 
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} 
      />

      {/* Quote Overlay - Bottom Left */}
      {settings.showQuotes && !settings.zenMode && (
        <div className={cn(
          "absolute bottom-10 left-10 max-w-lg transition-all duration-700 z-20",
          quoteVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <p className="text-white/80 text-2xl font-light italic leading-relaxed">"{currentQuote.text}"</p>
          {currentQuote.author && (
            <p className="text-white/40 text-sm mt-3">— {currentQuote.author}</p>
          )}
        </div>
      )}

      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-30">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/tasks')} 
              className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-medium text-lg text-white">Deep Focus Mode</h1>
                <span className="text-white/30">·</span>
                <span className="text-white/50 text-sm">{task.title}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* DND Toggle */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
              {doNotDisturb ? (
                <BellOff className="h-4 w-4 text-red-400" />
              ) : (
                <Bell className="h-4 w-4 text-white/60" />
              )}
              <span className="text-sm text-white/70">DND</span>
              <Switch 
                checked={doNotDisturb} 
                onCheckedChange={setDoNotDisturb}
                className="scale-75"
              />
            </div>
            
            {/* Environment Settings */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowEnvironment(!showEnvironment)}
              className={cn(
                "text-white/70 hover:text-white hover:bg-white/10 rounded-xl",
                showEnvironment && "bg-white/10"
              )}
            >
              <Settings2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="absolute inset-0 flex items-center justify-center px-8 py-20 z-20">
        <div className="w-full max-w-6xl grid lg:grid-cols-[1.2fr_1fr] gap-8 items-start">
          
          {/* LEFT - Timer Section */}
          <div className="flex flex-col items-center justify-center">
            {/* Timer Circle */}
            <div className="relative mb-8">
              <svg className="w-72 h-72 -rotate-90" viewBox="0 0 120 120">
                {/* Background circle */}
                <circle 
                  cx="60" cy="60" r="54" 
                  fill="none" 
                  stroke="rgba(255,255,255,0.08)" 
                  strokeWidth="3" 
                />
                {/* Progress circle */}
                <circle 
                  cx="60" cy="60" r="54" 
                  fill="none" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 54}`}
                  strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress / 100)}`}
                  className="transition-all duration-1000 ease-out"
                  style={{ filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.5))' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-6xl font-extralight text-white tracking-wider">
                  {formatTime(secondsRemaining)}
                </span>
                {timerMode !== 'Stopwatch' && (
                  <span className="text-white/40 text-sm mt-2">Ends at {endTime}</span>
                )}
              </div>
            </div>

            {/* Timer Mode Selector */}
            <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-full backdrop-blur-sm border border-white/10">
              {TIMER_MODES.map(mode => (
                <Button
                  key={mode}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTimerMode(mode);
                    if (mode === 'Pomodoro') setTimerMinutes(25);
                    if (mode === 'Stopwatch') {
                      stopwatchRef.current = 0;
                      setSecondsRemaining(0);
                    }
                  }}
                  className={cn(
                    "text-sm px-5 py-2 rounded-full transition-all",
                    timerMode === mode 
                      ? "bg-white/15 text-white shadow-lg" 
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  )}
                >
                  {mode}
                </Button>
              ))}
            </div>

            {/* Main Control Button */}
            <div className="flex gap-3 mb-6">
              {!isRunning ? (
                <Button 
                  size="lg" 
                  onClick={() => setIsRunning(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-6 text-lg rounded-2xl shadow-lg shadow-primary/30"
                >
                  <Play className="h-6 w-6 mr-2" />
                  Start Focus
                </Button>
              ) : (
                <>
                  <Button 
                    size="lg" 
                    onClick={() => setIsRunning(false)}
                    className="bg-white/10 hover:bg-white/15 text-white px-8 py-6 rounded-2xl backdrop-blur-sm border border-white/10"
                  >
                    <Pause className="h-5 w-5 mr-2" />
                    Pause
                  </Button>
                  <Button 
                    size="lg" 
                    onClick={handleEndSession}
                    className="bg-white/10 hover:bg-white/15 text-white px-8 py-6 rounded-2xl backdrop-blur-sm border border-white/10"
                  >
                    End Session
                  </Button>
                </>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3 p-2 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10">
              <Button variant="ghost" size="icon" className="text-white/50 hover:text-white hover:bg-white/10 rounded-xl h-10 w-10">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white/50 hover:text-white hover:bg-white/10 rounded-xl h-10 w-10">
                <Music className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white/50 hover:text-white hover:bg-white/10 rounded-xl h-10 w-10">
                <Volume2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  if (timerMode === 'Stopwatch') {
                    stopwatchRef.current = 0;
                    setSecondsRemaining(0);
                  } else {
                    setSecondsRemaining(timerMinutes * 60);
                  }
                }}
                className="text-white/50 hover:text-white hover:bg-white/10 rounded-xl h-10 w-10"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* RIGHT - Focus Panel */}
          <div className="bg-black/30 backdrop-blur-2xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <TabsList className="w-full grid grid-cols-3 bg-transparent border-b border-white/10 rounded-none h-auto p-0">
                {(['subtasks', 'notes', 'stats'] as const).map(tab => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className={cn(
                      "py-4 text-sm capitalize rounded-none border-b-2 border-transparent transition-all",
                      "data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-primary",
                      "text-white/40 hover:text-white/70"
                    )}
                  >
                    {tab === 'subtasks' ? 'Subtasks' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Subtasks Tab */}
              <TabsContent value="subtasks" className="p-5 space-y-4 max-h-[400px] overflow-y-auto">
                <div className="text-xs text-white/40 uppercase tracking-widest">Now: Doing</div>
                <div className="space-y-2">
                  {task.subtasks.map(subtask => (
                    <div 
                      key={subtask.id} 
                      className={cn(
                        "flex items-center gap-3 p-3.5 rounded-xl transition-all",
                        subtask.completed ? "bg-white/5" : "bg-white/10"
                      )}
                    >
                      <Checkbox
                        checked={subtask.completed}
                        onCheckedChange={() => handleSubtaskToggle(subtask.id)}
                        className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <span className={cn(
                        "flex-1 text-sm text-white/90",
                        subtask.completed && "line-through text-white/40"
                      )}>
                        {subtask.title}
                      </span>
                      {subtask.completed && <Check className="h-4 w-4 text-primary" />}
                    </div>
                  ))}
                  <div className="flex items-center gap-2 p-3.5 rounded-xl border border-dashed border-white/20 hover:border-white/30 transition-colors">
                    <Plus className="h-4 w-4 text-white/40" />
                    <Input
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                      placeholder="Add subtask (Enter)"
                      className="bg-transparent border-none text-white placeholder:text-white/30 p-0 h-auto focus-visible:ring-0"
                    />
                  </div>
                </div>

                {/* Progress */}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-white/50">Progress</span>
                    <span className="text-white font-medium">{Math.round(subtaskProgress)}%</span>
                  </div>
                  <Progress value={subtaskProgress} className="h-2 bg-white/10" />
                  <p className="text-xs text-white/40 mt-2">{completedSubtasks} of {totalSubtasks} completed</p>
                </div>

                {/* Today Stats */}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/50">Today's Focus</span>
                    <span className="text-2xl font-light text-white">{task.total_focus_minutes || 0}m</span>
                  </div>
                </div>
              </TabsContent>

              {/* Notes Tab */}
              <TabsContent value="notes" className="p-5">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Capture thoughts, insights, or blockers..."
                  rows={12}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none rounded-xl focus:ring-primary/50"
                />
              </TabsContent>

              {/* Stats Tab */}
              <TabsContent value="stats" className="p-5 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <span className="text-xs text-white/40 uppercase tracking-wider">Today</span>
                    <p className="text-3xl font-light text-white mt-1">{task.total_focus_minutes || 0}m</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <span className="text-xs text-white/40 uppercase tracking-wider">This Task</span>
                    <p className="text-3xl font-light text-white mt-1">{task.total_focus_minutes || 0}m</p>
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <span className="text-xs text-white/40 uppercase tracking-wider">Weekly Focus</span>
                  <div className="h-20 mt-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weeklyData}>
                        <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
                        <Line type="monotone" dataKey="focus" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Environment Settings Panel - Slide-in from right */}
      {showEnvironment && (
        <>
          <div 
            className="fixed inset-0 bg-black/30 z-40" 
            onClick={() => setShowEnvironment(false)} 
          />
          <div className="fixed top-0 right-0 h-full w-80 bg-black/50 backdrop-blur-2xl border-l border-white/10 z-50 animate-in slide-in-from-right duration-300">
            <div className="p-5 space-y-6 h-full overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">Focus Environment</h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowEnvironment(false)}
                  className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Wallpaper Grid */}
              <div className="space-y-3">
                <span className="text-xs text-white/40 uppercase tracking-wider">Wallpaper</span>
                <div className="grid grid-cols-4 gap-2">
                  {DEFAULT_WALLPAPERS.map(wp => (
                    <button
                      key={wp.id}
                      onClick={() => setSettings(s => ({ ...s, wallpaperId: wp.id }))}
                      className={cn(
                        "aspect-square rounded-lg overflow-hidden border-2 transition-all",
                        settings.wallpaperId === wp.id ? "border-primary ring-2 ring-primary/30" : "border-transparent hover:border-white/30"
                      )}
                    >
                      <img src={wp.url} alt={wp.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Ambient Sounds */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <span className="text-xs text-white/40 uppercase tracking-wider">Ambient Sounds</span>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/70">Rain</span>
                      <span className="text-xs text-white/40">{settings.ambientSounds.rain}%</span>
                    </div>
                    <Slider
                      value={[settings.ambientSounds.rain]}
                      onValueChange={([v]) => setSettings(s => ({ ...s, ambientSounds: { ...s.ambientSounds, rain: v } }))}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/70">White Noise</span>
                      <span className="text-xs text-white/40">{settings.ambientSounds.whiteNoise}%</span>
                    </div>
                    <Slider
                      value={[settings.ambientSounds.whiteNoise]}
                      onValueChange={([v]) => setSettings(s => ({ ...s, ambientSounds: { ...s.ambientSounds, whiteNoise: v } }))}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Quotes Toggle */}
              <div className="space-y-3 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Quote className="h-4 w-4 text-white/50" />
                    <span className="text-sm text-white/80">Show Quotes</span>
                  </div>
                  <Switch 
                    checked={settings.showQuotes} 
                    onCheckedChange={(checked) => setSettings(s => ({ ...s, showQuotes: checked }))}
                  />
                </div>
                {settings.showQuotes && (
                  <Select 
                    value={String(settings.quoteFrequency)} 
                    onValueChange={(v) => setSettings(s => ({ ...s, quoteFrequency: parseInt(v) }))}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">Every 5 min</SelectItem>
                      <SelectItem value="10">Every 10 min</SelectItem>
                      <SelectItem value="15">Every 15 min</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Zen Mode */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <span className="text-sm text-white/80">Zen Mode</span>
                <Switch 
                  checked={settings.zenMode} 
                  onCheckedChange={(checked) => setSettings(s => ({ ...s, zenMode: checked }))}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}