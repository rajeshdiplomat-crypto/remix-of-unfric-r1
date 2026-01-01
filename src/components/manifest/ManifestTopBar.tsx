import { Button } from "@/components/ui/button";
import { Plus, Flame, Target, TrendingUp } from "lucide-react";

interface ManifestTopBarProps {
  activeCount: number;
  dayStreak: number;
  momentumScore: number;
  onNewManifest: () => void;
}

export function ManifestTopBar({
  activeCount,
  dayStreak,
  momentumScore,
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
            <span className="font-medium text-foreground">{dayStreak}</span>
            <span className="text-muted-foreground ml-1">Day Streak</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-sm">
            <span className="font-medium text-foreground">{momentumScore}%</span>
            <span className="text-muted-foreground ml-1">Momentum</span>
          </span>
        </div>
      </div>

      <Button onClick={onNewManifest} size="sm">
        <Plus className="h-4 w-4 mr-1" />
        New Manifestation
      </Button>
    </div>
  );
}
