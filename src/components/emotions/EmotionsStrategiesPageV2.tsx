import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Wind, Heart, Zap, Sparkles, Activity, Clock, Play, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QuadrantType, QUADRANTS, STRATEGIES, Strategy } from "./types";
import { GuidedVisualization } from "./GuidedVisualization";
import { cn } from "@/lib/utils";

interface EmotionsStrategiesPageV2Props {
  currentQuadrant?: QuadrantType | null;
  currentEmotion?: string | null;
  onBack: () => void;
}

const typeGradients: Record<string, { from: string; to: string; bg: string }> = {
  breathing: { from: "#06B6D4", to: "#3B82F6", bg: "from-cyan-500/20 to-blue-500/20" },
  grounding: { from: "#F59E0B", to: "#F97316", bg: "from-amber-500/20 to-orange-500/20" },
  cognitive: { from: "#A855F7", to: "#EC4899", bg: "from-purple-500/20 to-pink-500/20" },
  movement: { from: "#EF4444", to: "#F97316", bg: "from-rose-500/20 to-orange-500/20" },
  mindfulness: { from: "#10B981", to: "#14B8A6", bg: "from-emerald-500/20 to-teal-500/20" },
};

const typeIcons: Record<string, React.ReactNode> = {
  breathing: <Wind className="h-5 w-5" />,
  grounding: <Activity className="h-5 w-5" />,
  cognitive: <Sparkles className="h-5 w-5" />,
  movement: <Zap className="h-5 w-5" />,
  mindfulness: <Heart className="h-5 w-5" />,
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
    <div className="w-full min-h-full p-4 md:p-6 lg:p-8 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 -ml-2 text-muted-foreground hover:text-foreground group transition-all duration-300"
        >
          <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Back to Check-in
        </Button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 shadow-lg">
                <Sparkles className="h-6 w-6 text-purple-500" />
              </div>
              <h1 className="text-2xl md:text-3xl font-light text-foreground">
                Regulation Strategies
              </h1>
            </div>
            <p className="text-muted-foreground">
              {currentQuadrant 
                ? `Techniques to help with ${currentEmotion?.toLowerCase() || quadrantInfo?.description.toLowerCase()}`
                : "Explore techniques to regulate your emotions"
              }
            </p>
          </div>

          {currentQuadrant && (
            <div 
              className="px-4 py-2.5 rounded-2xl border-2 transition-all duration-500 backdrop-blur-sm animate-in fade-in slide-in-from-right-4"
              style={{ 
                background: `linear-gradient(135deg, ${quadrantInfo?.bgColor}, ${quadrantInfo?.borderColor}20)`,
                borderColor: quadrantInfo?.borderColor 
              }}
            >
              <p className="text-xs text-muted-foreground">Current state</p>
              <p className="font-medium" style={{ color: quadrantInfo?.color }}>
                {currentEmotion || quadrantInfo?.label}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Type Filters */}
      <div className="max-w-6xl mx-auto mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter by type</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterType === null ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType(null)}
            className="rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
          >
            All
          </Button>
          {uniqueTypes.map((type, idx) => {
            const gradient = typeGradients[type];
            return (
              <Button
                key={type}
                variant={filterType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType(type === filterType ? null : type)}
                className={cn(
                  "rounded-xl gap-2 transition-all duration-300 hover:scale-105 active:scale-95",
                  filterType === type && "border-0 text-white shadow-lg"
                )}
                style={{
                  background: filterType === type 
                    ? `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` 
                    : undefined,
                  animationDelay: `${idx * 50}ms`
                }}
              >
                {typeIcons[type]}
                {typeLabels[type]}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Recommended Section */}
      {recommendedStrategies.length > 0 && filterType === null && (
        <div className="max-w-6xl mx-auto mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-medium text-foreground">Recommended for you</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedStrategies.map((strategy, idx) => (
              <StrategyCardLarge 
                key={strategy.id} 
                strategy={strategy} 
                isRecommended
                onStart={() => handleStartVisualization(strategy)}
                index={idx}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Strategies */}
      <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '400ms' }}>
        <h2 className="text-lg font-medium text-foreground mb-4">
          {filterType ? `${typeLabels[filterType]} Exercises` : "All Strategies"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStrategies.map((strategy, idx) => (
            <StrategyCardLarge 
              key={strategy.id} 
              strategy={strategy}
              onStart={() => handleStartVisualization(strategy)}
              index={idx}
            />
          ))}
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
                      background: `linear-gradient(135deg, ${typeGradients[activeStrategy.type].from}, ${typeGradients[activeStrategy.type].to})`
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

function StrategyCardLarge({
  strategy,
  isRecommended = false,
  onStart,
  index = 0,
}: {
  strategy: Strategy;
  isRecommended?: boolean;
  onStart: () => void;
  index?: number;
}) {
  const gradient = typeGradients[strategy.type];
  
  return (
    <div
      onClick={onStart}
      className={cn(
        "group relative p-5 rounded-2xl transition-all duration-500 cursor-pointer",
        "border hover:border-primary/30 hover:shadow-xl backdrop-blur-sm",
        "transform hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98]",
        "animate-in fade-in slide-in-from-bottom-4",
        isRecommended
          ? `bg-gradient-to-br ${gradient.bg} border-2`
          : "bg-card/80 border-border/50"
      )}
      style={{
        borderColor: isRecommended ? `${gradient.from}40` : undefined,
        animationDelay: `${index * 80}ms`,
        animationFillMode: 'backwards'
      }}
    >
      {isRecommended && (
        <div 
          className="absolute -top-2 -right-2 px-2.5 py-1 rounded-full text-[10px] font-medium text-white shadow-lg animate-in zoom-in duration-300"
          style={{ 
            background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
            animationDelay: `${index * 80 + 200}ms`
          }}
        >
          Recommended
        </div>
      )}

      {/* Icon */}
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:shadow-xl"
        style={{
          background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`
        }}
      >
        {typeIcons[strategy.type]}
      </div>

      {/* Content */}
      <h3 className="font-medium text-foreground text-base mb-2 group-hover:text-primary transition-colors duration-300">
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
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
          style={{
            background: `linear-gradient(135deg, ${gradient.from}20, ${gradient.to}20)`,
          }}
        >
          <Play 
            className="h-3.5 w-3.5 ml-0.5 transition-all duration-300 group-hover:scale-110" 
            style={{ color: gradient.from }}
          />
        </div>
      </div>
      
      {/* Hover glow effect */}
      <div 
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 100%, ${gradient.from}10, transparent 70%)`
        }}
      />
    </div>
  );
}
