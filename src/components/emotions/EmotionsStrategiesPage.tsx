import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Wind, Hand, User, Lightbulb, Sparkles, Heart, Zap, Sun, Clock, Play } from "lucide-react";
import { QuadrantType, QUADRANTS, STRATEGIES, Strategy } from "./types";
import { GuidedVisualization } from "./GuidedVisualization";
import { cn } from "@/lib/utils";

interface EmotionsStrategiesPageProps {
  currentQuadrant?: QuadrantType | null;
  currentEmotion?: string | null;
  onBack: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  Wind: <Wind className="h-6 w-6" />,
  Hand: <Hand className="h-6 w-6" />,
  User: <User className="h-6 w-6" />,
  Lightbulb: <Lightbulb className="h-6 w-6" />,
  Sparkles: <Sparkles className="h-6 w-6" />,
  Heart: <Heart className="h-6 w-6" />,
  Zap: <Zap className="h-6 w-6" />,
  Sun: <Sun className="h-6 w-6" />,
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

export function EmotionsStrategiesPage({ currentQuadrant, currentEmotion, onBack }: EmotionsStrategiesPageProps) {
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

  const handleStartVisualization = (strategy: Strategy) => {
    setActiveStrategy(strategy);
    setShowVisualization(true);
  };

  const featuredStrategy = recommendedStrategies[0] || sortedStrategies[0];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 animate-fade-in">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Check-in
      </Button>

      {/* Hero Section */}
      <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 mb-8">
        <div className="absolute inset-0">
          <div className="absolute top-4 left-4 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-4 right-4 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center gap-4 p-6">
          <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm text-white shadow-lg">
            {featuredStrategy ? iconMap[featuredStrategy.icon] : <Sparkles className="h-8 w-8" />}
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-bold text-white mb-1">
              Regulation Strategies
            </h1>
            <p className="text-white/80">
              {currentEmotion 
                ? `Tools to help when feeling ${currentEmotion.toLowerCase()}`
                : "Explore calming techniques and exercises"}
            </p>
          </div>
        </div>
      </div>

      {/* Recommended Section */}
      {recommendedStrategies.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-rose-500 uppercase tracking-wider flex items-center gap-2 mb-4">
            <Heart className="h-4 w-4" /> Recommended for You
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendedStrategies.map((strategy) => (
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
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          All Strategies
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {otherStrategies.map((strategy) => (
            <StrategyCard
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
      onClick={onStart}
      className={cn(
        "group p-5 rounded-2xl transition-all duration-300 cursor-pointer",
        "hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1",
        isRecommended
          ? "bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-900/20 dark:to-orange-900/20 border-2 border-rose-200 dark:border-rose-800"
          : "bg-card border border-border hover:border-primary/30"
      )}
    >
      {/* Icon */}
      <div className={cn(
        "p-3 rounded-xl bg-gradient-to-br text-white mb-4 w-fit shadow-md",
        typeGradients[strategy.type]
      )}>
        {iconMap[strategy.icon]}
      </div>

      {/* Title */}
      <h3 className="font-semibold text-foreground mb-2">{strategy.title}</h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {strategy.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{strategy.duration}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="h-3 w-3" />
          <span>Start</span>
        </div>
      </div>
    </div>
  );
}
