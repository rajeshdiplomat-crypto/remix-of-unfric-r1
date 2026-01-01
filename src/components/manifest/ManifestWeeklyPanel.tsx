import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Lightbulb } from "lucide-react";
import { type ManifestDailyPractice } from "./types";
import { subDays, parseISO, isSameDay, format } from "date-fns";

interface ManifestWeeklyPanelProps {
  practices: ManifestDailyPractice[];
}

export function ManifestWeeklyPanel({ practices }: ManifestWeeklyPanelProps) {
  const today = new Date();

  // Filter to last 7 days
  const weekPractices = practices.filter((p) => {
    const entryDate = parseISO(p.entry_date);
    return entryDate >= subDays(today, 7) && p.locked;
  });

  // Calculate metrics
  const avgAlignment = weekPractices.length
    ? Math.round(
        (weekPractices.reduce((sum, p) => sum + (p.alignment || 0), 0) /
          weekPractices.length) *
          10
      ) / 10
    : 0;

  const actAsIfDays = weekPractices.filter((p) => p.acted).length;

  const proofsLogged = weekPractices.filter((p) => p.proof_text).length;

  // Sparkline data
  const sparklineData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    const practice = weekPractices.find((p) =>
      isSameDay(parseISO(p.entry_date), date)
    );
    return practice?.alignment || 0;
  });

  // Insight based on metrics
  const getInsight = () => {
    if (avgAlignment >= 7) return "Momentum rising — keep 3-minute practices.";
    if (actAsIfDays >= 5) return "Great consistency with actions this week!";
    if (proofsLogged >= 5) return "Strong evidence collection — keep noticing.";
    return "Small steps compound. Keep showing up.";
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Weekly Momentum
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-lg font-semibold text-foreground">{avgAlignment}</p>
            <p className="text-xs text-muted-foreground">Avg Alignment</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-lg font-semibold text-foreground">{actAsIfDays}</p>
            <p className="text-xs text-muted-foreground">Act-as-If Days</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-lg font-semibold text-foreground">{proofsLogged}</p>
            <p className="text-xs text-muted-foreground">Proofs</p>
          </div>
        </div>

        {/* Sparkline */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Alignment this week</p>
          <div className="flex items-end gap-1 h-10">
            {sparklineData.map((value, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-sm transition-all"
                  style={{
                    height: value ? `${(value / 10) * 32}px` : "4px",
                    backgroundColor: value
                      ? `hsl(var(--primary) / ${0.3 + (value / 10) * 0.7})`
                      : "hsl(var(--muted))",
                  }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {format(subDays(today, 6 - i), "EEE").charAt(0)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Insight */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
          <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-foreground">{getInsight()}</p>
        </div>
      </CardContent>
    </Card>
  );
}
