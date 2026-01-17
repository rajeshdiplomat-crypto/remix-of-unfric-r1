import { motion, AnimatePresence } from "framer-motion";
import { Flame, Trophy, Star, Zap, Award, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";

interface StreakDisplayProps {
  streak: number;
  compact?: boolean;
}

const MILESTONES = [7, 14, 21, 30, 60, 90, 100, 180, 365];

function getMilestoneInfo(streak: number) {
  const nextMilestone = MILESTONES.find(m => m > streak) || streak + 30;
  const prevMilestone = MILESTONES.filter(m => m <= streak).pop() || 0;
  const progress = prevMilestone > 0 
    ? ((streak - prevMilestone) / (nextMilestone - prevMilestone)) * 100
    : (streak / nextMilestone) * 100;
  
  return { nextMilestone, progress, achievedMilestones: MILESTONES.filter(m => m <= streak) };
}

function getFlameColor(streak: number) {
  if (streak >= 100) return "from-violet-500 via-purple-500 to-fuchsia-500";
  if (streak >= 30) return "from-orange-500 via-red-500 to-pink-500";
  if (streak >= 7) return "from-amber-500 via-orange-500 to-red-500";
  return "from-amber-400 to-orange-500";
}

export function StreakDisplay({ streak, compact = false }: StreakDisplayProps) {
  const [showMilestone, setShowMilestone] = useState(false);
  const { nextMilestone, progress, achievedMilestones } = getMilestoneInfo(streak);
  const flameColor = getFlameColor(streak);

  // Check for milestone celebrations
  useEffect(() => {
    if (MILESTONES.includes(streak) && streak > 0) {
      setShowMilestone(true);
      // Celebrate with confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      setTimeout(() => setShowMilestone(false), 3000);
    }
  }, [streak]);

  if (compact) {
    return (
      <motion.div
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, -5, 5, 0]
          }}
          transition={{ 
            duration: 0.6,
            repeat: Infinity,
            repeatDelay: 2
          }}
        >
          <Flame className={cn("h-4 w-4 text-orange-500")} />
        </motion.div>
        <span className="text-sm font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
          {streak}
        </span>
        <span className="text-xs text-amber-600/70 hidden sm:inline">day{streak !== 1 ? 's' : ''}</span>
      </motion.div>
    );
  }

  return (
    <div className="relative">
      {/* Milestone celebration overlay */}
      <AnimatePresence>
        {showMilestone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -20 }}
            className="absolute -top-16 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full shadow-lg">
              <Trophy className="h-5 w-5" />
              <span className="font-bold">{streak} Day Milestone!</span>
              <Star className="h-4 w-4" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="flex flex-col gap-3 p-4 rounded-2xl bg-gradient-to-br from-amber-50/80 to-orange-50/80 backdrop-blur-sm border border-amber-100/50"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Main streak display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Animated flame stack */}
            <div className="relative">
              <motion.div
                className={cn("relative z-10 p-2 rounded-xl bg-gradient-to-br", flameColor)}
                animate={{ 
                  scale: [1, 1.05, 1],
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Flame className="h-6 w-6 text-white" />
              </motion.div>
              
              {/* Glow effect */}
              <motion.div
                className={cn("absolute inset-0 rounded-xl bg-gradient-to-br blur-lg opacity-50", flameColor)}
                animate={{ 
                  scale: [0.8, 1.2, 0.8],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* Extra flames for high streaks */}
              {streak >= 7 && (
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{ 
                    y: [-2, 2, -2],
                    rotate: [0, 10, 0]
                  }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  <Flame className="h-3 w-3 text-orange-400" />
                </motion.div>
              )}
              {streak >= 30 && (
                <motion.div
                  className="absolute -top-2 left-0"
                  animate={{ 
                    y: [-1, 3, -1],
                    rotate: [0, -10, 0]
                  }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                >
                  <Flame className="h-3 w-3 text-red-400" />
                </motion.div>
              )}
            </div>
            
            <div>
              <div className="flex items-baseline gap-1">
                <motion.span
                  key={streak}
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent"
                >
                  {streak}
                </motion.span>
                <span className="text-sm text-amber-700/70">day streak</span>
              </div>
              <p className="text-xs text-muted-foreground">Keep it going! 🔥</p>
            </div>
          </div>

          {/* Next milestone */}
          <div className="text-right">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>Next: {nextMilestone}d</span>
            </div>
          </div>
        </div>

        {/* Progress bar to next milestone */}
        <div className="relative h-2 bg-amber-100 rounded-full overflow-hidden">
          <motion.div
            className={cn("absolute inset-y-0 left-0 rounded-full bg-gradient-to-r", flameColor)}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>

        {/* Achieved milestones badges */}
        {achievedMilestones.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {achievedMilestones.slice(-4).map((milestone, i) => (
              <motion.div
                key={milestone}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-0.5 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full"
              >
                <Award className="h-2.5 w-2.5 text-white" />
                <span className="text-[10px] font-bold text-white">{milestone}d</span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
