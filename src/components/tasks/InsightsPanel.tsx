import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ChevronUp,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock as ClockIcon,
  TrendingUp,
  Sun,
  Sunrise,
  CalendarDays,
  Play,
  ListTodo,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuadrantTask, computeTaskStatus } from "./types";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ComposedChart,
} from "recharts";
import { format, subDays, addDays, startOfDay, isSameDay, isWithinInterval, isBefore, endOfDay } from "date-fns";

type TimePeriod = "today" | "tomorrow" | "week";
interface InsightsPanelProps {
  tasks: QuadrantTask[];
  compactMode?: boolean;
}
function KpiCard({
  icon,
  iconBg,
  iconColor,
  value,
  label,
}: {
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  value: ReactNode;
  label: string;
}) {
  return (
    <Card className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm">
      <CardContent
        className={cn(
          "flex items-center gap-3 min-w-0",
          "p-3 h-[72px]", // Reduced from p-4 h-[86px]
        )}
      >
        <div
          className={cn(
            "rounded-xl flex items-center justify-center shrink-0",
            "h-8 w-8",
            // Reduced from h-9 w-9
            iconBg,
          )}
        >
          <div className={cn("h-4 w-4 flex items-center justify-center", iconColor)}>{icon}</div>
        </div>

        <div className="min-w-0 leading-tight">
          <div className="text-[22px] font-semibold tracking-tight text-foreground">{value}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
function CenterAnalogClock({ now, size = 64 }: { now: Date; size?: number }) {
  const h = now.getHours() % 12;
  const m = now.getMinutes();
  const hourAngle = h * 30 + m * 0.5;
  const minuteAngle = m * 6;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="text-muted-foreground">
      <circle cx="32" cy="32" r="24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.25" />
      {Array.from({
        length: 12,
      }).map((_, i) => (
        <line
          key={i}
          x1="32"
          y1="10"
          x2="32"
          y2={i % 3 === 0 ? "15" : "13"}
          stroke="currentColor"
          strokeWidth="1"
          opacity={i % 3 === 0 ? 0.45 : 0.22}
          transform={`rotate(${i * 30} 32 32)`}
        />
      ))}
      <line
        x1="32"
        y1="32"
        x2="32"
        y2="21"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        transform={`rotate(${hourAngle} 32 32)`}
        className="text-foreground"
        opacity="0.9"
      />
      <line
        x1="32"
        y1="32"
        x2="32"
        y2="15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        transform={`rotate(${minuteAngle} 32 32)`}
        className="text-foreground"
        opacity="0.75"
      />
      <circle cx="32" cy="32" r="2.2" fill="currentColor" opacity="0.55" />
    </svg>
  );
}
function ClockKpiCard() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <Card className="rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-sm shadow-sm">
      <CardContent className="h-[86px] px-5 py-3 flex items-center gap-4 min-w-0">
        {/* Bigger icon */}
        <div className="h-14 w-14 rounded-2xl bg-background/60 border border-border/30 flex items-center justify-center shrink-0">
          <CenterAnalogClock now={now} size={60} />
        </div>

        {/* Bigger time + clearer date */}
        <div className="min-w-0 flex-1">
          <div className="text-[24px] font-semibold tracking-tight text-foreground whitespace-nowrap leading-none">
            {format(now, "h:mm")}
            <span className="ml-2 text-[12px] font-semibold align-top">{format(now, "a")}</span>
          </div>

          <div className="mt-1.5 text-[12px] text-muted-foreground whitespace-nowrap leading-none">
            {format(now, "EEE, MMM d")}
            <span className="ml-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">Local time</span>
          </div>
        </div>

        {/* Right chips */}
        <div className="ml-auto flex items-center gap-2 shrink-0 whitespace-nowrap">
          <span className="text-[11px] text-muted-foreground">Now</span>
          <span className="h-6 px-3 rounded-full bg-background/60 border border-border/30 text-[11px] text-foreground flex items-center">
            Focus
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
export function InsightsPanel({ tasks, compactMode }: InsightsPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("today");

  const today = startOfDay(new Date());
  const tomorrow = startOfDay(addDays(today, 1));
  const weekEnd = endOfDay(addDays(today, 6));

  // Get tasks filtered by time period
  const periodTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!t.due_date) return false;
      const dueDate = startOfDay(new Date(t.due_date));

      switch (timePeriod) {
        case "today":
          return isSameDay(dueDate, today);
        case "tomorrow":
          return isSameDay(dueDate, tomorrow);
        case "week":
          return isWithinInterval(dueDate, { start: today, end: weekEnd });
        default:
          return false;
      }
    });
  }, [tasks, timePeriod, today, tomorrow, weekEnd]);

  const pendingCount = periodTasks.filter((t) => !t.is_completed && !t.completed_at).length;
  const completedCount = periodTasks.filter((t) => t.is_completed || t.completed_at).length;

  // Calculate overdue based on time period
  const overdueCount = useMemo(() => {
    const allTasksWithStatus = tasks.map((t) => ({
      ...t,
      computedStatus: computeTaskStatus(t),
    }));

    switch (timePeriod) {
      case "today":
        // Tasks that are past their due date (before today)
        return allTasksWithStatus.filter((t) => t.computedStatus === "overdue").length;
      case "tomorrow":
        // Currently overdue + today's incomplete tasks (will be overdue by tomorrow)
        const currentlyOverdue = allTasksWithStatus.filter((t) => t.computedStatus === "overdue").length;
        const todayIncomplete = tasks.filter((t) => {
          if (!t.due_date) return false;
          const dueDate = startOfDay(new Date(t.due_date));
          return isSameDay(dueDate, today) && !t.is_completed && !t.completed_at;
        }).length;
        return currentlyOverdue + todayIncomplete;
      case "week":
        // All currently overdue tasks
        return allTasksWithStatus.filter((t) => t.computedStatus === "overdue").length;
      default:
        return 0;
    }
  }, [tasks, timePeriod, today]);

  // Total focus minutes for period tasks
  const totalFocusMinutes = periodTasks.reduce((sum, t) => sum + (t.total_focus_minutes || 0), 0);

  // Ongoing tasks (started but not completed) in period
  const ongoingCount = periodTasks.filter((t) => t.started_at && !t.is_completed && !t.completed_at).length;

  // Total tasks count (all tasks regardless of completion)
  const totalTasksCount = periodTasks.length;
  const past7DaysData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dayStart = startOfDay(date);
      const planned = tasks.filter((t) => t.due_date && isSameDay(new Date(t.due_date), dayStart)).length;
      const actual = tasks.filter((t) => t.completed_at && isSameDay(new Date(t.completed_at), dayStart)).length;
      data.push({
        date: format(date, "EEE"),
        fullDate: format(date, "MMM d"),
        plan: planned,
        actual,
      });
    }
    return data;
  }, [tasks, today]);
  const future7DaysData = useMemo(() => {
    const data = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(today, i);
      const dayStart = startOfDay(date);
      const upcoming = tasks.filter((t) => {
        if (!t.due_date || t.is_completed || t.completed_at) return false;
        return isSameDay(new Date(t.due_date), dayStart);
      }).length;
      data.push({
        date: i === 0 ? "Today" : format(date, "EEE"),
        fullDate: format(date, "MMM d"),
        tasks: upcoming,
      });
    }
    return data;
  }, [tasks, today]);
  // Filter for pending tasks only (not completed)
  const pendingPeriodTasks = periodTasks.filter((t) => !t.is_completed && !t.completed_at);

  // Get overdue tasks (due before the selected period start, not completed)
  const getPeriodStart = () => {
    switch (timePeriod) {
      case "today":
        return today;
      case "tomorrow":
        return tomorrow;
      case "week":
        return today;
      default:
        return today;
    }
  };
  const periodStart = getPeriodStart();

  const overdueTasks = tasks.filter((t) => {
    if (!t.due_date) return false;
    if (t.is_completed || t.completed_at) return false;
    const dueDate = startOfDay(new Date(t.due_date));
    return isBefore(dueDate, periodStart);
  });

  // Combine pending period tasks + overdue tasks for pie chart
  const pieChartTasks = [...pendingPeriodTasks, ...overdueTasks];

  const quadrantData = useMemo(
    () =>
      [
        {
          name: "Urgent & Important",
          value: pieChartTasks.filter((t) => t.urgency === "high" && t.importance === "high").length,
          color: "hsl(var(--destructive))",
        },
        {
          name: "Urgent & Not Important",
          value: pieChartTasks.filter((t) => t.urgency === "high" && t.importance === "low").length,
          color: "hsl(var(--primary))",
        },
        {
          name: "Not Urgent & Important",
          value: pieChartTasks.filter((t) => t.urgency === "low" && t.importance === "high").length,
          color: "hsl(var(--chart-1))",
        },
        {
          name: "Not Urgent & Not Important",
          value: pieChartTasks.filter((t) => t.urgency === "low" && t.importance === "low").length,
          color: "hsl(var(--muted))",
        },
      ].filter((d) => d.value > 0),
    [pieChartTasks],
  );
  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ChevronUp className="h-3.5 w-3.5 rotate-180 group-hover:translate-y-0.5 transition-transform" />
        Show Insights
      </button>
    );
  }
  return (
    <div className="rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden">
      <div className="px-3 py-2.5">
        {/* Time Period Selector */}
        <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-0.5 w-fit mb-2.5">
          {(["today", "tomorrow", "week"] as TimePeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={cn(
                "px-2.5 py-1 rounded-md text-[10px] font-medium transition-all",
                timePeriod === period
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {period === "today" ? "Today" : period === "tomorrow" ? "Tomorrow" : "Week"}
            </button>
          ))}
        </div>

        {/* Main row: KPIs column + Charts */}
        <div className="flex gap-3 h-[120px]">
          {/* KPIs - vertical stack on the left */}
          <div className="grid grid-rows-4 gap-1.5 shrink-0 w-[100px]">
            <div className="flex items-center gap-2 rounded-lg bg-muted/20 border border-border/30 px-2">
              <Calendar className="h-3 w-3 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground leading-none">{pendingCount}</p>
                <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Planned</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-muted/20 border border-border/30 px-2">
              <CheckCircle className="h-3 w-3 text-chart-1 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground leading-none">{completedCount}</p>
                <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Done</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-muted/20 border border-border/30 px-2">
              <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground leading-none">{overdueCount}</p>
                <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Overdue</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-muted/20 border border-border/30 px-2">
              <ClockIcon className="h-3 w-3 text-chart-2 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground leading-none">{totalFocusMinutes}<span className="text-[10px] font-normal text-muted-foreground">m</span></p>
                <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Focus</p>
              </div>
            </div>
          </div>

          {/* Charts - fill remaining space */}
          <div className="grid grid-cols-3 gap-3 flex-1 min-w-0">
          {/* Plan vs Actual */}
          <div className="rounded-lg bg-muted/20 border border-border/30 p-2.5 flex flex-col min-h-0">
            <div className="flex items-center gap-1.5 mb-1 shrink-0">
              <TrendingUp className="h-3 w-3 text-primary" />
              <span className="text-[9px] font-medium text-foreground/70 uppercase tracking-wider">Plan vs Actual</span>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={past7DaysData}>
                  <defs>
                    <linearGradient id="planGradient2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    width={14}
                    allowDecimals={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="plan"
                    stroke="hsl(var(--primary))"
                    strokeWidth={1.5}
                    fill="url(#planGradient2)"
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={1.5}
                    dot={{ r: 2.5, fill: "hsl(var(--chart-1))" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Upcoming */}
          <div className="rounded-lg bg-muted/20 border border-border/30 p-2.5 flex flex-col min-h-0">
            <div className="flex items-center gap-1.5 mb-1 shrink-0">
              <Calendar className="h-3 w-3 text-chart-1" />
              <span className="text-[9px] font-medium text-foreground/70 uppercase tracking-wider">Upcoming</span>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={future7DaysData}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    width={14}
                    allowDecimals={false}
                  />
                  <Bar dataKey="tasks" fill="url(#barGradient)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Priority Pie */}
          <div className="rounded-lg bg-muted/20 border border-border/30 p-2.5 flex flex-col min-h-0">
            <div className="flex items-center gap-1.5 mb-1 shrink-0">
              <ClockIcon className="h-3 w-3 text-chart-2" />
              <span className="text-[9px] font-medium text-foreground/70 uppercase tracking-wider">Priority</span>
            </div>
            <div className="flex-1 min-h-0 flex items-center gap-2">
              {quadrantData.length > 0 ? (
                <>
                  <div className="w-[60px] h-full shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={quadrantData}
                          cx="50%"
                          cy="50%"
                          innerRadius={16}
                          outerRadius={28}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {quadrantData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {quadrantData.map((entry, index) => (
                      <div key={index} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                        <span className="text-[9px] text-muted-foreground leading-tight">
                          {entry.name === "Urgent & Important"
                            ? "U&I"
                            : entry.name === "Urgent & Not Important"
                              ? "U&NI"
                              : entry.name === "Not Urgent & Important"
                                ? "NU&I"
                                : "NU&NI"}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-[9px] text-muted-foreground">No data</p>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
