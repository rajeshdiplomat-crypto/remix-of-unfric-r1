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
      <div className="absolute top-1 right-1 z-20 flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
        {onComplete && !isCompleted && (
          <button onClick={onComplete} className="w-4 h-4 rounded-full bg-background/95 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-teal-50 dark:hover:bg-teal-900/50 transition-colors" title="Mark as Complete">
            <CheckCircle className="h-2.5 w-2.5 text-teal-500" />
          </button>
        )}
        {onReactivate && isCompleted && (
          <button onClick={onReactivate} className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/50 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-amber-200 transition-colors" title="Reactivate">
            <RotateCcw className="h-3 w-3 text-amber-600" />
          </button>
        )}
        {onEdit && !isCompleted && (
          <button onClick={onEdit} className="w-4 h-4 rounded-full bg-background/95 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-muted transition-colors" title="Edit">
            <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
          </button>
        )}
        {onDelete && (
          <button onClick={onDelete} className="w-4 h-4 rounded-full bg-background/95 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-destructive/10 transition-colors" title="Delete">
            <Trash2 className="h-2.5 w-2.5 text-destructive" />
          </button>
        )}
      </div>

      <div className="flex flex-row h-[152px]">
        {/* Image (read-only, set during creation) */}
        <div className="relative w-[120px] h-full flex-shrink-0">
          {(goal.cover_image_url || goal.vision_image_url) ? (
            <img
              src={goal.cover_image_url || goal.vision_image_url || ""}
              alt={goal.title}
              className="w-full h-full object-cover rounded-l-xl"
            />
          ) : (
            <div className="w-full h-full bg-muted rounded-l-xl" />
          )}
          <div className="absolute bottom-1.5 left-1.5 flex flex-col gap-0.5">
            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-background/90 backdrop-blur-sm text-teal-600 shadow-sm">
              Day {dayNumber}
            </span>
            {streak > 1 && (
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-orange-500 text-white flex items-center gap-0.5">
                <Flame className="h-2 w-2" /> {streak}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-2.5 flex flex-col justify-between min-w-0">
          <div>
            <h3 className="font-semibold text-foreground text-xs leading-snug mb-1 line-clamp-1 pr-14">
              {goal.title}
            </h3>

            {/* Metadata row: category, start date, check-in */}
            <div className="flex items-center gap-1 mb-1.5 flex-wrap text-[9px] text-muted-foreground">
              <span className="inline-flex items-center gap-0.5 font-medium px-1.5 py-0.5 rounded-full bg-muted">
                <Tag className="h-2 w-2" />
                {categoryLabel}
              </span>
              <span className="inline-flex items-center gap-0.5">
                <CalendarDays className="h-2 w-2" />
                {startDateLabel}
              </span>
              {goal.check_in_time && (
                <span className="inline-flex items-center gap-0.5">
                  <Clock className="h-2 w-2" />
                  {goal.check_in_time}
                </span>
              )}
            </div>

            {/* Week checkboxes */}
            <div className="flex items-center gap-1.5 w-full">
              <div className="flex flex-1 justify-between">
                {DAY_LABELS.map((day, i) => (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <span className="text-[7px] text-muted-foreground">{day}</span>
                    <Checkbox
                      checked={weekProgress[i]}
                      className="h-3.5 w-3.5 rounded-[3px] pointer-events-none"
                      tabIndex={-1}
                    />
                  </div>
                ))}
              </div>
              <span className="text-[9px] font-medium text-teal-600 dark:text-teal-400 flex-shrink-0">
                {weekCompletionCount}/7
              </span>
            </div>

            {/* Practice button + practice days */}
            <div className="flex items-center justify-between mt-1.5">
              {totalPracticeDays > 0 ? (
                <span className="text-[9px] text-muted-foreground">
                  {totalPracticeDays} practice day{totalPracticeDays !== 1 ? "s" : ""} total
                </span>
              ) : <span />}
              {!isCompleted && (
                <Button
                  onClick={(e) => { e.stopPropagation(); onClick(); }}
                  size="sm"
                  className="h-6 px-2.5 rounded-md bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-medium text-[9px] flex-shrink-0"
                >
                  <Play className="h-2 w-2 mr-0.5" />
                  Practice
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}