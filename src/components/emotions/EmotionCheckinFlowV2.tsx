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
      {/* Step 1: Emotion Selection - Premium Animated Experience */}
      {step === 1 && (
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Animated Gradient Mesh Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-20 animate-pulse"
              style={{
                background: `radial-gradient(circle, ${gradientColors.from}40, transparent 70%)`,
                top: "-10%",
                left: "-10%",
                animationDuration: "4s",
              }}
            />
            <div
              className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-15 animate-pulse"
              style={{
                background: `radial-gradient(circle, ${gradientColors.to}30, transparent 70%)`,
                bottom: "-15%",
                right: "-10%",
                animationDuration: "5s",
                animationDelay: "1s",
              }}
            />
            {/* Floating particles */}
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-primary/20 animate-bounce"
                style={{
                  left: `${15 + i * 15}%`,
                  top: `${20 + (i % 3) * 25}%`,
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: `${2 + i * 0.5}s`,
                }}
              />
            ))}
          </div>

          {/* Top Navigation Bar */}
          <div className="relative z-10 px-6 py-4 flex items-center justify-between animate-in slide-in-from-top-4 duration-700">
            <div className="flex items-center gap-3">
              <button className="group relative w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-slate-700/50 flex items-center justify-center transition-all duration-500 hover:scale-110 hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/30 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <BookOpen className="h-4.5 w-4.5 text-slate-400 group-hover:text-primary transition-colors duration-300 relative z-10" />
              </button>
              <button className="group relative w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-slate-700/50 flex items-center justify-center transition-all duration-500 hover:scale-110 hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/30 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Clock className="h-4.5 w-4.5 text-slate-400 group-hover:text-primary transition-colors duration-300 relative z-10" />
              </button>
            </div>

            {/* Premium Search Bar */}
            <div className="relative w-80 group animate-in fade-in slide-in-from-right-4 duration-700 delay-150">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 rounded-full blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-primary transition-colors duration-300" />
              <Input
                type="text"
                placeholder="Search emotions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 h-12 rounded-full bg-slate-900/80 backdrop-blur-2xl border-slate-700/40 text-sm placeholder:text-slate-600 focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all duration-500 shadow-inner shadow-black/20"
              />
              {searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-3 bg-slate-900/98 backdrop-blur-3xl border border-slate-700/50 rounded-3xl shadow-2xl shadow-black/50 p-3 animate-in fade-in slide-in-from-top-2 zoom-in-95 duration-300">
                  {searchResults.map((item, idx) => (
                    <button
                      key={item.emotion}
                      onClick={() => handleEmotionClick(item.emotion, item.quadrant)}
                      className="w-full text-left px-4 py-3.5 rounded-2xl text-sm hover:bg-white/5 flex items-center gap-4 transition-all duration-300 hover:translate-x-2 group/item animate-in fade-in slide-in-from-left-2"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div
                        className="w-4 h-4 rounded-full ring-2 ring-white/10 group-hover/item:ring-white/30 group-hover/item:scale-125 transition-all duration-300 shadow-lg"
                        style={{
                          backgroundColor: QUADRANTS[item.quadrant].color,
                          boxShadow: `0 0 20px ${QUADRANTS[item.quadrant].color}50`,
                        }}
                      />
                      <span className="font-medium text-white/90 group-hover/item:text-white">{item.emotion}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Premium Slider Panel */}
          <div className="relative z-10 mx-6 mb-6 rounded-3xl bg-gradient-to-br from-slate-900/95 via-slate-850/95 to-slate-900/95 backdrop-blur-2xl p-6 border border-slate-700/30 shadow-2xl shadow-black/40 animate-in slide-in-from-top-6 duration-700 delay-200 overflow-hidden">
            {/* Animated glow effects */}
            <div className="absolute top-0 left-1/4 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
            <div
              className="absolute bottom-0 right-1/4 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"
              style={{ animationDelay: "1s" }}
            />

            <div className="grid grid-cols-2 gap-10 relative z-10">
              {/* Energy Slider */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 uppercase tracking-[0.2em] font-semibold">Low</span>
                  <div className="flex items-center gap-2.5 px-5 py-2 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/25 shadow-lg shadow-amber-500/10">
                    <Zap className="h-4 w-4 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                    <span className="text-sm font-bold text-amber-200 tracking-wider">Energy</span>
                  </div>
                  <span className="text-[11px] text-slate-500 uppercase tracking-[0.2em] font-semibold">High</span>
                </div>
                <div className="relative h-5 group/slider">
                  <div className="absolute inset-0 rounded-full bg-slate-800/90 border border-slate-700/50 shadow-inner shadow-black/50" />
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${energy}%`,
                      background: "linear-gradient(90deg, #F59E0B, #F97316, #EA580C)",
                      boxShadow: "0 0 30px rgba(249,115,22,0.4), inset 0 1px 1px rgba(255,255,255,0.2)",
                    }}
                  />
                  <Slider
                    value={[energy]}
                    onValueChange={(v) => handleSliderChange("energy", v[0])}
                    max={100}
                    step={1}
                    className="absolute inset-0 [&>span:first-child]:bg-transparent [&_[role=slider]]:h-7 [&_[role=slider]]:w-7 [&_[role=slider]]:bg-white [&_[role=slider]]:border-3 [&_[role=slider]]:border-orange-400 [&_[role=slider]]:shadow-[0_0_20px_rgba(249,115,22,0.6)] [&_[role=slider]]:transition-all [&_[role=slider]]:duration-300 [&_[role=slider]]:hover:scale-125 [&_[role=slider]]:hover:shadow-[0_0_30px_rgba(249,115,22,0.8)] [&_[role=slider]]:cursor-grab [&_[role=slider]]:active:cursor-grabbing [&_[role=slider]]:active:scale-110"
                  />
                </div>
              </div>

              {/* Pleasantness Slider */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-base text-slate-500 font-bold">−</span>
                  <div className="flex items-center gap-2.5 px-5 py-2 rounded-full bg-gradient-to-r from-emerald-500/15 to-teal-500/15 border border-emerald-500/25 shadow-lg shadow-emerald-500/10">
                    <Sparkles className="h-4 w-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                    <span className="text-sm font-bold text-emerald-200 tracking-wider">Pleasant</span>
                  </div>
                  <span className="text-base text-slate-500 font-bold">+</span>
                </div>
                <div className="relative h-5 group/slider">
                  <div className="absolute inset-0 rounded-full bg-slate-800/90 border border-slate-700/50 shadow-inner shadow-black/50" />
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${pleasantness}%`,
                      background: "linear-gradient(90deg, #10B981, #14B8A6, #06B6D4)",
                      boxShadow: "0 0 30px rgba(20,184,166,0.4), inset 0 1px 1px rgba(255,255,255,0.2)",
                    }}
                  />
                  <Slider
                    value={[pleasantness]}
                    onValueChange={(v) => handleSliderChange("pleasantness", v[0])}
                    max={100}
                    step={1}
                    className="absolute inset-0 [&>span:first-child]:bg-transparent [&_[role=slider]]:h-7 [&_[role=slider]]:w-7 [&_[role=slider]]:bg-white [&_[role=slider]]:border-3 [&_[role=slider]]:border-emerald-400 [&_[role=slider]]:shadow-[0_0_20px_rgba(20,184,166,0.6)] [&_[role=slider]]:transition-all [&_[role=slider]]:duration-300 [&_[role=slider]]:hover:scale-125 [&_[role=slider]]:hover:shadow-[0_0_30px_rgba(20,184,166,0.8)] [&_[role=slider]]:cursor-grab [&_[role=slider]]:active:cursor-grabbing [&_[role=slider]]:active:scale-110"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* How are you feeling? Title */}
          <h1 className="relative z-10 text-center text-3xl md:text-4xl font-extralight tracking-tight mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <span className="bg-gradient-to-r from-foreground via-foreground/70 to-foreground bg-clip-text text-transparent">
              How are you feeling?
            </span>
          </h1>

          {/* Main Content Area */}
          <div className="relative z-10 flex-1 flex gap-6 px-6 pb-6 min-h-0 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-400">
            {/* LEFT: Interactive Emotion Orbs */}
            <div className="flex-1 rounded-3xl bg-gradient-to-br from-slate-900/50 via-background/30 to-slate-900/50 backdrop-blur-xl border border-slate-700/20 p-6 overflow-hidden relative">
              {/* Ambient glow based on current quadrant */}
              <div
                className="absolute inset-0 opacity-30 transition-all duration-1000 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse at 50% 50%, ${quadrantInfo.color}15, transparent 70%)`,
                }}
              />

              {/* Floating Emotion Orbs Grid */}
              <div className="relative h-full flex flex-wrap items-center justify-center gap-4 content-center">
                {suggestedEmotions.slice(0, 8).map((em, idx) => (
                  <button
                    key={em.emotion}
                    onClick={() => handleEmotionClick(em.emotion, em.quadrant)}
                    className={cn(
                      "group relative w-20 h-20 md:w-24 md:h-24 rounded-full transition-all duration-500 animate-in fade-in zoom-in-75",
                      "hover:scale-115 hover:-translate-y-2",
                      selectedEmotion === em.emotion ? "scale-110 -translate-y-2 z-20" : "hover:z-10",
                    )}
                    style={{
                      animationDelay: `${idx * 80}ms`,
                      animationFillMode: "backwards",
                    }}
                  >
                    {/* Outer glow ring */}
                    <div
                      className={cn(
                        "absolute inset-0 rounded-full transition-all duration-500",
                        selectedEmotion === em.emotion
                          ? "opacity-100 scale-125"
                          : "opacity-0 group-hover:opacity-70 group-hover:scale-115",
                      )}
                      style={{
                        background: `radial-gradient(circle, ${QUADRANTS[em.quadrant].color}40, transparent 70%)`,
                        filter: "blur(12px)",
                      }}
                    />

                    {/* Main orb */}
                    <div
                      className={cn(
                        "absolute inset-0 rounded-full transition-all duration-500 border-2",
                        selectedEmotion === em.emotion
                          ? "border-white/50 shadow-2xl"
                          : "border-white/10 group-hover:border-white/30",
                      )}
                      style={{
                        background: `linear-gradient(145deg, ${QUADRANTS[em.quadrant].color}30, ${QUADRANTS[em.quadrant].color}10)`,
                        boxShadow:
                          selectedEmotion === em.emotion
                            ? `0 0 40px ${QUADRANTS[em.quadrant].color}50, inset 0 0 30px ${QUADRANTS[em.quadrant].color}20`
                            : `0 4px 20px rgba(0,0,0,0.3)`,
                      }}
                    />

                    {/* Inner content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl md:text-4xl transition-transform duration-300 group-hover:scale-110 drop-shadow-lg">
                        {quadrantEmoji[em.quadrant]}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-semibold mt-1 px-2 py-0.5 rounded-full transition-all duration-300 truncate max-w-full",
                          selectedEmotion === em.emotion
                            ? "opacity-100 bg-white/20 backdrop-blur-sm"
                            : "opacity-0 group-hover:opacity-100",
                        )}
                        style={{ color: QUADRANTS[em.quadrant].color }}
                      >
                        {em.emotion}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* RIGHT: Selection Panel */}
            <div className="w-56 shrink-0 flex flex-col gap-4">
              {/* Selected Emotion Card */}
              <div
                className="rounded-3xl p-5 border-2 transition-all duration-700 text-center backdrop-blur-xl relative overflow-hidden group animate-in fade-in slide-in-from-right-4"
                style={{
                  background: `linear-gradient(160deg, ${quadrantInfo.bgColor}95, ${quadrantInfo.borderColor}15)`,
                  borderColor: `${quadrantInfo.borderColor}80`,
                }}
              >
                {/* Animated glow */}
                <div
                  className="absolute inset-0 opacity-30 group-hover:opacity-50 transition-opacity duration-700"
                  style={{
                    background: `radial-gradient(circle at 50% 30%, ${quadrantInfo.color}40, transparent 70%)`,
                  }}
                />

                <div className="relative z-10">
                  <div className="text-5xl mb-3 transition-transform duration-500 hover:scale-110 inline-block drop-shadow-lg">
                    {quadrantEmoji[currentQuadrant]}
                  </div>
                  <p className="text-lg font-bold transition-colors duration-300" style={{ color: quadrantInfo.color }}>
                    {finalEmotion || "Select..."}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1.5 uppercase tracking-widest font-medium">
                    {quadrantInfo.label}
                  </p>
                </div>
              </div>

              {/* Continue Button */}
              <Button
                onClick={handleContinue}
                disabled={!finalEmotion}
                className="h-14 rounded-2xl text-base font-bold gap-2.5 transition-all duration-500 hover:scale-105 hover:-translate-y-1 active:scale-98 shadow-2xl disabled:opacity-30 relative overflow-hidden group animate-in fade-in slide-in-from-right-4"
                style={{
                  background: finalEmotion
                    ? `linear-gradient(135deg, ${gradientColors.from}, ${gradientColors.to})`
                    : undefined,
                  boxShadow: finalEmotion
                    ? `0 10px 40px ${gradientColors.from}40, 0 4px 15px ${gradientColors.to}30`
                    : undefined,
                }}
              >
                {/* Shine sweep effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                <span className="relative z-10 uppercase tracking-wider">Continue</span>
                <ArrowRight className="h-5 w-5 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>

              {/* Nearby Feelings */}
              <div className="flex-1 rounded-2xl border border-slate-700/30 bg-gradient-to-b from-slate-900/60 to-slate-900/40 backdrop-blur-xl p-4 overflow-y-auto animate-in fade-in slide-in-from-right-4">
                <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 mb-3 font-bold">Nearby Feelings</p>
                <div className="space-y-1.5">
                  {suggestedEmotions.slice(0, 5).map((em, idx) => (
                    <button
                      key={em.emotion}
                      onClick={() => handleEmotionClick(em.emotion, em.quadrant)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-300 flex items-center gap-3 group/item animate-in fade-in slide-in-from-right-2",
                        selectedEmotion === em.emotion
                          ? "bg-primary/15 text-primary shadow-lg"
                          : "hover:bg-white/5 text-slate-300 hover:text-white",
                      )}
                      style={{ animationDelay: `${400 + idx * 60}ms`, animationFillMode: "backwards" }}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full transition-all duration-300 group-hover/item:scale-150 shadow-lg"
                        style={{
                          backgroundColor: QUADRANTS[em.quadrant].color,
                          boxShadow: `0 0 10px ${QUADRANTS[em.quadrant].color}50`,
                        }}
                      />
                      <span className="font-medium">{em.emotion}</span>
                    </button>
                  ))}
                </div>
              </div>
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
