import { useEffect, useState, useMemo } from "react";
import { useDatePreferences } from "@/hooks/useDatePreferences";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { useTimezone } from "@/hooks/useTimezone";
import { useTimeFormat } from "@/hooks/useTimeFormat";
import { Clock, Timer, Hourglass, Calendar, Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserPreferences } from "@/hooks/useUserSettings";

type WidgetMode = "digital" | "analog" | "stopwatch" | "timer" | "calendar";

const STORAGE_KEY = "unfric-clock-widget-mode";

const TIMER_PRESETS = [
  { label: "5m", seconds: 5 * 60 },
  { label: "15m", seconds: 15 * 60 },
  { label: "25m", seconds: 25 * 60 },
  { label: "45m", seconds: 45 * 60 },
];

export function TasksClockWidget() {
  const { weekStartsOn } = useDatePreferences();
  const { prefs, updatePrefs } = useUserPreferences();
  const [mode, setModeState] = useState<WidgetMode>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && ["digital", "analog", "stopwatch", "timer", "calendar"].includes(stored)) {
        return stored as WidgetMode;
      }
    }
    return "digital";
  });
  const [dbSynced, setDbSynced] = useState(false);

  useEffect(() => {
    if (!dbSynced && prefs.clock_widget_mode) {
      setModeState(prefs.clock_widget_mode as WidgetMode);
      localStorage.setItem(STORAGE_KEY, prefs.clock_widget_mode);
      setDbSynced(true);
    }
  }, [prefs.clock_widget_mode, dbSynced]);

  const setMode = (newMode: WidgetMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
    updatePrefs({ clock_widget_mode: newMode });
  };

  const [now, setNow] = useState(new Date());
  const { timezone, getTimeInTimezone, formatInTimezone } = useTimezone();
  const { timeFormat: userTimeFormat } = useTimeFormat();
  const is12h = userTimeFormat === "12h";

  const [stopwatchMs, setStopwatchMs] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRemaining, setTimerRemaining] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!stopwatchRunning) return;
    const interval = setInterval(() => setStopwatchMs((prev) => prev + 10), 10);
    return () => clearInterval(interval);
  }, [stopwatchRunning]);

  useEffect(() => {
    if (!timerRunning || timerRemaining <= 0) return;
    const interval = setInterval(() => {
      setTimerRemaining((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
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
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${centis.toString().padStart(2, "0")}`;
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const tzTime = getTimeInTimezone(now);
  const seconds = tzTime.seconds;
  const minutes = tzTime.minutes;
  const hours = tzTime.hours % 12;
  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = hours * 30 + minutes * 0.5;

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const start = startOfWeek(monthStart, { weekStartsOn });
    const end = endOfWeek(monthEnd, { weekStartsOn });
    return eachDayOfInterval({ start, end });
  }, [calendarMonth, weekStartsOn]);

  const modeButtons = [
    { id: "digital" as WidgetMode, icon: Clock, label: "Digital" },
    { id: "analog" as WidgetMode, icon: Clock, label: "Analog" },
    { id: "stopwatch" as WidgetMode, icon: Hourglass, label: "Stopwatch" },
    { id: "timer" as WidgetMode, icon: Timer, label: "Timer" },
    { id: "calendar" as WidgetMode, icon: Calendar, label: "Calendar" },
  ];

  return (
    <div className="h-full w-full relative overflow-hidden">
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
                "h-7 w-7 p-0 rounded-sm transition-all",
                mode === id
                  ? "bg-foreground/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/5",
              )}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex items-center justify-center">
          {mode === "digital" && (
            <div className="text-center space-y-2">
              <div className="text-[10px] tracking-[0.4em] uppercase opacity-40">
                {formatInTimezone(now, { weekday: "long" })}
              </div>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-light tracking-tight text-foreground tabular-nums selection:bg-primary selection:text-primary-foreground">
                  {formatInTimezone(now, { hour: "numeric", minute: "2-digit", hour12: is12h }).replace(
                    /\s?(AM|PM)$/i,
                    "",
                  )}
                </span>
                <div className="flex flex-col items-start ml-1">
                  {is12h && (
                    <span className="text-[11px] tracking-[0.3em] uppercase opacity-40">
                      {formatInTimezone(now, { hour: "numeric", hour12: true }).replace(/^[\d:]+\s?/, "")}
                    </span>
                  )}
                  <span className="text-[11px] font-mono text-muted-foreground/40 tabular-nums">
                    {String(getTimeInTimezone(now).seconds).padStart(2, "0")}
                  </span>
                </div>
              </div>
              <div className="text-[11px] font-light text-muted-foreground/60 tracking-[0.15em]">
                {formatInTimezone(now, { month: "long", day: "numeric", year: "numeric" })}
              </div>
              <div className="text-[10px] tracking-[0.3em] uppercase opacity-30">{timezone.replace(/_/g, " ")}</div>
            </div>
          )}

          {mode === "analog" && (
            <div className="relative w-36 h-36">
              {/* Minimal outer ring */}
              <div className="absolute inset-0 rounded-full border border-foreground/10" />

              {/* Inner clock face */}
              <div className="absolute inset-1 rounded-full bg-background border border-border/20" />

              {/* Hour markers — minimal dashes */}
              {[...Array(12)].map((_, i) => {
                const isCardinal = i % 3 === 0;
                return (
                  <div
                    key={i}
                    className={cn(
                      "absolute left-1/2 -translate-x-1/2",
                      isCardinal
                        ? "w-[1px] h-2.5 bg-foreground/60"
                        : "w-[1px] h-1.5 bg-foreground/20",
                    )}
                    style={{
                      top: isCardinal ? "8px" : "10px",
                      transform: `translateX(-50%) rotate(${i * 30}deg)`,
                      transformOrigin: isCardinal ? "50% 64px" : "50% 62px",
                    }}
                  />
                );
              })}

              {/* Hour hand — ultra-thin */}
              <div
                className="absolute w-[1.5px] h-9 left-1/2 bottom-1/2 origin-bottom bg-foreground/80"
                style={{ transform: `translateX(-50%) rotate(${hourDeg}deg)` }}
              />

              {/* Minute hand — ultra-thin */}
              <div
                className="absolute w-[1px] h-12 left-1/2 bottom-1/2 origin-bottom bg-foreground/60"
                style={{ transform: `translateX(-50%) rotate(${minuteDeg}deg)` }}
              />

              {/* Second hand — hairline with accent */}
              <div
                className="absolute w-[0.5px] h-14 left-1/2 bottom-1/2 origin-[50%_85%] bg-foreground/30"
                style={{ transform: `translateX(-50%) rotate(${secondDeg}deg)` }}
              />

              {/* Center pivot — machined metal pin */}
              <div className="absolute w-2 h-2 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="absolute inset-0 rounded-full bg-foreground/70" />
                <div className="absolute inset-[1px] rounded-full bg-gradient-to-br from-foreground/50 to-foreground/80" />
              </div>
            </div>
          )}

          {mode === "stopwatch" && (
            <div className="text-center space-y-3">
              <div className="text-3xl font-mono font-light tracking-wider text-foreground tabular-nums">
                {formatStopwatch(stopwatchMs)}
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant={stopwatchRunning ? "outline" : "default"}
                  onClick={() => setStopwatchRunning(!stopwatchRunning)}
                  className="h-8 px-3 rounded-sm"
                >
                  {stopwatchRunning ? <Pause className="h-3 w-3 mr-1" strokeWidth={1.5} /> : <Play className="h-3 w-3 mr-1" strokeWidth={1.5} />}
                  <span className="text-[11px] tracking-[0.15em]">{stopwatchRunning ? "Pause" : "Start"}</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setStopwatchMs(0);
                    setStopwatchRunning(false);
                  }}
                  disabled={stopwatchMs === 0}
                  className="h-8 px-2 rounded-sm"
                >
                  <RotateCcw className="h-3 w-3" strokeWidth={1.5} />
                </Button>
              </div>
            </div>
          )}

          {mode === "timer" && (
            <div className="text-center space-y-2">
              <div
                className={cn(
                  "text-3xl font-mono font-light tracking-wider tabular-nums transition-colors",
                  timerRemaining === 0 ? "text-destructive" : "text-foreground",
                )}
              >
                {formatTimer(timerRemaining)}
              </div>

              <div className="flex items-center justify-center gap-1">
                {TIMER_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    size="sm"
                    variant={timerSeconds === preset.seconds ? "default" : "ghost"}
                    onClick={() => {
                      setTimerSeconds(preset.seconds);
                      setTimerRemaining(preset.seconds);
                      setTimerRunning(false);
                    }}
                    className="h-6 px-2 text-[10px] tracking-[0.15em] rounded-sm"
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
                  className="h-7 px-3 rounded-sm"
                >
                  {timerRunning ? <Pause className="h-3 w-3 mr-1" strokeWidth={1.5} /> : <Play className="h-3 w-3 mr-1" strokeWidth={1.5} />}
                  <span className="text-[11px] tracking-[0.15em]">{timerRunning ? "Pause" : "Start"}</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setTimerRemaining(timerSeconds);
                    setTimerRunning(false);
                  }}
                  className="h-7 px-2 rounded-sm"
                >
                  <RotateCcw className="h-3 w-3" strokeWidth={1.5} />
                </Button>
              </div>
            </div>
          )}

          {mode === "calendar" && (
            <div className="w-full space-y-1">
              <div className="flex items-center justify-between px-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 rounded-sm"
                  onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                >
                  <ChevronLeft className="h-3 w-3" strokeWidth={1.5} />
                </Button>
                <span className="text-[10px] tracking-[0.3em] uppercase opacity-50">
                  {format(calendarMonth, "MMM yyyy")}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 rounded-sm"
                  onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                >
                  <ChevronRight className="h-3 w-3" strokeWidth={1.5} />
                </Button>
              </div>

              <div className="grid grid-cols-7 gap-0.5 text-center">
                {(weekStartsOn === 1 ? ["M", "T", "W", "T", "F", "S", "S"] : ["S", "M", "T", "W", "T", "F", "S"]).map((d, i) => (
                  <span key={i} className="text-[8px] tracking-[0.2em] opacity-30">
                    {d}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0.5">
                {calendarDays.map((day, i) => {
                  const isToday = isSameDay(day, now);
                  const isCurrentMonth = day.getMonth() === calendarMonth.getMonth();
                  return (
                    <div
                      key={i}
                      className={cn(
                        "aspect-square flex items-center justify-center text-[9px] rounded-sm",
                        isToday && "bg-foreground text-background font-medium",
                        !isToday && isCurrentMonth && "text-foreground/70",
                        !isCurrentMonth && "text-muted-foreground/20",
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
