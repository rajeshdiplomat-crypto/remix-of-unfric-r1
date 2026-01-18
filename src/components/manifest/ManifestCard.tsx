import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Check, Minus, Clock, History, Trash2, Sparkles, Flame, Play } from "lucide-react";
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
        {/* Horizontal Layout: Image Left, Content Right */}
        <div className="flex">
          {/* Left: Square Vision Image */}
          <div
            className="relative w-32 h-32 shrink-0 overflow-hidden rounded-l-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <EntryImageUpload
              currentImageUrl={goal.cover_image_url || goal.vision_image_url || null}
              presetType="manifest"
              category={goal.category || "other"}
              onImageChange={handleCoverImageChange}
              className="w-full h-full"
            />
          </div>

          {/* Right: Content */}
          <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
            {/* Top Row: Title + Badges */}
            <div>
              <div className="flex items-start gap-2 mb-1">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 leading-snug text-base line-clamp-1 flex-1">
                  {goal.title}
                </h3>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs rounded-full px-2 py-0.5 bg-teal-100 text-teal-600 font-medium">Active</span>
                  {streak > 0 && (
                    <span className="text-xs rounded-full px-2 py-0.5 bg-orange-100 text-orange-600 font-medium flex items-center gap-1">
                      <Flame className="h-3 w-3" />
                      {streak}
                    </span>
                  )}
                </div>
              </div>

              {/* Meta Row */}
              <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                <span>Started {startDate}</span>
                {goal.check_in_time && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {goal.check_in_time}
                  </span>
                )}
              </div>
            </div>

            {/* 7-day History - Compact */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-0.5">
                {last7DaysHistory.map((day, idx) => (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded flex items-center justify-center ${
                      day.completed ? "bg-teal-500 text-white" : "bg-slate-100 dark:bg-slate-800"
                    }`}
                    title={format(day.date, "EEE, MMM d")}
                  >
                    {day.completed && <Check className="h-2.5 w-2.5" />}
                  </div>
                ))}
              </div>
              <span className="text-xs text-slate-400">
                <Flame className="h-3 w-3 inline mr-0.5" />
                {streak}
                <span className="mx-1">•</span>
                <Sparkles className="h-3 w-3 inline mr-0.5" />
                {momentum}%
              </span>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="rounded-full h-8 px-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
              >
                <Play className="h-3 w-3 mr-1" />
                Practice
              </Button>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/manifest/history/${goal.id}`);
                  }}
                >
                  <History className="h-3 w-3" />
                </Button>
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full text-red-500 hover:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
