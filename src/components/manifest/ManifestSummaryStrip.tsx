import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Award, Flame, TrendingUp, Plus } from "lucide-react";

interface ManifestSummaryStripProps {
  activeGoals: number;
  manifestedGoals: number;
  dayStreak: number;
  momentumScore: number;
  onNewManifest: () => void;
}

export function ManifestSummaryStrip({
  activeGoals,
  manifestedGoals,
  dayStreak,
  momentumScore,
  onNewManifest
}: ManifestSummaryStripProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 px-4 bg-muted/30 rounded-lg border border-border/50">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{activeGoals}</span>
          <span className="text-xs text-muted-foreground">Active</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium">{manifestedGoals}</span>
          <span className="text-xs text-muted-foreground">Manifested</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-medium">{dayStreak}</span>
          <span className="text-xs text-muted-foreground">Day Streak</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium">{momentumScore}</span>
          <span className="text-xs text-muted-foreground">Momentum</span>
        </div>
      </div>
      
      <Button onClick={onNewManifest} size="sm" className="gap-2">
        <Plus className="h-4 w-4" />
        New Manifestation
      </Button>
    </div>
  );
}
