import { TasksClockWidget } from "./TasksClockWidget";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Smile, Frown, Meh } from "lucide-react";

export function TasksRightSidebar() {
  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      {/* Clock Widget */}
      <div className="h-[280px] shrink-0">
        <TasksClockWidget />
      </div>

      {/* Emotional Patterns */}
      <Card className="rounded-xl border border-border/40 flex-1">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
              Emotional Patterns
            </span>
          </div>

          <div className="space-y-2">
            <PatternRow icon={<Smile className="h-3.5 w-3.5 text-chart-1" />} label="Productive" value="68%" />
            <PatternRow icon={<Meh className="h-3.5 w-3.5 text-chart-2" />} label="Neutral" value="22%" />
            <PatternRow icon={<Frown className="h-3.5 w-3.5 text-destructive" />} label="Stressed" value="10%" />
          </div>

          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Your productivity peaks in the morning. Consider scheduling important tasks before noon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function PatternRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-foreground">{label}</span>
      </div>
      <span className="text-xs font-medium text-muted-foreground">{value}</span>
    </div>
  );
}
