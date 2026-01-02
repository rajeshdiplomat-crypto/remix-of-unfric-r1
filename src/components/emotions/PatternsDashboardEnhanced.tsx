import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuadrantType, QUADRANTS, EmotionEntry } from "./types";
import { format, subDays, startOfDay, eachDayOfInterval, startOfWeek, endOfWeek, subWeeks, parseISO, getHours, startOfMonth, endOfMonth, eachDayOfInterval as eachDay, isSameMonth } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, Calendar, Activity, Target, Sun, Moon, Sunrise, Sunset, Dumbbell, Users, Briefcase } from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type DateRange = 7 | 30 | 90;

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
];

interface PatternsDashboardEnhancedProps {
  entries: EmotionEntry[];
}

// Time period classification
function getTimePeriod(timestamp: string): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = getHours(parseISO(timestamp));
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

const TIME_PERIOD_INFO = {
  morning: { label: 'Morning', range: '6am–12pm', icon: Sunrise, color: 'hsl(45, 93%, 47%)' },
  afternoon: { label: 'Afternoon', range: '12pm–5pm', icon: Sun, color: 'hsl(25, 80%, 55%)' },
  evening: { label: 'Evening', range: '5pm–9pm', icon: Sunset, color: 'hsl(280, 60%, 55%)' },
  night: { label: 'Night', range: '9pm–6am', icon: Moon, color: 'hsl(230, 50%, 45%)' }
};

// Helper to get emotion color based on quadrant
function getEmotionColor(emotion: string, entries: EmotionEntry[]): string | null {
  const entry = entries.find(e => e.emotion === emotion);
  if (entry) return QUADRANTS[entry.quadrant].color;
  // Fallback - search through quadrant emotions
  for (const [key, info] of Object.entries(QUADRANTS)) {
    if (info.emotions.includes(emotion)) {
      return info.color;
    }
  }
  return null;
}

// Enhanced Calendar with larger cells and color coding based on emotion entries
function MonthlyCalendar({ entries }: { entries: EmotionEntry[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const calendarData = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDay({ start, end });
    
    // Get first day offset for proper grid alignment
    const firstDayOfWeek = start.getDay();
    
    // Count entries per day with full quadrant info
    const entriesByDate: Record<string, { count: number; emotions: string[]; quadrants: QuadrantType[] }> = {};
    entries.forEach(entry => {
      if (!entriesByDate[entry.entry_date]) {
        entriesByDate[entry.entry_date] = { count: 0, emotions: [], quadrants: [] };
      }
      entriesByDate[entry.entry_date].count++;
      if (entry.emotion) entriesByDate[entry.entry_date].emotions.push(entry.emotion);
      if (entry.quadrant) entriesByDate[entry.entry_date].quadrants.push(entry.quadrant);
    });
    
    return { days, firstDayOfWeek, entriesByDate };
  }, [currentMonth, entries]);

  // Get dominant quadrant based on combined energy + pleasantness
  const getDominantQuadrant = (quadrants: QuadrantType[]): QuadrantType | null => {
    if (quadrants.length === 0) return null;
    const counts: Record<QuadrantType, number> = {
      'high-pleasant': 0, 'high-unpleasant': 0, 'low-unpleasant': 0, 'low-pleasant': 0
    };
    quadrants.forEach(q => counts[q]++);
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as QuadrantType;
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = startOfDay(new Date());

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-muted-foreground">Monthly Overview</p>
        <div className="flex gap-1 items-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
          >
            ←
          </Button>
          <span className="text-xs font-medium min-w-[90px] text-center">
            {format(currentMonth, 'MMM yyyy')}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
          >
            →
          </Button>
        </div>
      </div>
      
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayLabels.map(day => (
          <div key={day} className="text-center text-[10px] text-muted-foreground font-medium py-1">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for offset */}
        {Array.from({ length: calendarData.firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        
        {/* Day cells */}
        {calendarData.days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const data = calendarData.entriesByDate[dateStr];
          const dominant = data ? getDominantQuadrant(data.quadrants) : null;
          const isToday = day.getTime() === today.getTime();
          const isFuture = day > today;
          
          return (
            <TooltipProvider key={dateStr}>
              <UITooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <div
                    className={`
                      aspect-square rounded flex flex-col items-center justify-center transition-all cursor-default
                      ${isToday ? 'ring-1 ring-primary ring-offset-1' : ''}
                      ${isFuture ? 'opacity-30' : ''}
                      ${!data && !isFuture ? 'bg-muted/30' : ''}
                    `}
                    style={
                      dominant && !isFuture
                        ? { 
                            backgroundColor: QUADRANTS[dominant].bgColor,
                            borderColor: QUADRANTS[dominant].borderColor,
                            borderWidth: '1px',
                            borderStyle: 'solid'
                          }
                        : undefined
                    }
                  >
                    <span className={`text-xs font-medium ${dominant ? '' : 'text-muted-foreground'}`}>
                      {format(day, 'd')}
                    </span>
                    {data && data.count > 0 && (
                      <span 
                        className="text-[8px] font-medium"
                        style={{ color: dominant ? QUADRANTS[dominant].color : 'inherit' }}
                      >
                        {data.count}
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px]">
                  <p className="font-medium">{format(day, 'EEEE, MMM d')}</p>
                  {data ? (
                    <>
                      <p className="text-muted-foreground text-xs">
                        {data.count} check-in{data.count > 1 ? 's' : ''}
                      </p>
                      {data.emotions.length > 0 && (
                        <p className="text-xs mt-1">
                          Felt: {data.emotions.slice(0, 3).join(', ')}
                          {data.emotions.length > 3 ? '...' : ''}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground text-xs">No check-ins</p>
                  )}
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-3 justify-center">
        {Object.entries(QUADRANTS).map(([key, info]) => (
          <div key={key} className="flex items-center gap-1 text-[10px]">
            <div 
              className="w-2 h-2 rounded"
              style={{ backgroundColor: info.color }}
            />
            <span className="text-muted-foreground">{info.label.split(',')[0]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Daytime pattern insights - based on combined energy + pleasantness (quadrant)
function DaytimeInsights({ entries }: { entries: EmotionEntry[] }) {
  const insights = useMemo(() => {
    const periodData: Record<string, { emotions: string[]; quadrants: QuadrantType[] }> = {
      morning: { emotions: [], quadrants: [] },
      afternoon: { emotions: [], quadrants: [] },
      evening: { emotions: [], quadrants: [] },
      night: { emotions: [], quadrants: [] }
    };
    
    entries.forEach(entry => {
      const period = getTimePeriod(entry.created_at);
      if (entry.emotion) periodData[period].emotions.push(entry.emotion);
      if (entry.quadrant) periodData[period].quadrants.push(entry.quadrant);
    });
    
    // Get most common emotion per period
    const getTopEmotion = (emotions: string[]) => {
      if (emotions.length === 0) return null;
      const counts: Record<string, number> = {};
      emotions.forEach(e => counts[e] = (counts[e] || 0) + 1);
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    };
    
    // Get dominant quadrant (combines energy + pleasantness)
    const getDominantQuadrant = (quadrants: QuadrantType[]): QuadrantType | null => {
      if (quadrants.length === 0) return null;
      const counts: Record<QuadrantType, number> = {
        'high-pleasant': 0, 'high-unpleasant': 0, 'low-unpleasant': 0, 'low-pleasant': 0
      };
      quadrants.forEach(q => counts[q]++);
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as QuadrantType;
    };
    
    return Object.entries(periodData).map(([period, data]) => ({
      period: period as keyof typeof TIME_PERIOD_INFO,
      topEmotion: getTopEmotion(data.emotions),
      dominantQuadrant: getDominantQuadrant(data.quadrants),
      count: data.emotions.length
    }));
  }, [entries]);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Mood by Time of Day</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {insights.map(({ period, topEmotion, dominantQuadrant, count }) => {
            const info = TIME_PERIOD_INFO[period];
            const Icon = info.icon;
            const quadrantColor = dominantQuadrant ? QUADRANTS[dominantQuadrant].color : info.color;
            
            return (
              <div 
                key={period} 
                className="p-3 rounded-lg bg-muted/30 text-center"
                style={dominantQuadrant ? { 
                  backgroundColor: QUADRANTS[dominantQuadrant].bgColor,
                  borderColor: QUADRANTS[dominantQuadrant].borderColor,
                  borderWidth: '1px',
                  borderStyle: 'solid'
                } : undefined}
              >
                <Icon className="h-5 w-5 mx-auto mb-1" style={{ color: quadrantColor }} />
                <p className="text-xs font-medium text-muted-foreground">{info.label}</p>
                <p className="text-[10px] text-muted-foreground/60">{info.range}</p>
                {topEmotion ? (
                  <p className="text-sm font-medium mt-2" style={{ color: quadrantColor }}>{topEmotion[0]}</p>
                ) : (
                  <p className="text-sm text-muted-foreground/50 mt-2">—</p>
                )}
                <p className="text-[10px] text-muted-foreground">{count} check-ins</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Pattern-based correlations
function PatternCorrelations({ entries }: { entries: EmotionEntry[] }) {
  const correlations = useMemo(() => {
    const results: { type: string; icon: any; insight: string }[] = [];
    
    // Sleep correlation
    const sleepData: Record<string, { positive: number; total: number }> = {};
    entries.forEach(entry => {
      const sleep = entry.context?.sleepHours;
      if (sleep) {
        if (!sleepData[sleep]) sleepData[sleep] = { positive: 0, total: 0 };
        sleepData[sleep].total++;
        if (entry.quadrant?.includes('pleasant')) sleepData[sleep].positive++;
      }
    });
    
    const sleepEntries = Object.entries(sleepData);
    if (sleepEntries.length > 0) {
      const bestSleep = sleepEntries.sort((a, b) => 
        (b[1].positive / b[1].total) - (a[1].positive / a[1].total)
      )[0];
      if (bestSleep[1].total >= 3) {
        results.push({
          type: 'sleep',
          icon: Moon,
          insight: `You felt calmer with ${bestSleep[0]} sleep (${bestSleep[1].total} entries)`
        });
      }
    }
    
    // Activity correlation
    const activityData: Record<string, { positive: number; total: number }> = {};
    entries.forEach(entry => {
      const activity = entry.context?.physicalActivity;
      if (activity && activity !== 'None') {
        if (!activityData[activity]) activityData[activity] = { positive: 0, total: 0 };
        activityData[activity].total++;
        if (entry.quadrant === 'high-pleasant') activityData[activity].positive++;
      }
    });
    
    const activityEntries = Object.entries(activityData);
    if (activityEntries.length > 0) {
      const bestActivity = activityEntries.sort((a, b) => 
        (b[1].positive / b[1].total) - (a[1].positive / a[1].total)
      )[0];
      if (bestActivity[1].total >= 2) {
        results.push({
          type: 'activity',
          icon: Dumbbell,
          insight: `Most energized after ${bestActivity[0].toLowerCase()} (${bestActivity[1].total} entries)`
        });
      }
    }
    
    // People correlation
    const whoData: Record<string, { quadrants: QuadrantType[] }> = {};
    entries.forEach(entry => {
      const who = entry.context?.who;
      if (who) {
        if (!whoData[who]) whoData[who] = { quadrants: [] };
        if (entry.quadrant) whoData[who].quadrants.push(entry.quadrant);
      }
    });
    
    const whoEntries = Object.entries(whoData);
    if (whoEntries.length > 0) {
      whoEntries.forEach(([who, data]) => {
        const unpleasantCount = data.quadrants.filter(q => q.includes('unpleasant')).length;
        if (unpleasantCount >= 2 && unpleasantCount / data.quadrants.length > 0.5) {
          results.push({
            type: 'people',
            icon: Users,
            insight: `More anxious when ${who.toLowerCase()} (${data.quadrants.length} entries)`
          });
        }
      });
    }
    
    // What doing correlation
    const whatData: Record<string, { quadrants: QuadrantType[] }> = {};
    entries.forEach(entry => {
      const what = entry.context?.what;
      if (what) {
        if (!whatData[what]) whatData[what] = { quadrants: [] };
        if (entry.quadrant) whatData[what].quadrants.push(entry.quadrant);
      }
    });
    
    const whatEntries = Object.entries(whatData);
    if (whatEntries.length > 0) {
      whatEntries.forEach(([what, data]) => {
        if (data.quadrants.length >= 3) {
          const positiveRate = data.quadrants.filter(q => q.includes('pleasant')).length / data.quadrants.length;
          if (positiveRate > 0.6) {
            results.push({
              type: 'activity',
              icon: Briefcase,
              insight: `${what} often makes you feel good (${data.quadrants.length} entries)`
            });
          }
        }
      });
    }
    
    return results.slice(0, 4);
  }, [entries]);
  
  if (correlations.length === 0) {
    return null;
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Pattern Insights</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {correlations.map((corr, i) => {
            const Icon = corr.icon;
            return (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm">{corr.insight}</p>
              </div>
            );
          })}
        </div>
        {correlations.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Add more context to your check-ins to see patterns
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function PatternsDashboardEnhanced({ entries }: PatternsDashboardEnhancedProps) {
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
    
    // Entries by quadrant (combines energy + pleasantness)
    const quadrantCounts: Record<QuadrantType, number> = {
      'high-pleasant': 0,
      'high-unpleasant': 0,
      'low-unpleasant': 0,
      'low-pleasant': 0
    };
    
    // Emotion frequency with quadrant tracking
    const emotionCounts: Record<string, { count: number; quadrant: QuadrantType | null }> = {};
    
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
        if (!emotionCounts[entry.emotion]) {
          emotionCounts[entry.emotion] = { count: 0, quadrant: null };
        }
        emotionCounts[entry.emotion].count++;
        emotionCounts[entry.emotion].quadrant = entry.quadrant;
      }
    });
    
    // Top emotions with count only for display
    const topEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([emotion, data]) => [emotion, data.count] as [string, number]);
    
    // Quadrant data for pie chart - shows combined energy + pleasantness
    const quadrantData = Object.entries(quadrantCounts)
      .filter(([_, count]) => count > 0)
      .map(([id, count]) => ({
        name: QUADRANTS[id as QuadrantType].label.split(',')[0],
        value: count,
        color: QUADRANTS[id as QuadrantType].color
      }));
    
    // Current streak
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
  }, [filteredEntries, entries]);
  
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
              variant={dateRange === option.value ? "default" : "outline"}
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
          
          {/* Row 1: Daytime insights + Last 7 Days side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Daytime insights */}
            <DaytimeInsights entries={filteredEntries} />
            
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
          </div>
          
          {/* Row 2: Mood Distribution + Most Frequent Feelings side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
            
            {/* Top emotions - color coded */}
            {stats.topEmotions.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Most Frequent Feelings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.topEmotions.map(([emotion, count]) => {
                      const maxCount = stats.topEmotions[0][1];
                      const percentage = (count / maxCount) * 100;
                      const emotionColor = getEmotionColor(emotion, filteredEntries) || 'hsl(var(--primary))';
                      
                      return (
                        <div key={emotion} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium" style={{ color: emotionColor }}>{emotion}</span>
                            <span className="text-muted-foreground">{count} times</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all"
                              style={{ width: `${percentage}%`, backgroundColor: emotionColor }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Pattern Correlations */}
          <PatternCorrelations entries={filteredEntries} />
          
          {/* Monthly Calendar - at the bottom */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Monthly Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyCalendar entries={entries} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
