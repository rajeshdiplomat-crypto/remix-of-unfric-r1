import { useEffect, useState } from "react";
import { Check, ArrowRight, Wind, Heart, Zap, Sparkles, Activity, Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QuadrantType, QUADRANTS, STRATEGIES, Strategy } from "./types";
import { GuidedVisualization } from "./GuidedVisualization";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface EmotionsPageRegulateProps {
  savedQuadrant: QuadrantType | null;
  savedEmotion: string | null;
  onNewCheckin: () => void;
  onViewInsights: () => void;
}

// Mock last 7 emotion entries
interface EmotionEntry {
  id: string;
  emotion: string;
  quadrant: QuadrantType;
  timestamp: Date;
}

const MOCK_ENTRIES: EmotionEntry[] = [
  { id: "1", emotion: "Excited", quadrant: "high-pleasant", timestamp: new Date() },
  { id: "2", emotion: "Anxious", quadrant: "high-unpleasant", timestamp: new Date(Date.now() - 86400000) },
  { id: "3", emotion: "Calm", quadrant: "low-pleasant", timestamp: new Date(Date.now() - 86400000 * 2) },
  { id: "4", emotion: "Sad", quadrant: "low-unpleasant", timestamp: new Date(Date.now() - 86400000 * 3) },
  { id: "5", emotion: "Happy", quadrant: "high-pleasant", timestamp: new Date(Date.now() - 86400000 * 4) },
  { id: "6", emotion: "Stressed", quadrant: "high-unpleasant", timestamp: new Date(Date.now() - 86400000 * 5) },
  { id: "7", emotion: "Peaceful", quadrant: "low-pleasant", timestamp: new Date(Date.now() - 86400000 * 6) },
];

const typeGradients: Record<string, { from: string; to: string }> = {
  breathing: { from: "#06B6D4", to: "#3B82F6" },
  grounding: { from: "#F59E0B", to: "#F97316" },
  cognitive: { from: "#A855F7", to: "#EC4899" },
  movement: { from: "#EF4444", to: "#F97316" },
  mindfulness: { from: "#10B981", to: "#14B8A6" },
};

const typeIcons: Record<string, React.ReactNode> = {
  breathing: <Wind className="h-5 w-5" />,
  grounding: <Activity className="h-5 w-5" />,
  cognitive: <Sparkles className="h-5 w-5" />,
  movement: <Zap className="h-5 w-5" />,
  mindfulness: <Heart className="h-5 w-5" />,
};

const quadrantEmoji: Record<QuadrantType, string> = {
  "high-pleasant": "😊",
  "high-unpleasant": "😰",
  "low-unpleasant": "😔",
  "low-pleasant": "😌",
};

const REGULATE_CONTENT = {
  badge: "Well Done",
  title: { line1: "Time to", line2: "Regulate" },
  description:
    "Great job tracking your emotion! Now explore strategies designed for your current emotional state to help you feel balanced and grounded.",
  features: ["Personalized recommendations", "Guided breathing exercises", "Quick mindfulness techniques"],
};

export function EmotionsPageRegulate({
  savedQuadrant,
  savedEmotion,
  onNewCheckin,
  onViewInsights,
}: EmotionsPageRegulateProps) {
  const [activeStrategy, setActiveStrategy] = useState<Strategy | null>(null);
  const [showVisualization, setShowVisualization] = useState(false);

  const quadrantInfo = savedQuadrant ? QUADRANTS[savedQuadrant] : null;
  const accentColor = quadrantInfo?.color || "#10B981";

  useEffect(() => {
    if (savedQuadrant) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.4 },
        colors: [accentColor, "#ffffff", "#F59E0B"],
      });
    }
  }, [savedQuadrant, accentColor]);

  const recommendedStrategies = savedQuadrant
    ? STRATEGIES.filter((s) => s.targetQuadrants.includes(savedQuadrant)).slice(0, 3)
    : [];

  const allStrategies = STRATEGIES.filter((s) => !recommendedStrategies.some((r) => r.id === s.id)).slice(0, 5);

  const formatDate = (date: Date) => {
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const handleStrategyClick = (strategy: Strategy) => {
    setActiveStrategy(strategy);
    setShowVisualization(true);
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header Section with Title & Description */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4"
          style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
        >
          <Sparkles className="h-3 w-3" />
          {REGULATE_CONTENT.badge}
        </div>

        <h1 className="text-3xl md:text-4xl font-light mb-4">
          {REGULATE_CONTENT.title.line1}{" "}
          <span className="font-bold" style={{ color: accentColor }}>
            {REGULATE_CONTENT.title.line2}
          </span>
        </h1>

        <p className="text-muted-foreground text-sm leading-relaxed max-w-lg mx-auto">{REGULATE_CONTENT.description}</p>
      </div>

      {/* Strategy Cards - Pricing Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {recommendedStrategies.map((strategy, index) => {
          const isMiddle = index === 1;
          const gradient = typeGradients[strategy.type];

          return (
            <div
              key={strategy.id}
              className={cn(
                "rounded-2xl border-2 p-6 transition-all duration-300 hover:shadow-xl cursor-pointer",
                isMiddle
                  ? "border-primary bg-primary/5 scale-105 shadow-lg"
                  : "border-border bg-card hover:border-primary/50",
              )}
              onClick={() => handleStrategyClick(strategy)}
            >
              {/* Strategy Type Badge */}
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">{strategy.type}</div>

              {/* Strategy Icon */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg mb-4"
                style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
              >
                {typeIcons[strategy.type]}
              </div>

              {/* Strategy Title */}
              <h3 className="text-lg font-semibold mb-1">{strategy.title}</h3>

              {/* Duration */}
              <p className="text-sm text-muted-foreground mb-4">{strategy.duration}</p>

              {/* Description / Features */}
              <p className="text-xs text-muted-foreground mb-6 line-clamp-2">{strategy.description}</p>

              {/* CTA Button */}
              <Button
                className={cn(
                  "w-full rounded-lg",
                  isMiddle ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/80",
                )}
                style={isMiddle ? { backgroundColor: accentColor } : undefined}
              >
                Start Session
              </Button>
            </div>
          );
        })}
      </div>

      {/* All Strategies Section */}
      <div className="mb-10">
        <h3 className="text-center text-sm font-medium text-muted-foreground mb-4">MORE STRATEGIES</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {allStrategies.map((strategy) => (
            <button
              key={strategy.id}
              onClick={() => handleStrategyClick(strategy)}
              className="group p-4 rounded-xl border-2 border-border bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200 text-center"
            >
              <div
                className="w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform"
                style={{
                  background: `linear-gradient(135deg, ${typeGradients[strategy.type].from}, ${typeGradients[strategy.type].to})`,
                }}
              >
                {typeIcons[strategy.type]}
              </div>
              <p className="text-xs font-medium truncate">{strategy.title}</p>
              <p className="text-[10px] text-muted-foreground">{strategy.duration}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Last 7 Entries */}
      <div className="border-2 border-border rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium">Your Last 7 Entries</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onViewInsights} className="text-xs gap-1 h-8">
            VIEW ALL
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-3">
          {MOCK_ENTRIES.map((entry, index) => {
            const entryQuadrant = QUADRANTS[entry.quadrant];
            const isFirst = index === 0;

            return (
              <div
                key={entry.id}
                className={cn(
                  "rounded-xl p-3 transition-all duration-200 hover:scale-105 cursor-pointer text-center border-2",
                  isFirst ? "border-primary shadow-md" : "border-transparent",
                )}
                style={{ backgroundColor: `${entryQuadrant.color}15` }}
              >
                <div className="text-2xl mb-1">{quadrantEmoji[entry.quadrant]}</div>
                <p className="text-[10px] font-semibold truncate" style={{ color: entryQuadrant.color }}>
                  {entry.emotion}
                </p>
                <p className="text-[9px] text-muted-foreground">{formatDate(entry.timestamp)}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" size="lg" onClick={onNewCheckin} className="h-12 px-8 rounded-xl">
          NEW CHECK-IN
        </Button>
        <Button
          size="lg"
          onClick={onViewInsights}
          className="h-12 px-8 rounded-xl gap-2"
          style={{ backgroundColor: accentColor }}
        >
          INSIGHTS
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Visualization Modal */}
      <Dialog open={showVisualization} onOpenChange={setShowVisualization}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
          {activeStrategy && (
            <>
              <DialogHeader className="p-6 pb-0">
                <DialogTitle className="flex items-center gap-3 text-xl">
                  <span
                    className="p-3 rounded-xl text-white shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${typeGradients[activeStrategy.type].from}, ${typeGradients[activeStrategy.type].to})`,
                    }}
                  >
                    {typeIcons[activeStrategy.type]}
                  </span>
                  {activeStrategy.title}
                </DialogTitle>
              </DialogHeader>
              <GuidedVisualization
                strategy={activeStrategy}
                onComplete={() => setShowVisualization(false)}
                onSkip={() => setShowVisualization(false)}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
