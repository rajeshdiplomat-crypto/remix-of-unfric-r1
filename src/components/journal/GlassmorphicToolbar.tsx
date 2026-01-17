import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Save, 
  Maximize2, 
  Minimize2, 
  Settings,
  Cloud,
  CloudOff,
  Loader2,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, isToday } from "date-fns";
import { AnimatedMoodPicker } from "./AnimatedMoodPicker";
import { StreakDisplay } from "./StreakDisplay";
import { WritingStats } from "./WritingStats";

interface GlassmorphicToolbarProps {
  selectedDate: Date;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  selectedMood: string | null;
  onMoodSelect: (moodId: string) => void;
  streak: number;
  wordCount: number;
  saveStatus: "saved" | "saving" | "unsaved";
  onManualSave: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenSettings: () => void;
}

export function GlassmorphicToolbar({
  selectedDate,
  onPreviousDay,
  onNextDay,
  onToday,
  selectedMood,
  onMoodSelect,
  streak,
  wordCount,
  saveStatus,
  onManualSave,
  isFullscreen,
  onToggleFullscreen,
  onOpenSettings,
}: GlassmorphicToolbarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "sticky top-0 z-40 backdrop-blur-xl border-b",
        "bg-white/70 dark:bg-background/70",
        "border-border/30"
      )}
    >
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left - Date Navigation */}
        <div className="flex items-center gap-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 rounded-xl bg-white/50 hover:bg-white/80 border border-border/20 shadow-sm"
              onClick={onPreviousDay}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </motion.div>

          <motion.button
            onClick={onToday}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl border shadow-sm transition-all",
              isToday(selectedDate)
                ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white border-violet-400"
                : "bg-white/80 hover:bg-white border-border/20"
            )}
          >
            <Calendar className={cn("h-4 w-4", isToday(selectedDate) ? "text-white" : "text-violet-500")} />
            <span className={cn(
              "text-sm font-semibold",
              isToday(selectedDate) ? "text-white" : "text-foreground"
            )}>
              {isToday(selectedDate) ? "Today" : format(selectedDate, "EEE, MMM d")}
            </span>
            {isToday(selectedDate) && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="h-3 w-3 text-white/80" />
              </motion.div>
            )}
          </motion.button>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 rounded-xl bg-white/50 hover:bg-white/80 border border-border/20 shadow-sm"
              onClick={onNextDay}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>

        {/* Center - Stats and Mood (hidden on small screens) */}
        <div className="hidden md:flex items-center gap-3">
          <StreakDisplay streak={streak} compact />
          <WritingStats wordCount={wordCount} streak={streak} totalEntries={0} compact />
          
          {/* Mood Picker */}
          <div className="h-8 w-px bg-border/30" />
          <AnimatedMoodPicker 
            selectedMood={selectedMood} 
            onMoodSelect={onMoodSelect}
            compact
          />
        </div>

        {/* Right - Controls */}
        <div className="flex items-center gap-2">
          {/* Save Status */}
          <motion.div
            initial={false}
            animate={{
              scale: saveStatus === "saving" ? [1, 1.05, 1] : 1,
            }}
            transition={{ duration: 0.5, repeat: saveStatus === "saving" ? Infinity : 0 }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border shadow-sm transition-all",
              saveStatus === "saved" && "bg-emerald-50 text-emerald-600 border-emerald-200",
              saveStatus === "saving" && "bg-amber-50 text-amber-600 border-amber-200",
              saveStatus === "unsaved" && "bg-muted text-muted-foreground border-border/20"
            )}
          >
            {saveStatus === "saved" && <Cloud className="h-3.5 w-3.5" />}
            {saveStatus === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saveStatus === "unsaved" && <CloudOff className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">
              {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : "Unsaved"}
            </span>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl bg-white/50 hover:bg-white/80 border border-border/20 shadow-sm"
              onClick={onToggleFullscreen}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </motion.div>

          {!isFullscreen && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-xl bg-white/50 hover:bg-white/80 border border-border/20 shadow-sm"
                onClick={onOpenSettings}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="sm"
              onClick={onManualSave}
              disabled={saveStatus === "saved" || saveStatus === "saving"}
              className="h-9 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white text-xs px-4 shadow-lg shadow-violet-500/25 border-0"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Mobile mood picker - shown below toolbar on small screens */}
      <div className="md:hidden px-4 pb-3 flex items-center justify-between gap-2">
        <AnimatedMoodPicker 
          selectedMood={selectedMood} 
          onMoodSelect={onMoodSelect}
          compact
        />
        <div className="flex items-center gap-2">
          <StreakDisplay streak={streak} compact />
          <WritingStats wordCount={wordCount} streak={streak} totalEntries={0} compact />
        </div>
      </div>
    </motion.div>
  );
}
