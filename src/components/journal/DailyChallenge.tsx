import { motion, AnimatePresence } from "framer-motion";
import { Target, CheckCircle2, Sparkles, Gift, Clock, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import confetti from "canvas-confetti";

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: "words" | "mood" | "prompt" | "streak";
  target: number;
  xp: number;
}

const DAILY_CHALLENGES: Challenge[] = [
  { id: "words_100", title: "Express yourself", description: "Write 100 words today", type: "words", target: 100, xp: 10 },
  { id: "words_250", title: "Deep dive", description: "Write 250 words today", type: "words", target: 250, xp: 25 },
  { id: "mood_log", title: "Mood tracker", description: "Log your mood", type: "mood", target: 1, xp: 5 },
  { id: "prompt_use", title: "Inspiration seeker", description: "Use a journal prompt", type: "prompt", target: 1, xp: 15 },
];

interface DailyChallengeProps {
  wordCount: number;
  hasMood: boolean;
  hasUsedPrompt: boolean;
  streak: number;
}

export function DailyChallenge({ wordCount, hasMood, hasUsedPrompt, streak }: DailyChallengeProps) {
  const [todayChallenges, setTodayChallenges] = useState<Challenge[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [showReward, setShowReward] = useState(false);

  // Pick daily challenges based on date
  useEffect(() => {
    const today = new Date().toDateString();
    const seed = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Pick 2-3 challenges for today
    const shuffled = [...DAILY_CHALLENGES].sort(() => (seed % 10) - 5);
    setTodayChallenges(shuffled.slice(0, 3));
    
    // Load completed from localStorage
    const saved = localStorage.getItem(`journal_challenges_${today}`);
    if (saved) {
      setCompletedIds(new Set(JSON.parse(saved)));
    }
  }, []);

  // Check challenge completion
  useEffect(() => {
    const newlyCompleted: string[] = [];
    
    todayChallenges.forEach(challenge => {
      if (completedIds.has(challenge.id)) return;
      
      let isComplete = false;
      if (challenge.type === "words" && wordCount >= challenge.target) isComplete = true;
      if (challenge.type === "mood" && hasMood) isComplete = true;
      if (challenge.type === "prompt" && hasUsedPrompt) isComplete = true;
      
      if (isComplete) {
        newlyCompleted.push(challenge.id);
      }
    });
    
    if (newlyCompleted.length > 0) {
      const updated = new Set([...completedIds, ...newlyCompleted]);
      setCompletedIds(updated);
      localStorage.setItem(`journal_challenges_${new Date().toDateString()}`, JSON.stringify([...updated]));
      
      // Celebrate!
      setShowReward(true);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
      setTimeout(() => setShowReward(false), 2000);
    }
  }, [wordCount, hasMood, hasUsedPrompt, todayChallenges, completedIds]);

  const totalXP = todayChallenges.reduce((sum, c) => sum + (completedIds.has(c.id) ? c.xp : 0), 0);
  const maxXP = todayChallenges.reduce((sum, c) => sum + c.xp, 0);

  return (
    <div className="relative">
      {/* Reward popup */}
      <AnimatePresence>
        {showReward && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -20 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-full shadow-lg text-sm">
              <Sparkles className="h-4 w-4" />
              <span className="font-bold">Challenge Complete!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="p-4 rounded-2xl bg-gradient-to-br from-violet-50/80 to-purple-50/80 backdrop-blur-sm border border-violet-100/50"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <motion.div
              className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Target className="h-4 w-4 text-white" />
            </motion.div>
            <span className="font-semibold text-sm text-foreground">Daily Challenges</span>
          </div>
          
          <div className="flex items-center gap-1 px-2 py-0.5 bg-violet-100 rounded-full">
            <Gift className="h-3 w-3 text-violet-600" />
            <span className="text-xs font-bold text-violet-600">{totalXP}/{maxXP} XP</span>
          </div>
        </div>

        {/* Challenges list */}
        <div className="space-y-2">
          {todayChallenges.map((challenge, index) => {
            const isComplete = completedIds.has(challenge.id);
            let progress = 0;
            
            if (challenge.type === "words") progress = Math.min(100, (wordCount / challenge.target) * 100);
            if (challenge.type === "mood") progress = hasMood ? 100 : 0;
            if (challenge.type === "prompt") progress = hasUsedPrompt ? 100 : 0;
            
            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "relative p-3 rounded-xl transition-all",
                  isComplete 
                    ? "bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200" 
                    : "bg-white/60 border border-muted"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <motion.div
                      initial={false}
                      animate={isComplete ? { scale: [1, 1.3, 1], rotate: [0, 360] } : {}}
                      transition={{ duration: 0.5 }}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 mt-0.5" />
                      )}
                    </motion.div>
                    <div>
                      <p className={cn(
                        "text-sm font-medium",
                        isComplete && "text-emerald-700 line-through"
                      )}>
                        {challenge.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{challenge.description}</p>
                    </div>
                  </div>
                  
                  <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full",
                    isComplete 
                      ? "bg-emerald-100 text-emerald-700" 
                      : "bg-violet-100 text-violet-700"
                  )}>
                    +{challenge.xp}XP
                  </span>
                </div>

                {/* Progress bar for word challenges */}
                {challenge.type === "words" && !isComplete && (
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Motivational message */}
        <motion.p
          className="mt-3 text-xs text-center text-muted-foreground"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          {completedIds.size === todayChallenges.length 
            ? "✨ All challenges complete! Amazing work!" 
            : `${todayChallenges.length - completedIds.size} challenge${todayChallenges.length - completedIds.size !== 1 ? 's' : ''} remaining today`}
        </motion.p>
      </motion.div>
    </div>
  );
}
