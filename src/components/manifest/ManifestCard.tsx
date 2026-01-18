import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
          {/* Left: Vision Image */}
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
          <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
            {/* Top: Badges */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge className="text-xs rounded-full px-2.5 py-0.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-0 shadow-sm">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Active
                </Badge>
                {streak > 0 && (
                  <Badge className="text-xs rounded-full px-2.5 py-0.5 bg-orange-500 text-white border-0 shadow-sm">
                    <Flame className="h-3 w-3 mr-1" />
                    Day {streak}
                  </Badge>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full hover:bg-slate-100"
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
                  className="h-7 w-7 rounded-full hover:bg-slate-100"
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
                    className="h-7 w-7 rounded-full hover:bg-red-50 text-red-500"
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

            {/* Title */}
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 leading-snug text-base line-clamp-2 mb-2">
              {goal.title}
            </h3>

            {/* Meta info */}
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Started {startDate}</span>
              {goal.check_in_time && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {goal.check_in_time}
                </span>
              )}
            </div>

            {/* 7-day History */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">Last 7 days</span>
              <div className="flex items-center gap-1">
                {last7DaysHistory.map((day, idx) => (
                  <div
                    key={idx}
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      day.completed
                        ? "bg-gradient-to-br from-teal-400 to-cyan-500 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                    }`}
                    title={format(day.date, "EEE, MMM d")}
                  >
                    {day.completed ? <Check className="h-2.5 w-2.5" /> : <Minus className="h-2.5 w-2.5" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Momentum Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Momentum</span>
                <span className="font-bold text-teal-600">{momentum}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-500"
                  style={{ width: `${momentum}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button - Full Width at Bottom */}
        <div className="px-4 pb-4">
          <Button
            className="w-full rounded-full h-10 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-md"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <Play className="h-4 w-4 mr-2" />
            Start Today's Practice
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
