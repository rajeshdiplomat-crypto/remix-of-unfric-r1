import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Pause, RotateCcw, Check, Plus, Bell, BellOff, Video, Quote, Settings2, Volume2, VolumeX, Music, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { QuadrantTask, Subtask } from "@/components/tasks/types";
import { useToast } from "@/hooks/use-toast";
import { format, subDays } from "date-fns";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

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

const STORAGE_KEY = 'mindflow-deepfocus-premium-settings';

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
  const [showEnvironment, setShowEnvironment] = useState(true);
  
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
        focus: Math.floor(Math.random() * 60) + 10, // Mock data
      });
    }
    return data;
  }, []);

  const currentWallpaper = DEFAULT_WALLPAPERS.find(w => w.id === settings.wallpaperId) || DEFAULT_WALLPAPERS[0];

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Task not found</p>
          <Button variant="link" onClick={() => navigate('/tasks')}>Return to Tasks</Button>
        </div>
      </div>
    );
  }

  if (showSummary) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{ 
          backgroundImage: `url(${currentWallpaper.url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <Card className="w-full max-w-md relative z-10 bg-slate-900/80 backdrop-blur-xl border-white/10">
          <CardContent className="pt-6 space-y-6">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-white">Session Complete!</h2>
              <p className="text-white/60 mt-1">{task.title}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <p className="text-4xl font-bold text-white">{sessionMinutes}</p>
              <p className="text-sm text-white/60">minutes focused</p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <Checkbox checked={markComplete} onCheckedChange={(c) => setMarkComplete(!!c)} className="border-white/30" />
              <label className="text-sm text-white cursor-pointer" onClick={() => setMarkComplete(!markComplete)}>
                Mark task as completed
              </label>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 bg-transparent border-white/20 text-white hover:bg-white/10" onClick={() => navigate('/tasks')}>Skip</Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleSaveSummary}>Save Session</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${currentWallpaper.url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {/* Grain texture */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} 
      />

      {/* Quote Overlay */}
      {settings.showQuotes && !settings.zenMode && (
        <div className={cn(
          "absolute bottom-8 left-8 max-w-md transition-opacity duration-500",
          quoteVisible ? "opacity-100" : "opacity-0"
        )}>
          <p className="text-white/90 text-xl italic font-light">"{currentQuote.text}"</p>
          {currentQuote.author && (
            <p className="text-white/50 text-sm mt-2">— {currentQuote.author}</p>
          )}
        </div>
      )}

      {/* Header */}
      <div className="relative z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/tasks')} 
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-semibold text-lg text-white">Deep Focus Mode</h1>
                <p className="text-sm text-white/50">{task.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm">
                <div className={cn("h-2 w-2 rounded-full", doNotDisturb ? "bg-red-400" : "bg-green-400")} />
                <span className="text-sm text-white/80">DND {doNotDisturb ? 'On' : 'Off'}</span>
                <Switch 
                  checked={doNotDisturb} 
                  onCheckedChange={setDoNotDisturb}
                  className="scale-75"
                />
              </div>
              <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10">
                <Settings2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-6 py-4">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_380px_280px] gap-6">
          
          {/* LEFT - Timer Section */}
          <div className="flex flex-col items-center justify-center">
            <Card className="bg-slate-900/60 backdrop-blur-xl border-white/10 w-full max-w-md">
              <CardContent className="pt-8 pb-8 px-8">
                {/* Timer Ring */}
                <div className="relative flex items-center justify-center mb-6">
                  <svg className="w-56 h-56 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                    <circle 
                      cx="60" cy="60" r="54" 
                      fill="none" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 54}`}
                      strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress / 100)}`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-5xl font-light text-white tracking-wide">
                      {formatTime(secondsRemaining)}
                    </span>
                  </div>
                </div>

                {/* Timer Mode Selector */}
                <div className="flex justify-center gap-2 mb-6">
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
                        "text-sm px-4",
                        timerMode === mode 
                          ? "bg-white/20 text-white" 
                          : "text-white/50 hover:text-white hover:bg-white/10"
                      )}
                    >
                      {mode}
                    </Button>
                  ))}
                </div>

                {/* Main Control */}
                <div className="flex justify-center mb-4">
                  {!isRunning ? (
                    <Button 
                      size="lg" 
                      onClick={() => setIsRunning(true)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
                    >
                      <Play className="h-5 w-5 mr-2" />
                      Start
                    </Button>
                  ) : (
                    <div className="flex gap-3">
                      <Button 
                        size="lg" 
                        variant="outline" 
                        onClick={() => setIsRunning(false)}
                        className="bg-transparent border-white/20 text-white hover:bg-white/10"
                      >
                        <Pause className="h-5 w-5 mr-2" />
                        Pause
                      </Button>
                    </div>
                  )}
                </div>

                {/* End Time */}
                {timerMode !== 'Stopwatch' && (
                  <p className="text-center text-white/50 text-sm">
                    Ends at {endTime}
                  </p>
                )}

                {/* Quick Actions */}
                <div className="flex justify-center gap-4 mt-6 pt-4 border-t border-white/10">
                  <Button variant="ghost" size="icon" className="text-white/50 hover:text-white hover:bg-white/10">
                    <Bell className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-white/50 hover:text-white hover:bg-white/10">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-white/50 hover:text-white hover:bg-white/10">
                    <Volume2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-white/50 hover:text-white hover:bg-white/10">
                    <Music className="h-4 w-4" />
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
                    className="text-white/50 hover:text-white hover:bg-white/10"
                  >
                    <Undo2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CENTER - Task Panel */}
          <Card className="bg-slate-900/60 backdrop-blur-xl border-white/10 h-fit">
            <CardContent className="p-0">
              {/* Header with Environment toggle */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Quote className="h-4 w-4 text-white/50" />
                  <span className="text-sm text-white/80">Focus Environment</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <Settings2 className="h-4 w-4" />
                  <span>Settings</span>
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <TabsList className="w-full grid grid-cols-3 bg-transparent border-b border-white/10 rounded-none h-auto p-0">
                  {(['subtasks', 'notes', 'stats'] as const).map(tab => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      className={cn(
                        "py-3 text-sm capitalize rounded-none border-b-2 border-transparent",
                        "data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-primary",
                        "text-white/50 hover:text-white/80"
                      )}
                    >
                      {tab === 'subtasks' ? 'Subtasks' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* Subtasks Tab */}
                <TabsContent value="subtasks" className="p-4 space-y-4">
                  <div className="text-xs text-white/50 uppercase tracking-wider">Now: Doing</div>
                  <div className="space-y-2">
                    {task.subtasks.map(subtask => (
                      <div 
                        key={subtask.id} 
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg transition-all",
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
                          subtask.completed && "line-through text-white/50"
                        )}>
                          {subtask.title}
                        </span>
                        {subtask.completed && <Check className="h-4 w-4 text-primary" />}
                      </div>
                    ))}
                    <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-white/20">
                      <Plus className="h-4 w-4 text-white/40" />
                      <Input
                        value={newSubtask}
                        onChange={(e) => setNewSubtask(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                        placeholder="Add subtask (Enter)"
                        className="bg-transparent border-none text-white placeholder:text-white/40 p-0 h-auto focus-visible:ring-0"
                      />
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-white/60">Progress {Math.round(subtaskProgress)}%</span>
                      <span className="text-white/40">{completedSubtasks}/{totalSubtasks}</span>
                    </div>
                    <Progress value={subtaskProgress} className="h-1.5 bg-white/10" />
                  </div>

                  {/* Today Stats */}
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-white/50 uppercase tracking-wider">TODAY</span>
                      <span className="text-sm text-white/80">{task.total_focus_minutes || 0}m</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/60">This Task:</span>
                      <span className="text-2xl font-bold text-white">{task.total_focus_minutes || 0}m</span>
                    </div>
                  </div>
                </TabsContent>

                {/* Notes Tab */}
                <TabsContent value="notes" className="p-4">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Capture thoughts, insights, or blockers..."
                    rows={10}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40 resize-none"
                  />
                </TabsContent>

                {/* Stats Tab */}
                <TabsContent value="stats" className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">Today focus time</span>
                    <span className="text-lg font-semibold text-white">{task.total_focus_minutes || 0}m</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">Current task focus</span>
                    <span className="text-lg font-semibold text-white">{task.total_focus_minutes || 0}m</span>
                  </div>
                  <div className="h-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weeklyData}>
                        <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} axisLine={false} tickLine={false} />
                        <Line type="monotone" dataKey="focus" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Bottom Actions */}
              <div className="p-4 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/50">To: </span>
                  <span className="text-sm text-white/80">11:00</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => setIsRunning(true)}
                    className="bg-primary hover:bg-primary/90"
                    disabled={isRunning}
                  >
                    <Play className="h-3.5 w-3.5 mr-1" />
                    Start
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleEndSession}
                    className="bg-transparent border-white/20 text-white hover:bg-white/10"
                  >
                    End Session
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RIGHT - Environment Panel */}
          <Card className="bg-slate-900/60 backdrop-blur-xl border-white/10 h-fit">
            <CardContent className="p-4 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">Focus Environment</span>
                <Switch checked={showEnvironment} onCheckedChange={setShowEnvironment} />
              </div>

              {/* Video Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-white/50" />
                  <span className="text-sm text-white/80">Video</span>
                </div>
              </div>

              {/* Wallpaper Grid */}
              <div className="grid grid-cols-4 gap-2">
                {DEFAULT_WALLPAPERS.slice(0, 8).map(wp => (
                  <button
                    key={wp.id}
                    onClick={() => setSettings(s => ({ ...s, wallpaperId: wp.id }))}
                    className={cn(
                      "aspect-square rounded-lg overflow-hidden border-2 transition-all",
                      settings.wallpaperId === wp.id ? "border-primary" : "border-transparent hover:border-white/30"
                    )}
                  >
                    <img src={wp.url} alt={wp.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              {/* Ambient Sounds */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/80">Ambient Sounds</span>
                  <Switch 
                    checked={settings.ambientSounds.rain > 0 || settings.ambientSounds.whiteNoise > 0} 
                    onCheckedChange={(checked) => {
                      if (!checked) {
                        setSettings(s => ({ ...s, ambientSounds: { rain: 0, whiteNoise: 0 } }));
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/50 w-20">Rain</span>
                    <Slider
                      value={[settings.ambientSounds.rain]}
                      onValueChange={([v]) => setSettings(s => ({ ...s, ambientSounds: { ...s.ambientSounds, rain: v } }))}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
                    <Volume2 className="h-4 w-4 text-white/40" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/50 w-20">White Noise</span>
                    <Slider
                      value={[settings.ambientSounds.whiteNoise]}
                      onValueChange={([v]) => setSettings(s => ({ ...s, ambientSounds: { ...s.ambientSounds, whiteNoise: v } }))}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
                    <Volume2 className="h-4 w-4 text-white/40" />
                  </div>
                </div>
              </div>

              {/* Quotes Toggle */}
              <div className="space-y-2">
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
                    <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm">
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
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-sm text-white/80">Zen Mode</span>
                <Switch 
                  checked={settings.zenMode} 
                  onCheckedChange={(checked) => setSettings(s => ({ ...s, zenMode: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
