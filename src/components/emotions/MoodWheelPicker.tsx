import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { QuadrantType, QUADRANTS, EMOTION_DESCRIPTIONS } from "./types";
import { cn } from "@/lib/utils";
import { Sparkles, Search, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MoodWheelPickerProps {
  onSelect: (quadrant: QuadrantType, emotion: string) => void;
  initialQuadrant?: QuadrantType;
  initialEmotion?: string;
}

const QUADRANT_CONFIG: Record<QuadrantType, { emoji: string; gradient: string; position: string }> = {
  'high-pleasant': { emoji: '😊', gradient: 'from-amber-400 to-yellow-500', position: 'top-0 right-0' },
  'high-unpleasant': { emoji: '😰', gradient: 'from-red-400 to-rose-500', position: 'top-0 left-0' },
  'low-unpleasant': { emoji: '😔', gradient: 'from-slate-400 to-gray-500', position: 'bottom-0 left-0' },
  'low-pleasant': { emoji: '😌', gradient: 'from-emerald-400 to-green-500', position: 'bottom-0 right-0' },
};

export function MoodWheelPicker({ onSelect, initialQuadrant, initialEmotion }: MoodWheelPickerProps) {
  const [selectedQuadrant, setSelectedQuadrant] = useState<QuadrantType | null>(initialQuadrant || null);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(initialEmotion || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredQuadrant, setHoveredQuadrant] = useState<QuadrantType | null>(null);

  const activeQuadrant = hoveredQuadrant || selectedQuadrant;

  // All emotions flattened for search
  const allEmotions = useMemo(() => {
    return Object.entries(QUADRANTS).flatMap(([quadrant, info]) => 
      info.emotions.map(emotion => ({ emotion, quadrant: quadrant as QuadrantType }))
    );
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return allEmotions.filter(e => e.emotion.toLowerCase().includes(query)).slice(0, 6);
  }, [searchQuery, allEmotions]);

  const handleQuadrantClick = (quadrant: QuadrantType) => {
    setSelectedQuadrant(quadrant);
    setSelectedEmotion(null);
    setSearchQuery("");
  };

  const handleEmotionClick = (emotion: string, quadrant: QuadrantType) => {
    setSelectedQuadrant(quadrant);
    setSelectedEmotion(emotion);
    setSearchQuery("");
  };

  const handleConfirm = () => {
    if (selectedQuadrant && selectedEmotion) {
      onSelect(selectedQuadrant, selectedEmotion);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      {/* Header */}
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-xl font-semibold text-foreground">How are you feeling?</h2>
        <p className="text-sm text-muted-foreground mt-1">Tap a zone or search for an emotion</p>
      </motion.div>

      {/* Search Bar */}
      <motion.div 
        className="relative"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search any emotion..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-11 rounded-xl bg-muted/50 border-border/50"
        />
        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-20 w-full mt-2 bg-card border border-border rounded-xl shadow-lg p-2 space-y-1"
            >
              {searchResults.map((item) => {
                const quadrantInfo = QUADRANTS[item.quadrant];
                return (
                  <motion.button
                    key={item.emotion}
                    onClick={() => handleEmotionClick(item.emotion, item.quadrant)}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-accent/50 flex items-center gap-3 transition-colors"
                  >
                    <span 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: quadrantInfo.color }}
                    />
                    <span className="text-sm font-medium">{item.emotion}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {quadrantInfo.label}
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Mood Wheel Grid */}
      <motion.div 
        className="grid grid-cols-2 gap-3"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        {(Object.keys(QUADRANTS) as QuadrantType[]).map((quadrant, index) => {
          const info = QUADRANTS[quadrant];
          const config = QUADRANT_CONFIG[quadrant];
          const isSelected = selectedQuadrant === quadrant;
          const isHovered = hoveredQuadrant === quadrant;
          
          return (
            <motion.button
              key={quadrant}
              onClick={() => handleQuadrantClick(quadrant)}
              onMouseEnter={() => setHoveredQuadrant(quadrant)}
              onMouseLeave={() => setHoveredQuadrant(null)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "relative p-5 rounded-2xl border-2 transition-all duration-300 overflow-hidden",
                isSelected 
                  ? "ring-2 ring-offset-2" 
                  : "hover:shadow-lg"
              )}
              style={{
                backgroundColor: info.bgColor,
                borderColor: isSelected ? info.color : info.borderColor,
                ['--tw-ring-color' as string]: info.color,
              }}
            >
              {/* Background gradient glow */}
              <motion.div
                className={cn("absolute inset-0 bg-gradient-to-br opacity-0", config.gradient)}
                animate={{ opacity: isSelected || isHovered ? 0.1 : 0 }}
              />

              <div className="relative z-10 flex flex-col items-center gap-2">
                <motion.span 
                  className="text-3xl"
                  animate={{ 
                    scale: isSelected || isHovered ? 1.2 : 1,
                    rotate: isSelected ? [0, -10, 10, 0] : 0
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {config.emoji}
                </motion.span>
                <p className="font-medium text-sm" style={{ color: info.color }}>
                  {info.label.split(',')[0]}
                </p>
                <p className="text-xs text-muted-foreground text-center">
                  {info.description}
                </p>
              </div>

              {/* Selection indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2"
                >
                  <Sparkles className="h-4 w-4" style={{ color: info.color }} />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </motion.div>

      {/* Emotion Pills - Show when quadrant is selected */}
      <AnimatePresence>
        {selectedQuadrant && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
              <p className="text-sm text-muted-foreground mb-3 text-center">
                Pick your emotion:
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-h-40 overflow-y-auto">
                {QUADRANTS[selectedQuadrant].emotions.slice(0, 15).map((emotion, index) => {
                  const isSelected = selectedEmotion === emotion;
                  const info = QUADRANTS[selectedQuadrant];
                  
                  return (
                    <motion.button
                      key={emotion}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => handleEmotionClick(emotion, selectedQuadrant)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
                        isSelected 
                          ? "text-white shadow-md" 
                          : "bg-background hover:shadow-sm"
                      )}
                      style={{
                        backgroundColor: isSelected ? info.color : undefined,
                        borderColor: info.borderColor,
                        color: isSelected ? 'white' : info.color,
                      }}
                    >
                      {emotion}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Button */}
      <AnimatePresence>
        {selectedQuadrant && selectedEmotion && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Button
              onClick={handleConfirm}
              className="w-full h-12 rounded-xl text-base font-medium bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
            >
              Continue with "{selectedEmotion}"
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Affirmation */}
      <motion.p 
        className="text-center text-xs text-muted-foreground/70 italic"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        All emotions are valid — they're signals, not judgments ✨
      </motion.p>
    </div>
  );
}
