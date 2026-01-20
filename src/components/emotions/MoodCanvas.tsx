import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { QuadrantType, QUADRANTS, EMOTION_DESCRIPTIONS } from "./types";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";

interface MoodCanvasProps {
  onSelect: (quadrant: QuadrantType, emotion: string) => void;
  initialQuadrant?: QuadrantType;
  initialEmotion?: string;
}

// All emotions with their approximate positions
const ALL_EMOTIONS: { emotion: string; quadrant: QuadrantType; energy: number; pleasantness: number }[] = [];
QUADRANTS["high-pleasant"].emotions.forEach((e, i) =>
  ALL_EMOTIONS.push({
    emotion: e,
    quadrant: "high-pleasant",
    energy: 55 + (i * 8) % 40,
    pleasantness: 55 + (i * 10) % 40,
  })
);
QUADRANTS["high-unpleasant"].emotions.forEach((e, i) =>
  ALL_EMOTIONS.push({
    emotion: e,
    quadrant: "high-unpleasant",
    energy: 55 + (i * 8) % 40,
    pleasantness: 10 + (i * 8) % 35,
  })
);
QUADRANTS["low-unpleasant"].emotions.forEach((e, i) =>
  ALL_EMOTIONS.push({
    emotion: e,
    quadrant: "low-unpleasant",
    energy: 10 + (i * 8) % 35,
    pleasantness: 10 + (i * 8) % 35,
  })
);
QUADRANTS["low-pleasant"].emotions.forEach((e, i) =>
  ALL_EMOTIONS.push({
    emotion: e,
    quadrant: "low-pleasant",
    energy: 10 + (i * 8) % 35,
    pleasantness: 55 + (i * 10) % 40,
  })
);

const getQuadrantFromPosition = (x: number, y: number): QuadrantType => {
  const isHighEnergy = y < 50;
  const isPleasant = x >= 50;
  if (isHighEnergy && isPleasant) return "high-pleasant";
  if (isHighEnergy && !isPleasant) return "high-unpleasant";
  if (!isHighEnergy && !isPleasant) return "low-unpleasant";
  return "low-pleasant";
};

const getSuggestedEmotions = (x: number, y: number) => {
  const energy = 100 - y; // Invert Y since top = high energy
  const pleasantness = x;
  
  const distances = ALL_EMOTIONS.map((e) => ({
    ...e,
    distance: Math.sqrt(Math.pow(e.energy - energy, 2) + Math.pow(e.pleasantness - pleasantness, 2)),
  }));
  return distances.sort((a, b) => a.distance - b.distance).slice(0, 5);
};

export function MoodCanvas({ onSelect, initialQuadrant, initialEmotion }: MoodCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Calculate initial position based on props
  const getInitialPosition = () => {
    if (initialQuadrant) {
      const isHigh = initialQuadrant.startsWith("high");
      const isPleasant = initialQuadrant.endsWith("pleasant") && !initialQuadrant.includes("unpleasant");
      return {
        x: isPleasant ? 75 : 25,
        y: isHigh ? 25 : 75,
      };
    }
    return { x: 50, y: 50 };
  };
  
  const [position, setPosition] = useState(getInitialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(initialEmotion || null);
  const [isHovering, setIsHovering] = useState(false);

  const currentQuadrant = useMemo(() => {
    return getQuadrantFromPosition(position.x, position.y);
  }, [position]);

  const suggestedEmotions = useMemo(() => {
    return getSuggestedEmotions(position.x, position.y);
  }, [position]);

  const bestMatch = suggestedEmotions[0];

  const handleInteraction = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    setPosition({ x, y });
    setSelectedEmotion(null); // Reset selection when moving
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleInteraction(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleInteraction(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    handleInteraction(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      const touch = e.touches[0];
      handleInteraction(touch.clientX, touch.clientY);
    }
  };

  const handleEmotionClick = (emotion: string, quadrant: QuadrantType) => {
    setSelectedEmotion(emotion);
    // Find emotion position and move indicator there
    const emotionData = ALL_EMOTIONS.find((e) => e.emotion === emotion && e.quadrant === quadrant);
    if (emotionData) {
      setPosition({
        x: emotionData.pleasantness,
        y: 100 - emotionData.energy,
      });
    }
  };

  const handleConfirm = () => {
    const emotionToSave = selectedEmotion || bestMatch?.emotion;
    const quadrant = selectedEmotion
      ? suggestedEmotions.find((e) => e.emotion === selectedEmotion)?.quadrant || currentQuadrant
      : bestMatch?.quadrant || currentQuadrant;
    if (emotionToSave) {
      onSelect(quadrant, emotionToSave);
    }
  };

  // Calculate gradient based on position
  const gradientStyle = useMemo(() => {
    const quadrantColors = {
      "high-pleasant": "rgba(34, 197, 94, 0.15)",   // Green tint
      "high-unpleasant": "rgba(239, 68, 68, 0.15)", // Red tint
      "low-unpleasant": "rgba(99, 102, 241, 0.15)", // Indigo tint
      "low-pleasant": "rgba(59, 130, 246, 0.15)",   // Blue tint
    };
    return {
      background: `radial-gradient(circle at ${position.x}% ${position.y}%, ${quadrantColors[currentQuadrant]} 0%, transparent 50%)`,
    };
  }, [position, currentQuadrant]);

  const quadrantInfo = QUADRANTS[currentQuadrant];

  return (
    <div className="w-full max-w-lg mx-auto space-y-5">
      {/* Canvas Container */}
      <div className="relative">
        {/* Mood Canvas */}
        <div
          ref={canvasRef}
          className={cn(
            "relative aspect-square rounded-3xl overflow-hidden cursor-crosshair transition-shadow duration-300",
            "bg-gradient-to-br from-muted/30 via-background to-muted/30",
            "border border-border/50",
            isDragging && "shadow-lg",
            isHovering && "shadow-md"
          )}
          style={gradientStyle}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { handleMouseUp(); setIsHovering(false); }}
          onMouseEnter={() => setIsHovering(true)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          {/* Quadrant backgrounds */}
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none">
            <div className="bg-gradient-to-br from-red-500/5 to-transparent" />
            <div className="bg-gradient-to-bl from-emerald-500/5 to-transparent" />
            <div className="bg-gradient-to-tr from-indigo-500/5 to-transparent" />
            <div className="bg-gradient-to-tl from-sky-500/5 to-transparent" />
          </div>

          {/* Axis lines */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border/30" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-border/30" />

          {/* Axis labels */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">
            High Energy
          </div>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">
            Low Energy
          </div>
          <div className="absolute left-3 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider origin-center">
            Unpleasant
          </div>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider origin-center">
            Pleasant
          </div>

          {/* Quadrant emoji hints */}
          <div className="absolute top-6 left-6 text-xl opacity-30">😰</div>
          <div className="absolute top-6 right-6 text-xl opacity-30">😊</div>
          <div className="absolute bottom-6 left-6 text-xl opacity-30">😔</div>
          <div className="absolute bottom-6 right-6 text-xl opacity-30">😌</div>

          {/* Position indicator with pulse effect */}
          <div
            className="absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-150 ease-out"
            style={{ left: `${position.x}%`, top: `${position.y}%` }}
          >
            {/* Outer pulse ring */}
            <div 
              className="absolute inset-0 rounded-full animate-ping opacity-30"
              style={{ backgroundColor: quadrantInfo.color }}
            />
            {/* Inner solid circle */}
            <div 
              className="absolute inset-1.5 rounded-full shadow-lg border-2 border-background"
              style={{ backgroundColor: quadrantInfo.color }}
            />
          </div>
        </div>

        {/* Current mood indicator */}
        <div 
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full shadow-md border border-border/50 backdrop-blur-sm"
          style={{ backgroundColor: `${quadrantInfo.bgColor}` }}
        >
          <span className="text-sm font-medium" style={{ color: quadrantInfo.color }}>
            {selectedEmotion || bestMatch?.emotion || quadrantInfo.label}
          </span>
        </div>
      </div>

      {/* Emotion Suggestions */}
      <div className="pt-4 space-y-3">
        <p className="text-xs text-center text-muted-foreground uppercase tracking-wider">
          Tap to select
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {suggestedEmotions.map((item, index) => {
            const isTopMatch = index === 0;
            const isSelected = selectedEmotion === item.emotion;
            const emotionQuadrant = QUADRANTS[item.quadrant];
            const description = EMOTION_DESCRIPTIONS[item.emotion];

            return (
              <HoverCard key={item.emotion} openDelay={200} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <button
                    onClick={() => handleEmotionClick(item.emotion, item.quadrant)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all border-2",
                      isSelected || (isTopMatch && !selectedEmotion) 
                        ? "scale-105 shadow-md" 
                        : "hover:scale-[1.02] opacity-80 hover:opacity-100"
                    )}
                    style={{
                      backgroundColor: isSelected || (isTopMatch && !selectedEmotion) 
                        ? emotionQuadrant.color 
                        : emotionQuadrant.bgColor,
                      borderColor: emotionQuadrant.borderColor,
                      color: isSelected || (isTopMatch && !selectedEmotion) 
                        ? "white" 
                        : emotionQuadrant.color,
                    }}
                  >
                    {item.emotion}
                  </button>
                </HoverCardTrigger>
                {description && (
                  <HoverCardContent side="top" className="w-64 p-3 rounded-xl">
                    <p className="font-medium text-sm mb-1" style={{ color: emotionQuadrant.color }}>
                      {item.emotion}
                    </p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </HoverCardContent>
                )}
              </HoverCard>
            );
          })}
        </div>
      </div>

      {/* Confirm Button */}
      <button
        onClick={handleConfirm}
        disabled={!bestMatch && !selectedEmotion}
        className={cn(
          "w-full py-3.5 rounded-2xl font-medium text-white transition-all",
          "bg-gradient-to-r shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg"
        )}
        style={{
          backgroundImage: `linear-gradient(to right, ${quadrantInfo.color}, ${QUADRANTS[currentQuadrant === 'high-pleasant' ? 'low-pleasant' : currentQuadrant === 'high-unpleasant' ? 'high-pleasant' : currentQuadrant === 'low-unpleasant' ? 'high-unpleasant' : 'high-pleasant'].color})`,
        }}
      >
        Continue with "{selectedEmotion || bestMatch?.emotion}"
      </button>
    </div>
  );
}
