import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  Search, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Loader2,
  Sparkles,
  Users,
  Activity,
  Moon,
  Dumbbell,
  BookOpen,
  Play,
  Clock
} from "lucide-react";
import { QuadrantType, QUADRANTS, STRATEGIES } from "./types";
import { cn } from "@/lib/utils";
import { EmotionBubbleViz } from "./EmotionBubbleViz";
import confetti from 'canvas-confetti';

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
  "high-pleasant": "😊",
  "high-unpleasant": "😰",
  "low-unpleasant": "😔",
  "low-pleasant": "😌",
};

const quadrantGradients: Record<QuadrantType, { from: string; to: string }> = {
  "high-pleasant": { from: "#F59E0B", to: "#F97316" },
  "high-unpleasant": { from: "#EF4444", to: "#F97316" },
  "low-unpleasant": { from: "#6366F1", to: "#8B5CF6" },
  "low-pleasant": { from: "#10B981", to: "#14B8A6" },
};

export function EmotionCheckinFlowV2({ timezone, onSave, saving, onComplete }: EmotionCheckinFlowV2Props) {
  // Step: 1 = emotion selection, 2 = context, 3 = complete
  const [step, setStep] = useState(1);
  
  // Slider values with smooth animation
  const [energy, setEnergy] = useState(50);
  const [pleasantness, setPleasantness] = useState(50);
  const [targetEnergy, setTargetEnergy] = useState(50);
  const [targetPleasantness, setTargetPleasantness] = useState(50);
  
  // Animate sliders smoothly when bubble is clicked
  useEffect(() => {
    const animateSlider = () => {
      const energyDiff = targetEnergy - energy;
      const pleasantnessDiff = targetPleasantness - pleasantness;
      
      if (Math.abs(energyDiff) > 0.5 || Math.abs(pleasantnessDiff) > 0.5) {
        setEnergy(prev => prev + energyDiff * 0.15);
        setPleasantness(prev => prev + pleasantnessDiff * 0.15);
        requestAnimationFrame(animateSlider);
      } else {
        setEnergy(targetEnergy);
        setPleasantness(targetPleasantness);
      }
    };
    
    requestAnimationFrame(animateSlider);
  }, [targetEnergy, targetPleasantness]);
  
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
    return distances.sort((a, b) => a.distance - b.distance).slice(0, 8);
  }, [energy, pleasantness]);

  // Get recommended strategies for current quadrant
  const recommendedStrategies = useMemo(() => {
    const quadrant = savedQuadrant || currentQuadrant;
    return STRATEGIES.filter(s => s.targetQuadrants.includes(quadrant)).slice(0, 3);
  }, [savedQuadrant, currentQuadrant]);

  const quadrantInfo = QUADRANTS[currentQuadrant];
  const bestMatch = suggestedEmotions[0];
  const gradientColors = quadrantGradients[currentQuadrant];

  const handleEmotionClick = useCallback((emotion: string, quadrant: QuadrantType) => {
    setSelectedEmotion(emotion);
    const emotionData = ALL_EMOTIONS.find((e) => e.emotion === emotion && e.quadrant === quadrant);
    if (emotionData) {
      setTargetEnergy(Math.round(emotionData.energy));
      setTargetPleasantness(Math.round(emotionData.pleasantness));
    }
    setSearchQuery("");
  }, []);

  const handleSliderChange = useCallback((type: 'energy' | 'pleasantness', value: number) => {
    if (type === 'energy') {
      setEnergy(value);
      setTargetEnergy(value);
    } else {
      setPleasantness(value);
      setTargetPleasantness(value);
    }
    setSelectedEmotion(null);
  }, []);

  const handleBubbleClick = useCallback((quadrant: QuadrantType) => {
    if (quadrant === "high-pleasant") {
      setTargetEnergy(75);
      setTargetPleasantness(75);
    } else if (quadrant === "high-unpleasant") {
      setTargetEnergy(75);
      setTargetPleasantness(25);
    } else if (quadrant === "low-unpleasant") {
      setTargetEnergy(25);
      setTargetPleasantness(25);
    } else {
      setTargetEnergy(25);
      setTargetPleasantness(75);
    }
    setSelectedEmotion(null);
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

    // Celebration confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: [quadrantGradients[quadrant].from, quadrantGradients[quadrant].to, '#ffffff']
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
    setTargetEnergy(50);
    setTargetPleasantness(50);
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
    <div 
      className="w-full h-[calc(100vh-100px)] flex flex-col overflow-hidden transition-all duration-700"
      style={{
        background: `radial-gradient(ellipse at 50% 0%, ${gradientColors.from}08 0%, transparent 50%)`
      }}
    >
      {/* Step 1: Emotion Selection */}
      {step === 1 && (
        <div className="flex-1 flex flex-col px-4 md:px-6 lg:px-8 py-3 animate-in fade-in duration-500">
          {/* Header - Ultra Compact */}
          <div className="text-center mb-3">
            <h1 className="text-lg md:text-xl font-light tracking-tight text-foreground">
              How are you feeling?
            </h1>
          </div>

          {/* Main Content - Optimized Layout */}
          <div className="flex-1 flex flex-col lg:flex-row gap-3 lg:gap-4 min-h-0">
            {/* Left: Sliders + Zone */}
            <div className="lg:w-56 xl:w-64 flex flex-col gap-2.5 shrink-0">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search emotions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 rounded-xl bg-background/80 backdrop-blur-sm border-border/50 text-sm"
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-30 w-full mt-1 bg-card/95 backdrop-blur-lg border border-border rounded-xl shadow-2xl p-2 space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    {searchResults.map((item) => (
                      <button
                        key={item.emotion}
                        onClick={() => handleEmotionClick(item.emotion, item.quadrant)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted flex items-center gap-2 transition-all duration-200 group"
                      >
                        <div 
                          className="w-2 h-2 rounded-full transition-transform group-hover:scale-125" 
                          style={{ backgroundColor: QUADRANTS[item.quadrant].color }} 
                        />
                        <span className="font-medium text-sm">{item.emotion}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Energy Slider */}
              <div className="p-3 rounded-xl bg-muted/30 border border-border/30 backdrop-blur-sm">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider mb-2">
                  <span className="text-muted-foreground">Low</span>
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    Energy {Math.round(energy)}%
                  </span>
                  <span className="text-muted-foreground">High</span>
                </div>
                <Slider 
                  value={[energy]} 
                  onValueChange={(v) => handleSliderChange('energy', v[0])} 
                  max={100} 
                  step={1} 
                  className="w-full"
                />
              </div>

              {/* Pleasantness Slider */}
              <div className="p-3 rounded-xl bg-muted/30 border border-border/30 backdrop-blur-sm">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider mb-2">
                  <span className="text-muted-foreground">−</span>
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Pleasant {Math.round(pleasantness)}%
                  </span>
                  <span className="text-muted-foreground">+</span>
                </div>
                <Slider 
                  value={[pleasantness]} 
                  onValueChange={(v) => handleSliderChange('pleasantness', v[0])} 
                  max={100} 
                  step={1} 
                  className="w-full"
                />
              </div>

              {/* Current Zone Display */}
              <div
                className="rounded-xl p-3 border-2 transition-all duration-500"
                style={{ 
                  background: `linear-gradient(135deg, ${quadrantInfo.bgColor}, ${quadrantInfo.borderColor}20)`,
                  borderColor: quadrantInfo.borderColor 
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{quadrantEmoji[currentQuadrant]}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: quadrantInfo.color }}>
                      {quadrantInfo.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{quadrantInfo.description}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Center: Bubble Visualization */}
            <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
              <EmotionBubbleViz
                energy={energy}
                pleasantness={pleasantness}
                selectedEmotion={selectedEmotion}
                onEmotionSelect={handleEmotionClick}
                onBubbleClick={handleBubbleClick}
              />
            </div>

            {/* Right: Preview + Continue */}
            <div className="lg:w-48 xl:w-56 flex flex-col gap-3 shrink-0">
              {/* Preview Card */}
              <div 
                className={cn(
                  "flex-1 rounded-2xl p-4 flex flex-col items-center justify-center transition-all duration-500",
                  "border-2 min-h-[100px] backdrop-blur-sm relative overflow-hidden"
                )}
                style={{ 
                  background: `linear-gradient(145deg, ${quadrantInfo.bgColor}, ${quadrantInfo.borderColor}15)`,
                  borderColor: quadrantInfo.borderColor 
                }}
              >
                {/* Animated glow background */}
                {finalEmotion && (
                  <div 
                    className="absolute inset-0 opacity-20 animate-pulse"
                    style={{
                      background: `radial-gradient(circle at 50% 50%, ${quadrantInfo.color}, transparent 70%)`
                    }}
                  />
                )}
                
                <span className="text-4xl mb-2 relative z-10">{quadrantEmoji[currentQuadrant]}</span>
                <p className="text-base font-semibold text-center relative z-10" style={{ color: quadrantInfo.color }}>
                  {finalEmotion || "Select..."}
                </p>
                {finalEmotion && (
                  <p className="text-[10px] text-muted-foreground text-center mt-1 relative z-10">
                    {quadrantInfo.label}
                  </p>
                )}
              </div>

              {/* Continue Button */}
              <Button
                onClick={handleContinue}
                disabled={!finalEmotion}
                className="w-full h-10 rounded-xl text-sm gap-2 transition-all duration-300 relative overflow-hidden group"
                style={{
                  background: finalEmotion 
                    ? `linear-gradient(135deg, ${gradientColors.from}, ${gradientColors.to})`
                    : undefined
                }}
              >
                {finalEmotion && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Context */}
      {step === 2 && (
        <div className="flex-1 flex flex-col px-4 md:px-6 lg:px-10 py-4 animate-in fade-in slide-in-from-right-4 duration-500 overflow-y-auto">
          {/* Header */}
          <div className="text-center mb-5">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-lg"
                style={{ 
                  background: `linear-gradient(135deg, ${QUADRANTS[finalQuadrant].color}30, ${QUADRANTS[finalQuadrant].color}10)`,
                  border: `2px solid ${QUADRANTS[finalQuadrant].color}40`
                }}
              >
                {quadrantEmoji[finalQuadrant]}
              </div>
              <h1 
                className="text-2xl md:text-3xl font-light tracking-tight"
                style={{ color: QUADRANTS[finalQuadrant].color }}
              >
                {finalEmotion}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Add some context (optional)
            </p>
          </div>

          {/* Context Fields - Grid */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-5xl mx-auto w-full">
            {/* Note */}
            <div className="lg:col-span-2 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '0ms' }}>
              <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Notes
              </Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What's on your mind?"
                className="min-h-[80px] rounded-xl resize-none bg-background/80 backdrop-blur-sm border-border/50 transition-all duration-200 focus:shadow-lg"
              />
            </div>

            {/* Who */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '50ms' }}>
              <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Who are you with?
              </Label>
              <div className="flex flex-wrap gap-2">
                {WHO_PRESETS.map((preset, idx) => (
                  <button
                    key={preset}
                    onClick={() => setContext(c => ({ ...c, who: c.who === preset ? undefined : preset }))}
                    className={cn(
                      "px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-300 border",
                      "hover:scale-105 active:scale-95",
                      context.who === preset
                        ? "text-white border-transparent shadow-lg"
                        : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted hover:shadow-md"
                    )}
                    style={{
                      background: context.who === preset 
                        ? `linear-gradient(135deg, ${gradientColors.from}, ${gradientColors.to})`
                        : undefined,
                      animationDelay: `${idx * 30}ms`
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* What */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '100ms' }}>
              <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                What are you doing?
              </Label>
              <div className="flex flex-wrap gap-2">
                {WHAT_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setContext(c => ({ ...c, what: c.what === preset ? undefined : preset }))}
                    className={cn(
                      "px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-300 border",
                      "hover:scale-105 active:scale-95",
                      context.what === preset
                        ? "text-white border-transparent shadow-lg"
                        : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted hover:shadow-md"
                    )}
                    style={{
                      background: context.what === preset 
                        ? `linear-gradient(135deg, ${gradientColors.from}, ${gradientColors.to})`
                        : undefined
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Sleep */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '150ms' }}>
              <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Moon className="h-4 w-4 text-muted-foreground" />
                Sleep last night
              </Label>
              <div className="flex flex-wrap gap-2">
                {SLEEP_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setContext(c => ({ ...c, sleepHours: c.sleepHours === preset ? undefined : preset }))}
                    className={cn(
                      "px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-300 border",
                      "hover:scale-105 active:scale-95",
                      context.sleepHours === preset
                        ? "text-white border-transparent shadow-lg"
                        : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted hover:shadow-md"
                    )}
                    style={{
                      background: context.sleepHours === preset 
                        ? `linear-gradient(135deg, ${gradientColors.from}, ${gradientColors.to})`
                        : undefined
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Activity */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '200ms' }}>
              <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-muted-foreground" />
                Physical activity today
              </Label>
              <div className="flex flex-wrap gap-2">
                {ACTIVITY_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setContext(c => ({ ...c, physicalActivity: c.physicalActivity === preset ? undefined : preset }))}
                    className={cn(
                      "px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-300 border",
                      "hover:scale-105 active:scale-95",
                      context.physicalActivity === preset
                        ? "text-white border-transparent shadow-lg"
                        : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted hover:shadow-md"
                    )}
                    style={{
                      background: context.physicalActivity === preset 
                        ? `linear-gradient(135deg, ${gradientColors.from}, ${gradientColors.to})`
                        : undefined
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Journal Toggle */}
            <div className="lg:col-span-2 flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/30 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '250ms' }}>
              <div>
                <Label className="text-sm font-medium">Send to Journal</Label>
                <p className="text-xs text-muted-foreground">Add this check-in to today's journal entry</p>
              </div>
              <Switch checked={sendToJournal} onCheckedChange={setSendToJournal} />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 max-w-5xl mx-auto w-full">
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1 h-11 rounded-xl gap-2 hover:shadow-md transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-[2] h-11 rounded-xl gap-2 transition-all duration-300 relative overflow-hidden group"
              style={{
                background: `linear-gradient(135deg, ${gradientColors.from}, ${gradientColors.to})`
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin relative z-10" />
              ) : (
                <Check className="h-4 w-4 relative z-10" />
              )}
              <span className="relative z-10">Save Check-in</span>
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Complete */}
      {step === 3 && savedQuadrant && savedEmotion && (
        <div className="flex-1 flex flex-col px-4 md:px-6 lg:px-10 py-6 animate-in fade-in zoom-in-95 duration-700">
          {/* Success Header */}
          <div className="text-center mb-6">
            {/* Animated Check Circle */}
            <div className="relative inline-flex items-center justify-center mb-4">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center shadow-2xl animate-in zoom-in duration-500"
                style={{ 
                  background: `linear-gradient(135deg, ${QUADRANTS[savedQuadrant].color}30, ${QUADRANTS[savedQuadrant].color}10)`,
                  border: `3px solid ${QUADRANTS[savedQuadrant].color}`
                }}
              >
                <Check 
                  className="h-10 w-10 animate-in zoom-in duration-300" 
                  style={{ color: QUADRANTS[savedQuadrant].color, animationDelay: '200ms' }} 
                />
              </div>
              {/* Ripple rings */}
              <div 
                className="absolute inset-0 rounded-full animate-ping opacity-20"
                style={{ backgroundColor: QUADRANTS[savedQuadrant].color }}
              />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-light tracking-tight text-foreground mb-1 animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: '100ms' }}>
              Check-in saved!
            </h1>
            <p className="text-lg animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ color: QUADRANTS[savedQuadrant].color, animationDelay: '200ms' }}>
              {quadrantEmoji[savedQuadrant]} {savedEmotion}
            </p>
          </div>

          {/* Recommended Strategies */}
          <div className="flex-1 max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-2 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: '300ms' }}>
              <Sparkles className="h-5 w-5" style={{ color: QUADRANTS[savedQuadrant].color }} />
              <h2 className="text-lg font-medium">Recommended for you</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendedStrategies.map((strategy, idx) => (
                <div
                  key={strategy.id}
                  className="group p-5 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm 
                             hover:shadow-xl transition-all duration-500 hover:-translate-y-1 cursor-pointer
                             animate-in fade-in slide-in-from-bottom-4"
                  style={{ 
                    animationDelay: `${400 + idx * 100}ms`,
                    animationFillMode: 'backwards'
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">{strategy.icon}</div>
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                      style={{ backgroundColor: `${QUADRANTS[savedQuadrant].color}20` }}
                    >
                      <Play className="h-4 w-4" style={{ color: QUADRANTS[savedQuadrant].color }} />
                    </div>
                  </div>
                  <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">{strategy.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{strategy.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span 
                      className="px-2 py-0.5 rounded-full capitalize"
                      style={{ backgroundColor: `${QUADRANTS[savedQuadrant].color}15`, color: QUADRANTS[savedQuadrant].color }}
                    >
                      {strategy.type}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {strategy.duration}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* New Check-in Button */}
          <div className="pt-6 max-w-md mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: '700ms' }}>
            <Button
              onClick={resetFlow}
              variant="outline"
              className="w-full h-11 rounded-xl gap-2 hover:shadow-md transition-all duration-300"
            >
              <ArrowRight className="h-4 w-4" />
              New Check-in
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
