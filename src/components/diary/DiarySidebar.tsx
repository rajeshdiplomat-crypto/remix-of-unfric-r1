import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckSquare, PenLine, FileText, Target, BarChart3, Sparkles, Zap,
  Plus, Quote, RefreshCw, TrendingUp
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import type { TimeRange, SourceModule } from "./types";
import { DAILY_QUOTES } from "./types";

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
  const [quote, setQuote] = useState(() => {
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
  });

  const refreshQuote = () => {
    const newIndex = Math.floor(Math.random() * DAILY_QUOTES.length);
    setQuote(DAILY_QUOTES[newIndex]);
  };

  const timeRangeLabels: Record<TimeRange, string> = {
    today: "Today",
    week: "Last 7 Days",
    month: "This Month",
  };

  const filters: { value: SourceModule | 'all' | 'saved'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'saved', label: 'Saved' },
    { value: 'tasks', label: 'Tasks' },
    { value: 'journal', label: 'Journal' },
    { value: 'notes', label: 'Notes' },
    { value: 'trackers', label: 'Trackers' },
    { value: 'manifest', label: 'Manifest' },
  ];

  return (
    <div className="space-y-4">
      {/* Performance Snapshot */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Performance Snapshot
            </CardTitle>
            <div className="flex gap-1">
              {(['today', 'week', 'month'] as TimeRange[]).map(range => (
                <Button
                  key={range}
                  variant={timeRange === range ? "secondary" : "ghost"}
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={() => onTimeRangeChange(range)}
                >
                  {range === 'today' ? 'Today' : range === 'week' ? '7D' : '30D'}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mini stats grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-muted/50 rounded-lg p-2">
              <div className="flex items-center gap-1 text-muted-foreground">
                <CheckSquare className="h-3 w-3" /> Tasks
              </div>
              <div className="font-medium">{metrics.tasks.completed}/{metrics.tasks.planned} done</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-2">
              <div className="flex items-center gap-1 text-muted-foreground">
                <BarChart3 className="h-3 w-3" /> Trackers
              </div>
              <div className="font-medium">{metrics.trackers.completionPercent}%</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-2">
              <div className="flex items-center gap-1 text-muted-foreground">
                <PenLine className="h-3 w-3" /> Journal
              </div>
              <div className="font-medium">{metrics.journal.entriesWritten} entries</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-2">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Target className="h-3 w-3" /> Focus
              </div>
              <div className="font-medium">{metrics.focus.focusMinutes}m</div>
            </div>
          </div>

          {/* Completion chart */}
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis type="category" dataKey="module" width={60} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Bar dataKey="completion" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Smart insight */}
          <div className="text-xs text-muted-foreground bg-primary/5 rounded-lg p-2 border border-primary/10">
            <Zap className="h-3 w-3 inline mr-1 text-primary" />
            {smartInsight}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="justify-start gap-2 h-8" onClick={() => onQuickAction('task')}>
            <Plus className="h-3 w-3" /> New Task
          </Button>
          <Button variant="outline" size="sm" className="justify-start gap-2 h-8" onClick={() => onQuickAction('journal')}>
            <Plus className="h-3 w-3" /> Journal
          </Button>
          <Button variant="outline" size="sm" className="justify-start gap-2 h-8" onClick={() => onQuickAction('note')}>
            <Plus className="h-3 w-3" /> New Note
          </Button>
          <Button variant="outline" size="sm" className="justify-start gap-2 h-8" onClick={() => onQuickAction('focus')}>
            <Target className="h-3 w-3" /> Focus
          </Button>
        </CardContent>
      </Card>

      {/* Daily Quote */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Quote className="h-4 w-4" /> Daily Quote
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={refreshQuote}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm italic text-muted-foreground">"{quote.text}"</p>
          <p className="text-xs text-muted-foreground mt-1">— {quote.author}</p>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Filter Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1">
            {filters.map(f => (
              <Badge
                key={f.value}
                variant={filter === f.value ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => onFilterChange(f.value)}
              >
                {f.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
