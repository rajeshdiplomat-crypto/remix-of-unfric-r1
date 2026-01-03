import { Button } from "@/components/ui/button";
import { Plus, Flame, Target, TrendingUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ManifestTopBarProps {
  activeCount: number;
  streak: number;
  avgMomentum: number;
  onNewManifest: () => void;
}

export function ManifestTopBar({ activeCount, streak, avgMomentum, onNewManifest }: ManifestTopBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-card border border-border/50 shadow-sm">
      <div className="flex flex-wrap items-center gap-3 sm:gap-5">
        <div className="flex items-center gap-2 rounded-full border border-border/50 bg-background/40 px-3 py-2">
          <span className="h-7 w-7 rounded-full bg-muted/40 flex items-center justify-center">
            <Target className="h-4 w-4 text-muted-foreground" />
          </span>
          <span className="text-sm">
            <span className="font-semibold text-foreground">{activeCount}</span>
            <span className="text-muted-foreground ml-1">Active</span>
          </span>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-border/50 bg-background/40 px-3 py-2">
          <span className="h-7 w-7 rounded-full bg-muted/40 flex items-center justify-center">
            <Flame className="h-4 w-4 text-orange-500" />
          </span>
          <span className="text-sm">
            <span className="font-semibold text-foreground">{streak}</span>
            <span className="text-muted-foreground ml-1">Streak</span>
          </span>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 cursor-help rounded-full border border-border/50 bg-background/40 px-3 py-2">
                <span className="h-7 w-7 rounded-full bg-muted/40 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </span>
                <span className="text-sm">
                  <span className="font-semibold text-foreground">{avgMomentum}%</span>
                  <span className="text-muted-foreground ml-1">Momentum</span>
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-xs">Momentum measures how consistently this assumption is being practiced.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Button onClick={onNewManifest} size="sm" className="rounded-full px-4">
        <Plus className="h-4 w-4 mr-1" />
        New Manifestation
      </Button>
    </div>
  );
}
