import { Button } from "@/components/ui/button";
import { Sparkles, Flame, TrendingUp, Plus } from "lucide-react";
import { useMemo } from "react";

interface ManifestTopBarProps {
  activeCount: number;
  streak: number;
  avgMomentum: number;
  onNewManifest: () => void;
}

function getActiveLabel(count: number): string {
  if (count === 0) return "No active realities yet";
  if (count === 1) return "Focusing on 1 reality";
  if (count <= 3) return `Building ${count} dreams`;
  return `Manifesting ${count} realities`;
}

function getStreakLabel(streak: number): string {
  if (streak === 0) return "Start your streak today";
  if (streak === 1) return "Day 1 - Great start!";
  if (streak <= 3) return `${streak} days strong`;
  if (streak <= 7) return `${streak} days - On fire!`;
  if (streak <= 14) return `${streak} days - Unstoppable`;
  if (streak <= 30) return `${streak} days - Legendary`;
  return `${streak} days - Master level`;
}

function getMomentumLabel(momentum: number): string {
  if (momentum === 0) return "Begin your journey";
  if (momentum < 25) return "Building momentum";
  if (momentum < 50) return "Gaining traction";
  if (momentum < 75) return "Strong progress";
  if (momentum < 90) return "Almost there";
  return "Peak momentum";
}

export function ManifestTopBar({ activeCount, streak, avgMomentum, onNewManifest }: ManifestTopBarProps) {
  const activeLabel = useMemo(() => getActiveLabel(activeCount), [activeCount]);
  const streakLabel = useMemo(() => getStreakLabel(streak), [streak]);
  const momentumLabel = useMemo(() => getMomentumLabel(avgMomentum), [avgMomentum]);

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      {/* Stats */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <Sparkles className="h-4 w-4 text-teal-500 flex-shrink-0" />
          <span className="text-xs text-slate-600 dark:text-slate-300">{activeLabel}</span>
        </div>

        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <Flame className="h-4 w-4 text-orange-500 flex-shrink-0" />
          <span className="text-xs text-slate-600 dark:text-slate-300">{streakLabel}</span>
        </div>

        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <TrendingUp className="h-4 w-4 text-cyan-500 flex-shrink-0" />
          <span className="text-xs text-slate-600 dark:text-slate-300">{momentumLabel}</span>
        </div>
      </div>

      {/* New Button */}
      <Button
        onClick={onNewManifest}
        className="h-10 px-5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-medium shadow-md"
      >
        <Plus className="h-4 w-4 mr-2" />
        New Reality
      </Button>
    </div>
  );
}