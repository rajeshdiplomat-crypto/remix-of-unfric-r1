import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronUp, Play, Zap, Camera, Sparkles } from "lucide-react";
import { type ManifestGoal, type ManifestCheckIn } from "./types";
import { format, subDays, isSameDay, parseISO } from "date-fns";

interface ManifestCardProps {
  goal: ManifestGoal;
  checkIns: ManifestCheckIn[];
  onVisualize: () => void;
  onDoAction: () => void;
  onLogProof: () => void;
  onOpenCheckIn: () => void;
  onCelebrate?: (proof: string) => void;
}

export function ManifestCard({
  goal,
  checkIns,
  onVisualize,
  onDoAction,
  onLogProof,
  onOpenCheckIn,
  onCelebrate,
}: ManifestCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Calculate streak
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const checkDate = subDays(today, i);
    const hasCheckIn = checkIns.some((c) =>
      isSameDay(parseISO(c.entry_date), checkDate)
    );
    if (hasCheckIn) streak++;
    else if (i > 0) break;
  }

  // Calculate momentum (simplified: based on recent check-ins and proofs)
  const last7DaysCheckIns = checkIns.filter((c) => {
    const entryDate = parseISO(c.entry_date);
    return entryDate >= subDays(today, 7);
  });
  const avgAlignment = last7DaysCheckIns.length
    ? last7DaysCheckIns.reduce((sum, c) => sum + c.alignment, 0) / last7DaysCheckIns.length
    : 0;
  const momentum = Math.round((avgAlignment / 10) * 100);

  // Get recent proofs
  const recentProofs = checkIns
    .flatMap((c) => c.proofs.map((p) => ({ text: p, date: c.entry_date })))
    .slice(0, 3);

  // 7-day sparkline data
  const sparklineData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    const checkIn = checkIns.find((c) => isSameDay(parseISO(c.entry_date), date));
    return checkIn?.alignment || 0;
  });

  return (
    <Card className="border-border/50 hover:border-border transition-colors">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground leading-tight">{goal.title}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">Active</Badge>
              {streak > 0 && (
                <Badge variant="outline" className="text-xs">
                  🔥 Streak {streak}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                Conviction {goal.conviction}/10
              </Badge>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(!expanded)}
            className="shrink-0"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {/* Momentum Bar */}
        <div className="mt-4 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Momentum</span>
            <span>{momentum}%</span>
          </div>
          <Progress value={momentum} className="h-1.5" />
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={onVisualize} className="text-xs">
            <Play className="h-3 w-3 mr-1" />
            Visualize (3m)
          </Button>
          <Button variant="outline" size="sm" onClick={onDoAction} className="text-xs">
            <Zap className="h-3 w-3 mr-1" />
            Do action
          </Button>
          <Button variant="outline" size="sm" onClick={onLogProof} className="text-xs">
            <Camera className="h-3 w-3 mr-1" />
            Log Proof
          </Button>
        </div>

        {/* Expanded Content */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
            {/* 7-day Sparkline */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">7-day conviction</p>
              <div className="flex items-end gap-1 h-8">
                {sparklineData.map((value, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-primary/20 rounded-sm transition-all"
                    style={{
                      height: value ? `${(value / 10) * 100}%` : "4px",
                      backgroundColor: value ? `hsl(var(--primary) / ${0.3 + (value / 10) * 0.7})` : undefined,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Today's Micro-action */}
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Today's micro-action</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{goal.act_as_if}</span>
                <Button variant="ghost" size="sm" onClick={onDoAction} className="text-xs">
                  Complete
                </Button>
              </div>
            </div>

            {/* Latest Proofs */}
            {recentProofs.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Latest proofs</p>
                <div className="space-y-2">
                  {recentProofs.map((proof, i) => (
                    <div
                      key={i}
                      className="flex items-start justify-between gap-2 p-2 rounded bg-muted/20"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{proof.text}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(proof.date), "MMM d")}
                        </p>
                      </div>
                      {onCelebrate && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCelebrate(proof.text)}
                          className="text-xs shrink-0"
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          Celebrate
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Open Check-in Button */}
            <Button onClick={onOpenCheckIn} className="w-full">
              Open Check-in
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
