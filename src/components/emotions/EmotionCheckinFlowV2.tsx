import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { 
  Search, 
  Heart, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Loader2,
  Sparkles,
  Clock,
  Users,
  Activity,
  Moon,
  Dumbbell,
  BookOpen,
  Zap,
  Wind
} from "lucide-react";
import { QuadrantType, QUADRANTS, EMOTION_DESCRIPTIONS, Strategy, STRATEGIES } from "./types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface EmotionCheckinFlowV2Props {
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
  onComplete?: (quadrant: QuadrantType, emotion: string) => void;
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

const WHO_PRESETS = ["Alone", "Friend", "Partner", "Family", "Team", "Colleagues"];
const WHAT_PRESETS = ["Work", "Eating", "Commuting", "Socializing", "Resting", "Exercise"];
const SLEEP_PRESETS = ["< 4 hrs", "4-6 hrs", "6-8 hrs", "> 8 hrs"];
const ACTIVITY_PRESETS = ["None", "Walk", "Gym", "Yoga", "Sport", "Running"];

const quadrantEmoji: Record<QuadrantType, string> = {
  "high-pleasant": "✨",
  "high-unpleasant": "⚡",
  "low-unpleasant": "🌧️",
  "low-pleasant": "🍃",
};

const quadrantGradients: Record<QuadrantType, string> = {
  "high-pleasant": "from-amber-400 via-orange-400 to-rose-400",
  "high-unpleasant": "from-rose-500 via-red-500 to-orange-500",
  "low-unpleasant": "from-slate-400 via-blue-400 to-indigo-400",
  "low-pleasant": "from-emerald-400 via-teal-400 to-cyan-400",
};

export function EmotionCheckinFlowV2({ timezone, onSave, saving, onComplete }: EmotionCheckinFlowV2Props) {
  // Step: 1 = emotion selection, 2 = context, 3 = complete
  const [step, setStep] = useState(1);
  
  // Slider values - using a 2D space
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
  const [checkInTime] = useState<Date>(new Date());

  // Completed state
  const [savedQuadrant, setSavedQuadrant] = useState<QuadrantType | null>(null);
  const [savedEmotion, setSavedEmotion] = useState<string | null>(null);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return ALL_EMOTIONS.filter((e) => 
      e.emotion.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 8);
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
    return distances.sort((a, b) => a.distance - b.distance).slice(0, 6);
  }, [energy, pleasantness]);

  // Get recommended strategies for current quadrant
  const recommendedStrategies = useMemo(() => {
    const quadrant = savedQuadrant || currentQuadrant;
    return STRATEGIES.filter(s => s.targetQuadrants.includes(quadrant)).slice(0, 3);
  }, [savedQuadrant, currentQuadrant]);

  const quadrantInfo = QUADRANTS[currentQuadrant];
  const bestMatch = suggestedEmotions[0];

  const handleEmotionClick = useCallback((emotion: string, quadrant: QuadrantType) => {
    setSelectedEmotion(emotion);
    const emotionData = ALL_EMOTIONS.find((e) => e.emotion === emotion && e.quadrant === quadrant);
    if (emotionData) {
      setEnergy(Math.round(emotionData.energy));
      setPleasantness(Math.round(emotionData.pleasantness));
    }
    setSearchQuery("");
  }, []);

  const handleContinue = () => {
    if (!selectedEmotion && !bestMatch) return;
    setStep(2);
  };

  const handleBack = () => {
    if (step === 3) {
      setStep(1);
      setSavedQuadrant(null);
      setSavedEmotion(null);
    } else {
      setStep(1);
    }
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

    // Move to completion step
    setSavedQuadrant(quadrant);
    setSavedEmotion(emotionToSave);
    setStep(3);
    onComplete?.(quadrant, emotionToSave);
  };

  const resetFlow = () => {
    setStep(1);
    setEnergy(50);
    setPleasantness(50);
    setSelectedEmotion(null);
    setSearchQuery("");
    setNote("");
    setContext({});
    setSendToJournal(false);
    setSavedQuadrant(null);
    setSavedEmotion(null);
  };

  const finalEmotion = selectedEmotion || bestMatch?.emotion;
  const finalQuadrant = selectedEmotion
    ? suggestedEmotions.find((e) => e.emotion === selectedEmotion)?.quadrant || currentQuadrant
    : bestMatch?.quadrant || currentQuadrant;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 md:p-8">
      {/* Progress Indicators */}
      <div className="flex items-center gap-3 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-500",
                step >= s
                  ? "bg-primary text-primary-foreground shadow-lg scale-110"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {step > s ? <Check className="h-4 w-4" /> : s}
            </div>
            {s < 3 && (
              <div className={cn(
                "w-12 h-0.5 transition-all duration-500",
                step > s ? "bg-primary" : "bg-muted"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Emotion Selection - Full Screen */}
      <div className={cn(
        "w-full max-w-4xl transition-all duration-700 ease-out",
        step === 1 
          ? "opacity-100 translate-y-0 scale-100" 
          : "opacity-0 translate-y-8 scale-95 absolute pointer-events-none"
      )}>
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-light tracking-tight text-foreground mb-2">
            How are you feeling?
          </h1>
          <p className="text-muted-foreground">
            Use the grid below or search for your emotion
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md mx-auto mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search emotions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 rounded-2xl bg-background border-border/50 text-lg"
          />
          {searchResults.length > 0 && (
            <div className="absolute z-20 w-full mt-2 bg-card border border-border rounded-2xl shadow-2xl p-3 space-y-1 animate-scale-in">
              {searchResults.map((item) => (
                <button
                  key={item.emotion}
                  onClick={() => handleEmotionClick(item.emotion, item.quadrant)}
                  className="w-full text-left px-4 py-3 rounded-xl hover:bg-muted flex items-center gap-3 transition-all duration-200 group"
                >
                  <div 
                    className="w-3 h-3 rounded-full transition-transform group-hover:scale-125" 
                    style={{ backgroundColor: QUADRANTS[item.quadrant].color }} 
                  />
                  <span className="font-medium">{item.emotion}</span>
                  <span className="text-sm text-muted-foreground ml-auto">
                    {QUADRANTS[item.quadrant].description}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Emotion Grid - Interactive 2D Space */}
        <div className="relative w-full max-w-2xl mx-auto aspect-square mb-8">
          {/* Background Gradient Quadrants */}
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 rounded-3xl overflow-hidden">
            <div className="bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 flex items-center justify-center">
              <span className="text-4xl opacity-30">✨</span>
            </div>
            <div className="bg-gradient-to-bl from-rose-100 to-red-100 dark:from-rose-900/20 dark:to-red-900/20 flex items-center justify-center">
              <span className="text-4xl opacity-30">⚡</span>
            </div>
            <div className="bg-gradient-to-tr from-emerald-100 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 flex items-center justify-center">
              <span className="text-4xl opacity-30">🍃</span>
            </div>
            <div className="bg-gradient-to-tl from-slate-100 to-blue-100 dark:from-slate-900/20 dark:to-blue-900/20 flex items-center justify-center">
              <span className="text-4xl opacity-30">🌧️</span>
            </div>
          </div>

          {/* Axis Labels */}
          <div className="absolute -left-20 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-medium text-muted-foreground tracking-widest uppercase">
            Energy Level
          </div>
          <div className="absolute bottom-[-2rem] left-1/2 -translate-x-1/2 text-xs font-medium text-muted-foreground tracking-widest uppercase">
            Pleasantness
          </div>
          <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground/60 uppercase tracking-wider">
            High Energy
          </div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground/60 uppercase tracking-wider">
            Low Energy
          </div>
          <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/60 uppercase tracking-wider">
            Unpleasant
          </div>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/60 uppercase tracking-wider">
            Pleasant
          </div>

          {/* Interactive Position Marker */}
          <div 
            className="absolute w-16 h-16 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out z-10"
            style={{ 
              left: `${pleasantness}%`, 
              top: `${100 - energy}%` 
            }}
          >
            <div 
              className={cn(
                "w-full h-full rounded-full shadow-2xl flex items-center justify-center text-2xl",
                "bg-gradient-to-br",
                quadrantGradients[currentQuadrant],
                "animate-pulse"
              )}
            >
              {quadrantEmoji[currentQuadrant]}
            </div>
            <div 
              className={cn(
                "absolute inset-0 rounded-full animate-ping opacity-30 bg-gradient-to-br",
                quadrantGradients[currentQuadrant]
              )} 
            />
          </div>

          {/* Clickable overlay for position selection */}
          <div 
            className="absolute inset-0 cursor-crosshair z-5 rounded-3xl"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = 100 - ((e.clientY - rect.top) / rect.height) * 100;
              setPleasantness(Math.max(0, Math.min(100, x)));
              setEnergy(Math.max(0, Math.min(100, y)));
              setSelectedEmotion(null);
            }}
          />

          {/* Center crosshair */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full h-px bg-border/30" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-px h-full bg-border/30" />
          </div>
        </div>

        {/* Current State Display */}
        <div 
          className={cn(
            "max-w-md mx-auto p-4 rounded-2xl border-2 mb-6 transition-all duration-500",
            "bg-gradient-to-r",
            quadrantGradients[currentQuadrant],
            "bg-opacity-10 border-transparent shadow-lg"
          )}
          style={{ 
            background: quadrantInfo.bgColor,
            borderColor: quadrantInfo.borderColor 
          }}
        >
          <div className="flex items-center gap-4">
            <span className="text-3xl">{quadrantEmoji[currentQuadrant]}</span>
            <div className="flex-1">
              <p className="font-semibold text-lg" style={{ color: quadrantInfo.color }}>
                {quadrantInfo.label}
              </p>
              <p className="text-sm text-muted-foreground">{quadrantInfo.description}</p>
            </div>
          </div>
        </div>

        {/* Suggested Emotions */}
        <div className="max-w-2xl mx-auto mb-8">
          <p className="text-center text-sm text-muted-foreground mb-4">
            Suggested feelings for your current state:
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
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
                        "px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border-2",
                        "transform hover:scale-105 active:scale-95",
                        isSelected || (isTopMatch && !selectedEmotion) 
                          ? "scale-110 shadow-xl" 
                          : "hover:shadow-lg",
                      )}
                      style={{
                        backgroundColor: isSelected || (isTopMatch && !selectedEmotion) 
                          ? emotionQuadrant.color 
                          : "hsl(var(--background))",
                        borderColor: emotionQuadrant.color,
                        color: isSelected || (isTopMatch && !selectedEmotion) 
                          ? "white" 
                          : emotionQuadrant.color,
                      }}
                    >
                      {item.emotion}
                      {(isSelected || (isTopMatch && !selectedEmotion)) && (
                        <Check className="inline-block h-3.5 w-3.5 ml-1.5" />
                      )}
                    </button>
                  </HoverCardTrigger>
                  {description && (
                    <HoverCardContent side="top" className="w-64 p-4 rounded-2xl">
                      <p className="font-medium mb-1" style={{ color: emotionQuadrant.color }}>
                        {item.emotion}
                      </p>
                      <p className="text-sm text-muted-foreground">{description}</p>
                    </HoverCardContent>
                  )}
                </HoverCard>
              );
            })}
          </div>
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <Button
            onClick={handleContinue}
            disabled={!bestMatch && !selectedEmotion}
            size="lg"
            className={cn(
              "h-14 px-10 rounded-2xl text-base font-medium transition-all duration-300",
              "bg-primary hover:bg-primary/90 shadow-xl hover:shadow-2xl",
              "transform hover:scale-105 active:scale-95"
            )}
          >
            Continue with {(finalEmotion || "").toLowerCase()}
            <ArrowRight className="h-5 w-5 ml-3" />
          </Button>
        </div>
      </div>

      {/* Step 2: Context & Details */}
      <div className={cn(
        "w-full max-w-2xl transition-all duration-700 ease-out",
        step === 2 
          ? "opacity-100 translate-y-0 scale-100" 
          : "opacity-0 translate-y-8 scale-95 absolute pointer-events-none"
      )}>
        <div className="text-center mb-8">
          <div 
            className={cn(
              "inline-flex items-center gap-3 px-6 py-3 rounded-2xl mb-4 bg-gradient-to-r shadow-lg",
              quadrantGradients[finalQuadrant]
            )}
          >
            <span className="text-2xl">{quadrantEmoji[finalQuadrant]}</span>
            <span className="text-xl font-semibold text-white">{finalEmotion}</span>
          </div>
          <h2 className="text-2xl font-light text-foreground mb-2">
            Tell us more about your moment
          </h2>
          <p className="text-muted-foreground text-sm">
            Add context to understand your patterns better
          </p>
        </div>

        {/* Time & Journal */}
        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50 mb-6">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-foreground">
              {new Intl.DateTimeFormat("en-US", {
                timeZone: timezone,
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              }).format(checkInTime)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="journal-sync" className="text-sm text-muted-foreground cursor-pointer">
              Add to journal
            </Label>
            <Switch id="journal-sync" checked={sendToJournal} onCheckedChange={setSendToJournal} />
          </div>
        </div>

        {/* Note */}
        <div className="mb-6">
          <Label htmlFor="note" className="text-sm font-medium text-foreground mb-2 block">
            What's on your mind?
          </Label>
          <Textarea
            id="note"
            placeholder="Write a few words about how you're feeling..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[100px] rounded-2xl resize-none text-base border-border/50"
          />
        </div>

        {/* Context Pills */}
        <div className="space-y-5 mb-8">
          <ContextSection
            icon={<Users className="h-4 w-4" />}
            label="Who are you with?"
            options={WHO_PRESETS}
            selected={context.who}
            onSelect={(v) => setContext({ ...context, who: v })}
          />
          <ContextSection
            icon={<Activity className="h-4 w-4" />}
            label="What are you doing?"
            options={WHAT_PRESETS}
            selected={context.what}
            onSelect={(v) => setContext({ ...context, what: v })}
          />
          <ContextSection
            icon={<Moon className="h-4 w-4" />}
            label="How'd you sleep?"
            options={SLEEP_PRESETS}
            selected={context.sleepHours}
            onSelect={(v) => setContext({ ...context, sleepHours: v })}
          />
          <ContextSection
            icon={<Dumbbell className="h-4 w-4" />}
            label="Any activity today?"
            options={ACTIVITY_PRESETS}
            selected={context.physicalActivity}
            onSelect={(v) => setContext({ ...context, physicalActivity: v })}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            onClick={handleBack} 
            size="lg"
            className="flex-1 h-14 rounded-2xl"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            size="lg"
            className={cn(
              "flex-[2] h-14 rounded-2xl font-medium transition-all duration-300",
              "bg-gradient-to-r shadow-xl hover:shadow-2xl",
              quadrantGradients[finalQuadrant],
              "text-white border-0 transform hover:scale-[1.02] active:scale-[0.98]"
            )}
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <Check className="h-5 w-5 mr-2" />
            )}
            Save Check-in
          </Button>
        </div>
      </div>

      {/* Step 3: Completion & Strategies */}
      <div className={cn(
        "w-full max-w-3xl transition-all duration-700 ease-out",
        step === 3 
          ? "opacity-100 translate-y-0 scale-100" 
          : "opacity-0 translate-y-8 scale-95 absolute pointer-events-none"
      )}>
        {/* Success Animation */}
        <div className="text-center mb-10">
          <div className="relative inline-block mb-6">
            <div 
              className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center text-4xl",
                "bg-gradient-to-br shadow-2xl animate-scale-in",
                savedQuadrant ? quadrantGradients[savedQuadrant] : quadrantGradients["high-pleasant"]
              )}
            >
              ✓
            </div>
            <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-primary" />
          </div>
          <h2 className="text-3xl font-light text-foreground mb-2">
            Check-in Complete!
          </h2>
          <p className="text-muted-foreground">
            You logged feeling <span className="font-medium text-foreground">{savedEmotion}</span>
          </p>
        </div>

        {/* Recommended Strategies */}
        {recommendedStrategies.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h3 className="text-lg font-medium text-foreground">Recommended for you</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendedStrategies.map((strategy) => (
                <StrategyCard key={strategy.id} strategy={strategy} />
              ))}
            </div>
          </div>
        )}

        {/* Action */}
        <div className="text-center">
          <Button
            variant="outline"
            size="lg"
            onClick={resetFlow}
            className="h-14 px-8 rounded-2xl"
          >
            <Heart className="h-4 w-4 mr-2" />
            Log Another Feeling
          </Button>
        </div>
      </div>
    </div>
  );
}

// Context Section Component
function ContextSection({
  icon,
  label,
  options,
  selected,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  options: string[];
  selected?: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm flex items-center gap-2 text-muted-foreground">
        {icon} {label}
      </Label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onSelect(o === selected ? "" : o)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border",
              "transform hover:scale-105 active:scale-95",
              selected === o
                ? "bg-primary text-primary-foreground border-primary shadow-md"
                : "bg-muted/30 text-foreground border-border/50 hover:bg-muted hover:border-border",
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

// Strategy Card Component
function StrategyCard({ strategy }: { strategy: Strategy }) {
  const typeColors: Record<string, string> = {
    breathing: "from-cyan-500 to-blue-500",
    grounding: "from-amber-500 to-orange-500",
    cognitive: "from-purple-500 to-pink-500",
    movement: "from-rose-500 to-red-500",
    mindfulness: "from-emerald-500 to-teal-500",
  };

  const typeIcons: Record<string, React.ReactNode> = {
    breathing: <Wind className="h-5 w-5" />,
    grounding: <Activity className="h-5 w-5" />,
    cognitive: <Sparkles className="h-5 w-5" />,
    movement: <Zap className="h-5 w-5" />,
    mindfulness: <Heart className="h-5 w-5" />,
  };

  return (
    <div className="group p-5 rounded-2xl bg-card border border-border/50 hover:border-border hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02]">
      <div 
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4",
          "bg-gradient-to-br shadow-lg",
          typeColors[strategy.type]
        )}
      >
        {typeIcons[strategy.type]}
      </div>
      <h4 className="font-medium text-foreground mb-1">{strategy.title}</h4>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{strategy.description}</p>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>{strategy.duration}</span>
      </div>
    </div>
  );
}
