import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { Search, Quote } from "lucide-react";
import { QuadrantType, QUADRANTS, EMOTION_DESCRIPTIONS } from "./types";
import { cn } from "@/lib/utils";

interface EmotionSliderPickerProps {
  onSelect: (quadrant: QuadrantType, emotion: string) => void;
  initialQuadrant?: QuadrantType;
  initialEmotion?: string;
  compact?: boolean;
}

const EMOTION_QUOTES: Record<QuadrantType, string[]> = {
  "high-pleasant": ["Joy is not in things; it is in us.", "Happiness is a direction, not a place."],
  "high-unpleasant": ["Feel the feeling, but don't become it.", "This too shall pass."],
  "low-unpleasant": ["It's okay to not be okay.", "Be gentle with yourself today."],
  "low-pleasant": ["Peace comes from within.", "In stillness, we find ourselves."],
};

const getDailyQuote = (quadrant: QuadrantType, emotion: string): string => {
  const quotes = EMOTION_QUOTES[quadrant];
  const hash = (new Date().toDateString() + emotion).split("").reduce((a, b) => a + b.charCodeAt(0), 0);
  return quotes[hash % quotes.length];
};

const ALL_EMOTIONS: { emotion: string; quadrant: QuadrantType; energy: number; pleasantness: number }[] = [];
QUADRANTS["high-pleasant"].emotions.forEach((e) =>
  ALL_EMOTIONS.push({
    emotion: e,
    quadrant: "high-pleasant",
    energy: 60 + Math.random() * 35,
    pleasantness: 60 + Math.random() * 35,
  }),
);
QUADRANTS["high-unpleasant"].emotions.forEach((e) =>
  ALL_EMOTIONS.push({
    emotion: e,
    quadrant: "high-unpleasant",
    energy: 60 + Math.random() * 35,
    pleasantness: 5 + Math.random() * 35,
  }),
);
QUADRANTS["low-unpleasant"].emotions.forEach((e) =>
  ALL_EMOTIONS.push({
    emotion: e,
    quadrant: "low-unpleasant",
    energy: 5 + Math.random() * 35,
    pleasantness: 5 + Math.random() * 35,
  }),
);
QUADRANTS["low-pleasant"].emotions.forEach((e) =>
  ALL_EMOTIONS.push({
    emotion: e,
    quadrant: "low-pleasant",
    energy: 5 + Math.random() * 35,
    pleasantness: 60 + Math.random() * 35,
  }),
);

const quadrantEmoji: Record<QuadrantType, string> = {
  "high-pleasant": "😊",
  "high-unpleasant": "😰",
  "low-unpleasant": "😔",
  "low-pleasant": "😌",
};

export function EmotionSliderPicker({ onSelect, initialQuadrant, initialEmotion, compact }: EmotionSliderPickerProps) {
  const getInitialEnergy = () =>
    initialQuadrant?.startsWith("high") ? 75 : initialQuadrant?.startsWith("low") ? 25 : 50;
  const getInitialPleasantness = () =>
    initialQuadrant?.endsWith("pleasant") && !initialQuadrant?.includes("unpleasant")
      ? 75
      : initialQuadrant?.includes("unpleasant")
        ? 25
        : 50;

  const [energy, setEnergy] = useState(getInitialEnergy());
  const [pleasantness, setPleasantness] = useState(getInitialPleasantness());
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(initialEmotion || null);
  const [searchQuery, setSearchQuery] = useState("");

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return ALL_EMOTIONS.filter((e) => e.emotion.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 8);
  }, [searchQuery]);

  const suggestedEmotions = useMemo(() => {
    const distances = ALL_EMOTIONS.map((e) => ({
      ...e,
      distance: Math.sqrt(Math.pow(e.energy - energy, 2) + Math.pow(e.pleasantness - pleasantness, 2)),
    }));
    return distances.sort((a, b) => a.distance - b.distance).slice(0, 5);
  }, [energy, pleasantness]);

  const bestMatch = suggestedEmotions[0];

  const currentQuadrant: QuadrantType = useMemo(() => {
    if (energy >= 50 && pleasantness >= 50) return "high-pleasant";
    if (energy >= 50 && pleasantness < 50) return "high-unpleasant";
    if (energy < 50 && pleasantness < 50) return "low-unpleasant";
    return "low-pleasant";
  }, [energy, pleasantness]);

  const quadrantInfo = QUADRANTS[currentQuadrant];

  const handleEmotionClick = (emotion: string, quadrant: QuadrantType) => {
    setSelectedEmotion(emotion);
    const emotionData = ALL_EMOTIONS.find((e) => e.emotion === emotion && e.quadrant === quadrant);
    if (emotionData) {
      setEnergy(Math.round(emotionData.energy));
      setPleasantness(Math.round(emotionData.pleasantness));
    }
    if (compact) onSelect(quadrant, emotion);
  };

  const handleConfirm = () => {
    const emotionToSave = selectedEmotion || bestMatch?.emotion;
    const quadrant = selectedEmotion
      ? suggestedEmotions.find((e) => e.emotion === selectedEmotion)?.quadrant || currentQuadrant
      : bestMatch?.quadrant || currentQuadrant;
    if (emotionToSave) onSelect(quadrant, emotionToSave);
  };

  return (
    <div className={cn("w-full mx-auto", compact ? "space-y-3" : "max-w-md space-y-4")}>
      {!compact && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search any emotion..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 rounded-xl text-sm"
          />
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-card border rounded-xl shadow-lg p-2 space-y-1">
              {searchResults.map((item) => (
                <button
                  key={item.emotion}
                  onClick={() => {
                    handleEmotionClick(item.emotion, item.quadrant);
                    setSearchQuery("");
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: QUADRANTS[item.quadrant].color }} />
                  <span className="text-sm">{item.emotion}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{QUADRANTS[item.quadrant].label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Energy Slider */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Low Energy</span>
          <span className="font-medium">{energy}%</span>
          <span className="text-muted-foreground">High Energy</span>
        </div>
        <Slider value={[energy]} onValueChange={(v) => setEnergy(v[0])} max={100} step={1} className="w-full" />
      </div>

      {/* Pleasantness Slider */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Unpleasant</span>
          <span className="font-medium">{pleasantness}%</span>
          <span className="text-muted-foreground">Pleasant</span>
        </div>
        <Slider
          value={[pleasantness]}
          onValueChange={(v) => setPleasantness(v[0])}
          max={100}
          step={1}
          className="w-full"
        />
      </div>

      {/* Current Zone */}
      <div
        className="rounded-xl p-3 border transition-all"
        style={{ backgroundColor: quadrantInfo.bgColor, borderColor: quadrantInfo.borderColor }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{quadrantEmoji[currentQuadrant]}</span>
          <div>
            <p className="font-medium text-sm" style={{ color: quadrantInfo.color }}>
              {quadrantInfo.label}
            </p>
            <p className="text-[10px] text-muted-foreground">{quadrantInfo.description}</p>
          </div>
        </div>
      </div>

      {/* Suggested Emotions */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground text-center">Suggested emotions:</p>
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
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
                      isSelected || (isTopMatch && !selectedEmotion) ? "scale-105 shadow-sm" : "hover:scale-[1.02]",
                    )}
                    style={{
                      backgroundColor:
                        isSelected || (isTopMatch && !selectedEmotion) ? emotionQuadrant.color : "transparent",
                      borderColor: emotionQuadrant.borderColor,
                      color: isSelected || (isTopMatch && !selectedEmotion) ? "white" : emotionQuadrant.color,
                    }}
                  >
                    {item.emotion}
                    {isTopMatch && !selectedEmotion && <span className="ml-1 text-xs opacity-80">✓</span>}
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
      {!compact && (
        <div className="space-y-3">
          <Button
            onClick={handleConfirm}
            disabled={!bestMatch && !selectedEmotion}
            className="w-full h-10 rounded-xl text-sm"
          >
            Continue with {selectedEmotion || bestMatch?.emotion || "selection"}
          </Button>

          {(selectedEmotion || bestMatch) && (
            <div className="flex items-start gap-2 p-2 rounded-xl bg-muted/50">
              <Quote className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground italic">
                "
                {getDailyQuote(
                  selectedEmotion
                    ? suggestedEmotions.find((e) => e.emotion === selectedEmotion)?.quadrant || currentQuadrant
                    : bestMatch?.quadrant || currentQuadrant,
                  selectedEmotion || bestMatch?.emotion || "",
                )}
                "
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
