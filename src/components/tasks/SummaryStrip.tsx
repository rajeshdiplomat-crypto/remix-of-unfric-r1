import { QuadrantTask } from "./types";

interface SummaryStripProps {
  tasks: QuadrantTask[];
}

export function SummaryStrip({ tasks }: SummaryStripProps) {
  const todayCount = tasks.filter(t => t.date_bucket === 'today' && !t.is_completed).length;
  const overdueCount = tasks.filter(t => t.status === 'overdue' && !t.is_completed).length;
  
  // Determine focus time based on most common time_of_day for today's tasks
  const todayTasks = tasks.filter(t => t.date_bucket === 'today' && !t.is_completed);
  const timeOfDayCounts = todayTasks.reduce((acc, t) => {
    acc[t.time_of_day] = (acc[t.time_of_day] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const focusTime = Object.entries(timeOfDayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'morning';
  const focusLabel = focusTime.charAt(0).toUpperCase() + focusTime.slice(1);

  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-primary" />
        <span className="text-muted-foreground">
          Today: <span className="text-foreground font-medium">{todayCount} tasks</span>
        </span>
      </div>
      <span className="text-muted-foreground/40">·</span>
      <span className="text-muted-foreground">
        Overdue: <span className={overdueCount > 0 ? "text-destructive font-medium" : "text-foreground font-medium"}>{overdueCount}</span>
      </span>
      <span className="text-muted-foreground/40">·</span>
      <span className="text-muted-foreground">
        Focus: <span className="text-foreground font-medium">{focusLabel}</span>
      </span>
    </div>
  );
}
