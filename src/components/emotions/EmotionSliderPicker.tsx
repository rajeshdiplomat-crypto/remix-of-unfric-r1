import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { Search, Quote, Sparkles } from "lucide-react";
import { QuadrantType, QUADRANTS, EMOTION_DESCRIPTIONS } from "./types";
import { cn } from "@/lib/utils";

interface EmotionSliderPickerProps {
  onSelect: (quadrant: QuadrantType, emotion: string) => void;
  initialQuadrant?: QuadrantType;
  initialEmotion?: string;
  compact?: boolean;
}

const EMOTION_QUOTES: Record<QuadrantType, string[]> = {
  "high-pleasant": [
    "Joy is not in things; it is in us.",
    "Happiness is a direction, not a place.",
    "The purpose of life is to be happy.",
    "Let your joy be in your journey.",
  ],
  "high-unpleasant": [
    "Feel the feeling, but don't become it.",
    "Between stimulus and response, there is space.",
    "This too shall pass.",
    "Breathe. You're going to be okay.",
  ],
  "low-unpleasant": [
    "It's okay to not be okay.",
    "The wound is where the light enters.",
    "Even the darkest night will end.",
    "Be gentle with yourself today.",
  ],
  "low-pleasant": [
    "Peace comes from within.",
    "In stillness, we find ourselves.",
    "Calm mind brings inner strength.",
    "Rest is not idleness.",
  ],
};

const getDailyQuote = (quadrant: QuadrantType, emotion: string): string => {
  const quotes = EMOTION_QUOTES[quadrant];
  const today = new Date().toDateString();
  const hash = (today + emotion).split("").reduce((a, b) => a + b.charCodeAt(0), 0);
  return quotes[hash % quotes.length];
};

const ALL_EMOTIONS: { emotion: string; quadrant: QuadrantType; energy: number; pleasantness: number }[] = [];

QUADRANTS["high-pleasant"].emotions.forEach((emotion) => {
  ALL_EMOTIONS.push({
    emotion,
    quadrant: "high-pleasant",
    energy: 60 + Math.random() * 35,
    pleasantness: 60 + Math.random() * 35,
  });
});
QUADRANTS["high-unpleasant"].emotions.forEach((emotion) => {
  ALL_EMOTIONS.push({
    emotion,
    quadrant: "high-unpleasant",
    energy: 60 + Math.random() * 35,
    pleasantness: 5 + Math.random() * 35,
  });
});
QUADRANTS["low-unpleasant"].emotions.forEach((emotion) => {
  ALL_EMOTIONS.push({
    emotion,
    quadrant: "low-unpleasant",
    energy: 5 + Math.random() * 35,
    pleasantness: 5 + Math.random() * 35,
  });
});
QUADRANTS["low-pleasant"].emotions.forEach((emotion) => {
  ALL_EMOTIONS.push({
    emotion,
    quadrant: "low-pleasant",
    energy: 5 + Math.random() * 35,
    pleasantness: 60 + Math.random() * 35,
  });
});

const quadrantEmoji: Record<QuadrantType, string> = {
  "high-pleasant": "😊",
  "high-unpleasant": "😰",
  "low-unpleasant": "😔",
  "low-pleasant": "😌",
};

const quadrantGradient: Record<QuadrantType, string> = {
  "high-pleasant": "from-yellow-400 to-orange-400",
  "high-unpleasant": "from-red-400 to-rose-500",
  "low-unpleasant": "from-blue-400 to-indigo-500",
  "low-pleasant": "from-green-400 to-teal-500",
};

export function EmotionSliderPicker({ onSelect, initialQuadrant, initialEmotion, compact }: EmotionSliderPickerProps) {
  const getInitialEnergy = () => {
    if (initialQuadrant?.startsWith("high")) return 75;
    if (initialQuadrant?.startsWith("low")) return 25;
    return 50;
  };
  const getInitialPleasantness = () => {
    if (initialQuadrant?.endsWith("pleasant") && !initialQuadrant?.includes("unpleasant")) return 75;
    if (initialQuadrant?.includes("unpleasant")) return 25;
    return 50;
  };

  const [energy, setEnergy] = useState(getInitialEnergy());
  const [pleasantness, setPleasantness] = useState(getInitialPleasantness());
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(initialEmotion || null);
  const [searchQuery, setSearchQuery] = useState("");

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return ALL_EMOTIONS.filter((e) => e.emotion.toLowerCase().includes(query)).slice(0, 8);
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
    <div className={cn("w-full mx-auto", compact ? "space-y-4" : "max-w-md space-y-6")}>
      {/* Search */}
      {!compact && (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search any emotion..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          />
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2 space-y-1">
              {searchResults.map((item) => (
                <button
                  key={item.emotion}
                  onClick={() => {
                    handleEmotionClick(item.emotion, item.quadrant);
                    setSearchQuery("");
                  }}
                  className="w-full text-left px-4 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                >
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: QUADRANTS[item.quadrant].color }} />
                  <span className="text-sm font-medium">{item.emotion}</span>
                  <span className="text-xs text-slate-400 ml-auto">{QUADRANTS[item.quadrant].label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Energy Slider */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-500">Low Energy</span>
          <span className="text-lg font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            {energy}%
          </span>
          <span className="text-sm text-slate-500">High Energy</span>
        </div>
        <div className="relative">
          <div
            className="absolute inset-0 h-3 rounded-full bg-gradient-to-r from-blue-100 via-purple-100 to-rose-100 dark:from-blue-900/30 dark:via-purple-900/30 dark:to-rose-900/30"
            style={{ top: "50%", transform: "translateY(-50%)" }}
          />
          <Slider
            value={[energy]}
            onValueChange={(v) => setEnergy(v[0])}
            max={100}
            step={1}
            className="w-full relative z-10"
          />
        </div>
      </div>

      {/* Pleasantness Slider */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-500">Unpleasant</span>
          <span className="text-lg font-bold bg-gradient-to-r from-rose-500 to-green-500 bg-clip-text text-transparent">
            {pleasantness}%
          </span>
          <span className="text-sm text-slate-500">Pleasant</span>
        </div>
        <div className="relative">
          <div
            className="absolute inset-0 h-3 rounded-full bg-gradient-to-r from-rose-100 via-yellow-100 to-green-100 dark:from-rose-900/30 dark:via-yellow-900/30 dark:to-green-900/30"
            style={{ top: "50%", transform: "translateY(-50%)" }}
          />
          <Slider
            value={[pleasantness]}
            onValueChange={(v) => setPleasantness(v[0])}
            max={100}
            step={1}
            className="w-full relative z-10"
          />
        </div>
      </div>

      {/* Current Zone */}
      <div
        className={cn(
          "rounded-2xl p-5 text-center transition-all duration-300 bg-gradient-to-br",
          quadrantGradient[currentQuadrant],
        )}
      >
        <span className="text-4xl mb-2 block">{quadrantEmoji[currentQuadrant]}</span>
        <p className="font-semibold text-white text-lg">{quadrantInfo.label}</p>
        <p className="text-white/80 text-sm">{quadrantInfo.description}</p>
      </div>

      {/* Suggested Emotions */}
      <div className="space-y-3">
        <p className="text-sm text-slate-500 text-center">Suggested emotions:</p>
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
                      "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                      "border-2 focus:outline-none",
                      isSelected || (isTopMatch && !selectedEmotion)
                        ? "scale-105 shadow-lg text-white border-transparent"
                        : "hover:scale-105 bg-white dark:bg-slate-800",
                    )}
                    style={{
                      backgroundColor:
                        isSelected || (isTopMatch && !selectedEmotion) ? emotionQuadrant.color : undefined,
                      borderColor:
                        isSelected || (isTopMatch && !selectedEmotion) ? "transparent" : emotionQuadrant.borderColor,
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
                    <p className="text-xs text-slate-500">{description}</p>
                  </HoverCardContent>
                )}
              </HoverCard>
            );
          })}
        </div>
      </div>

      {/* Confirm Button */}
      {!compact && (
        <div className="space-y-4">
          <Button
            onClick={handleConfirm}
            disabled={!bestMatch && !selectedEmotion}
            className={cn(
              "w-full h-12 rounded-xl text-white font-medium text-base shadow-lg bg-gradient-to-r",
              quadrantGradient[currentQuadrant],
            )}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Continue with {selectedEmotion || bestMatch?.emotion || "selection"}
          </Button>

          {(selectedEmotion || bestMatch) && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <Quote className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-500 italic">
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
