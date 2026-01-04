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
    <Card className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm shadow-sm">
      <CardContent className={cn("flex items-center gap-2", collapsed ? "py-1 px-2" : "py-2 px-3")}>
        {/* Left icon */}
        <div
          className={cn(
            "rounded-xl flex items-center justify-center shrink-0",
            collapsed ? "h-6 w-6" : "h-8 w-8",
            "bg-primary/10 text-primary",
          )}
        >
          <Play className={cn(collapsed ? "h-3 w-3" : "h-3.5 w-3.5")} />
        </div>

        {/* Main */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            {!collapsed && (
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Top focus
              </span>
            )}

            <p
              className={cn(
                "min-w-0 truncate text-foreground",
                collapsed ? "text-[12px] font-medium" : "text-[13px] font-semibold",
              )}
            >
              {topTask.title}
            </p>
          </div>

          {!collapsed && (
            <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
              {topTask.urgency === "high" && (
                <Badge
                  variant="outline"
                  className="h-4 px-1.5 text-[9px] bg-destructive/10 text-destructive border-destructive/30"
                >
                  Urgent
                </Badge>
              )}
              {topTask.importance === "high" && (
                <Badge variant="outline" className="h-4 px-1.5 text-[9px] bg-primary/10 text-primary border-primary/30">
                  Important
                </Badge>
              )}
              {!!dueLabel && (
                <Badge variant="outline" className="h-4 px-1.5 text-[9px]">
                  {dueLabel}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            onClick={() => onStartFocus(topTask)}
            className={cn("rounded-xl", collapsed ? "h-6 px-2 text-[11px]" : "h-8 px-3 text-[12px]")}
          >
            Focus
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed((v) => !v)}
            className={cn("rounded-xl border border-border/40 bg-background/60", collapsed ? "h-6 w-6" : "h-8 w-8")}
            aria-label={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
