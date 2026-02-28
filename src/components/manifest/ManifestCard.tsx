import { Flame, Play, Pencil, Trash2, CheckCircle, RotateCcw, Check } from "lucide-react";
import { type ManifestGoal, type ManifestDailyPractice } from "./types";
import { format, subDays, parseISO, differenceInDays } from "date-fns";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

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
    <div
      onClick={onClick}
      className={cn(
        "overflow-hidden rounded-2xl border border-foreground/[0.08] bg-card/40 backdrop-blur-xl text-card-foreground cursor-pointer transition-all duration-300 hover:bg-card/60 hover:border-foreground/[0.15] hover:shadow-lg hover:shadow-primary/5 relative antialiased",
        isSelected && "ring-2 ring-primary shadow-lg shadow-primary/10",
        isCompleted && "opacity-50 grayscale"
      )}
    >
      <div className="flex flex-row h-24">
        {/* Left thumbnail */}
        <div className="relative w-24 flex-shrink-0 h-full">
          {(goal.cover_image_url || goal.vision_image_url) ? (
            <img
              src={goal.cover_image_url || goal.vision_image_url || ""}
              alt={goal.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-muted/30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/10" />
          <span className="absolute top-1.5 left-1.5 text-[8px] font-semibold px-1.5 py-0.5 rounded-lg bg-background/60 backdrop-blur-md text-foreground/70 leading-none z-10">
            Day {dayNumber}
          </span>
        </div>

        {/* Right content */}
        <div className="flex-1 p-2.5 flex flex-col justify-between gap-1 min-w-0 relative">
          {/* Action buttons */}
          <div className="absolute top-1.5 right-1.5 z-20 flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            {onComplete && !isCompleted && (
              <button onClick={onComplete} className="w-5 h-5 rounded-full bg-background/50 backdrop-blur-md flex items-center justify-center hover:bg-accent/50 transition-colors" title="Complete">
                <CheckCircle className="h-3 w-3 text-primary" />
              </button>
            )}
            {onReactivate && isCompleted && (
              <button onClick={onReactivate} className="w-5 h-5 rounded-full bg-background/50 backdrop-blur-md flex items-center justify-center hover:bg-accent/50 transition-colors" title="Reactivate">
                <RotateCcw className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
            {onEdit && !isCompleted && (
              <button onClick={onEdit} className="w-5 h-5 rounded-full bg-background/50 backdrop-blur-md flex items-center justify-center hover:bg-accent/50 transition-colors" title="Edit">
                <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} className="w-5 h-5 rounded-full bg-background/50 backdrop-blur-md flex items-center justify-center hover:bg-destructive/10 transition-colors" title="Delete">
                <Trash2 className="h-2.5 w-2.5 text-destructive" />
              </button>
            )}
          </div>

          {/* Title + pills */}
          <div>
            <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-1 pr-16 antialiased">
              {goal.title}
            </h3>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="inline-flex items-center text-[9px] font-semibold px-1.5 py-px rounded-full bg-primary/10 text-primary leading-tight">
                {momentumPct}%
              </span>
              {streak > 0 && (
                <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-px rounded-full bg-destructive/10 text-destructive leading-tight">
                  <Flame className="h-2 w-2" /> {streak}
                </span>
              )}
            </div>
          </div>

          {/* Weekly circles + glowing play icon */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {["M","T","W","T","F","S","S"].map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-px">
                  <span className="text-[7px] font-medium text-muted-foreground leading-none">{day}</span>
                  <div
                    className={`w-3 h-3 rounded-full border flex items-center justify-center transition-colors ${
                      weekProgress[i]
                        ? "bg-primary border-primary"
                        : "border-foreground/10 bg-transparent"
                    }`}
                  >
                    {weekProgress[i] && <Check className="h-1.5 w-1.5 text-primary-foreground" />}
                  </div>
                </div>
              ))}
            </div>
            {!isCompleted && (
              <button
                onClick={(e) => { e.stopPropagation(); onClick(); }}
                className="h-7 w-7 rounded-full flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-300 hover:shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
                title="Practice"
              >
                <Play className="h-3 w-3 ml-0.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
