import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { 
  CheckSquare, PenLine, FileText, Target, Sparkles, Zap,
} from "lucide-react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from "recharts";
import { cn } from "@/lib/utils";
import type { TimeRange, SourceModule } from "./types";

interface DiarySidebarProps {
  metrics: any;
  chartData: { module: string; completion: number; label: string }[];
  smartInsight: string;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  filter: SourceModule | 'all' | 'saved';
  onFilterChange: (filter: SourceModule | 'all' | 'saved') => void;
  onQuickAction: (action: string) => void;
}

const CHART_COLORS = [
  'hsl(142 71% 35%)',
  'hsl(160 60% 40%)',
  'hsl(45 80% 45%)',
  'hsl(200 80% 45%)',
  'hsl(280 60% 50%)',
];

export function DiarySidebar({
  metrics,
  chartData,
  smartInsight,
  timeRange,
  onTimeRangeChange,
  filter,
  onFilterChange,
  onQuickAction,
}: DiarySidebarProps) {
  const timeRangeLabels: Record<TimeRange, string> = {
    today: "Today",
    week: "Last 7 Days",
    month: "This Month",
  };

  const filters: { value: SourceModule | 'all' | 'saved'; label: string }[] = [
    { value: 'saved', label: 'Saved' },
    { value: 'tasks', label: 'Only Tasks' },
    { value: 'journal', label: 'Only Journal' },
    { value: 'notes', label: 'Only Notes' },
    { value: 'trackers', label: 'Only Trackers' },
    { value: 'manifest', label: 'Only Manifest' },
    { value: 'emotions', label: 'Only Emotions' },
  ];

  return (
    <div className="space-y-4 h-full overflow-y-auto">
      {/* Performance Snapshot */}
      <Card className="bg-card border-border/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-foreground">
              Performance Snapshot
            </CardTitle>
          </div>
          {/* Time range toggle */}
          <div className="flex items-center gap-1 mt-3">
            {(['today', 'week', 'month'] as TimeRange[]).map(range => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "h-8 text-xs px-3 rounded-md",
                  timeRange === range 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                    : "text-muted-foreground hover:bg-muted"
                )}
                onClick={() => onTimeRangeChange(range)}
              >
                {timeRangeLabels[range]}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {/* Tasks stats */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-foreground">Tasks</span>
              <div className="flex items-center gap-4 text-xs">
                <div className="text-center">
                  <span className="font-semibold text-foreground">{metrics.tasks.dueToday}</span>
                  <p className="text-muted-foreground text-[10px]">Due today</p>
                </div>
                <div className="text-center">
                  <span className="font-semibold text-foreground">{metrics.tasks.completed}</span>
                  <p className="text-muted-foreground text-[10px]">Completed</p>
                </div>
                <div className="text-center">
                  <span className="font-semibold text-foreground">{metrics.tasks.planned}</span>
                  <p className="text-muted-foreground text-[10px]">Planned</p>
                </div>
              </div>
            </div>
            <Progress 
              value={metrics.tasks.planned > 0 ? (metrics.tasks.completed / metrics.tasks.planned) * 100 : 0} 
              className="h-1.5"
            />
          </div>

          {/* Trackers stats */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-foreground">Trackers</span>
              <div className="flex items-center gap-4 text-xs">
                <div className="text-center">
                  <span className="font-semibold text-foreground text-lg">{metrics.trackers.completionPercent}%</span>
                  <p className="text-muted-foreground text-[10px]">Daily Completed</p>
                </div>
                <div className="text-center">
                  <span className="font-semibold text-foreground">{metrics.trackers.sessionsCompleted}</span>
                  <p className="text-muted-foreground text-[10px]">Sessions completed</p>
                </div>
              </div>
            </div>
            <Progress 
              value={metrics.trackers.completionPercent} 
              className="h-1.5"
            />
          </div>

          {/* Journal stats */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-foreground">Journal</span>
              <div className="flex items-center gap-6 text-xs">
                <div className="text-center">
                  <span className="font-semibold text-foreground text-lg">{metrics.journal.entriesWritten}</span>
                  <p className="text-muted-foreground text-[10px]">Entries written</p>
                </div>
                <div className="text-center">
                  <span className="font-semibold text-foreground text-lg">{metrics.journal.streak}</span>
                  <span className="text-xs text-muted-foreground ml-0.5">days</span>
                  <p className="text-muted-foreground text-[10px]">Day streak</p>
                </div>
              </div>
            </div>
          </div>

          {/* Completion chart */}
          <div className="pt-2">
            <div className="h-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="horizontal" barGap={4}>
                  <XAxis dataKey="module" hide />
                  <Bar dataKey="completion" radius={[2, 2, 0, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-1">
              <span>Tasks</span>
              <span>Trackers</span>
              <span>Journal</span>
              <span>Focus</span>
              <span>Manifest</span>
            </div>
            <div className="flex gap-0.5 mt-2">
              {chartData.map((item, i) => (
                <div 
                  key={item.module}
                  className="h-1.5 rounded-sm"
                  style={{ 
                    width: `${100 / chartData.length}%`,
                    backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                    opacity: 0.7 + (item.completion / 100) * 0.3
                  }}
                />
              ))}
            </div>
          </div>

          {/* Smart insight */}
          <div className="text-xs text-muted-foreground pt-2 border-t border-border/30">
            <p className="leading-relaxed">{smartInsight}</p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-card border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-foreground">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="justify-start gap-2 h-9 text-xs border-border/50 hover:bg-muted/50" onClick={() => onQuickAction('task')}>
            <CheckSquare className="h-3.5 w-3.5" /> New Task
          </Button>
          <Button variant="outline" size="sm" className="justify-start gap-2 h-9 text-xs border-border/50 hover:bg-muted/50" onClick={() => onQuickAction('journal')}>
            <PenLine className="h-3.5 w-3.5" /> New Journal
          </Button>
          <Button variant="outline" size="sm" className="justify-start gap-2 h-9 text-xs border-border/50 hover:bg-muted/50" onClick={() => onQuickAction('note')}>
            <FileText className="h-3.5 w-3.5" /> New Note
          </Button>
          <Button variant="outline" size="sm" className="justify-start gap-2 h-9 text-xs border-border/50 hover:bg-muted/50" onClick={() => onQuickAction('activity')}>
            <Target className="h-3.5 w-3.5" /> New Activity
          </Button>
          <Button variant="outline" size="sm" className="justify-start gap-2 h-9 text-xs border-border/50 hover:bg-muted/50" onClick={() => onQuickAction('manifest')}>
            <Sparkles className="h-3.5 w-3.5" /> New Manifest Goal
          </Button>
          <Button variant="outline" size="sm" className="justify-start gap-2 h-9 text-xs border-border/50 hover:bg-muted/50" onClick={() => onQuickAction('focus')}>
            <Zap className="h-3.5 w-3.5" /> Focus Session
          </Button>
        </CardContent>
      </Card>

      {/* Filters / Smart Views */}
      <Card className="bg-card border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-foreground">Filters / Smart Views</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {filters.map(f => (
            <div key={f.value} className="flex items-center gap-2">
              <Checkbox 
                id={f.value}
                checked={filter === f.value}
                onCheckedChange={() => onFilterChange(filter === f.value ? 'all' : f.value)}
                className="border-border"
              />
              <label htmlFor={f.value} className="text-sm text-foreground cursor-pointer">
                {f.label}
              </label>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
