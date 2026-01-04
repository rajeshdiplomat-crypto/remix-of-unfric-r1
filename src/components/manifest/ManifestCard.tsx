import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Pencil, Check, Minus, Clock, History, Trash2 } from "lucide-react";
import { type ManifestGoal, type ManifestProof, type ManifestDailyPractice, DAILY_PRACTICE_KEY } from "./types";
import { format, subDays, isSameDay, parseISO } from "date-fns";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPresetImage } from "@/lib/presetImages";
import { EntryImageUpload } from "@/components/common/EntryImageUpload";
import { supabase } from "@/integrations/supabase/client";

interface ManifestCardProps {
  goal: ManifestGoal;
  streak: number;
  momentum: number;
  lastProof?: ManifestProof;
  isSelected: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ManifestCard({
  goal,
  streak,
  momentum,
  lastProof,
  isSelected,
  onClick,
  onEdit,
  onDelete,
}: ManifestCardProps) {
  const navigate = useNavigate();
  // Get last 7 days practice history
  const last7DaysHistory = useMemo(() => {
    const stored = localStorage.getItem(DAILY_PRACTICE_KEY);
    const allPractices: Record<string, ManifestDailyPractice> = stored ? JSON.parse(stored) : {};

    const today = new Date();
    const history: { date: Date; completed: boolean }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, "yyyy-MM-dd");
      const practice = allPractices[`${goal.id}_${dateStr}`];
      history.push({
        date,
        completed: practice?.locked === true,
      });
    }

    return history;
  }, [goal.id]);

  const startDate = goal.start_date
    ? format(parseISO(goal.start_date), "MMM d, yyyy")
    : goal.created_at
      ? format(parseISO(goal.created_at), "MMM d, yyyy")
      : "—";

  const handleCoverImageChange = async (newImageUrl: string) => {
    try {
      await supabase
        .from("manifest_goals")
        .update({ cover_image_url: newImageUrl })
        .eq("id", goal.id);
    } catch (error) {
      console.error("Failed to update cover image:", error);
    }
  };

  return (
    <Card
      className={`relative cursor-pointer transition-all duration-200 overflow-hidden hover:shadow-md ${
        isSelected 
          ? "ring-2 ring-primary border-primary border-l-4 border-l-primary shadow-md" 
          : "border-border/40 hover:border-border/60"
      }`}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      <div className="flex">
        {/* Left: Cover Image */}
        <div 
          className="w-24 shrink-0 relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <EntryImageUpload
            currentImageUrl={goal.cover_image_url || null}
            presetType="manifest"
            category={goal.category || "other"}
            onImageChange={handleCoverImageChange}
            className="w-full h-full min-h-[180px]"
          />
        </div>

        {/* Right: Card Content */}
        <CardContent className="p-5 relative flex-1">
          {/* Vision Image Background */}
          {goal.vision_image_url && (
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: `url(${goal.vision_image_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          )}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Assumption Text */}
              <h3 className="font-medium text-foreground leading-tight mb-3 text-base">{goal.title}</h3>

              {/* Start Date & Check-in Time */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                <span className="font-medium">Started {startDate}</span>
                {goal.check_in_time && (
                  <span className="flex items-center gap-1.5 bg-muted/40 px-2 py-1 rounded-full">
                    <Clock className="h-3 w-3" />
                    {goal.check_in_time}
                  </span>
                )}
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant={goal.is_locked ? "secondary" : "default"} className="text-xs rounded-full px-3">
                  {goal.is_locked ? "Locked" : "Active"}
                </Badge>
                {streak > 0 && (
                  <Badge variant="outline" className="text-xs rounded-full px-3">
                    🔥 Day {streak}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs rounded-full px-3">
                  Conviction {goal.conviction}/10
                </Badge>
              </div>

              {/* Last 7 Days History */}
              <div className="flex items-center gap-1.5 mb-4">
                <span className="text-xs text-muted-foreground mr-2 font-medium">Last 7 days:</span>
                {last7DaysHistory.map((day, idx) => (
                  <div
                    key={idx}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors ${
                      day.completed 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "bg-muted/50 text-muted-foreground border border-border/40"
                    }`}
                    title={format(day.date, "MMM d")}
                  >
                    {day.completed ? <Check className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                  </div>
                ))}
              </div>

              {/* Momentum Bar */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="font-medium">Momentum</span>
                  <span className="font-semibold text-foreground">{momentum}%</span>
                </div>
                <Progress value={momentum} className="h-2" />
              </div>

              {/* Last Saved Proof */}
              {lastProof && (
                <div className="text-xs text-muted-foreground truncate p-2.5 bg-muted/30 rounded-lg border border-border/30">
                  <span className="text-foreground/80 font-medium">Last proof:</span> {lastProof.text}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-1 shrink-0">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  title="Edit goal"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/manifest/history/${goal.id}`);
                }}
                title="View history"
              >
                <History className="h-4 w-4" />
              </Button>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  title="Delete goal"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
