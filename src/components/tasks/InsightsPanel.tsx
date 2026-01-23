import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronUp, Calendar, CheckCircle, AlertTriangle, Clock as ClockIcon, TrendingUp } from "lucide-react";
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
import { format, subDays, addDays, startOfDay, isSameDay } from "date-fns";

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
            "h-8 w-8", // Reduced from h-9 w-9
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
      {Array.from({ length: 12 }).map((_, i) => (
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
  const today = startOfDay(new Date());

  const todayTasks = tasks.filter((t) => t.due_date && isSameDay(new Date(t.due_date), today));
  const plannedToday = todayTasks.length;
  const completedToday = todayTasks.filter((t) => t.is_completed || t.completed_at).length;

  const allTasksWithStatus = tasks.map((t) => ({ ...t, computedStatus: computeTaskStatus(t) }));
  const overdueTasks = allTasksWithStatus.filter((t) => t.computedStatus === "overdue").length;

  const totalFocusMinutes = tasks.reduce((sum, t) => sum + (t.total_focus_minutes || 0), 0);

  const past7DaysData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dayStart = startOfDay(date);
      const planned = tasks.filter((t) => t.due_date && isSameDay(new Date(t.due_date), dayStart)).length;
      const actual = tasks.filter((t) => t.completed_at && isSameDay(new Date(t.completed_at), dayStart)).length;
      data.push({ date: format(date, "EEE"), fullDate: format(date, "MMM d"), plan: planned, actual });
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
      data.push({ date: i === 0 ? "Today" : format(date, "EEE"), fullDate: format(date, "MMM d"), tasks: upcoming });
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
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Insights</h3>
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

      {/* KPI ROW:
          We use 6 columns on lg so the clock can span 2 columns (longer).
          Total spans: 1 + 1 + 2 + 1 + 1 = 6 */}
      <div
        className={cn(
          "grid gap-3",
          compactMode ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
        )}
      >
        <div className="lg:col-span-1">
          <KpiCard
            icon={<Calendar className="h-4 w-4" />}
            iconBg="bg-primary/10"
            iconColor="text-primary"
            value={plannedToday}
            label="Planned Today"
          />
        </div>

        <div className="lg:col-span-1">
          <KpiCard
            icon={<CheckCircle className="h-4 w-4" />}
            iconBg="bg-chart-1/10"
            iconColor="text-chart-1"
            value={completedToday}
            label="Done Today"
          />
        </div>

        {!compactMode && (
          <div className="lg:col-span-2">
            <ClockKpiCard />
          </div>
        )}

        <div className="lg:col-span-1">
          <KpiCard
            icon={<AlertTriangle className="h-4 w-4" />}
            iconBg="bg-destructive/10"
            iconColor="text-destructive"
            value={overdueTasks}
            label="Overdue"
          />
        </div>

        <div className="lg:col-span-1">
          <KpiCard
            icon={<ClockIcon className="h-4 w-4" />}
            iconBg="bg-muted/20"
            iconColor="text-muted-foreground"
            value={`${totalFocusMinutes}m`}
            label="Focus Time"
          />
        </div>
      </div>

      {/* Charts Row */}
      <div className={cn("grid grid-cols-1 gap-4", compactMode ? "lg:grid-cols-2" : "lg:grid-cols-3")}>
        {/* Plan vs Actual */}
        <Card className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">
                PLAN VS ACTUAL
              </h4>
            </div>

            <div className={cn("h-[100px]", compactMode ? "h-[80px]" : "h-[120px]")}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={past7DaysData}>
                  <defs>
                    <linearGradient id="planGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.06} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.35} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    width={15}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      fontSize: "11px",
                      boxShadow: "0 12px 30px rgba(0,0,0,0.10)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="plan"
                    stroke="hsl(var(--primary))"
                    strokeWidth={1.5}
                    fill="url(#planGradient)"
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={1.5}
                    dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 0, r: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming */}
        <Card className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">UPCOMING</h4>
            </div>

            <div className={cn("h-[100px]", compactMode ? "h-[80px]" : "h-[120px]")}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={future7DaysData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.35} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    width={15}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      fontSize: "11px",
                      boxShadow: "0 12px 30px rgba(0,0,0,0.10)",
                    }}
                  />
                  <Bar dataKey="tasks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* By Quadrant */}
        <Card
          className={cn(
            "rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm",
            compactMode && "lg:col-span-2",
          )}
        >
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <ClockIcon className="h-3.5 w-3.5 text-primary" />
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">
                BY QUADRANT
              </h4>
            </div>

            <div className={cn("flex items-center justify-center", compactMode ? "h-[80px]" : "h-[120px]")}>
              {quadrantData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={quadrantData}
                      cx="50%"
                      cy="50%"
                      innerRadius={compactMode ? 20 : 28}
                      outerRadius={compactMode ? 35 : 46}
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
                        borderRadius: "12px",
                        fontSize: "11px",
                        boxShadow: "0 12px 30px rgba(0,0,0,0.10)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-[10px] text-muted-foreground">No data</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
