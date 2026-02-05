import { useEffect, useState } from "react";
import { Check, ArrowRight, Wind, Heart, Zap, Sparkles, Activity, Clock } from "lucide-react";
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
          <div className="space-y-4 max-w-md">
            {/* Badge */}
            <div 
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium w-fit"
              style={{
                background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}10)`,
                color: accentColor,
              }}
            >
              <Sparkles className="h-3 w-3" />
              {REGULATE_CONTENT.badge}
            </div>
            
            {/* Title */}
            <h2 className="text-2xl md:text-3xl font-light leading-tight">
              {REGULATE_CONTENT.title.line1}{" "}
              <span className="font-semibold" style={{ color: accentColor }}>
                {REGULATE_CONTENT.title.line2}
              </span>
            </h2>
            
            {/* Description */}
            <p className="text-muted-foreground text-sm leading-relaxed">
              {REGULATE_CONTENT.description}
            </p>
            
            {/* Features */}
            <ul className="space-y-2">
              {REGULATE_CONTENT.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-muted-foreground text-sm">
                  <div 
                    className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${accentColor}20` }}
                  >
                    <Check className="h-2.5 w-2.5" style={{ color: accentColor }} />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Right: Success Animation, Strategies & Actions */}
        <div className="flex flex-col items-center justify-center order-1 lg:order-2">
          {/* Compact Checkmark */}
          <div className="relative inline-flex items-center justify-center w-16 h-16 mb-3">
            <div 
              className={cn(
                "absolute inset-0 rounded-full transition-all duration-700",
                showCheckmark ? "scale-100 opacity-100" : "scale-110 opacity-0"
              )}
              style={{ backgroundColor: `${accentColor}20` }}
            />
            <div 
              className={cn(
                "relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500",
                showCheckmark ? "scale-100" : "scale-90"
              )}
              style={{ backgroundColor: accentColor }}
            >
              <Check className="h-6 w-6 text-white" />
            </div>
          </div>

          <h1 className="text-xl font-light mb-2 text-center">
            Check-in Complete
          </h1>
          
          {savedEmotion && savedQuadrant && quadrantInfo && (
            <div 
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border mb-4"
              style={{
                background: `linear-gradient(135deg, ${quadrantInfo.bgColor}, ${quadrantInfo.borderColor}20)`,
                borderColor: quadrantInfo.borderColor,
              }}
            >
              <span className="text-lg">{quadrantEmoji[savedQuadrant]}</span>
              <div>
                <p className="text-[10px] text-muted-foreground leading-none">You're feeling</p>
                <p className="font-medium text-sm" style={{ color: quadrantInfo.color }}>
                  {savedEmotion}
                </p>
              </div>
            </div>
          )}

          {/* Inline Strategies */}
          {recommendedStrategies.length > 0 && (
            <div className="w-full max-w-sm mb-4">
              <p className="text-[10px] text-muted-foreground mb-2 text-center flex items-center justify-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" />
                Recommended for you
              </p>
              <div className="grid grid-cols-3 gap-2">
                {recommendedStrategies.map((strategy) => (
                  <MiniStrategyCard
                    key={strategy.id}
                    strategy={strategy}
                    onStart={() => {
                      setActiveStrategy(strategy);
                      setShowVisualization(true);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Compact Action Buttons */}
          <div className="flex gap-2 w-full max-w-sm">
            <Button
              variant="outline"
              size="sm"
              onClick={onNewCheckin}
              className="flex-1 h-9 rounded-lg text-xs"
            >
              New Check-in
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onViewInsights}
              className="flex-1 h-9 rounded-lg text-xs gap-1"
            >
              Insights
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
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

// Compact inline strategy card for the Regulate page
function MiniStrategyCard({
  strategy,
  onStart,
}: {
  strategy: Strategy;
  onStart: () => void;
}) {
  const gradient = typeGradients[strategy.type];
  
  return (
    <button
      onClick={onStart}
      className="group p-2.5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200 text-center"
    >
      <div 
        className="w-8 h-8 mx-auto mb-1.5 rounded-lg flex items-center justify-center text-white shadow-sm transition-transform duration-200 group-hover:scale-110"
        style={{
          background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`
        }}
      >
        {typeIcons[strategy.type]}
      </div>
      <p className="text-xs font-medium text-foreground truncate mb-0.5">
        {strategy.title}
      </p>
      <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
        <Clock className="h-2.5 w-2.5" />
        {strategy.duration}
      </p>
    </button>
  );
}
