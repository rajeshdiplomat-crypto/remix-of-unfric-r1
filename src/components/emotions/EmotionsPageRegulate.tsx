import { useEffect, useState } from "react";
import { Check, ArrowRight, Wind, Heart, Zap, Sparkles, Activity, Clock, Play } from "lucide-react";
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

const REGULATE_CONTENT = {
  badge: "Well Done",
  title: {
    line1: "Time to",
    line2: "Regulate"
  },
  description: "Great job tracking your emotion! Now explore strategies designed for your current emotional state to help you feel balanced and grounded.",
  features: [
    "Personalized recommendations",
    "Guided breathing exercises",
    "Quick mindfulness techniques"
  ]
};

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
  const [showStrategyPicker, setShowStrategyPicker] = useState(false);

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

  return (
    <div className="flex flex-col min-h-[calc(100vh-300px)] animate-in fade-in duration-500">
      {/* Two-Column Layout - Matching Feel Page */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 flex-1">
        
        {/* Left: Descriptive Text */}
        <div className="flex flex-col justify-center order-2 lg:order-1">
          <div className="space-y-6 max-w-md">
            {/* Badge */}
            <div 
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium w-fit"
              style={{
                background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}10)`,
                color: accentColor,
              }}
            >
              <Sparkles className="h-4 w-4" />
              {REGULATE_CONTENT.badge}
            </div>
            
            {/* Title */}
            <h2 className="text-3xl md:text-4xl font-light leading-tight">
              {REGULATE_CONTENT.title.line1}{" "}
              <span className="font-semibold" style={{ color: accentColor }}>
                {REGULATE_CONTENT.title.line2}
              </span>
            </h2>
            
            {/* Description */}
            <p className="text-muted-foreground text-lg leading-relaxed">
              {REGULATE_CONTENT.description}
            </p>
            
            {/* Features */}
            <ul className="space-y-3">
              {REGULATE_CONTENT.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-muted-foreground">
                  <div 
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${accentColor}20` }}
                  >
                    <Check className="h-3 w-3" style={{ color: accentColor }} />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Right: Success Animation & Actions */}
        <div className="flex flex-col items-center justify-center order-1 lg:order-2">
          {/* Animated Checkmark */}
          <div className="relative inline-flex items-center justify-center w-28 h-28 mb-6">
            <div 
              className={cn(
                "absolute inset-0 rounded-full transition-all duration-700",
                showCheckmark ? "scale-100 opacity-100" : "scale-110 opacity-0"
              )}
              style={{ backgroundColor: `${accentColor}20` }}
            />
            <div 
              className={cn(
                "relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500",
                showCheckmark ? "scale-100" : "scale-90"
              )}
              style={{ backgroundColor: accentColor }}
            >
              <Check className="h-10 w-10 text-white" />
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-light mb-4 text-center">
            Check-in Complete
          </h1>
          
          {savedEmotion && savedQuadrant && quadrantInfo && (
            <div 
              className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl border-2 mb-8"
              style={{
                background: `linear-gradient(135deg, ${quadrantInfo.bgColor}, ${quadrantInfo.borderColor}20)`,
                borderColor: quadrantInfo.borderColor,
              }}
            >
              <span className="text-2xl">{quadrantEmoji[savedQuadrant]}</span>
              <div>
                <p className="text-xs text-muted-foreground">You're feeling</p>
                <p className="font-medium text-lg" style={{ color: quadrantInfo.color }}>
                  {savedEmotion}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button
              size="lg"
              onClick={() => setShowStrategyPicker(true)}
              className="h-12 rounded-xl gap-2 text-white"
              style={{
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}DD)`,
              }}
            >
              <Sparkles className="h-5 w-5" />
              Explore Strategies
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onNewCheckin}
                className="flex-1 h-11 rounded-xl"
              >
                New Check-in
              </Button>
              <Button
                variant="outline"
                onClick={onViewInsights}
                className="flex-1 h-11 rounded-xl gap-2"
              >
                Insights
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Strategy Picker Modal */}
      <Dialog open={showStrategyPicker} onOpenChange={setShowStrategyPicker}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Choose a Strategy</DialogTitle>
          </DialogHeader>
          
          {recommendedStrategies.length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Recommended for you
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {recommendedStrategies.map((strategy, idx) => (
                  <StrategyCard
                    key={strategy.id}
                    strategy={strategy}
                    isRecommended
                    onStart={() => {
                      setActiveStrategy(strategy);
                      setShowStrategyPicker(false);
                      setShowVisualization(true);
                    }}
                    index={idx}
                    compact
                  />
                ))}
              </div>
            </div>
          )}
          
          <div>
            <p className="text-sm text-muted-foreground mb-3">All strategies</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {STRATEGIES.map((strategy, idx) => (
                <StrategyCard
                  key={strategy.id}
                  strategy={strategy}
                  onStart={() => {
                    setActiveStrategy(strategy);
                    setShowStrategyPicker(false);
                    setShowVisualization(true);
                  }}
                  index={idx}
                  compact
                />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
  compact = false,
}: {
  strategy: Strategy;
  isRecommended?: boolean;
  onStart: () => void;
  index?: number;
  compact?: boolean;
}) {
  const gradient = typeGradients[strategy.type];
  
  return (
    <button
      onClick={onStart}
      className={cn(
        "group relative rounded-xl transition-all duration-300 cursor-pointer text-left",
        "border hover:border-primary/30 hover:shadow-lg backdrop-blur-sm",
        "transform hover:scale-[1.02] active:scale-[0.98]",
        "animate-in fade-in slide-in-from-bottom-4",
        compact ? "p-4" : "p-6 rounded-2xl hover:-translate-y-1 hover:shadow-xl",
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
      {isRecommended && !compact && (
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
        className={cn(
          "rounded-xl flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110",
          compact ? "w-10 h-10 mb-3" : "w-12 h-12 mb-4"
        )}
        style={{
          background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`
        }}
      >
        {typeIcons[strategy.type]}
      </div>

      {/* Content */}
      <h3 className={cn(
        "font-medium text-foreground group-hover:text-primary transition-colors",
        compact ? "text-sm mb-1" : "text-base mb-2"
      )}>
        {strategy.title}
      </h3>
      <p className={cn(
        "text-muted-foreground line-clamp-2",
        compact ? "text-xs mb-2" : "text-sm mb-4"
      )}>
        {strategy.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{strategy.duration}</span>
        </div>
        <div 
          className={cn(
            "rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
            compact ? "w-6 h-6" : "w-8 h-8"
          )}
          style={{
            background: `linear-gradient(135deg, ${gradient.from}20, ${gradient.to}20)`,
          }}
        >
          <Play className={cn("ml-0.5", compact ? "h-3 w-3" : "h-3.5 w-3.5")} style={{ color: gradient.from }} />
        </div>
      </div>
    </button>
  );
}
