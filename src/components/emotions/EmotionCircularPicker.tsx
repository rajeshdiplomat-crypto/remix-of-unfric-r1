import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { QuadrantType, QUADRANTS } from "./types";
import { cn } from "@/lib/utils";

interface EmotionCircularPickerProps {
  energy: number;
  pleasantness: number;
  selectedCategory: string | null;
  selectedEmotion: string | null;
  onEnergyChange: (value: number) => void;
  onPleasantnessChange: (value: number) => void;
  onCategorySelect: (category: string, quadrant: QuadrantType) => void;
  onEmotionSelect: (emotion: string, quadrant: QuadrantType) => void;
  size?: number;
}

// Emotion wheel structure - inner core emotions and outer specific emotions
const WHEEL_SECTIONS = [
  // Top-right quadrant (high-pleasant) - 0° to 90°
  {
    quadrant: "high-pleasant" as QuadrantType,
    core: "Happy",
    emotions: ["Caring", "Grateful", "Excited", "Respected"],
    startAngle: -90,
    endAngle: -45,
    color: "#FFD93D",
  },
  {
    quadrant: "high-pleasant" as QuadrantType,
    core: "Loved",
    emotions: ["Valued", "Accepted"],
    startAngle: -45,
    endAngle: 0,
    color: "#FF8C42",
  },
  {
    quadrant: "low-pleasant" as QuadrantType,
    core: "Confident",
    emotions: ["Brave", "Hopeful"],
    startAngle: 0,
    endAngle: 45,
    color: "#7DD3FC",
  },
  {
    quadrant: "low-pleasant" as QuadrantType,
    core: "Playful",
    emotions: ["Powerful", "Creative", "Curious"],
    startAngle: 45,
    endAngle: 90,
    color: "#38BDF8",
  },
  // Bottom-right quadrant (low-unpleasant) - mapped differently
  {
    quadrant: "low-unpleasant" as QuadrantType,
    core: "Embarrassed",
    emotions: ["Ashamed", "Excluded", "Guilty", "Affected"],
    startAngle: 90,
    endAngle: 135,
    color: "#9B59B6",
  },
  {
    quadrant: "low-unpleasant" as QuadrantType,
    core: "Angry",
    emotions: ["Annoyed", "Jealous"],
    startAngle: 135,
    endAngle: 180,
    color: "#8E44AD",
  },
  {
    quadrant: "high-unpleasant" as QuadrantType,
    core: "Scared",
    emotions: ["Bored", "Overwhelmed", "Powerless", "Anxious"],
    startAngle: 180,
    endAngle: 225,
    color: "#3498DB",
  },
  {
    quadrant: "high-unpleasant" as QuadrantType,
    core: "Sad",
    emotions: ["Disappointed", "Hurt", "Lonely"],
    startAngle: 225,
    endAngle: 270,
    color: "#1ABC9C",
  },
];

export function EmotionCircularPicker({
  energy,
  pleasantness,
  selectedCategory,
  selectedEmotion,
  onEnergyChange,
  onPleasantnessChange,
  onCategorySelect,
  onEmotionSelect,
  size: propSize,
}: EmotionCircularPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDraggingEnergy, setIsDraggingEnergy] = useState(false);
  const [isDraggingPleasantness, setIsDraggingPleasantness] = useState(false);
  const [hoveredSection, setHoveredSection] = useState<number | null>(null);

  // Ring dimensions - scaled up ~25%
  const size = propSize || 520;
  const center = size / 2;
  const outerRadius = size * 0.45; // ~235 at 520
  const middleRadius = size * 0.34; // ~175 at 520
  const innerRingRadius = size * 0.20; // ~105 at 520
  const innerMostRadius = size * 0.135; // ~70 at 520
  const strokeWidth = 16;

  // Convert value (0-100) to angle (radians) - starting from top (-π/2)
  const valueToAngle = useCallback((value: number): number => {
    return ((value / 100) * 2 * Math.PI) - (Math.PI / 2);
  }, []);

  // Convert angle to value
  const angleToValue = useCallback((angle: number): number => {
    let normalized = angle + (Math.PI / 2);
    if (normalized < 0) normalized += 2 * Math.PI;
    if (normalized > 2 * Math.PI) normalized -= 2 * Math.PI;
    return Math.round((normalized / (2 * Math.PI)) * 100);
  }, []);

  // Get thumb position on ring
  const getThumbPosition = useCallback((value: number, radius: number) => {
    const angle = valueToAngle(value);
    return {
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
    };
  }, [valueToAngle, center]);

  // Handle drag on ring
  const handleDrag = useCallback((e: MouseEvent | TouchEvent, ring: 'energy' | 'pleasantness') => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = clientX - rect.left - center;
    const y = clientY - rect.top - center;
    
    const angle = Math.atan2(y, x);
    const value = angleToValue(angle);
    
    if (ring === 'energy') {
      onEnergyChange(Math.max(0, Math.min(100, value)));
    } else {
      onPleasantnessChange(Math.max(0, Math.min(100, value)));
    }
  }, [angleToValue, onEnergyChange, onPleasantnessChange, center]);

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

  // Calculate current quadrant
  const currentQuadrant: QuadrantType = useMemo(() => {
    if (energy >= 50 && pleasantness >= 50) return "high-pleasant";
    if (energy >= 50 && pleasantness < 50) return "high-unpleasant";
    if (energy < 50 && pleasantness < 50) return "low-unpleasant";
    return "low-pleasant";
  }, [energy, pleasantness]);

  // Check if section belongs to current quadrant
  const isSectionActive = useCallback((section: typeof WHEEL_SECTIONS[0]) => {
    return section.quadrant === currentQuadrant;
  }, [currentQuadrant]);

  // Handle emotion click
  const handleEmotionClick = useCallback((emotion: string, section: typeof WHEEL_SECTIONS[0]) => {
    if (!isSectionActive(section)) return; // Only allow clicks on active sections
    onCategorySelect(section.core, section.quadrant);
    onEmotionSelect(emotion, section.quadrant);
  }, [onCategorySelect, onEmotionSelect, isSectionActive]);

  // Handle core emotion click
  const handleCoreClick = useCallback((section: typeof WHEEL_SECTIONS[0]) => {
    if (!isSectionActive(section)) return; // Only allow clicks on active sections
    onCategorySelect(section.core, section.quadrant);
    onEmotionSelect(section.core, section.quadrant);
  }, [onCategorySelect, onEmotionSelect, isSectionActive]);

  const energyThumb = getThumbPosition(energy, innerRingRadius);
  const pleasantnessThumb = getThumbPosition(pleasantness, innerMostRadius);

  // Create arc path for wheel sections
  const createArcPath = (startAngle: number, endAngle: number, innerR: number, outerR: number) => {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const x1 = center + innerR * Math.cos(startRad);
    const y1 = center + innerR * Math.sin(startRad);
    const x2 = center + outerR * Math.cos(startRad);
    const y2 = center + outerR * Math.sin(startRad);
    const x3 = center + outerR * Math.cos(endRad);
    const y3 = center + outerR * Math.sin(endRad);
    const x4 = center + innerR * Math.cos(endRad);
    const y4 = center + innerR * Math.sin(endRad);
    
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    
    return `M ${x1} ${y1} L ${x2} ${y2} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x3} ${y3} L ${x4} ${y4} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x1} ${y1}`;
  };

  // Position text along arc
  const getTextPosition = (angle: number, radius: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
    };
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Emotion Wheel */}
      <div 
        ref={containerRef}
        className="relative"
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} className="absolute inset-0">
          {/* SVG Filters for glow effect */}
          <defs>
            <filter id="selectedGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Wheel sections */}
          {WHEEL_SECTIONS.map((section, index) => {
            const isActive = isSectionActive(section);
            const isHovered = hoveredSection === index && isActive;
            const isCoreSelected = selectedEmotion === section.core || selectedCategory === section.core;
            const isAnyEmotionSelected = section.emotions.includes(selectedEmotion || '');
            const isSelected = isCoreSelected || isAnyEmotionSelected;
            
            return (
              <g 
                key={index}
                className={cn(
                  "transition-all duration-300",
                  !isActive && "pointer-events-none"
                )}
              >
                {/* Outer section (specific emotions) */}
                <path
                  d={createArcPath(section.startAngle, section.endAngle, middleRadius + 5, outerRadius)}
                  fill={section.color}
                  opacity={isActive ? (isHovered || isSelected ? 1 : 0.85) : 0.12}
                  className={cn(
                    "transition-opacity duration-300",
                    isActive ? "cursor-pointer" : "cursor-default"
                  )}
                  onMouseEnter={() => isActive && setHoveredSection(index)}
                  onMouseLeave={() => setHoveredSection(null)}
                />
                
                {/* Inner section (core emotion) */}
                <path
                  d={createArcPath(section.startAngle, section.endAngle, innerRingRadius + 20, middleRadius)}
                  fill={section.color}
                  opacity={isActive ? (isHovered || isSelected ? 0.95 : 0.7) : 0.12}
                  className={cn(
                    "transition-opacity duration-300",
                    isActive ? "cursor-pointer" : "cursor-default"
                  )}
                  onClick={() => handleCoreClick(section)}
                  onMouseEnter={() => isActive && setHoveredSection(index)}
                  onMouseLeave={() => setHoveredSection(null)}
                />

                {/* Selection highlight ring */}
                {isSelected && isActive && (
                  <path
                    d={createArcPath(section.startAngle, section.endAngle, innerRingRadius + 18, outerRadius + 2)}
                    fill="none"
                    stroke="white"
                    strokeWidth={3}
                    className="animate-pulse"
                    filter="url(#selectedGlow)"
                    style={{ opacity: 0.9 }}
                  />
                )}
              </g>
            );
          })}

          {/* Center rings background */}
          <circle
            cx={center}
            cy={center}
            r={innerRingRadius + 15}
            fill="hsl(var(--background))"
            className="drop-shadow-lg"
          />

          {/* Outer Ring Track (Energy) */}
          <circle
            cx={center}
            cy={center}
            r={innerRingRadius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            className="opacity-30"
          />
          
          {/* Outer Ring Progress (Energy) */}
          <circle
            cx={center}
            cy={center}
            r={innerRingRadius}
            fill="none"
            stroke="hsl(45, 93%, 55%)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${(energy / 100) * 2 * Math.PI * innerRingRadius} ${2 * Math.PI * innerRingRadius}`}
            transform={`rotate(-90 ${center} ${center})`}
            className="transition-all duration-150"
            style={{
              filter: isDraggingEnergy ? 'drop-shadow(0 0 8px hsl(45, 93%, 55%))' : undefined
            }}
          />
          
          {/* Inner Ring Track (Pleasantness) */}
          <circle
            cx={center}
            cy={center}
            r={innerMostRadius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            className="opacity-30"
          />
          
          {/* Inner Ring Progress (Pleasantness) */}
          <circle
            cx={center}
            cy={center}
            r={innerMostRadius}
            fill="none"
            stroke="hsl(142, 52%, 50%)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${(pleasantness / 100) * 2 * Math.PI * innerMostRadius} ${2 * Math.PI * innerMostRadius}`}
            transform={`rotate(-90 ${center} ${center})`}
            className="transition-all duration-150"
            style={{
              filter: isDraggingPleasantness ? 'drop-shadow(0 0 8px hsl(142, 52%, 50%))' : undefined
            }}
          />

          {/* Center fill */}
          <circle
            cx={center}
            cy={center}
            r={innerMostRadius - strokeWidth / 2 - 5}
            fill="hsl(var(--background))"
          />
        </svg>

        {/* Emotion labels on wheel */}
        {WHEEL_SECTIONS.map((section, sectionIndex) => {
          const isActive = isSectionActive(section);
          const midAngle = (section.startAngle + section.endAngle) / 2;
          const corePos = getTextPosition(midAngle, middleRadius - 20);
          const isCoreSelected = selectedEmotion === section.core || selectedCategory === section.core;
          
          return (
            <div key={`labels-${sectionIndex}`}>
              {/* Core emotion label */}
              <button
                className={cn(
                  "absolute text-xs font-bold pointer-events-auto",
                  "transition-all duration-300",
                  isActive 
                    ? "text-white hover:scale-110 cursor-pointer" 
                    : "text-white/20 cursor-default pointer-events-none",
                  isCoreSelected && isActive && "scale-110"
                )}
                style={{
                  left: corePos.x,
                  top: corePos.y,
                  transform: 'translate(-50%, -50%)',
                  textShadow: isActive ? '0 1px 2px rgba(0,0,0,0.5)' : 'none',
                }}
                onClick={() => handleCoreClick(section)}
                disabled={!isActive}
              >
                {section.core}
              </button>
              
              {/* Outer emotion labels */}
              {section.emotions.map((emotion, emotionIndex) => {
                const emotionAngle = section.startAngle + 
                  ((section.endAngle - section.startAngle) / (section.emotions.length + 1)) * (emotionIndex + 1);
                const pos = getTextPosition(emotionAngle, outerRadius - 25);
                const rotation = emotionAngle > 90 && emotionAngle < 270 ? emotionAngle + 180 : emotionAngle;
                const isEmotionSelected = selectedEmotion === emotion;
                
                return (
                  <button
                    key={emotion}
                    className={cn(
                      "absolute text-[10px] font-medium pointer-events-auto whitespace-nowrap",
                      "transition-all duration-300",
                      isActive 
                        ? "text-white hover:scale-110 cursor-pointer" 
                        : "text-white/10 cursor-default pointer-events-none",
                      isEmotionSelected && isActive && "scale-110 font-bold"
                    )}
                    style={{
                      left: pos.x,
                      top: pos.y,
                      transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                      textShadow: isActive ? '0 1px 2px rgba(0,0,0,0.5)' : 'none',
                    }}
                    onClick={() => handleEmotionClick(emotion, section)}
                    disabled={!isActive}
                  >
                    {emotion}
                  </button>
                );
              })}
            </div>
          );
        })}

        {/* Energy Thumb */}
        <div
          className={cn(
            "absolute w-8 h-8 rounded-full border-4 border-amber-500 bg-background shadow-lg cursor-grab z-10",
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
          <span className="text-[9px] font-bold text-amber-600">{energy}</span>
        </div>

        {/* Pleasantness Thumb */}
        <div
          className={cn(
            "absolute w-8 h-8 rounded-full border-4 border-emerald-500 bg-background shadow-lg cursor-grab z-10",
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
          <span className="text-[9px] font-bold text-emerald-600">{pleasantness}</span>
        </div>

        {/* Center quadrant indicator */}
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div 
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300"
            style={{
              background: `linear-gradient(135deg, ${QUADRANTS[currentQuadrant].color}30, ${QUADRANTS[currentQuadrant].color}50)`,
              border: `2px solid ${QUADRANTS[currentQuadrant].color}`,
            }}
          >
            <span className="text-xl">
              {currentQuadrant === 'high-pleasant' ? '😊' : 
               currentQuadrant === 'high-unpleasant' ? '😰' :
               currentQuadrant === 'low-unpleasant' ? '😔' : '😌'}
            </span>
          </div>
        </div>
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
    </div>
  );
}
