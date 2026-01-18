import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Check, Clock, History, Trash2, Sparkles, Flame, Play } from "lucide-react";
import { type ManifestGoal, type ManifestProof, type ManifestDailyPractice, DAILY_PRACTICE_KEY } from "./types";
import { format, subDays, parseISO } from "date-fns";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { EntryImageUpload } from "@/components/common/EntryImageUpload";
import { supabase } from "@/integrations/supabase/client";

interface ManifestCardProps {
  goal: ManifestGoal;
  streak: number;
  momentum: number;
  lastProof?: ManifestProof;
  isSelected: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ManifestCard({
  goal,
  streak,
  momentum,
  lastProof,
  isSelected,
  onClick,
  onEdit,
  onDelete,
}: ManifestCardProps) {
  const navigate = useNavigate();

  // Get last 7 days practice history
  const last7DaysHistory = useMemo(() => {
    const stored = localStorage.getItem(DAILY_PRACTICE_KEY);
    const allPractices: Record<string, ManifestDailyPractice> = stored ? JSON.parse(stored) : {};

    const today = new Date();
    const history: { date: Date; completed: boolean }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, "yyyy-MM-dd");
      const practice = allPractices[`${goal.id}_${dateStr}`];
      history.push({
        date,
        completed: practice?.locked === true,
      });
    }

    return history;
  }, [goal.id]);

  const startDate = goal.start_date
    ? format(parseISO(goal.start_date), "MMM d, yyyy")
    : goal.created_at
      ? format(parseISO(goal.created_at), "MMM d, yyyy")
      : "—";

  const handleCoverImageChange = async (newImageUrl: string) => {
    try {
      await supabase.from("manifest_goals").update({ cover_image_url: newImageUrl }).eq("id", goal.id);
    } catch (error) {
      console.error("Failed to update cover image:", error);
    }
  };

  return (
    <Card
      className={`relative cursor-pointer transition-all duration-300 overflow-hidden rounded-2xl group ${
        isSelected
          ? "ring-2 ring-teal-500 shadow-xl shadow-teal-500/20"
          : "border-slate-200 dark:border-slate-800 hover:shadow-lg hover:border-teal-200 dark:hover:border-teal-800"
      }`}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      <CardContent className="p-0">
        {/* Full Width Image - Edge to Edge */}
        <div className="relative w-full h-40 overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <EntryImageUpload
            currentImageUrl={goal.cover_image_url || goal.vision_image_url || null}
            presetType="manifest"
            category={goal.category || "other"}
            onImageChange={handleCoverImageChange}
            className="w-full h-full"
          />

          {/* Action Buttons on Image */}
          <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full bg-white/80 hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full bg-white/80 hover:bg-white"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/manifest/history/${goal.id}`);
              }}
            >
              <History className="h-3.5 w-3.5" />
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full bg-white/80 hover:bg-red-50 text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Content Below Image */}
        <div className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 leading-snug text-base line-clamp-1 mb-2">
            {goal.title}
          </h3>

          {/* Meta Row with Stats */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
            <div className="flex items-center gap-2">
              <span>Started {startDate}</span>
              {goal.check_in_time && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {goal.check_in_time}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* 7-day mini dots */}
              <div className="flex items-center gap-0.5">
                {last7DaysHistory.map((day, idx) => (
                  <div
                    key={idx}
                    className={`w-3 h-3 rounded-full ${
                      day.completed ? "bg-teal-500" : "bg-slate-200 dark:bg-slate-700"
                    }`}
                    title={format(day.date, "EEE, MMM d")}
                  />
                ))}
              </div>
              <span className="flex items-center gap-1 text-slate-600">
                <Flame className="h-3 w-3 text-orange-500" />
                {streak}
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <Sparkles className="h-3 w-3 text-teal-500" />
                {momentum}%
              </span>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            className="w-full rounded-full h-10 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <Play className="h-4 w-4 mr-2" />
            Practice
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
