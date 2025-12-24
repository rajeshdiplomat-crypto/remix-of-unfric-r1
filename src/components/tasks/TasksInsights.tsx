import { useState } from "react";
import { ChevronDown, ChevronUp, TrendingUp, CheckCircle, AlertTriangle, Clock, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { QuadrantTask } from "./types";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid } from "recharts";

interface TasksInsightsProps {
  tasks: QuadrantTask[];
}

export function TasksInsights({ tasks }: TasksInsightsProps) {
  const [expanded, setExpanded] = useState(true);

  // Calculate KPIs
  const totalTasks = tasks.length;
  const completedToday = tasks.filter(t => t.is_completed && t.date_bucket === 'today').length;
  const overdueTasks = tasks.filter(t => t.status === 'overdue' && !t.is_completed).length;
  const completedTasks = tasks.filter(t => t.is_completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const deepFocusMinutes = Math.floor(Math.random() * 120) + 30; // Placeholder

  // Quadrant distribution
  const quadrantData = [
    { name: 'Urgent & Important', value: tasks.filter(t => t.urgency === 'high' && t.importance === 'high').length, color: 'hsl(var(--destructive))' },
    { name: 'Urgent & Not Important', value: tasks.filter(t => t.urgency === 'high' && t.importance === 'low').length, color: 'hsl(var(--chart-1))' },
    { name: 'Not Urgent & Important', value: tasks.filter(t => t.urgency === 'low' && t.importance === 'high').length, color: 'hsl(var(--primary))' },
    { name: 'Not Urgent & Not Important', value: tasks.filter(t => t.urgency === 'low' && t.importance === 'low').length, color: 'hsl(var(--muted))' },
  ].filter(d => d.value > 0);

  // Time of day distribution
  const timeData = [
    { name: 'Morning', value: tasks.filter(t => t.time_of_day === 'morning').length },
    { name: 'Afternoon', value: tasks.filter(t => t.time_of_day === 'afternoon').length },
    { name: 'Evening', value: tasks.filter(t => t.time_of_day === 'evening').length },
    { name: 'Night', value: tasks.filter(t => t.time_of_day === 'night').length },
  ];

  // Mock trend data (7 days)
  const trendData = [
    { day: 'Mon', completed: 4 },
    { day: 'Tue', completed: 6 },
    { day: 'Wed', completed: 3 },
    { day: 'Thu', completed: 8 },
    { day: 'Fri', completed: 5 },
    { day: 'Sat', completed: 2 },
    { day: 'Sun', completed: 7 },
  ];

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
                <Flame className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalTasks}</p>
            <p className="text-xs text-muted-foreground">Total Tasks</p>
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
            <p className="text-xs text-muted-foreground">Completion</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-7 w-7 rounded-lg bg-muted/20 flex items-center justify-center">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{deepFocusMinutes}m</p>
            <p className="text-xs text-muted-foreground">Focus Time</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Trend Line */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              7-Day Trend
            </h4>
            <div className="h-[100px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quadrant Distribution Donut */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              By Quadrant
            </h4>
            <div className="h-[100px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={quadrantData}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={40}
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
            </div>
          </CardContent>
        </Card>

        {/* Time of Day Bar */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              By Time of Day
            </h4>
            <div className="h-[100px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={60} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
