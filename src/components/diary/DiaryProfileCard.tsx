import { Calendar, Award, Sparkles, Trophy, Star, Flame, Zap } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TimeRange } from "./types";

interface DiaryProfileCardProps {
  userName: string;
  userEmail: string;
  avatarUrl?: string;
  metrics: any;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  smartInsight: string;
}

const BADGES = [
  { min: 80, label: "Champion", icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10" },
  { min: 60, label: "Achiever", icon: Star, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { min: 40, label: "Rising Star", icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10" },
  { min: 20, label: "Explorer", icon: Zap, color: "text-sky-500", bg: "bg-sky-500/10" },
  { min: 0, label: "Starter", icon: Award, color: "text-muted-foreground", bg: "bg-muted" },
];

const TIME_LABELS: Record<TimeRange, string> = {
  today: "Today",
  week: "7d",
  month: "Month",
};

export function DiaryProfileCard({
  userName,
  userEmail,
  avatarUrl,
  metrics,
  timeRange,
  onTimeRangeChange,
  smartInsight,
}: DiaryProfileCardProps) {
  const displayName = userName.charAt(0).toUpperCase() + userName.slice(1);
  const initials = displayName.slice(0, 2).toUpperCase();

  // Calculate overall performance score
  const taskPercent = metrics.tasks.planned > 0
    ? Math.round((metrics.tasks.completed / metrics.tasks.planned) * 100)
    : 0;
  const habitPercent = metrics.trackers.completionPercent || 0;
  const journalPercent = Math.min(100, metrics.journal.entriesWritten * 14);
  const manifestPercent = Math.min(100, metrics.manifest.checkInsDone * 20);
  const notesPercent = Math.min(100, metrics.notes.created * 10);
  const emotionsPercent = Math.min(100, (metrics.emotions?.checkIns || 0) * 15);

  const overallScore = Math.round(
    (taskPercent + habitPercent + journalPercent + manifestPercent + notesPercent + emotionsPercent) / 6
  );

  const badge = BADGES.find((b) => overallScore >= b.min) || BADGES[BADGES.length - 1];
  const BadgeIcon = badge.icon;

  const modules = [
    { name: "Tasks", stat: `${metrics.tasks.completed}/${metrics.tasks.planned}`, percent: taskPercent, bar: "[&>div]:bg-emerald-500" },
    { name: "Habits", stat: `${metrics.trackers.completionPercent}%`, percent: habitPercent, bar: "[&>div]:bg-teal-500" },
    { name: "Journal", stat: `${metrics.journal.entriesWritten}`, percent: journalPercent, bar: "[&>div]:bg-amber-500" },
    { name: "Manifest", stat: `${metrics.manifest.checkInsDone}`, percent: manifestPercent, bar: "[&>div]:bg-purple-500" },
    { name: "Notes", stat: `${metrics.notes.created}`, percent: notesPercent, bar: "[&>div]:bg-sky-500" },
    { name: "Emotions", stat: `${metrics.emotions?.checkIns || 0}`, percent: emotionsPercent, bar: "[&>div]:bg-rose-400" },
  ];

  return (
    <Card className="bg-card border-border/40 overflow-hidden">
      {/* Cover banner */}
      <div className="h-16 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5" />

      <CardContent className="pt-0 -mt-8 space-y-4">
        {/* Avatar + Badge row */}
        <div className="flex items-end justify-between">
          <Avatar className="h-16 w-16 border-4 border-card shadow-sm">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {/* Performance Badge */}
          <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold", badge.bg, badge.color)}>
            <BadgeIcon className="h-3.5 w-3.5" />
            {badge.label}
          </div>
        </div>

        {/* Name & email */}
        <div className="space-y-0.5">
          <h3 className="text-base font-semibold text-foreground">{displayName}</h3>
          <p className="text-xs text-muted-foreground">{userEmail}</p>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Tracking your personal growth journey across journaling, habits, emotions, and more.
        </p>

        <div className="h-px bg-border" />

        {/* Performance section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Performance</span>
            <div className="flex items-center gap-0.5">
              {(["today", "week", "month"] as TimeRange[]).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-5 text-[10px] px-2 rounded-full",
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

          {modules.map((mod) => (
            <div key={mod.name} className="space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium text-foreground">{mod.name}</span>
                <span className="text-[10px] text-muted-foreground">{mod.stat}</span>
              </div>
              <Progress value={mod.percent} className={cn("h-1 bg-secondary", mod.bar)} />
            </div>
          ))}

          {/* Overall score */}
          <div className="flex items-center justify-between pt-1 border-t border-border/50">
            <span className="text-xs font-semibold text-foreground">Overall</span>
            <span className="text-xs font-bold text-primary">{overallScore}%</span>
          </div>
        </div>

        {/* AI Insight */}
        <div className="flex items-start gap-2 pt-1">
          <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">{smartInsight}</p>
        </div>
      </CardContent>
    </Card>
  );
}
