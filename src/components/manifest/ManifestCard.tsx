import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Clock, Flame, Sparkles, Play } from "lucide-react";
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

export function ManifestCard({ goal, streak, momentum, isSelected, onClick }: ManifestCardProps) {
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

  const handleImageChange = async (url: string) => {
    try {
      await supabase.from("manifest_goals").update({ cover_image_url: url }).eq("id", goal.id);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Card
      onClick={onClick}
      className={`overflow-hidden rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isSelected ? "ring-2 ring-teal-500 shadow-lg" : "border-slate-200 dark:border-slate-700"
      }`}
    >
      {/* Image Section */}
      <div className="relative h-36" onClick={(e) => e.stopPropagation()}>
        <EntryImageUpload
          currentImageUrl={goal.cover_image_url || goal.vision_image_url || null}
          presetType="manifest"
          category={goal.category || "other"}
          onImageChange={handleImageChange}
          className="w-full h-full"
        />

        {/* Overlay Badges */}
        <div className="absolute bottom-3 left-3 flex gap-2">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-teal-600 shadow-sm">
            Day {dayNumber}
          </span>
          {streak > 1 && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-orange-500 text-white flex items-center gap-1">
              <Flame className="h-3 w-3" /> {streak}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-slate-800 dark:text-white text-base leading-snug mb-3 line-clamp-2">
          {goal.title}
        </h3>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-500">Progress</span>
            <span className="font-semibold text-teal-600">{momentum}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all"
              style={{ width: `${momentum}%` }}
            />
          </div>
        </div>

        {/* Week Dots */}
        <div className="flex justify-between mb-4">
          {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-slate-400">{day}</span>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  weekProgress[i] ? "bg-teal-500 text-white" : "bg-slate-100 dark:bg-slate-800"
                }`}
              >
                {weekProgress[i] && <Check className="h-2.5 w-2.5" />}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="w-full h-10 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-medium"
        >
          <Play className="h-4 w-4 mr-2" />
          Practice Now
        </Button>
      </div>
    </Card>
  );
}
