import { useState, useMemo, useCallback } from "react";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuadrantType, QUADRANTS } from "./types";
import { EmotionCircularPicker } from "./EmotionCircularPicker";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface EmotionsPageFeelProps {
  energy: number;
  pleasantness: number;
  selectedEmotion: string | null;
  onEnergyChange: (value: number) => void;
  onPleasantnessChange: (value: number) => void;
  onEmotionSelect: (emotion: string, quadrant: QuadrantType) => void;
  onContinue: () => void;
}

const quadrantEmoji: Record<QuadrantType, string> = {
  "high-pleasant": "😊",
  "high-unpleasant": "😰",
  "low-unpleasant": "😔",
  "low-pleasant": "😌",
};

const EMOTION_CONTENT = {
  badge: "Emotion Tracker",
  title: {
    line1: "Understand Your",
    line2: "Emotional Patterns"
  },
  description: `Track your emotional state using the energy and pleasantness dimensions. This science-backed approach helps you recognize patterns, understand triggers, and develop greater emotional intelligence over time.`,
  features: [
    "Map emotions on a 2D spectrum",
    "Identify your emotional patterns",
    "Get personalized regulation strategies"
  ]
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const currentQuadrant: QuadrantType = useMemo(() => {
    if (energy >= 50 && pleasantness >= 50) return "high-pleasant";
    if (energy >= 50 && pleasantness < 50) return "high-unpleasant";
    if (energy < 50 && pleasantness < 50) return "low-unpleasant";
    return "low-pleasant";
  }, [energy, pleasantness]);

  const quadrantInfo = QUADRANTS[currentQuadrant];

  const handleCategorySelect = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  const handleEmotionClick = useCallback((emotion: string, quadrant: QuadrantType) => {
    onEmotionSelect(emotion, quadrant);
  }, [onEmotionSelect]);

  // Responsive wheel size
  const wheelSize = isMobile ? 340 : 520;

  return (
    <div className="flex flex-col min-h-[calc(100vh-300px)] animate-in fade-in duration-500">
      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 flex-1">
        
        {/* Left: Emotion Description Card */}
        <div className="flex flex-col justify-center order-2 lg:order-1">
          <div className="space-y-6 max-w-md">
            {/* Badge */}
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              {EMOTION_CONTENT.badge}
            </span>
            
            {/* Title */}
            <h2 className="text-3xl md:text-4xl font-light leading-tight">
              {EMOTION_CONTENT.title.line1}{" "}
              <span className="font-semibold">{EMOTION_CONTENT.title.line2}</span>
            </h2>
            
            {/* Description */}
            <p className="text-muted-foreground text-lg leading-relaxed">
              {EMOTION_CONTENT.description}
            </p>
            
            {/* Features */}
            <ul className="space-y-3">
              {EMOTION_CONTENT.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-muted-foreground">
                  <Check className="h-5 w-5 text-primary shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            {/* Selected Emotion Preview (on desktop, shows here) */}
            {selectedEmotion && !isMobile && (
              <div 
                className="px-5 py-3 rounded-xl border-2 transition-all animate-in fade-in zoom-in-95 duration-300 mt-6"
                style={{
                  background: `linear-gradient(135deg, ${quadrantInfo.bgColor}, ${quadrantInfo.borderColor}20)`,
                  borderColor: quadrantInfo.borderColor,
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{quadrantEmoji[currentQuadrant]}</span>
                  <div>
                    <p className="font-semibold" style={{ color: quadrantInfo.color }}>
                      {selectedEmotion}
                    </p>
                    <p className="text-xs text-muted-foreground">{quadrantInfo.label}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Right: Wheel */}
        <div className="flex flex-col items-center justify-center order-1 lg:order-2">
          <EmotionCircularPicker
            energy={energy}
            pleasantness={pleasantness}
            selectedCategory={selectedCategory}
            selectedEmotion={selectedEmotion}
            onEnergyChange={onEnergyChange}
            onPleasantnessChange={onPleasantnessChange}
            onCategorySelect={handleCategorySelect}
            onEmotionSelect={handleEmotionClick}
            size={wheelSize}
          />

          {/* Selected Emotion Preview (on mobile, shows below wheel) */}
          {selectedEmotion && isMobile && (
            <div 
              className="px-5 py-3 rounded-xl border-2 transition-all animate-in fade-in zoom-in-95 duration-300 mt-6"
              style={{
                background: `linear-gradient(135deg, ${quadrantInfo.bgColor}, ${quadrantInfo.borderColor}20)`,
                borderColor: quadrantInfo.borderColor,
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{quadrantEmoji[currentQuadrant]}</span>
                <div>
                  <p className="font-semibold" style={{ color: quadrantInfo.color }}>
                    {selectedEmotion}
                  </p>
                  <p className="text-xs text-muted-foreground">{quadrantInfo.label}</p>
                </div>
              </div>
            </div>
          )}

          {/* Continue Button */}
          <Button
            onClick={onContinue}
            disabled={!selectedEmotion}
            size="lg"
            className="h-12 px-8 rounded-xl text-base font-semibold gap-2 transition-all duration-300 hover:scale-105 active:scale-95 mt-6"
            style={{
              background: selectedEmotion 
                ? `linear-gradient(135deg, ${quadrantInfo.color}, ${quadrantInfo.color}DD)` 
                : undefined,
            }}
          >
            Continue
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
