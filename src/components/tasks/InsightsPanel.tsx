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
  const quadrantData = useMemo(
    () =>
      [
        {
          name: "Urgent & Important",
          value: periodTasks.filter((t) => t.urgency === "high" && t.importance === "high").length,
          color: "hsl(var(--destructive))",
        },
        {
          name: "Urgent & Not Important",
          value: periodTasks.filter((t) => t.urgency === "high" && t.importance === "low").length,
          color: "hsl(var(--primary))",
        },
        {
          name: "Not Urgent & Important",
          value: periodTasks.filter((t) => t.urgency === "low" && t.importance === "high").length,
          color: "hsl(var(--chart-1))",
        },
        {
          name: "Not Urgent & Not Important",
          value: periodTasks.filter((t) => t.urgency === "low" && t.importance === "low").length,
          color: "hsl(var(--muted))",
        },
      ].filter((d) => d.value > 0),
    [periodTasks],
  );
  if (!expanded) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setExpanded(true)}
        className="text-muted-foreground hover:text-foreground px-0"
      >
        Show insights
      </Button>
    );
  }
  return (
    <Card className="rounded-xl border border-primary/20 bg-gradient-to-br from-card/80 via-card/60 to-chart-1/5 backdrop-blur-sm shadow-md flex-1 overflow-hidden">
      <CardContent className="p-1.5 h-full px-[5px] py-[5px] rounded-sm">
        {/* Main content: Time selector left, KPIs middle (2x3), Charts right */}
        <div className="h-full flex gap-2">
          {/* Far Left: Time Period Selector - vertical slim buttons */}
          <div className="flex flex-col gap-1 shrink-0 justify-center">
            {(["today", "tomorrow", "week"] as TimePeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => setTimePeriod(period)}
                className={cn(
                  "flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-md text-[7px] font-medium uppercase tracking-wide transition-all w-[52px]",
                  timePeriod === period
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {period === "today" && <Sun className="h-2.5 w-2.5" />}
                {period === "tomorrow" && <Sunrise className="h-2.5 w-2.5" />}
                {period === "week" && <CalendarDays className="h-2.5 w-2.5" />}
                <span className="hidden sm:inline">
                  {period === "today" ? "Today" : period === "tomorrow" ? "Tmrw" : "Week"}
                </span>
              </button>
            ))}
          </div>

          {/* Left: KPI Cards in 2x3 grid - stretch to full height */}
          <div className="grid grid-cols-2 gap-1 w-[180px] shrink-0 auto-rows-fr">
            {/* Pending - Blue gradient */}
            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-sm">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0 shadow-sm">
                <Calendar className="h-3 w-3 text-primary-foreground" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground leading-none">{pendingCount}</p>
                <p className="text-[8px] text-primary/80 uppercase font-medium">Pending</p>
              </div>
            </div>

            {/* Done - Green gradient */}
            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-gradient-to-br from-chart-1/20 to-chart-1/5 border border-chart-1/20 shadow-sm">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-chart-1 to-chart-1/70 flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle className="h-3 w-3 text-primary-foreground" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground leading-none">{completedCount}</p>
                <p className="text-[8px] text-chart-1/80 uppercase font-medium">Done</p>
              </div>
            </div>

            {/* Overdue - Red/Orange gradient */}
            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-gradient-to-br from-destructive/20 to-destructive/5 border border-destructive/20 shadow-sm">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-destructive to-destructive/70 flex items-center justify-center shrink-0 shadow-sm">
                <AlertTriangle className="h-3 w-3 text-destructive-foreground" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground leading-none">{overdueCount}</p>
                <p className="text-[8px] text-destructive/80 uppercase font-medium">Overdue</p>
              </div>
            </div>

            {/* Focus - Purple/Violet gradient */}
            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-gradient-to-br from-chart-2/20 to-chart-2/5 border border-chart-2/20 shadow-sm">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-chart-2 to-chart-2/70 flex items-center justify-center shrink-0 shadow-sm">
                <ClockIcon className="h-3 w-3 text-primary-foreground" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground leading-none">{totalFocusMinutes}m</p>
                <p className="text-[8px] text-chart-2/80 uppercase font-medium">Focus</p>
              </div>
            </div>
          </div>

          {/* Right: Charts - 2 equal columns + wider pie chart column */}
          <div className="flex-1 grid grid-cols-[1fr_1fr_160px] gap-2 min-h-0">
            {/* Plan vs Actual */}
            <div className="rounded-lg bg-gradient-to-br from-primary/10 to-chart-1/5 border border-primary/10 p-2 flex flex-col min-h-0">
              <div className="flex items-center gap-1 mb-1 shrink-0">
                <div className="h-4 w-4 rounded bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="h-2.5 w-2.5 text-primary" />
                </div>
                <span className="text-[8px] font-semibold text-primary uppercase">Plan vs Actual</span>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={past7DaysData}>
                    <defs>
                      <linearGradient id="planGradient2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tick={{
                        fontSize: 8,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{
                        fontSize: 8,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                      axisLine={false}
                      tickLine={false}
                      width={14}
                      allowDecimals={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="plan"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#planGradient2)"
                    />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      dot={{
                        r: 3,
                        fill: "hsl(var(--chart-1))",
                      }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Upcoming */}
            <div className="rounded-lg bg-gradient-to-br from-chart-1/10 to-chart-2/5 border border-chart-1/10 p-2 flex flex-col min-h-0">
              <div className="flex items-center gap-1 mb-1 shrink-0">
                <div className="h-4 w-4 rounded bg-chart-1/20 flex items-center justify-center">
                  <Calendar className="h-2.5 w-2.5 text-chart-1" />
                </div>
                <span className="text-[8px] font-semibold text-chart-1 uppercase">Upcoming</span>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={future7DaysData}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={1} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tick={{
                        fontSize: 8,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{
                        fontSize: 8,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                      axisLine={false}
                      tickLine={false}
                      width={14}
                      allowDecimals={false}
                    />
                    <Bar dataKey="tasks" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* By Quadrant */}
            <div className="rounded-lg bg-gradient-to-br from-chart-2/10 to-destructive/5 border border-chart-2/10 p-2 flex flex-col min-h-0">
              <div className="flex items-center gap-1 mb-1 shrink-0">
                <div className="h-4 w-4 rounded bg-chart-2/20 flex items-center justify-center">
                  <ClockIcon className="h-2.5 w-2.5 text-chart-2" />
                </div>
                <span className="text-[9px] font-semibold text-chart-2 uppercase">Week Priority</span>
              </div>
              <div className="flex-1 min-h-0 flex items-center gap-2">
                {quadrantData.length > 0 ? (
                  <>
                    <div className="w-[70px] h-full shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={quadrantData}
                            cx="50%"
                            cy="50%"
                            innerRadius={18}
                            outerRadius={32}
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
                    <div className="flex flex-col gap-1">
                      {quadrantData.map((entry, index) => (
                        <div key={index} className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                          <span className="text-[8px] text-muted-foreground leading-tight">
                            {entry.name === "Urgent & Important"
                              ? "U&I"
                              : entry.name === "Urgent & Not Important"
                                ? "U&NI"
                                : entry.name === "Not Urgent & Important"
                                  ? "NU&I"
                                  : "NU&NI"}
                          </span>
                        </div>
                      ))}{" "}
                    </div>
                  </>
                ) : (
                  <p className="text-[8px] text-muted-foreground">No data</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
