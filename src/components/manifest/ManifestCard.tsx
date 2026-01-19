import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Flame, Play, Tag, Pencil, History } from "lucide-react";
import { type ManifestGoal, type ManifestDailyPractice, DAILY_PRACTICE_KEY, CATEGORIES } from "./types";
import { format, subDays, parseISO, differenceInDays, formatDistanceToNow } from "date-fns";
import { useMemo } from "react";
import { EntryImageUpload } from "@/components/common/EntryImageUpload";
import { supabase } from "@/integrations/supabase/client";

interface ManifestCardProps {
  goal: ManifestGoal;
  streak: number;
  momentum: number;
  isSelected: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewHistory?: () => void;
  onImageUpdate?: () => void;
}

export function ManifestCard({ goal, streak, momentum, isSelected, onClick, onEdit, onViewHistory, onImageUpdate }: ManifestCardProps) {
  // Get last 7 days
  const weekProgress = useMemo(() => {
    const stored = localStorage.getItem(DAILY_PRACTICE_KEY);
    const allPractices: Record<string, ManifestDailyPractice> = stored ? JSON.parse(stored) : {};
    const days: boolean[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "yyyy-MM-dd");
      const practice = allPractices[`${goal.id}_${dateStr}`];
      days.push(practice?.locked === true);
    }
    return days;
  }, [goal.id]);

  const dayNumber = useMemo(() => {
    if (goal.start_date) {
      return differenceInDays(new Date(), parseISO(goal.start_date)) + 1;
    }
    return differenceInDays(new Date(), parseISO(goal.created_at)) + 1;
  }, [goal.start_date, goal.created_at]);

  // Get last practiced info
  const lastPracticed = useMemo(() => {
    const stored = localStorage.getItem(DAILY_PRACTICE_KEY);
    const allPractices: Record<string, ManifestDailyPractice> = stored ? JSON.parse(stored) : {};
    const goalPractices = Object.values(allPractices)
      .filter((p) => p.goal_id === goal.id && p.locked)
      .sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime());
    
    if (goalPractices.length === 0) return null;
    return parseISO(goalPractices[0].entry_date);
  }, [goal.id]);

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
      className={`overflow-hidden rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-lg relative ${
        isSelected ? "ring-2 ring-teal-500 shadow-lg" : "border-slate-200 dark:border-slate-700"
      }`}
    >
      {/* Top-right action buttons */}
      <div className="absolute top-2 right-2 z-10 flex gap-1" onClick={(e) => e.stopPropagation()}>
        {onViewHistory && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm hover:bg-white dark:hover:bg-slate-700"
            onClick={onViewHistory}
            title="View History"
          >
            <History className="h-3.5 w-3.5 text-slate-500" />
          </Button>
        )}
        {onEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm hover:bg-white dark:hover:bg-slate-700"
            onClick={onEdit}
            title="Edit Vision"
          >
            <Pencil className="h-3.5 w-3.5 text-slate-500" />
          </Button>
        )}
      </div>

      <div className="flex flex-row h-40">
        {/* Image Section - Left side, full height, rounded corners */}
        <div className="relative w-40 h-full flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <EntryImageUpload
            currentImageUrl={goal.cover_image_url || goal.vision_image_url || null}
            presetType="manifest"
            category={goal.category || "other"}
            onImageChange={handleImageChange}
            className="w-full h-full rounded-l-2xl overflow-hidden"
          />

          {/* Overlay Badges */}
          <div className="absolute bottom-2 left-2 flex flex-col gap-1">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-teal-600 shadow-sm">
              Day {dayNumber}
            </span>
            {streak > 1 && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-500 text-white flex items-center gap-1">
                <Flame className="h-2.5 w-2.5" /> {streak}
              </span>
            )}
          </div>
        </div>

        {/* Content - Right side */}
        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-white text-sm leading-snug mb-1.5 line-clamp-2">
              {goal.title}
            </h3>

            {/* Category & Last Practiced */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                <Tag className="h-2.5 w-2.5" />
                {categoryLabel}
              </span>
              {lastPracticed && (
                <span className="text-[10px] text-slate-400">
                  Practiced {formatDistanceToNow(lastPracticed, { addSuffix: true })}
                </span>
              )}
            </div>

            {/* Week Dots with completion count */}
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <span className="text-[8px] text-slate-400">{day}</span>
                    <div
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                        weekProgress[i] ? "bg-teal-500 text-white" : "bg-slate-100 dark:bg-slate-800"
                      }`}
                    >
                      {weekProgress[i] && <Check className="h-2 w-2" />}
                    </div>
                  </div>
                ))}
              </div>
              <span className="text-[10px] font-medium text-teal-600 dark:text-teal-400">
                {weekCompletionCount}/7
              </span>
            </div>
          </div>

          {/* CTA */}
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            size="sm"
            className="w-full h-8 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-medium text-xs mt-2"
          >
            <Play className="h-3 w-3 mr-1.5" />
            Practice Now
          </Button>
        </div>
      </div>
    </Card>
  );
}
