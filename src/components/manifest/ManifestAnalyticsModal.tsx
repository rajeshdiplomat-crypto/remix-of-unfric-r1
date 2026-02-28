import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Clock,
  Eye,
  Zap,
  Camera,
  Award,
  Calendar as CalendarIcon,
  TrendingUp,
  Flame,
  AlertCircle,
} from "lucide-react";
import { subDays, parseISO, differenceInDays, format, eachDayOfInterval } from "date-fns";
import { cn } from "@/lib/utils";
import { type ManifestGoal, type ManifestDailyPractice } from "./types";
import { ManifestSidebarPanel } from "./ManifestSidebarPanel";
import { Progress } from "@/components/ui/progress";

interface ManifestAnalyticsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goals: ManifestGoal[];
  practices: ManifestDailyPractice[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

type TimeFilter = "7days" | "30days" | "1year" | "lifetime";

export function ManifestAnalyticsModal({
  open,
  onOpenChange,
  goals,
  practices,
  selectedDate,
  onDateSelect,
}: ManifestAnalyticsModalProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("30days");
  const [selectedGoalId, setSelectedGoalId] = useState<string>("all");

  const filteredPractices = useMemo(() => {
    const now = new Date();
    let cutoffDate: Date;

    switch (timeFilter) {
      case "7days":
        cutoffDate = subDays(now, 7);
        break;
      case "30days":
        cutoffDate = subDays(now, 30);
        break;
      case "1year":
        cutoffDate = subDays(now, 365);
        break;
      case "lifetime":
        cutoffDate = new Date(0);
        break;
    }

    let filtered = practices.filter((p) => p.locked && parseISO(p.entry_date) >= cutoffDate);
    
    if (selectedGoalId !== "all") {
      filtered = filtered.filter((p) => p.goal_id === selectedGoalId);
    }

    return filtered;
  }, [practices, timeFilter, selectedGoalId]);

  // Calculate analytics
  const analytics = useMemo(() => {
    const lockedPractices = filteredPractices;

    const totalVizMinutes = lockedPractices.reduce((sum, p) => {
      const vizCount = p.visualization_count || 0;
      const goal = goals.find((g) => g.id === p.goal_id);
      const vizDuration = goal?.visualization_minutes || 3;
      return sum + vizCount * vizDuration;
    }, 0);

    const uniquePracticeDays = new Set(lockedPractices.map((p) => p.entry_date)).size;
    const totalVisualizations = lockedPractices.reduce((sum, p) => sum + (p.visualization_count || 0), 0);
    const totalActions = lockedPractices.reduce((sum, p) => sum + (p.act_count || 0), 0);
    const totalProofs = lockedPractices.reduce((sum, p) => sum + (p.proofs?.length || 0), 0);

    const daysInPeriod =
      timeFilter === "7days" ? 7
        : timeFilter === "30days" ? 30
          : timeFilter === "1year" ? 365
            : Math.max(differenceInDays(new Date(), parseISO(lockedPractices[0]?.entry_date || new Date().toISOString())) + 1, 1);

    const avgVizTimePerDay = uniquePracticeDays > 0 ? (totalVizMinutes / uniquePracticeDays).toFixed(1) : "0";
    const avgVizPerDay = uniquePracticeDays > 0 ? (totalVisualizations / uniquePracticeDays).toFixed(1) : "0";
    const avgActionsPerDay = uniquePracticeDays > 0 ? (totalActions / uniquePracticeDays).toFixed(1) : "0";

    const goalVizCounts: Record<string, number> = {};
    lockedPractices.forEach((p) => {
      goalVizCounts[p.goal_id] = (goalVizCounts[p.goal_id] || 0) + (p.visualization_count || 0);
    });
    const mostVisualizedGoalId = Object.entries(goalVizCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const mostVisualizedGoal = goals.find((g) => g.id === mostVisualizedGoalId);

    return {
      totalVizMinutes,
      totalVisualizations,
      totalActions,
      totalProofs,
      uniquePracticeDays,
      avgVizTimePerDay,
      avgVizPerDay,
      avgActionsPerDay,
      mostVisualizedGoal,
      daysInPeriod,
    };
  }, [filteredPractices, goals, timeFilter]);

  // Consistency data
  const consistencyData = useMemo(() => {
    const now = new Date();
    const days = timeFilter === "7days" ? 7 : timeFilter === "30days" ? 30 : timeFilter === "1year" ? 365 : 30;
    const startDate = subDays(now, days - 1);
    const dateRange = eachDayOfInterval({ start: startDate, end: now });

    const activeGoals = goals.filter((g) => !g.is_completed);
    const lockedPractices = practices.filter((p) => p.locked);

    // Practice dates set per goal
    const goalPracticeDates: Record<string, Set<string>> = {};
    activeGoals.forEach((g) => {
      goalPracticeDates[g.id] = new Set(
        lockedPractices.filter((p) => p.goal_id === g.id).map((p) => p.entry_date)
      );
    });

    // All practiced dates (any goal)
    const allPracticedDates = new Set(lockedPractices.map((p) => p.entry_date));

    // Overall consistency
    const practicedDaysInRange = dateRange.filter((d) => allPracticedDates.has(format(d, "yyyy-MM-dd"))).length;
    const overallConsistency = dateRange.length > 0 ? Math.round((practicedDaysInRange / dateRange.length) * 100) : 0;

    // Per-goal breakdown
    const perGoal = activeGoals.map((goal) => {
      const dates = goalPracticeDates[goal.id] || new Set();
      const practicedInRange = dateRange.filter((d) => dates.has(format(d, "yyyy-MM-dd"))).length;
      const consistency = dateRange.length > 0 ? Math.round((practicedInRange / dateRange.length) * 100) : 0;

      // Current streak
      let streak = 0;
      for (let i = 0; i < 60; i++) {
        const checkDate = format(subDays(now, i), "yyyy-MM-dd");
        if (dates.has(checkDate)) streak++;
        else if (i > 0) break;
      }

      // Missing dates (last 7 days only for display)
      const last7 = eachDayOfInterval({ start: subDays(now, 6), end: now });
      const missedDates = last7.filter((d) => !dates.has(format(d, "yyyy-MM-dd")));

      return { goal, consistency, streak, missedDates, practicedInRange, totalDays: dateRange.length };
    });

    // 30-day heatmap grid (last 30 days regardless of filter)
    const heatmapDays = eachDayOfInterval({ start: subDays(now, 29), end: now });
    const heatmap = heatmapDays.map((day) => ({
      date: day,
      dateStr: format(day, "yyyy-MM-dd"),
      practiced: allPracticedDates.has(format(day, "yyyy-MM-dd")),
    }));

    return { overallConsistency, perGoal, heatmap, practicedDaysInRange, totalDays: dateRange.length };
  }, [goals, practices, timeFilter]);

  const StatCard = ({
    icon: Icon, label, value, subValue, color,
  }: {
    icon: any; label: string; value: string | number; subValue?: string; color: string;
  }) => (
    <div className="bg-card/40 backdrop-blur-xl rounded-2xl p-4 border border-foreground/[0.08]">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {subValue && <p className="text-xs text-muted-foreground mt-0.5">{subValue}</p>}
    </div>
  );

  const activeGoals = goals.filter((g) => !g.is_completed);
  const completedGoals = goals.filter((g) => g.is_completed);

  const FiltersRow = () => (
    <div className="flex gap-3 mt-4 flex-wrap">
      <div className="flex gap-1.5">
        {(["7days", "30days", "1year", "lifetime"] as TimeFilter[]).map((filter) => (
          <Button
            key={filter}
            variant="ghost"
            size="sm"
            onClick={() => setTimeFilter(filter)}
            className={cn(
              "rounded-xl h-7 px-2.5 text-[11px]",
              timeFilter === filter
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground"
            )}
          >
            {filter === "7days" ? "7D" : filter === "30days" ? "30D" : filter === "1year" ? "1Y" : "All"}
          </Button>
        ))}
      </div>
      <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
        <SelectTrigger className="w-[160px] h-7 rounded-xl text-[11px] border-foreground/[0.08]">
          <SelectValue placeholder="All Realities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Realities</SelectItem>
          {activeGoals.map((goal) => (
            <SelectItem key={goal.id} value={goal.id}>
              {goal.title.length > 22 ? goal.title.slice(0, 22) + "..." : goal.title}
            </SelectItem>
          ))}
          {completedGoals.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">
                Manifested
              </div>
              {completedGoals.map((goal) => (
                <SelectItem key={goal.id} value={goal.id} className="text-emerald-600">
                  {goal.title.length > 22 ? goal.title.slice(0, 22) + "..." : goal.title}
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 rounded-2xl overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-lg font-semibold">Analytics</DialogTitle>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <div className="px-6">
            <TabsList className="w-full justify-start gap-4">
              <TabsTrigger value="overview" className="flex items-center gap-1.5">
                <BarChart3 className="h-3 w-3" /> Overview
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-1.5">
                <CalendarIcon className="h-3 w-3" /> Calendar
              </TabsTrigger>
              <TabsTrigger value="consistency" className="flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3" /> Consistency
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── Overview Tab ── */}
          <TabsContent value="overview" className="mt-0">
            <div className="px-6 pb-2">
              <FiltersRow />
            </div>
            <div className="p-6 pt-3 overflow-y-auto max-h-[55vh]">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard icon={Clock} label="Time Visualizing" value={`${analytics.totalVizMinutes}m`} subValue={`${analytics.avgVizTimePerDay}m/day avg`} color="bg-primary/10 text-primary" />
                <StatCard icon={Eye} label="Visualizations" value={analytics.totalVisualizations} subValue={`${analytics.avgVizPerDay}/day avg`} color="bg-accent text-accent-foreground" />
                <StatCard icon={Zap} label="Actions Taken" value={analytics.totalActions} subValue={`${analytics.avgActionsPerDay}/day avg`} color="bg-chart-4/20 text-chart-4" />
                <StatCard icon={Camera} label="Proofs Collected" value={analytics.totalProofs} subValue={`${analytics.uniquePracticeDays} practice days`} color="bg-chart-2/20 text-chart-2" />
                <div className="bg-card/40 backdrop-blur-xl rounded-2xl p-4 border border-foreground/[0.08] sm:col-span-2">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-chart-3/20 text-chart-3">
                      <Award className="h-4 w-4" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">Most Visualized</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    {analytics.mostVisualizedGoal?.title || "No data yet"}
                  </p>
                  {analytics.mostVisualizedGoal && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedGoalId === "all" ? "Your most practiced reality" : "Selected reality"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Calendar Tab ── */}
          <TabsContent value="calendar" className="mt-0">
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <ManifestSidebarPanel
                selectedDate={selectedDate}
                onDateSelect={onDateSelect}
                goals={goals}
                practices={practices}
                section="calendar"
              />
            </div>
          </TabsContent>

          {/* ── Consistency Tab ── */}
          <TabsContent value="consistency" className="mt-0">
            <div className="px-6 pb-2">
              <FiltersRow />
            </div>
            <div className="p-6 pt-3 overflow-y-auto max-h-[55vh] space-y-5">
              {/* Overall consistency rate */}
              <div className="bg-card/40 backdrop-blur-xl rounded-2xl p-4 border border-foreground/[0.08]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Overall Consistency</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">{consistencyData.overallConsistency}%</span>
                </div>
                <Progress value={consistencyData.overallConsistency} className="h-2 rounded-full" />
                <p className="text-xs text-muted-foreground mt-2">
                  {consistencyData.practicedDaysInRange} of {consistencyData.totalDays} days practiced
                </p>
              </div>

              {/* 30-day heatmap */}
              <div className="bg-card/40 backdrop-blur-xl rounded-2xl p-4 border border-foreground/[0.08]">
                <p className="text-sm font-medium text-foreground mb-3">Last 30 Days</p>
                <div className="grid grid-cols-10 gap-1.5">
                  {consistencyData.heatmap.map((day) => (
                    <div
                      key={day.dateStr}
                      title={`${format(day.date, "MMM d")} — ${day.practiced ? "Practiced" : "Missed"}`}
                      className={cn(
                        "aspect-square rounded-md transition-colors",
                        day.practiced
                          ? "bg-primary/60"
                          : "bg-muted/40 border border-foreground/[0.05]"
                      )}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-2.5 text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-primary/60" /> Practiced</div>
                  <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-muted/40 border border-foreground/[0.05]" /> Missed</div>
                </div>
              </div>

              {/* Per-goal breakdown */}
              {consistencyData.perGoal.length > 0 && (
                <div className="space-y-2.5">
                  <p className="text-sm font-medium text-foreground">Per Reality</p>
                  {consistencyData.perGoal.map(({ goal, consistency, streak, missedDates }) => (
                    <div key={goal.id} className="bg-card/40 backdrop-blur-xl rounded-2xl p-3.5 border border-foreground/[0.08]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-foreground line-clamp-1 flex-1 mr-2">{goal.title}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {streak > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-destructive">
                              <Flame className="h-2.5 w-2.5" /> {streak}
                            </span>
                          )}
                          <span className="text-sm font-bold text-primary">{consistency}%</span>
                        </div>
                      </div>
                      <Progress value={consistency} className="h-1.5 rounded-full" />
                      {missedDates.length > 0 && (
                        <div className="mt-2 flex items-start gap-1.5">
                          <AlertCircle className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <p className="text-[10px] text-muted-foreground leading-relaxed">
                            Missed {missedDates.length} day{missedDates.length > 1 ? "s" : ""} this week:{" "}
                            {missedDates.map((d) => format(d, "EEE")).join(", ")}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
