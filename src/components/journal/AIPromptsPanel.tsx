import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, Lightbulb, Heart, TrendingUp, Brain, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Prompt {
  text: string;
  category: "reflection" | "gratitude" | "growth" | "mindfulness";
}

const CATEGORY_CONFIG = {
  reflection: { icon: Brain, color: "from-violet-500 to-purple-500", bg: "bg-violet-50", text: "text-violet-600" },
  gratitude: { icon: Heart, color: "from-rose-500 to-pink-500", bg: "bg-rose-50", text: "text-rose-600" },
  growth: { icon: TrendingUp, color: "from-emerald-500 to-green-500", bg: "bg-emerald-50", text: "text-emerald-600" },
  mindfulness: { icon: Lightbulb, color: "from-amber-500 to-orange-500", bg: "bg-amber-50", text: "text-amber-600" },
};

const FALLBACK_PROMPTS: Prompt[] = [
  { text: "What moment made you feel most alive today?", category: "reflection" },
  { text: "What are three things you're grateful for right now?", category: "gratitude" },
  { text: "What's one small step you can take toward a goal tomorrow?", category: "growth" },
  { text: "How is your body feeling right now? Take a moment to check in.", category: "mindfulness" },
];

interface AIPromptsPanelProps {
  mood: string | null;
  recentEntryPreview?: string;
  streak: number;
  onInsertPrompt: (prompt: string) => void;
}

export function AIPromptsPanel({ mood, recentEntryPreview, streak, onInsertPrompt }: AIPromptsPanelProps) {
  const [prompts, setPrompts] = useState<Prompt[]>(FALLBACK_PROMPTS);
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const { toast } = useToast();

  // Generate prompts on mount or when mood changes
  useEffect(() => {
    if (!hasGenerated) {
      generatePrompts();
    }
  }, []);

  // Regenerate when mood changes
  useEffect(() => {
    if (hasGenerated && mood) {
      generatePrompts();
    }
  }, [mood]);

  const generatePrompts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-journal-prompts", {
        body: { mood, recentEntryPreview, streak },
      });

      if (error) {
        console.error("Error generating prompts:", error);
        // Use fallback prompts on error
        setPrompts(FALLBACK_PROMPTS);
        if (error.message?.includes("429")) {
          toast({
            title: "Taking a breather",
            description: "AI prompts will refresh shortly. Using curated prompts for now.",
          });
        }
      } else if (data?.prompts) {
        setPrompts(data.prompts);
      }
      setHasGenerated(true);
    } catch (err) {
      console.error("Failed to generate prompts:", err);
      setPrompts(FALLBACK_PROMPTS);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt.text);
    onInsertPrompt(prompt.text);
    
    // Visual feedback
    setTimeout(() => setSelectedPrompt(null), 1500);
  };

  return (
    <motion.div
      className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-violet-50/80 to-purple-50/80 backdrop-blur-sm border border-indigo-100/50"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <motion.div
            className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-500"
            animate={{ 
              rotate: isLoading ? 360 : 0,
              scale: isLoading ? [1, 1.1, 1] : 1 
            }}
            transition={{ 
              rotate: { duration: 2, repeat: isLoading ? Infinity : 0, ease: "linear" },
              scale: { duration: 0.5, repeat: isLoading ? Infinity : 0 }
            }}
          >
            <Sparkles className="h-4 w-4 text-white" />
          </motion.div>
          <span className="font-semibold text-sm text-foreground">AI Prompts</span>
          {mood && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-600">
              {mood === "great" && "😍 vibing"}
              {mood === "good" && "😊 good"}
              {mood === "okay" && "😐 neutral"}
              {mood === "low" && "😔 gentle"}
            </span>
          )}
        </div>
        
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg bg-white/60 hover:bg-white/80"
            onClick={generatePrompts}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 text-violet-500" />
            )}
          </Button>
        </motion.div>
      </div>

      {/* Prompts list */}
      <div className="space-y-2">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl bg-white/40 animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="prompts"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {prompts.map((prompt, index) => {
                const config = CATEGORY_CONFIG[prompt.category] || CATEGORY_CONFIG.reflection;
                const Icon = config.icon;
                const isSelected = selectedPrompt === prompt.text;

                return (
                  <motion.button
                    key={prompt.text}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleSelectPrompt(prompt)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl transition-all group relative overflow-hidden",
                      isSelected 
                        ? `bg-gradient-to-r ${config.color} text-white shadow-lg` 
                        : "bg-white/60 hover:bg-white/80 border border-transparent hover:border-violet-100"
                    )}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start gap-2">
                      <motion.div
                        className={cn(
                          "p-1 rounded-lg flex-shrink-0",
                          isSelected ? "bg-white/20" : config.bg
                        )}
                        animate={isSelected ? { rotate: [0, 360] } : {}}
                        transition={{ duration: 0.5 }}
                      >
                        <Icon className={cn("h-3.5 w-3.5", isSelected ? "text-white" : config.text)} />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm leading-snug",
                          isSelected ? "text-white" : "text-foreground"
                        )}>
                          {prompt.text}
                        </p>
                        <p className={cn(
                          "text-[10px] mt-1 capitalize",
                          isSelected ? "text-white/70" : "text-muted-foreground"
                        )}>
                          {prompt.category}
                        </p>
                      </div>
                    </div>

                    {/* Selection sparkle effect */}
                    {isSelected && (
                      <motion.div
                        className="absolute inset-0 pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 1 }}
                      >
                        <Sparkles className="absolute top-1 right-1 h-4 w-4 text-white/80" />
                        <Sparkles className="absolute bottom-1 left-1 h-3 w-3 text-white/60" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer tip */}
      <motion.p
        className="mt-3 text-[10px] text-center text-muted-foreground"
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        ✨ Tap a prompt to add it to your entry
      </motion.p>
    </motion.div>
  );
}
