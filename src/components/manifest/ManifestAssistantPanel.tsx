import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Eye, MessageCircle, Lightbulb, Volume2 } from "lucide-react";
import { useState } from "react";

interface ManifestGoal {
  id: string;
  title: string;
  description: string | null;
  affirmations: string[];
  is_completed: boolean;
}

interface ManifestAssistantPanelProps {
  selectedGoal: ManifestGoal | null;
  progress: number;
  onCheckInToday: () => void;
}

export function ManifestAssistantPanel({
  selectedGoal,
  progress,
  onCheckInToday,
}: ManifestAssistantPanelProps) {
  const [dailyAffirmationRepeated, setDailyAffirmationRepeated] = useState(false);
  const [visualizationDone, setVisualizationDone] = useState(false);

  const quickPrompts = [
    { icon: Eye, label: "Visualization script", prompt: "visualization" },
    { icon: MessageCircle, label: "1-min affirmation", prompt: "affirmation" },
    { icon: Lightbulb, label: "Action step", prompt: "action" },
  ];

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-1">
        {/* Assistant Header */}
        <Card className="p-5 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Manifestation Assistant</p>
              <p className="text-xs text-muted-foreground">Gentle guidance for your journey</p>
            </div>
          </div>
          
          {!selectedGoal && (
            <p className="text-sm text-muted-foreground">
              Select a goal to receive personalized guidance and daily prompts.
            </p>
          )}
        </Card>

        {selectedGoal && (
          <>
            {/* Selected Goal */}
            <Card className="p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                Active Focus
              </p>
              <h3 className="font-semibold text-foreground mb-3 line-clamp-2">
                {selectedGoal.title}
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-3"
                onClick={onCheckInToday}
              >
                Check in today
              </Button>
            </Card>

            {/* Daily Affirmation */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Volume2 className="h-4 w-4 text-primary" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Daily Affirmation
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 mb-3 border border-border/50">
                <p className="text-sm text-foreground italic leading-relaxed">
                  "{selectedGoal.affirmations?.[0] || "I am worthy of achieving all my dreams"}"
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="affirmation-done"
                  checked={dailyAffirmationRepeated}
                  onCheckedChange={(checked) => setDailyAffirmationRepeated(checked as boolean)}
                />
                <label
                  htmlFor="affirmation-done"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Repeated today
                </label>
              </div>
            </Card>

            {/* Visualization Guide */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="h-4 w-4 text-primary" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Visualization Guide
                </p>
              </div>
              <div className="space-y-2 mb-4">
                {[
                  "Close your eyes and breathe deeply",
                  "Picture yourself achieving this goal",
                  "Feel the emotions of success",
                  "Express gratitude for this reality",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-foreground">{step}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="visualization-done"
                  checked={visualizationDone}
                  onCheckedChange={(checked) => {
                    setVisualizationDone(checked as boolean);
                    if (checked) onCheckInToday();
                  }}
                />
                <label
                  htmlFor="visualization-done"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Completed today
                </label>
              </div>
            </Card>

            {/* Quick Prompts */}
            <Card className="p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">
                Quick Prompts
              </p>
              <div className="space-y-2">
                {quickPrompts.map((prompt, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2"
                  >
                    <prompt.icon className="h-4 w-4 text-primary" />
                    {prompt.label}
                  </Button>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </ScrollArea>
  );
}
