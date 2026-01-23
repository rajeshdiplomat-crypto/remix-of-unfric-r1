import { useEffect, useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTimezone } from "@/hooks/useTimezone";
import { Clock, Timer, Hourglass, Calendar, Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type WidgetMode = "digital" | "analog" | "stopwatch" | "timer" | "calendar";

const TIMER_PRESETS = [
  { label: "5m", seconds: 5 * 60 },
  { label: "15m", seconds: 15 * 60 },
  { label: "25m", seconds: 25 * 60 },
  { label: "45m", seconds: 45 * 60 },
];

export function TasksClockWidget() {
  const [mode, setMode] = useState<WidgetMode>("digital");
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
    <Card className="h-full rounded-xl border-0 bg-gradient-to-br from-card via-card/95 to-card/90 shadow-xl overflow-hidden relative">
      {/* Subtle background effects */}
      <div className="absolute top-0 right-0 -mr-12 -mt-12 w-40 h-40 bg-gradient-to-br from-primary/8 to-transparent rounded-full blur-2xl pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <CardContent className="p-4 h-full flex flex-col">
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
            <div className="text-center space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-primary/60">
                {format(now, "EEEE")}
              </div>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-black tracking-tight text-foreground">
                  {format(now, "h:mm")}
                </span>
                <span className="text-sm font-bold text-muted-foreground/50 ml-1">
                  {format(now, "a")}
                </span>
                <span className="text-xs font-mono text-primary/40 ml-2 tabular-nums">
                  {format(now, "ss")}
                </span>
              </div>
              <div className="text-xs text-muted-foreground/70">
                {format(now, "MMMM do, yyyy")}
              </div>
            </div>
          )}

          {mode === "analog" && (
            <div className="relative w-24 h-24">
              {/* Clock face */}
              <div className="absolute inset-0 rounded-full border-2 border-border/50 bg-card/50" />
              
              {/* Hour markers */}
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-0.5 h-1.5 bg-muted-foreground/40 left-1/2 -translate-x-1/2"
                  style={{
                    top: '4px',
                    transform: `translateX(-50%) rotate(${i * 30}deg)`,
                    transformOrigin: '50% 44px',
                  }}
                />
              ))}
              
              {/* Hour hand */}
              <div
                className="absolute w-1 h-6 bg-foreground rounded-full left-1/2 bottom-1/2 origin-bottom"
                style={{ transform: `translateX(-50%) rotate(${hourDeg}deg)` }}
              />
              
              {/* Minute hand */}
              <div
                className="absolute w-0.5 h-8 bg-foreground/80 rounded-full left-1/2 bottom-1/2 origin-bottom"
                style={{ transform: `translateX(-50%) rotate(${minuteDeg}deg)` }}
              />
              
              {/* Second hand */}
              <div
                className="absolute w-[1px] h-9 bg-primary rounded-full left-1/2 bottom-1/2 origin-bottom"
                style={{ transform: `translateX(-50%) rotate(${secondDeg}deg)` }}
              />
              
              {/* Center dot */}
              <div className="absolute w-2 h-2 bg-primary rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
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
      </CardContent>
    </Card>
  );
}
