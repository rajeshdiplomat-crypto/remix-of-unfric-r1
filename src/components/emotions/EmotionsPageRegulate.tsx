import { useEffect, useState } from "react";
import {
  Check,
  ArrowRight,
  Wind,
  Heart,
  Zap,
  Sparkles,
  Activity,
  Clock,
  TrendingUp,
  Calendar,
  ChevronRight,
} from "lucide-react";
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

// Mock last 7 emotion entries for display
interface EmotionEntry {
  id: string;
  emotion: string;
  quadrant: QuadrantType;
  timestamp: Date;
  energy: number;
  pleasantness: number;
}

const generateMockEntries = (): EmotionEntry[] => {
  const emotions: { name: string; quadrant: QuadrantType }[] = [
    { name: "Excited", quadrant: "high-pleasant" },
    { name: "Anxious", quadrant: "high-unpleasant" },
    { name: "Calm", quadrant: "low-pleasant" },
    { name: "Sad", quadrant: "low-unpleasant" },
    { name: "Happy", quadrant: "high-pleasant" },
    { name: "Stressed", quadrant: "high-unpleasant" },
    { name: "Peaceful", quadrant: "low-pleasant" },
  ];

  return emotions.map((e, i) => ({
    id: `entry-${i}`,
    emotion: e.name,
    quadrant: e.quadrant,
    timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Each day back
    energy: Math.floor(Math.random() * 40) + 30,
    pleasantness: Math.floor(Math.random() * 40) + 30,
  }));
};

const typeGradients: Record<string, { from: string; to: string; bg: string }> = {
  breathing: { from: "#06B6D4", to: "#3B82F6", bg: "from-cyan-500/20 to-blue-500/20" },
  grounding: { from: "#F59E0B", to: "#F97316", bg: "from-amber-500/20 to-orange-500/20" },
  cognitive: { from: "#A855F7", to: "#EC4899", bg: "from-purple-500/20 to-pink-500/20" },
  movement: { from: "#EF4444", to: "#F97316", bg: "from-rose-500/20 to-orange-500/20" },
  mindfulness: { from: "#10B981", to: "#14B8A6", bg: "from-emerald-500/20 to-teal-500/20" },
};

const typeIcons: Record<string, React.ReactNode> = {
  breathing: <Wind className="h-4 w-4" />,
  grounding: <Activity className="h-4 w-4" />,
  cognitive: <Sparkles className="h-4 w-4" />,
  movement: <Zap className="h-4 w-4" />,
  mindfulness: <Heart className="h-4 w-4" />,
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
  const [showCheckmark, setShowCheckmark] = useState(true);
  const [activeStrategy, setActiveStrategy] = useState<Strategy | null>(null);
  const [showVisualization, setShowVisualization] = useState(false);
  const [recentEntries] = useState<EmotionEntry[]>(generateMockEntries);

  const quadrantInfo = savedQuadrant ? QUADRANTS[savedQuadrant] : null;
  const accentColor = quadrantInfo?.color || "#10B981";

  // Trigger confetti on mount
  useEffect(() => {
    if (savedQuadrant) {
      const colors = [quadrantInfo?.color || "#10B981", "#ffffff", "#F59E0B"];
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.4 },
        colors,
      });
    }

    const timer = setTimeout(() => setShowCheckmark(false), 2000);
    return () => clearTimeout(timer);
  }, [savedQuadrant, quadrantInfo]);

  const recommendedStrategies = savedQuadrant
    ? STRATEGIES.filter((s) => s.targetQuadrants.includes(savedQuadrant)).slice(0, 3)
    : [];

  const formatDate = (date: Date) => {
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-300px)] animate-in fade-in duration-500">
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-4 flex-1">
        {/* Current Check-in Card - Large Feature Card */}
        <div
          className="col-span-12 lg:col-span-5 rounded-3xl p-6 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}05)`,
            border: `1px solid ${accentColor}30`,
          }}
        >
          {/* Background pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 30% 20%, ${accentColor}40 0%, transparent 50%), radial-gradient(circle at 70% 80%, ${accentColor}30 0%, transparent 40%)`,
            }}
          />

          <div className="relative z-10">
            {/* Checkmark */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500",
                  showCheckmark ? "scale-100" : "scale-90",
                )}
                style={{ backgroundColor: accentColor }}
              >
                <Check className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Check-in Complete</h2>
                <p className="text-sm text-muted-foreground">Great job tracking!</p>
              </div>
            </div>

            {/* Current Emotion */}
            {savedEmotion && savedQuadrant && quadrantInfo && (
              <div
                className="inline-flex items-center gap-3 px-4 py-3 rounded-2xl mb-4"
                style={{
                  background: `linear-gradient(135deg, ${quadrantInfo.bgColor}, ${quadrantInfo.borderColor}30)`,
                  border: `1px solid ${quadrantInfo.borderColor}`,
                }}
              >
                <span className="text-3xl">{quadrantEmoji[savedQuadrant]}</span>
                <div>
                  <p className="text-xs text-muted-foreground">You're feeling</p>
                  <p className="text-lg font-bold" style={{ color: quadrantInfo.color }}>
                    {savedEmotion}
                  </p>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-background/50 backdrop-blur rounded-xl p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <TrendingUp className="h-3 w-3" />
                  Energy Level
                </div>
                <p className="text-lg font-semibold">68%</p>
              </div>
              <div className="bg-background/50 backdrop-blur rounded-xl p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Heart className="h-3 w-3" />
                  Pleasantness
                </div>
                <p className="text-lg font-semibold">72%</p>
              </div>
            </div>

            {/* Logged indicator */}
            <div className="mt-4 flex items-center gap-2 text-sm" style={{ color: accentColor }}>
              <Check className="h-4 w-4" />
              <span>Logged: {savedEmotion || "No emotion"}</span>
            </div>
          </div>
        </div>

        {/* Strategies Grid */}
        <div className="col-span-12 lg:col-span-7 space-y-4">
          {/* Recommended Strategies - Top row */}
          {recommendedStrategies.length > 0 && (
            <div className="bg-card border rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-medium">Recommended for you</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {recommendedStrategies.map((strategy) => (
                  <StrategyCard
                    key={strategy.id}
                    strategy={strategy}
                    isRecommended
                    onStart={() => {
                      setActiveStrategy(strategy);
                      setShowVisualization(true);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Strategies - Grid */}
          <div className="bg-card border rounded-2xl p-4">
            <h3 className="text-sm font-medium mb-3">All Strategies</h3>
            <div className="grid grid-cols-4 gap-2">
              {STRATEGIES.filter((s) => !recommendedStrategies.some((r) => r.id === s.id))
                .slice(0, 8)
                .map((strategy) => (
                  <StrategyCard
                    key={strategy.id}
                    strategy={strategy}
                    compact
                    onStart={() => {
                      setActiveStrategy(strategy);
                      setShowVisualization(true);
                    }}
                  />
                ))}
            </div>
          </div>
        </div>

        {/* Last 7 Entries Card - Wide bottom card */}
        <div className="col-span-12 bg-card border rounded-2xl p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Your Last 7 Entries</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={onViewInsights} className="text-xs gap-1">
              View All
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>

          {/* Entries Timeline */}
          <div className="grid grid-cols-7 gap-2">
            {recentEntries.map((entry, index) => {
              const entryQuadrant = QUADRANTS[entry.quadrant];
              return (
                <div
                  key={entry.id}
                  className={cn(
                    "group rounded-xl p-3 transition-all duration-200 hover:scale-105 cursor-pointer",
                    index === 0 && "ring-2 ring-offset-2",
                  )}
                  style={{
                    backgroundColor: `${entryQuadrant.color}15`,
                    borderColor: entryQuadrant.borderColor,
                    border: `1px solid ${entryQuadrant.borderColor}50`,
                    ...(index === 0 && { ringColor: entryQuadrant.color }),
                  }}
                >
                  <div className="text-2xl mb-1 text-center">{quadrantEmoji[entry.quadrant]}</div>
                  <p className="text-xs font-medium text-center truncate" style={{ color: entryQuadrant.color }}>
                    {entry.emotion}
                  </p>
                  <p className="text-[10px] text-muted-foreground text-center mt-1">{formatDate(entry.timestamp)}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons - Bottom row */}
        <div className="col-span-12 flex gap-3 justify-center">
          <Button variant="outline" onClick={onNewCheckin} className="h-12 px-6 rounded-xl text-sm">
            New Check-in
          </Button>
          <Button
            onClick={onViewInsights}
            className="h-12 px-6 rounded-xl text-sm gap-2"
            style={{ backgroundColor: accentColor }}
          >
            View Insights
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Guided Visualization Modal */}
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

// Strategy Card Component
function StrategyCard({
  strategy,
  isRecommended = false,
  compact = false,
  onStart,
}: {
  strategy: Strategy;
  isRecommended?: boolean;
  compact?: boolean;
  onStart: () => void;
}) {
  const gradient = typeGradients[strategy.type];

  return (
    <button
      onClick={onStart}
      className={cn(
        "group rounded-xl border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200 text-left",
        isRecommended ? "ring-1 ring-amber-400/50 border-amber-400/30 p-4" : "p-3",
        compact && "p-2.5",
      )}
    >
      <div
        className={cn(
          "rounded-lg flex items-center justify-center text-white shadow-sm transition-transform duration-200 group-hover:scale-110 mx-auto mb-2",
          compact ? "w-8 h-8" : "w-10 h-10",
        )}
        style={{
          background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
        }}
      >
        {typeIcons[strategy.type]}
      </div>
      <p
        className={cn(
          "font-medium text-foreground text-center truncate leading-tight",
          compact ? "text-[10px]" : "text-xs",
        )}
      >
        {strategy.title.split(" ").slice(0, 2).join(" ")}
      </p>
      <p className={cn("text-muted-foreground text-center mt-0.5", compact ? "text-[9px]" : "text-[10px]")}>
        {strategy.duration}
      </p>
    </button>
  );
}
