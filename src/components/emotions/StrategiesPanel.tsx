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
  Wind: <Wind className="h-4 w-4" />,
  Hand: <Hand className="h-4 w-4" />,
  User: <User className="h-4 w-4" />,
  Lightbulb: <Lightbulb className="h-4 w-4" />,
  Sparkles: <Sparkles className="h-4 w-4" />,
  Heart: <Heart className="h-4 w-4" />,
  Zap: <Zap className="h-4 w-4" />,
  Sun: <Sun className="h-4 w-4" />,
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

  const handleStart = (strategy: Strategy) => {
    setActiveStrategy(strategy);
    setShowVisualization(true);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold mb-1">Regulation Strategies</h2>
        <p className="text-sm text-muted-foreground">
          {currentQuadrant
            ? `Tools for ${currentEmotion?.toLowerCase() || quadrantInfo?.description.toLowerCase()}`
            : "Explore techniques"}
        </p>
      </div>

      {recommendedStrategies.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Recommended</h3>
          <div className="space-y-2">
            {recommendedStrategies.slice(0, 3).map((s) => (
              <StrategyCard key={s.id} strategy={s} isRecommended onStart={() => handleStart(s)} />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {recommendedStrategies.length > 0 && (
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">All Strategies</h3>
        )}
        <div className="space-y-2">
          {otherStrategies.map((s) => (
            <StrategyCard key={s.id} strategy={s} onStart={() => handleStart(s)} />
          ))}
        </div>
      </div>

      <Dialog open={showVisualization} onOpenChange={setShowVisualization}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-xl">
          {activeStrategy && (
            <>
              <DialogHeader className="p-4 pb-0">
                <DialogTitle className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-primary/10 text-primary">{iconMap[activeStrategy.icon]}</span>
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
      className={`p-3 rounded-xl border transition-all hover:shadow-sm ${isRecommended ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-lg shrink-0 ${isRecommended ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
        >
          {iconMap[strategy.icon]}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">{strategy.title}</h4>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> {strategy.duration} • {typeLabels[strategy.type]}
          </p>
        </div>
        <Button size="sm" variant="ghost" className="shrink-0 h-8 px-3" onClick={onStart}>
          <Play className="h-3 w-3 mr-1" /> Start
        </Button>
      </div>
    </div>
  );
}
