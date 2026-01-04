import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTimezone } from "@/hooks/useTimezone";

type ClockMode = 'digital' | 'analog';

const STORAGE_KEY = 'inbalance-clock-mode';

export function LuxuryClock() {
  const [time, setTime] = useState(new Date());
  const [mode, setMode] = useState<ClockMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as ClockMode) || 'digital';
  });
  const { timezone, getTimeInTimezone } = useTimezone();

  // Stopwatch state
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setStopwatchTime(prev => prev + 10);
      }, 10);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatStopwatch = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
  };

  const handleStartPause = () => setIsRunning(!isRunning);
  const handleReset = () => {
    setIsRunning(false);
    setStopwatchTime(0);
  };

  // Analog clock calculations using timezone
  const { hours, minutes, seconds } = getTimeInTimezone(time);
  const hourDeg = (hours % 12 * 30) + (minutes * 0.5);
  const minuteDeg = (minutes * 6) + (seconds * 0.1);
  const secondDeg = seconds * 6;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Mode Toggle */}
      <div className="flex items-center gap-1 p-1 rounded-full bg-muted/30 border border-border/50">
        <button
          onClick={() => setMode('digital')}
          className={cn(
            "px-3 py-1 text-xs font-medium rounded-full transition-all",
            mode === 'digital' 
              ? "bg-primary text-primary-foreground" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Digital
        </button>
        <button
          onClick={() => setMode('analog')}
          className={cn(
            "px-3 py-1 text-xs font-medium rounded-full transition-all",
            mode === 'analog' 
              ? "bg-primary text-primary-foreground" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Analog
        </button>
      </div>

      {/* Clock Display */}
      {mode === 'digital' ? (
        <div className="relative">
          <div className="text-5xl font-extralight tracking-tight text-foreground tabular-nums">
            {time.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true,
              timeZone: timezone
            }).replace(' ', '')}
          </div>
          <div className="text-xs text-muted-foreground text-center mt-1">
            {time.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'short', 
              day: 'numeric',
              timeZone: timezone
            })}
          </div>
        </div>
      ) : (
        <div className="relative w-32 h-32">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-2 border-border bg-card shadow-lg">
            {/* Hour markers */}
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-0.5 h-2 bg-muted-foreground/50"
                style={{
                  left: '50%',
                  top: '4px',
                  transformOrigin: '50% 60px',
                  transform: `translateX(-50%) rotate(${i * 30}deg)`,
                }}
              />
            ))}
            
            {/* Hour hand */}
            <div
              className="absolute w-1 h-8 bg-foreground rounded-full"
              style={{
                left: '50%',
                bottom: '50%',
                transformOrigin: '50% 100%',
                transform: `translateX(-50%) rotate(${hourDeg}deg)`,
              }}
            />
            
            {/* Minute hand */}
            <div
              className="absolute w-0.5 h-10 bg-foreground rounded-full"
              style={{
                left: '50%',
                bottom: '50%',
                transformOrigin: '50% 100%',
                transform: `translateX(-50%) rotate(${minuteDeg}deg)`,
              }}
            />
            
            {/* Second hand */}
            <div
              className="absolute w-px h-11 bg-primary rounded-full"
              style={{
                left: '50%',
                bottom: '50%',
                transformOrigin: '50% 100%',
                transform: `translateX(-50%) rotate(${secondDeg}deg)`,
              }}
            />
            
            {/* Center dot */}
            <div className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-primary -translate-x-1/2 -translate-y-1/2" />
          </div>
        </div>
      )}

      {/* Stopwatch */}
      <div className="flex flex-col items-center gap-2 pt-2 border-t border-border/50">
        <div className="text-xl font-mono tabular-nums text-foreground">
          {formatStopwatch(stopwatchTime)}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleStartPause}
            className="h-8 px-3 gap-1.5"
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
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-8 px-3"
            disabled={stopwatchTime === 0}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
