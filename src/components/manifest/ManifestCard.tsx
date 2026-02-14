import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Flame, Play, Tag, Pencil, Trash2, CheckCircle, RotateCcw, Clock, CalendarDays } from "lucide-react";
import { type ManifestGoal, type ManifestDailyPractice, DAILY_PRACTICE_KEY, CATEGORIES } from "./types";
import { format, subDays, parseISO, differenceInDays, formatDistanceToNow } from "date-fns";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ManifestCardProps {
  goal: ManifestGoal;
  streak: number;
  momentum: number;
  practices?: ManifestDailyPractice[];
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
  const weekProgress = useMemo(() => {
    const days: boolean[] = [];
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

  const categoryLabel = useMemo(() => {
    const cat = CATEGORIES.find((c) => c.id === goal.category);
    return cat?.label || "Other";
  }, [goal.category]);

  const weekCompletionCount = useMemo(() => {
    return weekProgress.filter(Boolean).length;
  }, [weekProgress]);

  const totalPracticeDays = useMemo(() => {
    return practices.filter((p) => p.goal_id === goal.id && p.locked).length;
  }, [goal.id, practices]);

  const startDateLabel = useMemo(() => {
    const d = goal.start_date || goal.created_at;
    return format(parseISO(d), "MMM d, yyyy");
  }, [goal.start_date, goal.created_at]);


  const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <Card
      onClick={onClick}
      className={`overflow-hidden rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg relative ${
        isSelected ? "ring-2 ring-teal-500 shadow-lg" : ""
      } ${isCompleted ? "opacity-60 grayscale" : ""}`}
    >
      {/* Action buttons */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        {onComplete && !isCompleted && (
          <button onClick={onComplete} className="w-6 h-6 rounded-full bg-background/95 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-teal-50 dark:hover:bg-teal-900/50 transition-colors" title="Mark as Complete">
            <CheckCircle className="h-3.5 w-3.5 text-teal-500" />
          </button>
        )}
        {onReactivate && isCompleted && (
          <button onClick={onReactivate} className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-amber-200 transition-colors" title="Reactivate">
            <RotateCcw className="h-3.5 w-3.5 text-amber-600" />
          </button>
        )}
        {onEdit && !isCompleted && (
          <button onClick={onEdit} className="w-6 h-6 rounded-full bg-background/95 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-muted transition-colors" title="Edit">
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
        {onDelete && (
          <button onClick={onDelete} className="w-6 h-6 rounded-full bg-background/95 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-destructive/10 transition-colors" title="Delete">
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </button>
        )}
      </div>

      <div className="flex flex-row min-h-[180px]">
        {/* Image */}
        <div className="relative w-[140px] h-auto flex-shrink-0">
          {(goal.cover_image_url || goal.vision_image_url) ? (
            <img
              src={goal.cover_image_url || goal.vision_image_url || ""}
              alt={goal.title}
              className="w-full h-full object-cover rounded-l-xl"
            />
          ) : (
            <div className="w-full h-full bg-muted rounded-l-xl" />
          )}
          <div className="absolute bottom-2 left-2 flex flex-col gap-1">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-background/90 backdrop-blur-sm text-teal-600 shadow-sm">
              Day {dayNumber}
            </span>
            {streak > 1 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-500 text-white flex items-center gap-0.5">
                <Flame className="h-2.5 w-2.5" /> {streak}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
          <div>
            <h3 className="font-semibold text-foreground text-sm leading-snug mb-1.5 line-clamp-1 pr-16">
              {goal.title}
            </h3>

            {/* Metadata row */}
            <div className="flex items-center gap-1.5 mb-3 flex-wrap text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full bg-muted">
                <Tag className="h-2.5 w-2.5" />
                {categoryLabel}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-2.5 w-2.5" />
                {startDateLabel}
              </span>
              {goal.check_in_time && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {goal.check_in_time}
                </span>
              )}
            </div>

            {/* Week checkboxes */}
            <div className="flex items-center gap-2 w-full">
              <div className="flex flex-1 justify-between">
                {DAY_LABELS.map((day, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-medium text-muted-foreground">{day}</span>
                    <Checkbox
                      checked={weekProgress[i]}
                      className="h-4.5 w-4.5 rounded pointer-events-none"
                      tabIndex={-1}
                    />
                  </div>
                ))}
              </div>
              <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 flex-shrink-0">
                {weekCompletionCount}/7
              </span>
            </div>
          </div>

          {/* Practice button + practice days */}
          <div className="flex items-center justify-between mt-3">
            {totalPracticeDays > 0 ? (
              <span className="text-xs text-muted-foreground">
                {totalPracticeDays} practice day{totalPracticeDays !== 1 ? "s" : ""} total
              </span>
            ) : <span />}
            {!isCompleted && (
              <Button
                onClick={(e) => { e.stopPropagation(); onClick(); }}
                size="sm"
                className="h-8 px-4 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold text-xs flex-shrink-0"
              >
                <Play className="h-3 w-3 mr-1" />
                Practice
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}