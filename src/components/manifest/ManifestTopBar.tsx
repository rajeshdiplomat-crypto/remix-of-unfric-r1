import { Button } from "@/components/ui/button";
import { Plus, Flame, Target, TrendingUp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ManifestTopBarProps {
  activeCount: number;
  streak: number;
  avgMomentum: number;
  onNewManifest: () => void;
}

export function ManifestTopBar({
  activeCount,
  streak,
  avgMomentum,
  onNewManifest,
}: ManifestTopBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-card border border-border/50">
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            <span className="font-medium text-foreground">{activeCount}</span>
            <span className="text-muted-foreground ml-1">Active</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          <span className="text-sm">
            <span className="font-medium text-foreground">{streak}</span>
            <span className="text-muted-foreground ml-1">Streak</span>
          </span>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 cursor-help">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm">
                  <span className="font-medium text-foreground">{avgMomentum}%</span>
                  <span className="text-muted-foreground ml-1">Momentum</span>
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-xs">
                Momentum measures how consistently this assumption is being practiced.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Button onClick={onNewManifest} size="sm">
        <Plus className="h-4 w-4 mr-1" />
        New Manifestation
      </Button>
    </div>
  );
}
