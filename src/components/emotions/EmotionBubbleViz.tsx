import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { QuadrantType } from "./types";
import { cn } from "@/lib/utils";

interface EmotionBubbleVizProps {
  energy: number;
  pleasantness: number;
  selectedEmotion: string | null;
  onEmotionSelect: (emotion: string, quadrant: QuadrantType) => void;
  onBubbleClick: (quadrant: QuadrantType) => void;
}

// Define emotion categories with their bubble positions and colors
const EMOTION_CATEGORIES = [
  {
    id: "joy",
    label: "Joy",
    quadrant: "high-pleasant" as QuadrantType,
    color: "#F59E0B",
    lightColor: "#FEF3C7",
    emotions: ["Excited", "Joyful", "Inspired", "Thrilled", "Elated", "Ecstatic", "Cheerful", "Blissful"],
  },
  {
    id: "peace",
    label: "Peace",
    quadrant: "low-pleasant" as QuadrantType,
    color: "#10B981",
    lightColor: "#D1FAE5",
    emotions: ["Calm", "Content", "Relaxed", "Peaceful", "Serene", "Tranquil", "Centered", "Balanced"],
  },
  {
    id: "tension",
    label: "Tension",
    quadrant: "high-unpleasant" as QuadrantType,
    color: "#EF4444",
    lightColor: "#FEE2E2",
    emotions: ["Anxious", "Angry", "Frustrated", "Stressed", "Overwhelmed", "Irritated", "Tense", "Worried"],
  },
  {
    id: "sadness",
    label: "Sadness",
    quadrant: "low-unpleasant" as QuadrantType,
    color: "#6366F1",
    lightColor: "#E0E7FF",
    emotions: ["Sad", "Tired", "Lonely", "Drained", "Hopeless", "Discouraged", "Empty", "Melancholy"],
  },
  {
    id: "energy",
    label: "Energy",
    quadrant: "high-pleasant" as QuadrantType,
    color: "#F97316",
    lightColor: "#FFEDD5",
    emotions: ["Energetic", "Enthusiastic", "Motivated", "Alive", "Vibrant", "Exhilarated", "Empowered", "Passionate"],
  },
  {
    id: "fear",
    label: "Fear",
    quadrant: "high-unpleasant" as QuadrantType,
    color: "#8B5CF6",
    lightColor: "#EDE9FE",
    emotions: ["Fearful", "Nervous", "Panicked", "Apprehensive", "Alarmed", "Shocked", "Defensive", "Restless"],
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

  // Auto-select category based on sliders
  useEffect(() => {
    if (selectedEmotion) return; // Don't auto-change if emotion is selected
    
    // Determine which category is closest based on slider position
    let suggestedCategory = "joy";
    if (energy >= 50 && pleasantness >= 50) {
      suggestedCategory = energy > 70 ? "energy" : "joy";
    } else if (energy >= 50 && pleasantness < 50) {
      suggestedCategory = pleasantness < 30 ? "fear" : "tension";
    } else if (energy < 50 && pleasantness < 50) {
      suggestedCategory = "sadness";
    } else {
      suggestedCategory = "peace";
    }
    
    // Only auto-update if no category is actively selected
    if (!activeCategory) {
      setActiveCategory(suggestedCategory);
    }
  }, [energy, pleasantness, selectedEmotion, activeCategory]);

  const handleCategoryClick = (category: typeof EMOTION_CATEGORIES[0]) => {
    setActiveCategory(category.id);
    onBubbleClick(category.quadrant);
  };

  const handleEmotionClick = (emotion: string, category: typeof EMOTION_CATEGORIES[0]) => {
    onEmotionSelect(emotion, category.quadrant);
  };

  const activeData = EMOTION_CATEGORIES.find(c => c.id === activeCategory);

  return (
    <div className="flex flex-col h-full">
      {/* Category Bubbles - Horizontal Row */}
      <div className="flex items-center justify-center gap-3 md:gap-4 mb-6 flex-wrap">
        {EMOTION_CATEGORIES.map((category, index) => {
          const isActive = activeCategory === category.id;
          const isHovered = hoveredCategory === category.id;
          
          return (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category)}
              onMouseEnter={() => setHoveredCategory(category.id)}
              onMouseLeave={() => setHoveredCategory(null)}
              className={cn(
                "relative flex items-center justify-center rounded-full cursor-pointer",
                "transition-all duration-500 ease-out transform",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                isActive 
                  ? "w-20 h-20 md:w-24 md:h-24 scale-110 z-20" 
                  : "w-14 h-14 md:w-16 md:h-16 hover:scale-110 z-10"
              )}
              style={{
                background: isActive 
                  ? `radial-gradient(circle at 30% 30%, ${category.lightColor}, ${category.color})`
                  : `radial-gradient(circle at 30% 30%, ${category.lightColor}80, ${category.color}60)`,
                boxShadow: isActive 
                  ? `0 8px 32px ${category.color}50, 0 0 0 4px ${category.lightColor}`
                  : isHovered
                    ? `0 8px 24px ${category.color}40`
                    : `0 4px 12px ${category.color}30`,
                animationDelay: `${index * 100}ms`,
              }}
            >
              <span 
                className={cn(
                  "font-semibold text-white drop-shadow-md transition-all duration-300",
                  isActive ? "text-sm md:text-base" : "text-xs md:text-sm"
                )}
              >
                {category.label}
              </span>
              
              {/* Active indicator ring */}
              {isActive && (
                <div 
                  className="absolute inset-0 rounded-full animate-pulse opacity-30"
                  style={{ 
                    border: `3px solid ${category.color}`,
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Emotion Pills - Show only for selected category */}
      <div className="flex-1 flex flex-col">
        {activeData && (
          <div 
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            key={activeData.id}
          >
            {/* Category Header */}
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                Choose how you feel within{" "}
                <span className="font-semibold" style={{ color: activeData.color }}>
                  {activeData.label}
                </span>
              </p>
            </div>

            {/* Emotion Pills Grid */}
            <div 
              className="rounded-2xl p-4 md:p-6 border-2 transition-all duration-500"
              style={{ 
                backgroundColor: `${activeData.lightColor}40`,
                borderColor: `${activeData.color}30`
              }}
            >
              <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                {activeData.emotions.map((emotion, index) => {
                  const isSelected = selectedEmotion === emotion;
                  
                  return (
                    <button
                      key={emotion}
                      onClick={() => handleEmotionClick(emotion, activeData)}
                      className={cn(
                        "px-4 py-2 md:px-5 md:py-2.5 rounded-full text-sm md:text-base font-medium",
                        "transition-all duration-300 ease-out transform",
                        "border-2 hover:scale-105 active:scale-95",
                        "animate-in fade-in zoom-in-95",
                        isSelected 
                          ? "text-white shadow-lg scale-105" 
                          : "bg-background/80 backdrop-blur-sm hover:shadow-md"
                      )}
                      style={{
                        backgroundColor: isSelected ? activeData.color : undefined,
                        borderColor: activeData.color,
                        color: isSelected ? "white" : activeData.color,
                        animationDelay: `${index * 50}ms`,
                        animationFillMode: 'backwards'
                      }}
                    >
                      <span className="flex items-center gap-1.5">
                        {emotion}
                        {isSelected && <Check className="h-4 w-4" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!activeData && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p className="text-sm">Select a category above to see emotions</p>
          </div>
        )}
      </div>
    </div>
  );
}
