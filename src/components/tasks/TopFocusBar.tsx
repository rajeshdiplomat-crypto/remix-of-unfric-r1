import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
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

// Focus Stats Hook
function useFocusStats() {
  const [data, setData] = useState<{
    sessions: Array<{ date: string; duration: number; taskCompleted: boolean }>;
    lastSessionDate: string | null;
    currentStreak: number;
  }>(() => {
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
    let cutoffDate: Date;
    if (period === "today") {
      cutoffDate = startOfDay(now);
    } else if (period === "week") {
      cutoffDate = startOfDay(subDays(now, 7));
    } else {
      cutoffDate = startOfDay(subDays(now, 28));
    }
    return data.sessions.filter((s) => {
      const sessionDate = parseISO(s.date);
      return isAfter(sessionDate, cutoffDate) || isSameDay(sessionDate, cutoffDate);
    });
  }, [data.sessions, period]);

  const stats = useMemo(() => {
    const totalFocusMinutes = filteredSessions.reduce((sum, s) => sum + s.duration, 0);
    const tasksCompleted = filteredSessions.filter((s) => s.taskCompleted).length;
    const sessionsCount = filteredSessions.length;
    const breakMinutes = 0;

    const dailyTarget = 120;
    const daysInPeriod = period === "today" ? 1 : period === "week" ? 7 : 28;
    const expectedMinutes = dailyTarget * daysInPeriod;
    const timeScore = Math.min(100, (totalFocusMinutes / expectedMinutes) * 100);
    const streakBonus = Math.min(20, data.currentStreak * 2);
    const focusScore = Math.round(Math.min(100, timeScore * 0.8 + streakBonus));

    return {
      focusScore,
      focusTimeMinutes: totalFocusMinutes,
      tasksCompleted,
      sessionsCount,
      breakTimeMinutes: breakMinutes,
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
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

// Focus Stats Modal Component - BIGGER VERSION
function FocusStatsModal({ onClose }: { onClose: () => void }) {
  const { stats, period, setPeriod } = useFocusStats();

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Content - BIGGER */}
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-700 w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Focus Stats</h2>
          <button
            onClick={onClose}
            className="rounded-full h-10 w-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Period Toggle */}
        <div className="flex gap-3 p-6 pb-4">
          {(["today", "week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-6 py-3 rounded-full text-base font-semibold border transition-all",
                period === p
                  ? "bg-blue-500 text-white border-blue-500 shadow-lg"
                  : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-700",
              )}
            >
              {p === "today" ? "Today" : p === "week" ? "1 Week" : "4 Weeks"}
            </button>
          ))}
        </div>

        {/* Stats Grid - BIGGER CARDS */}
        <div className="grid grid-cols-3 gap-4 p-6 pt-2">
          {/* Focus Score */}
          <div className="rounded-2xl p-5 bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-xl aspect-square flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <p className="text-sm font-semibold opacity-90">Focus Score</p>
              <Zap className="h-6 w-6 opacity-70" />
            </div>
            <p className="text-5xl font-bold">{stats.focusScore}</p>
          </div>

          {/* Focus Time */}
          <div className="rounded-2xl p-5 bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xl aspect-square flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <p className="text-sm font-semibold opacity-90">Focus Time</p>
              <Clock className="h-6 w-6 opacity-70" />
            </div>
            <p className="text-4xl font-bold">{formatDuration(stats.focusTimeMinutes)}</p>
          </div>

          {/* Tasks Done */}
          <div className="rounded-2xl p-5 bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-xl aspect-square flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <p className="text-sm font-semibold opacity-90">Tasks Done</p>
              <CheckCircle2 className="h-6 w-6 opacity-70" />
            </div>
            <p className="text-5xl font-bold">{stats.tasksCompleted}</p>
          </div>

          {/* Sessions */}
          <div className="rounded-2xl p-5 bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-xl aspect-square flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <p className="text-sm font-semibold opacity-90">Sessions</p>
              <Timer className="h-6 w-6 opacity-70" />
            </div>
            <p className="text-5xl font-bold">{stats.sessionsCount}</p>
          </div>

          {/* Break Time */}
          <div className="rounded-2xl p-5 bg-gradient-to-br from-pink-400 to-rose-500 text-white shadow-xl aspect-square flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <p className="text-sm font-semibold opacity-90">Break Time</p>
              <Coffee className="h-6 w-6 opacity-70" />
            </div>
            <p className="text-4xl font-bold">{formatDuration(stats.breakTimeMinutes)}</p>
          </div>

          {/* Streak */}
          <div className="rounded-2xl p-5 bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-xl aspect-square flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <p className="text-sm font-semibold opacity-90">Streak</p>
              <Flame className="h-6 w-6 opacity-70" />
            </div>
            <p className="text-4xl font-bold">
              {stats.streak} <span className="text-xl">days</span>
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function TopFocusBar({ tasks, onStartFocus }: TopFocusBarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showStats, setShowStats] = useState(false);

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
    <>
      <div className="flex items-center gap-3 px-4 py-2 rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm">
        {/* Status dot */}
        <div className="relative shrink-0">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <div className="absolute inset-0 h-2 w-2 rounded-full bg-primary animate-ping opacity-30" />
        </div>

        {/* Label */}
        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-primary shrink-0">
          Focus
        </span>

        {/* Divider */}
        <div className="h-3.5 w-px bg-border/60" />

        {/* Task title */}
        <p className="text-xs font-medium min-w-0 truncate text-foreground flex-1">{topTask.title}</p>

        {/* Due info */}
        {!!dueLabel && (
          <span className="text-[10px] text-muted-foreground shrink-0">
            {dueLabel}
          </span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowStats(true)}
            className="h-7 px-2.5 text-[10px] text-muted-foreground hover:text-foreground rounded-lg"
          >
            <BarChart3 className="h-3 w-3 mr-1" />
            Stats
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => onStartFocus(topTask)}
            className="h-7 px-3.5 text-[10px] rounded-lg shadow-sm"
          >
            <Play className="h-3 w-3 mr-1" />
            Focus
          </Button>
        </div>
      </div>

      {/* Render modal via portal */}
      {showStats && <FocusStatsModal onClose={() => setShowStats(false)} />}
    </>
  );
}
