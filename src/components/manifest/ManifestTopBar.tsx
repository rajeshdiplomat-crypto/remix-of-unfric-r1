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
    <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-card border border-border/40 shadow-sm">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        {/* Active chip */}
        <div className="flex items-center gap-2.5 rounded-full border border-border/40 bg-muted/30 px-4 py-2.5 transition-colors hover:bg-muted/50">
          <span className="h-8 w-8 rounded-full bg-background flex items-center justify-center shadow-sm">
            <Target className="h-4 w-4 text-muted-foreground" />
          </span>
          <div className="flex flex-col">
            <span className="text-base font-semibold text-foreground leading-none">{activeCount}</span>
            <span className="text-xs text-muted-foreground">Active</span>
          </div>
        </div>

        {/* Streak chip */}
        <div className="flex items-center gap-2.5 rounded-full border border-border/40 bg-muted/30 px-4 py-2.5 transition-colors hover:bg-muted/50">
          <span className="h-8 w-8 rounded-full bg-background flex items-center justify-center shadow-sm">
            <Flame className="h-4 w-4 text-orange-500" />
          </span>
          <div className="flex flex-col">
            <span className="text-base font-semibold text-foreground leading-none">{streak}</span>
            <span className="text-xs text-muted-foreground">Streak</span>
          </div>
        </div>

        {/* Momentum chip */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2.5 cursor-help rounded-full border border-border/40 bg-muted/30 px-4 py-2.5 transition-colors hover:bg-muted/50">
                <span className="h-8 w-8 rounded-full bg-background flex items-center justify-center shadow-sm">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </span>
                <div className="flex flex-col">
                  <span className="text-base font-semibold text-foreground leading-none">{avgMomentum}%</span>
                  <span className="text-xs text-muted-foreground">Momentum</span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">Momentum measures how consistently this assumption is being practiced.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Button onClick={onNewManifest} size="sm" variant="default" className="rounded-full px-5 h-10 shadow-sm">
        <Plus className="h-4 w-4 mr-1.5" />
        New Manifestation
      </Button>
    </div>
  );
}
