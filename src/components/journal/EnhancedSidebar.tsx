import { motion } from "framer-motion";
import { StreakDisplay } from "./StreakDisplay";
import { DailyChallenge } from "./DailyChallenge";
import { MemoriesCard } from "./MemoriesCard";
import { WritingStats } from "./WritingStats";
import { JournalSkin } from "./types";
import { format, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { JournalEntry } from "./types";
import { Lightbulb, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

// Writing prompts for inspiration
const PROMPTS = [
  "What made you smile today?",
  "What are you grateful for right now?",
  "What's one thing you learned today?",
  "How are you really feeling?",
  "What would make tomorrow amazing?",
  "Describe a moment of peace today",
  "What's on your mind?",
  "What's one small win from today?",
  "What are you looking forward to?",
  "How did you take care of yourself today?",
];

interface EnhancedSidebarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  entries: JournalEntry[];
  onInsertPrompt: (prompt: string) => void;
  skin: JournalSkin;
  wordCount: number;
  streak: number;
  hasMood: boolean;
  hasUsedPrompt: boolean;
  onViewEntry?: (date: Date) => void;
}

export function EnhancedSidebar({
  selectedDate,
  onDateSelect,
  entries,
  onInsertPrompt,
  skin,
  wordCount,
  streak,
  hasMood,
  hasUsedPrompt,
  onViewEntry,
}: EnhancedSidebarProps) {
  const [usedPromptToday, setUsedPromptToday] = useState(hasUsedPrompt);
  
  // Get week days for mini calendar
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const handleInsertPrompt = (prompt: string) => {
    onInsertPrompt(prompt);
    setUsedPromptToday(true);
  };

  // Get random prompt of the day
  const todayPrompt = PROMPTS[new Date().getDate() % PROMPTS.length];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-4"
    >
      {/* Mini Week Calendar */}
      <motion.div
        className="p-4 rounded-2xl bg-gradient-to-br from-slate-50/80 to-gray-50/80 backdrop-blur-sm border border-slate-100/50"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day, index) => {
            const hasEntry = entries.some(e => e.entryDate === format(day, "yyyy-MM-dd"));
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            
            return (
              <motion.button
                key={day.toISOString()}
                onClick={() => onDateSelect(day)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "flex flex-col items-center p-2 rounded-xl transition-all",
                  isSelected 
                    ? "bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-lg" 
                    : isToday
                    ? "bg-violet-100 text-violet-700"
                    : "hover:bg-muted"
                )}
              >
                <span className={cn(
                  "text-[10px] font-medium uppercase",
                  isSelected ? "text-white/80" : "text-muted-foreground"
                )}>
                  {format(day, "EEE").charAt(0)}
                </span>
                <span className={cn(
                  "text-sm font-bold",
                  isSelected ? "text-white" : ""
                )}>
                  {format(day, "d")}
                </span>
                {hasEntry && !isSelected && (
                  <div className="w-1 h-1 rounded-full bg-violet-500 mt-0.5" />
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Streak Display */}
      <StreakDisplay streak={streak} />

      {/* Daily Challenges */}
      <DailyChallenge 
        wordCount={wordCount}
        hasMood={hasMood}
        hasUsedPrompt={usedPromptToday}
        streak={streak}
      />

      {/* Writing Stats */}
      <WritingStats 
        wordCount={wordCount} 
        streak={streak} 
        totalEntries={entries.length} 
      />

      {/* Today's Prompt */}
      <motion.div
        className="p-4 rounded-2xl bg-gradient-to-br from-rose-50/80 to-pink-50/80 backdrop-blur-sm border border-rose-100/50"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <motion.div
            className="p-1.5 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Lightbulb className="h-4 w-4 text-white" />
          </motion.div>
          <span className="font-semibold text-sm text-foreground">Today's Prompt</span>
        </div>
        
        <p className="text-sm text-muted-foreground mb-3 italic">
          "{todayPrompt}"
        </p>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleInsertPrompt(todayPrompt)}
          className="w-full bg-white/60 hover:bg-white/80 text-rose-600 hover:text-rose-700 rounded-xl"
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          Use this prompt
        </Button>
      </motion.div>

      {/* Memories/Time Capsule */}
      <MemoriesCard onViewEntry={onViewEntry || onDateSelect} />
    </motion.div>
  );
}
