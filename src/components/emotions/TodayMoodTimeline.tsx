import { motion } from "framer-motion";
import { format, subDays, isSameDay } from "date-fns";
import { EmotionEntry, QUADRANTS, QuadrantType } from "./types";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface TodayMoodTimelineProps {
  entries: EmotionEntry[];
  onEntryClick?: (entry: EmotionEntry) => void;
}

export function TodayMoodTimeline({ entries, onEntryClick }: TodayMoodTimelineProps) {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  
  const todayEntries = entries
    .filter(e => e.entry_date === todayStr)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  if (todayEntries.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-violet-500/10">
            <Clock className="h-4 w-4 text-violet-500" />
          </div>
          <span className="font-medium text-sm">Today's Journey</span>
        </div>
        <p className="text-sm text-muted-foreground text-center py-4">
          No check-ins yet today. How are you feeling? 🌱
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-violet-500/10">
            <Clock className="h-4 w-4 text-violet-500" />
          </div>
          <span className="font-medium text-sm">Today's Journey</span>
        </div>
        <span className="text-xs text-muted-foreground">{todayEntries.length} check-in{todayEntries.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Connection line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-200 via-purple-200 to-pink-200" />

        <div className="space-y-3">
          {todayEntries.map((entry, index) => {
            const info = QUADRANTS[entry.quadrant];
            const time = format(new Date(entry.created_at), 'h:mm a');
            const isLast = index === todayEntries.length - 1;

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => onEntryClick?.(entry)}
                className={cn(
                  "relative pl-10 cursor-pointer group",
                  onEntryClick && "hover:opacity-80"
                )}
              >
                {/* Timeline dot */}
                <motion.div
                  className="absolute left-2 top-2 w-4 h-4 rounded-full border-2 bg-background z-10"
                  style={{ borderColor: info.color }}
                  animate={isLast ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 2, repeat: isLast ? Infinity : 0 }}
                >
                  <div 
                    className="absolute inset-1 rounded-full"
                    style={{ backgroundColor: info.color }}
                  />
                </motion.div>

                {/* Entry card */}
                <div 
                  className="p-3 rounded-xl transition-all"
                  style={{ backgroundColor: info.bgColor }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {entry.quadrant === 'high-pleasant' && '😊'}
                        {entry.quadrant === 'high-unpleasant' && '😰'}
                        {entry.quadrant === 'low-unpleasant' && '😔'}
                        {entry.quadrant === 'low-pleasant' && '😌'}
                      </span>
                      <span className="font-medium text-sm" style={{ color: info.color }}>
                        {entry.emotion}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{time}</span>
                  </div>
                  
                  {entry.note && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      "{entry.note}"
                    </p>
                  )}

                  {(entry.context?.who || entry.context?.what) && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {entry.context.who && (
                        <span className="text-[10px] px-2 py-0.5 bg-background/50 rounded-full">
                          {entry.context.who}
                        </span>
                      )}
                      {entry.context.what && (
                        <span className="text-[10px] px-2 py-0.5 bg-background/50 rounded-full">
                          {entry.context.what}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
