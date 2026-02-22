import { useRef, useEffect, useState, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimeRange } from "./types";

interface DiaryMobileInsightsSidebarProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  userEmail: string;
  avatarUrl?: string;
  metrics: any;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

const BADGES = [
  { min: 80, label: "Champion", color: "text-amber-500", bg: "bg-amber-500/10" },
  { min: 60, label: "Achiever", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { min: 40, label: "Rising Star", color: "text-orange-500", bg: "bg-orange-500/10" },
  { min: 20, label: "Explorer", color: "text-sky-500", bg: "bg-sky-500/10" },
  { min: 0, label: "Starter", color: "text-muted-foreground", bg: "bg-muted" },
];

const TIME_LABELS: Record<TimeRange, string> = {
  today: "Today",
  week: "7d",
  month: "Month",
};

export function DiaryMobileInsightsSidebar({
  open,
  onClose,
  userName,
  userEmail,
  avatarUrl,
  metrics,
  timeRange,
  onTimeRangeChange,
}: DiaryMobileInsightsSidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [translateX, setTranslateX] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragCurrentX = useRef(0);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setTranslateX(0));
    } else {
      setTranslateX(100);
    }
  }, [open]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartX.current = e.touches[0].clientX;
    dragCurrentX.current = e.touches[0].clientX;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    dragCurrentX.current = e.touches[0].clientX;
    const diff = dragCurrentX.current - dragStartX.current;
    if (diff > 0) {
      setTranslateX(Math.min((diff / window.innerWidth) * 100, 100));
    }
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    const diff = dragCurrentX.current - dragStartX.current;
    if (diff > 80) {
      onClose();
    } else {
      setTranslateX(0);
    }
  }, [onClose]);

  // Calculate scores
  const taskPercent = metrics.tasks.planned > 0
    ? Math.round((metrics.tasks.completed / metrics.tasks.planned) * 100) : 0;
  const habitPercent = metrics.trackers.completionPercent || 0;
  const journalPercent = Math.min(100, metrics.journal.entriesWritten * 14);
  const manifestPercent = Math.min(100, metrics.manifest.checkInsDone * 20);
  const notesPercent = Math.min(100, metrics.notes.created * 10);
  const emotionsPercent = Math.min(100, (metrics.emotions?.checkIns || 0) * 15);
  const overallScore = Math.round(
    (taskPercent + habitPercent + journalPercent + manifestPercent + notesPercent + emotionsPercent) / 6
  );

  const badge = BADGES.find((b) => overallScore >= b.min) || BADGES[BADGES.length - 1];
  const displayName = userName.charAt(0).toUpperCase() + userName.slice(1);
  const initials = displayName.slice(0, 2).toUpperCase();

  const allModules = [
    { name: "Tasks", stat: `${metrics.tasks.completed}/${metrics.tasks.planned}`, percent: taskPercent, bar: "[&>div]:bg-emerald-500" },
    { name: "Habits", stat: `${metrics.trackers.completionPercent}%`, percent: habitPercent, bar: "[&>div]:bg-teal-500" },
    { name: "Journal", stat: `${metrics.journal.entriesWritten}`, percent: journalPercent, bar: "[&>div]:bg-amber-500" },
    { name: "Manifest", stat: `${metrics.manifest.checkInsDone}`, percent: manifestPercent, bar: "[&>div]:bg-purple-500" },
    { name: "Notes", stat: `${metrics.notes.created}`, percent: notesPercent, bar: "[&>div]:bg-sky-500" },
    { name: "Emotions", stat: `${metrics.emotions?.checkIns || 0}`, percent: emotionsPercent, bar: "[&>div]:bg-rose-400" },
  ];

  if (!open && translateX >= 100) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 md:hidden"
        style={{
          backgroundColor: `hsla(var(--background) / ${0.5 * (1 - translateX / 100)})`,
          backdropFilter: `blur(${Math.round(24 * (1 - translateX / 100))}px)`,
          WebkitBackdropFilter: `blur(${Math.round(24 * (1 - translateX / 100))}px)`,
          pointerEvents: open ? "auto" : "none",
        }}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className="fixed top-0 right-0 z-50 md:hidden h-full flex flex-col bg-card border-l border-border/40 shadow-2xl"
        style={{
          width: "85%",
          transform: `translateX(${translateX}%)`,
          transition: isDragging ? "none" : "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10">
          <div className="w-1 h-8 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">

          {/* ========== TOP SECTION: Profile Hero ========== */}
          <div className="relative px-5 pt-6 pb-5 bg-gradient-to-b from-primary/5 to-transparent">
            {/* Close */}
            <div className="flex justify-end mb-4">
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/80 transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Profile card */}
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-20 w-20 border-[3px] border-background shadow-lg mb-3">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-base font-bold text-foreground tracking-tight mb-1">{displayName}</h3>
              <span className={cn(
                "text-[10px] font-semibold px-3 py-1 rounded-full mb-3",
                badge.bg, badge.color
              )}>
                {badge.label}
              </span>

              {/* Overall score ring */}
              <div className="relative w-14 h-14 mb-1">
                <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
                  <circle cx="24" cy="24" r="20" fill="none" strokeWidth="3"
                    className="stroke-secondary" />
                  <circle cx="24" cy="24" r="20" fill="none" strokeWidth="3"
                    className="stroke-primary"
                    strokeLinecap="round"
                    strokeDasharray={`${(overallScore / 100) * 125.6} 125.6`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary">
                  {overallScore}%
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Overall</span>
            </div>
          </div>

          {/* ========== BOTTOM SECTION: Performance + Filters ========== */}
          <div className="px-5 pt-4 pb-6">
            {/* Time filter tabs */}
            <div className="flex items-center justify-center gap-1 mb-5">
              {(["today", "week", "month"] as TimeRange[]).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-7 text-[11px] px-5 rounded-full font-medium",
                    timeRange === range
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                  onClick={() => onTimeRangeChange(range)}
                >
                  {TIME_LABELS[range]}
                </Button>
              ))}
            </div>

            {/* All module stats */}
            <div className="space-y-4">
              {allModules.map((mod) => (
                <div key={mod.name} className="space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[13px] font-semibold text-foreground tracking-tight">{mod.name}</span>
                    <span className="text-xs text-muted-foreground font-medium tabular-nums">{mod.stat}</span>
                  </div>
                  <Progress value={mod.percent} className={cn("h-[5px] bg-secondary rounded-full", mod.bar)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
