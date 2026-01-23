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

      {/* Compact KPI Cards Row */}
      <div className="grid grid-cols-5 gap-2">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-2 flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <Calendar className="h-3 w-3 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-foreground leading-none">{plannedToday}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Planned</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-2 flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-chart-1/10 flex items-center justify-center shrink-0">
              <CheckCircle className="h-3 w-3 text-chart-1" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-foreground leading-none">{completedToday}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Done</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-2 flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-destructive/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-3 w-3 text-destructive" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-foreground leading-none">{overdueTasks}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Overdue</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-2 flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-chart-2/10 flex items-center justify-center shrink-0">
              <TrendingUp className="h-3 w-3 text-chart-2" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-foreground leading-none">{completionRate}%</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Rate</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-2 flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-muted/20 flex items-center justify-center shrink-0">
              <Clock className="h-3 w-3 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-foreground leading-none">{totalFocusMinutes}m</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Focus</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compact Charts Row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Plan vs Actual */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3">
            <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Plan vs Actual
            </h4>
            <div className="h-[80px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={past7DaysData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} width={20} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '10px'
                    }}
                  />
                  <Area type="monotone" dataKey="plan" stroke="#3b82f6" strokeWidth={1.5} fill="url(#planGradient)" />
                  <Line type="monotone" dataKey="actual" stroke="#22c55e" strokeWidth={2} dot={{ r: 2 }} />
                  <defs>
                    <linearGradient id="planGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3">
            <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Upcoming
            </h4>
            <div className="h-[80px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={future7DaysData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} width={20} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '10px'
                    }}
                  />
                  <Bar dataKey="tasks" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quadrant Distribution */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3">
            <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
              <Clock className="h-3 w-3" /> By Quadrant
            </h4>
            <div className="h-[80px] flex items-center justify-center">
              {quadrantData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={quadrantData}
                      cx="50%"
                      cy="50%"
                      innerRadius={20}
                      outerRadius={35}
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
                        fontSize: '10px'
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
