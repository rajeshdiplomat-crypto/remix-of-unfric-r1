import { useState, useMemo, useCallback } from "react";
import { ArrowRight, Check, Sparkles, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { QuadrantType, QUADRANTS } from "./types";
import { EmotionCircularPicker } from "./EmotionCircularPicker";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";

interface EmotionsPageFeelProps {
  energy: number;
  pleasantness: number;
  selectedEmotion: string | null;
  selectedDate: Date;
  onEnergyChange: (value: number) => void;
  onPleasantnessChange: (value: number) => void;
  onEmotionSelect: (emotion: string, quadrant: QuadrantType) => void;
  onContinue: () => void;
  onDateChange: (date: Date) => void;
}

const quadrantEmoji: Record<QuadrantType, string> = {
  "high-pleasant": "😊",
  "high-unpleasant": "😰",
  "low-unpleasant": "😔",
  "low-pleasant": "😌",
};

const EMOTION_CONTENT = {
  badge: "Emotion Tracker",
  title: {
    line1: "Understand Your",
    line2: "Emotional Patterns",
  },
  description: `Track your emotional state using the energy and pleasantness dimensions. This science-backed approach helps you recognize patterns, understand triggers, and develop greater emotional intelligence over time.`,
  features: [
    "Map emotions on a 2D spectrum",
    "Identify your emotional patterns",
    "Get personalized regulation strategies",
  ],
};

export function EmotionsPageFeel({
  energy,
  pleasantness,
  selectedEmotion,
  selectedDate,
  onEnergyChange,
  onPleasantnessChange,
  onEmotionSelect,
  onContinue,
  onDateChange,
}: EmotionsPageFeelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const currentQuadrant: QuadrantType = useMemo(() => {
    if (energy >= 50 && pleasantness >= 50) return "high-pleasant";
    if (energy >= 50 && pleasantness < 50) return "high-unpleasant";
    if (energy < 50 && pleasantness < 50) return "low-unpleasant";
    return "low-pleasant";
  }, [energy, pleasantness]);

  const quadrantInfo = QUADRANTS[currentQuadrant];

  const handleCategorySelect = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  const handleEmotionClick = useCallback(
    (emotion: string, quadrant: QuadrantType) => {
      onEmotionSelect(emotion, quadrant);
    },
    [onEmotionSelect],
  );

  // Responsive wheel size
  const wheelSize = isMobile ? 340 : 520;

  return (
    <div className="flex flex-col min-h-[calc(100vh-300px)] animate-in fade-in duration-500">
      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 flex-1">
        {/* Left: Emotion Description Card */}
        <div className="flex flex-col justify-center order-2 lg:order-1">
          <div className="space-y-6 max-w-md text-left">
            {/* Badge */}
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              {EMOTION_CONTENT.badge}
            </span>

            {/* Title */}
            <h2 className="text-3xl md:text-4xl font-light leading-tight">
              {EMOTION_CONTENT.title.line1} <span className="font-semibold">{EMOTION_CONTENT.title.line2}</span>
            </h2>

            {/* Description */}
            <p className="text-muted-foreground text-lg leading-relaxed">{EMOTION_CONTENT.description}</p>

            {/* Features */}
            <ul className="space-y-3">
              {EMOTION_CONTENT.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-muted-foreground">
                  <Check className="h-5 w-5 text-primary shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: Wheel */}
        <div className="flex flex-col items-center justify-center order-1 lg:order-2">
          {/* Date Picker - near the wheel */}
          <div className="flex items-center gap-2 mb-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal gap-2 rounded-xl",
                    format(selectedDate, "yyyy-MM-dd") !== format(new Date(), "yyyy-MM-dd") && "border-primary text-primary"
                  )}
                >
                  <CalendarDays className="h-4 w-4" />
                  {format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
                    ? "Today"
                    : format(selectedDate, "MMM d, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => { if (date) onDateChange(date); }}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {format(selectedDate, "yyyy-MM-dd") !== format(new Date(), "yyyy-MM-dd") && (
              <span className="text-xs text-muted-foreground">Past date</span>
            )}
          </div>
          <EmotionCircularPicker
            energy={energy}
            pleasantness={pleasantness}
            selectedCategory={selectedCategory}
            selectedEmotion={selectedEmotion}
            onEnergyChange={onEnergyChange}
            onPleasantnessChange={onPleasantnessChange}
            onCategorySelect={handleCategorySelect}
            onEmotionSelect={handleEmotionClick}
            size={wheelSize}
          />
          {/* Creative Continue Button */}
          <div className="mt-8 w-full max-w-sm">
            <button
              onClick={onContinue}
              disabled={!selectedEmotion}
              className={`
                relative w-full overflow-hidden rounded-2xl p-[2px] transition-all duration-500
                ${
                  selectedEmotion
                    ? "bg-gradient-to-r from-primary via-white/50 to-primary animate-pulse hover:animate-none hover:scale-[1.02] active:scale-[0.98]"
                    : "bg-muted/50 cursor-not-allowed"
                }
              `}
              style={{
                background: selectedEmotion
                  ? `linear-gradient(90deg, ${quadrantInfo.color}, white, ${quadrantInfo.color})`
                  : undefined,
                backgroundSize: "200% 100%",
                animation: selectedEmotion ? "shimmer 2s infinite linear" : "none",
              }}
            >
              <div
                className={`
                  flex items-center justify-center gap-4 px-6 py-4 rounded-[14px] backdrop-blur-sm
                  transition-all duration-300
                  ${selectedEmotion ? "bg-background/90 hover:bg-background/80" : "bg-muted"}
                `}
              >
                {selectedEmotion ? (
                  <>
                    <span className="text-2xl animate-bounce">{quadrantEmoji[currentQuadrant]}</span>
                    <div className="flex flex-col items-start">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">Feeling</span>
                      <span className="text-lg font-bold" style={{ color: quadrantInfo.color }}>
                        {selectedEmotion}
                      </span>
                    </div>
                    <div className="flex-1" />
                    <div
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold transition-all"
                      style={{ background: quadrantInfo.color }}
                    >
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </>
                ) : (
                  <span className="text-muted-foreground font-medium">Select an emotion to continue</span>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
