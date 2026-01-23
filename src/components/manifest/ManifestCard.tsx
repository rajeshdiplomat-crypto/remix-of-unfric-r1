import { Card } from "@/components/ui/card";
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
    <Card
      onClick={onClick}
      className={`overflow-hidden rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg relative ${
        isSelected ? "ring-2 ring-teal-500 shadow-lg" : "border-slate-200 dark:border-slate-700"
      } ${isCompleted ? "opacity-60 grayscale" : ""}`}
    >
      {/* Top-right action buttons - positioned over content area */}
      <div className="absolute top-1 right-1 z-20 flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
        {onComplete && !isCompleted && (
          <button
            onClick={onComplete}
            className="w-4 h-4 rounded-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-teal-50 dark:hover:bg-teal-900/50 transition-colors"
            title="Mark as Complete"
          >
            <CheckCircle className="h-2.5 w-2.5 text-teal-500" />
          </button>
        )}
        {onReactivate && isCompleted && (
          <button
            onClick={onReactivate}
            className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/50 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors"
            title="Reactivate Reality"
          >
            <RotateCcw className="h-3 w-3 text-amber-600" />
          </button>
        )}
        {onEdit && !isCompleted && (
          <button
            onClick={onEdit}
            className="w-4 h-4 rounded-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Edit Reality"
          >
            <Pencil className="h-2.5 w-2.5 text-slate-500" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="w-4 h-4 rounded-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            title="Delete Reality"
          >
            <Trash2 className="h-2.5 w-2.5 text-destructive" />
          </button>
        )}
      </div>

      <div className="flex flex-row h-[132px]">
        {/* Image Section - Left side, full height */}
        <div className="relative w-[132px] h-full flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <EntryImageUpload
            currentImageUrl={goal.cover_image_url || goal.vision_image_url || null}
            presetType="manifest"
            category={goal.category || "other"}
            onImageChange={handleImageChange}
            className="w-full h-full rounded-l-xl overflow-hidden"
          />

          {/* Overlay Badges */}
          <div className="absolute bottom-1.5 left-1.5 flex flex-col gap-0.5">
            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-teal-600 shadow-sm">
              Day {dayNumber}
            </span>
            {streak > 1 && (
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-orange-500 text-white flex items-center gap-0.5">
                <Flame className="h-2 w-2" /> {streak}
              </span>
            )}
          </div>
        </div>

        {/* Content - Right side */}
        <div className="flex-1 p-2.5 flex flex-col justify-between min-w-0 relative">
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-white text-xs leading-snug mb-1 line-clamp-2 pr-14">
              {goal.title}
            </h3>

            {/* Category & Last Practiced */}
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                <Tag className="h-2 w-2" />
                {categoryLabel}
              </span>
              {lastPracticed && (
                <span className="text-[9px] text-slate-400">
                  {formatDistanceToNow(lastPracticed, { addSuffix: true })}
                </span>
              )}
            </div>

            {/* Week Dots with completion count - stretched */}
            <div className="flex items-center gap-2 w-full">
              <div className="flex flex-1 justify-between">
                {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                  <div key={i} className="flex flex-col items-center gap-0">
                    <span className="text-[7px] text-slate-400">{day}</span>
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        weekProgress[i] ? "bg-teal-500 text-white" : "bg-slate-100 dark:bg-slate-800"
                      }`}
                    >
                      {weekProgress[i] && <Check className="h-2 w-2" />}
                    </div>
                  </div>
                ))}
              </div>
              <span className="text-[9px] font-medium text-teal-600 dark:text-teal-400 flex-shrink-0">
                {weekCompletionCount}/7
              </span>
            </div>
          </div>

          {/* CTA - reduced width */}
          {!isCompleted && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              size="sm"
              className="w-auto h-7 px-3 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-medium text-[10px] mt-1.5 ml-auto"
            >
              <Play className="h-2.5 w-2.5 mr-1" />
              Practice
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
