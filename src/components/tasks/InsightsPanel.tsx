import { useEffect, useMemo, useState, type ReactNode } from "react";
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

const cardShell =
  "rounded-2xl border border-border/35 bg-card/60 backdrop-blur-sm shadow-[0_8px_30px_rgba(0,0,0,0.04)]";
const microHover = "transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_12px_36px_rgba(0,0,0,0.06)]";

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
    <Card className={`${cardShell} ${microHover}`}>
      <CardContent className="px-4 py-3 h-[78px] flex items-center gap-3">
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${iconBg}`}>
          <div className={iconColor}>{icon}</div>
        </div>

        <div className="min-w-0 leading-tight">
          <div className="text-[24px] font-semibold tracking-tight text-foreground">{value}</div>
          <div className="text-[11px] text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function CenterAnalogClock({ now }: { now: Date }) {
  const h = now.getHours() % 12;
  const m = now.getMinutes();
  const s = now.getSeconds();
  const hourAngle = h * 30 + m * 0.5;
  const minuteAngle = m * 6 + s * 0.1;

  return (
    <svg width="60" height="60" viewBox="0 0 64 64" className="text-muted-foreground">
      <circle cx="32" cy="32" r="24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.26" />
      {Array.from({ length: 12 }).map((_, i) => (
        <line
          key={i}
          x1="32"
          y1="10"
          x2="32"
          y2={i % 3 === 0 ? "15" : "13"}
          stroke="currentColor"
          strokeWidth="1"
          opacity={i % 3 === 0 ? 0.55 : 0.22}
          transform={`rotate(${i * 30} 32 32)`}
        />
      ))}
      <line
        x1="32"
        y1="32"
        x2="32"
        y2="21"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        transform={`rotate(${hourAngle} 32 32)`}
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
        opacity="0.75"
      />
      <circle cx="32" cy="32" r="2.2" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

function PremiumTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-border/40 bg-card/95 backdrop-blur px-3 py-2 shadow-[0_18px_50px_rgba(0,0,0,0.12)]">
      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-1 space-y-0.5">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-4 text-[12px]">
            <span className="text-muted-foreground">{p.name}</span>
            <span className="font-medium text-foreground tabular-nums">{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClockKpiCard() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <Card className={`${cardShell} ${microHover} overflow-hidden`}>
      {/* subtle luxury wash */}
      <div className="pointer-events-none absolute inset-0 opacity-60 bg-[radial-gradient(900px_circle_at_20%_25%,hsl(var(--primary)/0.10),transparent_60%)]" />
      <CardContent className="relative px-5 py-3 h-[78px] flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div className="h-12 w-12 rounded-2xl border border-border/30 bg-background/60 flex items-center justify-center shadow-sm">
            <CenterAnalogClock now={now} />
          </div>

          <div className="min-w-0 leading-tight">
            <div className="text-[20px] font-semibold tracking-tight text-foreground tabular-nums">
              {format(now, "h:mm a")}
            </div>
            <div className="text-[12px] text-muted-foreground">{format(now, "EEE, MMM d")}</div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80">Local time</div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">Now</span>
          <span className="text-[11px] font-medium text-foreground">Focus</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function InsightsPanel({ tasks }: InsightsPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const today = startOfDay(new Date());

  const todayTasks = tasks.filter((t) => t.due_date && isSameDay(new Date(t.due_date), today));
  const plannedToday = todayTasks.length;
  const completedToday = todayTasks.filter((t) => t.is_completed || t.completed_at).length;

  const overdueTasks = tasks
    .map((t) => ({ ...t, computedStatus: computeTaskStatus(t) }))
    .filter((t) => t.computedStatus === "overdue").length;

  const totalFocusMinutes = tasks.reduce((sum, t) => sum + (t.total_focus_minutes || 0), 0);

  const past7DaysData = useMemo(() => {
    const data: { date: string; plan: number; actual: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dayStart = startOfDay(date);
      const planned = tasks.filter((t) => t.due_date && isSameDay(new Date(t.due_date), dayStart)).length;
      const actual = tasks.filter((t) => t.completed_at && isSameDay(new Date(t.completed_at), dayStart)).length;
      data.push({ date: format(date, "EEE"), plan: planned, actual });
    }
    return data;
  }, [tasks, today]);

  const future7DaysData = useMemo(() => {
    const data: { date: string; tasks: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(today, i);
      const dayStart = startOfDay(date);
      const upcoming = tasks.filter((t) => {
        if (!t.due_date || t.is_completed || t.completed_at) return false;
        return isSameDay(new Date(t.due_date), dayStart);
      }).length;
      data.push({ date: i === 0 ? "Today" : format(date, "EEE"), tasks: upcoming });
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
      {/* Premium section header */}
      <div className="flex items-center justify-between">
        <div className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">Insights</div>

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

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard
          icon={<Calendar className="h-4 w-4" />}
          iconBg="bg-primary/10"
          iconColor="text-primary"
          value={plannedToday}
          label="Planned Today"
        />

        <KpiCard
          icon={<CheckCircle className="h-4 w-4" />}
          iconBg="bg-chart-1/10"
          iconColor="text-chart-1"
          value={completedToday}
          label="Done Today"
        />

        <div className="lg:col-span-2">
          <ClockKpiCard />
        </div>

        <KpiCard
          icon={<AlertTriangle className="h-4 w-4" />}
          iconBg="bg-destructive/10"
          iconColor="text-destructive"
          value={overdueTasks}
          label="Overdue"
        />

        <KpiCard
          icon={<ClockIcon className="h-4 w-4" />}
          iconBg="bg-muted/25"
          iconColor="text-muted-foreground"
          value={`${totalFocusMinutes}m`}
          label="Focus Time"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Plan vs Actual */}
        <Card className={`${cardShell} ${microHover}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Plan vs actual (7 days)
              </h4>
            </div>

            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={past7DaysData}>
                  <defs>
                    <linearGradient id="planGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 6" stroke="hsl(var(--border) / 0.45)" />
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
                    width={18}
                    allowDecimals={false}
                  />
                  <Tooltip content={<PremiumTooltip />} />

                  <Area
                    type="monotone"
                    dataKey="plan"
                    name="Plan"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#planGradient)"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    name="Actual"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming */}
        <Card className={`${cardShell} ${microHover}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Upcoming (7 days)
              </h4>
            </div>

            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={future7DaysData} barSize={18}>
                  <CartesianGrid strokeDasharray="3 6" stroke="hsl(var(--border) / 0.45)" />
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
                    width={18}
                    allowDecimals={false}
                  />
                  <Tooltip content={<PremiumTooltip />} />
                  <Bar dataKey="tasks" name="Tasks" fill="hsl(var(--primary))" radius={[7, 7, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* By Quadrant */}
        <Card className={`${cardShell} ${microHover}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <ClockIcon className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">By quadrant</h4>
            </div>

            <div className="h-[120px] flex items-center justify-center">
              {quadrantData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={quadrantData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={48}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="hsl(var(--card))"
                      strokeWidth={2}
                    >
                      {quadrantData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<PremiumTooltip />} />
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
