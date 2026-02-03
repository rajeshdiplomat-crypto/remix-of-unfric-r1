import { useState, useEffect, useMemo, useCallback } from "react";
import { Check, Sparkles } from "lucide-react";
import { QuadrantType } from "./types";
import { cn } from "@/lib/utils";

interface EmotionBubbleVizProps {
  energy: number;
  pleasantness: number;
  selectedEmotion: string | null;
  onEmotionSelect: (emotion: string, quadrant: QuadrantType) => void;
  onBubbleClick: (quadrant: QuadrantType) => void;
}

// Define emotion categories with orbital positions
const EMOTION_CATEGORIES = [
  {
    id: "joy",
    label: "Joy",
    quadrant: "high-pleasant" as QuadrantType,
    targetEnergy: 75,
    targetPleasantness: 80,
    color: "#F59E0B",
    gradient: "from-amber-400 to-orange-500",
    lightGradient: "from-amber-100 to-orange-100",
    emotions: ["Excited", "Joyful", "Inspired", "Thrilled", "Elated", "Ecstatic", "Cheerful", "Blissful"],
    emoji: "✨",
  },
  {
    id: "peace",
    label: "Peace",
    quadrant: "low-pleasant" as QuadrantType,
    targetEnergy: 25,
    targetPleasantness: 80,
    color: "#10B981",
    gradient: "from-emerald-400 to-teal-500",
    lightGradient: "from-emerald-100 to-teal-100",
    emotions: ["Calm", "Content", "Relaxed", "Peaceful", "Serene", "Tranquil", "Centered", "Balanced"],
    emoji: "🍃",
  },
  {
    id: "tension",
    label: "Tension",
    quadrant: "high-unpleasant" as QuadrantType,
    targetEnergy: 80,
    targetPleasantness: 30,
    color: "#EF4444",
    gradient: "from-rose-400 to-red-500",
    lightGradient: "from-rose-100 to-red-100",
    emotions: ["Anxious", "Angry", "Frustrated", "Stressed", "Overwhelmed", "Irritated", "Tense", "Worried"],
    emoji: "⚡",
  },
  {
    id: "sadness",
    label: "Sadness",
    quadrant: "low-unpleasant" as QuadrantType,
    targetEnergy: 20,
    targetPleasantness: 25,
    color: "#6366F1",
    gradient: "from-indigo-400 to-violet-500",
    lightGradient: "from-indigo-100 to-violet-100",
    emotions: ["Sad", "Tired", "Lonely", "Drained", "Hopeless", "Discouraged", "Empty", "Melancholy"],
    emoji: "💧",
  },
  {
    id: "energy",
    label: "Energy",
    quadrant: "high-pleasant" as QuadrantType,
    targetEnergy: 90,
    targetPleasantness: 65,
    color: "#F97316",
    gradient: "from-orange-400 to-amber-500",
    lightGradient: "from-orange-100 to-amber-100",
    emotions: ["Energetic", "Enthusiastic", "Motivated", "Alive", "Vibrant", "Exhilarated", "Empowered", "Passionate"],
    emoji: "🔥",
  },
  {
    id: "fear",
    label: "Fear",
    quadrant: "high-unpleasant" as QuadrantType,
    targetEnergy: 70,
    targetPleasantness: 15,
    color: "#8B5CF6",
    gradient: "from-violet-400 to-purple-500",
    lightGradient: "from-violet-100 to-purple-100",
    emotions: ["Fearful", "Nervous", "Panicked", "Apprehensive", "Alarmed", "Shocked", "Defensive", "Restless"],
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
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Calculate proximity for each bubble based on sliders
  const bubbleStates = useMemo(() => {
    return EMOTION_CATEGORIES.map((category) => {
      const distance = Math.sqrt(
        Math.pow(energy - category.targetEnergy, 2) +
        Math.pow(pleasantness - category.targetPleasantness, 2)
      );
      const maxDist = 80;
      const proximity = Math.max(0, 1 - distance / maxDist);
      
      return {
        ...category,
        distance,
        proximity,
        scale: 0.75 + proximity * 0.45, // 0.75 to 1.2
        glow: proximity * 25,
        opacity: 0.5 + proximity * 0.5,
        isClosest: distance < 30,
      };
    });
  }, [energy, pleasantness]);

  // Find closest bubble
  const closestBubble = useMemo(() => {
    return bubbleStates.reduce((a, b) => (a.distance < b.distance ? a : b));
  }, [bubbleStates]);

  // Auto-select closest category when sliders move
  useEffect(() => {
    if (!selectedEmotion && !activeCategory) {
      if (closestBubble.proximity > 0.3) {
        setActiveCategory(closestBubble.id);
      }
    }
  }, [closestBubble, selectedEmotion, activeCategory]);

  const handleCategoryClick = useCallback((category: typeof EMOTION_CATEGORIES[0]) => {
    setActiveCategory(category.id);
    onBubbleClick(category.quadrant);
  }, [onBubbleClick]);

  const handleEmotionClick = useCallback((emotion: string, category: typeof EMOTION_CATEGORIES[0]) => {
    onEmotionSelect(emotion, category.quadrant);
  }, [onEmotionSelect]);

  const activeData = activeCategory 
    ? EMOTION_CATEGORIES.find(c => c.id === activeCategory) 
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Floating Category Bubbles */}
      <div className="relative flex items-center justify-center py-4">
        {/* Background glow effect */}
        <div 
          className="absolute inset-0 pointer-events-none transition-all duration-700"
          style={{
            background: activeData 
              ? `radial-gradient(circle at 50% 50%, ${activeData.color}15 0%, transparent 70%)`
              : 'transparent'
          }}
        />
        
        {/* Bubble Container with orbital effect */}
        <div className="relative flex flex-wrap justify-center gap-3 md:gap-4 px-4">
          {bubbleStates.map((bubble, index) => {
            const isActive = activeCategory === bubble.id;
            const isHovered = hoveredCategory === bubble.id;
            const isClosest = bubble.id === closestBubble.id && bubble.proximity > 0.25;
            
            // Floating animation offset
            const floatOffset = Math.sin((Date.now() / 2000 + index * 0.5)) * 4;
            
            return (
              <div
                key={bubble.id}
                className="relative"
                style={{
                  transform: `translateY(${isActive ? 0 : floatOffset}px)`,
                  transition: 'transform 0.5s ease-out'
                }}
              >
                <button
                  onClick={() => handleCategoryClick(bubble)}
                  onMouseEnter={() => setHoveredCategory(bubble.id)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-full cursor-pointer",
                    "transition-all duration-500 ease-out transform",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                    "backdrop-blur-sm border-2"
                  )}
                  style={{
                    width: isActive ? '90px' : `${60 + bubble.proximity * 20}px`,
                    height: isActive ? '90px' : `${60 + bubble.proximity * 20}px`,
                    background: `linear-gradient(135deg, ${bubble.color}20, ${bubble.color}40)`,
                    borderColor: isActive ? bubble.color : isClosest ? `${bubble.color}80` : `${bubble.color}30`,
                    boxShadow: isActive 
                      ? `0 0 0 4px ${bubble.color}20, 0 8px 32px ${bubble.color}40, inset 0 1px 0 ${bubble.color}30`
                      : isHovered || isClosest
                        ? `0 8px 24px ${bubble.color}30, inset 0 1px 0 ${bubble.color}20`
                        : `0 4px 12px ${bubble.color}15`,
                    transform: `scale(${isHovered ? 1.1 : 1})`,
                    opacity: 0.6 + bubble.proximity * 0.4,
                    zIndex: isActive ? 30 : isClosest ? 20 : 10,
                  }}
                >
                  {/* Emoji */}
                  <span className={cn(
                    "transition-all duration-300",
                    isActive ? "text-2xl" : "text-xl"
                  )}>
                    {bubble.emoji}
                  </span>
                  
                  {/* Label */}
                  <span 
                    className={cn(
                      "font-medium transition-all duration-300",
                      isActive ? "text-xs mt-0.5" : "text-[10px] mt-0.5"
                    )}
                    style={{ color: bubble.color }}
                  >
                    {bubble.label}
                  </span>
                  
                  {/* Pulse ring for closest/active */}
                  {(isActive || isClosest) && (
                    <div 
                      className="absolute inset-0 rounded-full animate-ping pointer-events-none"
                      style={{ 
                        backgroundColor: `${bubble.color}20`,
                        animationDuration: '2s'
                      }}
                    />
                  )}
                  
                  {/* Inner glow for active */}
                  {isActive && (
                    <div 
                      className="absolute inset-1 rounded-full pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at 30% 30%, ${bubble.color}30, transparent 60%)`
                      }}
                    />
                  )}
                </button>
                
                {/* Connecting line indicator */}
                {isClosest && !isActive && (
                  <div 
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ backgroundColor: bubble.color }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Emotion Pills - Expanded view for selected category */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        {activeData ? (
          <div 
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            key={activeData.id}
          >
            {/* Category Header */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted/50 border border-border/50">
                <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Select how you feel within
                </span>
                <span 
                  className="font-semibold text-xs"
                  style={{ color: activeData.color }}
                >
                  {activeData.label}
                </span>
              </div>
            </div>

            {/* Emotion Pills Grid */}
            <div 
              className="rounded-2xl p-4 md:p-5 border-2 transition-all duration-500 backdrop-blur-sm"
              style={{ 
                background: `linear-gradient(135deg, ${activeData.color}05, ${activeData.color}10)`,
                borderColor: `${activeData.color}25`
              }}
            >
              <div className="flex flex-wrap justify-center gap-2.5">
                {activeData.emotions.map((emotion, index) => {
                  const isSelected = selectedEmotion === emotion;
                  
                  return (
                    <button
                      key={emotion}
                      onClick={() => handleEmotionClick(emotion, activeData)}
                      className={cn(
                        "px-4 py-2.5 rounded-xl text-sm font-medium",
                        "transition-all duration-300 ease-out transform",
                        "border-2 hover:scale-105 active:scale-95",
                        "backdrop-blur-sm relative overflow-hidden"
                      )}
                      style={{
                        background: isSelected 
                          ? `linear-gradient(135deg, ${activeData.color}, ${activeData.color}CC)` 
                          : 'hsl(var(--background) / 0.9)',
                        borderColor: activeData.color,
                        color: isSelected ? "white" : activeData.color,
                        boxShadow: isSelected 
                          ? `0 4px 20px ${activeData.color}40, inset 0 1px 0 rgba(255,255,255,0.2)`
                          : `0 2px 8px ${activeData.color}10`,
                        animationDelay: `${index * 40}ms`,
                        animationFillMode: 'backwards',
                        transform: isSelected ? 'scale(1.05)' : undefined,
                      }}
                    >
                      <span className="flex items-center gap-2 relative z-10">
                        {emotion}
                        {isSelected && (
                          <Check className="h-4 w-4 animate-in zoom-in duration-200" />
                        )}
                      </span>
                      
                      {/* Shimmer effect on selected */}
                      {isSelected && (
                        <div 
                          className="absolute inset-0 opacity-30"
                          style={{
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                            animation: 'shimmer 2s infinite'
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-6">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Move the sliders or tap a bubble
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                to explore emotions
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
