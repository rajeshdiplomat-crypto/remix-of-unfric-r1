import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuadrantType, QUADRANTS, EmotionEntry } from "./types";
import { format, subDays, startOfDay, eachDayOfInterval, startOfWeek, endOfWeek, subWeeks, isAfter, parseISO } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, Calendar, Activity, Target } from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type DateRange = 7 | 30 | 90;

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
];

interface PatternsDashboardProps {
  entries: EmotionEntry[];
}

function CalendarHeatmap({ entries }: { entries: EmotionEntry[] }) {
  const heatmapData = useMemo(() => {
    const today = startOfDay(new Date());
    const weeksToShow = 12;
    const startDate = startOfWeek(subWeeks(today, weeksToShow - 1), { weekStartsOn: 0 });
    const endDate = endOfWeek(today, { weekStartsOn: 0 });
    
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Count entries per day and track quadrants
    const entriesByDate: Record<string, { count: number; quadrants: QuadrantType[] }> = {};
    entries.forEach(entry => {
      if (!entriesByDate[entry.entry_date]) {
        entriesByDate[entry.entry_date] = { count: 0, quadrants: [] };
      }
      entriesByDate[entry.entry_date].count++;
      if (entry.quadrant) {
        entriesByDate[entry.entry_date].quadrants.push(entry.quadrant);
      }
    });
    
    // Group by weeks
    const weeks: { date: Date; dateStr: string; count: number; quadrants: QuadrantType[] }[][] = [];
    let currentWeek: { date: Date; dateStr: string; count: number; quadrants: QuadrantType[] }[] = [];
    
    allDays.forEach((day, i) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const data = entriesByDate[dateStr] || { count: 0, quadrants: [] };
      
      currentWeek.push({
        date: day,
        dateStr,
        count: data.count,
        quadrants: data.quadrants
      });
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
    
    return { weeks, today };
  }, [entries]);

  const getIntensityColor = (count: number, quadrants: QuadrantType[]) => {
    if (count === 0) return 'bg-muted/50';
    
    // Get dominant quadrant color
    if (quadrants.length > 0) {
      const quadrantCounts: Record<QuadrantType, number> = {
        'high-pleasant': 0,
        'high-unpleasant': 0,
        'low-unpleasant': 0,
        'low-pleasant': 0
      };
      quadrants.forEach(q => quadrantCounts[q]++);
      
      const dominant = Object.entries(quadrantCounts).sort((a, b) => b[1] - a[1])[0][0] as QuadrantType;
      const intensity = Math.min(count, 4);
      const opacities = [0.3, 0.5, 0.7, 0.9];
      
      return `opacity-${Math.round(opacities[intensity - 1] * 100)}`;
    }
    
    return 'bg-primary/50';
  };

  const getDominantColor = (quadrants: QuadrantType[]): string | undefined => {
    if (quadrants.length === 0) return undefined;
    
    const quadrantCounts: Record<QuadrantType, number> = {
      'high-pleasant': 0,
      'high-unpleasant': 0,
      'low-unpleasant': 0,
      'low-pleasant': 0
    };
    quadrants.forEach(q => quadrantCounts[q]++);
    
    const dominant = Object.entries(quadrantCounts).sort((a, b) => b[1] - a[1])[0][0] as QuadrantType;
    return QUADRANTS[dominant].color;
  };

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Emotion Calendar (Last 12 Weeks)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-1 text-[10px] text-muted-foreground">
            {dayLabels.map((label, i) => (
              <div key={i} className="h-3 w-3 flex items-center justify-center">
                {i % 2 === 1 ? label : ''}
              </div>
            ))}
          </div>
          
          {/* Weeks grid */}
          <div className="flex gap-1 overflow-x-auto">
            {heatmapData.weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-1">
                {week.map((day) => {
                  const isFuture = day.date > heatmapData.today;
                  const dominantColor = getDominantColor(day.quadrants);
                  const intensity = Math.min(day.count, 4);
                  const opacityValue = intensity === 0 ? 0.15 : 0.3 + (intensity * 0.175);
                  
                  return (
                    <TooltipProvider key={day.dateStr}>
                      <UITooltip delayDuration={100}>
                        <TooltipTrigger asChild>
                          <div
                            className={`h-3 w-3 rounded-sm transition-colors ${
                              isFuture 
                                ? 'bg-transparent border border-dashed border-muted-foreground/20' 
                                : day.count === 0 
                                  ? 'bg-muted/40' 
                                  : ''
                            }`}
                            style={
                              !isFuture && day.count > 0 && dominantColor
                                ? { backgroundColor: dominantColor, opacity: opacityValue }
                                : undefined
                            }
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <p className="font-medium">{format(day.date, 'MMM d, yyyy')}</p>
                          <p className="text-muted-foreground">
                            {day.count === 0 
                              ? 'No check-ins' 
                              : `${day.count} check-in${day.count > 1 ? 's' : ''}`
                            }
                          </p>
                        </TooltipContent>
                      </UITooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-end gap-3 mt-3 text-[10px] text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="h-3 w-3 rounded-sm bg-muted/40" />
            <div className="h-3 w-3 rounded-sm bg-primary/30" />
            <div className="h-3 w-3 rounded-sm bg-primary/50" />
            <div className="h-3 w-3 rounded-sm bg-primary/70" />
            <div className="h-3 w-3 rounded-sm bg-primary/90" />
          </div>
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function PatternsDashboard({ entries }: PatternsDashboardProps) {
  const [dateRange, setDateRange] = useState<DateRange>(30);
  
  // Filter entries by date range
  const filteredEntries = useMemo(() => {
    const today = startOfDay(new Date());
    const cutoffDate = subDays(today, dateRange - 1);
    const cutoffStr = format(cutoffDate, 'yyyy-MM-dd');
    
    return entries.filter(entry => entry.entry_date >= cutoffStr);
  }, [entries, dateRange]);
  
  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const dateRangeDays = eachDayOfInterval({
      start: subDays(today, dateRange - 1),
      end: today
    });
    
    // Entries by quadrant
    const quadrantCounts: Record<QuadrantType, number> = {
      'high-pleasant': 0,
      'high-unpleasant': 0,
      'low-unpleasant': 0,
      'low-pleasant': 0
    };
    
    // Emotion frequency
    const emotionCounts: Record<string, number> = {};
    
    // Daily entries for the range (show last 7 days in bar chart for readability)
    const last7Days = eachDayOfInterval({
      start: subDays(today, 6),
      end: today
    });
    
    const dailyData = last7Days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayEntries = filteredEntries.filter(e => e.entry_date === dateStr);
      return {
        date: format(date, 'EEE'),
        fullDate: dateStr,
        count: dayEntries.length,
        entries: dayEntries
      };
    });
    
    filteredEntries.forEach(entry => {
      if (entry.quadrant && quadrantCounts[entry.quadrant] !== undefined) {
        quadrantCounts[entry.quadrant]++;
      }
      if (entry.emotion) {
        emotionCounts[entry.emotion] = (emotionCounts[entry.emotion] || 0) + 1;
      }
    });
    
    // Top emotions
    const topEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    // Quadrant data for pie chart
    const quadrantData = Object.entries(quadrantCounts)
      .filter(([_, count]) => count > 0)
      .map(([id, count]) => ({
        name: QUADRANTS[id as QuadrantType].label.split(',')[0],
        value: count,
        color: QUADRANTS[id as QuadrantType].color
      }));
    
    // Current streak (always calculated from all entries)
    let streak = 0;
    for (let i = 0; i < 90; i++) {
      const checkDate = format(subDays(today, i), 'yyyy-MM-dd');
      const hasEntry = entries.some(e => e.entry_date === checkDate);
      if (hasEntry) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return {
      totalEntries: filteredEntries.length,
      quadrantCounts,
      quadrantData,
      topEmotions,
      dailyData,
      streak
    };
  }, [filteredEntries, dateRange, entries]);
  
  const mostCommonQuadrant = Object.entries(stats.quadrantCounts)
    .sort((a, b) => b[1] - a[1])[0];
  
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold mb-1">Your Patterns</h2>
          <p className="text-sm text-muted-foreground">
            Insights from your emotional check-ins
          </p>
        </div>
        
        {/* Date range selector */}
        <div className="flex gap-1">
          {DATE_RANGE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={dateRange === option.value ? "chipActive" : "chip"}
              size="sm"
              onClick={() => setDateRange(option.value)}
              className="text-xs"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
      
      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No check-ins yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Start logging your emotions to see patterns here
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs">Total Check-ins</span>
                </div>
                <p className="text-2xl font-semibold">{stats.totalEntries}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs">Current Streak</span>
                </div>
                <p className="text-2xl font-semibold">{stats.streak} days</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Target className="h-4 w-4" />
                  <span className="text-xs">Most Common Zone</span>
                </div>
                {mostCommonQuadrant && mostCommonQuadrant[1] > 0 ? (
                  <p 
                    className="text-sm font-medium truncate"
                    style={{ color: QUADRANTS[mostCommonQuadrant[0] as QuadrantType].color }}
                  >
                    {QUADRANTS[mostCommonQuadrant[0] as QuadrantType].label.split(',')[0]}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Activity className="h-4 w-4" />
                  <span className="text-xs">Top Feeling</span>
                </div>
                {stats.topEmotions[0] ? (
                  <p className="text-sm font-medium">{stats.topEmotions[0][0]}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Calendar Heatmap */}
          <CalendarHeatmap entries={entries} />
          
          {/* Weekly activity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Last 7 Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.dailyData}>
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      hide 
                      domain={[0, 'auto']}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-popover text-popover-foreground rounded-lg shadow-lg border p-2 text-xs">
                              <p className="font-medium">{data.fullDate}</p>
                              <p className="text-muted-foreground">{data.count} check-in{data.count !== 1 ? 's' : ''}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Quadrant distribution */}
          {stats.quadrantData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Mood Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.quadrantData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {stats.quadrantData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend 
                        formatter={(value) => <span className="text-xs">{value}</span>}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-popover text-popover-foreground rounded-lg shadow-lg border p-2 text-xs">
                                <p className="font-medium">{data.name}</p>
                                <p className="text-muted-foreground">{data.value} times</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Top emotions */}
          {stats.topEmotions.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Most Frequent Feelings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topEmotions.map(([emotion, count], i) => {
                    const maxCount = stats.topEmotions[0][1];
                    const percentage = (count / maxCount) * 100;
                    
                    return (
                      <div key={emotion} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{emotion}</span>
                          <span className="text-muted-foreground">{count} times</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}