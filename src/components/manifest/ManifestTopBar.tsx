import { Button } from "@/components/ui/button";
import { Sparkles, Flame, TrendingUp, Plus } from "lucide-react";

interface ManifestTopBarProps {
  activeCount: number;
  streak: number;
  avgMomentum: number;
  onNewManifest: () => void;
}

export function ManifestTopBar({ activeCount, streak, avgMomentum, onNewManifest }: ManifestTopBarProps) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      {/* Stats */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <Sparkles className="h-4 w-4 text-teal-500" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{activeCount}</span>
          <span className="text-xs text-slate-500">Active</span>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <Flame className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{streak}</span>
          <span className="text-xs text-slate-500">Day Streak</span>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <TrendingUp className="h-4 w-4 text-cyan-500" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{avgMomentum}%</span>
          <span className="text-xs text-slate-500">Momentum</span>
        </div>
      </div>

      {/* New Button */}
      <Button
        onClick={onNewManifest}
        className="h-10 px-5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-medium shadow-md"
      >
        <Plus className="h-4 w-4 mr-2" />
        New Vision
      </Button>
    </div>
  );
}
