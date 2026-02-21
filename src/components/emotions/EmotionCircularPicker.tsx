import { useState, useMemo, useCallback } from "react";
import { QuadrantType, QUADRANTS, EMOTION_DESCRIPTIONS } from "./types";
import { cn } from "@/lib/utils";

interface EmotionCircularPickerProps {
  energy: number;
  pleasantness: number;
  selectedCategory: string | null;
  selectedEmotion: string | null;
  onEnergyChange: (val: number) => void;
  onPleasantnessChange: (val: number) => void;
  onCategorySelect: (q: string) => void;
  onEmotionSelect: (emotion: string, quadrant?: QuadrantType) => void;
  size?: number;
}

export function EmotionCircularPicker({
  energy,
  pleasantness,
  selectedCategory,
  selectedEmotion,
  onEnergyChange,
  onPleasantnessChange,
  onCategorySelect,
  onEmotionSelect,
  size = 320,
}: EmotionCircularPickerProps) {
  const [hoveredEmotion, setHoveredEmotion] = useState<string | null>(null);

  const quadrant = useMemo((): QuadrantType => {
    if (energy >= 50 && pleasantness >= 50) return "high-pleasant";
    if (energy >= 50 && pleasantness < 50) return "high-unpleasant";
    if (energy < 50 && pleasantness < 50) return "low-unpleasant";
    return "low-pleasant";
  }, [energy, pleasantness]);

  const activeQuadrant: QuadrantType = (selectedCategory as QuadrantType) || quadrant;
  const quadrantInfo = QUADRANTS[activeQuadrant];
  const emotions = quadrantInfo.emotions;

  const handleWheel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = 100 - ((e.clientY - rect.top) / rect.height) * 100;
      onPleasantnessChange(Math.max(0, Math.min(100, Math.round(x))));
      onEnergyChange(Math.max(0, Math.min(100, Math.round(y))));
    },
    [onEnergyChange, onPleasantnessChange]
  );

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Quadrant selector */}
      <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
        {(Object.keys(QUADRANTS) as QuadrantType[]).map((q) => {
          const info = QUADRANTS[q];
          const isActive = activeQuadrant === q;
          return (
            <button
              key={q}
              onClick={() => onCategorySelect(q)}
              className={cn(
                "rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200 border",
                isActive
                  ? "scale-[1.02] shadow-md"
                  : "opacity-60 hover:opacity-90"
              )}
              style={{
                borderColor: info.color,
                backgroundColor: isActive ? info.bgColor : "transparent",
                color: isActive ? info.color : undefined,
              }}
            >
              {info.label}
            </button>
          );
        })}
      </div>

      {/* Energy/Pleasantness pad */}
      <div
        className="relative rounded-2xl border border-border/40 cursor-crosshair touch-none"
        style={{ width: size, height: size }}
        onPointerDown={handleWheel}
        onPointerMove={(e) => {
          if (e.buttons > 0) handleWheel(e);
        }}
      >
        {/* Quadrant backgrounds */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden grid grid-cols-2 grid-rows-2">
          {(["high-unpleasant", "high-pleasant", "low-unpleasant", "low-pleasant"] as QuadrantType[]).map((q) => (
            <div
              key={q}
              className="transition-opacity duration-300"
              style={{
                backgroundColor: QUADRANTS[q].bgColor,
                opacity: activeQuadrant === q ? 0.6 : 0.15,
              }}
            />
          ))}
        </div>

        {/* Crosshair indicator */}
        <div
          className="absolute w-5 h-5 rounded-full border-2 border-foreground/80 shadow-lg transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
          style={{
            left: `${pleasantness}%`,
            top: `${100 - energy}%`,
            backgroundColor: quadrantInfo.color,
          }}
        />

        {/* Axis labels */}
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground/60 pointer-events-none">
          Pleasant →
        </span>
        <span className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] text-muted-foreground/60 pointer-events-none">
          Energy →
        </span>
      </div>

      {/* Emotion chips */}
      <div className="flex flex-wrap justify-center gap-1.5 max-w-sm">
        {emotions.map((emotion) => {
          const isSelected = selectedEmotion === emotion;
          const isHovered = hoveredEmotion === emotion;
          return (
            <button
              key={emotion}
              onClick={() => onEmotionSelect(emotion, activeQuadrant)}
              onMouseEnter={() => setHoveredEmotion(emotion)}
              onMouseLeave={() => setHoveredEmotion(null)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border",
                isSelected
                  ? "scale-105 shadow-md text-white"
                  : "hover:scale-[1.02]"
              )}
              style={{
                borderColor: quadrantInfo.color,
                backgroundColor: isSelected ? quadrantInfo.color : isHovered ? quadrantInfo.bgColor : "transparent",
                color: isSelected ? "white" : undefined,
              }}
              title={EMOTION_DESCRIPTIONS[emotion] || emotion}
            >
              {emotion}
            </button>
          );
        })}
      </div>
    </div>
  );
}
