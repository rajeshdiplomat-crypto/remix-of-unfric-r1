import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart3,
  Clock,
  TrendingUp,
  Eye,
  Zap,
  Camera,
  Flame,
  Calendar,
  Target,
  Award,
  Activity,
} from "lucide-react";
import { format, subDays, parseISO, differenceInDays, startOfWeek, eachDayOfInterval } from "date-fns";
import { type ManifestGoal, type ManifestDailyPractice, DAILY_PRACTICE_KEY } from "./types";

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

    return practices.filter((p) => p.locked && parseISO(p.entry_date) >= cutoffDate);
  }, [practices, timeFilter]);

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

    // Proofs with images
    const proofsWithImages = lockedPractices.reduce(
      (sum, p) => sum + (p.proofs?.filter((pr) => pr.image_url)?.length || 0),
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
            : differenceInDays(new Date(), parseISO(lockedPractices[0]?.entry_date || new Date().toISOString())) + 1;

    // Completion rate
    const completionRate = Math.round((uniquePracticeDays / Math.max(daysInPeriod, 1)) * 100);

    // Avg viz time per day
    const avgVizPerDay = uniquePracticeDays > 0 ? Math.round(totalVizMinutes / uniquePracticeDays) : 0;

    // Current streak
    let currentStreak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const checkDate = format(subDays(today, i), "yyyy-MM-dd");
      const hasPractice = practices.some((p) => p.entry_date === checkDate && p.locked);
      if (hasPractice) currentStreak++;
      else if (i > 0) break;
    }

    // Best streak
    let bestStreak = 0;
    let tempStreak = 0;
    const sortedDates = [...new Set(practices.filter((p) => p.locked).map((p) => p.entry_date))].sort();
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = parseISO(sortedDates[i - 1]);
        const currDate = parseISO(sortedDates[i]);
        if (differenceInDays(currDate, prevDate) === 1) {
          tempStreak++;
        } else {
          bestStreak = Math.max(bestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    bestStreak = Math.max(bestStreak, tempStreak);

    // Most visualized goal
    const goalVizCounts: Record<string, number> = {};
    lockedPractices.forEach((p) => {
      goalVizCounts[p.goal_id] = (goalVizCounts[p.goal_id] || 0) + (p.visualization_count || 0);
    });
    const mostVisualizedGoalId = Object.entries(goalVizCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const mostVisualizedGoal = goals.find((g) => g.id === mostVisualizedGoalId);

    // Most documented goal
    const goalProofCounts: Record<string, number> = {};
    lockedPractices.forEach((p) => {
      goalProofCounts[p.goal_id] = (goalProofCounts[p.goal_id] || 0) + (p.proofs?.length || 0);
    });
    const mostDocumentedGoalId = Object.entries(goalProofCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const mostDocumentedGoal = goals.find((g) => g.id === mostDocumentedGoalId);

    // Weekly activity (last 7 days breakdown)
    const weekActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "yyyy-MM-dd");
      const dayPractices = practices.filter((p) => p.entry_date === dateStr && p.locked);
      weekActivity.push({
        day: format(date, "EEE"),
        count: dayPractices.length,
        vizMinutes: dayPractices.reduce((sum, p) => {
          const goal = goals.find((g) => g.id === p.goal_id);
          return sum + (p.visualization_count || 0) * (goal?.visualization_minutes || 3);
        }, 0),
      });
    }

    return {
      totalVizMinutes,
      totalVisualizations,
      totalActions,
      totalProofs,
      proofsWithImages,
      uniquePracticeDays,
      completionRate,
      avgVizPerDay,
      currentStreak,
      bestStreak,
      mostVisualizedGoal,
      mostDocumentedGoal,
      weekActivity,
    };
  }, [filteredPractices, goals, practices, timeFilter]);

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

          {/* Time Filter */}
          <div className="flex gap-2 mt-4">
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
        </DialogHeader>

        <ScrollArea className="h-[60vh]">
          <div className="p-6 space-y-6">
            {/* Overview Stats */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-teal-500" />
                Overview
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard
                  icon={Calendar}
                  label="Practice Days"
                  value={analytics.uniquePracticeDays}
                  subValue={`${analytics.completionRate}% consistency`}
                  color="bg-teal-100 text-teal-600"
                />
                <StatCard
                  icon={Flame}
                  label="Current Streak"
                  value={`${analytics.currentStreak} days`}
                  subValue={`Best: ${analytics.bestStreak} days`}
                  color="bg-orange-100 text-orange-600"
                />
                <StatCard
                  icon={Target}
                  label="Active Visions"
                  value={goals.filter((g) => !g.is_completed).length}
                  color="bg-purple-100 text-purple-600"
                />
              </div>
            </div>

            {/* Visualization Stats */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                <Eye className="h-4 w-4 text-cyan-500" />
                Visualization Analytics
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard
                  icon={Clock}
                  label="Total Time"
                  value={`${analytics.totalVizMinutes} min`}
                  subValue={`${Math.round(analytics.totalVizMinutes / 60)} hours`}
                  color="bg-cyan-100 text-cyan-600"
                />
                <StatCard
                  icon={Eye}
                  label="Sessions"
                  value={analytics.totalVisualizations}
                  subValue={`${analytics.avgVizPerDay} min/day avg`}
                  color="bg-blue-100 text-blue-600"
                />
                <StatCard
                  icon={Award}
                  label="Most Visualized"
                  value={analytics.mostVisualizedGoal?.title?.slice(0, 15) + "..." || "None"}
                  color="bg-indigo-100 text-indigo-600"
                />
              </div>
            </div>

            {/* Action Stats */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                Action Analytics
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard
                  icon={Zap}
                  label="Total Actions"
                  value={analytics.totalActions}
                  subValue={`${Math.round(analytics.totalActions / Math.max(analytics.uniquePracticeDays, 1))} per day`}
                  color="bg-amber-100 text-amber-600"
                />
                <StatCard
                  icon={Camera}
                  label="Total Proofs"
                  value={analytics.totalProofs}
                  subValue={`${analytics.proofsWithImages} with photos`}
                  color="bg-emerald-100 text-emerald-600"
                />
                <StatCard
                  icon={Award}
                  label="Most Documented"
                  value={analytics.mostDocumentedGoal?.title?.slice(0, 15) + "..." || "None"}
                  color="bg-green-100 text-green-600"
                />
              </div>
            </div>

            {/* Weekly Activity */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Last 7 Days Activity
              </h3>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-end justify-between gap-2 h-24">
                  {analytics.weekActivity.map((day, i) => {
                    const maxMinutes = Math.max(...analytics.weekActivity.map((d) => d.vizMinutes), 1);
                    const height = (day.vizMinutes / maxMinutes) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex flex-col items-center justify-end h-16">
                          <div
                            className="w-full max-w-8 rounded-t-lg bg-gradient-to-t from-teal-500 to-cyan-400 transition-all"
                            style={{ height: `${Math.max(height, 4)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">{day.day}</span>
                        <span className="text-[10px] text-teal-500 font-semibold">{day.vizMinutes}m</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Insights */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-500" />
                Insights
              </h3>
              <div className="space-y-2">
                {analytics.currentStreak >= 7 && (
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-3 border border-orange-100 dark:border-orange-800/30">
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      🔥 Amazing! You've maintained a {analytics.currentStreak}-day streak. Keep the momentum going!
                    </p>
                  </div>
                )}
                {analytics.completionRate >= 80 && (
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-3 border border-emerald-100 dark:border-emerald-800/30">
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                      ⭐ Excellent consistency! You've practiced {analytics.completionRate}% of days.
                    </p>
                  </div>
                )}
                {analytics.totalVizMinutes >= 60 && (
                  <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-xl p-3 border border-cyan-100 dark:border-cyan-800/30">
                    <p className="text-sm text-cyan-700 dark:text-cyan-300">
                      🧘 You've spent {Math.round(analytics.totalVizMinutes / 60)} hours visualizing your dreams into reality!
                    </p>
                  </div>
                )}
                {analytics.totalProofs >= 10 && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-3 border border-purple-100 dark:border-purple-800/30">
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      📸 You've documented {analytics.totalProofs} proofs of your manifestations coming true!
                    </p>
                  </div>
                )}
                {analytics.currentStreak === 0 && (
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      💫 Start your practice today to build your manifestation momentum!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
