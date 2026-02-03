import { useState, useMemo } from "react";
import { ChevronDown, Check } from "lucide-react";
import { QuadrantType, QUADRANTS, EMOTION_DESCRIPTIONS } from "./types";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface EmotionBubbleVizProps {
  energy: number;
  pleasantness: number;
  selectedEmotion: string | null;
  onEmotionSelect: (emotion: string, quadrant: QuadrantType) => void;
  onBubbleClick: (quadrant: QuadrantType) => void;
}

// Define emotion categories with their bubble positions and colors
const EMOTION_BUBBLES = [
  {
    id: "joy",
    label: "Joy",
    quadrant: "high-pleasant" as QuadrantType,
    baseX: 65,
    baseY: 25,
    color: "hsl(45, 93%, 55%)",
    bgColor: "hsl(45, 93%, 85%)",
    emotions: ["Excited", "Joyful", "Inspired", "Thrilled", "Elated", "Ecstatic", "Cheerful", "Blissful"],
  },
  {
    id: "peace",
    label: "Peace",
    quadrant: "low-pleasant" as QuadrantType,
    baseX: 75,
    baseY: 70,
    color: "hsl(142, 52%, 45%)",
    bgColor: "hsl(142, 52%, 85%)",
    emotions: ["Calm", "Content", "Relaxed", "Peaceful", "Serene", "Tranquil", "Centered", "Balanced"],
  },
  {
    id: "anger",
    label: "Tension",
    quadrant: "high-unpleasant" as QuadrantType,
    baseX: 20,
    baseY: 20,
    color: "hsl(0, 72%, 51%)",
    bgColor: "hsl(0, 72%, 85%)",
    emotions: ["Anxious", "Angry", "Frustrated", "Stressed", "Overwhelmed", "Irritated", "Tense", "Worried"],
  },
  {
    id: "sadness",
    label: "Sadness",
    quadrant: "low-unpleasant" as QuadrantType,
    baseX: 30,
    baseY: 75,
    color: "hsl(215, 40%, 50%)",
    bgColor: "hsl(215, 40%, 85%)",
    emotions: ["Sad", "Tired", "Lonely", "Drained", "Hopeless", "Discouraged", "Empty", "Melancholy"],
  },
  {
    id: "energy",
    label: "Energy",
    quadrant: "high-pleasant" as QuadrantType,
    baseX: 50,
    baseY: 15,
    color: "hsl(30, 90%, 55%)",
    bgColor: "hsl(30, 90%, 85%)",
    emotions: ["Energetic", "Enthusiastic", "Motivated", "Alive", "Vibrant", "Exhilarated", "Empowered", "Passionate"],
  },
  {
    id: "fear",
    label: "Fear",
    quadrant: "high-unpleasant" as QuadrantType,
    baseX: 15,
    baseY: 50,
    color: "hsl(280, 50%, 50%)",
    bgColor: "hsl(280, 50%, 85%)",
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
  const [expandedBubbles, setExpandedBubbles] = useState<string[]>([]);

  // Calculate which bubble is most active based on sliders
  const activeBubble = useMemo(() => {
    // Map sliders to bubble proximity
    const distances = EMOTION_BUBBLES.map((bubble) => {
      // Calculate distance from slider position to bubble center
      const sliderX = pleasantness;
      const sliderY = 100 - energy; // Invert Y for visual positioning
      const dist = Math.sqrt(Math.pow(bubble.baseX - sliderX, 2) + Math.pow(bubble.baseY - sliderY, 2));
      return { id: bubble.id, distance: dist };
    });
    return distances.sort((a, b) => a.distance - b.distance)[0].id;
  }, [energy, pleasantness]);

  // Calculate bubble sizes based on slider proximity
  const getBubbleSize = (bubble: typeof EMOTION_BUBBLES[0]) => {
    const sliderX = pleasantness;
    const sliderY = 100 - energy;
    const dist = Math.sqrt(Math.pow(bubble.baseX - sliderX, 2) + Math.pow(bubble.baseY - sliderY, 2));
    // Size ranges from 60px to 120px based on distance
    const maxDist = 80;
    const size = Math.max(60, 120 - (dist / maxDist) * 60);
    return size;
  };

  const toggleBubble = (id: string) => {
    setExpandedBubbles((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Bubble Visualization Area */}
      <div className="relative w-full h-[280px] mb-4">
        {/* Background gradient orbs for depth */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          {EMOTION_BUBBLES.map((bubble) => {
            const size = getBubbleSize(bubble);
            const isActive = activeBubble === bubble.id;
            const isExpanded = expandedBubbles.includes(bubble.id);
            
            return (
              <button
                key={bubble.id}
                onClick={() => {
                  toggleBubble(bubble.id);
                  onBubbleClick(bubble.quadrant);
                }}
                className={cn(
                  "absolute rounded-full flex items-center justify-center cursor-pointer",
                  "transition-all duration-500 ease-out transform",
                  isActive && "z-20 ring-4 ring-white/50 shadow-2xl",
                  !isActive && "z-10 opacity-80 hover:opacity-100 hover:scale-105"
                )}
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  left: `calc(${bubble.baseX}% - ${size / 2}px)`,
                  top: `calc(${bubble.baseY}% - ${size / 2}px)`,
                  background: `radial-gradient(circle at 30% 30%, ${bubble.bgColor}, ${bubble.color})`,
                  boxShadow: isActive 
                    ? `0 0 40px ${bubble.color}60, 0 0 80px ${bubble.color}30`
                    : `0 8px 32px ${bubble.color}40`,
                  transform: isActive ? "scale(1.15)" : "scale(1)",
                }}
              >
                <span 
                  className={cn(
                    "font-semibold text-white drop-shadow-lg transition-all duration-300",
                    isActive ? "text-base" : "text-sm"
                  )}
                >
                  {bubble.label}
                </span>
                
                {/* Pulse animation for active bubble */}
                {isActive && (
                  <div 
                    className="absolute inset-0 rounded-full animate-ping opacity-20"
                    style={{ background: bubble.color }}
                  />
                )}
              </button>
            );
          })}
          
          {/* Connector lines between bubbles */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
                <stop offset="50%" stopColor="currentColor" stopOpacity="0.3" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            {/* Draw subtle connecting lines */}
            {EMOTION_BUBBLES.slice(0, -1).map((bubble, i) => {
              const next = EMOTION_BUBBLES[i + 1];
              return (
                <line
                  key={`line-${i}`}
                  x1={`${bubble.baseX}%`}
                  y1={`${bubble.baseY}%`}
                  x2={`${next.baseX}%`}
                  y2={`${next.baseY}%`}
                  stroke="url(#lineGradient)"
                  strokeWidth="1"
                  className="text-muted-foreground opacity-30"
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Expandable Emotion Dropdowns */}
      <div className="flex-1 overflow-y-auto space-y-2 px-1">
        {EMOTION_BUBBLES.slice(0, 4).map((bubble) => {
          const isActive = activeBubble === bubble.id;
          const isExpanded = expandedBubbles.includes(bubble.id);
          
          return (
            <Collapsible
              key={bubble.id}
              open={isExpanded || isActive}
              onOpenChange={() => toggleBubble(bubble.id)}
            >
              <CollapsibleTrigger className="w-full">
                <div
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl transition-all duration-300",
                    "border hover:shadow-md",
                    isActive 
                      ? "border-2 shadow-lg" 
                      : "border-border/50 bg-muted/30"
                  )}
                  style={{
                    backgroundColor: isActive ? `${bubble.bgColor}` : undefined,
                    borderColor: isActive ? bubble.color : undefined,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full transition-transform duration-300"
                      style={{ 
                        background: bubble.color,
                        transform: isActive ? "scale(1.3)" : "scale(1)"
                      }}
                    />
                    <span className={cn(
                      "font-medium text-sm transition-colors",
                      isActive && "font-semibold"
                    )} style={{ color: isActive ? bubble.color : undefined }}>
                      {bubble.label}
                    </span>
                  </div>
                  <ChevronDown 
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform duration-300",
                      (isExpanded || isActive) && "rotate-180"
                    )} 
                  />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="animate-accordion-down">
                <div className="pt-2 pb-1 px-1">
                  <div className="flex flex-wrap gap-2">
                    {bubble.emotions.map((emotion) => {
                      const isSelected = selectedEmotion === emotion;
                      return (
                        <button
                          key={emotion}
                          onClick={() => onEmotionSelect(emotion, bubble.quadrant)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
                            "border hover:scale-105 active:scale-95",
                            isSelected 
                              ? "text-white shadow-md" 
                              : "bg-background hover:shadow-sm"
                          )}
                          style={{
                            backgroundColor: isSelected ? bubble.color : undefined,
                            borderColor: bubble.color,
                            color: isSelected ? "white" : bubble.color,
                          }}
                        >
                          {emotion}
                          {isSelected && <Check className="inline-block h-3 w-3 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
