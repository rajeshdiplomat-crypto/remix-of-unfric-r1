import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { type ManifestGoal, type ManifestProof } from "./types";

interface ManifestCardProps {
  goal: ManifestGoal;
  streak: number;
  momentum: number;
  lastProof?: ManifestProof;
  isSelected: boolean;
  onClick: () => void;
}

export function ManifestCard({
  goal,
  streak,
  momentum,
  lastProof,
  isSelected,
  onClick,
}: ManifestCardProps) {
  return (
    <Card
      className={`border-border/50 cursor-pointer transition-all hover:border-primary/50 ${
        isSelected ? "ring-2 ring-primary border-primary border-l-4 border-l-primary" : ""
      }`}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      <CardContent className="p-4">
        {/* Assumption Text */}
        <h3 className="font-medium text-foreground leading-tight mb-3">
          {goal.title}
        </h3>

        {/* Status Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant={goal.is_locked ? "secondary" : "default"} className="text-xs">
            {goal.is_locked ? "Locked" : "Active"}
          </Badge>
          {streak > 0 && (
            <Badge variant="outline" className="text-xs">
              🔥 Day {streak}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            Conviction {goal.conviction}/10
          </Badge>
        </div>

        {/* Momentum Bar */}
        <div className="space-y-1 mb-3">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Momentum</span>
            <span>{momentum}%</span>
          </div>
          <Progress value={momentum} className="h-1.5" />
        </div>

        {/* Last Saved Proof */}
        {lastProof && (
          <div className="text-xs text-muted-foreground truncate">
            <span className="text-foreground/70">Last proof:</span>{" "}
            {lastProof.text}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
