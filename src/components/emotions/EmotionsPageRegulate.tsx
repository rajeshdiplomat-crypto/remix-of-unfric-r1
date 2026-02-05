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

  // Trigger confetti on mount
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
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* Top Row: Check-in Complete + Recommended */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Check-in Complete Card */}
        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <div className="flex items-start gap-4 mb-6">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 shadow-lg"
              style={{ backgroundColor: accentColor }}
            >
              <Check className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Check-in Complete</h2>
              <p className="text-sm text-muted-foreground">Great job tracking!</p>
            </div>
          </div>

          {/* Current Emotion Badge */}
          {savedEmotion && savedQuadrant && quadrantInfo && (
            <div
              className="inline-flex items-center gap-3 px-4 py-2.5 rounded-full mb-6"
              style={{
                backgroundColor: `${quadrantInfo.color}15`,
                border: `1px solid ${quadrantInfo.color}40`,
              }}
            >
              <span className="text-2xl">{quadrantEmoji[savedQuadrant]}</span>
              <div>
                <p className="text-[10px] text-muted-foreground leading-none">You're feeling</p>
                <p className="text-sm font-bold" style={{ color: quadrantInfo.color }}>
                  {savedEmotion}
                </p>
              </div>
            </div>
          )}

          {/* Stats Row */}
          <div className="flex gap-6 mb-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Energy Level</span>
              <span className="font-semibold">68%</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Pleasantness</span>
              <span className="font-semibold">72%</span>
            </div>
          </div>

          {/* Logged Indicator */}
          <div className="flex items-center gap-2 text-sm" style={{ color: accentColor }}>
            <Check className="h-4 w-4" />
            <span>Logged: {savedEmotion || "No emotion"}</span>
          </div>
        </div>

        {/* Recommended Strategies Card */}
        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <h3 className="font-medium">Recommended for you</h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {recommendedStrategies.map((strategy) => (
              <button
                key={strategy.id}
                onClick={() => handleStrategyClick(strategy)}
                className="group p-4 rounded-xl border-2 border-amber-300/30 bg-amber-50/50 dark:bg-amber-900/10 hover:border-amber-400/50 hover:shadow-md transition-all duration-200"
              >
                <div
                  className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform"
                  style={{
                    background: `linear-gradient(135deg, ${typeGradients[strategy.type].from}, ${typeGradients[strategy.type].to})`,
                  }}
                >
                  {typeIcons[strategy.type]}
                </div>
                <p className="text-xs font-medium text-center truncate">{strategy.title}</p>
                <p className="text-[10px] text-muted-foreground text-center mt-1">{strategy.duration}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Second Row: All Strategies */}
      <div className="bg-card border rounded-2xl p-6 shadow-sm">
        <h3 className="font-medium mb-4">All Strategies</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {allStrategies.map((strategy) => (
            <button
              key={strategy.id}
              onClick={() => handleStrategyClick(strategy)}
              className="group p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 hover:border-primary/30 hover:shadow-md transition-all duration-200"
            >
              <div
                className="w-11 h-11 mx-auto mb-2.5 rounded-xl flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform"
                style={{
                  background: `linear-gradient(135deg, ${typeGradients[strategy.type].from}, ${typeGradients[strategy.type].to})`,
                }}
              >
                {typeIcons[strategy.type]}
              </div>
              <p className="text-xs font-medium text-center truncate">{strategy.title}</p>
              <p className="text-[10px] text-muted-foreground text-center mt-0.5">{strategy.duration}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Third Row: Last 7 Entries */}
      <div className="bg-card border rounded-2xl p-6 shadow-sm">
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
                  "rounded-2xl p-4 transition-all duration-200 hover:scale-105 cursor-pointer text-center",
                  isFirst && "ring-2 ring-offset-2",
                )}
                style={{
                  backgroundColor: `${entryQuadrant.color}12`,
                  border: `1px solid ${entryQuadrant.color}30`,
                  ...(isFirst && {
                    ringColor: entryQuadrant.color,
                    backgroundColor: `${entryQuadrant.color}20`,
                  }),
                }}
              >
                <div className="text-3xl mb-2">{quadrantEmoji[entry.quadrant]}</div>
                <p className="text-xs font-semibold truncate" style={{ color: entryQuadrant.color }}>
                  {entry.emotion}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">{formatDate(entry.timestamp)}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 pt-2">
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
