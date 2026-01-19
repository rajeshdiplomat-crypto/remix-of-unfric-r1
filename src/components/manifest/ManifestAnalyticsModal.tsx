import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { subDays, parseISO, differenceInDays } from "date-fns";
import { type ManifestGoal, type ManifestDailyPractice } from "./types";

interface ManifestAnalyticsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goals: ManifestGoal[];
  practices: ManifestDailyPractice[];
}

type TimeFilter = "7days" | "30days" | "1year" | "lifetime";

export function ManifestAnalyticsModal({
  open,
  onOpenChange,
  goals,
  practices,
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
    
    // Filter by selected goal if not "all"
    if (selectedGoalId !== "all") {
      filtered = filtered.filter((p) => p.goal_id === selectedGoalId);
    }

    return filtered;
  }, [practices, timeFilter, selectedGoalId]);

  // Calculate analytics
  const analytics = useMemo(() => {
    const lockedPractices = filteredPractices;

    // Total visualization time
    const totalVizMinutes = lockedPractices.reduce((sum, p) => {
      const vizCount = p.visualization_count || 0;
      const goal = goals.find((g) => g.id === p.goal_id);
      const vizDuration = goal?.visualization_minutes || 3;
      return sum + vizCount * vizDuration;
    }, 0);

    // Total practice days
    const uniquePracticeDays = new Set(lockedPractices.map((p) => p.entry_date)).size;

    // Total visualizations
    const totalVisualizations = lockedPractices.reduce(
      (sum, p) => sum + (p.visualization_count || 0),
      0
    );

    // Total actions
    const totalActions = lockedPractices.reduce((sum, p) => sum + (p.act_count || 0), 0);

    // Total proofs
    const totalProofs = lockedPractices.reduce(
      (sum, p) => sum + (p.proofs?.length || 0),
      0
    );

    // Days in period
    const daysInPeriod =
      timeFilter === "7days"
        ? 7
        : timeFilter === "30days"
          ? 30
          : timeFilter === "1year"
            ? 365
            : Math.max(differenceInDays(new Date(), parseISO(lockedPractices[0]?.entry_date || new Date().toISOString())) + 1, 1);

    // Avg per day calculations
    const avgVizTimePerDay = uniquePracticeDays > 0 ? (totalVizMinutes / uniquePracticeDays).toFixed(1) : "0";
    const avgVizPerDay = uniquePracticeDays > 0 ? (totalVisualizations / uniquePracticeDays).toFixed(1) : "0";
    const avgActionsPerDay = uniquePracticeDays > 0 ? (totalActions / uniquePracticeDays).toFixed(1) : "0";

    // Most visualized goal
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

  const StatCard = ({
    icon: Icon,
    label,
    value,
    subValue,
    color,
  }: {
    icon: any;
    label: string;
    value: string | number;
    subValue?: string;
    color: string;
  }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-xs text-slate-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
      {subValue && <p className="text-xs text-slate-400 mt-0.5">{subValue}</p>}
    </div>
  );

  const activeGoals = goals.filter((g) => !g.is_completed);
  const completedGoals = goals.filter((g) => g.is_completed);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 rounded-2xl overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <DialogTitle className="text-lg font-semibold">Advanced Analytics</DialogTitle>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex gap-3 mt-4 flex-wrap">
            {/* Time Filter */}
            <div className="flex gap-2">
              {(["7days", "30days", "1year", "lifetime"] as TimeFilter[]).map((filter) => (
                <Button
                  key={filter}
                  variant="ghost"
                  size="sm"
                  onClick={() => setTimeFilter(filter)}
                  className={`rounded-lg h-8 px-3 ${
                    timeFilter === filter
                      ? "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                      : "text-slate-500"
                  }`}
                >
                  {filter === "7days"
                    ? "7 Days"
                    : filter === "30days"
                      ? "30 Days"
                      : filter === "1year"
                        ? "1 Year"
                        : "Lifetime"}
                </Button>
              ))}
            </div>

            {/* Entry Filter Dropdown */}
            <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
              <SelectTrigger className="w-[180px] h-8 rounded-lg text-xs">
                <SelectValue placeholder="All Realities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Realities</SelectItem>
                {activeGoals.map((goal) => (
                  <SelectItem key={goal.id} value={goal.id}>
                    {goal.title.length > 25 ? goal.title.slice(0, 25) + "..." : goal.title}
                  </SelectItem>
                ))}
                {completedGoals.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">
                      Manifested
                    </div>
                    {completedGoals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id} className="text-emerald-600">
                        <span className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {goal.title.length > 22 ? goal.title.slice(0, 22) + "..." : goal.title}
                        </span>
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </DialogHeader>

        <div className="p-6">
          {/* Stats Grid - 5 cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* 1. Total Time Spent Visualizing */}
            <StatCard
              icon={Clock}
              label="Total Time Visualizing"
              value={`${analytics.totalVizMinutes} min`}
              subValue={`${analytics.avgVizTimePerDay} min/day avg`}
              color="bg-cyan-100 text-cyan-600"
            />

            {/* 2. Total Visualizations */}
            <StatCard
              icon={Eye}
              label="Total Visualizations"
              value={analytics.totalVisualizations}
              subValue={`${analytics.avgVizPerDay}/day avg`}
              color="bg-blue-100 text-blue-600"
            />

            {/* 3. Total Actions Taken */}
            <StatCard
              icon={Zap}
              label="Total Actions Taken"
              value={analytics.totalActions}
              subValue={`${analytics.avgActionsPerDay}/day avg`}
              color="bg-amber-100 text-amber-600"
            />

            {/* 4. Total Proofs Collected */}
            <StatCard
              icon={Camera}
              label="Total Proofs Collected"
              value={analytics.totalProofs}
              subValue={`${analytics.uniquePracticeDays} practice days`}
              color="bg-emerald-100 text-emerald-600"
            />

            {/* 5. Most Visualized */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 sm:col-span-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                  <Award className="h-4 w-4" />
                </div>
                <span className="text-xs text-slate-500 font-medium">Most Visualized</span>
              </div>
              <p className="text-lg font-bold text-slate-800 dark:text-white">
                {analytics.mostVisualizedGoal?.title || "No data yet"}
              </p>
              {analytics.mostVisualizedGoal && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedGoalId === "all" ? "Your most practiced reality" : "Selected reality"}
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}