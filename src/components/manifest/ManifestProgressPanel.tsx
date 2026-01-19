import { memo } from "react";
import { TrendingUp, Sparkles, Flame, Target } from "lucide-react";
import { type ManifestGoal, type ManifestDailyPractice } from "./types";

interface ManifestProgressPanelProps {
  activeCount: number;
  streak: number;
  avgMomentum: number;
  practices: ManifestDailyPractice[];
}

export const ManifestProgressPanel = memo(function ManifestProgressPanel({
  activeCount,
  streak,
  avgMomentum,
  practices,
}: ManifestProgressPanelProps) {
  const completedToday = practices.filter((p) => p.locked).length;

  const getManifestingSentence = () => {
    if (activeCount === 0) return "Create your first vision to begin";
    if (activeCount === 1) return "Manifesting 1 vision";
    return `Manifesting ${activeCount} visions`;
  };

  const getStreakSentence = () => {
    if (streak === 0) return "Start your manifesting journey today";
    if (streak === 1) return "Day 1 - Great start!";
    if (streak < 7) return `Day ${streak} - Building momentum`;
    if (streak < 30) return `Day ${streak} - Amazing consistency!`;
    return `Day ${streak} - Master manifestor!`;
  };

  const getMomentumSentence = () => {
    if (avgMomentum === 0) return "Complete your first practice";
    if (avgMomentum < 30) return "Keep going, momentum is building";
    if (avgMomentum < 60) return "Good progress this week";
    if (avgMomentum < 80) return "Strong momentum!";
    return "Peak manifestation energy!";
  };

  return (
    <div className="w-full h-full overflow-auto space-y-4 pb-4">
      {/* Progress Box */}
      <div className="bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 dark:from-teal-900/20 dark:via-cyan-900/20 dark:to-emerald-900/20 rounded-2xl shadow-sm border border-teal-100/50 dark:border-teal-800/50 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-teal-100/30 dark:border-teal-800/30">
          <div className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
            <TrendingUp className="h-4 w-4 text-teal-600" />
          </div>
          <span className="text-sm font-semibold text-teal-800 dark:text-teal-200">Your Progress</span>
        </div>
        <div className="p-3 space-y-2">
          {/* Active Visions */}
          <div className="flex items-start gap-3 bg-white/60 dark:bg-slate-800/60 rounded-xl p-2.5 border border-white/50 dark:border-slate-700/50">
            <div className="p-1 bg-teal-100 dark:bg-teal-900/50 rounded-lg mt-0.5">
              <Target className="h-3 w-3 text-teal-600" />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{getManifestingSentence()}</p>
          </div>

          {/* Streak */}
          <div className="flex items-start gap-3 bg-white/60 dark:bg-slate-800/60 rounded-xl p-2.5 border border-white/50 dark:border-slate-700/50">
            <div className="p-1 bg-orange-100 dark:bg-orange-900/50 rounded-lg mt-0.5">
              <Flame className="h-3 w-3 text-orange-600" />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{getStreakSentence()}</p>
          </div>

          {/* Momentum */}
          <div className="flex items-start gap-3 bg-white/60 dark:bg-slate-800/60 rounded-xl p-2.5 border border-white/50 dark:border-slate-700/50">
            <div className="p-1 bg-cyan-100 dark:bg-cyan-900/50 rounded-lg mt-0.5">
              <Sparkles className="h-3 w-3 text-cyan-600" />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{getMomentumSentence()}</p>
          </div>
        </div>
      </div>

      {/* Momentum Meter */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-50 dark:border-slate-700">
          <div className="p-1.5 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
            <TrendingUp className="h-4 w-4 text-cyan-600" />
          </div>
          <span className="text-sm font-semibold text-slate-800 dark:text-white">Momentum</span>
        </div>
        <div className="p-4">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-slate-500">Weekly Average</span>
            <span className="font-semibold text-teal-600">{avgMomentum}%</span>
          </div>
          <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${avgMomentum}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-2 text-center">
            {avgMomentum < 50
              ? "Complete more practices to boost momentum"
              : avgMomentum < 80
                ? "Great progress! Keep the energy high"
                : "Outstanding! You're in the flow"}
          </p>
        </div>
      </div>
    </div>
  );
});
