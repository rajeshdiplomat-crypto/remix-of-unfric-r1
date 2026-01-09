import { useState, useEffect, useRef } from "react";
import { Clock, Play, Pause, RotateCcw, Timer, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type Mode = 'stopwatch' | 'timer';

const TIMER_PRESETS = [
  { label: "5m", minutes: 5 },
  { label: "15m", minutes: 15 },
  { label: "25m", minutes: 25 },
  { label: "45m", minutes: 45 },
];

const STORAGE_KEY = 'unfric-timer-state';

interface TimerState {
  mode: Mode;
  stopwatchTime: number;
  stopwatchRunning: boolean;
  timerDuration: number;
  timerRemaining: number;
  timerRunning: boolean;
  startTimestamp: number | null;
}

export function TimeToolsPanel() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  
  // Timer/Stopwatch state
  const [mode, setMode] = useState<Mode>('stopwatch');
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [timerDuration, setTimerDuration] = useState(25 * 60 * 1000);
  const [timerRemaining, setTimerRemaining] = useState(25 * 60 * 1000);
  const [timerRunning, setTimerRunning] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("");
  
  const startTimestampRef = useRef<number | null>(null);

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
          setIsOpen(true); // Auto-expand if running
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
            setIsOpen(true); // Auto-expand if running
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
    playAlarm();
    toast({
      title: "⏰ Time's up!",
      description: "Your timer has finished.",
    });
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Timer Complete", { body: "Your focus timer has finished!" });
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
    gainNode.gain.value = 0.2;
    oscillator.start();
    setTimeout(() => oscillator.stop(), 200);
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

  const isActive = stopwatchRunning || timerRunning;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      {/* Divider */}
      <div className="border-t border-border/30 my-3" />
      
      {/* Trigger */}
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <span className="flex items-center gap-1.5">
            {mode === 'stopwatch' ? <Clock className="h-3 w-3" /> : <Timer className="h-3 w-3" />}
            <span>Tools</span>
            {isActive && (
              <span className="flex items-center gap-1 text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                {mode === 'stopwatch' ? formatStopwatch(stopwatchTime).split('.')[0] : formatTimer(timerRemaining)}
              </span>
            )}
          </span>
          {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-3 pt-2">
        {/* Mode Tabs */}
        <div className="flex p-0.5 bg-muted/20 rounded-md">
          <button
            onClick={() => setMode('stopwatch')}
            className={cn(
              "flex-1 flex items-center justify-center gap-1 py-1 text-xs font-medium rounded transition-all",
              mode === 'stopwatch' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            <Clock className="h-3 w-3" />
            Stopwatch
          </button>
          <button
            onClick={() => setMode('timer')}
            className={cn(
              "flex-1 flex items-center justify-center gap-1 py-1 text-xs font-medium rounded transition-all",
              mode === 'timer' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            <Timer className="h-3 w-3" />
            Timer
          </button>
        </div>

        {/* Stopwatch */}
        {mode === 'stopwatch' && (
          <div className="space-y-2">
            <div className="text-center">
              <div className="text-lg font-mono tabular-nums text-foreground">
                {formatStopwatch(stopwatchTime)}
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button size="sm" variant="outline" onClick={handleStopwatchToggle} className="gap-1 h-7 text-xs">
                {stopwatchRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                {stopwatchRunning ? "Pause" : "Start"}
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleStopwatchReset}
                disabled={stopwatchTime === 0}
                className="h-7"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Timer */}
        {mode === 'timer' && (
          <div className="space-y-2">
            <div className="text-center">
              <div className={cn(
                "text-lg font-mono tabular-nums",
                timerRemaining <= 60000 && timerRunning ? "text-destructive" : "text-foreground"
              )}>
                {formatTimer(timerRemaining)}
              </div>
            </div>

            {/* Presets */}
            {!timerRunning && (
              <div className="flex flex-wrap justify-center gap-1">
                {TIMER_PRESETS.map((preset) => (
                  <button
                    key={preset.minutes}
                    onClick={() => handlePresetClick(preset.minutes)}
                    className={cn(
                      "px-2 py-0.5 text-xs rounded transition-all",
                      timerDuration === preset.minutes * 60 * 1000
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}

            {/* Custom input */}
            {!timerRunning && (
              <div className="flex gap-1">
                <Input
                  type="number"
                  placeholder="min"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  className="h-7 text-xs"
                  min={1}
                  onKeyDown={(e) => e.key === 'Enter' && handleCustomTimer()}
                />
                <Button size="sm" variant="outline" onClick={handleCustomTimer} className="h-7 text-xs">
                  Set
                </Button>
              </div>
            )}

            <div className="flex items-center justify-center gap-2">
              <Button size="sm" variant="outline" onClick={handleTimerToggle} className="gap-1 h-7 text-xs">
                {timerRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                {timerRunning ? "Pause" : "Start"}
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleTimerReset}
                disabled={timerRemaining === timerDuration && !timerRunning}
                className="h-7"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
