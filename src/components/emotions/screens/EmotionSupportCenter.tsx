import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QuadrantType, QUADRANTS, STRATEGIES, Strategy } from "../types";
import { Wind, Hand, User, Lightbulb, Sparkles, Heart, Zap, Sun, Clock, ChevronDown, ArrowLeft, BookmarkPlus, Play } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GuidedVisualization } from "../GuidedVisualization";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

interface EmotionSupportCenterProps {
  quadrant: QuadrantType;
  emotion: string;
  onSkip: () => void;
  onSaveForLater: () => void;
  onStrategyStarted: (strategyId: string) => void;
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

/**
 * Screen 2: Regulation / Support Center
 * - Header: "Would you like support right now?"
 * - Single recommended activity card
 * - "See more strategies" drawer
 * - Skip / Save for later actions
 */
export function EmotionSupportCenter({
  quadrant,
  emotion,
  onSkip,
  onSaveForLater,
  onStrategyStarted,
}: EmotionSupportCenterProps) {
  const [activeStrategy, setActiveStrategy] = useState<Strategy | null>(null);
  const [showVisualization, setShowVisualization] = useState(false);

  const quadrantInfo = QUADRANTS[quadrant];

  // Get recommended strategies for this quadrant
  const recommendedStrategies = STRATEGIES.filter((s) =>
    s.targetQuadrants.includes(quadrant)
  );
  const otherStrategies = STRATEGIES.filter(
    (s) => !s.targetQuadrants.includes(quadrant)
  );

  // Pick the top recommended strategy
  const featuredStrategy = recommendedStrategies[0] || STRATEGIES[0];

  const handleStartStrategy = (strategy: Strategy) => {
    setActiveStrategy(strategy);
    setShowVisualization(true);
    onStrategyStarted(strategy.id);
  };

  const handleVisualizationComplete = () => {
    setShowVisualization(false);
    setActiveStrategy(null);
  };

  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">
          Would you like support right now?
        </h1>
        <p className="text-muted-foreground">
          Feeling{" "}
          <span style={{ color: quadrantInfo.color }} className="font-medium">
            {emotion.toLowerCase()}
          </span>
          ? Here's something that might help.
        </p>
      </div>

      {/* Featured Strategy Card */}
      <div className="max-w-md mx-auto">
        <div
          className={cn(
            "rounded-2xl p-6 border-2 transition-all",
            "bg-gradient-to-br from-background to-muted/30"
          )}
          style={{ borderColor: quadrantInfo.borderColor }}
        >
          {/* Strategy Icon & Type */}
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "p-3 rounded-xl bg-gradient-to-br text-white shadow-lg",
                typeGradients[featuredStrategy.type]
              )}
              aria-hidden="true"
            >
              {iconMap[featuredStrategy.icon]}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">
                {featuredStrategy.title}
              </h2>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{featuredStrategy.duration}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            {featuredStrategy.description}
          </p>

          {/* CTA */}
          <Button
            onClick={() => handleStartStrategy(featuredStrategy)}
            className="w-full mt-6 h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
            aria-label={`Start ${featuredStrategy.title}`}
          >
            <Play className="h-5 w-5 mr-2" />
            Try now
          </Button>
        </div>
      </div>

      {/* See More Strategies - Drawer */}
      <div className="max-w-md mx-auto">
        <Drawer>
          <DrawerTrigger asChild>
            <button
              className="flex items-center justify-center gap-2 w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-label="See more regulation strategies"
            >
              <ChevronDown className="h-4 w-4" />
              See more strategies
            </button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[70vh]">
            <DrawerHeader>
              <DrawerTitle>More Strategies</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 space-y-4 overflow-y-auto">
              {/* Recommended Section */}
              {recommendedStrategies.length > 1 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-rose-500 uppercase tracking-wider flex items-center gap-1">
                    <Heart className="h-3 w-3" /> Recommended for you
                  </h3>
                  <div className="space-y-2">
                    {recommendedStrategies.slice(1).map((strategy) => (
                      <StrategyListItem
                        key={strategy.id}
                        strategy={strategy}
                        onStart={() => handleStartStrategy(strategy)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* All Strategies */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  All Strategies
                </h3>
                <div className="space-y-2">
                  {otherStrategies.map((strategy) => (
                    <StrategyListItem
                      key={strategy.id}
                      strategy={strategy}
                      onStart={() => handleStartStrategy(strategy)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Secondary Actions */}
      <div className="flex gap-3 max-w-md mx-auto">
        <Button
          variant="outline"
          onClick={onSkip}
          className="flex-1 h-11 rounded-xl"
          aria-label="Skip support and save check-in"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Skip
        </Button>
        <Button
          variant="outline"
          onClick={onSaveForLater}
          className="flex-1 h-11 rounded-xl"
          aria-label="Save this strategy for later"
        >
          <BookmarkPlus className="h-4 w-4 mr-2" />
          Save for later
        </Button>
      </div>

      {/* Guided Visualization Modal */}
      <Dialog open={showVisualization} onOpenChange={setShowVisualization}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-2xl">
          {activeStrategy && (
            <>
              <DialogHeader className="p-5 pb-0">
                <DialogTitle className="flex items-center gap-3">
                  <span
                    className={cn(
                      "p-2 rounded-xl bg-gradient-to-br text-white",
                      typeGradients[activeStrategy.type]
                    )}
                  >
                    {iconMap[activeStrategy.icon]}
                  </span>
                  {activeStrategy.title}
                </DialogTitle>
              </DialogHeader>
              <GuidedVisualization
                strategy={activeStrategy}
                onComplete={handleVisualizationComplete}
                onSkip={handleVisualizationComplete}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StrategyListItem({
  strategy,
  onStart,
}: {
  strategy: Strategy;
  onStart: () => void;
}) {
  return (
    <button
      onClick={onStart}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors text-left"
    >
      <div
        className={cn(
          "p-2 rounded-lg bg-gradient-to-br text-white shrink-0",
          typeGradients[strategy.type]
        )}
      >
        {iconMap[strategy.icon]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground">{strategy.title}</p>
        <p className="text-xs text-muted-foreground">{strategy.duration}</p>
      </div>
      <Play className="h-4 w-4 text-muted-foreground shrink-0" />
    </button>
  );
}
