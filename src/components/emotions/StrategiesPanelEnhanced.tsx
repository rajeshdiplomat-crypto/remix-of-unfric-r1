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
    <div className="space-y-5">
      {/* Hero Image Card */}
      <div className="relative aspect-square w-full max-w-[180px] mx-auto rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border border-border/50">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
          <div className={`p-4 rounded-2xl bg-gradient-to-br ${featuredStrategy ? typeGradients[featuredStrategy.type] : 'from-primary to-accent'} text-white mb-3 shadow-lg`}>
            {featuredStrategy ? iconMap[featuredStrategy.icon] : <Sparkles className="h-6 w-6" />}
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            {featuredStrategy ? featuredStrategy.title : "Exercises"}
          </p>
          <p className="text-[10px] text-muted-foreground/70 mt-0.5">
            {featuredStrategy ? featuredStrategy.duration : "Regulation"}
          </p>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-primary/10 blur-xl" />
        <div className="absolute bottom-3 left-3 w-6 h-6 rounded-full bg-accent/20 blur-lg" />
      </div>

      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          Regulation Strategies
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {currentQuadrant
            ? `Tools for ${currentEmotion?.toLowerCase() || quadrantInfo?.description.toLowerCase()}`
            : "Explore emotion regulation techniques"}
        </p>
      </div>

      {/* Recommended */}
      {recommendedStrategies.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-rose-500 uppercase tracking-wider flex items-center gap-1">
            <Heart className="h-3 w-3" /> Recommended for you
          </h3>
          <div className="space-y-2">
            {recommendedStrategies.slice(0, 3).map((strategy) => (
              <StrategyCard
                key={strategy.id}
                strategy={strategy}
                isRecommended
                onStart={() => handleStartVisualization(strategy)}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Strategies */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">All Strategies</h3>
        <div className="space-y-2">
          {otherStrategies.map((strategy) => (
            <StrategyCard key={strategy.id} strategy={strategy} onStart={() => handleStartVisualization(strategy)} />
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

function StrategyCard({
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
      className={`group p-3 rounded-xl transition-all duration-200 hover:shadow-md ${
        isRecommended
          ? "bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-900/20 dark:to-orange-900/20 border border-rose-200 dark:border-rose-800"
          : "bg-card border border-border"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${typeGradients[strategy.type]} text-white shrink-0`}>
          {iconMap[strategy.icon]}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-foreground">{strategy.title}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> {strategy.duration}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {typeLabels[strategy.type]}
            </span>
          </div>
        </div>
        <Button
          size="sm"
          onClick={onStart}
          className={`shrink-0 h-9 px-4 rounded-xl bg-gradient-to-r ${typeGradients[strategy.type]} text-white border-0 opacity-0 group-hover:opacity-100 transition-opacity`}
        >
          <Play className="h-3.5 w-3.5 mr-1" /> Start
        </Button>
      </div>
    </div>
  );
}
