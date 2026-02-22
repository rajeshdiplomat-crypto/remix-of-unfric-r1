import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, Play, Tag, Pencil, Trash2, CheckCircle, RotateCcw, Check } from "lucide-react";
import { type ManifestGoal, type ManifestDailyPractice, CATEGORIES } from "./types";
import { format, subDays, parseISO, differenceInDays } from "date-fns";
import { useMemo } from "react";
import { useDatePreferences } from "@/hooks/useDatePreferences";

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

  const momentumPct = Math.round(momentum);

  return (
    <Card
      onClick={onClick}
      className={`overflow-hidden rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg relative ${
        isSelected ? "ring-2 ring-primary shadow-lg" : ""
      } ${isCompleted ? "opacity-60 grayscale" : ""}`}
    >
      {/* Action buttons */}
      <div className="absolute top-1.5 right-1.5 z-20 flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
        {onComplete && !isCompleted && (
          <button onClick={onComplete} className="w-5 h-5 rounded-full bg-background/90 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-accent transition-colors" title="Complete">
            <CheckCircle className="h-3 w-3 text-primary" />
          </button>
        )}
        {onReactivate && isCompleted && (
          <button onClick={onReactivate} className="w-5 h-5 rounded-full bg-background/90 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-accent transition-colors" title="Reactivate">
            <RotateCcw className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
        {onEdit && !isCompleted && (
          <button onClick={onEdit} className="w-5 h-5 rounded-full bg-background/90 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-accent transition-colors" title="Edit">
            <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
          </button>
        )}
        {onDelete && (
          <button onClick={onDelete} className="w-5 h-5 rounded-full bg-background/90 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-destructive/10 transition-colors" title="Delete">
            <Trash2 className="h-2.5 w-2.5 text-destructive" />
          </button>
        )}
      </div>

      <div className="flex flex-row h-24">
        {/* Square thumbnail */}
        <div className="relative w-24 h-24 flex-shrink-0">
          {(goal.cover_image_url || goal.vision_image_url) ? (
            <img
              src={goal.cover_image_url || goal.vision_image_url || ""}
              alt={goal.title}
              className="w-full h-full object-cover rounded-l-xl"
            />
          ) : (
            <div className="w-full h-full bg-muted rounded-l-xl" />
          )}
          <span className="absolute bottom-1 right-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-background/80 backdrop-blur-sm text-foreground/80">
            Day {dayNumber}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 p-2.5 pl-3 flex flex-col justify-between min-w-0">
          {/* Top: title + pills */}
          <div>
            <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-1 pr-14 mb-1.5">
              {goal.title}
            </h3>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {momentumPct}% Momentum
              </span>
              {streak > 0 && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                  <Flame className="h-2.5 w-2.5" /> {streak}
                </span>
              )}
            </div>
          </div>

          {/* Bottom: timeline + action */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {["M","T","W","T","F","S","S"].map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-0.5">
                  <span className="text-[8px] font-medium text-muted-foreground leading-none">{day}</span>
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
                      weekProgress[i]
                        ? "bg-primary border-primary"
                        : "border-border bg-transparent"
                    }`}
                  >
                    {weekProgress[i] && <Check className="h-2 w-2 text-primary-foreground" />}
                  </div>
                </div>
              ))}
            </div>
            {!isCompleted && (
              <Button
                onClick={(e) => { e.stopPropagation(); onClick(); }}
                size="sm"
                className="h-7 px-3 rounded-full text-[11px] font-semibold"
              >
                <Play className="h-2.5 w-2.5 mr-0.5" />
                Practice
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
