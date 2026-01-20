import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Flame, Play, Tag, Pencil, Trash2, CheckCircle, RotateCcw } from "lucide-react";
import { format, subDays, parseISO, differenceInDays, formatDistanceToNow, isAfter, isBefore, addDays } from "date-fns";
import { useMemo } from "react";
import { EntryImageUpload } from "@/components/common/EntryImageUpload";
import { loadActivityImage, saveActivityImage } from "./ActivityImageUpload";
import { computeEndDateForHabitDays } from "@/lib/dateUtils";

interface ActivityItem {
  id: string;
  name: string;
  category: string;
  priority: string;
  description: string;
  frequencyPattern: boolean[];
  habitDays: number;
  startDate: string;
  completions: Record<string, boolean>;
  createdAt: string;
  notes?: Record<string, string>;
  skipped?: Record<string, boolean>;
}

const CATEGORIES: Record<string, { label: string; color: string }> = {
  health: { label: "Health & Wellness", color: "142 71% 45%" },
  growth: { label: "Personal Growth", color: "262 83% 58%" },
  career: { label: "Career", color: "221 83% 53%" },
  education: { label: "Education", color: "25 95% 53%" },
  wellbeing: { label: "Wellbeing", color: "339 81% 51%" },
};

interface TrackerCardProps {
  activity: ActivityItem;
  isSelected: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onComplete?: () => void;
  onReactivate?: () => void;
  onImageUpdate?: () => void;
  isCompleted?: boolean;
}

export function TrackerCard({
  activity,
  isSelected,
  onClick,
  onEdit,
  onDelete,
  onComplete,
  onReactivate,
  onImageUpdate,
  isCompleted = false,
}: TrackerCardProps) {
  const getEndDate = (act: ActivityItem) =>
    computeEndDateForHabitDays(parseISO(act.startDate), act.frequencyPattern, act.habitDays);

  const getStatus = (act: ActivityItem): "active" | "completed" | "upcoming" => {
    const today = new Date();
    const startDate = parseISO(act.startDate);
    const endDate = getEndDate(act);
    if (isBefore(today, startDate)) return "upcoming";
    if (isAfter(today, endDate)) return "completed";
    return "active";
  };

  const getCurrentStreak = (act: ActivityItem) => {
    let streak = 0;
    let checkDate = new Date();

    while (true) {
      const dateStr = format(checkDate, "yyyy-MM-dd");
      const dayOfWeek = (checkDate.getDay() + 6) % 7;
      const isPlanned = act.frequencyPattern[dayOfWeek];

      if (isPlanned) {
        if (act.completions[dateStr]) streak++;
        else if (format(checkDate, "yyyy-MM-dd") !== format(new Date(), "yyyy-MM-dd")) break;
      }

      checkDate = subDays(checkDate, 1);
      if (isBefore(checkDate, parseISO(act.startDate))) break;
    }

    return streak;
  };

  // Get last 7 days completion
  const weekProgress = useMemo(() => {
    const days: boolean[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "yyyy-MM-dd");
      days.push(!!activity.completions[dateStr]);
    }
    return days;
  }, [activity.completions]);

  const dayNumber = useMemo(() => {
    return differenceInDays(new Date(), parseISO(activity.startDate)) + 1;
  }, [activity.startDate]);

  // Get last completed info
  const lastCompleted = useMemo(() => {
    const completedDates = Object.entries(activity.completions)
      .filter(([_, completed]) => completed)
      .map(([date]) => parseISO(date))
      .sort((a, b) => b.getTime() - a.getTime());

    if (completedDates.length === 0) return null;
    return completedDates[0];
  }, [activity.completions]);

  // Get this week's completion count
  const weekCompletionCount = useMemo(() => {
    return weekProgress.filter(Boolean).length;
  }, [weekProgress]);

  // Get category label
  const categoryInfo = CATEGORIES[activity.category] || CATEGORIES.health;
  const streak = getCurrentStreak(activity);
  const status = getStatus(activity);

  const handleImageChange = async (url: string) => {
    saveActivityImage(activity.id, url);
    if (onImageUpdate) {
      onImageUpdate();
    }
  };

  return (
    <Card
      onClick={onClick}
      className={`overflow-hidden rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg relative ${
        isSelected ? "ring-2 ring-teal-500 shadow-lg" : "border-slate-200 dark:border-slate-700"
      } ${isCompleted || status === "completed" ? "opacity-60 grayscale" : ""}`}
    >
      {/* Top-right action buttons */}
      <div
        className="absolute top-1 right-1 z-20 flex items-center gap-0.5"
        onClick={(e) => e.stopPropagation()}
      >
        {onComplete && status === "active" && !isCompleted && (
          <button
            onClick={onComplete}
            className="w-4 h-4 rounded-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-teal-50 dark:hover:bg-teal-900/50 transition-colors"
            title="Mark as Complete"
          >
            <CheckCircle className="h-2.5 w-2.5 text-teal-500" />
          </button>
        )}
        {onReactivate && (status === "completed" || isCompleted) && (
          <button
            onClick={onReactivate}
            className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/50 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors"
            title="Reactivate Activity"
          >
            <RotateCcw className="h-3 w-3 text-amber-600" />
          </button>
        )}
        {onEdit && status === "active" && !isCompleted && (
          <button
            onClick={onEdit}
            className="w-4 h-4 rounded-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Edit Activity"
          >
            <Pencil className="h-2.5 w-2.5 text-slate-500" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="w-4 h-4 rounded-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            title="Delete Activity"
          >
            <Trash2 className="h-2.5 w-2.5 text-destructive" />
          </button>
        )}
      </div>

      <div className="flex flex-row h-[132px]">
        {/* Image Section - Left side */}
        <div className="relative w-[132px] h-full flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <EntryImageUpload
            currentImageUrl={loadActivityImage(activity.id)}
            presetType="trackers"
            category={activity.category || "health"}
            onImageChange={handleImageChange}
            className="w-full h-full rounded-l-xl overflow-hidden"
          />

          {/* Overlay Badges */}
          <div className="absolute bottom-1.5 left-1.5 flex flex-col gap-0.5">
            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-teal-600 shadow-sm">
              Day {dayNumber > 0 ? dayNumber : 1}
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
              {activity.name}
            </h3>

            {/* Category & Last Completed */}
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              <span
                className="inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: `hsl(${categoryInfo.color} / 0.15)`,
                  color: `hsl(${categoryInfo.color})`,
                }}
              >
                <Tag className="h-2 w-2" />
                {categoryInfo.label.split(" ")[0]}
              </span>
              {lastCompleted && (
                <span className="text-[9px] text-slate-400">
                  {formatDistanceToNow(lastCompleted, { addSuffix: true })}
                </span>
              )}
            </div>

            {/* Week Dots - stretched */}
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

          {/* CTA */}
          {status === "active" && !isCompleted && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              size="sm"
              className="w-auto h-7 px-3 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-medium text-[10px] mt-1.5 ml-auto"
            >
              <Play className="h-2.5 w-2.5 mr-1" />
              Track
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
