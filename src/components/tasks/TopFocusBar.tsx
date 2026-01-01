import { useMemo, useState } from "react";
import { ChevronDown, Play, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuadrantTask, computeTaskStatus } from "./types";

interface TopFocusBarProps {
  tasks: QuadrantTask[];
  onStartFocus: (task: QuadrantTask) => void;
}

const shell = "rounded-2xl border border-border/35 bg-card/60 backdrop-blur-sm shadow-[0_8px_30px_rgba(0,0,0,0.04)]";
const micro = "transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_12px_36px_rgba(0,0,0,0.06)]";

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground">
      {children}
    </span>
  );
}

export function TopFocusBar({ tasks, onStartFocus }: TopFocusBarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const focusTask = useMemo(() => {
    const withStatus = tasks.map((t) => ({ ...t, __s: computeTaskStatus(t) }));

    // 1) ongoing first
    const ongoing = withStatus.find((t) => t.__s === "ongoing" && !t.is_completed && !t.completed_at);
    if (ongoing) return ongoing;

    // 2) overdue next
    const overdue = withStatus.find((t) => t.__s === "overdue" && !t.is_completed && !t.completed_at);
    if (overdue) return overdue;

    // 3) upcoming (first)
    const upcoming = withStatus.find((t) => t.__s === "upcoming" && !t.is_completed && !t.completed_at);
    return upcoming ?? null;
  }, [tasks]);

  if (!focusTask) return null;

  return (
    <Card className={`${shell} ${micro} overflow-hidden`}>
      {/* subtle left accent */}
      <div className="absolute inset-y-0 left-0 w-[3px] bg-primary/35" />
      {/* soft wash */}
      <div className="pointer-events-none absolute inset-0 opacity-55 bg-[radial-gradient(900px_circle_at_0%_0%,hsl(var(--primary)/0.10),transparent_60%)]" />

      <CardContent className="relative px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Target className="h-4 w-4 text-primary" />
            </div>

            <div className="min-w-0">
              <div className="text-[12px] uppercase tracking-[0.16em] text-muted-foreground">Top focus for now</div>
              <div className="text-[14px] font-medium text-foreground truncate">{focusTask.title}</div>

              {!collapsed && (
                <div className="mt-1 flex items-center gap-2">
                  {focusTask.urgency === "high" && <Pill>Urgent</Pill>}
                  {focusTask.importance === "high" && <Pill>Important</Pill>}
                  {focusTask.due_time && <Pill>{focusTask.due_time}</Pill>}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => onStartFocus(focusTask)} className="h-9 rounded-xl px-3 shadow-sm">
              <Play className="h-4 w-4 mr-2" />
              Focus
            </Button>

            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className="h-9 w-9 rounded-xl border border-border/40 bg-background/60 text-muted-foreground hover:text-foreground transition flex items-center justify-center"
              aria-label="Toggle"
            >
              <ChevronDown className={`h-4 w-4 transition ${collapsed ? "" : "rotate-180"}`} />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
