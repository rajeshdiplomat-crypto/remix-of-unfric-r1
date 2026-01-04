import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Play } from "lucide-react";
import { format } from "date-fns";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { QuadrantTask, computeTaskStatus } from "./types";

interface TopFocusBarProps {
  tasks: QuadrantTask[];
  onStartFocus: (task: QuadrantTask) => void;
}

export function TopFocusBar({ tasks, onStartFocus }: TopFocusBarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const topTask = useMemo(() => {
    const active = tasks
      .filter((t) => !(t.is_completed || t.completed_at))
      .map((t) => ({ ...t, _status: computeTaskStatus(t) as ReturnType<typeof computeTaskStatus> }));

    // 1) ongoing first
    const ongoing = active.find((t) => t._status === "ongoing");
    if (ongoing) return ongoing;

    // 2) urgent+important next
    const ui = active.find((t) => t.urgency === "high" && t.importance === "high");
    if (ui) return ui;

    // 3) anything upcoming
    return active[0] ?? null;
  }, [tasks]);

  if (!topTask) return null;

  const dueLabel = topTask.due_date
    ? `${format(new Date(topTask.due_date), "MMM d")}${topTask.due_time ? ` • ${topTask.due_time}` : ""}`
    : "";

  return (
    <Card className="rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm shadow-sm">
      <CardContent className={cn("flex items-center", collapsed ? "py-0.5 px-2 gap-1" : "py-1.5 px-2 gap-1.5")}>
        {/* Left icon */}
        <div
          className={cn(
            "rounded-lg flex items-center justify-center shrink-0",
            collapsed ? "h-5 w-5" : "h-6 w-6",
            "bg-primary/10 text-primary",
          )}
        >
          <Play className={cn(collapsed ? "h-2.5 w-2.5" : "h-3 w-3")} />
        </div>

        {/* Main */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            {!collapsed && (
              <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Top focus
              </span>
            )}

            <p
              className={cn(
                "min-w-0 truncate text-foreground",
                collapsed ? "text-[10px] font-medium" : "text-[11px] font-semibold",
              )}
            >
              {topTask.title}
            </p>
          </div>

          {!collapsed && (
            <div className="flex items-center gap-1 flex-wrap">
              {topTask.urgency === "high" && (
                <Badge
                  variant="outline"
                  className="h-3.5 px-1 text-[8px] bg-destructive/10 text-destructive border-destructive/30"
                >
                  Urgent
                </Badge>
              )}
              {topTask.importance === "high" && (
                <Badge variant="outline" className="h-3.5 px-1 text-[8px] bg-primary/10 text-primary border-primary/30">
                  Important
                </Badge>
              )}
              {!!dueLabel && (
                <Badge variant="outline" className="h-3.5 px-1 text-[8px]">
                  {dueLabel}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            onClick={() => onStartFocus(topTask)}
            className={cn("rounded-lg", collapsed ? "h-5 px-1.5 text-[9px]" : "h-6 px-2 text-[10px]")}
          >
            Focus
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed((v) => !v)}
            className={cn("rounded-lg border border-border/40 bg-background/60", collapsed ? "h-5 w-5" : "h-6 w-6")}
            aria-label={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
