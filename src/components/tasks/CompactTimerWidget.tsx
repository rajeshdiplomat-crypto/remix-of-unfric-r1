import { useState, useEffect, useRef } from "react";
import { Timer, Play, Pause, RotateCcw, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const TIMER_PRESETS = [
  { label: "5", minutes: 5 },
  { label: "10", minutes: 10 },
  { label: "25", minutes: 25 },
  { label: "45", minutes: 45 },
];

const STORAGE_KEY = 'inbalance-compact-timer';

interface TimerState {
  mode: 'stopwatch' | 'timer';
  timerMinutes: number;
  timerRemaining: number;
  stopwatchElapsed: number;
  isRunning: boolean;
  startTimestamp: number | null;
}

export function CompactTimerWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'stopwatch' | 'timer'>('timer');
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timerRemaining, setTimerRemaining] = useState(25 * 60 * 1000);
  const [stopwatchElapsed, setStopwatchElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimestampRef = useRef<number | null>(null);

  // Load persisted state
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const state: TimerState = JSON.parse(stored);
        setMode(state.mode);
        setTimerMinutes(state.timerMinutes);
        setTimerRemaining(state.timerRemaining);
        setStopwatchElapsed(state.stopwatchElapsed);
        
        if (state.isRunning && state.startTimestamp) {
          const elapsed = Date.now() - state.startTimestamp;
          if (state.mode === 'stopwatch') {
            setStopwatchElapsed(state.stopwatchElapsed + elapsed);
          } else {
            const newRemaining = Math.max(0, state.timerRemaining - elapsed);
            setTimerRemaining(newRemaining);
            if (newRemaining > 0) {
              setIsRunning(true);
              startTimestampRef.current = Date.now();
            }
          }
        }
      } catch {}
    }
  }, []);

  // Persist state
  useEffect(() => {
    const state: TimerState = {
      mode,
      timerMinutes,
      timerRemaining,
      stopwatchElapsed,
      isRunning,
      startTimestamp: startTimestampRef.current,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [mode, timerMinutes, timerRemaining, stopwatchElapsed, isRunning]);

  // Timer/Stopwatch logic
  useEffect(() => {
    if (isRunning) {
      startTimestampRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        if (mode === 'stopwatch') {
          setStopwatchElapsed(prev => prev + 100);
        } else {
          setTimerRemaining(prev => {
            if (prev <= 100) {
              setIsRunning(false);
              playAlarm();
              return 0;
            }
            return prev - 100;
          });
        }
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode]);

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

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePresetClick = (minutes: number) => {
    setTimerMinutes(minutes);
    setTimerRemaining(minutes * 60 * 1000);
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    if (mode === 'stopwatch') {
      setStopwatchElapsed(0);
    } else {
      setTimerRemaining(timerMinutes * 60 * 1000);
    }
  };

  const currentTime = mode === 'stopwatch' ? stopwatchElapsed : timerRemaining;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 h-9 px-3 bg-card border-border/50 hover:bg-accent/50",
            isRunning && "border-primary/50 bg-primary/5"
          )}
        >
          <Timer className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium">
            {isRunning ? formatTime(currentTime) : "Timer"}
          </span>
          {isRunning && (
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 p-0 bg-card border-border/50" 
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
          <div className="flex gap-1">
            <Button
              variant={mode === 'stopwatch' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => { setMode('stopwatch'); setIsRunning(false); }}
            >
              <Clock className="h-3 w-3 mr-1" />
              Stopwatch
            </Button>
            <Button
              variant={mode === 'timer' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => { setMode('timer'); setIsRunning(false); }}
            >
              <Timer className="h-3 w-3 mr-1" />
              Timer
            </Button>
          </div>
        </div>

        {/* Timer Presets (Timer mode only) */}
        {mode === 'timer' && !isRunning && (
          <div className="flex justify-center gap-1.5 px-3 pt-3">
            {TIMER_PRESETS.map((preset) => (
              <Button
                key={preset.minutes}
                variant={timerMinutes === preset.minutes ? "default" : "outline"}
                size="sm"
                className="h-7 w-10 text-xs p-0"
                onClick={() => handlePresetClick(preset.minutes)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        )}

        {/* Time Display */}
        <div className="text-center py-4">
          <p className="text-3xl font-mono font-bold text-foreground tracking-wider">
            {formatTime(currentTime)}
          </p>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-2 px-3 pb-3">
          <Button
            variant={isRunning ? "outline" : "default"}
            size="sm"
            onClick={() => setIsRunning(!isRunning)}
            className="gap-1.5 h-8 flex-1"
          >
            {isRunning ? (
              <>
                <Pause className="h-3.5 w-3.5" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                Start
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-8 w-8 p-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
