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
      {/* Hero Image Section */}
      <div className="relative h-40 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <EntryImageUpload
          currentImageUrl={goal.cover_image_url || goal.vision_image_url || null}
          presetType="manifest"
          category={goal.category || "other"}
          onImageChange={handleCoverImageChange}
          className="w-full h-full"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* Badges on image */}
        <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
          <Badge className="text-xs rounded-full px-3 py-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-0 shadow-lg">
            <Sparkles className="h-3 w-3 mr-1" />
            Active
          </Badge>
          {streak > 0 && (
            <Badge className="text-xs rounded-full px-3 py-1 bg-orange-500 text-white border-0 shadow-lg">
              <Flame className="h-3 w-3 mr-1" />
              Day {streak}
            </Badge>
          )}
        </div>

        {/* Action Buttons on image */}
        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {onEdit && (
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full bg-white/90 hover:bg-white shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 rounded-full bg-white/90 hover:bg-white shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/manifest/history/${goal.id}`);
            }}
          >
            <History className="h-3.5 w-3.5" />
          </Button>
          {onDelete && (
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full bg-white/90 hover:bg-red-50 text-red-500 shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Title on image */}
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <h3 className="font-semibold text-white leading-snug text-lg drop-shadow-lg line-clamp-2">{goal.title}</h3>
        </div>
      </div>

      {/* Card Content */}
      <CardContent className="p-4 space-y-4">
        {/* Meta info */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Started {startDate}</span>
          {goal.check_in_time && (
            <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
              <Clock className="h-3 w-3" />
              {goal.check_in_time}
            </span>
          )}
        </div>

        {/* 7-day History */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Last 7 days</span>
          <div className="flex items-center gap-1">
            {last7DaysHistory.map((day, idx) => (
              <div
                key={idx}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
                  day.completed
                    ? "bg-gradient-to-br from-teal-400 to-cyan-500 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                }`}
                title={format(day.date, "EEE, MMM d")}
              >
                {day.completed ? <Check className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              </div>
            ))}
          </div>
        </div>

        {/* Momentum Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Momentum</span>
            <span className="font-bold text-teal-600">{momentum}%</span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-500"
              style={{ width: `${momentum}%` }}
            />
          </div>
        </div>

        {/* CTA Button */}
        <Button
          className="w-full rounded-full h-11 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg shadow-teal-500/20"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <Play className="h-4 w-4 mr-2" />
          Start Today's Practice
        </Button>
      </CardContent>
    </Card>
  );
}
