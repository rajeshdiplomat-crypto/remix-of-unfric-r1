import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, TrendingUp, CheckCircle, AlertTriangle, Clock, Flame, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { QuadrantTask, computeTaskStatus } from "./types";
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Line, ComposedChart } from "recharts";
import { format, subDays, addDays, startOfDay, isSameDay } from "date-fns";

interface TasksInsightsProps {
  tasks: QuadrantTask[];
}

export function TasksInsights({ tasks }: TasksInsightsProps) {
  const [expanded, setExpanded] = useState(true);

  // Calculate KPIs
  const today = startOfDay(new Date());
  
  const todayTasks = tasks.filter(t => {
    if (!t.due_date) return false;
    return isSameDay(new Date(t.due_date), today);
  });
  
  const plannedToday = todayTasks.length;
  const completedToday = todayTasks.filter(t => t.is_completed || t.completed_at).length;
  
  const allTasksWithStatus = tasks.map(t => ({ ...t, computedStatus: computeTaskStatus(t) }));
  const overdueTasks = allTasksWithStatus.filter(t => t.computedStatus === 'overdue').length;
  const completionRate = plannedToday > 0 ? Math.round((completedToday / plannedToday) * 100) : 0;
  const totalFocusMinutes = tasks.reduce((sum, t) => sum + (t.total_focus_minutes || 0), 0);

  // Past 7 days Plan vs Actual data
  const past7DaysData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dayStart = startOfDay(date);
      
      // Plan = tasks with due_date on this day
      const planned = tasks.filter(t => {
        if (!t.due_date) return false;
        return isSameDay(new Date(t.due_date), dayStart);
      }).length;
      
      // Actual = tasks completed on this day
      const actual = tasks.filter(t => {
        if (!t.completed_at) return false;
        return isSameDay(new Date(t.completed_at), dayStart);
      }).length;
      
      data.push({
        date: format(date, 'EEE'),
        fullDate: format(date, 'MMM d'),
        plan: planned,
        actual: actual,
      });
    }
    return data;
  }, [tasks, today]);

  // Future 7 days upcoming tasks
  const future7DaysData = useMemo(() => {
    const data = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(today, i);
      const dayStart = startOfDay(date);
      
      // Count tasks due on this day that are NOT completed
      const upcoming = tasks.filter(t => {
        if (!t.due_date) return false;
        if (t.is_completed || t.completed_at) return false;
        return isSameDay(new Date(t.due_date), dayStart);
      }).length;
      
      data.push({
        date: i === 0 ? 'Today' : format(date, 'EEE'),
        fullDate: format(date, 'MMM d'),
        tasks: upcoming,
      });
    }
    return data;
  }, [tasks, today]);

  // Quadrant distribution
  const quadrantData = useMemo(() => [
    { name: 'Urgent & Important', value: tasks.filter(t => t.urgency === 'high' && t.importance === 'high').length, color: 'hsl(var(--destructive))' },
    { name: 'Urgent & Not Important', value: tasks.filter(t => t.urgency === 'high' && t.importance === 'low').length, color: 'hsl(var(--chart-1))' },
    { name: 'Not Urgent & Important', value: tasks.filter(t => t.urgency === 'low' && t.importance === 'high').length, color: 'hsl(var(--primary))' },
    { name: 'Not Urgent & Not Important', value: tasks.filter(t => t.urgency === 'low' && t.importance === 'low').length, color: 'hsl(var(--muted))' },
  ].filter(d => d.value > 0), [tasks]);

  if (!expanded) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setExpanded(true)}
        className="text-muted-foreground hover:text-foreground"
      >
        <ChevronDown className="h-4 w-4 mr-1" />
        Show Insights
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Insights
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronUp className="h-4 w-4 mr-1" />
          Hide
        </Button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-5 gap-3">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{plannedToday}</p>
            <p className="text-xs text-muted-foreground">Planned Today</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-7 w-7 rounded-lg bg-chart-1/10 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-chart-1" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{completedToday}</p>
            <p className="text-xs text-muted-foreground">Done Today</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-7 w-7 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{overdueTasks}</p>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-7 w-7 rounded-lg bg-chart-2/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-chart-2" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{completionRate}%</p>
            <p className="text-xs text-muted-foreground">Today Rate</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-7 w-7 rounded-lg bg-muted/20 flex items-center justify-center">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalFocusMinutes}m</p>
            <p className="text-xs text-muted-foreground">Focus Time</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Plan vs Actual (Past 7 Days) */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Plan vs Actual (7 Days)
            </h4>
            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={past7DaysData}>
                  <defs>
                    <linearGradient id="planGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number, name: string) => [value, name === 'plan' ? 'Planned' : 'Completed']}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="plan" 
                    stroke="hsl(var(--primary))" 
                    fill="url(#planGradient)"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-1))', strokeWidth: 0, r: 3 }}
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

        {/* Future 7 Days */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Upcoming (7 Days)
            </h4>
            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={future7DaysData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [value, 'Tasks Due']}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                  />
                  <Bar 
                    dataKey="tasks" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quadrant Distribution */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              By Quadrant
            </h4>
            <div className="h-[120px] flex items-center justify-center">
              {quadrantData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={quadrantData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {quadrantData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        background: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px'
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
