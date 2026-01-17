import { motion } from "framer-motion";
import { PenLine, Clock, TrendingUp, Calendar, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface WritingStatsProps {
  wordCount: number;
  streak: number;
  totalEntries: number;
  compact?: boolean;
}

function getWritingMilestone(wordCount: number) {
  if (wordCount >= 500) return { label: "Epic Entry! 🏆", color: "from-violet-500 to-purple-500" };
  if (wordCount >= 250) return { label: "Deep Dive 🌊", color: "from-blue-500 to-cyan-500" };
  if (wordCount >= 100) return { label: "Nice Flow ✍️", color: "from-emerald-500 to-green-500" };
  if (wordCount >= 50) return { label: "Good Start 🌱", color: "from-amber-500 to-orange-500" };
  return { label: "Keep writing...", color: "from-muted to-muted-foreground" };
}

export function WritingStats({ wordCount, streak, totalEntries, compact = false }: WritingStatsProps) {
  const milestone = getWritingMilestone(wordCount);
  
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <motion.div
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <PenLine className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-bold text-blue-700">{wordCount}</span>
          <span className="text-xs text-blue-600/70 hidden sm:inline">words</span>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-sm border border-blue-100/50"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Word count with milestone */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <PenLine className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <motion.div
              key={wordCount}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="flex items-baseline gap-1"
            >
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {wordCount}
              </span>
              <span className="text-sm text-blue-700/70">words</span>
            </motion.div>
            <motion.p
              className={cn("text-xs bg-gradient-to-r bg-clip-text text-transparent font-medium", milestone.color)}
            >
              {milestone.label}
            </motion.p>
          </div>
        </div>

        {/* Visual progress rings */}
        <div className="relative w-12 h-12">
          {/* 100 words ring */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-blue-100"
            />
            <motion.circle
              cx="24"
              cy="24"
              r="20"
              stroke="url(#gradient)"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              initial={{ strokeDasharray: "125.6", strokeDashoffset: 125.6 }}
              animate={{ 
                strokeDashoffset: 125.6 - (Math.min(wordCount / 100, 1) * 125.6)
              }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold text-blue-600">
              {Math.min(Math.round((wordCount / 100) * 100), 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Quick stats grid */}
      <div className="grid grid-cols-3 gap-2">
        <motion.div
          className="text-center p-2 bg-white/50 rounded-xl"
          whileHover={{ scale: 1.05 }}
        >
          <TrendingUp className="h-4 w-4 mx-auto text-emerald-500 mb-1" />
          <p className="text-lg font-bold text-foreground">{streak}</p>
          <p className="text-[10px] text-muted-foreground">Day Streak</p>
        </motion.div>
        
        <motion.div
          className="text-center p-2 bg-white/50 rounded-xl"
          whileHover={{ scale: 1.05 }}
        >
          <Calendar className="h-4 w-4 mx-auto text-blue-500 mb-1" />
          <p className="text-lg font-bold text-foreground">{totalEntries}</p>
          <p className="text-[10px] text-muted-foreground">Entries</p>
        </motion.div>
        
        <motion.div
          className="text-center p-2 bg-white/50 rounded-xl"
          whileHover={{ scale: 1.05 }}
        >
          <Sparkles className="h-4 w-4 mx-auto text-violet-500 mb-1" />
          <p className="text-lg font-bold text-foreground">{Math.round(wordCount / Math.max(1, totalEntries))}</p>
          <p className="text-[10px] text-muted-foreground">Avg Words</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
