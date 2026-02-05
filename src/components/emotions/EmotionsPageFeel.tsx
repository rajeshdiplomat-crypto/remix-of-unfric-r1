import { useState, useMemo, useCallback } from "react";
import { ArrowRight, Search, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { QuadrantType, QUADRANTS } from "./types";
import { cn } from "@/lib/utils";

interface EmotionsPageFeelProps {
  energy: number;
  pleasantness: number;
  selectedEmotion: string | null;
  onEnergyChange: (value: number) => void;
  onPleasantnessChange: (value: number) => void;
  onEmotionSelect: (emotion: string, quadrant: QuadrantType) => void;
  onContinue: () => void;
}

// Build emotion list with positions
const ALL_EMOTIONS: { emotion: string; quadrant: QuadrantType; energy: number; pleasantness: number }[] = [];
Object.entries(QUADRANTS).forEach(([quadrant, info]) => {
  info.emotions.forEach((emotion, i) => {
    const isHigh = quadrant.includes("high");
    const isPleasant = quadrant.includes("pleasant");
    ALL_EMOTIONS.push({
      emotion,
      quadrant: quadrant as QuadrantType,
      energy: isHigh ? 60 + (i % 5) * 8 : 10 + (i % 5) * 8,
      pleasantness: isPleasant ? 60 + (i % 5) * 8 : 10 + (i % 5) * 8,
    });
  });
});

// Bubble categories for visualization
const EMOTION_BUBBLES = [
  { id: "joy", label: "Joy", emoji: "✨", quadrant: "high-pleasant" as QuadrantType, energy: 75, pleasantness: 80 },
  { id: "peace", label: "Peace", emoji: "🍃", quadrant: "low-pleasant" as QuadrantType, energy: 25, pleasantness: 80 },
  { id: "tension", label: "Tension", emoji: "⚡", quadrant: "high-unpleasant" as QuadrantType, energy: 80, pleasantness: 25 },
  { id: "sadness", label: "Sadness", emoji: "💧", quadrant: "low-unpleasant" as QuadrantType, energy: 20, pleasantness: 25 },
  { id: "energy", label: "Energy", emoji: "🔥", quadrant: "high-pleasant" as QuadrantType, energy: 90, pleasantness: 65 },
  { id: "fear", label: "Fear", emoji: "😰", quadrant: "high-unpleasant" as QuadrantType, energy: 70, pleasantness: 15 },
];

const quadrantEmoji: Record<QuadrantType, string> = {
  "high-pleasant": "😊",
  "high-unpleasant": "😰",
  "low-unpleasant": "😔",
  "low-pleasant": "😌",
};

export function EmotionsPageFeel({
  energy,
  pleasantness,
  selectedEmotion,
  onEnergyChange,
  onPleasantnessChange,
  onEmotionSelect,
  onContinue,
}: EmotionsPageFeelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeBubble, setActiveBubble] = useState<string | null>(null);

  const currentQuadrant: QuadrantType = useMemo(() => {
    if (energy >= 50 && pleasantness >= 50) return "high-pleasant";
    if (energy >= 50 && pleasantness < 50) return "high-unpleasant";
    if (energy < 50 && pleasantness < 50) return "low-unpleasant";
    return "low-pleasant";
  }, [energy, pleasantness]);

  const quadrantInfo = QUADRANTS[currentQuadrant];

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return ALL_EMOTIONS.filter((e) => 
      e.emotion.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 6);
  }, [searchQuery]);

  const suggestedEmotions = useMemo(() => {
    const distances = ALL_EMOTIONS.map((e) => ({
      ...e,
      distance: Math.sqrt(Math.pow(e.energy - energy, 2) + Math.pow(e.pleasantness - pleasantness, 2)),
    }));
    return distances.sort((a, b) => a.distance - b.distance).slice(0, 6);
  }, [energy, pleasantness]);

  // Find closest bubble
  const closestBubble = useMemo(() => {
    let closest = EMOTION_BUBBLES[0];
    let minDist = Infinity;
    EMOTION_BUBBLES.forEach(bubble => {
      const dist = Math.sqrt(
        Math.pow(energy - bubble.energy, 2) + 
        Math.pow(pleasantness - bubble.pleasantness, 2)
      );
      if (dist < minDist) {
        minDist = dist;
        closest = bubble;
      }
    });
    return closest;
  }, [energy, pleasantness]);

  const effectiveBubble = activeBubble || (closestBubble ? closestBubble.id : null);
  const activeBubbleData = EMOTION_BUBBLES.find(b => b.id === effectiveBubble);

  const handleBubbleClick = useCallback((bubble: typeof EMOTION_BUBBLES[0]) => {
    setActiveBubble(bubble.id);
    onEnergyChange(bubble.energy);
    onPleasantnessChange(bubble.pleasantness);
  }, [onEnergyChange, onPleasantnessChange]);

  const handleEmotionClick = useCallback((emotion: string, quadrant: QuadrantType) => {
    onEmotionSelect(emotion, quadrant);
    setSearchQuery("");
  }, [onEmotionSelect]);

  const bestMatch = suggestedEmotions[0];
  const finalEmotion = selectedEmotion || bestMatch?.emotion;

  return (
    <div className="flex flex-col min-h-[calc(100vh-300px)] animate-in fade-in duration-500">
      {/* Title */}
      <h1 className="text-4xl md:text-5xl font-extralight text-center mb-16 tracking-tight">
        How are you feeling?
      </h1>

      {/* Search Bar */}
      <div className="max-w-md mx-auto w-full mb-12">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for an emotion..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 h-14 rounded-2xl text-base bg-muted/30 border-border/50 focus:border-primary/50"
          />
          {searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-card/98 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-200">
              {searchResults.map((item) => (
                <button
                  key={item.emotion}
                  onClick={() => handleEmotionClick(item.emotion, item.quadrant)}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm hover:bg-muted flex items-center gap-3 transition-colors"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: QUADRANTS[item.quadrant].color }}
                  />
                  <span className="font-medium">{item.emotion}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sliders Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        {/* Energy Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="uppercase tracking-wider font-medium">Low</span>
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="font-semibold text-amber-600">Energy</span>
            </div>
            <span className="uppercase tracking-wider font-medium">High</span>
          </div>
          <div className="relative">
            <div className="absolute inset-0 h-3 rounded-full bg-gradient-to-r from-muted via-amber-500/30 to-amber-500/60" />
            <Slider
              value={[energy]}
              onValueChange={(v) => onEnergyChange(v[0])}
              max={100}
              step={1}
              className="relative [&_[role=slider]]:h-7 [&_[role=slider]]:w-7 [&_[role=slider]]:border-2 [&_[role=slider]]:border-amber-500 [&_[role=slider]]:bg-background [&_[role=slider]]:shadow-lg"
            />
          </div>
        </div>

        {/* Pleasantness Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="uppercase tracking-wider font-medium">−</span>
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <span className="font-semibold text-emerald-600">Pleasant</span>
            </div>
            <span className="uppercase tracking-wider font-medium">+</span>
          </div>
          <div className="relative">
            <div className="absolute inset-0 h-3 rounded-full bg-gradient-to-r from-muted via-emerald-500/30 to-emerald-500/60" />
            <Slider
              value={[pleasantness]}
              onValueChange={(v) => onPleasantnessChange(v[0])}
              max={100}
              step={1}
              className="relative [&_[role=slider]]:h-7 [&_[role=slider]]:w-7 [&_[role=slider]]:border-2 [&_[role=slider]]:border-emerald-500 [&_[role=slider]]:bg-background [&_[role=slider]]:shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Emotion Bubbles */}
      <div className="flex items-center justify-center gap-4 md:gap-6 flex-wrap mb-12">
        {EMOTION_BUBBLES.map((bubble) => {
          const isActive = effectiveBubble === bubble.id;
          const distance = Math.sqrt(
            Math.pow(energy - bubble.energy, 2) + 
            Math.pow(pleasantness - bubble.pleasantness, 2)
          );
          const proximity = Math.max(0, 1 - distance / 70);
          const size = isActive ? 90 : 60 + proximity * 20;

          return (
            <button
              key={bubble.id}
              onClick={() => handleBubbleClick(bubble)}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-full cursor-pointer",
                "transition-all duration-300 ease-out border-2",
                isActive && "ring-2 ring-offset-2 ring-offset-background"
              )}
              style={{
                width: size,
                height: size,
                background: `linear-gradient(145deg, ${QUADRANTS[bubble.quadrant].color}20, ${QUADRANTS[bubble.quadrant].color}40)`,
                borderColor: isActive ? QUADRANTS[bubble.quadrant].color : `${QUADRANTS[bubble.quadrant].color}50`,
                opacity: 0.6 + proximity * 0.4,
                // @ts-expect-error - CSS custom property for ring color
                "--tw-ring-color": QUADRANTS[bubble.quadrant].color,
              }}
            >
              <span className="text-2xl">{bubble.emoji}</span>
              <span 
                className="text-[10px] font-semibold"
                style={{ color: QUADRANTS[bubble.quadrant].color }}
              >
                {bubble.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Emotion Pills - when bubble is selected */}
      {activeBubbleData && (
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="text-center mb-4">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              How do you feel within
              <span className="font-semibold" style={{ color: QUADRANTS[activeBubbleData.quadrant].color }}>
                {activeBubbleData.label}
              </span>?
            </span>
          </div>
          <div 
            className="p-6 rounded-2xl border-2 transition-colors"
            style={{ 
              background: `linear-gradient(135deg, ${QUADRANTS[activeBubbleData.quadrant].color}08, ${QUADRANTS[activeBubbleData.quadrant].color}15)`,
              borderColor: `${QUADRANTS[activeBubbleData.quadrant].color}30`
            }}
          >
            <div className="flex flex-wrap justify-center gap-3">
              {QUADRANTS[activeBubbleData.quadrant].emotions.slice(0, 8).map((emotion) => {
                const isSelected = selectedEmotion === emotion;
                return (
                  <button
                    key={emotion}
                    onClick={() => handleEmotionClick(emotion, activeBubbleData.quadrant)}
                    className={cn(
                      "px-5 py-3 rounded-xl text-sm font-medium",
                      "transition-all duration-200 border-2",
                      "hover:scale-105 active:scale-95"
                    )}
                    style={{
                      background: isSelected 
                        ? `linear-gradient(135deg, ${QUADRANTS[activeBubbleData.quadrant].color}, ${QUADRANTS[activeBubbleData.quadrant].color}DD)` 
                        : 'hsl(var(--background))',
                      borderColor: QUADRANTS[activeBubbleData.quadrant].color,
                      color: isSelected ? "white" : QUADRANTS[activeBubbleData.quadrant].color,
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

      {/* Selected Emotion Preview & Continue */}
      <div className="flex flex-col items-center gap-6 mt-auto pt-8">
        {finalEmotion && (
          <div 
            className="px-6 py-4 rounded-2xl border-2 transition-all animate-in fade-in zoom-in-95 duration-300"
            style={{
              background: `linear-gradient(135deg, ${quadrantInfo.bgColor}, ${quadrantInfo.borderColor}20)`,
              borderColor: quadrantInfo.borderColor,
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{quadrantEmoji[currentQuadrant]}</span>
              <div>
                <p className="font-semibold text-lg" style={{ color: quadrantInfo.color }}>
                  {finalEmotion}
                </p>
                <p className="text-xs text-muted-foreground">{quadrantInfo.label}</p>
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={onContinue}
          disabled={!finalEmotion}
          size="lg"
          className="h-14 px-10 rounded-2xl text-base font-semibold gap-3 transition-all duration-300 hover:scale-105 active:scale-95"
          style={{
            background: finalEmotion 
              ? `linear-gradient(135deg, ${quadrantInfo.color}, ${quadrantInfo.color}DD)` 
              : undefined,
          }}
        >
          Continue
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
