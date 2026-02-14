import { useEffect, useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTimezone } from "@/hooks/useTimezone";
import { Clock, Timer, Hourglass, Calendar, Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type WidgetMode = "digital" | "analog" | "stopwatch" | "timer" | "calendar";

const STORAGE_KEY = 'unfric-clock-widget-mode';

const TIMER_PRESETS = [
  { label: "5m", seconds: 5 * 60 },
  { label: "15m", seconds: 15 * 60 },
  { label: "25m", seconds: 25 * 60 },
  { label: "45m", seconds: 45 * 60 },
];

export function TasksClockWidget() {
  const [mode, setMode] = useState<WidgetMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && ['digital', 'analog', 'stopwatch', 'timer', 'calendar'].includes(stored)) {
        return stored as WidgetMode;
      }
    }
    return 'digital';
  });

  // Persist mode to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);
  const [now, setNow] = useState(new Date());
  const { timezone } = useTimezone();

  // Stopwatch state
  const [stopwatchMs, setStopwatchMs] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRemaining, setTimerRemaining] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Stopwatch tick
  useEffect(() => {
    if (!stopwatchRunning) return;
    const interval = setInterval(() => setStopwatchMs(prev => prev + 10), 10);
    return () => clearInterval(interval);
  }, [stopwatchRunning]);

  // Timer tick
  useEffect(() => {
    if (!timerRunning || timerRemaining <= 0) return;
    const interval = setInterval(() => {
      setTimerRemaining(prev => {
        if (prev <= 1) {
          setTimerRunning(false);
          // Play simple beep
          try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            osc.connect(ctx.destination);
            osc.frequency.value = 880;
            osc.start();
            osc.stop(ctx.currentTime + 0.2);
          } catch {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timerRemaining]);

  const formatStopwatch = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const centis = Math.floor((ms % 1000) / 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`;
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Analog clock calculations
  const seconds = now.getSeconds();
  const minutes = now.getMinutes();
  const hours = now.getHours() % 12;
  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = hours * 30 + minutes * 0.5;

  // Calendar data
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const start = startOfWeek(monthStart);
    const end = endOfWeek(monthEnd);
    return eachDayOfInterval({ start, end });
  }, [calendarMonth]);

  const modeButtons = [
    { id: "digital" as WidgetMode, icon: Clock, label: "Digital" },
    { id: "analog" as WidgetMode, icon: Clock, label: "Analog" },
    { id: "stopwatch" as WidgetMode, icon: Hourglass, label: "Stopwatch" },
    { id: "timer" as WidgetMode, icon: Timer, label: "Timer" },
    { id: "calendar" as WidgetMode, icon: Calendar, label: "Calendar" },
  ];

  return (
    <div className="h-full w-full relative overflow-hidden">
      {/* Subtle background effects */}
      <div className="absolute top-0 right-0 -mr-12 -mt-12 w-40 h-40 bg-gradient-to-br from-primary/8 to-transparent rounded-full blur-2xl pointer-events-none" />

      <div className="p-3 h-full flex flex-col">
        {/* Mode Switcher */}
        <div className="flex items-center justify-center gap-1 mb-3">
          {modeButtons.map(({ id, icon: Icon }) => (
            <Button
              key={id}
              variant="ghost"
              size="sm"
              onClick={() => setMode(id)}
              className={cn(
                "h-7 w-7 p-0 rounded-lg transition-all",
                mode === id 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </Button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex items-center justify-center">
          {mode === "digital" && (
            <div className="text-center space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-[0.4em] text-primary/70">
                {format(now, "EEEE")}
              </div>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-black tracking-tight bg-gradient-to-br from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent drop-shadow-sm">
                  {format(now, "h:mm")}
                </span>
                <div className="flex flex-col items-start ml-1">
                  <span className="text-sm font-bold text-primary/60">
                    {format(now, "a")}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground/50 tabular-nums">
                    {format(now, "ss")}
                  </span>
                </div>
              </div>
              <div className="text-xs font-medium text-muted-foreground/80 tracking-wide">
                {format(now, "MMMM do, yyyy")}
              </div>
            </div>
          )}

          {mode === "analog" && (
            <div className="relative w-36 h-36">
              {/* Outer luxury ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 via-muted/30 to-primary/10 shadow-lg" />
              
              {/* Inner clock face */}
              <div className="absolute inset-1 rounded-full bg-gradient-to-br from-card via-card to-muted/20 border border-border/30 shadow-inner" />
              
              {/* Subtle inner shadow ring */}
              <div className="absolute inset-2 rounded-full border border-muted-foreground/10" />
              
              {/* Hour markers */}
              {[...Array(12)].map((_, i) => {
                const isCardinal = i % 3 === 0;
                return (
                  <div
                    key={i}
                    className={cn(
                      "absolute left-1/2 -translate-x-1/2",
                      isCardinal 
                        ? "w-2 h-2 rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-sm" 
                        : "w-0.5 h-2 bg-muted-foreground/50 rounded-full"
                    )}
                    style={{
                      top: isCardinal ? '8px' : '10px',
                      transform: `translateX(-50%) rotate(${i * 30}deg)`,
                      transformOrigin: isCardinal ? '50% 64px' : '50% 62px',
                    }}
                  />
                );
              })}
              
              {/* Hour hand - thick, elegant */}
              <div
                className="absolute w-1.5 h-9 left-1/2 bottom-1/2 origin-bottom rounded-full bg-gradient-to-t from-foreground to-foreground/80 shadow-md"
                style={{ transform: `translateX(-50%) rotate(${hourDeg}deg)` }}
              />
              
              {/* Minute hand - sleek */}
              <div
                className="absolute w-1 h-12 left-1/2 bottom-1/2 origin-bottom rounded-full bg-gradient-to-t from-foreground/90 to-foreground/60 shadow-sm"
                style={{ transform: `translateX(-50%) rotate(${minuteDeg}deg)` }}
              />
              
              {/* Second hand - accent color with tail */}
              <div
                className="absolute w-[2px] h-14 left-1/2 bottom-1/2 origin-[50%_85%] rounded-full"
                style={{ transform: `translateX(-50%) rotate(${secondDeg}deg)` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary to-primary/50 rounded-full" />
                <div className="absolute bottom-0 w-full h-3 bg-primary/60 rounded-full" />
              </div>
              
              {/* Center dot - luxury with glow */}
              <div className="absolute w-4 h-4 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary via-primary to-primary/80 shadow-lg" />
                <div className="absolute inset-1 rounded-full bg-gradient-to-br from-primary-foreground/30 to-transparent" />
              </div>
            </div>
          )}

          {mode === "stopwatch" && (
            <div className="text-center space-y-3">
              <div className="text-3xl font-mono font-bold tracking-wider text-foreground tabular-nums">
                {formatStopwatch(stopwatchMs)}
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant={stopwatchRunning ? "outline" : "default"}
                  onClick={() => setStopwatchRunning(!stopwatchRunning)}
                  className="h-8 px-3"
                >
                  {stopwatchRunning ? <Pause className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
                  {stopwatchRunning ? "Pause" : "Start"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setStopwatchMs(0); setStopwatchRunning(false); }}
                  disabled={stopwatchMs === 0}
                  className="h-8 px-2"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {mode === "timer" && (
            <div className="text-center space-y-2">
              <div className={cn(
                "text-3xl font-mono font-bold tracking-wider tabular-nums transition-colors",
                timerRemaining === 0 ? "text-destructive" : "text-foreground"
              )}>
                {formatTimer(timerRemaining)}
              </div>
              
              {/* Presets */}
              <div className="flex items-center justify-center gap-1">
                {TIMER_PRESETS.map(preset => (
                  <Button
                    key={preset.label}
                    size="sm"
                    variant={timerSeconds === preset.seconds ? "default" : "ghost"}
                    onClick={() => { setTimerSeconds(preset.seconds); setTimerRemaining(preset.seconds); setTimerRunning(false); }}
                    className="h-6 px-2 text-[10px]"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              <div className="flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant={timerRunning ? "outline" : "default"}
                  onClick={() => setTimerRunning(!timerRunning)}
                  disabled={timerRemaining === 0}
                  className="h-7 px-3"
                >
                  {timerRunning ? <Pause className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
                  {timerRunning ? "Pause" : "Start"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setTimerRemaining(timerSeconds); setTimerRunning(false); }}
                  className="h-7 px-2"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {mode === "calendar" && (
            <div className="w-full space-y-1">
              {/* Month nav */}
              <div className="flex items-center justify-between px-1">
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}>
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {format(calendarMonth, "MMM yyyy")}
                </span>
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}>
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
              
              {/* Days header */}
              <div className="grid grid-cols-7 gap-0.5 text-center">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <span key={i} className="text-[8px] font-medium text-muted-foreground/50">{d}</span>
                ))}
              </div>
              
              {/* Days grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {calendarDays.map((day, i) => {
                  const isToday = isSameDay(day, now);
                  const isCurrentMonth = day.getMonth() === calendarMonth.getMonth();
                  return (
                    <div
                      key={i}
                      className={cn(
                        "aspect-square flex items-center justify-center text-[9px] rounded",
                        isToday && "bg-primary text-primary-foreground font-bold",
                        !isToday && isCurrentMonth && "text-foreground/80",
                        !isCurrentMonth && "text-muted-foreground/30"
                      )}
                    >
                      {format(day, "d")}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
