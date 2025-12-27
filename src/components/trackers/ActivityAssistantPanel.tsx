import { format, parseISO } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Calendar, Target, Clock, TrendingUp } from "lucide-react";
import { ActivityImageUpload, loadActivityImage, saveActivityImage } from "./ActivityImageUpload";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface ActivityItem {
  id: string;
  name: string;
  category: string;
  priority: string;
  description: string;
  frequencyPattern: boolean[];
  numberOfDays: number;
  startDate: string;
  completions: Record<string, boolean>;
  createdAt: string;
  notes?: Record<string, string>;
  imageUrl?: string;
}

interface ActivityAssistantPanelProps {
  selectedActivity: ActivityItem | null;
  onImageChange: (activityId: string, imageUrl: string | null) => void;
  getEndDate: (activity: ActivityItem) => Date;
  getDaysLeft: (activity: ActivityItem) => number;
  getScheduledSessions: (activity: ActivityItem) => number;
  getCompletedSessions: (activity: ActivityItem) => number;
  getSessionsLeft: (activity: ActivityItem) => number;
  getCompletionPercent: (activity: ActivityItem) => number;
}

const CATEGORIES: Record<string, { label: string; color: string }> = {
  health: { label: "Health & Wellness", color: "142 71% 45%" },
  growth: { label: "Personal Growth", color: "262 83% 58%" },
  career: { label: "Career", color: "221 83% 53%" },
  education: { label: "Education", color: "25 95% 53%" },
  wellbeing: { label: "Wellbeing", color: "339 81% 51%" },
};

export function ActivityAssistantPanel({
  selectedActivity,
  onImageChange,
  getEndDate,
  getDaysLeft,
  getScheduledSessions,
  getCompletedSessions,
  getSessionsLeft,
  getCompletionPercent,
}: ActivityAssistantPanelProps) {
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (selectedActivity) {
      const saved = loadActivityImage(selectedActivity.id);
      setLocalImageUrl(saved);
    } else {
      setLocalImageUrl(null);
    }
  }, [selectedActivity]);

  const handleImageChange = (url: string | null) => {
    if (selectedActivity) {
      saveActivityImage(selectedActivity.id, url);
      setLocalImageUrl(url);
      onImageChange(selectedActivity.id, url);
    }
  };

  return (
    <div className="w-[380px] h-full bg-card border-l border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">Activity Assistant</h3>
            <p className="text-xs text-muted-foreground">Plan and preview activity</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Image Upload Area */}
          <div>
            <ActivityImageUpload
              imageUrl={localImageUrl}
              onImageChange={handleImageChange}
            />
          </div>

          {selectedActivity ? (
            <>
              {/* Activity Preview Card */}
              <Card className="overflow-hidden">
                {localImageUrl && (
                  <div className="h-32 w-full">
                    <img 
                      src={localImageUrl} 
                      alt={selectedActivity.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4 space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-foreground">{selectedActivity.name}</h4>
                      <Badge 
                        variant="secondary" 
                        className="text-[10px] flex-shrink-0"
                        style={{ 
                          backgroundColor: `hsl(${CATEGORIES[selectedActivity.category]?.color || "0 0% 50%"} / 0.2)`,
                          color: `hsl(${CATEGORIES[selectedActivity.category]?.color || "0 0% 50%"})`
                        }}
                      >
                        {CATEGORIES[selectedActivity.category]?.label.split(" ")[0] || selectedActivity.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{selectedActivity.description}</p>
                  </div>

                  {/* Date Range */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {format(parseISO(selectedActivity.startDate), "MMM d")} – {format(getEndDate(selectedActivity), "MMM d")} | {selectedActivity.numberOfDays} days
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium text-foreground">{getCompletionPercent(selectedActivity)}%</span>
                    </div>
                    <Progress value={getCompletionPercent(selectedActivity)} className="h-2" />
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                      <Target className="h-3.5 w-3.5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Sessions left</p>
                        <p className="text-sm font-semibold text-foreground">{getSessionsLeft(selectedActivity)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                      <Clock className="h-3.5 w-3.5 text-orange-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Days left</p>
                        <p className="text-sm font-semibold text-foreground">{getDaysLeft(selectedActivity)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                      <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Completed</p>
                        <p className="text-sm font-semibold text-foreground">{getCompletedSessions(selectedActivity)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                      <Calendar className="h-3.5 w-3.5 text-purple-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Scheduled</p>
                        <p className="text-sm font-semibold text-foreground">{getScheduledSessions(selectedActivity)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <div className="text-center py-8">
              <Target className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Select an activity to preview
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
