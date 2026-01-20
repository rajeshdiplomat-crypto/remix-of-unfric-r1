import { useState, useEffect, useMemo } from "react";
import { format, subDays, startOfDay, differenceInCalendarDays } from "date-fns";
import { cn } from "@/lib/utils";
import { EmotionEntry, QUADRANTS, QuadrantType } from "./types";
import { 
  TrendingUp, 
  Flame, 
  BarChart3, 
  Calendar,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { PatternsDashboardEnhanced } from "./PatternsDashboardEnhanced";

interface PatternsSnapshotCardProps {
  entries: EmotionEntry[];
  onDateClick?: (date: string, entries: EmotionEntry[]) => void;
}

const getStreak = (entries: EmotionEntry[]): number => {
  if (entries.length === 0) return 0;
  
  const today = startOfDay(new Date());
  const uniqueDates = new Set(entries.map((e) => e.entry_date));
  
  let streak = 0;
  let checkDate = today;
  
  // Check if today or yesterday has an entry
  const todayStr = format(today, "yyyy-MM-dd");
  const yesterdayStr = format(subDays(today, 1), "yyyy-MM-dd");
  
  if (!uniqueDates.has(todayStr) && !uniqueDates.has(yesterdayStr)) {
    return 0;
  }
  
  // Start counting from today or yesterday
  if (!uniqueDates.has(todayStr)) {
    checkDate = subDays(today, 1);
  }
  
  while (true) {
    const dateStr = format(checkDate, "yyyy-MM-dd");
    if (uniqueDates.has(dateStr)) {
      streak++;
      checkDate = subDays(checkDate, 1);
    } else {
      break;
    }
  }
  
  return streak;
};

const getDominantQuadrant = (entries: EmotionEntry[]): QuadrantType | null => {
  if (entries.length === 0) return null;
  
  const counts: Record<QuadrantType, number> = {
    "high-pleasant": 0,
    "high-unpleasant": 0,
    "low-unpleasant": 0,
    "low-pleasant": 0,
  };
  
  entries.forEach((e) => counts[e.quadrant]++);
  
  let max = 0;
  let dominant: QuadrantType = "low-pleasant";
  Object.entries(counts).forEach(([q, count]) => {
    if (count > max) {
      max = count;
      dominant = q as QuadrantType;
    }
  });
  
  return dominant;
};

export function PatternsSnapshotCard({ entries, onDateClick }: PatternsSnapshotCardProps) {
  const [insightIndex, setInsightIndex] = useState(0);

  // Generate weekly data for the strip
  const weekData = useMemo(() => {
    const days: { date: string; quadrant: QuadrantType | null; count: number }[] = [];
    const today = startOfDay(new Date());
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, "yyyy-MM-dd");
      const dayEntries = entries.filter((e) => e.entry_date === dateStr);
      days.push({
        date: dateStr,
        quadrant: getDominantQuadrant(dayEntries),
        count: dayEntries.length,
      });
    }
    
    return days;
  }, [entries]);

  // Calculate stats
  const stats = useMemo(() => {
    const streak = getStreak(entries);
    const last7Days = entries.filter((e) => {
      const entryDate = new Date(e.entry_date);
      return differenceInCalendarDays(new Date(), entryDate) <= 7;
    });
    
    // Most common emotion in last 7 days
    const emotionCounts: Record<string, number> = {};
    last7Days.forEach((e) => {
      emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
    });
    
    let topEmotion = "";
    let topCount = 0;
    Object.entries(emotionCounts).forEach(([emotion, count]) => {
      if (count > topCount) {
        topCount = count;
        topEmotion = emotion;
      }
    });

    // Dominant quadrant
    const dominantQuadrant = getDominantQuadrant(last7Days);
    
    return {
      streak,
      totalThisWeek: last7Days.length,
      topEmotion,
      dominantQuadrant,
    };
  }, [entries]);

  // Rotating insights
  const insights = useMemo(() => {
    const messages: string[] = [];
    
    if (stats.streak > 0) {
      messages.push(`🔥 ${stats.streak} day streak! Keep it going.`);
    }
    
    if (stats.topEmotion) {
      messages.push(`💫 "${stats.topEmotion}" is your top feeling this week`);
    }
    
    if (stats.totalThisWeek > 0) {
      const avg = (stats.totalThisWeek / 7).toFixed(1);
      messages.push(`📊 You're checking in ${avg}x per day on average`);
    }
    
    if (stats.dominantQuadrant) {
      const quadrantLabel = QUADRANTS[stats.dominantQuadrant].label;
      messages.push(`🎯 Most time spent in "${quadrantLabel}" zone`);
    }

    if (messages.length === 0) {
      messages.push("✨ Start tracking to unlock insights!");
    }
    
    return messages;
  }, [stats]);

  // Auto-rotate insights
  useEffect(() => {
    if (insights.length <= 1) return;
    const interval = setInterval(() => {
      setInsightIndex((prev) => (prev + 1) % insights.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [insights.length]);

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-muted/30 via-background to-muted/20 border border-border/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-semibold">Patterns</h3>
        </div>
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 text-xs px-2">
              View All
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>Emotion Patterns</DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto px-4 pb-8">
              <PatternsDashboardEnhanced entries={entries} onDateClick={onDateClick} />
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Rotating insight */}
      <div className="mb-4 min-h-[24px]">
        <p 
          key={insightIndex}
          className="text-sm text-muted-foreground animate-fade-in"
        >
          {insights[insightIndex]}
        </p>
      </div>

      {/* Week strip */}
      <div className="grid grid-cols-7 gap-1.5 mb-4">
        {weekData.map((day, index) => {
          const isToday = index === 6;
          const dayName = format(new Date(day.date), "EEE").charAt(0);
          
          return (
            <button
              key={day.date}
              onClick={() => {
                if (day.count > 0 && onDateClick) {
                  const dayEntries = entries.filter((e) => e.entry_date === day.date);
                  onDateClick(day.date, dayEntries);
                }
              }}
              className={cn(
                "flex flex-col items-center gap-1 py-2 rounded-lg transition-all",
                day.count > 0 && "hover:bg-muted/50 cursor-pointer",
                isToday && "ring-1 ring-primary/30"
              )}
            >
              <span className="text-[10px] text-muted-foreground">{dayName}</span>
              <div
                className={cn(
                  "w-5 h-5 rounded-full transition-all",
                  day.count === 0 && "bg-muted border border-border/50"
                )}
                style={day.quadrant ? { 
                  backgroundColor: QUADRANTS[day.quadrant].color,
                  boxShadow: day.count > 1 ? `0 0 0 2px ${QUADRANTS[day.quadrant].bgColor}` : undefined 
                } : undefined}
              >
                {day.count > 1 && (
                  <span className="flex items-center justify-center h-full text-[9px] text-white font-bold">
                    {day.count}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick stats row */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <Flame className={cn("h-3.5 w-3.5", stats.streak > 0 ? "text-orange-500" : "text-muted-foreground")} />
          <span className="font-medium">{stats.streak}</span>
          <span className="text-muted-foreground">streak</span>
        </div>
        <div className="flex items-center gap-1.5">
          <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium">{stats.totalThisWeek}</span>
          <span className="text-muted-foreground">this week</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium">{entries.length}</span>
          <span className="text-muted-foreground">total</span>
        </div>
      </div>
    </div>
  );
}
