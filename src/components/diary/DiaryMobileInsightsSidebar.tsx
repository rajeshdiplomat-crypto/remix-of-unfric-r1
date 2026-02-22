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

  // Top 3 modules shown alongside profile
  const topModules = [
    { name: "Tasks", stat: `${metrics.tasks.completed}/${metrics.tasks.planned}`, percent: taskPercent, bar: "[&>div]:bg-emerald-500" },
    { name: "Habits", stat: `${metrics.trackers.completionPercent}%`, percent: habitPercent, bar: "[&>div]:bg-teal-500" },
    { name: "Journal", stat: `${metrics.journal.entriesWritten}`, percent: journalPercent, bar: "[&>div]:bg-amber-500" },
  ];

  // Bottom modules
  const bottomModules = [
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

      {/* Sidebar panel */}
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

        {/* Scrollable content — ends naturally */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-5 pt-6 pb-6">
            {/* Close */}
            <div className="flex justify-end mb-6">
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* === SECTION 1: Profile + Top Stats === */}
            <div className="flex gap-5 mb-8">
              {/* Left: Top 3 stats */}
              <div className="flex-1 space-y-5">
                {topModules.map((mod) => (
                  <div key={mod.name} className="space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-semibold text-foreground tracking-tight">{mod.name}</span>
                      <span className="text-xs text-muted-foreground font-medium">{mod.stat}</span>
                    </div>
                    <Progress value={mod.percent} className={cn("h-[5px] bg-secondary rounded-full", mod.bar)} />
                  </div>
                ))}
              </div>

              {/* Right: Profile */}
              <div className="flex flex-col items-center justify-center gap-2 shrink-0 w-24">
                <Avatar className="h-16 w-16 border-2 border-border shadow-sm">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="bg-primary/10 text-primary text-base font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className={cn("text-[10px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap", badge.bg, badge.color)}>
                  {badge.label}
                </span>
                <p className="text-xs font-semibold text-foreground text-center leading-tight tracking-tight">
                  {displayName}
                </p>
              </div>
            </div>

            {/* === Divider === */}
            <div className="h-px bg-border/50 mb-6" />

            {/* === SECTION 2: Performance Stats === */}
            <div className="space-y-5">
              {bottomModules.map((mod) => (
                <div key={mod.name} className="space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold text-foreground tracking-tight">{mod.name}</span>
                    <span className="text-xs text-muted-foreground font-medium">{mod.stat}</span>
                  </div>
                  <Progress value={mod.percent} className={cn("h-[5px] bg-secondary rounded-full", mod.bar)} />
                </div>
              ))}
            </div>

            {/* === Overall Score === */}
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-border/50">
              <span className="text-sm font-bold text-foreground tracking-tight">Overall</span>
              <span className="text-base font-bold text-primary">{overallScore}%</span>
            </div>
          </div>
        </div>

        {/* Sticky footer: time toggles */}
        <div className="shrink-0 px-5 py-4 border-t border-border/40 bg-card">
          <div className="flex items-center justify-center gap-1">
            {(["today", "week", "month"] as TimeRange[]).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "h-7 text-xs px-4 rounded-full",
                  timeRange === range
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
                onClick={() => onTimeRangeChange(range)}
              >
                {TIME_LABELS[range]}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
