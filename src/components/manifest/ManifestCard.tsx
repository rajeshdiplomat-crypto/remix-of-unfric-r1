import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Clock, MoreVertical, Flame, Zap, Sparkles } from "lucide-react";
import { type ManifestGoal, type ManifestDailyPractice, DAILY_PRACTICE_KEY } from "./types";
import { format, subDays, parseISO, differenceInDays } from "date-fns";
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
}

export function ManifestCard({ goal, streak, momentum, isSelected, onClick, onEdit, onDelete }: ManifestCardProps) {
  // Get last 7 days practice history with day names
  const weekDays = useMemo(() => {
    const stored = localStorage.getItem(DAILY_PRACTICE_KEY);
    const allPractices: Record<string, ManifestDailyPractice> = stored ? JSON.parse(stored) : {};

    const today = new Date();
    const days: { name: string; completed: boolean }[] = [];
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, "yyyy-MM-dd");
      const practice = allPractices[`${goal.id}_${dateStr}`];
      const dayIndex = (date.getDay() + 6) % 7; // Monday = 0
      days.push({
        name: dayNames[dayIndex],
        completed: practice?.locked === true,
      });
    }

    return days;
  }, [goal.id]);

  const startDate = goal.start_date
    ? format(parseISO(goal.start_date), "MMM d")
    : goal.created_at
      ? format(parseISO(goal.created_at), "MMM d")
      : "—";

  // Calculate days left (if there's an end date, otherwise show "Active")
  const daysInfo = useMemo(() => {
    if (goal.start_date) {
      const start = parseISO(goal.start_date);
      const today = new Date();
      const daysSinceStart = differenceInDays(today, start) + 1;
      return `Day ${daysSinceStart}`;
    }
    return "Active";
  }, [goal.start_date]);

  const handleCoverImageChange = async (newImageUrl: string) => {
    try {
      await supabase.from("manifest_goals").update({ cover_image_url: newImageUrl }).eq("id", goal.id);
    } catch (error) {
      console.error("Failed to update cover image:", error);
    }
  };

  const categoryColors: Record<string, string> = {
    health: "bg-emerald-100 text-emerald-600",
    career: "bg-blue-100 text-blue-600",
    personal: "bg-purple-100 text-purple-600",
    wealth: "bg-amber-100 text-amber-600",
    relationships: "bg-pink-100 text-pink-600",
    other: "bg-slate-100 text-slate-600",
  };

  return (
    <Card
      className={`relative cursor-pointer transition-all duration-300 overflow-hidden rounded-xl group hover:shadow-md ${
        isSelected ? "ring-2 ring-teal-500 shadow-lg" : "border-slate-200 dark:border-slate-800"
      }`}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      <CardContent className="p-0">
        <div className="flex">
          {/* Left: Square Image */}
          <div className="relative w-36 h-44 shrink-0 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <EntryImageUpload
              currentImageUrl={goal.cover_image_url || goal.vision_image_url || null}
              presetType="manifest"
              category={goal.category || "other"}
              onImageChange={handleCoverImageChange}
              className="w-full h-full"
            />
          </div>

          {/* Right: Content */}
          <div className="flex-1 p-4 flex flex-col min-w-0">
            {/* Row 1: Icon + Title + Category + Status */}
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm line-clamp-1 flex-1">
                {goal.title}
              </h3>
              {goal.category && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium uppercase ${categoryColors[goal.category] || categoryColors.other}`}
                >
                  {goal.category}
                </span>
              )}
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-teal-100 text-teal-600 border border-teal-200">
                Active
              </span>
              {streak > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-600 flex items-center gap-1">
                  <Flame className="h-3 w-3" />
                  {streak}
                </span>
              )}
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>

            {/* Row 2: Date Info */}
            <div className="text-xs text-slate-500 mb-3 flex items-center gap-2">
              <span>Started {startDate}</span>
              <span>•</span>
              <span>{daysInfo}</span>
              {goal.check_in_time && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {goal.check_in_time}
                  </span>
                </>
              )}
            </div>

            {/* Row 3: Progress Bar */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-500"
                  style={{ width: `${momentum}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-600 w-10 text-right">{momentum}%</span>
            </div>

            {/* Row 4: Week Days */}
            <div className="flex items-center justify-between mb-3">
              {weekDays.map((day, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-slate-400">{day.name}</span>
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center ${
                      day.completed ? "bg-teal-500 text-white" : "bg-slate-100 dark:bg-slate-800"
                    }`}
                  >
                    {day.completed && <Check className="h-3 w-3" />}
                  </div>
                </div>
              ))}
            </div>

            {/* Row 5: Stats */}
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
                {streak}
              </span>
              <span className="flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-yellow-500" />
                {momentum}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
