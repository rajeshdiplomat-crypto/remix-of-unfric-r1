import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Play, Clock3 } from "lucide-react";
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

    const ongoing = active.find((t) => t._status === "ongoing");
    if (ongoing) return ongoing;

    const ui = active.find((t) => t.urgency === "high" && t.importance === "high");
    if (ui) return ui;

    return active[0] ?? null;
  }, [tasks]);

  if (!topTask) return null;

  const dueLabel = topTask.due_date
    ? `${format(new Date(topTask.due_date), "MMM d")}${topTask.due_time ? ` • ${topTask.due_time}` : ""}`
    : "";

  return (
    <Card className="rounded-2xl border border-border/60 bg-background/70 backdrop-blur-xl shadow-[0_12px_36px_rgba(0,0,0,0.08)]">
      <CardContent className={cn("flex items-center gap-2", collapsed ? "py-2 px-2.5" : "py-3 px-3")}>
        {/* Left icon */}
        <div
          className={cn(
            "rounded-2xl flex items-center justify-center shrink-0 border border-border/60 bg-background/60",
            collapsed ? "h-9 w-9" : "h-10 w-10",
          )}
        >
          <Play className={cn(collapsed ? "h-4 w-4" : "h-4 w-4")} />
        </div>

        {/* Main */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            {!collapsed && (
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Top focus
              </span>
            )}

            <p className={cn("min-w-0 truncate", collapsed ? "text-sm font-medium" : "text-sm font-semibold")}>
              {topTask.title}
            </p>
          </div>

          {!collapsed && (
            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
              {topTask.urgency === "high" && (
                <Badge
                  variant="outline"
                  className="h-5 px-2 text-[10px] rounded-full bg-background/60 border-border/60"
                >
                  Urgent
                </Badge>
              )}
              {topTask.importance === "high" && (
                <Badge
                  variant="outline"
                  className="h-5 px-2 text-[10px] rounded-full bg-background/60 border-border/60"
                >
                  Important
                </Badge>
              )}
              {!!dueLabel && (
                <Badge
                  variant="outline"
                  className="h-5 px-2 text-[10px] rounded-full bg-background/60 border-border/60"
                >
                  <Clock3 className="h-3 w-3 mr-1" />
                  {dueLabel}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="default"
            onClick={() => onStartFocus(topTask)}
            className={cn("rounded-full", collapsed ? "h-9 px-4 text-xs" : "h-9 px-4 text-xs")}
          >
            Focus
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setCollapsed((v) => !v)}
            className={cn("rounded-full border-border/60 bg-background/60", collapsed ? "h-9 w-9" : "h-9 w-9")}
            aria-label={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
