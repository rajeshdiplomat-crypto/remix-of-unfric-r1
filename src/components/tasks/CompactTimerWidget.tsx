import { useState, useEffect, useRef } from "react";
import { Timer, Play, Pause, RotateCcw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const TIMER_PRESETS = [
  { label: "5 min", minutes: 5 },
  { label: "10 min", minutes: 10 },
  { label: "25 min", minutes: 25 },
];

const STORAGE_KEY = 'mindflow-compact-timer';

interface TimerState {
  mode: 'stopwatch' | 'timer';
  timerMinutes: number;
  timerRemaining: number;
  stopwatchElapsed: number;
  isRunning: boolean;
  startTimestamp: number | null;
}

export function CompactTimerWidget() {
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
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 800;
    gain.gain.value = 0.3;
    osc.start();
    setTimeout(() => osc.stop(), 300);
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
    <Card className="bg-card border-border/50 shadow-sm">
      <CardContent className="p-4 space-y-4">
        {/* Mode Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Stopwatch</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Timer</span>
            <Switch
              checked={mode === 'timer'}
              onCheckedChange={(checked) => {
                setMode(checked ? 'timer' : 'stopwatch');
                setIsRunning(false);
              }}
            />
          </div>
        </div>

        {/* Timer Presets */}
        {mode === 'timer' && !isRunning && (
          <div className="flex justify-center gap-2">
            {TIMER_PRESETS.map((preset) => (
              <Button
                key={preset.minutes}
                variant={timerMinutes === preset.minutes ? "default" : "outline"}
                size="sm"
                className="text-xs px-3"
                onClick={() => handlePresetClick(preset.minutes)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        )}

        {/* Time Display */}
        <div className="text-center">
          <p className="text-4xl font-mono font-bold text-foreground">
            {formatTime(currentTime)}
          </p>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-2">
          <Button
            variant={isRunning ? "outline" : "default"}
            size="sm"
            onClick={() => setIsRunning(!isRunning)}
            className="gap-1"
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
            className="gap-1"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>

        {/* Quick Actions Row */}
        <div className="flex justify-center gap-4 pt-2 border-t border-border/30">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Timer className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Clock className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
