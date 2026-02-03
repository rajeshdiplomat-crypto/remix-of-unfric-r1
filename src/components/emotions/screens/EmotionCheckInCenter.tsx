import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { QuadrantType, QUADRANTS, EMOTION_DESCRIPTIONS } from "../types";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface EmotionCheckInCenterProps {
  onContinue: (quadrant: QuadrantType, emotion: string) => void;
}

// Build emotion map with approximate slider positions
const ALL_EMOTIONS: { emotion: string; quadrant: QuadrantType; energy: number; pleasantness: number }[] = [];
QUADRANTS["high-pleasant"].emotions.forEach((e, i) =>
  ALL_EMOTIONS.push({
    emotion: e,
    quadrant: "high-pleasant",
    energy: 60 + (i % 5) * 8,
    pleasantness: 60 + (i % 5) * 8,
  }),
);
QUADRANTS["high-unpleasant"].emotions.forEach((e, i) =>
  ALL_EMOTIONS.push({
    emotion: e,
    quadrant: "high-unpleasant",
    energy: 60 + (i % 5) * 8,
    pleasantness: 10 + (i % 5) * 8,
  }),
);
QUADRANTS["low-unpleasant"].emotions.forEach((e, i) =>
  ALL_EMOTIONS.push({
    emotion: e,
    quadrant: "low-unpleasant",
    energy: 10 + (i % 5) * 8,
    pleasantness: 10 + (i % 5) * 8,
  }),
);
QUADRANTS["low-pleasant"].emotions.forEach((e, i) =>
  ALL_EMOTIONS.push({
    emotion: e,
    quadrant: "low-pleasant",
    energy: 10 + (i % 5) * 8,
    pleasantness: 60 + (i % 5) * 8,
  }),
);

const quadrantEmoji: Record<QuadrantType, string> = {
  "high-pleasant": "😊",
  "high-unpleasant": "😰",
  "low-unpleasant": "😔",
  "low-pleasant": "😌",
};

/**
 * Screen 1: Emotional Check-In Center
 * - Title & subtitle
 * - Energy slider (Low → High)
 * - Pleasantness slider (Unpleasant → Pleasant)
 * - Detected Zone card
 * - Suggested emotion chips (max 4)
 * - Continue CTA
 */
export function EmotionCheckInCenter({ onContinue }: EmotionCheckInCenterProps) {
  const [energy, setEnergy] = useState(50);
  const [pleasantness, setPleasantness] = useState(50);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);

  // Compute current quadrant from sliders
  const currentQuadrant: QuadrantType = useMemo(() => {
    if (energy >= 50 && pleasantness >= 50) return "high-pleasant";
    if (energy >= 50 && pleasantness < 50) return "high-unpleasant";
    if (energy < 50 && pleasantness < 50) return "low-unpleasant";
    return "low-pleasant";
  }, [energy, pleasantness]);

  const quadrantInfo = QUADRANTS[currentQuadrant];

  // Get 4 closest emotions based on slider position
  const suggestedEmotions = useMemo(() => {
    const distances = ALL_EMOTIONS.map((e) => ({
      ...e,
      distance: Math.sqrt(Math.pow(e.energy - energy, 2) + Math.pow(e.pleasantness - pleasantness, 2)),
    }));
    return distances.sort((a, b) => a.distance - b.distance).slice(0, 4);
  }, [energy, pleasantness]);

  const bestMatch = suggestedEmotions[0];

  const handleEmotionClick = (emotion: string, quadrant: QuadrantType) => {
    setSelectedEmotion(emotion);
    // Optionally sync sliders to emotion position
    const emotionData = ALL_EMOTIONS.find((e) => e.emotion === emotion && e.quadrant === quadrant);
    if (emotionData) {
      setEnergy(emotionData.energy);
      setPleasantness(emotionData.pleasantness);
    }
  };

  const handleContinue = () => {
    const emotionToSave = selectedEmotion || bestMatch?.emotion;
    const quadrant = selectedEmotion
      ? suggestedEmotions.find((e) => e.emotion === selectedEmotion)?.quadrant || currentQuadrant
      : bestMatch?.quadrant || currentQuadrant;
    
    if (emotionToSave) {
      onContinue(quadrant, emotionToSave);
    }
  };

  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">
          Emotional Check-in
        </h1>
        <p className="text-muted-foreground">
          How are you feeling right now?
        </p>
      </div>

      {/* Sliders */}
      <div className="space-y-6 max-w-md mx-auto">
        {/* Energy Slider */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Low Energy</span>
            <span className="font-medium text-foreground">{energy}%</span>
            <span className="text-muted-foreground">High Energy</span>
          </div>
          <Slider
            value={[energy]}
            onValueChange={(v) => setEnergy(v[0])}
            max={100}
            step={1}
            className="w-full"
            aria-label="Energy level slider"
          />
        </div>

        {/* Pleasantness Slider */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Unpleasant</span>
            <span className="font-medium text-foreground">{pleasantness}%</span>
            <span className="text-muted-foreground">Pleasant</span>
          </div>
          <Slider
            value={[pleasantness]}
            onValueChange={(v) => setPleasantness(v[0])}
            max={100}
            step={1}
            className="w-full"
            aria-label="Pleasantness level slider"
          />
        </div>
      </div>

      {/* Detected Zone Card */}
      <div
        className="rounded-2xl p-4 border transition-all max-w-md mx-auto"
        style={{
          backgroundColor: quadrantInfo.bgColor,
          borderColor: quadrantInfo.borderColor,
        }}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">
            {quadrantEmoji[currentQuadrant]}
          </span>
          <div>
            <p
              className="font-semibold text-sm"
              style={{ color: quadrantInfo.color }}
            >
              {quadrantInfo.label}
            </p>
            <p className="text-xs text-muted-foreground">
              {quadrantInfo.description}
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Emotion Chips (max 4) */}
      <div className="space-y-3 max-w-md mx-auto">
        <p className="text-sm text-muted-foreground text-center">
          Select how you feel:
        </p>
        <div 
          className="flex flex-wrap gap-2 justify-center"
          role="group"
          aria-label="Suggested emotions"
        >
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
                      "px-4 py-2 rounded-full text-sm font-medium transition-all border-2 focus:outline-none focus:ring-2 focus:ring-offset-2",
                      isSelected || (isTopMatch && !selectedEmotion)
                        ? "scale-105 shadow-md"
                        : "hover:scale-[1.02]",
                    )}
                    style={{
                      backgroundColor:
                        isSelected || (isTopMatch && !selectedEmotion)
                          ? emotionQuadrant.color
                          : "transparent",
                      borderColor: emotionQuadrant.borderColor,
                      color:
                        isSelected || (isTopMatch && !selectedEmotion)
                          ? "white"
                          : emotionQuadrant.color,
                    }}
                    aria-pressed={isSelected || (isTopMatch && !selectedEmotion)}
                  >
                    {item.emotion}
                  </button>
                </HoverCardTrigger>
                {description && (
                  <HoverCardContent side="top" className="w-64 p-3 rounded-xl">
                    <p
                      className="font-medium text-sm mb-1"
                      style={{ color: emotionQuadrant.color }}
                    >
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

      {/* Primary CTA */}
      <div className="max-w-md mx-auto">
        <Button
          onClick={handleContinue}
          disabled={!bestMatch && !selectedEmotion}
          className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white border-0"
          aria-label={`Continue with ${selectedEmotion || bestMatch?.emotion || "selection"}`}
        >
          Continue
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
