import { useState, useMemo, useCallback } from "react";
import { ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuadrantType, QUADRANTS } from "./types";
import { EmotionCircularPicker } from "./EmotionCircularPicker";
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

// Build emotion list with positions for search
const ALL_EMOTIONS: { emotion: string; quadrant: QuadrantType }[] = [];
Object.entries(QUADRANTS).forEach(([quadrant, info]) => {
  info.emotions.forEach((emotion) => {
    ALL_EMOTIONS.push({
      emotion,
      quadrant: quadrant as QuadrantType,
    });
  });
});

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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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

  const handleCategorySelect = useCallback((category: string, quadrant: QuadrantType) => {
    setSelectedCategory(category);
  }, []);

  const handleEmotionClick = useCallback((emotion: string, quadrant: QuadrantType) => {
    onEmotionSelect(emotion, quadrant);
    setSearchQuery("");
  }, [onEmotionSelect]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-300px)] animate-in fade-in duration-500">
      {/* Title */}
      <h1 className="text-4xl md:text-5xl font-extralight text-center mb-8 tracking-tight">
        How are you feeling?
      </h1>

      {/* Search Bar */}
      <div className="max-w-md mx-auto w-full mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for an emotion..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 h-12 rounded-2xl text-base bg-muted/30 border-border/50 focus:border-primary/50"
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

      {/* Emotion Wheel Picker */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <EmotionCircularPicker
          energy={energy}
          pleasantness={pleasantness}
          selectedCategory={selectedCategory}
          selectedEmotion={selectedEmotion}
          onEnergyChange={onEnergyChange}
          onPleasantnessChange={onPleasantnessChange}
          onCategorySelect={handleCategorySelect}
          onEmotionSelect={handleEmotionClick}
        />
      </div>

      {/* Selected Emotion Preview & Continue */}
      <div className="flex flex-col items-center gap-4 mt-6 pt-6">
        {selectedEmotion && (
          <div 
            className="px-5 py-3 rounded-xl border-2 transition-all animate-in fade-in zoom-in-95 duration-300"
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

        <Button
          onClick={onContinue}
          disabled={!selectedEmotion}
          size="lg"
          className="h-12 px-8 rounded-xl text-base font-semibold gap-2 transition-all duration-300 hover:scale-105 active:scale-95"
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
  );
}
