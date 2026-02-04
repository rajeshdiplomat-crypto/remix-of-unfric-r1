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
  BookOpen,
  Play,
  Clock,
  Zap,
} from "lucide-react";
import { QuadrantType, QUADRANTS, STRATEGIES } from "./types";
import { cn } from "@/lib/utils";
import { EmotionBubbleViz } from "./EmotionBubbleViz";
import confetti from "canvas-confetti";

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
  ALL_EMOTIONS.push({ emotion: e, quadrant: "low-pleasant", energy: 10 + (i % 5) * 8, pleasantness: 60 + (i % 5) * 8 }),
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
  const [step, setStep] = useState(1);
  const [energy, setEnergy] = useState(50);
  const [pleasantness, setPleasantness] = useState(50);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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
  const [savedQuadrant, setSavedQuadrant] = useState<QuadrantType | null>(null);
  const [savedEmotion, setSavedEmotion] = useState<string | null>(null);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return ALL_EMOTIONS.filter((e) => e.emotion.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 6);
  }, [searchQuery]);

  const currentQuadrant: QuadrantType = useMemo(() => {
    if (energy >= 50 && pleasantness >= 50) return "high-pleasant";
    if (energy >= 50 && pleasantness < 50) return "high-unpleasant";
    if (energy < 50 && pleasantness < 50) return "low-unpleasant";
    return "low-pleasant";
  }, [energy, pleasantness]);

  const suggestedEmotions = useMemo(() => {
    const distances = ALL_EMOTIONS.map((e) => ({
      ...e,
      distance: Math.sqrt(Math.pow(e.energy - energy, 2) + Math.pow(e.pleasantness - pleasantness, 2)),
    }));
    return distances.sort((a, b) => a.distance - b.distance).slice(0, 6);
  }, [energy, pleasantness]);

  const recommendedStrategies = useMemo(() => {
    const quadrant = savedQuadrant || currentQuadrant;
    return STRATEGIES.filter((s) => s.targetQuadrants.includes(quadrant)).slice(0, 3);
  }, [savedQuadrant, currentQuadrant]);

  const quadrantInfo = QUADRANTS[currentQuadrant];
  const bestMatch = suggestedEmotions[0];
  const gradientColors = quadrantGradients[currentQuadrant];
  const finalEmotion = selectedEmotion || bestMatch?.emotion;
  const finalQuadrant = selectedEmotion
    ? suggestedEmotions.find((e) => e.emotion === selectedEmotion)?.quadrant || currentQuadrant
    : bestMatch?.quadrant || currentQuadrant;

  const handleEmotionClick = useCallback((emotion: string, quadrant: QuadrantType) => {
    setSelectedEmotion(emotion);
    const emotionData = ALL_EMOTIONS.find((e) => e.emotion === emotion && e.quadrant === quadrant);
    if (emotionData) {
      setEnergy(emotionData.energy);
      setPleasantness(emotionData.pleasantness);
    }
    setSearchQuery("");
  }, []);

  const handleSliderChange = useCallback((type: "energy" | "pleasantness", value: number) => {
    if (type === "energy") setEnergy(value);
    else setPleasantness(value);
    setSelectedEmotion(null);
  }, []);

  const handleBubbleClick = useCallback((quadrant: QuadrantType, targetEnergy: number, targetPleasantness: number) => {
    setEnergy(targetEnergy);
    setPleasantness(targetPleasantness);
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

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: [quadrantGradients[quadrant].from, quadrantGradients[quadrant].to, "#ffffff"],
    });

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

  return (
    <div
      className="w-full h-[calc(100vh-100px)] flex flex-col overflow-hidden transition-colors duration-500"
      style={{
        background: `radial-gradient(ellipse at 50% 0%, ${gradientColors.from}06 0%, transparent 60%)`,
      }}
    >
      {/* Step 1: Emotion Selection */}
      {step === 1 && (
        <div className="flex-1 flex flex-col p-3 md:p-4 animate-in fade-in duration-400 overflow-hidden">
          {/* Compact Header */}
          <div className="text-center mb-2">
            <h1 className="text-lg font-light tracking-tight text-foreground">How are you feeling?</h1>
          </div>

          {/* Main 3-Column Layout */}
          <div className="flex-1 flex gap-3 min-h-0 overflow-hidden">
            {/* LEFT: Sliders */}
            <div className="w-52 shrink-0 flex flex-col gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-sm rounded-lg bg-muted/50 border-border/40"
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-40 w-full mt-1 bg-card border border-border rounded-lg shadow-xl p-1.5 space-y-0.5 animate-in fade-in duration-150">
                    {searchResults.map((item) => (
                      <button
                        key={item.emotion}
                        onClick={() => handleEmotionClick(item.emotion, item.quadrant)}
                        className="w-full text-left px-2.5 py-1.5 rounded text-sm hover:bg-muted flex items-center gap-2"
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: QUADRANTS[item.quadrant].color }}
                        />
                        {item.emotion}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Energy Slider */}
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/30">
                <div className="flex items-center justify-between text-[9px] uppercase tracking-wider mb-1.5">
                  <span className="text-muted-foreground">Low</span>
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <Zap className="h-2.5 w-2.5" />
                    Energy {energy}%
                  </span>
                  <span className="text-muted-foreground">High</span>
                </div>
                <Slider value={[energy]} onValueChange={(v) => handleSliderChange("energy", v[0])} max={100} step={1} />
              </div>

              {/* Pleasantness Slider */}
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/30">
                <div className="flex items-center justify-between text-[9px] uppercase tracking-wider mb-1.5">
                  <span className="text-muted-foreground">−</span>
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5" />
                    Pleasant {pleasantness}%
                  </span>
                  <span className="text-muted-foreground">+</span>
                </div>
                <Slider
                  value={[pleasantness]}
                  onValueChange={(v) => handleSliderChange("pleasantness", v[0])}
                  max={100}
                  step={1}
                />
              </div>

              {/* Zone Display */}
              <div
                className="rounded-lg p-2.5 border-2 transition-all duration-300"
                style={{
                  background: `linear-gradient(135deg, ${quadrantInfo.bgColor}, ${quadrantInfo.borderColor}15)`,
                  borderColor: quadrantInfo.borderColor,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{quadrantEmoji[currentQuadrant]}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-xs truncate" style={{ color: quadrantInfo.color }}>
                      {quadrantInfo.label}
                    </p>
                    <p className="text-[9px] text-muted-foreground truncate">{quadrantInfo.description}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CENTER: Bubble Visualization */}
            <div className="flex-1 min-w-0 flex flex-col border border-border/30 rounded-xl bg-muted/20 overflow-hidden">
              <EmotionBubbleViz
                energy={energy}
                pleasantness={pleasantness}
                selectedEmotion={selectedEmotion}
                onEmotionSelect={handleEmotionClick}
                onBubbleClick={handleBubbleClick}
              />
            </div>

            {/* RIGHT: Preview + Action */}
            <div className="w-44 shrink-0 flex flex-col gap-2">
              {/* Preview Card */}
              <div
                className="rounded-xl p-3 border-2 transition-all duration-300 text-center"
                style={{
                  background: `linear-gradient(145deg, ${quadrantInfo.bgColor}, ${quadrantInfo.borderColor}10)`,
                  borderColor: quadrantInfo.borderColor,
                }}
              >
                <span className="text-3xl block mb-1">{quadrantEmoji[currentQuadrant]}</span>
                <p className="text-sm font-semibold" style={{ color: quadrantInfo.color }}>
                  {finalEmotion || "Select..."}
                </p>
                {finalEmotion && <p className="text-[9px] text-muted-foreground mt-0.5">{quadrantInfo.label}</p>}
              </div>

              {/* Continue Button */}
              <Button
                onClick={handleContinue}
                disabled={!finalEmotion}
                className="h-9 rounded-lg text-sm gap-1.5 transition-all duration-300"
                style={{
                  background: finalEmotion
                    ? `linear-gradient(135deg, ${gradientColors.from}, ${gradientColors.to})`
                    : undefined,
                }}
              >
                Continue
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>

              {/* Suggested matches */}
              {suggestedEmotions.length > 0 && !selectedEmotion && (
                <div className="flex-1 rounded-lg border border-border/30 bg-muted/30 p-2 overflow-y-auto">
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5">Nearby feelings</p>
                  <div className="space-y-1">
                    {suggestedEmotions.slice(0, 4).map((em) => (
                      <button
                        key={em.emotion}
                        onClick={() => handleEmotionClick(em.emotion, em.quadrant)}
                        className="w-full text-left px-2 py-1 rounded text-xs hover:bg-muted transition-colors flex items-center gap-1.5"
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: QUADRANTS[em.quadrant].color }}
                        />
                        {em.emotion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Context */}
      {step === 2 && (
        <div className="flex-1 flex flex-col p-4 md:p-6 animate-in fade-in slide-in-from-right-4 duration-400 overflow-y-auto">
          {/* Header */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 mb-1">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                style={{
                  background: `linear-gradient(135deg, ${QUADRANTS[finalQuadrant].color}25, ${QUADRANTS[finalQuadrant].color}10)`,
                  border: `2px solid ${QUADRANTS[finalQuadrant].color}40`,
                }}
              >
                {quadrantEmoji[finalQuadrant]}
              </div>
              <h1 className="text-xl font-light" style={{ color: QUADRANTS[finalQuadrant].color }}>
                {finalEmotion}
              </h1>
            </div>
            <p className="text-xs text-muted-foreground">Add context (optional)</p>
          </div>

          {/* Context Fields */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto w-full">
            {/* Note */}
            <div className="md:col-span-2">
              <Label className="text-xs font-medium mb-1.5 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                Notes
              </Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What's on your mind?"
                className="min-h-[70px] rounded-lg resize-none text-sm"
              />
            </div>

            {/* Who */}
            <div>
              <Label className="text-xs font-medium mb-1.5 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                Who are you with?
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {WHO_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setContext((c) => ({ ...c, who: c.who === preset ? undefined : preset }))}
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border",
                      context.who === preset
                        ? "text-white border-transparent"
                        : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted",
                    )}
                    style={{
                      background:
                        context.who === preset
                          ? `linear-gradient(135deg, ${gradientColors.from}, ${gradientColors.to})`
                          : undefined,
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* What */}
            <div>
              <Label className="text-xs font-medium mb-1.5 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                What are you doing?
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {WHAT_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setContext((c) => ({ ...c, what: c.what === preset ? undefined : preset }))}
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border",
                      context.what === preset
                        ? "text-white border-transparent"
                        : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted",
                    )}
                    style={{
                      background:
                        context.what === preset
                          ? `linear-gradient(135deg, ${gradientColors.from}, ${gradientColors.to})`
                          : undefined,
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Sleep */}
            <div>
              <Label className="text-xs font-medium mb-1.5 flex items-center gap-1.5">
                <Moon className="h-3.5 w-3.5 text-muted-foreground" />
                Sleep last night
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {SLEEP_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() =>
                      setContext((c) => ({ ...c, sleepHours: c.sleepHours === preset ? undefined : preset }))
                    }
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border",
                      context.sleepHours === preset
                        ? "text-white border-transparent"
                        : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted",
                    )}
                    style={{
                      background:
                        context.sleepHours === preset
                          ? `linear-gradient(135deg, ${gradientColors.from}, ${gradientColors.to})`
                          : undefined,
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Activity */}
            <div>
              <Label className="text-xs font-medium mb-1.5 flex items-center gap-1.5">
                <Dumbbell className="h-3.5 w-3.5 text-muted-foreground" />
                Physical activity
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {ACTIVITY_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() =>
                      setContext((c) => ({
                        ...c,
                        physicalActivity: c.physicalActivity === preset ? undefined : preset,
                      }))
                    }
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border",
                      context.physicalActivity === preset
                        ? "text-white border-transparent"
                        : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted",
                    )}
                    style={{
                      background:
                        context.physicalActivity === preset
                          ? `linear-gradient(135deg, ${gradientColors.from}, ${gradientColors.to})`
                          : undefined,
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Journal Toggle */}
            <div className="md:col-span-2 flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
              <div>
                <Label className="text-xs font-medium">Send to Journal</Label>
                <p className="text-[10px] text-muted-foreground">Add to today's entry</p>
              </div>
              <Switch checked={sendToJournal} onCheckedChange={setSendToJournal} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 max-w-4xl mx-auto w-full">
            <Button variant="outline" onClick={handleBack} className="flex-1 h-10 rounded-lg gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-[2] h-10 rounded-lg gap-1.5"
              style={{ background: `linear-gradient(135deg, ${gradientColors.from}, ${gradientColors.to})` }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Save Check-in
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Complete */}
      {step === 3 && savedQuadrant && savedEmotion && (
        <div className="flex-1 flex flex-col p-4 md:p-6 animate-in fade-in zoom-in-95 duration-500">
          {/* Success */}
          <div className="text-center mb-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-xl animate-in zoom-in duration-300"
              style={{
                background: `linear-gradient(135deg, ${QUADRANTS[savedQuadrant].color}30, ${QUADRANTS[savedQuadrant].color}10)`,
                border: `3px solid ${QUADRANTS[savedQuadrant].color}`,
              }}
            >
              <Check className="h-8 w-8" style={{ color: QUADRANTS[savedQuadrant].color }} />
            </div>
            <h1 className="text-xl font-light text-foreground mb-0.5">Check-in saved!</h1>
            <p style={{ color: QUADRANTS[savedQuadrant].color }}>
              {quadrantEmoji[savedQuadrant]} {savedEmotion}
            </p>
          </div>

          {/* Strategies */}
          <div className="flex-1 max-w-3xl mx-auto w-full">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4" style={{ color: QUADRANTS[savedQuadrant].color }} />
              <h2 className="text-sm font-medium">Recommended for you</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {recommendedStrategies.map((strategy, idx) => (
                <div
                  key={strategy.id}
                  className="group p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm 
                             hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 cursor-pointer
                             animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${idx * 80}ms`, animationFillMode: "backwards" }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-2xl">{strategy.icon}</div>
                    <Play className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="font-medium text-sm mb-0.5">{strategy.title}</h3>
                  <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2">{strategy.description}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="px-1.5 py-0.5 rounded bg-muted capitalize">{strategy.type}</span>
                    <Clock className="h-3 w-3" />
                    <span>{strategy.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* New Check-in */}
          <div className="pt-4 max-w-sm mx-auto w-full">
            <Button variant="outline" onClick={resetFlow} className="w-full h-10 rounded-lg gap-1.5">
              <ArrowRight className="h-4 w-4" />
              New Check-in
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
