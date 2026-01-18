import { Button } from "@/components/ui/button";
import { Plus, Flame, Target, TrendingUp, Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ManifestTopBarProps {
  activeCount: number;
  streak: number;
  avgMomentum: number;
  onNewManifest: () => void;
}

export function ManifestTopBar({ activeCount, streak, avgMomentum, onNewManifest }: ManifestTopBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        {/* Active chip */}
        <div className="flex items-center gap-2.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 transition-all hover:border-teal-300 hover:bg-teal-50/50 dark:hover:bg-teal-900/20">
          <span className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-sm">
            <Target className="h-4 w-4 text-white" />
          </span>
          <div className="flex flex-col">
            <span className="text-base font-bold text-slate-800 dark:text-slate-100 leading-none">{activeCount}</span>
            <span className="text-xs text-slate-500">Active</span>
          </div>
        </div>

        {/* Streak chip */}
        <div className="flex items-center gap-2.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 transition-all hover:border-orange-300 hover:bg-orange-50/50 dark:hover:bg-orange-900/20">
          <span className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-sm">
            <Flame className="h-4 w-4 text-white" />
          </span>
          <div className="flex flex-col">
            <span className="text-base font-bold text-slate-800 dark:text-slate-100 leading-none">{streak}</span>
            <span className="text-xs text-slate-500">Streak</span>
          </div>
        </div>

        {/* Momentum chip */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2.5 cursor-help rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 transition-all hover:border-cyan-300 hover:bg-cyan-50/50 dark:hover:bg-cyan-900/20">
                <span className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-sm">
                  <TrendingUp className="h-4 w-4 text-white" />
                </span>
                <div className="flex flex-col">
                  <span className="text-base font-bold text-slate-800 dark:text-slate-100 leading-none">
                    {avgMomentum}%
                  </span>
                  <span className="text-xs text-slate-500">Momentum</span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">Momentum measures how consistently your beliefs are being practiced.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Button
        onClick={onNewManifest}
        size="sm"
        className="rounded-full px-5 h-11 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg shadow-teal-500/25 transition-all"
      >
        <Sparkles className="h-4 w-4 mr-1.5" />
        New Manifestation
      </Button>
    </div>
  );
}
