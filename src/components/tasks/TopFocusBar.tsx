import { useMemo, useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Play,
  Clock3,
  BarChart3,
  X,
  Zap,
  Clock,
  CheckCircle2,
  Timer,
  Coffee,
  Flame,
} from "lucide-react";
import { format, startOfDay, subDays, isAfter, isSameDay, parseISO } from "date-fns";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { QuadrantTask, computeTaskStatus } from "./types";

interface TopFocusBarProps {
  tasks: QuadrantTask[];
  onStartFocus: (task: QuadrantTask) => void;
}

// Focus Stats Hook (inline)
function useFocusStats() {
  const [data, setData] = useState(() => {
    try {
      const stored = localStorage.getItem("focus-stats-data");
      if (stored) return JSON.parse(stored);
    } catch {}
    return { sessions: [], lastSessionDate: null, currentStreak: 0 };
  });
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");

  useEffect(() => {
    localStorage.setItem("focus-stats-data", JSON.stringify(data));
  }, [data]);

  const filteredSessions = useMemo(() => {
    const now = new Date();
    const cutoffDate =
      period === "today"
        ? startOfDay(now)
        : period === "week"
          ? startOfDay(subDays(now, 7))
          : startOfDay(subDays(now, 28));
    return data.sessions.filter(
      (s: any) => isAfter(parseISO(s.date), cutoffDate) || isSameDay(parseISO(s.date), cutoffDate),
    );
  }, [data.sessions, period]);

  const stats = useMemo(() => {
    const totalFocusMinutes = filteredSessions.reduce((sum: number, s: any) => sum + s.duration, 0);
    const tasksCompleted = filteredSessions.filter((s: any) => s.taskCompleted).length;
    const sessionsCount = filteredSessions.length;
    const dailyTarget = 120;
    const daysInPeriod = period === "today" ? 1 : period === "week" ? 7 : 28;
    const timeScore = Math.min(100, (totalFocusMinutes / (dailyTarget * daysInPeriod)) * 100);
    const focusScore = Math.round(Math.min(100, timeScore * 0.8 + Math.min(20, data.currentStreak * 2)));
    return {
      focusScore,
      focusTimeMinutes: totalFocusMinutes,
      tasksCompleted,
      sessionsCount,
      breakTimeMinutes: 0,
      streak: data.currentStreak,
    };
  }, [filteredSessions, data.currentStreak, period]);

  return { stats, period, setPeriod };
}

const formatDuration = (minutes: number): string => {
  if (minutes === 0) return "0s";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
};

export function TopFocusBar({ tasks, onStartFocus }: TopFocusBarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const { stats, period, setPeriod } = useFocusStats();

  const topTask = useMemo(() => {
    const active = tasks
      .filter((t) => !(t.is_completed || t.completed_at))
      .map((t) => ({ ...t, _status: computeTaskStatus(t) as ReturnType<typeof computeTaskStatus> }));

    const ongoing = active.find((t) => t._status === "ongoing");
    if (ongoing) return ongoing;

    const ui = active.find((t) => t.urgency === "high" && t.importance === "high");
    if (ui) return ui;

    return active[0] ?? null;
  }, [tasks]);

  if (!topTask) return null;

  const dueLabel = topTask.due_date
    ? `${format(new Date(topTask.due_date), "MMM d")}${topTask.due_time ? ` • ${topTask.due_time}` : ""}`
    : "";

  return (
    <Card className="rounded-2xl border border-border/60 bg-background/70 backdrop-blur-xl shadow-[0_12px_36px_rgba(0,0,0,0.08)]">
      <CardContent className={cn("flex items-center gap-2", collapsed ? "py-2 px-2.5" : "py-3 px-3")}>
        <div
          className={cn(
            "rounded-2xl flex items-center justify-center shrink-0 border border-border/60 bg-background/60",
            collapsed ? "h-9 w-9" : "h-10 w-10",
          )}
        >
          <Play className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            {!collapsed && (
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Top focus
              </span>
            )}
            <p className={cn("min-w-0 truncate", collapsed ? "text-sm font-medium" : "text-sm font-semibold")}>
              {topTask.title}
            </p>
          </div>
          {!collapsed && (
            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
              {topTask.urgency === "high" && (
                <Badge
                  variant="outline"
                  className="h-5 px-2 text-[10px] rounded-full bg-background/60 border-border/60"
                >
                  Urgent
                </Badge>
              )}
              {topTask.importance === "high" && (
                <Badge
                  variant="outline"
                  className="h-5 px-2 text-[10px] rounded-full bg-background/60 border-border/60"
                >
                  Important
                </Badge>
              )}
              {!!dueLabel && (
                <Badge
                  variant="outline"
                  className="h-5 px-2 text-[10px] rounded-full bg-background/60 border-border/60"
                >
                  <Clock3 className="h-3 w-3 mr-1" />
                  {dueLabel}
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="outline"
            onClick={() => setShowStats(true)}
            className={cn("rounded-full border-border/60 bg-background/60 hover:bg-primary/10", "h-9 px-3 text-xs")}
          >
            <BarChart3 className="h-4 w-4 mr-1.5" />
            Stats
          </Button>
          <Button variant="default" onClick={() => onStartFocus(topTask)} className="rounded-full h-9 px-4 text-xs">
            Focus
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCollapsed((v) => !v)}
            className="rounded-full border-border/60 bg-background/60 h-9 w-9"
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>

      {/* Focus Stats Modal */}
      {showStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowStats(false)} />
          <div className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto bg-background rounded-2xl border border-border shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Focus Stats</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowStats(false)} className="rounded-xl">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2 mb-4">
              {(["today", "week", "month"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium border transition-all",
                    period === p
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-muted-foreground border-border hover:bg-muted",
                  )}
                >
                  {p === "today" ? "Today" : p === "week" ? "1 Week" : "4 Weeks"}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl p-3 bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                <div className="flex justify-between">
                  <p className="text-[10px] opacity-80">Focus Score</p>
                  <Zap className="h-3 w-3 opacity-60" />
                </div>
                <p className="text-2xl font-bold mt-1">{stats.focusScore}</p>
              </div>
              <div className="rounded-xl p-3 bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                <div className="flex justify-between">
                  <p className="text-[10px] opacity-80">Focus Time</p>
                  <Clock className="h-3 w-3 opacity-60" />
                </div>
                <p className="text-xl font-bold mt-1">{formatDuration(stats.focusTimeMinutes)}</p>
              </div>
              <div className="rounded-xl p-3 bg-gradient-to-br from-emerald-400 to-green-500 text-white">
                <div className="flex justify-between">
                  <p className="text-[10px] opacity-80">Tasks Done</p>
                  <CheckCircle2 className="h-3 w-3 opacity-60" />
                </div>
                <p className="text-2xl font-bold mt-1">{stats.tasksCompleted}</p>
              </div>
              <div className="rounded-xl p-3 bg-gradient-to-br from-blue-400 to-indigo-500 text-white">
                <div className="flex justify-between">
                  <p className="text-[10px] opacity-80">Sessions</p>
                  <Timer className="h-3 w-3 opacity-60" />
                </div>
                <p className="text-2xl font-bold mt-1">{stats.sessionsCount}</p>
              </div>
              <div className="rounded-xl p-3 bg-gradient-to-br from-pink-400 to-rose-500 text-white">
                <div className="flex justify-between">
                  <p className="text-[10px] opacity-80">Break Time</p>
                  <Coffee className="h-3 w-3 opacity-60" />
                </div>
                <p className="text-xl font-bold mt-1">{formatDuration(stats.breakTimeMinutes)}</p>
              </div>
              <div className="rounded-xl p-3 bg-gradient-to-br from-orange-500 to-red-500 text-white">
                <div className="flex justify-between">
                  <p className="text-[10px] opacity-80">Streak</p>
                  <Flame className="h-3 w-3 opacity-60" />
                </div>
                <p className="text-xl font-bold mt-1">{stats.streak} days</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
