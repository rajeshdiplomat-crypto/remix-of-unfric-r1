import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { 
  Search, 
  Heart, 
  Clock, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Loader2 
} from "lucide-react";
import { QuadrantType, QUADRANTS, EMOTION_DESCRIPTIONS } from "./types";
import { EmotionContextFieldsEnhanced } from "./EmotionContextFieldsEnhanced";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface EmotionCheckinFlowProps {
  timezone: string;
  onSave: (data: {
    quadrant: QuadrantType;
    emotion: string;
    note: string;
    context: {
      who?: string;
      what?: string;
      body?: string;
      sleepHours?: string;
      physicalActivity?: string;
    };
    sendToJournal: boolean;
    checkInTime: Date;
  }) => Promise<void>;
  saving: boolean;
}

// Build emotion list with approximate positions
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

export function EmotionCheckinFlow({ timezone, onSave, saving }: EmotionCheckinFlowProps) {
  // Step: 1 = sliders/emotion, 2 = context/details
  const [step, setStep] = useState(1);
  
  // Slider values
  const [energy, setEnergy] = useState(50);
  const [pleasantness, setPleasantness] = useState(50);
  
  // Selected emotion
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Context fields
  const [note, setNote] = useState("");
  const [context, setContext] = useState<{
    who?: string;
    what?: string;
    body?: string;
    sleepHours?: string;
    physicalActivity?: string;
  }>({});
  const [sendToJournal, setSendToJournal] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date>(new Date());

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return ALL_EMOTIONS.filter((e) => 
      e.emotion.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 6);
  }, [searchQuery]);

  // Calculate current quadrant from sliders
  const currentQuadrant: QuadrantType = useMemo(() => {
    if (energy >= 50 && pleasantness >= 50) return "high-pleasant";
    if (energy >= 50 && pleasantness < 50) return "high-unpleasant";
    if (energy < 50 && pleasantness < 50) return "low-unpleasant";
    return "low-pleasant";
  }, [energy, pleasantness]);

  // Suggested emotions based on slider position
  const suggestedEmotions = useMemo(() => {
    const distances = ALL_EMOTIONS.map((e) => ({
      ...e,
      distance: Math.sqrt(Math.pow(e.energy - energy, 2) + Math.pow(e.pleasantness - pleasantness, 2)),
    }));
    return distances.sort((a, b) => a.distance - b.distance).slice(0, 5);
  }, [energy, pleasantness]);

  const quadrantInfo = QUADRANTS[currentQuadrant];
  const bestMatch = suggestedEmotions[0];

  const handleEmotionClick = (emotion: string, quadrant: QuadrantType) => {
    setSelectedEmotion(emotion);
    const emotionData = ALL_EMOTIONS.find((e) => e.emotion === emotion && e.quadrant === quadrant);
    if (emotionData) {
      setEnergy(Math.round(emotionData.energy));
      setPleasantness(Math.round(emotionData.pleasantness));
    }
    setSearchQuery("");
  };

  const handleContinue = () => {
    if (!selectedEmotion && !bestMatch) return;
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSave = async () => {
    const emotionToSave = selectedEmotion || bestMatch?.emotion;
    const quadrant = selectedEmotion
      ? suggestedEmotions.find((e) => e.emotion === selectedEmotion)?.quadrant || currentQuadrant
      : bestMatch?.quadrant || currentQuadrant;
    
    if (!emotionToSave) return;
    
    await onSave({
      quadrant,
      emotion: emotionToSave,
      note,
      context,
      sendToJournal,
      checkInTime,
    });
  };

  const finalEmotion = selectedEmotion || bestMatch?.emotion;
  const finalQuadrant = selectedEmotion
    ? suggestedEmotions.find((e) => e.emotion === selectedEmotion)?.quadrant || currentQuadrant
    : bestMatch?.quadrant || currentQuadrant;

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Step indicator */}
      <div className="flex justify-center gap-2 mb-6">
        <div className={cn(
          "w-2 h-2 rounded-full transition-all duration-300",
          step === 1 ? "bg-primary w-6" : "bg-muted"
        )} />
        <div className={cn(
          "w-2 h-2 rounded-full transition-all duration-300",
          step === 2 ? "bg-primary w-6" : "bg-muted"
        )} />
      </div>

      {/* Card Container */}
      <div className="relative overflow-hidden">
        {/* Step 1: Emotion Selection */}
        <div className={cn(
          "transition-all duration-500 ease-out",
          step === 1 
            ? "opacity-100 translate-x-0" 
            : "opacity-0 -translate-x-full absolute inset-0 pointer-events-none"
        )}>
          <div className="bg-card rounded-2xl border border-border shadow-lg p-6 space-y-5">
            {/* Header */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-lg font-semibold text-foreground">
                <Heart className="h-5 w-5 text-rose-500" />
                HOW ARE YOU FEELING?
              </div>
            </div>

            {/* Date/Time Display */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 text-sm text-muted-foreground justify-center">
              <Clock className="h-4 w-4" />
              <span>
                {new Intl.DateTimeFormat("en-US", {
                  timeZone: timezone,
                  weekday: "long",
                  day: "numeric",
                  month: "short",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                }).format(checkInTime)}
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search any emotion..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-xl bg-muted/30 border-border/50"
              />
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-xl shadow-xl p-2 space-y-1">
                  {searchResults.map((item) => (
                    <button
                      key={item.emotion}
                      onClick={() => handleEmotionClick(item.emotion, item.quadrant)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted flex items-center gap-2 transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: QUADRANTS[item.quadrant].color }} />
                      <span className="text-sm font-medium">{item.emotion}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{QUADRANTS[item.quadrant].label.split(",")[0]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Energy Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low Energy</span>
                <span className="font-medium text-foreground">{energy}%</span>
                <span>High Energy</span>
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
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Unpleasant</span>
                <span className="font-medium text-foreground">{pleasantness}%</span>
                <span>Pleasant</span>
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
              className="rounded-xl p-3 border transition-all duration-300"
              style={{ backgroundColor: quadrantInfo.bgColor, borderColor: quadrantInfo.borderColor }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{quadrantEmoji[currentQuadrant]}</span>
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
                            "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border",
                            isSelected || (isTopMatch && !selectedEmotion) 
                              ? "scale-105 shadow-md" 
                              : "hover:scale-[1.02]",
                          )}
                          style={{
                            backgroundColor: isSelected || (isTopMatch && !selectedEmotion) 
                              ? emotionQuadrant.color 
                              : "transparent",
                            borderColor: emotionQuadrant.borderColor,
                            color: isSelected || (isTopMatch && !selectedEmotion) 
                              ? "white" 
                              : emotionQuadrant.color,
                          }}
                        >
                          {item.emotion}
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

            {/* Continue Button */}
            <Button
              onClick={handleContinue}
              disabled={!bestMatch && !selectedEmotion}
              className="w-full h-12 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 transition-all duration-200"
            >
              CONTINUE WITH {(finalEmotion || "").toUpperCase()}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Step 2: Context & Details */}
        <div className={cn(
          "transition-all duration-500 ease-out",
          step === 2 
            ? "opacity-100 translate-x-0" 
            : "opacity-0 translate-x-full absolute inset-0 pointer-events-none"
        )}>
          <div className="bg-card rounded-2xl border border-border shadow-lg p-6 space-y-5">
            {/* Selected Emotion Display */}
            {finalEmotion && (
              <div
                className="flex items-center gap-3 p-4 rounded-xl transition-all duration-300"
                style={{ backgroundColor: QUADRANTS[finalQuadrant].bgColor }}
              >
                <span className="text-2xl">{quadrantEmoji[finalQuadrant]}</span>
                <div className="flex-1">
                  <p className="font-semibold text-lg" style={{ color: QUADRANTS[finalQuadrant].color }}>
                    {finalEmotion}
                  </p>
                  <p className="text-xs text-muted-foreground">{QUADRANTS[finalQuadrant].description}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBack}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Change
                </Button>
              </div>
            )}

            {/* Context Fields */}
            <EmotionContextFieldsEnhanced
              note={note}
              onNoteChange={setNote}
              context={context}
              onContextChange={setContext}
              sendToJournal={sendToJournal}
              onSendToJournalChange={setSendToJournal}
              checkInTime={checkInTime}
              onCheckInTimeChange={setCheckInTime}
            />

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleBack} 
                className="flex-1 h-12 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white border-0 font-semibold"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Save Check-in
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
