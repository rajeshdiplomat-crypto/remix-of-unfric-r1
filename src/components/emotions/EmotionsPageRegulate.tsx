import { useEffect, useState } from "react";
import { Check, ArrowRight, Wind, Heart, Zap, Sparkles, Activity, Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QuadrantType, QUADRANTS, STRATEGIES, Strategy, EmotionEntry } from "./types";
import { GuidedVisualization } from "./GuidedVisualization";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface EmotionsPageRegulateProps {
  savedQuadrant: QuadrantType | null;
  savedEmotion: string | null;
  entries: EmotionEntry[];
  onNewCheckin: () => void;
  onViewInsights: () => void;
}

const typeGradients: Record<string, { from: string; to: string }> = {
  breathing: { from: "#06B6D4", to: "#3B82F6" },
  grounding: { from: "#F59E0B", to: "#F97316" },
  cognitive: { from: "#A855F7", to: "#EC4899" },
  movement: { from: "#EF4444", to: "#F97316" },
  mindfulness: { from: "#10B981", to: "#14B8A6" },
};

const typeIcons: Record<string, React.ReactNode> = {
  breathing: <Wind className="h-5 w-5" />,
  grounding: <Activity className="h-5 w-5" />,
  cognitive: <Sparkles className="h-5 w-5" />,
  movement: <Zap className="h-5 w-5" />,
  mindfulness: <Heart className="h-5 w-5" />,
};

const quadrantEmoji: Record<QuadrantType, string> = {
  "high-pleasant": "😊",
  "high-unpleasant": "😰",
  "low-unpleasant": "😔",
  "low-pleasant": "😌",
};

const REGULATE_CONTENT = {
  badge: "Well Done",
  title: { line1: "Time to", line2: "Regulate" },
  description:
    "Great job tracking your emotion! Now explore strategies designed for your current emotional state to help you feel balanced and grounded.",
  features: ["Personalized recommendations", "Guided breathing exercises", "Quick mindfulness techniques"],
};

export function EmotionsPageRegulate({
  savedQuadrant,
  savedEmotion,
  entries,
  onNewCheckin,
  onViewInsights,
}: EmotionsPageRegulateProps) {
  const [activeStrategy, setActiveStrategy] = useState<Strategy | null>(null);
  const [showVisualization, setShowVisualization] = useState(false);

  const quadrantInfo = savedQuadrant ? QUADRANTS[savedQuadrant] : null;
  const accentColor = quadrantInfo?.color || "#10B981";

  // Get last 7 entries
  const recentEntries = entries.slice(0, 7);

  useEffect(() => {
    if (savedQuadrant) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.4 },
        colors: [accentColor, "#ffffff", "#F59E0B"],
      });
    }
  }, [savedQuadrant, accentColor]);

  const recommendedStrategies = savedQuadrant
    ? STRATEGIES.filter((s) => s.targetQuadrants.includes(savedQuadrant)).slice(0, 3)
    : STRATEGIES.slice(0, 3);

  const allStrategies = STRATEGIES.filter((s) => !recommendedStrategies.some((r) => r.id === s.id));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const handleStrategyClick = (strategy: Strategy) => {
    setActiveStrategy(strategy);
    setShowVisualization(true);
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4"
          style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
        >
          <Sparkles className="h-3 w-3" />
          {REGULATE_CONTENT.badge}
        </div>

        <h1 className="text-3xl md:text-4xl font-light mb-4">
          {REGULATE_CONTENT.title.line1}{" "}
          <span className="font-bold" style={{ color: accentColor }}>
            {REGULATE_CONTENT.title.line2}
          </span>
        </h1>

        <p className="text-muted-foreground text-sm leading-relaxed max-w-lg mx-auto">{REGULATE_CONTENT.description}</p>
      </div>

      {/* 3-Column Layout: Recent Entries | Suggested Strategy | All Strategies */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* LEFT: Recent Entries */}
        <div className="border-2 border-border rounded-2xl p-5 bg-card">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Recent Entries</div>
          <h3 className="text-lg font-semibold mb-1">Your Last 7</h3>
          <p className="text-xs text-muted-foreground mb-4">Track your emotional journey</p>

          {recentEntries.length > 0 ? (
            <div className="space-y-2 mb-4">
              {recentEntries.slice(0, 5).map((entry, index) => {
                const entryQuadrant = QUADRANTS[entry.quadrant];
                return (
                  <div
                    key={entry.id}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer hover:bg-muted/50",
                      index === 0 && "bg-muted/30",
                    )}
                  >
                    <span className="text-lg">{quadrantEmoji[entry.quadrant]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: entryQuadrant.color }}>
                        {entry.emotion}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDate(entry.entry_date || entry.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-sm">
              <p>No entries yet</p>
              <p className="text-xs mt-1">Start tracking to see your history</p>
            </div>
          )}

          <Button variant="outline" size="sm" onClick={onViewInsights} className="w-full rounded-lg">
            View All Entries
          </Button>
        </div>

        {/* CENTER: Suggested Strategy (Featured) */}
        <div
          className="border-2 rounded-2xl p-5 shadow-lg scale-105 relative"
          style={{ borderColor: accentColor, backgroundColor: `${accentColor}08` }}
        >
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: accentColor }}
          >
            Recommended
          </div>

          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3 mt-2">Suggested Strategy</div>

          {recommendedStrategies[0] && (
            <>
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg mb-4 mx-auto"
                style={{
                  background: `linear-gradient(135deg, ${typeGradients[recommendedStrategies[0].type].from}, ${typeGradients[recommendedStrategies[0].type].to})`,
                }}
              >
                {typeIcons[recommendedStrategies[0].type]}
              </div>

              <h3 className="text-xl font-bold text-center mb-1">{recommendedStrategies[0].title}</h3>
              <p className="text-sm text-muted-foreground text-center mb-2">{recommendedStrategies[0].duration}</p>
              <p className="text-xs text-muted-foreground text-center mb-6 line-clamp-2">
                {recommendedStrategies[0].description}
              </p>

              <Button
                className="w-full rounded-lg text-white"
                style={{ backgroundColor: accentColor }}
                onClick={() => handleStrategyClick(recommendedStrategies[0])}
              >
                Start Session
              </Button>

              {/* Other recommended as small pills */}
              {recommendedStrategies.length > 1 && (
                <div className="flex gap-2 mt-4 justify-center flex-wrap">
                  {recommendedStrategies.slice(1).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleStrategyClick(s)}
                      className="px-3 py-1.5 text-xs rounded-full border hover:bg-muted/50 transition-colors"
                    >
                      {s.title.split(" ").slice(0, 2).join(" ")}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* RIGHT: All Strategies */}
        <div className="border-2 border-border rounded-2xl p-5 bg-card">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">All Strategies</div>
          <h3 className="text-lg font-semibold mb-1">Explore More</h3>
          <p className="text-xs text-muted-foreground mb-4">Find the perfect fit for you</p>

          <div className="space-y-2 mb-4">
            {allStrategies.slice(0, 5).map((strategy) => {
              const gradient = typeGradients[strategy.type];
              return (
                <button
                  key={strategy.id}
                  onClick={() => handleStrategyClick(strategy)}
                  className="flex items-center gap-3 p-2 rounded-lg w-full text-left hover:bg-muted/50 transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                    style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
                  >
                    {typeIcons[strategy.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{strategy.title}</p>
                    <p className="text-[10px] text-muted-foreground">{strategy.duration}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              );
            })}
          </div>

          <Button variant="outline" size="sm" className="w-full rounded-lg">
            View All Strategies
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" size="lg" onClick={onNewCheckin} className="h-12 px-8 rounded-xl">
          NEW CHECK-IN
        </Button>
        <Button
          size="lg"
          onClick={onViewInsights}
          className="h-12 px-8 rounded-xl gap-2"
          style={{ backgroundColor: accentColor }}
        >
          INSIGHTS
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Visualization Modal */}
      <Dialog open={showVisualization} onOpenChange={setShowVisualization}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
          {activeStrategy && (
            <>
              <DialogHeader className="p-6 pb-0">
                <DialogTitle className="flex items-center gap-3 text-xl">
                  <span
                    className="p-3 rounded-xl text-white shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${typeGradients[activeStrategy.type].from}, ${typeGradients[activeStrategy.type].to})`,
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
