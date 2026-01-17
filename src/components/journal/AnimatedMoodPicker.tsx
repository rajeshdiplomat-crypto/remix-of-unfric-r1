import { motion, AnimatePresence } from "framer-motion";
import { Smile, Heart, Meh, Frown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface MoodOption {
  id: string;
  label: string;
  emoji: string;
  color: string;
  gradient: string;
}

const MOOD_OPTIONS: MoodOption[] = [
  { id: "great", label: "Amazing", emoji: "😍", color: "emerald", gradient: "from-emerald-400 to-green-500" },
  { id: "good", label: "Good", emoji: "😊", color: "blue", gradient: "from-blue-400 to-cyan-500" },
  { id: "okay", label: "Okay", emoji: "😐", color: "amber", gradient: "from-amber-400 to-orange-500" },
  { id: "low", label: "Meh", emoji: "😔", color: "rose", gradient: "from-rose-400 to-pink-500" },
];

interface AnimatedMoodPickerProps {
  selectedMood: string | null;
  onMoodSelect: (moodId: string) => void;
  compact?: boolean;
}

export function AnimatedMoodPicker({ selectedMood, onMoodSelect, compact = false }: AnimatedMoodPickerProps) {
  return (
    <div className={cn("flex items-center gap-1", compact ? "gap-0.5" : "gap-2")}>
      <AnimatePresence mode="wait">
        {MOOD_OPTIONS.map((mood, index) => {
          const isActive = selectedMood === mood.id;
          
          return (
            <motion.button
              key={mood.id}
              initial={{ opacity: 0, scale: 0.5, y: 10 }}
              animate={{ 
                opacity: 1, 
                scale: isActive ? 1.15 : 1,
                y: 0,
              }}
              whileHover={{ 
                scale: isActive ? 1.2 : 1.1,
                y: -2,
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ 
                type: "spring",
                stiffness: 400,
                damping: 17,
                delay: index * 0.05
              }}
              onClick={() => onMoodSelect(mood.id)}
              className={cn(
                "relative flex items-center justify-center rounded-xl transition-all duration-300",
                compact ? "p-1.5" : "p-2",
                isActive 
                  ? `bg-gradient-to-br ${mood.gradient} shadow-lg` 
                  : "bg-muted/50 hover:bg-muted"
              )}
            >
              {/* Glow effect for active mood */}
              {isActive && (
                <motion.div
                  className={cn("absolute inset-0 rounded-xl bg-gradient-to-br opacity-50 blur-md", mood.gradient)}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 0.5, scale: 1.2 }}
                  transition={{ duration: 0.3 }}
                />
              )}
              
              {/* Emoji with pop animation */}
              <motion.span
                className={cn(
                  "relative z-10 select-none",
                  compact ? "text-lg" : "text-2xl"
                )}
                animate={isActive ? {
                  rotate: [0, -10, 10, -10, 0],
                } : {}}
                transition={{ duration: 0.5 }}
              >
                {mood.emoji}
              </motion.span>

              {/* Sparkle effects on selection */}
              {isActive && (
                <>
                  <motion.div
                    className="absolute -top-1 -right-1"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Sparkles className="h-3 w-3 text-white" />
                  </motion.div>
                  <motion.div
                    className="absolute -bottom-0.5 -left-0.5"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Sparkles className="h-2 w-2 text-white/80" />
                  </motion.div>
                </>
              )}
            </motion.button>
          );
        })}
      </AnimatePresence>

      {/* Selected mood label */}
      <AnimatePresence>
        {selectedMood && !compact && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="ml-2 text-sm font-medium text-muted-foreground"
          >
            {MOOD_OPTIONS.find(m => m.id === selectedMood)?.label}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
