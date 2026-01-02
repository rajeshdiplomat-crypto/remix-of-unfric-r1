import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuadrantType, QUADRANTS, STRATEGIES, Strategy } from "./types";
import { Wind, Hand, User, Lightbulb, Sparkles, Heart, Zap, Sun, Play } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface StrategiesPanelProps {
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

export function StrategiesPanel({ currentQuadrant, currentEmotion }: StrategiesPanelProps) {
  const [activeStrategy, setActiveStrategy] = useState<Strategy | null>(null);
  
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
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Regulation Strategies</h2>
        <p className="text-sm text-muted-foreground">
          {currentQuadrant 
            ? `Tools to help when you're feeling ${currentEmotion?.toLowerCase() || quadrantInfo?.description.toLowerCase()}`
            : 'Explore techniques to help regulate your emotions'
          }
        </p>
      </div>
      
      {/* Recommended strategies */}
      {recommendedStrategies.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Recommended for you</h3>
          <div className="grid gap-3">
            {recommendedStrategies.map((strategy) => (
              <StrategyCard 
                key={strategy.id} 
                strategy={strategy} 
                isRecommended
                onStart={() => setActiveStrategy(strategy)}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Other strategies */}
      <div className="space-y-3">
        {recommendedStrategies.length > 0 && (
          <h3 className="text-sm font-medium text-muted-foreground">All strategies</h3>
        )}
        <div className="grid gap-3">
          {otherStrategies.map((strategy) => (
            <StrategyCard 
              key={strategy.id} 
              strategy={strategy}
              onStart={() => setActiveStrategy(strategy)}
            />
          ))}
        </div>
      </div>
      
      {/* Strategy detail modal */}
      <Dialog open={!!activeStrategy} onOpenChange={() => setActiveStrategy(null)}>
        <DialogContent className="sm:max-w-md">
          {activeStrategy && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div 
                    className="p-2 rounded-full"
                    style={{ 
                      backgroundColor: `${typeColors[activeStrategy.type]}20`,
                      color: typeColors[activeStrategy.type]
                    }}
                  >
                    {iconMap[activeStrategy.icon]}
                  </div>
                  <div>
                    <DialogTitle>{activeStrategy.title}</DialogTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activeStrategy.duration} • {typeLabels[activeStrategy.type]}
                    </p>
                  </div>
                </div>
              </DialogHeader>
              <DialogDescription className="text-foreground/80 leading-relaxed">
                {activeStrategy.description}
              </DialogDescription>
              <div className="mt-4 space-y-3">
                <StrategyInstructions strategy={activeStrategy} />
              </div>
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
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
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
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-medium text-sm">{strategy.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
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
                Try
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {strategy.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StrategyInstructions({ strategy }: { strategy: Strategy }) {
  const instructions: Record<string, string[]> = {
    'box-breathing': [
      '1. Breathe in slowly through your nose for 4 seconds',
      '2. Hold your breath for 4 seconds',
      '3. Exhale slowly through your mouth for 4 seconds',
      '4. Hold your breath for 4 seconds',
      '5. Repeat 4-6 times'
    ],
    '5-4-3-2-1': [
      '1. Notice 5 things you can SEE around you',
      '2. Notice 4 things you can TOUCH or feel',
      '3. Notice 3 things you can HEAR',
      '4. Notice 2 things you can SMELL',
      '5. Notice 1 thing you can TASTE'
    ],
    'body-scan': [
      '1. Close your eyes and take a few deep breaths',
      '2. Focus on the top of your head — notice any sensations',
      '3. Slowly move your attention down through your face, neck, shoulders',
      '4. Continue through your arms, chest, stomach, legs, feet',
      '5. Notice without judging — just observe what you feel'
    ],
    'reframe-thoughts': [
      '1. Identify the negative thought you\'re having',
      '2. Ask: Is this thought 100% true?',
      '3. What evidence supports or contradicts it?',
      '4. What would you tell a friend thinking this?',
      '5. Create a more balanced perspective'
    ],
    'gentle-stretch': [
      '1. Stand or sit comfortably',
      '2. Roll your shoulders back slowly, 5 times',
      '3. Gently tilt your head to each side, holding for 10 seconds',
      '4. Reach your arms overhead and stretch tall',
      '5. Take a deep breath and release'
    ],
    'gratitude-moment': [
      '1. Pause and take a breath',
      '2. Think of one thing you\'re grateful for today',
      '3. Really feel the appreciation in your body',
      '4. Think of a second thing',
      '5. Think of a third thing — savor each one'
    ],
    'energizing-breath': [
      '1. Sit up straight with good posture',
      '2. Take a quick, sharp breath in through your nose',
      '3. Exhale quickly through your nose',
      '4. Repeat rapidly for 15-20 breaths',
      '5. Rest and breathe normally, notice the energy'
    ],
    'savoring': [
      '1. Notice what you\'re feeling right now',
      '2. What specifically is making you feel this way?',
      '3. Engage your senses — what do you see, hear, feel?',
      '4. Let yourself fully experience this moment',
      '5. Store this memory to recall later'
    ]
  };
  
  const steps = instructions[strategy.id] || ['Follow the description above'];
  
  return (
    <div className="bg-muted/30 rounded-lg p-4">
      <h4 className="text-sm font-medium mb-3">How to do it:</h4>
      <ul className="space-y-2">
        {steps.map((step, i) => (
          <li key={i} className="text-sm text-muted-foreground">{step}</li>
        ))}
      </ul>
    </div>
  );
}
