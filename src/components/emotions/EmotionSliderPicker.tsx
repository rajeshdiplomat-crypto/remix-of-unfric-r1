import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

// Daily changing quotes by emotion quadrant
const EMOTION_QUOTES: Record<QuadrantType, string[]> = {
  'high-pleasant': [
    "Joy is not in things; it is in us.",
    "Happiness is a direction, not a place.",
    "The purpose of life is to be happy.",
    "Let your joy be in your journey.",
    "Enthusiasm is the electricity of life.",
    "Celebrate every tiny victory.",
    "Your energy introduces you before you speak.",
  ],
  'high-unpleasant': [
    "Feel the feeling, but don't become it.",
    "Anger is one letter short of danger.",
    "Between stimulus and response, there is space.",
    "This too shall pass.",
    "Your emotions are valid, your reactions are choices.",
    "Breathe. You're going to be okay.",
    "Strong emotions mean you care deeply.",
  ],
  'low-unpleasant': [
    "It's okay to not be okay.",
    "The wound is where the light enters.",
    "Even the darkest night will end.",
    "You are allowed to rest.",
    "Healing is not linear.",
    "Be gentle with yourself today.",
    "Every storm runs out of rain.",
  ],
  'low-pleasant': [
    "Peace comes from within.",
    "In stillness, we find ourselves.",
    "Calm mind brings inner strength.",
    "Serenity is not freedom from the storm.",
    "Rest is not idleness.",
    "Embrace the quiet moments.",
    "Contentment is the greatest wealth.",
  ],
};

const getDailyQuote = (quadrant: QuadrantType, emotion: string): string => {
  const quotes = EMOTION_QUOTES[quadrant];
  // Use date + emotion to create a consistent daily selection
  const today = new Date().toDateString();
  const hash = (today + emotion).split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return quotes[hash % quotes.length];
};

// Flatten all emotions with their quadrant and coordinates
const ALL_EMOTIONS: { emotion: string; quadrant: QuadrantType; energy: number; pleasantness: number }[] = [];

// High-Pleasant (high energy, high pleasantness)
QUADRANTS['high-pleasant'].emotions.forEach((emotion, i) => {
  ALL_EMOTIONS.push({
    emotion,
    quadrant: 'high-pleasant',
    energy: 60 + Math.random() * 35,
    pleasantness: 60 + Math.random() * 35
  });
});

// High-Unpleasant (high energy, low pleasantness)
QUADRANTS['high-unpleasant'].emotions.forEach((emotion, i) => {
  ALL_EMOTIONS.push({
    emotion,
    quadrant: 'high-unpleasant',
    energy: 60 + Math.random() * 35,
    pleasantness: 5 + Math.random() * 35
  });
});

// Low-Unpleasant (low energy, low pleasantness)
QUADRANTS['low-unpleasant'].emotions.forEach((emotion, i) => {
  ALL_EMOTIONS.push({
    emotion,
    quadrant: 'low-unpleasant',
    energy: 5 + Math.random() * 35,
    pleasantness: 5 + Math.random() * 35
  });
});

// Low-Pleasant (low energy, high pleasantness)
QUADRANTS['low-pleasant'].emotions.forEach((emotion, i) => {
  ALL_EMOTIONS.push({
    emotion,
    quadrant: 'low-pleasant',
    energy: 5 + Math.random() * 35,
    pleasantness: 60 + Math.random() * 35
  });
});

export function EmotionSliderPicker({ onSelect, initialQuadrant, initialEmotion, compact }: EmotionSliderPickerProps) {
  // Calculate initial slider values based on initialQuadrant
  const getInitialEnergy = () => {
    if (initialQuadrant?.startsWith('high')) return 75;
    if (initialQuadrant?.startsWith('low')) return 25;
    return 50;
  };
  const getInitialPleasantness = () => {
    if (initialQuadrant?.endsWith('pleasant') && !initialQuadrant?.includes('unpleasant')) return 75;
    if (initialQuadrant?.includes('unpleasant')) return 25;
    return 50;
  };
  
  const [energy, setEnergy] = useState(getInitialEnergy());
  const [pleasantness, setPleasantness] = useState(getInitialPleasantness());
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(initialEmotion || null);
  const [searchQuery, setSearchQuery] = useState("");

  // Search results from all emotions
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return ALL_EMOTIONS.filter(e => 
      e.emotion.toLowerCase().includes(query)
    ).slice(0, 8);
  }, [searchQuery]);

  // Calculate distance to find closest emotions
  const suggestedEmotions = useMemo(() => {
    const distances = ALL_EMOTIONS.map(e => ({
      ...e,
      distance: Math.sqrt(
        Math.pow(e.energy - energy, 2) + 
        Math.pow(e.pleasantness - pleasantness, 2)
      )
    }));
    
    // Sort by distance and take top 5
    return distances.sort((a, b) => a.distance - b.distance).slice(0, 5);
  }, [energy, pleasantness]);

  const bestMatch = suggestedEmotions[0];
  
  // Determine current quadrant based on slider values
  const currentQuadrant: QuadrantType = useMemo(() => {
    if (energy >= 50 && pleasantness >= 50) return 'high-pleasant';
    if (energy >= 50 && pleasantness < 50) return 'high-unpleasant';
    if (energy < 50 && pleasantness < 50) return 'low-unpleasant';
    return 'low-pleasant';
  }, [energy, pleasantness]);

  const quadrantInfo = QUADRANTS[currentQuadrant];

  const handleEmotionClick = (emotion: string, quadrant: QuadrantType) => {
    setSelectedEmotion(emotion);
    
    // Find the emotion's coordinates and update sliders
    const emotionData = ALL_EMOTIONS.find(e => e.emotion === emotion && e.quadrant === quadrant);
    if (emotionData) {
      setEnergy(Math.round(emotionData.energy));
      setPleasantness(Math.round(emotionData.pleasantness));
    }
    
    // In compact mode, immediately call onSelect
    if (compact) {
      onSelect(quadrant, emotion);
    }
  };

  const handleConfirm = () => {
    const emotionToSave = selectedEmotion || bestMatch?.emotion;
    const quadrant = selectedEmotion 
      ? suggestedEmotions.find(e => e.emotion === selectedEmotion)?.quadrant || currentQuadrant
      : bestMatch?.quadrant || currentQuadrant;
    
    if (emotionToSave) {
      onSelect(quadrant, emotionToSave);
    }
  };

  return (
    <div className={cn("w-full mx-auto", compact ? "space-y-4" : "max-w-md space-y-6")}>
      {!compact && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">How are you feeling right now?</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Adjust the sliders or search for an emotion</p>
        </div>
      )}

      {/* Search Bar */}
      {!compact && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search any emotion..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg p-2 space-y-1">
              {searchResults.map((item) => {
                const emotionQuadrant = QUADRANTS[item.quadrant];
                return (
                  <button
                    key={item.emotion}
                    onClick={() => {
                      handleEmotionClick(item.emotion, item.quadrant);
                      setSearchQuery("");
                    }}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-accent/50 flex items-center gap-2 transition-colors"
                  >
                    <span 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: emotionQuadrant.color }}
                    />
                    <span className="text-sm">{item.emotion}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {emotionQuadrant.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Energy Slider */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Low Energy</span>
          <span className="font-medium">{energy}%</span>
          <span className="text-muted-foreground">High Energy</span>
        </div>
        <Slider
          value={[energy]}
          onValueChange={(v) => setEnergy(v[0])}
          max={100}
          step={1}
          className="w-full"
        />
      </div>

      {/* Pleasantness Slider */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
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

      {/* Current Zone Indicator */}
      <div 
        className="rounded-xl p-4 transition-all duration-300"
        style={{ 
          backgroundColor: quadrantInfo.bgColor,
          borderColor: quadrantInfo.borderColor,
          borderWidth: '2px',
          borderStyle: 'solid'
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">
            {currentQuadrant === 'high-pleasant' && '😊'}
            {currentQuadrant === 'high-unpleasant' && '😰'}
            {currentQuadrant === 'low-unpleasant' && '😔'}
            {currentQuadrant === 'low-pleasant' && '😌'}
          </span>
          <div>
            <p className="font-medium text-sm" style={{ color: quadrantInfo.color }}>
              {quadrantInfo.label}
            </p>
            <p className="text-xs text-muted-foreground">{quadrantInfo.description}</p>
          </div>
        </div>
      </div>

      {/* Suggested Emotions */}
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground text-center">
          Suggested emotions based on your selection:
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
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150",
                      "border focus:outline-none focus:ring-2 focus:ring-offset-2",
                      isSelected || (isTopMatch && !selectedEmotion)
                        ? "scale-105 shadow-md" 
                        : "hover:scale-[1.02]"
                    )}
                    style={{
                      backgroundColor: (isSelected || (isTopMatch && !selectedEmotion)) 
                        ? emotionQuadrant.color 
                        : 'transparent',
                      borderColor: emotionQuadrant.borderColor,
                      color: (isSelected || (isTopMatch && !selectedEmotion)) 
                        ? 'white' 
                        : emotionQuadrant.color,
                      ['--tw-ring-color' as string]: emotionQuadrant.color
                    }}
                  >
                    {item.emotion}
                    {isTopMatch && !selectedEmotion && (
                      <span className="ml-1 text-xs opacity-80">✓</span>
                    )}
                  </button>
                </HoverCardTrigger>
                {description && (
                  <HoverCardContent side="top" className="w-64 p-3">
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

      {/* Confirm Button with Quote - only show if not compact mode */}
      {!compact && (
        <div className="space-y-3">
          <Button 
            onClick={handleConfirm} 
            className="w-full"
            disabled={!bestMatch && !selectedEmotion}
          >
            Continue with {selectedEmotion || bestMatch?.emotion || 'selection'}
          </Button>
          
          {/* Daily Quote */}
          {(selectedEmotion || bestMatch) && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
              <Quote className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground italic">
                "{getDailyQuote(
                  selectedEmotion 
                    ? (suggestedEmotions.find(e => e.emotion === selectedEmotion)?.quadrant || currentQuadrant)
                    : (bestMatch?.quadrant || currentQuadrant),
                  selectedEmotion || bestMatch?.emotion || ''
                )}"
              </p>
            </div>
          )}
        </div>
      )}

      {!compact && (
        <p className="text-center text-xs text-muted-foreground/60 italic">
          All emotions are OK — they're signals, not judgments
        </p>
      )}
    </div>
  );
}
