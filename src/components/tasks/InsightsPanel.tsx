import { useEffect, useMemo, useState } from "react";
import { ChevronUp, Calendar, CheckCircle, AlertTriangle, Clock as ClockIcon, TrendingUp } from "lucide-react";
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
import { format, subDays, addDays, startOfDay, isSameDay } from "date-fns";

interface InsightsPanelProps {
  tasks: QuadrantTask[];
}

function CompactClockCard() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeText = useMemo(() => format(now, "h:mm a"), [now]);
  const dateText = useMemo(() => format(now, "EEE, MMM d"), [now]);

  const h = now.getHours() % 12;
  const m = now.getMinutes();
  const s = now.getSeconds();

  const hourAngle = h * 30 + m * 0.5;
  const minuteAngle = m * 6 + s * 0.1;
  const secondAngle = s * 6;

  const ticks = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => {
        const a = i * 30;
        return (
          <line
            key={i}
            x1="32"
            y1="8"
            x2="32"
            y2="11"
            stroke="currentColor"
            strokeWidth="1"
            opacity={i % 3 === 0 ? 0.45 : 0.2}
            transform={`rotate(${a} 32 32)`}
          />
        );
      }),
    [],
  );

  return (
    <Card className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm">
      <CardContent className="p-3 h-[88px] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg width="56" height="56" viewBox="0 0 64 64" className="shrink-0 text-muted-foreground">
            <circle cx="32" cy="32" r="24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.25" />
            <g>{ticks}</g>

            {/* hour */}
            <line
              x1="32"
              y1="32"
              x2="32"
              y2="20"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              transform={`rotate(${hourAngle} 32 32)`}
              className="text-foreground"
              opacity="0.9"
            />
            {/* minute */}
            <line
              x1="32"
              y1="32"
              x2="32"
              y2="14"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              transform={`rotate(${minuteAngle} 32 32)`}
              className="text-foreground"
              opacity="0.75"
            />
            {/* second */}
            <line
              x1="32"
              y1="34"
              x2="32"
              y2="12"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              transform={`rotate(${secondAngle} 32 32)`}
              opacity="0.25"
            />
            <circle cx="32" cy="32" r="2.2" fill="currentColor" opacity="0.6" />
          </svg>

          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight text-foreground">{timeText}</div>
            <div className="text-[11px] text-muted-foreground">{dateText}</div>
          </div>
        </div>

        <div className="h-10 w-px bg-border/50" />

        <div className="text-right leading-tight pl-3">
          <div className="text-[11px] text-muted-foreground">Now</div>
          <div className="text-sm font-medium tracking-tight text-foreground">Focus</div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({
  icon,
  iconBg,
  iconColor,
  value,
  label,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  value: React.ReactNode;
  label: string;
}) {
  return (
    <Card className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm">
      <CardContent className="p-3 h-[88px] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${iconBg}`}>
            <div className={iconColor}>{icon}</div>
          </div>
          <div className="leading-tight">
            <div className="text-2xl font-semibold tracking-tight text-foreground">{value}</div>
            <div className="text-[11px] text-muted-foreground">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function InsightsPanel({ tasks }: InsightsPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const today = startOfDay(new Date());

  const todayTasks = tasks.filter((t) => {
    if (!t.due_date) return false;
    return isSameDay(new Date(t.due_date), today);
  });

  const plannedToday = todayTasks.length;
  const completedToday = todayTasks.filter((t) => t.is_completed || t.completed_at).length;

  const allTasksWithStatus = tasks.map((t) => ({
    ...t,
    computedStatus: computeTaskStatus(t),
  }));
  const overdueTasks = allTasksWithStatus.filter((t) => t.computedStatus === "overdue").length;

  const totalFocusMinutes = tasks.reduce((sum, t) => sum + (t.total_focus_minutes || 0), 0);

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
          value: tasks.filter((t) => t.urgency === "high" && t.importance === "high").length,
          color: "hsl(var(--destructive))",
        },
        {
          name: "Urgent & Not Important",
          value: tasks.filter((t) => t.urgency === "high" && t.importance === "low").length,
          color: "hsl(var(--primary))",
        },
        {
          name: "Not Urgent & Important",
          value: tasks.filter((t) => t.urgency === "low" && t.importance === "high").length,
          color: "hsl(var(--chart-1))",
        },
        {
          name: "Not Urgent & Not Important",
          value: tasks.filter((t) => t.urgency === "low" && t.importance === "low").length,
          color: "hsl(var(--muted))",
        },
      ].filter((d) => d.value > 0),
    [tasks],
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
    <div className="space-y-4 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">Insights</h3>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(false)}
          className="text-muted-foreground hover:text-foreground gap-1"
        >
          <ChevronUp className="h-4 w-4" />
          Hide
        </Button>
      </div>

      {/* KPI Row — now includes CLOCK in the middle */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard
          icon={<Calendar className="h-4 w-4" />}
          iconBg="bg-primary/10"
          iconColor="text-primary"
          value={plannedToday}
          label="Planned Today"
        />

        <MetricCard
          icon={<CheckCircle className="h-4 w-4" />}
          iconBg="bg-chart-1/10"
          iconColor="text-chart-1"
          value={completedToday}
          label="Done Today"
        />

        {/* Clock in between (like your screenshot) */}
        <CompactClockCard />

        <MetricCard
          icon={<AlertTriangle className="h-4 w-4" />}
          iconBg="bg-destructive/10"
          iconColor="text-destructive"
          value={overdueTasks}
          label="Overdue"
        />

        <MetricCard
          icon={<ClockIcon className="h-4 w-4" />}
          iconBg="bg-muted/20"
          iconColor="text-muted-foreground"
          value={`${totalFocusMinutes}m`}
          label="Focus Time"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Plan vs Actual */}
        <Card className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                PLAN VS ACTUAL (7 DAYS)
              </h4>
            </div>

            <div className="h-[110px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={past7DaysData}>
                  <defs>
                    <linearGradient id="planGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.06} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    width={20}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "10px",
                      fontSize: "12px",
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="plan"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#planGradient)"
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 2.3 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 0, r: 2.3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="flex justify-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-xs text-muted-foreground">Plan</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-chart-1" />
                <span className="text-xs text-muted-foreground">Actual</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming */}
        <Card className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-primary" />
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">UPCOMING (7 DAYS)</h4>
            </div>

            <div className="h-[110px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={future7DaysData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    width={20}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "10px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="tasks" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* By Quadrant */}
        <Card className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <ClockIcon className="h-4 w-4 text-primary" />
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">BY QUADRANT</h4>
            </div>

            <div className="h-[110px] flex items-center justify-center">
              {quadrantData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={quadrantData}
                      cx="50%"
                      cy="50%"
                      innerRadius={28}
                      outerRadius={46}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {quadrantData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "10px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-muted-foreground">No data</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
