import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Play, Clock } from "lucide-react";
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
    <Card
      className={cn(
        "rounded-2xl border-border bg-card/95 shadow-sm",
        "backdrop-blur supports-[backdrop-filter]:bg-card/80",
      )}
    >
      <CardContent className={cn("relative flex items-center gap-2", collapsed ? "py-2 px-2.5" : "py-3 px-3")}>
        {/* Soft highlight */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-muted/10 via-transparent to-transparent" />

        {/* Left icon */}
        <div
          className={cn(
            "relative z-[1] rounded-2xl border border-border bg-muted/20 text-foreground",
            "flex items-center justify-center shrink-0",
            collapsed ? "h-9 w-9" : "h-10 w-10",
          )}
        >
          <Play className={cn(collapsed ? "h-4 w-4" : "h-[18px] w-[18px]")} />
        </div>

        {/* Main */}
        <div className="relative z-[1] min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            {!collapsed && (
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
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

          {!collapsed ? (
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              {topTask.urgency === "high" && (
                <Badge variant="outline" className="rounded-full bg-muted/10 border-border text-[10px] h-5 px-2">
                  Urgent
                </Badge>
              )}
              {topTask.importance === "high" && (
                <Badge variant="outline" className="rounded-full bg-muted/10 border-border text-[10px] h-5 px-2">
                  Important
                </Badge>
              )}
              {!!dueLabel && (
                <Badge variant="outline" className="rounded-full text-[10px] h-5 px-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {dueLabel}
                </Badge>
              )}
            </div>
          ) : (
            !!dueLabel && <div className="mt-0.5 text-[11px] text-muted-foreground truncate">Due {dueLabel}</div>
          )}
        </div>

        {/* Right actions */}
        <div className="relative z-[1] flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={() => onStartFocus(topTask)}
            className={cn(
              "rounded-2xl border-border",
              "hover:bg-muted/20",
              collapsed ? "h-9 px-3 text-[11px]" : "h-10 px-4 text-[12px]",
            )}
          >
            Focus
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed((v) => !v)}
            className={cn(
              "rounded-2xl border border-border bg-background/40 hover:bg-muted/20",
              collapsed ? "h-9 w-9" : "h-10 w-10",
            )}
            aria-label={collapsed ? "Expand top focus" : "Collapse top focus"}
            aria-expanded={!collapsed}
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
