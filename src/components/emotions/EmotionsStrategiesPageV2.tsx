import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Wind, Heart, Zap, Sparkles, Activity, Clock, Play } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QuadrantType, QUADRANTS, STRATEGIES, Strategy } from "./types";
import { GuidedVisualization } from "./GuidedVisualization";
import { cn } from "@/lib/utils";

interface EmotionsStrategiesPageV2Props {
  currentQuadrant?: QuadrantType | null;
  currentEmotion?: string | null;
  onBack: () => void;
}

const typeGradients: Record<string, string> = {
  breathing: "from-cyan-500 to-blue-500",
  grounding: "from-amber-500 to-orange-500",
  cognitive: "from-purple-500 to-pink-500",
  movement: "from-rose-500 to-red-500",
  mindfulness: "from-emerald-500 to-teal-500",
};

const typeIcons: Record<string, React.ReactNode> = {
  breathing: <Wind className="h-6 w-6" />,
  grounding: <Activity className="h-6 w-6" />,
  cognitive: <Sparkles className="h-6 w-6" />,
  movement: <Zap className="h-6 w-6" />,
  mindfulness: <Heart className="h-6 w-6" />,
};

const typeLabels: Record<string, string> = {
  breathing: "Breathing",
  grounding: "Grounding",
  cognitive: "Cognitive",
  movement: "Movement",
  mindfulness: "Mindfulness",
};

export function EmotionsStrategiesPageV2({ currentQuadrant, currentEmotion, onBack }: EmotionsStrategiesPageV2Props) {
  const [activeStrategy, setActiveStrategy] = useState<Strategy | null>(null);
  const [showVisualization, setShowVisualization] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null);

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
  
  const filteredStrategies = filterType
    ? sortedStrategies.filter((s) => s.type === filterType)
    : sortedStrategies;

  const quadrantInfo = currentQuadrant ? QUADRANTS[currentQuadrant] : null;

  const handleStartVisualization = (strategy: Strategy) => {
    setActiveStrategy(strategy);
    setShowVisualization(true);
  };

  const uniqueTypes = Array.from(new Set(STRATEGIES.map(s => s.type)));

  return (
    <div className="w-full min-h-full p-4 md:p-8 animate-fade-in">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Check-in
        </Button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-light text-foreground mb-2">
              Regulation Strategies
            </h1>
            <p className="text-muted-foreground text-lg">
              {currentQuadrant 
                ? `Techniques to help with ${currentEmotion?.toLowerCase() || quadrantInfo?.description.toLowerCase()}`
                : "Explore techniques to regulate your emotions"
              }
            </p>
          </div>

          {currentQuadrant && (
            <div 
              className="px-5 py-3 rounded-2xl border-2 transition-all"
              style={{ 
                backgroundColor: quadrantInfo?.bgColor,
                borderColor: quadrantInfo?.borderColor 
              }}
            >
              <p className="text-sm text-muted-foreground">Current state</p>
              <p className="font-medium" style={{ color: quadrantInfo?.color }}>
                {currentEmotion || quadrantInfo?.label}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Type Filters */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterType === null ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType(null)}
            className="rounded-xl"
          >
            All
          </Button>
          {uniqueTypes.map((type) => (
            <Button
              key={type}
              variant={filterType === type ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(type === filterType ? null : type)}
              className={cn(
                "rounded-xl gap-2 transition-all",
                filterType === type && `bg-gradient-to-r ${typeGradients[type]} border-0 text-white`
              )}
            >
              {typeIcons[type]}
              {typeLabels[type]}
            </Button>
          ))}
        </div>
      </div>

      {/* Recommended Section */}
      {recommendedStrategies.length > 0 && filterType === null && (
        <div className="max-w-6xl mx-auto mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-medium text-foreground">Recommended for you</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedStrategies.map((strategy) => (
              <StrategyCardLarge 
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
      <div className="max-w-6xl mx-auto">
        <h2 className="text-lg font-medium text-foreground mb-4">
          {filterType ? `${typeLabels[filterType]} Exercises` : "All Strategies"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStrategies.map((strategy) => (
            <StrategyCardLarge 
              key={strategy.id} 
              strategy={strategy}
              onStart={() => handleStartVisualization(strategy)}
            />
          ))}
        </div>
      </div>

      {/* Guided Visualization Modal */}
      <Dialog open={showVisualization} onOpenChange={setShowVisualization}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden rounded-3xl">
          {activeStrategy && (
            <>
              <DialogHeader className="p-6 pb-0">
                <DialogTitle className="flex items-center gap-3 text-xl">
                  <span className={cn(
                    "p-3 rounded-xl bg-gradient-to-br text-white",
                    typeGradients[activeStrategy.type]
                  )}>
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

function StrategyCardLarge({
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
        "group relative p-6 rounded-2xl transition-all duration-300 cursor-pointer",
        "border hover:border-primary/30 hover:shadow-xl",
        "transform hover:scale-[1.02] active:scale-[0.98]",
        isRecommended
          ? "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-amber-200 dark:border-amber-800"
          : "bg-card border-border/50"
      )}
    >
      {isRecommended && (
        <div className="absolute -top-2 -right-2 px-2 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-[10px] font-medium text-white shadow-lg">
          Recommended
        </div>
      )}

      {/* Icon */}
      <div 
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-4",
          "bg-gradient-to-br shadow-lg transition-transform group-hover:scale-110",
          typeGradients[strategy.type]
        )}
      >
        {typeIcons[strategy.type]}
      </div>

      {/* Content */}
      <h3 className="font-medium text-foreground text-lg mb-2 group-hover:text-primary transition-colors">
        {strategy.title}
      </h3>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
        {strategy.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{strategy.duration}</span>
        </div>
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
          "transition-all duration-300"
        )}>
          <Play className="h-3.5 w-3.5 ml-0.5" />
        </div>
      </div>
    </div>
  );
}
