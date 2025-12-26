import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Pause, RotateCcw, Check, Plus, Bell, BellOff, Image, Video, Quote, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { QuadrantTask, Subtask } from "@/components/tasks/types";
import { useToast } from "@/hooks/use-toast";

const TIMER_PRESETS = [
  { label: "25 min", minutes: 25 },
  { label: "50 min", minutes: 50 },
  { label: "90 min", minutes: 90 },
];

// Default wallpapers (gradient backgrounds)
const DEFAULT_WALLPAPERS = [
  { id: 'gradient-1', name: 'Calm Blue', type: 'gradient', value: 'linear-gradient(135deg, hsl(200 80% 20%) 0%, hsl(220 60% 30%) 100%)' },
  { id: 'gradient-2', name: 'Forest', type: 'gradient', value: 'linear-gradient(135deg, hsl(140 40% 15%) 0%, hsl(160 50% 25%) 100%)' },
  { id: 'gradient-3', name: 'Sunset', type: 'gradient', value: 'linear-gradient(135deg, hsl(20 60% 25%) 0%, hsl(340 50% 30%) 100%)' },
  { id: 'gradient-4', name: 'Midnight', type: 'gradient', value: 'linear-gradient(135deg, hsl(240 30% 10%) 0%, hsl(260 40% 20%) 100%)' },
  { id: 'gradient-5', name: 'Ocean', type: 'gradient', value: 'linear-gradient(135deg, hsl(190 70% 15%) 0%, hsl(210 80% 25%) 100%)' },
  { id: 'gradient-6', name: 'Lavender', type: 'gradient', value: 'linear-gradient(135deg, hsl(270 40% 20%) 0%, hsl(290 50% 30%) 100%)' },
  { id: 'gradient-7', name: 'Warm Sand', type: 'gradient', value: 'linear-gradient(135deg, hsl(35 40% 20%) 0%, hsl(25 50% 30%) 100%)' },
  { id: 'gradient-8', name: 'Northern Lights', type: 'gradient', value: 'linear-gradient(135deg, hsl(180 60% 15%) 0%, hsl(280 50% 25%) 50%, hsl(200 60% 20%) 100%)' },
];

// Video backgrounds (using placeholder video URLs - you can replace with actual URLs)
const VIDEO_BACKGROUNDS = [
  { id: 'video-1', name: 'Slow Clouds', url: 'https://assets.mixkit.co/videos/preview/mixkit-clouds-and-blue-sky-2408-large.mp4' },
  { id: 'video-2', name: 'Rain on Window', url: 'https://assets.mixkit.co/videos/preview/mixkit-rain-falling-on-the-water-of-a-lake-seen-up-18312-large.mp4' },
  { id: 'video-3', name: 'Fireplace', url: 'https://assets.mixkit.co/videos/preview/mixkit-fireplace-in-a-dark-room-4356-large.mp4' },
  { id: 'video-4', name: 'Beach Waves', url: 'https://assets.mixkit.co/videos/preview/mixkit-calm-waves-on-a-sunny-beach-4088-large.mp4' },
  { id: 'video-5', name: 'Starry Night', url: 'https://assets.mixkit.co/videos/preview/mixkit-milky-way-time-lapse-1909-large.mp4' },
];

// Inspirational quotes
const FOCUS_QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "Deep work is the ability to focus without distraction.", author: "Cal Newport" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
  { text: "Concentrate all your thoughts upon the work at hand.", author: "Alexander Graham Bell" },
  { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
  { text: "Where focus goes, energy flows.", author: "Tony Robbins" },
  { text: "Starve your distractions, feed your focus.", author: "Unknown" },
  { text: "You can do anything, but not everything.", author: "David Allen" },
  { text: "The main thing is to keep the main thing the main thing.", author: "Stephen Covey" },
];

const STORAGE_KEY = 'mindflow-deepfocus-settings';

interface DeepFocusSettings {
  wallpaperId: string;
  videoId: string | null;
  isVideoMode: boolean;
  showQuotes: boolean;
  quoteFrequency: number; // minutes
  customWallpaperUrl: string | null;
}

interface DeepFocusProps {
  tasks: QuadrantTask[];
  onUpdateTask: (task: QuadrantTask) => void;
}

export default function DeepFocus({ tasks, onUpdateTask }: DeepFocusProps) {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const task = tasks.find(t => t.id === taskId);

  const [timerMinutes, setTimerMinutes] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionMinutes, setSessionMinutes] = useState(0);
  const [notes, setNotes] = useState("");
  const [doNotDisturb, setDoNotDisturb] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [markComplete, setMarkComplete] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Background settings
  const [settings, setSettings] = useState<DeepFocusSettings>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch { }
    }
    return {
      wallpaperId: 'gradient-1',
      videoId: null,
      isVideoMode: false,
      showQuotes: true,
      quoteFrequency: 5,
      customWallpaperUrl: null,
    };
  });

  // Quote animation
  const [currentQuote, setCurrentQuote] = useState(FOCUS_QUOTES[0]);
  const [quoteVisible, setQuoteVisible] = useState(true);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Save settings
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

  useEffect(() => {
    setSecondsRemaining(timerMinutes * 60);
  }, [timerMinutes]);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = new Date();
      intervalRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            handleTimerEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const handleTimerEnd = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (startTimeRef.current) {
      const elapsed = Math.floor((new Date().getTime() - startTimeRef.current.getTime()) / 60000);
      setSessionMinutes(elapsed);
    } else {
      setSessionMinutes(timerMinutes);
    }
    
    setShowSummary(true);
    
    // Play alarm
    playAlarm();
    
    if (!doNotDisturb) {
      toast({ title: "Focus session complete!", description: `You focused for ${timerMinutes} minutes.` });
    }
  };

  const playAlarm = () => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = "sine";
    gainNode.gain.value = 0.3;
    
    oscillator.start();
    setTimeout(() => oscillator.stop(), 200);
    setTimeout(() => {
      const osc2 = audioCtx.createOscillator();
      osc2.connect(gainNode);
      osc2.frequency.value = 1000;
      osc2.start();
      setTimeout(() => osc2.stop(), 400);
    }, 300);
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

  const progress = ((timerMinutes * 60 - secondsRemaining) / (timerMinutes * 60)) * 100;

  const getBackground = () => {
    if (settings.isVideoMode && settings.videoId) {
      return 'transparent';
    }
    if (settings.customWallpaperUrl) {
      return `url(${settings.customWallpaperUrl})`;
    }
    const wallpaper = DEFAULT_WALLPAPERS.find(w => w.id === settings.wallpaperId);
    return wallpaper?.value || DEFAULT_WALLPAPERS[0].value;
  };

  const currentVideo = VIDEO_BACKGROUNDS.find(v => v.id === settings.videoId);

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Task not found</p>
          <Button variant="link" onClick={() => navigate('/tasks')}>
            Return to Tasks
          </Button>
        </div>
      </div>
    );
  }

  if (showSummary) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: getBackground(), backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <Card className="w-full max-w-md relative z-10 bg-card/90 backdrop-blur-md border-border/50">
          <CardContent className="pt-6 space-y-6">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Session Complete!</h2>
              <p className="text-muted-foreground mt-1">{task.title}</p>
            </div>

            <div className="bg-muted/30 rounded-xl p-4 text-center">
              <p className="text-4xl font-bold text-primary">{sessionMinutes}</p>
              <p className="text-sm text-muted-foreground">minutes focused</p>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl">
              <Checkbox
                checked={markComplete}
                onCheckedChange={(checked) => setMarkComplete(!!checked)}
              />
              <label className="text-sm font-medium cursor-pointer" onClick={() => setMarkComplete(!markComplete)}>
                Mark task as completed
              </label>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => navigate('/tasks')}>
                Skip
              </Button>
              <Button className="flex-1" onClick={handleSaveSummary}>
                Save Session
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Video Background */}
      {settings.isVideoMode && currentVideo && (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={currentVideo.url} type="video/mp4" />
        </video>
      )}

      {/* Static Background */}
      {!settings.isVideoMode && (
        <div 
          className="absolute inset-0" 
          style={{ 
            background: getBackground(),
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }} 
        />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />

      {/* Quote Overlay */}
      {settings.showQuotes && (
        <div className={cn(
          "absolute bottom-8 left-1/2 -translate-x-1/2 text-center max-w-lg px-6 transition-opacity duration-500",
          quoteVisible ? "opacity-100" : "opacity-0"
        )}>
          <p className="text-white/90 text-lg italic">"{currentQuote.text}"</p>
          <p className="text-white/60 text-sm mt-2">— {currentQuote.author}</p>
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 border-b border-white/10">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/tasks')} className="text-white hover:bg-white/10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-semibold text-lg text-white">{task.title}</h1>
                <p className="text-sm text-white/60">Deep Focus Mode</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={doNotDisturb ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setDoNotDisturb(!doNotDisturb)}
                className={cn(!doNotDisturb && "text-white hover:bg-white/10")}
              >
                {doNotDisturb ? <BellOff className="h-4 w-4 mr-2" /> : <Bell className="h-4 w-4 mr-2" />}
                {doNotDisturb ? "DND On" : "DND Off"}
              </Button>
              
              {/* Settings Popover */}
              <Popover open={showSettings} onOpenChange={setShowSettings}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                    <Settings2 className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Focus Environment</h3>
                    
                    {/* Background Type Toggle */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        Video Background
                      </span>
                      <Switch
                        checked={settings.isVideoMode}
                        onCheckedChange={(checked) => setSettings(s => ({ ...s, isVideoMode: checked }))}
                      />
                    </div>

                    {/* Wallpaper Selection */}
                    {!settings.isVideoMode && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Image className="h-4 w-4" />
                          Wallpaper
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {DEFAULT_WALLPAPERS.map((wp) => (
                            <button
                              key={wp.id}
                              onClick={() => setSettings(s => ({ ...s, wallpaperId: wp.id, customWallpaperUrl: null }))}
                              className={cn(
                                "h-12 rounded-lg border-2 transition-all",
                                settings.wallpaperId === wp.id && !settings.customWallpaperUrl
                                  ? "border-primary ring-2 ring-primary/30"
                                  : "border-border/50 hover:border-border"
                              )}
                              style={{ background: wp.value }}
                              title={wp.name}
                            />
                          ))}
                        </div>
                        <Input
                          placeholder="Custom image URL..."
                          value={settings.customWallpaperUrl || ''}
                          onChange={(e) => setSettings(s => ({ ...s, customWallpaperUrl: e.target.value || null }))}
                          className="text-sm"
                        />
                      </div>
                    )}

                    {/* Video Selection */}
                    {settings.isVideoMode && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Video</label>
                        <Select
                          value={settings.videoId || ''}
                          onValueChange={(v) => setSettings(s => ({ ...s, videoId: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a video..." />
                          </SelectTrigger>
                          <SelectContent>
                            {VIDEO_BACKGROUNDS.map((vid) => (
                              <SelectItem key={vid.id} value={vid.id}>
                                {vid.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Quote Settings */}
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm flex items-center gap-2">
                          <Quote className="h-4 w-4" />
                          Show Quotes
                        </span>
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
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">Every 5 min</SelectItem>
                            <SelectItem value="10">Every 10 min</SelectItem>
                            <SelectItem value="15">Every 15 min</SelectItem>
                            <SelectItem value="30">Once per session</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Timer Section */}
          <div className="space-y-6">
            <Card className="bg-card/80 backdrop-blur-md border-border/50">
              <CardContent className="pt-6">
                {/* Timer Display */}
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <div className="text-7xl font-mono font-bold text-foreground">
                      {formatTime(secondsRemaining)}
                    </div>
                    <Progress value={progress} className="h-2 mt-4" />
                  </div>
                </div>

                {/* Preset Buttons */}
                {!isRunning && (
                  <div className="flex justify-center gap-2 mb-6 flex-wrap">
                    {TIMER_PRESETS.map((preset) => (
                      <Button
                        key={preset.minutes}
                        variant={timerMinutes === preset.minutes ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTimerMinutes(preset.minutes)}
                      >
                        {preset.label}
                      </Button>
                    ))}
                    <Input
                      type="number"
                      min={1}
                      max={180}
                      value={timerMinutes}
                      onChange={(e) => setTimerMinutes(Math.max(1, parseInt(e.target.value) || 25))}
                      className="w-20 text-center"
                    />
                  </div>
                )}

                {/* Controls */}
                <div className="flex justify-center gap-3">
                  {!isRunning ? (
                    <Button size="lg" onClick={() => setIsRunning(true)}>
                      <Play className="h-5 w-5 mr-2" />
                      Start
                    </Button>
                  ) : (
                    <>
                      <Button size="lg" variant="outline" onClick={() => setIsRunning(false)}>
                        <Pause className="h-5 w-5 mr-2" />
                        Pause
                      </Button>
                      <Button size="lg" variant="destructive" onClick={handleEndSession}>
                        End Session
                      </Button>
                    </>
                  )}
                  {!isRunning && secondsRemaining < timerMinutes * 60 && (
                    <Button size="lg" variant="ghost" onClick={() => setSecondsRemaining(timerMinutes * 60)}>
                      <RotateCcw className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Focus Stats */}
            <Card className="bg-card/80 backdrop-blur-md border-border/50">
              <CardContent className="pt-6">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Focus Stats
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total focus time</span>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {task.total_focus_minutes || 0} min
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Task Details Section */}
          <div className="space-y-6">
            {/* Subtasks */}
            <Card className="bg-card/80 backdrop-blur-md border-border/50">
              <CardContent className="pt-6">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Subtasks
                </h3>
                <div className="space-y-2">
                  {task.subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-3">
                      <Checkbox
                        checked={subtask.completed}
                        onCheckedChange={() => handleSubtaskToggle(subtask.id)}
                      />
                      <span className={cn(
                        "flex-1 text-sm",
                        subtask.completed && "line-through text-muted-foreground"
                      )}>
                        {subtask.title}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 mt-3">
                    <Plus className="h-4 w-4 text-muted-foreground" />
                    <Input
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                      placeholder="Add subtask (Enter)"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="bg-card/80 backdrop-blur-md border-border/50">
              <CardContent className="pt-6">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Session Notes
                </h3>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Capture thoughts, insights, or blockers..."
                  rows={6}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}