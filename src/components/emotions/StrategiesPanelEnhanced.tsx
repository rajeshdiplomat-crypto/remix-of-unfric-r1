import { Button } from "@/components/ui/button";
import { QuadrantType, QUADRANTS, STRATEGIES, Strategy } from "./types";
import { Wind, Hand, User, Lightbulb, Sparkles, Heart, Zap, Sun, Play, Clock } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GuidedVisualization } from "./GuidedVisualization";

interface StrategiesPanelEnhancedProps {
  currentQuadrant?: QuadrantType | null;
  currentEmotion?: string | null;
}

const iconMap: Record<string, React.ReactNode> = {
  Wind: <Wind className="h-5 w-5" />,
  Hand: <Hand className="h-5 w-5" />,
  User: <User className="h-5 w-5" />,
  Lightbulb: <Lightbulb className="h-5 w-5" />,
  Sparkles: <Sparkles className="h-5 w-5" />,
  Heart: <Heart className="h-5 w-5" />,
  Zap: <Zap className="h-5 w-5" />,
  Sun: <Sun className="h-5 w-5" />,
};

const largeIconMap: Record<string, React.ReactNode> = {
  Wind: <Wind className="h-8 w-8" />,
  Hand: <Hand className="h-8 w-8" />,
  User: <User className="h-8 w-8" />,
  Lightbulb: <Lightbulb className="h-8 w-8" />,
  Sparkles: <Sparkles className="h-8 w-8" />,
  Heart: <Heart className="h-8 w-8" />,
  Zap: <Zap className="h-8 w-8" />,
  Sun: <Sun className="h-8 w-8" />,
};

const typeGradients: Record<string, string> = {
  breathing: "from-cyan-500 to-blue-500",
  grounding: "from-amber-500 to-orange-500",
  cognitive: "from-purple-500 to-pink-500",
  movement: "from-rose-500 to-red-500",
  mindfulness: "from-emerald-500 to-teal-500",
};

const typeLabels: Record<string, string> = {
  breathing: "Breathing",
  grounding: "Grounding",
  cognitive: "Cognitive",
  movement: "Movement",
  mindfulness: "Mindfulness",
};

export function StrategiesPanelEnhanced({ currentQuadrant, currentEmotion }: StrategiesPanelEnhancedProps) {
  const [activeStrategy, setActiveStrategy] = useState<Strategy | null>(null);
  const [showVisualization, setShowVisualization] = useState(false);

  const sortedStrategies = [...STRATEGIES].sort((a, b) => {
    if (!currentQuadrant) return 0;
    const aMatches = a.targetQuadrants.includes(currentQuadrant);
    const bMatches = b.targetQuadrants.includes(currentQuadrant);
    if (aMatches && !bMatches) return -1;
    if (!aMatches && bMatches) return 1;
    return 0;
  });

  const recommendedStrategies = currentQuadrant
    ? sortedStrategies.filter((s) => s.targetQuadrants.includes(currentQuadrant))
    : [];
  const otherStrategies = currentQuadrant
    ? sortedStrategies.filter((s) => !s.targetQuadrants.includes(currentQuadrant))
    : sortedStrategies;

  const quadrantInfo = currentQuadrant ? QUADRANTS[currentQuadrant] : null;

  const handleStartVisualization = (strategy: Strategy) => {
    setActiveStrategy(strategy);
    setShowVisualization(true);
  };

  // Pick a featured strategy for the hero image
  const featuredStrategy = recommendedStrategies[0] || sortedStrategies[0];

  return (
    <div className="space-y-3">
      {/* Hero Image - Compact */}
      <div className="relative w-full aspect-[3/1] rounded-xl overflow-hidden bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600">
        {/* Decorative background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-2 left-2 w-12 h-12 rounded-full bg-white/10 blur-xl" />
          <div className="absolute bottom-2 right-2 w-14 h-14 rounded-full bg-white/10 blur-xl" />
        </div>

        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-center gap-4 p-3">
          <div className={`p-3 rounded-xl bg-white/20 backdrop-blur-sm text-white shadow-lg`}>
            {featuredStrategy ? iconMap[featuredStrategy.icon] : <Sparkles className="h-5 w-5" />}
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-white">
              {featuredStrategy ? featuredStrategy.title : "Regulation Exercises"}
            </p>
            <p className="text-xs text-white/80">{featuredStrategy ? featuredStrategy.duration : "Take a moment"}</p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          Regulation Strategies
        </h2>
        <p className="text-xs text-muted-foreground">
          {currentQuadrant
            ? `Tools for ${currentEmotion?.toLowerCase() || quadrantInfo?.description.toLowerCase()}`
            : "Explore techniques"}
        </p>
      </div>

      {/* Recommended - Grid of Square Cards */}
      {recommendedStrategies.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[10px] font-semibold text-rose-500 uppercase tracking-wider flex items-center gap-1">
            <Heart className="h-2.5 w-2.5" /> Recommended
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {recommendedStrategies.slice(0, 4).map((strategy) => (
              <StrategySquareCard
                key={strategy.id}
                strategy={strategy}
                isRecommended
                onStart={() => handleStartVisualization(strategy)}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Strategies - Grid of Square Cards */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">All Strategies</h3>
        <div className="grid grid-cols-3 gap-2">
          {otherStrategies.map((strategy) => (
            <StrategySquareCard
              key={strategy.id}
              strategy={strategy}
              onStart={() => handleStartVisualization(strategy)}
            />
          ))}
        </div>
      </div>

      {/* Guided Visualization Modal */}
      <Dialog open={showVisualization} onOpenChange={setShowVisualization}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-2xl">
          {activeStrategy && (
            <>
              <DialogHeader className="p-5 pb-0">
                <DialogTitle className="flex items-center gap-3">
                  <span className={`p-2 rounded-xl bg-gradient-to-br ${typeGradients[activeStrategy.type]} text-white`}>
                    {iconMap[activeStrategy.icon]}
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

function StrategySquareCard({
  strategy,
  isRecommended = false,
  onStart,
}: {
  strategy: Strategy;
  isRecommended?: boolean;
  onStart: () => void;
}) {
  return (
    <div
      onClick={onStart}
      className={`group p-2.5 rounded-xl transition-all duration-200 hover:shadow-md hover:scale-[1.02] cursor-pointer flex flex-col items-center justify-center text-center ${
        isRecommended
          ? "bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-900/20 dark:to-orange-900/20 border border-rose-200 dark:border-rose-800"
          : "bg-card border border-border hover:border-primary/30"
      }`}
    >
      {/* Icon */}
      <div
        className={`p-2 rounded-lg bg-gradient-to-br ${typeGradients[strategy.type]} text-white mb-1.5 shadow-sm group-hover:shadow-md transition-shadow`}
      >
        <div className="h-4 w-4">{iconMap[strategy.icon]}</div>
      </div>

      {/* Title */}
      <h4 className="font-medium text-[11px] text-foreground leading-tight line-clamp-2">{strategy.title}</h4>

      {/* Duration */}
      <div className="flex items-center gap-0.5 text-[9px] text-muted-foreground mt-0.5">
        <Clock className="h-2.5 w-2.5" />
        <span>{strategy.duration}</span>
      </div>
    </div>
  );
}
