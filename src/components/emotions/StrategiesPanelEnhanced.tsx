import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuadrantType, QUADRANTS, STRATEGIES, Strategy } from "./types";
import { Wind, Hand, User, Lightbulb, Sparkles, Heart, Zap, Sun, Play } from "lucide-react";
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
  Sun: <Sun className="h-5 w-5" />
};

const typeLabels: Record<string, string> = {
  breathing: 'Breathing',
  grounding: 'Grounding',
  cognitive: 'Cognitive',
  movement: 'Movement',
  mindfulness: 'Mindfulness'
};

const typeColors: Record<string, string> = {
  breathing: 'hsl(200, 80%, 50%)',
  grounding: 'hsl(30, 70%, 50%)',
  cognitive: 'hsl(280, 60%, 55%)',
  movement: 'hsl(340, 70%, 55%)',
  mindfulness: 'hsl(160, 60%, 45%)'
};

export function StrategiesPanelEnhanced({ currentQuadrant, currentEmotion }: StrategiesPanelEnhancedProps) {
  const [activeStrategy, setActiveStrategy] = useState<Strategy | null>(null);
  const [showVisualization, setShowVisualization] = useState(false);
  
  // Sort strategies: matching quadrant first
  const sortedStrategies = [...STRATEGIES].sort((a, b) => {
    if (!currentQuadrant) return 0;
    const aMatches = a.targetQuadrants.includes(currentQuadrant);
    const bMatches = b.targetQuadrants.includes(currentQuadrant);
    if (aMatches && !bMatches) return -1;
    if (!aMatches && bMatches) return 1;
    return 0;
  });
  
  const recommendedStrategies = currentQuadrant 
    ? sortedStrategies.filter(s => s.targetQuadrants.includes(currentQuadrant))
    : [];
  const otherStrategies = currentQuadrant
    ? sortedStrategies.filter(s => !s.targetQuadrants.includes(currentQuadrant))
    : sortedStrategies;
  
  const quadrantInfo = currentQuadrant ? QUADRANTS[currentQuadrant] : null;

  const handleStartVisualization = (strategy: Strategy) => {
    setActiveStrategy(strategy);
    setShowVisualization(true);
  };
  
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">Regulation Strategies</h2>
        <p className="text-sm text-muted-foreground">
          {currentQuadrant 
            ? `Tools for ${currentEmotion?.toLowerCase() || quadrantInfo?.description.toLowerCase()}`
            : 'Explore emotion regulation techniques'
          }
        </p>
      </div>
      
      {/* Recommended strategies */}
      {recommendedStrategies.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Recommended</h3>
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
      
      {/* Other strategies */}
      <div className="space-y-2">
        {recommendedStrategies.length > 0 && (
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">All Strategies</h3>
        )}
        <div className="space-y-2">
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
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
          {activeStrategy && (
            <>
              <DialogHeader className="p-4 pb-0">
                <DialogTitle className="flex items-center gap-2">
                  <span 
                    className="p-1.5 rounded-full"
                    style={{ backgroundColor: `${typeColors[activeStrategy.type]}20`, color: typeColors[activeStrategy.type] }}
                  >
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
  onStart 
}: { 
  strategy: Strategy; 
  isRecommended?: boolean;
  onStart: () => void;
}) {
  return (
    <Card className={`transition-all hover:shadow-md ${isRecommended ? 'border-primary/30 bg-primary/5' : ''}`}>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div 
            className="p-2 rounded-full shrink-0"
            style={{ 
              backgroundColor: `${typeColors[strategy.type]}15`,
              color: typeColors[strategy.type]
            }}
          >
            {iconMap[strategy.icon]}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm">{strategy.title}</h4>
            <p className="text-xs text-muted-foreground">
              {strategy.duration} • {typeLabels[strategy.type]}
            </p>
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            className="shrink-0 h-8 px-3"
            onClick={onStart}
          >
            <Play className="h-3 w-3 mr-1" />
            Start
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

