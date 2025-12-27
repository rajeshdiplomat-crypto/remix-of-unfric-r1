import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Timer, Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TIMER_PRESETS = [
  { label: "5m", minutes: 5 },
  { label: "15m", minutes: 15 },
  { label: "25m", minutes: 25 },
  { label: "45m", minutes: 45 },
];

export function LargeClockWidget() {
  const [time, setTime] = useState(new Date());
  const [timerActive, setTimerActive] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timerRemaining, setTimerRemaining] = useState(25 * 60);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setTimerRemaining(prev => {
        if (prev <= 1) {
          setTimerRunning(false);
          playAlarm();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

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

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  // Calculate hand rotations
  const hourDeg = (hours % 12) * 30 + minutes * 0.5;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const secondDeg = seconds * 6;

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handlePresetClick = (mins: number) => {
    setTimerMinutes(mins);
    setTimerRemaining(mins * 60);
    setTimerActive(true);
    setTimerRunning(false);
  };

  const handleReset = () => {
    setTimerRemaining(timerMinutes * 60);
    setTimerRunning(false);
  };

  return (
    <Card className="bg-card border-border/50 h-full">
      <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[280px]">
        {/* Analog Clock */}
        <div className="relative w-44 h-44 mb-4">
          {/* Clock face */}
          <div className="absolute inset-0 rounded-full border-2 border-border/50 bg-background">
            {/* Hour markers */}
            {[...Array(12)].map((_, i) => {
              const angle = (i * 30 - 90) * (Math.PI / 180);
              const x = 50 + 42 * Math.cos(angle);
              const y = 50 + 42 * Math.sin(angle);
              return (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full bg-muted-foreground/60"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              );
            })}

            {/* Center dot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-primary" />
            </div>

            {/* Hour hand */}
            <div
              className="absolute left-1/2 bottom-1/2 w-1.5 h-10 bg-foreground rounded-full origin-bottom"
              style={{ transform: `translateX(-50%) rotate(${hourDeg}deg)` }}
            />

            {/* Minute hand */}
            <div
              className="absolute left-1/2 bottom-1/2 w-1 h-14 bg-foreground/80 rounded-full origin-bottom"
              style={{ transform: `translateX(-50%) rotate(${minuteDeg}deg)` }}
            />

            {/* Second hand */}
            <div
              className="absolute left-1/2 bottom-1/2 w-0.5 h-16 bg-primary rounded-full origin-bottom"
              style={{ transform: `translateX(-50%) rotate(${secondDeg}deg)` }}
            />
          </div>
        </div>

        {/* Digital time */}
        <p className="text-2xl font-bold text-foreground">
          {format(time, 'h:mm:ss a')}
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          {format(time, 'EEEE, MMMM d, yyyy')}
        </p>

        {/* Timer Section */}
        <div className="w-full border-t border-border/30 pt-4 mt-2">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Timer className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Quick Timer</span>
          </div>

          {/* Timer presets */}
          <div className="flex justify-center gap-2 mb-3">
            {TIMER_PRESETS.map((preset) => (
              <Button
                key={preset.minutes}
                variant={timerActive && timerMinutes === preset.minutes ? "default" : "outline"}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => handlePresetClick(preset.minutes)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Timer display & controls */}
          {timerActive && (
            <div className="flex items-center justify-center gap-3">
              <span className={cn(
                "text-xl font-mono font-bold",
                timerRemaining === 0 ? "text-destructive" : "text-foreground"
              )}>
                {formatTimer(timerRemaining)}
              </span>
              <Button
                variant={timerRunning ? "outline" : "default"}
                size="sm"
                onClick={() => setTimerRunning(!timerRunning)}
                className="h-8 w-8 p-0"
              >
                {timerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="h-8 w-8 p-0"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}