import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuadrantType, QUADRANTS, EmotionEntry } from "./types";
import { format, subDays, startOfDay, eachDayOfInterval, parseISO } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, Calendar, Activity, Target } from "lucide-react";

interface PatternsDashboardProps {
  entries: EmotionEntry[];
}

export function PatternsDashboard({ entries }: PatternsDashboardProps) {
  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const last7Days = eachDayOfInterval({
      start: subDays(today, 6),
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
    
    // Daily entries for the week
    const dailyData = last7Days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayEntries = entries.filter(e => e.entry_date === dateStr);
      return {
        date: format(date, 'EEE'),
        fullDate: dateStr,
        count: dayEntries.length,
        entries: dayEntries
      };
    });
    
    entries.forEach(entry => {
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
    
    // Current streak
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const checkDate = format(subDays(today, i), 'yyyy-MM-dd');
      const hasEntry = entries.some(e => e.entry_date === checkDate);
      if (hasEntry) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return {
      totalEntries: entries.length,
      quadrantCounts,
      quadrantData,
      topEmotions,
      dailyData,
      streak
    };
  }, [entries]);
  
  const mostCommonQuadrant = Object.entries(stats.quadrantCounts)
    .sort((a, b) => b[1] - a[1])[0];
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Your Patterns</h2>
        <p className="text-sm text-muted-foreground">
          Insights from your emotional check-ins
        </p>
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
