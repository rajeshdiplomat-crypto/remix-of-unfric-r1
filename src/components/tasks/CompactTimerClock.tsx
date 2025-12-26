import { useState, useEffect, useRef } from "react";
import { Clock, Play, Pause, RotateCcw, Timer, Bell, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type Mode = 'stopwatch' | 'timer';
type ClockDisplay = 'digital' | 'analog';

const TIMER_PRESETS = [
  { label: "5m", minutes: 5 },
  { label: "10m", minutes: 10 },
  { label: "25m", minutes: 25 },
  { label: "45m", minutes: 45 },
  { label: "60m", minutes: 60 },
];

const STORAGE_KEY = 'mindflow-timer-state';

interface TimerState {
  mode: Mode;
  stopwatchTime: number;
  stopwatchRunning: boolean;
  timerDuration: number;
  timerRemaining: number;
  timerRunning: boolean;
  startTimestamp: number | null;
}

export function CompactTimerClock() {
  const { toast } = useToast();
  const [time, setTime] = useState(new Date());
  const [clockDisplay, setClockDisplay] = useState<ClockDisplay>('digital');
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Timer/Stopwatch state
  const [mode, setMode] = useState<Mode>('stopwatch');
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [timerDuration, setTimerDuration] = useState(25 * 60 * 1000); // 25 min default
  const [timerRemaining, setTimerRemaining] = useState(25 * 60 * 1000);
  const [timerRunning, setTimerRunning] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("");
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  
  const startTimestampRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load persisted state
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const state: TimerState = JSON.parse(stored);
        setMode(state.mode);
        
        if (state.stopwatchRunning && state.startTimestamp) {
          const elapsed = Date.now() - state.startTimestamp;
          setStopwatchTime(state.stopwatchTime + elapsed);
          setStopwatchRunning(true);
          startTimestampRef.current = Date.now();
        } else {
          setStopwatchTime(state.stopwatchTime);
        }
        
        if (state.timerRunning && state.startTimestamp) {
          const elapsed = Date.now() - state.startTimestamp;
          const remaining = Math.max(0, state.timerRemaining - elapsed);
          setTimerRemaining(remaining);
          setTimerDuration(state.timerDuration);
          if (remaining > 0) {
            setTimerRunning(true);
            startTimestampRef.current = Date.now();
          }
        } else {
          setTimerDuration(state.timerDuration);
          setTimerRemaining(state.timerRemaining);
        }
      } catch (e) {
        console.error("Failed to restore timer state");
      }
    }
  }, []);

  // Save state on changes
  useEffect(() => {
    const state: TimerState = {
      mode,
      stopwatchTime,
      stopwatchRunning,
      timerDuration,
      timerRemaining,
      timerRunning,
      startTimestamp: startTimestampRef.current,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [mode, stopwatchTime, stopwatchRunning, timerDuration, timerRemaining, timerRunning]);

  // Clock update
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Stopwatch logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (stopwatchRunning) {
      if (!startTimestampRef.current) {
        startTimestampRef.current = Date.now();
      }
      interval = setInterval(() => {
        setStopwatchTime(prev => prev + 10);
      }, 10);
    }
    return () => clearInterval(interval);
  }, [stopwatchRunning]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning && timerRemaining > 0) {
      if (!startTimestampRef.current) {
        startTimestampRef.current = Date.now();
      }
      interval = setInterval(() => {
        setTimerRemaining(prev => {
          const next = prev - 1000;
          if (next <= 0) {
            handleTimerEnd();
            return 0;
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerRemaining]);

  const handleTimerEnd = () => {
    setTimerRunning(false);
    startTimestampRef.current = null;
    
    // Play alarm sound
    if (!isMuted) {
      playAlarm();
    }
    
    toast({
      title: "⏰ Time's up!",
      description: "Your timer has finished.",
    });

    // Try to show notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Timer Complete", { body: "Your focus timer has finished!" });
    }
  };

  const playAlarm = () => {
    // Create a simple beep using Web Audio API
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = "sine";
    gainNode.gain.value = (volume / 100) * 0.3;
    
    oscillator.start();
    
    // Beep pattern
    setTimeout(() => oscillator.stop(), 200);
    setTimeout(() => {
      const osc2 = audioCtx.createOscillator();
      osc2.connect(gainNode);
      osc2.frequency.value = 800;
      osc2.start();
      setTimeout(() => osc2.stop(), 200);
    }, 300);
    setTimeout(() => {
      const osc3 = audioCtx.createOscillator();
      osc3.connect(gainNode);
      osc3.frequency.value = 1000;
      osc3.start();
      setTimeout(() => osc3.stop(), 400);
    }, 600);
  };

  const formatStopwatch = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centis = Math.floor((ms % 1000) / 10);
    
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
  };

  const formatTimer = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleStopwatchToggle = () => {
    if (stopwatchRunning) {
      startTimestampRef.current = null;
    } else {
      startTimestampRef.current = Date.now();
    }
    setStopwatchRunning(!stopwatchRunning);
  };

  const handleStopwatchReset = () => {
    setStopwatchRunning(false);
    setStopwatchTime(0);
    startTimestampRef.current = null;
  };

  const handleTimerToggle = () => {
    if (timerRunning) {
      startTimestampRef.current = null;
    } else {
      startTimestampRef.current = Date.now();
      // Request notification permission
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
    setTimerRunning(!timerRunning);
  };

  const handleTimerReset = () => {
    setTimerRunning(false);
    setTimerRemaining(timerDuration);
    startTimestampRef.current = null;
  };

  const handlePresetClick = (minutes: number) => {
    const ms = minutes * 60 * 1000;
    setTimerDuration(ms);
    setTimerRemaining(ms);
    setTimerRunning(false);
    startTimestampRef.current = null;
  };

  const handleCustomTimer = () => {
    const mins = parseInt(customMinutes);
    if (!isNaN(mins) && mins > 0) {
      const ms = mins * 60 * 1000;
      setTimerDuration(ms);
      setTimerRemaining(ms);
      setCustomMinutes("");
    }
  };

  const currentTime = time.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  const isActive = stopwatchRunning || timerRunning;

  return (
    <Popover open={isExpanded} onOpenChange={setIsExpanded}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all",
            "hover:bg-muted/50 text-sm font-medium",
            isActive 
              ? "border-primary bg-primary/5 text-primary" 
              : "border-border/50 bg-card text-foreground"
          )}
        >
          <Clock className="h-3.5 w-3.5" />
          <span className="tabular-nums">{currentTime}</span>
          {isActive && (
            <span className="flex items-center gap-1 text-xs text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              {mode === 'stopwatch' ? formatStopwatch(stopwatchTime).split('.')[0] : formatTimer(timerRemaining)}
            </span>
          )}
        </button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-4" align="center">
        <div className="space-y-4">
          {/* Clock Display */}
          <div className="text-center">
            <div className="text-3xl font-light tabular-nums text-foreground">
              {currentTime}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {time.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex p-1 bg-muted/30 rounded-lg">
            <button
              onClick={() => setMode('stopwatch')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all",
                mode === 'stopwatch' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              Stopwatch
            </button>
            <button
              onClick={() => setMode('timer')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all",
                mode === 'timer' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
              )}
            >
              <Timer className="h-3.5 w-3.5" />
              Timer
            </button>
          </div>

          {/* Stopwatch */}
          {mode === 'stopwatch' && (
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-2xl font-mono tabular-nums text-foreground">
                  {formatStopwatch(stopwatchTime)}
                </div>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button size="sm" onClick={handleStopwatchToggle} className="gap-1.5">
                  {stopwatchRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  {stopwatchRunning ? "Pause" : "Start"}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleStopwatchReset}
                  disabled={stopwatchTime === 0}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* Timer */}
          {mode === 'timer' && (
            <div className="space-y-3">
              <div className="text-center">
                <div className={cn(
                  "text-2xl font-mono tabular-nums",
                  timerRemaining <= 60000 && timerRunning ? "text-destructive" : "text-foreground"
                )}>
                  {formatTimer(timerRemaining)}
                </div>
              </div>

              {/* Presets */}
              {!timerRunning && (
                <div className="flex flex-wrap justify-center gap-1.5">
                  {TIMER_PRESETS.map((preset) => (
                    <button
                      key={preset.minutes}
                      onClick={() => handlePresetClick(preset.minutes)}
                      className={cn(
                        "px-2.5 py-1 text-xs rounded-full transition-all",
                        timerDuration === preset.minutes * 60 * 1000
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Custom input */}
              {!timerRunning && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={180}
                    placeholder="Custom min"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCustomTimer()}
                    className="h-8 text-sm"
                  />
                  <Button size="sm" variant="outline" onClick={handleCustomTimer}>
                    Set
                  </Button>
                </div>
              )}

              <div className="flex items-center justify-center gap-2">
                <Button size="sm" onClick={handleTimerToggle} className="gap-1.5">
                  {timerRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  {timerRunning ? "Pause" : "Start"}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleTimerReset}
                  disabled={timerRemaining === timerDuration && !timerRunning}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Volume control */}
              <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  onValueChange={(v) => { setVolume(v[0]); setIsMuted(false); }}
                  max={100}
                  step={10}
                  className="flex-1"
                />
                <Bell className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}