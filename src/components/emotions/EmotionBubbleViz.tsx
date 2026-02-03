import { useState, useMemo, useCallback, useRef } from "react";
import { Check, Sparkles } from "lucide-react";
import { QuadrantType } from "./types";
import { cn } from "@/lib/utils";

interface EmotionBubbleVizProps {
  energy: number;
  pleasantness: number;
  selectedEmotion: string | null;
  onEmotionSelect: (emotion: string, quadrant: QuadrantType) => void;
  onBubbleClick: (quadrant: QuadrantType, targetEnergy: number, targetPleasantness: number) => void;
}

// Define emotion categories with positions in the 2D space
const EMOTION_CATEGORIES = [
  {
    id: "joy",
    label: "Joy",
    quadrant: "high-pleasant" as QuadrantType,
    targetEnergy: 75,
    targetPleasantness: 80,
    color: "#F59E0B",
    emotions: ["Excited", "Joyful", "Inspired", "Thrilled", "Elated", "Cheerful"],
    emoji: "✨",
  },
  {
    id: "peace",
    label: "Peace",
    quadrant: "low-pleasant" as QuadrantType,
    targetEnergy: 25,
    targetPleasantness: 80,
    color: "#10B981",
    emotions: ["Calm", "Content", "Relaxed", "Peaceful", "Serene", "Balanced"],
    emoji: "🍃",
  },
  {
    id: "tension",
    label: "Tension",
    quadrant: "high-unpleasant" as QuadrantType,
    targetEnergy: 80,
    targetPleasantness: 25,
    color: "#EF4444",
    emotions: ["Anxious", "Angry", "Frustrated", "Stressed", "Overwhelmed", "Irritated"],
    emoji: "⚡",
  },
  {
    id: "sadness",
    label: "Sadness",
    quadrant: "low-unpleasant" as QuadrantType,
    targetEnergy: 20,
    targetPleasantness: 25,
    color: "#6366F1",
    emotions: ["Sad", "Tired", "Lonely", "Drained", "Hopeless", "Empty"],
    emoji: "💧",
  },
  {
    id: "energy",
    label: "Energy",
    quadrant: "high-pleasant" as QuadrantType,
    targetEnergy: 90,
    targetPleasantness: 65,
    color: "#F97316",
    emotions: ["Energetic", "Enthusiastic", "Motivated", "Alive", "Vibrant", "Passionate"],
    emoji: "🔥",
  },
  {
    id: "fear",
    label: "Fear",
    quadrant: "high-unpleasant" as QuadrantType,
    targetEnergy: 70,
    targetPleasantness: 15,
    color: "#8B5CF6",
    emotions: ["Fearful", "Nervous", "Panicked", "Apprehensive", "Alarmed", "Restless"],
    emoji: "😰",
  },
];

export function EmotionBubbleViz({
  energy,
  pleasantness,
  selectedEmotion,
  onEmotionSelect,
  onBubbleClick,
}: EmotionBubbleVizProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const animationRef = useRef<number>(0);

  // Calculate proximity and find closest bubble
  const { bubbleStates, closestBubble } = useMemo(() => {
    const states = EMOTION_CATEGORIES.map((category) => {
      const distance = Math.sqrt(
        Math.pow(energy - category.targetEnergy, 2) +
        Math.pow(pleasantness - category.targetPleasantness, 2)
      );
      const maxDist = 70;
      const proximity = Math.max(0, 1 - distance / maxDist);
      
      return {
        ...category,
        distance,
        proximity,
      };
    });
    
    const closest = states.reduce((a, b) => (a.distance < b.distance ? a : b));
    return { bubbleStates: states, closestBubble: closest };
  }, [energy, pleasantness]);

  // Auto-expand closest category when slider moves (only if no category is manually selected)
  const effectiveActiveCategory = activeCategory || (closestBubble.proximity > 0.2 ? closestBubble.id : null);
  const activeData = effectiveActiveCategory 
    ? EMOTION_CATEGORIES.find(c => c.id === effectiveActiveCategory) 
    : null;

  const handleCategoryClick = useCallback((category: typeof EMOTION_CATEGORIES[0]) => {
    setActiveCategory(category.id);
    onBubbleClick(category.quadrant, category.targetEnergy, category.targetPleasantness);
  }, [onBubbleClick]);

  const handleEmotionClick = useCallback((emotion: string, category: typeof EMOTION_CATEGORIES[0]) => {
    onEmotionSelect(emotion, category.quadrant);
  }, [onEmotionSelect]);

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Bubbles Row */}
      <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap px-2">
        {bubbleStates.map((bubble) => {
          const isActive = effectiveActiveCategory === bubble.id;
          const isClosest = bubble.id === closestBubble.id;
          const baseSize = 56;
          const dynamicSize = baseSize + (bubble.proximity * 24);
          const activeSize = 80;
          
          return (
            <button
              key={bubble.id}
              onClick={() => handleCategoryClick(bubble)}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-full cursor-pointer",
                "transition-all duration-300 ease-out",
                "focus:outline-none border-2",
              )}
              style={{
                width: isActive ? activeSize : dynamicSize,
                height: isActive ? activeSize : dynamicSize,
                background: `linear-gradient(145deg, ${bubble.color}25, ${bubble.color}45)`,
                borderColor: isActive ? bubble.color : isClosest ? `${bubble.color}90` : `${bubble.color}40`,
                boxShadow: isActive 
                  ? `0 0 0 3px ${bubble.color}25, 0 8px 24px ${bubble.color}35`
                  : isClosest
                    ? `0 6px 20px ${bubble.color}30`
                    : `0 4px 12px ${bubble.color}15`,
                opacity: 0.65 + (bubble.proximity * 0.35),
                transform: isActive ? 'scale(1.05)' : undefined,
                zIndex: isActive ? 20 : isClosest ? 15 : 10,
              }}
            >
              <span className={cn("transition-all duration-200", isActive ? "text-xl" : "text-lg")}>
                {bubble.emoji}
              </span>
              <span 
                className={cn(
                  "font-semibold transition-all duration-200",
                  isActive ? "text-[11px]" : "text-[9px]"
                )}
                style={{ color: bubble.color }}
              >
                {bubble.label}
              </span>
              
              {/* Pulse for active/closest */}
              {(isActive || isClosest) && (
                <div 
                  className="absolute inset-0 rounded-full pointer-events-none animate-pulse"
                  style={{ 
                    boxShadow: `0 0 0 2px ${bubble.color}30`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Emotion Pills */}
      <div className="flex-1 min-h-0">
        {activeData ? (
          <div className="h-full animate-in fade-in duration-300" key={activeData.id}>
            {/* Mini header */}
            <div className="text-center mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/60 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                How do you feel within
                <span className="font-semibold" style={{ color: activeData.color }}>{activeData.label}</span>?
              </span>
            </div>

            {/* Pills Grid */}
            <div 
              className="rounded-xl p-3 border-2 transition-colors duration-300"
              style={{ 
                background: `linear-gradient(135deg, ${activeData.color}08, ${activeData.color}15)`,
                borderColor: `${activeData.color}30`
              }}
            >
              <div className="flex flex-wrap justify-center gap-2">
                {activeData.emotions.map((emotion, index) => {
                  const isSelected = selectedEmotion === emotion;
                  
                  return (
                    <button
                      key={emotion}
                      onClick={() => handleEmotionClick(emotion, activeData)}
                      className={cn(
                        "px-3.5 py-2 rounded-lg text-sm font-medium",
                        "transition-all duration-200 ease-out",
                        "border-2 hover:scale-105 active:scale-95"
                      )}
                      style={{
                        background: isSelected 
                          ? `linear-gradient(135deg, ${activeData.color}, ${activeData.color}DD)` 
                          : 'hsl(var(--background))',
                        borderColor: activeData.color,
                        color: isSelected ? "white" : activeData.color,
                        boxShadow: isSelected 
                          ? `0 4px 16px ${activeData.color}40`
                          : `0 2px 6px ${activeData.color}10`,
                        animationDelay: `${index * 30}ms`,
                      }}
                    >
                      <span className="flex items-center gap-1.5">
                        {emotion}
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center px-4">
              <Sparkles className="h-6 w-6 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Move sliders or tap a bubble</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
