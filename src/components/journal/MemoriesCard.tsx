import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChevronRight, Sparkles, Calendar, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subYears, subMonths, subWeeks } from "date-fns";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Memory {
  id: string;
  date: string;
  preview: string;
  mood?: string;
  timeAgo: string;
}

interface MemoriesCardProps {
  onViewEntry?: (date: Date) => void;
}

export function MemoriesCard({ onViewEntry }: MemoriesCardProps) {
  const { user } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadMemories = async () => {
      const today = new Date();
      const checkDates = [
        { date: subYears(today, 1), label: "1 year ago" },
        { date: subMonths(today, 6), label: "6 months ago" },
        { date: subMonths(today, 3), label: "3 months ago" },
        { date: subMonths(today, 1), label: "1 month ago" },
        { date: subWeeks(today, 1), label: "1 week ago" },
      ];

      const foundMemories: Memory[] = [];

      for (const { date, label } of checkDates) {
        const dateStr = format(date, "yyyy-MM-dd");
        const { data } = await supabase
          .from("journal_entries")
          .select("id, entry_date, text_formatting, daily_feeling")
          .eq("user_id", user.id)
          .eq("entry_date", dateStr)
          .maybeSingle();

        if (data) {
          let preview = "";
          try {
            const parsed = typeof data.text_formatting === "string" 
              ? JSON.parse(data.text_formatting) 
              : data.text_formatting;
            
            const extractText = (node: any): string => 
              node?.text || node?.content?.map(extractText).join(" ") || "";
            
            preview = parsed?.content?.map(extractText).join(" ").slice(0, 100) || "";
          } catch {
            preview = "";
          }

          foundMemories.push({
            id: data.id,
            date: data.entry_date,
            preview: preview || "A moment from your past...",
            mood: data.daily_feeling,
            timeAgo: label
          });
        }
      }

      setMemories(foundMemories);
      setIsLoading(false);
    };

    loadMemories();
  }, [user]);

  // Auto-rotate memories
  useEffect(() => {
    if (memories.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % memories.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [memories.length]);

  if (isLoading) {
    return (
      <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-blue-50/80 backdrop-blur-sm border border-indigo-100/50 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 w-6 bg-indigo-200 rounded-lg" />
          <div className="h-4 w-24 bg-indigo-100 rounded" />
        </div>
        <div className="h-16 bg-indigo-50 rounded-xl" />
      </div>
    );
  }

  if (memories.length === 0) {
    return (
      <motion.div
        className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-blue-50/80 backdrop-blur-sm border border-indigo-100/50"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500">
            <Clock className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-sm text-foreground">Memories</span>
        </div>
        
        <div className="text-center py-4">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <BookOpen className="h-8 w-8 mx-auto text-indigo-300 mb-2" />
          </motion.div>
          <p className="text-sm text-muted-foreground">
            Keep journaling to unlock your memories ✨
          </p>
        </div>
      </motion.div>
    );
  }

  const currentMemory = memories[currentIndex];

  return (
    <motion.div
      className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-blue-50/80 backdrop-blur-sm border border-indigo-100/50 overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <motion.div
            className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Clock className="h-4 w-4 text-white" />
          </motion.div>
          <span className="font-semibold text-sm text-foreground">Time Capsule</span>
        </div>
        
        {/* Dot indicators */}
        <div className="flex items-center gap-1">
          {memories.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all",
                i === currentIndex ? "bg-indigo-500 w-3" : "bg-indigo-200"
              )}
            />
          ))}
        </div>
      </div>

      {/* Memory content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMemory.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          <motion.button
            onClick={() => onViewEntry?.(new Date(currentMemory.date))}
            className="w-full text-left p-3 rounded-xl bg-white/60 hover:bg-white/80 border border-indigo-100 transition-all group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Time badge */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-indigo-500" />
                <span className="text-xs font-medium text-indigo-600">
                  {currentMemory.timeAgo}
                </span>
              </div>
              {currentMemory.mood && (
                <span className="text-sm">
                  {currentMemory.mood === "great" && "😍"}
                  {currentMemory.mood === "good" && "😊"}
                  {currentMemory.mood === "okay" && "😐"}
                  {currentMemory.mood === "low" && "😔"}
                </span>
              )}
            </div>

            {/* Preview text */}
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              "{currentMemory.preview}..."
            </p>

            {/* View prompt */}
            <div className="flex items-center justify-end gap-1 text-xs text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
              <span>View memory</span>
              <ChevronRight className="h-3 w-3" />
            </div>

            {/* Decorative sparkle */}
            <motion.div
              className="absolute -top-1 -right-1"
              animate={{ rotate: [0, 180], scale: [1, 1.2, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles className="h-4 w-4 text-indigo-300" />
            </motion.div>
          </motion.button>
        </motion.div>
      </AnimatePresence>

      {/* Footer message */}
      <motion.p
        className="mt-2 text-[10px] text-center text-muted-foreground"
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        ✨ Memories from your journal journey
      </motion.p>
    </motion.div>
  );
}
