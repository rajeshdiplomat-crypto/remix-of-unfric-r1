import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { isOfflineError } from "@/lib/offlineAwareOperation";
import { Sparkles, ArrowLeft, ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { PageLoadingScreen } from "@/components/common/PageLoadingScreen";
import { subDays, addDays, parseISO, isSameDay, format, isToday } from "date-fns";

function safeJsonArray(val: any): any[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try { const parsed = JSON.parse(val); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
  }
  return [];
}
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UnifiedDatePicker } from "@/components/common/UnifiedDatePicker";
import { cn } from "@/lib/utils";

import { ManifestPracticePanel } from "@/components/manifest/ManifestPracticePanel";

import {
  type ManifestGoal,
  type ManifestDailyPractice,
} from "@/components/manifest/types";

// All goal data now comes from DB columns directly

export default function ManifestPractice() {
  const { goalId } = useParams<{ goalId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [goal, setGoal] = useState<ManifestGoal | null>(null);
  const [practices, setPractices] = useState<ManifestDailyPractice[]>([]);
  const [loading, setLoading] = useState(true);

  // Parse date from URL or default to today
  const selectedDate = useMemo(() => {
    const dateParam = searchParams.get("date");
    if (dateParam) {
      try {
        return parseISO(dateParam);
      } catch {
        return new Date();
      }
    }
    return new Date();
  }, [searchParams]);

  const setSelectedDate = useCallback((date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    setSearchParams({ date: dateStr }, { replace: true });
  }, [setSearchParams]);

  const fetchData = useCallback(async () => {
    if (!user || !goalId) return;

    try {
      const { data: goalData, error } = await supabase
        .from("manifest_goals")
        .select("*")
        .eq("id", goalId)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      const g = goalData as any;
      const mergedGoal: ManifestGoal = {
        id: g.id,
        user_id: g.user_id,
        title: g.title,
        category: g.category || "other",
        vision_image_url: g.cover_image_url,
        vision_images: g.vision_images || [],
        cover_image_url: g.cover_image_url,
        start_date: g.start_date,
        live_from_end: g.live_from_end,
        act_as_if: g.act_as_if || "Take one small action",
        conviction: g.conviction ?? 5,
        visualization_minutes: g.visualization_minutes || 3,
        daily_affirmation: g.daily_affirmation || "",
        check_in_time: g.check_in_time || "08:00",
        committed_7_days: g.committed_7_days || false,
        is_completed: g.is_completed || false,
        is_locked: g.is_locked || false,
        created_at: g.created_at,
        updated_at: g.updated_at,
        reminder_count: g.reminder_count,
        reminder_times: g.reminder_times,
      };

      setGoal(mergedGoal);

      // Load practices from DB
      const { data: practicesData } = await supabase
        .from("manifest_practices")
        .select("*")
        .eq("goal_id", goalId)
        .eq("user_id", user.id);

      if (practicesData) {
        const practicesList: ManifestDailyPractice[] = practicesData.map((p: any) => ({
          id: p.id,
          goal_id: p.goal_id,
          user_id: p.user_id,
          entry_date: p.entry_date,
          created_at: p.created_at,
          visualization_count: safeJsonArray(p.visualizations).length,
          visualizations: safeJsonArray(p.visualizations),
          act_count: safeJsonArray(p.acts).length,
          acts: safeJsonArray(p.acts),
          proofs: safeJsonArray(p.proofs),
          gratitudes: safeJsonArray(p.gratitudes),
          alignment: p.alignment,
          growth_note: p.growth_note,
          locked: p.locked || false,
        }));
        setPractices(practicesList);
      }
    } catch (error) {
      console.error("Error fetching goal:", error);
      if (!isOfflineError()) {
        toast.error("Failed to load reality");
        navigate("/manifest");
      }
    } finally {
      setLoading(false);
    }
  }, [user, goalId, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const streak = useMemo(() => {
    if (!goal) return 0;
    const today = new Date();
    const goalPractices = practices.filter((p) => p.goal_id === goal.id && p.locked);
    let s = 0;
    for (let i = 0; i < 30; i++) {
      const checkDate = subDays(today, i);
      const hasPractice = goalPractices.some((p) => isSameDay(parseISO(p.entry_date), checkDate));
      if (hasPractice) s++;
      else if (i > 0) break;
    }
    return s;
  }, [goal, practices]);

  const getPreviousDayPractice = useCallback((): ManifestDailyPractice | null => {
    if (!goal) return null;
    const yesterday = format(subDays(selectedDate, 1), "yyyy-MM-dd");
    return practices.find((p) => p.goal_id === goal.id && p.entry_date === yesterday) || null;
  }, [goal, selectedDate, practices]);

  const getMotivationalQuote = () => {
    const quotes = [
      "What you imagine, you create. What you feel, you attract.",
      "Your beliefs become your reality. Choose them wisely.",
      "The universe is rearranging itself for your dreams.",
      "Feel the feeling of your wish fulfilled.",
      "Assume the feeling of your wish fulfilled today.",
      "You are the creator of your own experience.",
      "Every thought is a seed for your future.",
    ];
    return quotes[Math.floor(new Date().getDate() % quotes.length)];
  };

  const [loadingFinished, setLoadingFinished] = useState(false);
  const isDataReady = !loading;

  if (!goal) {
    return !loadingFinished ? (
      <PageLoadingScreen
        module="manifest"
        isDataReady={false}
        onFinished={() => setLoadingFinished(true)}
      />
    ) : null;
  }

  return (
    <>
    {!loadingFinished && (
      <PageLoadingScreen
        module="manifest"
        isDataReady={isDataReady}
        onFinished={() => setLoadingFinished(true)}
      />
    )}
    <div className="flex flex-col w-full flex-1 bg-background min-h-screen overflow-hidden pt-14">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-0 w-full max-w-[1400px] mx-auto overflow-hidden">
        {/* ========== LEFT COLUMN: Editorial ========== */}
        <div className="hidden lg:flex flex-col h-full min-h-0 overflow-y-auto">
          <div className="flex flex-col gap-6 py-6 px-5">
            <Button
              variant="ghost"
              size="sm"
              className="w-fit gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
              onClick={() => navigate("/manifest")}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Realities
            </Button>

            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 gap-1.5">
              <Sparkles className="h-3 w-3" />
              Daily Practice
            </Badge>

            <div>
              <h1 className="text-3xl font-light text-foreground tracking-tight leading-tight">
                Practice Your
              </h1>
              <h1 className="text-3xl font-semibold text-foreground tracking-tight leading-tight">
                Reality
              </h1>
            </div>

            <p className="text-muted-foreground text-base leading-relaxed max-w-md">
              Visualization rewires your brain for success. Act as if your dream is already real, collect proof, and watch the universe align.
            </p>

            <div className="h-px bg-border" />

            <div className="bg-muted/30 rounded-xl p-4 border border-border">
              <p className="text-sm text-muted-foreground italic leading-relaxed">
                "{getMotivationalQuote()}"
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground line-clamp-1">{goal.title}</p>
                  <p className="text-xs text-muted-foreground">Current reality in focus</p>
                </div>
              </div>

              {streak > 0 && (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <span className="text-sm font-bold text-orange-600">{streak}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Day Streak</p>
                    <p className="text-xs text-muted-foreground">Consecutive practice days</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========== RIGHT COLUMN: Practice Panel ========== */}
        <div className="flex flex-col h-full min-h-0">
          {/* Mobile back button */}
          <div className="lg:hidden mb-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-fit gap-1.5 text-muted-foreground"
              onClick={() => navigate("/manifest")}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
          </div>

          {/* Date Navigation Bar */}
          <div className="flex items-center justify-between mb-2 px-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => setSelectedDate(subDays(selectedDate, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <UnifiedDatePicker
              value={selectedDate}
              onChange={(date) => { if (date) setSelectedDate(date); }}
              displayFormat={isToday(selectedDate) ? "'Today'" : "MMM d, yyyy"}
              triggerClassName={cn(
                "h-8 px-3 gap-1.5 rounded-lg text-sm font-medium",
                isToday(selectedDate) && "border-primary/30"
              )}
              icon={<CalendarIcon className="h-3.5 w-3.5" />}
              align="center"
            />

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                disabled={isToday(selectedDate)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              {!isToday(selectedDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-teal-600"
                  onClick={() => setSelectedDate(new Date())}
                >
                  Today
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-2xl shadow-sm border border-border flex-1 overflow-hidden">
            <ManifestPracticePanel
              goal={goal}
              streak={streak}
              selectedDate={selectedDate}
              previousPractice={getPreviousDayPractice()}
              onClose={() => navigate("/manifest")}
              onPracticeComplete={() => fetchData()}
              onGoalUpdate={() => fetchData()}
            />
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
