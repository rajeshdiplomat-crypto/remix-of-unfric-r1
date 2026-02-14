import { Button } from "@/components/ui/button";
import { Check, Flame, Play, Tag, Pencil, Trash2, CheckCircle, RotateCcw } from "lucide-react";
import { type ManifestGoal, type ManifestDailyPractice, DAILY_PRACTICE_KEY, CATEGORIES } from "./types";
import { format, subDays, parseISO, differenceInDays, formatDistanceToNow } from "date-fns";
import { useMemo } from "react";
import { EntryImageUpload } from "@/components/common/EntryImageUpload";
import { supabase } from "@/integrations/supabase/client";

interface ManifestCardProps {
  goal: ManifestGoal;
  streak: number;
  momentum: number;
  practices?: ManifestDailyPractice[]; // Added practices prop
  isSelected: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onComplete?: () => void;
  onReactivate?: () => void;
  onImageUpdate?: () => void;
  isCompleted?: boolean;
}

export function ManifestCard({
  goal,
  streak,
  momentum,
  practices = [],
  isSelected,
  onClick,
  onEdit,
  onDelete,
  onComplete,
  onReactivate,
  onImageUpdate,
  isCompleted = false,
}: ManifestCardProps) {
  // Get last 7 days
  const weekProgress = useMemo(() => {
    const days: boolean[] = [];

    // Create a lookup map for faster access
    const practiceMap = new Set(practices.filter((p) => p.goal_id === goal.id && p.locked).map((p) => p.entry_date));

    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "yyyy-MM-dd");
      days.push(practiceMap.has(dateStr));
    }
    return days;
  }, [goal.id, practices]);

  const dayNumber = useMemo(() => {
    if (goal.start_date) {
      return differenceInDays(new Date(), parseISO(goal.start_date)) + 1;
    }
    return differenceInDays(new Date(), parseISO(goal.created_at)) + 1;
  }, [goal.start_date, goal.created_at]);

  // Get last practiced info
  const lastPracticed = useMemo(() => {
    const goalPractices = practices
      .filter((p) => p.goal_id === goal.id && p.locked)
      .sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime());

    if (goalPractices.length === 0) return null;
    return parseISO(goalPractices[0].entry_date);
  }, [goal.id, practices]);

  // Get this week's completion count
  const weekCompletionCount = useMemo(() => {
    return weekProgress.filter(Boolean).length;
  }, [weekProgress]);

  // Get category label
  const categoryLabel = useMemo(() => {
    const cat = CATEGORIES.find((c) => c.id === goal.category);
    return cat?.label || "Other";
  }, [goal.category]);

  const handleImageChange = async (url: string) => {
    try {
      // Update in database
      await supabase.from("manifest_goals").update({ cover_image_url: url }).eq("id", goal.id);

      // Also update in local storage extras for consistency
      const GOAL_EXTRAS_KEY = "manifest_goal_extras";
      const extras = JSON.parse(localStorage.getItem(GOAL_EXTRAS_KEY) || "{}");
      extras[goal.id] = { ...extras[goal.id], cover_image_url: url };
      localStorage.setItem(GOAL_EXTRAS_KEY, JSON.stringify(extras));

      // Notify parent to refresh
      if (onImageUpdate) {
        onImageUpdate();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div
      onClick={onClick}
      className={`group overflow-hidden rounded-xl cursor-pointer transition-all duration-200 relative bg-card/50 hover:bg-card ${
        isSelected ? "ring-1 ring-primary/40 bg-card" : ""
      } ${isCompleted ? "opacity-50 grayscale" : ""}`}
    >
      {/* Top-right action buttons - visible on hover only */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={(e) => e.stopPropagation()}>
        {onComplete && !isCompleted && (
          <button
            onClick={onComplete}
            className="w-6 h-6 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-primary/10 transition-colors"
            title="Mark as Complete"
          >
            <CheckCircle className="h-3 w-3 text-primary" />
          </button>
        )}
        {onReactivate && isCompleted && (
          <button
            onClick={onReactivate}
            className="w-6 h-6 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-muted transition-colors"
            title="Reactivate Reality"
          >
            <RotateCcw className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
        {onEdit && !isCompleted && (
          <button
            onClick={onEdit}
            className="w-6 h-6 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-muted transition-colors"
            title="Edit Reality"
          >
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="w-6 h-6 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-destructive/10 transition-colors"
            title="Delete Reality"
          >
            <Trash2 className="h-3 w-3 text-destructive" />
          </button>
        )}
      </div>

      <div className="flex flex-row h-[140px]">
        {/* Image Section - Left side */}
        <div className="relative w-[130px] h-full flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <EntryImageUpload
            currentImageUrl={goal.cover_image_url || goal.vision_image_url || null}
            presetType="manifest"
            category={goal.category || "other"}
            onImageChange={handleImageChange}
            className="w-full h-full rounded-l-xl overflow-hidden"
          />

          {/* Overlay Badges */}
          <div className="absolute bottom-2 left-2 flex flex-col gap-1">
            <span className="text-[9px] font-normal px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-sm text-muted-foreground">
              Day {dayNumber}
            </span>
            {streak > 1 && (
              <span className="text-[9px] font-normal px-2 py-0.5 rounded-full bg-primary/80 text-primary-foreground flex items-center gap-0.5">
                <Flame className="h-2 w-2" /> {streak}
              </span>
            )}
          </div>
        </div>

        {/* Content - Right side */}
        <div className="flex-1 p-4 flex flex-col justify-between min-w-0 relative">
          <div>
            <h3 className="font-medium text-foreground text-xs leading-relaxed mb-2 line-clamp-2 pr-16">
              {goal.title}
            </h3>

            {/* Category & Last Practiced */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[9px] font-normal px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                <Tag className="h-2 w-2" />
                {categoryLabel}
              </span>
              {lastPracticed && (
                <span className="text-[9px] text-muted-foreground/60">
                  {formatDistanceToNow(lastPracticed, { addSuffix: true })}
                </span>
              )}
            </div>

            {/* Week Dots - lighter, thinner */}
            <div className="flex items-center gap-2 w-full">
              <div className="flex flex-1 justify-between">
                {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <span className="text-[7px] text-muted-foreground/50">{day}</span>
                    <div
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors ${
                        weekProgress[i] ? "bg-primary/70 text-primary-foreground" : "bg-muted/60"
                      }`}
                    >
                      {weekProgress[i] && <Check className="h-2 w-2" />}
                    </div>
                  </div>
                ))}
              </div>
              <span className="text-[9px] font-normal text-muted-foreground flex-shrink-0">
                {weekCompletionCount}/7
              </span>
            </div>
          </div>

          {/* CTA - softer */}
          {!isCompleted && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              size="sm"
              variant="ghost"
              className="w-auto h-7 px-4 rounded-full text-primary hover:text-primary/80 hover:bg-primary/5 font-normal text-[10px] mt-2 ml-auto"
            >
              <Play className="h-2.5 w-2.5 mr-1" />
              Practice
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
