import { useState, useMemo, useCallback } from "react";
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
  BookOpen
} from "lucide-react";
import { QuadrantType, QUADRANTS, STRATEGIES } from "./types";
import { cn } from "@/lib/utils";
import { EmotionBubbleViz } from "./EmotionBubbleViz";

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

const quadrantGradients: Record<QuadrantType, string> = {
  "high-pleasant": "from-amber-400 via-orange-400 to-rose-400",
  "high-unpleasant": "from-rose-500 via-red-500 to-orange-500",
  "low-unpleasant": "from-slate-400 via-blue-400 to-indigo-400",
  "low-pleasant": "from-emerald-400 via-teal-400 to-cyan-400",
};

export function EmotionCheckinFlowV2({ timezone, onSave, saving, onComplete }: EmotionCheckinFlowV2Props) {
  // Step: 1 = emotion selection, 2 = context, 3 = complete
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
    <div className="w-full h-[calc(100vh-80px)] flex flex-col overflow-hidden">
      {/* Step 1: Emotion Selection - Full Screen Width */}
      {step === 1 && (
        <div className="flex-1 flex flex-col px-6 lg:px-12 py-6 animate-in fade-in slide-in-from-right-4 duration-500">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-light tracking-tight text-foreground mb-1">
              How are you feeling?
            </h1>
            <p className="text-sm text-muted-foreground">
              Use the sliders or search for your emotion
            </p>
          </div>

          {/* Main Content - 3 Column Layout */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_2fr_1fr] gap-6 lg:gap-8 min-h-0">
            {/* Left Column - Sliders */}
            <div className="flex flex-col gap-4 lg:gap-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search emotions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 rounded-xl bg-background/80 backdrop-blur-sm border-border/50"
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-20 w-full mt-2 bg-card/95 backdrop-blur-lg border border-border rounded-xl shadow-2xl p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    {searchResults.map((item) => (
                      <button
                        key={item.emotion}
                        onClick={() => handleEmotionClick(item.emotion, item.quadrant)}
                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted flex items-center gap-3 transition-all duration-200 group"
                      >
                        <div 
                          className="w-2.5 h-2.5 rounded-full transition-transform group-hover:scale-125" 
                          style={{ backgroundColor: QUADRANTS[item.quadrant].color }} 
                        />
                        <span className="font-medium text-sm">{item.emotion}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Energy Slider */}
              <div className="space-y-3 p-4 rounded-2xl bg-muted/30 border border-border/30">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground uppercase tracking-wider">Low Energy</span>
                  <span className="font-semibold text-foreground bg-background px-2 py-0.5 rounded-full">{energy}%</span>
                  <span className="text-muted-foreground uppercase tracking-wider">High Energy</span>
                </div>
                <Slider 
                  value={[energy]} 
                  onValueChange={(v) => {
                    setEnergy(v[0]);
                    setSelectedEmotion(null);
                  }} 
                  max={100} 
                  step={1} 
                  className="w-full"
                />
              </div>

              {/* Pleasantness Slider */}
              <div className="space-y-3 p-4 rounded-2xl bg-muted/30 border border-border/30">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground uppercase tracking-wider">Unpleasant</span>
                  <span className="font-semibold text-foreground bg-background px-2 py-0.5 rounded-full">{pleasantness}%</span>
                  <span className="text-muted-foreground uppercase tracking-wider">Pleasant</span>
                </div>
                <Slider 
                  value={[pleasantness]} 
                  onValueChange={(v) => {
                    setPleasantness(v[0]);
                    setSelectedEmotion(null);
                  }} 
                  max={100} 
                  step={1} 
                  className="w-full"
                />
              </div>

              {/* Current Zone Display */}
              <div
                className="rounded-2xl p-4 border-2 transition-all duration-500"
                style={{ backgroundColor: quadrantInfo.bgColor, borderColor: quadrantInfo.borderColor }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{quadrantEmoji[currentQuadrant]}</span>
                  <div>
                    <p className="font-semibold text-base" style={{ color: quadrantInfo.color }}>
                      {quadrantInfo.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{quadrantInfo.description}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Center Column - Bubble Visualization */}
            <div className="flex flex-col min-h-0">
              <EmotionBubbleViz
                energy={energy}
                pleasantness={pleasantness}
                selectedEmotion={selectedEmotion}
                onEmotionSelect={handleEmotionClick}
                onBubbleClick={(quadrant) => {
                  // Update sliders when bubble is clicked
                  if (quadrant === "high-pleasant") {
                    setEnergy(75);
                    setPleasantness(75);
                  } else if (quadrant === "high-unpleasant") {
                    setEnergy(75);
                    setPleasantness(25);
                  } else if (quadrant === "low-unpleasant") {
                    setEnergy(25);
                    setPleasantness(25);
                  } else {
                    setEnergy(25);
                    setPleasantness(75);
                  }
                  setSelectedEmotion(null);
                }}
              />

              {/* Continue Button */}
              <div className="pt-4">
                <Button
                  onClick={handleContinue}
                  disabled={!finalEmotion}
                  className="w-full h-12 rounded-2xl text-base gap-2 transition-all duration-300"
                >
                  Continue with "{finalEmotion}"
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Right Column - Preview */}
            <div className="hidden lg:flex flex-col gap-4">
              <div className="text-center text-sm text-muted-foreground mb-2">
                Your selection
              </div>
              
              <div 
                className={cn(
                  "flex-1 rounded-3xl p-6 flex flex-col items-center justify-center transition-all duration-500",
                  "bg-gradient-to-br shadow-2xl"
                )}
                style={{ 
                  background: `linear-gradient(135deg, ${quadrantInfo.bgColor}, ${quadrantInfo.borderColor}20)`,
                  borderColor: quadrantInfo.borderColor 
                }}
              >
                <span className="text-6xl mb-4">{quadrantEmoji[currentQuadrant]}</span>
                <p className="text-2xl font-semibold mb-2" style={{ color: quadrantInfo.color }}>
                  {finalEmotion || "Select..."}
                </p>
                <p className="text-sm text-muted-foreground text-center">
                  {quadrantInfo.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Context */}
      {step === 2 && (
        <div className="flex-1 flex flex-col px-6 lg:px-12 py-6 animate-in fade-in slide-in-from-right-4 duration-500">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-4xl">{quadrantEmoji[finalQuadrant]}</span>
              <h1 className="text-2xl md:text-3xl font-light tracking-tight" style={{ color: QUADRANTS[finalQuadrant].color }}>
                {finalEmotion}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Add some context (optional)
            </p>
          </div>

          {/* Context Fields - Wide Layout */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto w-full">
            {/* Note */}
            <div className="lg:col-span-2">
              <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Notes
              </Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What's on your mind?"
                className="min-h-[100px] rounded-2xl resize-none bg-background/80 backdrop-blur-sm"
              />
            </div>

            {/* Who */}
            <div>
              <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Who are you with?
              </Label>
              <div className="flex flex-wrap gap-2">
                {WHO_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setContext(c => ({ ...c, who: c.who === preset ? undefined : preset }))}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border",
                      context.who === preset
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted"
                    )}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* What */}
            <div>
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
                      "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border",
                      context.what === preset
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted"
                    )}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Sleep */}
            <div>
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
                      "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border",
                      context.sleepHours === preset
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted"
                    )}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Activity */}
            <div>
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
                      "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border",
                      context.physicalActivity === preset
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted"
                    )}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Journal Toggle */}
            <div className="lg:col-span-2 flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/30">
              <div>
                <Label className="text-sm font-medium">Send to Journal</Label>
                <p className="text-xs text-muted-foreground">Add this check-in to today's journal entry</p>
              </div>
              <Switch checked={sendToJournal} onCheckedChange={setSendToJournal} />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 max-w-5xl mx-auto w-full">
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1 h-12 rounded-2xl gap-2"
            >
              <ArrowLeft className="h-5 w-5" />
              Back
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-[2] h-12 rounded-2xl gap-2"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Check className="h-5 w-5" />
              )}
              Save Check-in
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Complete */}
      {step === 3 && savedQuadrant && savedEmotion && (
        <div className="flex-1 flex flex-col px-6 lg:px-12 py-6 animate-in fade-in zoom-in-95 duration-700">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 bg-gradient-to-br shadow-2xl"
              style={{ 
                background: `linear-gradient(135deg, ${QUADRANTS[savedQuadrant].color}40, ${QUADRANTS[savedQuadrant].color}20)` 
              }}
            >
              <Check className="h-10 w-10" style={{ color: QUADRANTS[savedQuadrant].color }} />
            </div>
            <h1 className="text-2xl md:text-3xl font-light tracking-tight text-foreground mb-1">
              Check-in saved!
            </h1>
            <p className="text-lg" style={{ color: QUADRANTS[savedQuadrant].color }}>
              {quadrantEmoji[savedQuadrant]} {savedEmotion}
            </p>
          </div>

          {/* Recommended Strategies */}
          <div className="flex-1 max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-medium">Recommended for you</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendedStrategies.map((strategy) => (
                <div
                  key={strategy.id}
                  className="p-5 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="text-3xl mb-3">{strategy.icon}</div>
                  <h3 className="font-semibold text-base mb-1">{strategy.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{strategy.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="px-2 py-0.5 bg-muted rounded-full capitalize">{strategy.type}</span>
                    <span>{strategy.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* New Check-in Button */}
          <div className="pt-6 max-w-md mx-auto w-full">
            <Button
              onClick={resetFlow}
              variant="outline"
              className="w-full h-12 rounded-2xl gap-2"
            >
              <ArrowRight className="h-5 w-5" />
              New Check-in
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
