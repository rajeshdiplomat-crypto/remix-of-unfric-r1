import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { QuadrantType, QUADRANTS } from "./types";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface EmotionCircularPickerProps {
  energy: number;
  pleasantness: number;
  selectedCategory: string | null;
  selectedEmotion: string | null;
  onEnergyChange: (value: number) => void;
  onPleasantnessChange: (value: number) => void;
  onCategorySelect: (category: string, quadrant: QuadrantType) => void;
  onEmotionSelect: (emotion: string, quadrant: QuadrantType) => void;
}

// Category bubbles positioned around the rings
const CATEGORIES = [
  { id: "joy", label: "Joy", emoji: "✨", quadrant: "high-pleasant" as QuadrantType, angle: -60, energy: 75, pleasantness: 85 },
  { id: "energy", label: "Energy", emoji: "🔥", quadrant: "high-pleasant" as QuadrantType, angle: -20, energy: 90, pleasantness: 70 },
  { id: "tension", label: "Tension", emoji: "⚡", quadrant: "high-unpleasant" as QuadrantType, angle: 20, energy: 80, pleasantness: 25 },
  { id: "fear", label: "Fear", emoji: "😰", quadrant: "high-unpleasant" as QuadrantType, angle: 60, energy: 70, pleasantness: 15 },
  { id: "sadness", label: "Sadness", emoji: "💧", quadrant: "low-unpleasant" as QuadrantType, angle: 120, energy: 20, pleasantness: 25 },
  { id: "peace", label: "Peace", emoji: "🍃", quadrant: "low-pleasant" as QuadrantType, angle: -120, energy: 25, pleasantness: 80 },
];

// Map categories to emotions
const CATEGORY_EMOTIONS: Record<string, string[]> = {
  joy: ["Excited", "Joyful", "Inspired", "Thrilled", "Elated", "Cheerful", "Blissful", "Radiant"],
  energy: ["Energetic", "Enthusiastic", "Motivated", "Alive", "Vibrant", "Empowered", "Passionate", "Exhilarated"],
  tension: ["Anxious", "Frustrated", "Stressed", "Overwhelmed", "Agitated", "Restless", "Tense", "Worried"],
  fear: ["Fearful", "Panicked", "Nervous", "Alarmed", "Apprehensive", "Shocked", "Defensive", "Hostile"],
  sadness: ["Sad", "Tired", "Drained", "Lonely", "Exhausted", "Empty", "Melancholy", "Dejected"],
  peace: ["Calm", "Content", "Relaxed", "Peaceful", "Serene", "Tranquil", "Centered", "Grounded"],
};

export function EmotionCircularPicker({
  energy,
  pleasantness,
  selectedCategory,
  selectedEmotion,
  onEnergyChange,
  onPleasantnessChange,
  onCategorySelect,
  onEmotionSelect,
}: EmotionCircularPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDraggingEnergy, setIsDraggingEnergy] = useState(false);
  const [isDraggingPleasantness, setIsDraggingPleasantness] = useState(false);

  // Ring dimensions
  const outerRadius = 140; // Energy ring
  const innerRadius = 90;  // Pleasantness ring
  const strokeWidth = 16;
  const centerX = 180;
  const centerY = 180;

  // Convert value (0-100) to angle (radians) - starting from top (-π/2)
  const valueToAngle = useCallback((value: number): number => {
    return ((value / 100) * 2 * Math.PI) - (Math.PI / 2);
  }, []);

  // Convert angle to value
  const angleToValue = useCallback((angle: number): number => {
    // Normalize angle to 0-2π starting from top
    let normalized = angle + (Math.PI / 2);
    if (normalized < 0) normalized += 2 * Math.PI;
    if (normalized > 2 * Math.PI) normalized -= 2 * Math.PI;
    return Math.round((normalized / (2 * Math.PI)) * 100);
  }, []);

  // Get thumb position on ring
  const getThumbPosition = useCallback((value: number, radius: number) => {
    const angle = valueToAngle(value);
    return {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    };
  }, [valueToAngle]);

  // Calculate quadrant from values
  const currentQuadrant: QuadrantType = useMemo(() => {
    if (energy >= 50 && pleasantness >= 50) return "high-pleasant";
    if (energy >= 50 && pleasantness < 50) return "high-unpleasant";
    if (energy < 50 && pleasantness < 50) return "low-unpleasant";
    return "low-pleasant";
  }, [energy, pleasantness]);

  // Handle drag on ring
  const handleDrag = useCallback((e: MouseEvent | TouchEvent, ring: 'energy' | 'pleasantness') => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = clientX - rect.left - centerX;
    const y = clientY - rect.top - centerY;
    
    const angle = Math.atan2(y, x);
    const value = angleToValue(angle);
    
    if (ring === 'energy') {
      onEnergyChange(Math.max(0, Math.min(100, value)));
    } else {
      onPleasantnessChange(Math.max(0, Math.min(100, value)));
    }
  }, [angleToValue, onEnergyChange, onPleasantnessChange]);

  // Mouse/touch handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingEnergy) handleDrag(e, 'energy');
      if (isDraggingPleasantness) handleDrag(e, 'pleasantness');
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDraggingEnergy) handleDrag(e, 'energy');
      if (isDraggingPleasantness) handleDrag(e, 'pleasantness');
    };

    const handleEnd = () => {
      setIsDraggingEnergy(false);
      setIsDraggingPleasantness(false);
    };

    if (isDraggingEnergy || isDraggingPleasantness) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDraggingEnergy, isDraggingPleasantness, handleDrag]);

  // Handle category click
  const handleCategoryClick = useCallback((category: typeof CATEGORIES[0]) => {
    onCategorySelect(category.id, category.quadrant);
    // Animate sliders to category position
    onEnergyChange(category.energy);
    onPleasantnessChange(category.pleasantness);
  }, [onCategorySelect, onEnergyChange, onPleasantnessChange]);

  // Find closest category based on current values
  const closestCategory = useMemo(() => {
    let closest = CATEGORIES[0];
    let minDist = Infinity;
    CATEGORIES.forEach(cat => {
      const dist = Math.sqrt(
        Math.pow(energy - cat.energy, 2) + 
        Math.pow(pleasantness - cat.pleasantness, 2)
      );
      if (dist < minDist) {
        minDist = dist;
        closest = cat;
      }
    });
    return closest;
  }, [energy, pleasantness]);

  const energyThumb = getThumbPosition(energy, outerRadius);
  const pleasantnessThumb = getThumbPosition(pleasantness, innerRadius);

  // Get category for selected emotions
  const activeCategory = selectedCategory || closestCategory.id;
  const activeCategoryData = CATEGORIES.find(c => c.id === activeCategory);
  const emotionsForCategory = CATEGORY_EMOTIONS[activeCategory] || [];

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Circular Picker Container */}
      <div 
        ref={containerRef}
        className="relative"
        style={{ width: centerX * 2, height: centerY * 2 }}
      >
        {/* SVG Rings */}
        <svg 
          width={centerX * 2} 
          height={centerY * 2} 
          className="absolute inset-0"
        >
          {/* Outer Ring Track (Energy) */}
          <circle
            cx={centerX}
            cy={centerY}
            r={outerRadius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            className="opacity-30"
          />
          
          {/* Outer Ring Progress (Energy) */}
          <circle
            cx={centerX}
            cy={centerY}
            r={outerRadius}
            fill="none"
            stroke="hsl(45, 93%, 55%)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${(energy / 100) * 2 * Math.PI * outerRadius} ${2 * Math.PI * outerRadius}`}
            transform={`rotate(-90 ${centerX} ${centerY})`}
            className="transition-all duration-150"
            style={{
              filter: isDraggingEnergy ? 'drop-shadow(0 0 8px hsl(45, 93%, 55%))' : undefined
            }}
          />
          
          {/* Inner Ring Track (Pleasantness) */}
          <circle
            cx={centerX}
            cy={centerY}
            r={innerRadius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            className="opacity-30"
          />
          
          {/* Inner Ring Progress (Pleasantness) */}
          <circle
            cx={centerX}
            cy={centerY}
            r={innerRadius}
            fill="none"
            stroke="hsl(142, 52%, 50%)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${(pleasantness / 100) * 2 * Math.PI * innerRadius} ${2 * Math.PI * innerRadius}`}
            transform={`rotate(-90 ${centerX} ${centerY})`}
            className="transition-all duration-150"
            style={{
              filter: isDraggingPleasantness ? 'drop-shadow(0 0 8px hsl(142, 52%, 50%))' : undefined
            }}
          />
        </svg>

        {/* Energy Thumb */}
        <div
          className={cn(
            "absolute w-8 h-8 rounded-full border-4 border-amber-500 bg-background shadow-lg cursor-grab",
            "flex items-center justify-center transition-transform",
            isDraggingEnergy && "cursor-grabbing scale-110"
          )}
          style={{
            left: energyThumb.x - 16,
            top: energyThumb.y - 16,
            boxShadow: isDraggingEnergy 
              ? '0 0 20px hsl(45, 93%, 55%), 0 4px 12px rgba(0,0,0,0.2)' 
              : '0 4px 12px rgba(0,0,0,0.15)'
          }}
          onMouseDown={() => setIsDraggingEnergy(true)}
          onTouchStart={() => setIsDraggingEnergy(true)}
        >
          <span className="text-xs font-bold text-amber-600">{energy}</span>
        </div>

        {/* Pleasantness Thumb */}
        <div
          className={cn(
            "absolute w-8 h-8 rounded-full border-4 border-emerald-500 bg-background shadow-lg cursor-grab",
            "flex items-center justify-center transition-transform",
            isDraggingPleasantness && "cursor-grabbing scale-110"
          )}
          style={{
            left: pleasantnessThumb.x - 16,
            top: pleasantnessThumb.y - 16,
            boxShadow: isDraggingPleasantness 
              ? '0 0 20px hsl(142, 52%, 50%), 0 4px 12px rgba(0,0,0,0.2)' 
              : '0 4px 12px rgba(0,0,0,0.15)'
          }}
          onMouseDown={() => setIsDraggingPleasantness(true)}
          onTouchStart={() => setIsDraggingPleasantness(true)}
        >
          <span className="text-xs font-bold text-emerald-600">{pleasantness}</span>
        </div>

        {/* Center Display */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        >
          <div className="text-center">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mb-2 mx-auto"
              style={{
                background: `linear-gradient(135deg, ${QUADRANTS[currentQuadrant].color}20, ${QUADRANTS[currentQuadrant].color}40)`,
                border: `2px solid ${QUADRANTS[currentQuadrant].color}50`
              }}
            >
              <span className="text-2xl">{CATEGORIES.find(c => c.quadrant === currentQuadrant)?.emoji || "😊"}</span>
            </div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {currentQuadrant.replace('-', ' ')}
            </p>
          </div>
        </div>

        {/* Category Bubbles - positioned around the rings */}
        {CATEGORIES.map((category) => {
          const isActive = activeCategory === category.id;
          const distance = Math.sqrt(
            Math.pow(energy - category.energy, 2) + 
            Math.pow(pleasantness - category.pleasantness, 2)
          );
          const proximity = Math.max(0, 1 - distance / 60);
          const bubbleRadius = 175;
          const angleRad = (category.angle * Math.PI) / 180;
          const x = centerX + Math.cos(angleRad) * bubbleRadius - 28;
          const y = centerY + Math.sin(angleRad) * bubbleRadius - 28;
          const scale = isActive ? 1.15 : 0.85 + proximity * 0.25;

          return (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category)}
              className={cn(
                "absolute w-14 h-14 rounded-full flex flex-col items-center justify-center",
                "transition-all duration-300 border-2 cursor-pointer",
                isActive && "ring-2 ring-offset-2 ring-offset-background"
              )}
              style={{
                left: x,
                top: y,
                transform: `scale(${scale})`,
                background: `linear-gradient(145deg, ${QUADRANTS[category.quadrant].color}20, ${QUADRANTS[category.quadrant].color}40)`,
                borderColor: isActive ? QUADRANTS[category.quadrant].color : `${QUADRANTS[category.quadrant].color}50`,
                opacity: 0.6 + proximity * 0.4,
                // @ts-expect-error - CSS custom property for ring color
                "--tw-ring-color": QUADRANTS[category.quadrant].color,
              }}
            >
              <span className="text-lg">{category.emoji}</span>
              <span 
                className="text-[8px] font-bold uppercase"
                style={{ color: QUADRANTS[category.quadrant].color }}
              >
                {category.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Labels for rings */}
      <div className="flex items-center justify-center gap-8 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-muted-foreground">Energy: <span className="font-semibold text-foreground">{energy}%</span></span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">Pleasantness: <span className="font-semibold text-foreground">{pleasantness}%</span></span>
        </div>
      </div>

      {/* Emotion Words Layer - appears when category is selected */}
      {activeCategoryData && (
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="text-center mb-4">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              Select how you feel within
              <span className="font-semibold" style={{ color: QUADRANTS[activeCategoryData.quadrant].color }}>
                {activeCategoryData.label}
              </span>
            </span>
          </div>
          
          <div 
            className="p-6 rounded-2xl border-2 transition-colors"
            style={{ 
              background: `linear-gradient(135deg, ${QUADRANTS[activeCategoryData.quadrant].color}08, ${QUADRANTS[activeCategoryData.quadrant].color}15)`,
              borderColor: `${QUADRANTS[activeCategoryData.quadrant].color}30`
            }}
          >
            <div className="flex flex-wrap justify-center gap-3">
              {emotionsForCategory.map((emotion, index) => {
                const isSelected = selectedEmotion === emotion;
                return (
                  <button
                    key={emotion}
                    onClick={() => onEmotionSelect(emotion, activeCategoryData.quadrant)}
                    className={cn(
                      "px-5 py-3 rounded-xl text-sm font-medium",
                      "transition-all duration-200 border-2",
                      "hover:scale-105 active:scale-95",
                      "animate-in fade-in slide-in-from-bottom-2"
                    )}
                    style={{
                      animationDelay: `${index * 30}ms`,
                      background: isSelected 
                        ? `linear-gradient(135deg, ${QUADRANTS[activeCategoryData.quadrant].color}, ${QUADRANTS[activeCategoryData.quadrant].color}DD)` 
                        : 'hsl(var(--background))',
                      borderColor: QUADRANTS[activeCategoryData.quadrant].color,
                      color: isSelected ? "white" : QUADRANTS[activeCategoryData.quadrant].color,
                    }}
                  >
                    {emotion}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
