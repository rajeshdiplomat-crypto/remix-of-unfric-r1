import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimeRange } from "./types";

interface DiarySidebarProps {
  metrics: any;
  smartInsight: string;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

interface ModuleRow {
  name: string;
  stat: string;
  secondaryStat?: string;
  percent: number;
  barClass: string;
}

export function DiarySidebar({
  metrics,
  smartInsight,
  timeRange,
  onTimeRangeChange,
}: DiarySidebarProps) {
  const timeRangeLabels: Record<TimeRange, string> = {
    today: "Today",
    week: "7d",
    month: "Month",
  };

  const taskPercent = metrics.tasks.planned > 0
    ? Math.round((metrics.tasks.completed / metrics.tasks.planned) * 100)
    : 0;

  const modules: ModuleRow[] = [
    {
      name: "Tasks",
      stat: `${metrics.tasks.completed}/${metrics.tasks.planned} completed`,
      percent: taskPercent,
      barClass: "[&>div]:bg-emerald-500",
    },
    {
      name: "Habits",
      stat: `${metrics.trackers.sessionsCompleted} sessions`,
      secondaryStat: `${metrics.trackers.completionPercent}% done`,
      percent: metrics.trackers.completionPercent,
      barClass: "[&>div]:bg-teal-500",
    },
    {
      name: "Journal",
      stat: `${metrics.journal.entriesWritten} entries`,
      secondaryStat: metrics.journal.streak > 0 ? `${metrics.journal.streak}-day streak` : undefined,
      percent: Math.min(100, metrics.journal.entriesWritten * 14),
      barClass: "[&>div]:bg-amber-500",
    },
    {
      name: "Manifest",
      stat: `${metrics.manifest.checkInsDone} check-ins`,
      secondaryStat: `${metrics.manifest.goalsActive} goals`,
      percent: Math.min(100, metrics.manifest.checkInsDone * 20),
      barClass: "[&>div]:bg-purple-500",
    },
    {
      name: "Notes",
      stat: `${metrics.notes.created} created`,
      secondaryStat: metrics.notes.updated > 0 ? `${metrics.notes.updated} updated` : undefined,
      percent: Math.min(100, metrics.notes.created * 10),
      barClass: "[&>div]:bg-sky-500",
    },
    {
      name: "Emotions",
      stat: `${metrics.emotions?.checkIns || 0} check-ins`,
      percent: Math.min(100, (metrics.emotions?.checkIns || 0) * 15),
      barClass: "[&>div]:bg-rose-400",
    },
  ];

  return (
    <div className="space-y-4 h-full overflow-y-auto">
      <Card className="bg-card border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Performance
          </CardTitle>
          <div className="flex items-center gap-1 pt-1">
            {(['today', 'week', 'month'] as TimeRange[]).map(range => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "h-5 text-[10px] px-2 rounded-full",
                  timeRange === range
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
                onClick={() => onTimeRangeChange(range)}
              >
                {timeRangeLabels[range]}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-0">
          {modules.map((mod) => (
            <div key={mod.name} className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-foreground">{mod.name}</span>
                <span className="text-xs text-muted-foreground">{mod.stat}</span>
              </div>
              <Progress
                value={mod.percent}
                className={cn("h-1.5 bg-secondary", mod.barClass)}
              />
              {mod.secondaryStat && (
                <p className="text-[11px] text-muted-foreground">{mod.secondaryStat}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* AI Insight */}
      <Card className="bg-card border-border/40">
        <CardContent className="py-3 px-4">
          <div className="flex items-start gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">{smartInsight}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
