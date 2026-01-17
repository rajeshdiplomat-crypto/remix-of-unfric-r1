import { motion } from "framer-motion";
import { format, subDays, eachDayOfInterval, isSameDay } from "date-fns";
import { EmotionEntry, QUADRANTS, QuadrantType } from "./types";
import { TrendingUp, Calendar, Flame, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmotionStatsCardProps {
  entries: EmotionEntry[];
}

export function EmotionStatsCard({ entries }: EmotionStatsCardProps) {
  const today = new Date();
  const last7Days = eachDayOfInterval({ start: subDays(today, 6), end: today });
  
  // Calculate streak
  const streak = (() => {
    let count = 0;
    let checkDate = new Date();
    for (let i = 0; i < 365; i++) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      const hasEntry = entries.some(e => e.entry_date === dateStr);
      if (hasEntry) {
        count++;
        checkDate = subDays(checkDate, 1);
      } else if (i > 0) {
        break;
      } else {
        checkDate = subDays(checkDate, 1);
      }
    }
    return count;
  })();

  // Today's check-ins
  const todayStr = format(today, 'yyyy-MM-dd');
  const todayCount = entries.filter(e => e.entry_date === todayStr).length;

  // Most common mood this week
  const weekEntries = entries.filter(e => {
    const entryDate = new Date(e.entry_date);
    return entryDate >= subDays(today, 7);
  });
  
  const quadrantCounts = weekEntries.reduce((acc, e) => {
    acc[e.quadrant] = (acc[e.quadrant] || 0) + 1;
    return acc;
  }, {} as Record<QuadrantType, number>);
  
  const dominantQuadrant = Object.entries(quadrantCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] as QuadrantType | undefined;

  // Weekly activity dots
  const weekActivity = last7Days.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayEntries = entries.filter(e => e.entry_date === dayStr);
    return {
      date: day,
      count: dayEntries.length,
      quadrant: dayEntries[0]?.quadrant,
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl bg-gradient-to-br from-violet-50/80 to-purple-50/80 dark:from-violet-950/30 dark:to-purple-950/30 border border-violet-100/50 dark:border-violet-800/30"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500">
          <TrendingUp className="h-4 w-4 text-white" />
        </div>
        <span className="font-medium text-sm">Your Mood Stats</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Streak */}
        <motion.div
          className="text-center p-3 bg-white/60 dark:bg-background/60 rounded-xl"
          whileHover={{ scale: 1.05 }}
        >
          <motion.div
            animate={{ scale: streak > 0 ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 0.5, repeat: streak > 0 ? Infinity : 0, repeatDelay: 2 }}
          >
            <Flame className={cn(
              "h-5 w-5 mx-auto mb-1",
              streak > 0 ? "text-orange-500" : "text-muted-foreground"
            )} />
          </motion.div>
          <p className="text-lg font-bold">{streak}</p>
          <p className="text-[10px] text-muted-foreground">Day Streak</p>
        </motion.div>

        {/* Today */}
        <motion.div
          className="text-center p-3 bg-white/60 dark:bg-background/60 rounded-xl"
          whileHover={{ scale: 1.05 }}
        >
          <Target className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
          <p className="text-lg font-bold">{todayCount}</p>
          <p className="text-[10px] text-muted-foreground">Today</p>
        </motion.div>

        {/* This Week */}
        <motion.div
          className="text-center p-3 bg-white/60 dark:bg-background/60 rounded-xl"
          whileHover={{ scale: 1.05 }}
        >
          <Calendar className="h-5 w-5 mx-auto mb-1 text-blue-500" />
          <p className="text-lg font-bold">{weekEntries.length}</p>
          <p className="text-[10px] text-muted-foreground">This Week</p>
        </motion.div>
      </div>

      {/* Weekly Activity */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Last 7 days</p>
        <div className="flex justify-between gap-1">
          {weekActivity.map((day, index) => {
            const isToday = isSameDay(day.date, today);
            const info = day.quadrant ? QUADRANTS[day.quadrant] : null;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div 
                  className={cn(
                    "w-full aspect-square rounded-lg flex items-center justify-center text-[10px] font-medium",
                    day.count === 0 
                      ? "bg-muted/50 text-muted-foreground" 
                      : "text-white",
                    isToday && day.count === 0 && "ring-2 ring-violet-300"
                  )}
                  style={day.count > 0 && info ? { backgroundColor: info.color } : {}}
                >
                  {day.count > 0 ? day.count : '·'}
                </div>
                <span className={cn(
                  "text-[9px]",
                  isToday ? "font-bold text-violet-600" : "text-muted-foreground"
                )}>
                  {format(day.date, 'EEE').charAt(0)}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Dominant Mood */}
      {dominantQuadrant && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 p-3 rounded-xl"
          style={{ backgroundColor: QUADRANTS[dominantQuadrant].bgColor }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {dominantQuadrant === 'high-pleasant' && '😊'}
              {dominantQuadrant === 'high-unpleasant' && '😰'}
              {dominantQuadrant === 'low-unpleasant' && '😔'}
              {dominantQuadrant === 'low-pleasant' && '😌'}
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Most common this week</p>
              <p className="text-sm font-medium" style={{ color: QUADRANTS[dominantQuadrant].color }}>
                {QUADRANTS[dominantQuadrant].label.split(',')[0]}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
