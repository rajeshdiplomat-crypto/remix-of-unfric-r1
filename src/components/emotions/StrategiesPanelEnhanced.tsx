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
    <div className="h-full flex flex-col">
      {/* Header at Top */}
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          Regulation Strategies
        </h2>
        <p className="text-[10px] text-muted-foreground">
          {currentQuadrant
            ? `Tools for ${currentEmotion?.toLowerCase() || quadrantInfo?.description.toLowerCase()}`
            : "Explore techniques"}
        </p>
      </div>

      {/* Strategies Grid - Fills remaining space */}
      <div className="flex-1 flex flex-col gap-3 min-h-0">
        {/* Recommended - Grid of Cards */}
        {recommendedStrategies.length > 0 && (
          <div className="space-y-1.5">
            <h3 className="text-[9px] font-semibold text-rose-500 uppercase tracking-wider flex items-center gap-1">
              <Heart className="h-2 w-2" /> Recommended
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {recommendedStrategies.slice(0, 6).map((strategy) => (
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

        {/* All Strategies - Grid of Cards */}
        <div className="flex-1 space-y-1.5 min-h-0">
          <h3 className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">All Strategies</h3>
          <div className="grid grid-cols-3 gap-2 auto-rows-fr">
            {otherStrategies.map((strategy) => (
              <StrategySquareCard
                key={strategy.id}
                strategy={strategy}
                onStart={() => handleStartVisualization(strategy)}
              />
            ))}
          </div>
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
      className={`group p-3 rounded-lg transition-all duration-200 hover:shadow-sm hover:scale-[1.02] cursor-pointer flex flex-col items-center justify-center text-center aspect-square ${
        isRecommended
          ? "bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-900/20 dark:to-orange-900/20 border border-rose-200 dark:border-rose-800"
          : "bg-card border border-border hover:border-primary/30"
      }`}
    >
      {/* Icon */}
      <div className={`p-2 rounded-lg bg-gradient-to-br ${typeGradients[strategy.type]} text-white mb-2 shadow-sm`}>
        <div className="h-5 w-5">{iconMap[strategy.icon]}</div>
      </div>

      {/* Title */}
      <h4 className="font-medium text-xs text-foreground leading-tight line-clamp-2 mb-1">{strategy.title}</h4>

      {/* Duration */}
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Clock className="h-2.5 w-2.5" />
        <span>{strategy.duration}</span>
      </div>
    </div>
  );
}
