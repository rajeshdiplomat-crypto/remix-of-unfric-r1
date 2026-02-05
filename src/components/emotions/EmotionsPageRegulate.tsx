import { useEffect, useState } from "react";
import { Check, ArrowRight, Wind, Heart, Zap, Sparkles, Activity, Clock, Play, Filter } from "lucide-react";
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
  const [filterType, setFilterType] = useState<string | null>(null);

  const quadrantInfo = savedQuadrant ? QUADRANTS[savedQuadrant] : null;

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

  const filteredStrategies = filterType
    ? STRATEGIES.filter((s) => s.type === filterType)
    : STRATEGIES;

  const uniqueTypes = Array.from(new Set(STRATEGIES.map(s => s.type)));

  return (
    <div className="flex flex-col min-h-[calc(100vh-300px)] animate-in fade-in duration-500">
      {/* Success Header */}
      <div className="text-center mb-16">
        {/* Animated Checkmark */}
        <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
          <div 
            className={cn(
              "absolute inset-0 rounded-full transition-all duration-700",
              showCheckmark ? "scale-100 opacity-100" : "scale-110 opacity-0"
            )}
            style={{ backgroundColor: `${quadrantInfo?.color}20` }}
          />
          <div 
            className={cn(
              "relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500",
              showCheckmark ? "scale-100" : "scale-90"
            )}
            style={{ backgroundColor: quadrantInfo?.color }}
          >
            <Check className="h-8 w-8 text-white" />
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-light mb-3">Check-in Complete</h1>
        
        {savedEmotion && savedQuadrant && (
          <div 
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2"
            style={{
              background: `linear-gradient(135deg, ${quadrantInfo?.bgColor}, ${quadrantInfo?.borderColor}20)`,
              borderColor: quadrantInfo?.borderColor,
            }}
          >
            <span className="text-2xl">{quadrantEmoji[savedQuadrant]}</span>
            <span className="font-medium text-lg" style={{ color: quadrantInfo?.color }}>
              {savedEmotion}
            </span>
          </div>
        )}
      </div>

      {/* Recommended Strategies */}
      {recommendedStrategies.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px flex-1 bg-border" />
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Recommended for you
              </span>
            </div>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedStrategies.map((strategy, idx) => (
              <StrategyCard
                key={strategy.id}
                strategy={strategy}
                isRecommended
                onStart={() => {
                  setActiveStrategy(strategy);
                  setShowVisualization(true);
                }}
                index={idx}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Strategies Section */}
      <div className="flex-1">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-px flex-1 bg-border" />
          <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            All Strategies
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Type Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <Button
            variant={filterType === null ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType(null)}
            className="rounded-xl"
          >
            All
          </Button>
          {uniqueTypes.map((type) => {
            const gradient = typeGradients[type];
            return (
              <Button
                key={type}
                variant={filterType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType(type === filterType ? null : type)}
                className={cn(
                  "rounded-xl gap-2",
                  filterType === type && "border-0 text-white"
                )}
                style={{
                  background: filterType === type 
                    ? `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` 
                    : undefined,
                }}
              >
                {typeIcons[type]}
                {typeLabels[type]}
              </Button>
            );
          })}
        </div>

        {/* Strategy Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStrategies.map((strategy, idx) => (
            <StrategyCard
              key={strategy.id}
              strategy={strategy}
              onStart={() => {
                setActiveStrategy(strategy);
                setShowVisualization(true);
              }}
              index={idx}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4 mt-12 pt-8 border-t border-border">
        <Button
          variant="outline"
          size="lg"
          onClick={onNewCheckin}
          className="h-12 px-8 rounded-2xl gap-2"
        >
          New Check-in
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={onViewInsights}
          className="h-12 px-8 rounded-2xl gap-2"
        >
          View Insights
          <ArrowRight className="h-4 w-4" />
        </Button>
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

function StrategyCard({
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
    <button
      onClick={onStart}
      className={cn(
        "group relative p-6 rounded-2xl transition-all duration-300 cursor-pointer text-left",
        "border hover:border-primary/30 hover:shadow-xl backdrop-blur-sm",
        "transform hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98]",
        "animate-in fade-in slide-in-from-bottom-4",
        isRecommended
          ? `bg-gradient-to-br ${gradient.bg} border-2`
          : "bg-card border-border"
      )}
      style={{
        borderColor: isRecommended ? `${gradient.from}40` : undefined,
        animationDelay: `${index * 80}ms`,
        animationFillMode: 'backwards'
      }}
    >
      {isRecommended && (
        <div 
          className="absolute -top-2 -right-2 px-2.5 py-1 rounded-full text-[10px] font-medium text-white shadow-lg"
          style={{ 
            background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
          }}
        >
          Recommended
        </div>
      )}

      {/* Icon */}
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg transition-transform duration-300 group-hover:scale-110"
        style={{
          background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`
        }}
      >
        {typeIcons[strategy.type]}
      </div>

      {/* Content */}
      <h3 className="font-medium text-foreground text-base mb-2 group-hover:text-primary transition-colors">
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
          className="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
          style={{
            background: `linear-gradient(135deg, ${gradient.from}20, ${gradient.to}20)`,
          }}
        >
          <Play className="h-3.5 w-3.5 ml-0.5" style={{ color: gradient.from }} />
        </div>
      </div>
    </button>
  );
}
