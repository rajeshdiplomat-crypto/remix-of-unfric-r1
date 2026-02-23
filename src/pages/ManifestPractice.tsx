import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { isOfflineError } from "@/lib/offlineAwareOperation";
import { Sparkles, ArrowLeft, ChevronLeft, ChevronRight, CalendarIcon, Flame, ImagePlus, Target, TrendingUp } from "lucide-react";
import { PageLoadingScreen } from "@/components/common/PageLoadingScreen";
import { subDays, addDays, parseISO, isSameDay, format, isToday } from "date-fns";

function safeJsonArray(val: any): any[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UnifiedDatePicker } from "@/components/common/UnifiedDatePicker";
import { cn } from "@/lib/utils";

import { ManifestPracticePanel } from "@/components/manifest/ManifestPracticePanel";

import { type ManifestGoal, type ManifestDailyPractice } from "@/components/manifest/types";

export default function ManifestPractice() {
  const { goalId } = useParams<{ goalId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [goal, setGoal] = useState<ManifestGoal | null>(null);
  const [practices, setPractices] = useState<ManifestDailyPractice[]>([]);
  const [loading, setLoading] = useState(true);

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

  const setSelectedDate = useCallback(
    (date: Date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      setSearchParams({ date: dateStr }, { replace: true });
    },
    [setSearchParams],
  );

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
        vision_images: safeJsonArray(g.vision_images),
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
        reminder_times: safeJsonArray(g.reminder_times),
      };
      setGoal(mergedGoal);

      const { data: practicesData } = await supabase
        .from("manifest_practices")
        .select("*")
        .eq("goal_id", goalId)
        .eq("user_id", user.id);

      if (practicesData) {
        setPractices(
          practicesData.map((p: any) => ({
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
          })),
        );
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
      <PageLoadingScreen module="manifest" isDataReady={false} onFinished={() => setLoadingFinished(true)} />
    ) : null;
  }

  const totalPracticed = practices.filter((p) => p.goal_id === goal.id && p.locked).length;

  return (
    <>
      {!loadingFinished && (
        <PageLoadingScreen module="manifest" isDataReady={isDataReady} onFinished={() => setLoadingFinished(true)} />
      )}
      <div className="flex flex-col w-full flex-1 bg-background antialiased overflow-hidden min-h-0">
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-0 w-full max-w-[1400px] mx-auto min-h-0 overflow-hidden">
          {/* ========== LEFT COLUMN: Editorial + Vision Board (desktop only) ========== */}
          <div className="hidden lg:flex flex-col min-h-0 overflow-y-auto">
            <div className="flex flex-col gap-5 py-6 px-5">
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
                <h1 className="text-3xl font-light text-foreground tracking-tight leading-tight">Practice Your</h1>
                <h1 className="text-3xl font-semibold text-foreground tracking-tight leading-tight">Reality</h1>
              </div>

              <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
                Visualization rewires your brain for success. Act as if your dream is already real, collect proof, and watch the universe align.
              </p>

              <div className="h-px bg-border" />

              {/* ===== Vision Board ===== */}
              {(() => {
                const visionImgs: string[] = [];
                const vi = goal.vision_images;
                const parsed = Array.isArray(vi) ? vi : (() => { try { return Array.isArray(JSON.parse(vi as any)) ? JSON.parse(vi as any) : []; } catch { return []; } })();
                if (goal.cover_image_url) visionImgs.push(goal.cover_image_url);
                parsed.forEach((img: string) => { if (img && !visionImgs.includes(img)) visionImgs.push(img); });
                if (goal.vision_image_url && !visionImgs.includes(goal.vision_image_url)) visionImgs.push(goal.vision_image_url);

                if (visionImgs.length > 0) {
                  const count = Math.min(visionImgs.length, 5);
                  return (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <ImagePlus className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground tracking-wide">Vision Board</span>
                      </div>
                      {/* Row 1: hero left + 2 stacked right */}
                      <div className="flex gap-1.5">
                        {/* Main large image */}
                        <div className="relative overflow-hidden rounded-lg group cursor-pointer flex-[3] aspect-[4/3]">
                          <img src={visionImgs[0]} alt="Vision 1" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        </div>
                        {count >= 2 && (
                          <div className="flex flex-col gap-1.5 flex-[2]">
                            <div className="relative overflow-hidden rounded-lg group cursor-pointer flex-1">
                              <img src={visionImgs[1]} alt="Vision 2" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            </div>
                            {count >= 3 && (
                              <div className="relative overflow-hidden rounded-lg group cursor-pointer flex-1">
                                <img src={visionImgs[2]} alt="Vision 3" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {/* Row 2: remaining images */}
                      {count >= 4 && (
                        <div className="flex gap-1.5">
                          {visionImgs.slice(3, 5).map((img, i) => (
                            <div key={i} className="relative overflow-hidden rounded-lg group cursor-pointer flex-1 aspect-[3/2]">
                              <img src={img} alt={`Vision ${i + 4}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })()}

              {/* ===== Goal Stats ===== */}
              <div className="space-y-2.5">
                {streak > 0 && (
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/20 border border-border/30">
                    <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                      <Flame className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{streak} day streak</p>
                      <p className="text-[10px] text-muted-foreground">Consecutive practice days</p>
                    </div>
                  </div>
                )}
                {totalPracticed > 0 && (
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/20 border border-border/30">
                    <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{totalPracticed} day{totalPracticed !== 1 ? "s" : ""} practiced</p>
                      <p className="text-[10px] text-muted-foreground">Total sessions completed</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ========== RIGHT COLUMN: Practice Panel ========== */}
          <div className="flex flex-col min-h-0 overflow-hidden">
            {/* Compact mobile header: back + date nav in one row */}
            <div className="lg:hidden flex items-center justify-between px-2 py-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground"
                onClick={() => navigate("/manifest")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <UnifiedDatePicker
                  value={selectedDate}
                  onChange={(date) => {
                    if (date) setSelectedDate(date);
                  }}
                  displayFormat={isToday(selectedDate) ? "'Today'" : "MMM d"}
                  triggerClassName={cn(
                    "h-7 px-2 gap-1 rounded-lg text-xs font-medium",
                    isToday(selectedDate) && "border-primary/30",
                  )}
                  icon={<CalendarIcon className="h-3 w-3" />}
                  align="center"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                  disabled={isToday(selectedDate)}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                {!isToday(selectedDate) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-[10px] text-primary"
                    onClick={() => setSelectedDate(new Date())}
                  >
                    Today
                  </Button>
                )}
              </div>
            </div>

            {/* Desktop date nav */}
            <div className="hidden lg:flex items-center justify-center gap-1 mb-1 px-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setSelectedDate(subDays(selectedDate, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <UnifiedDatePicker
                value={selectedDate}
                onChange={(date) => {
                  if (date) setSelectedDate(date);
                }}
                displayFormat={isToday(selectedDate) ? "'Today'" : "MMM d, yyyy"}
                triggerClassName={cn(
                  "h-8 px-3 gap-1.5 rounded-lg text-sm font-medium",
                  isToday(selectedDate) && "border-primary/30",
                )}
                icon={<CalendarIcon className="h-3.5 w-3.5" />}
                align="center"
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                disabled={isToday(selectedDate)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              {!isToday(selectedDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-primary"
                  onClick={() => setSelectedDate(new Date())}
                >
                  Today
                </Button>
              )}
            </div>

            <div className="lg:rounded-2xl lg:shadow-sm lg:border lg:border-border flex-1 min-h-0 overflow-hidden">
              <ManifestPracticePanel
                goal={goal}
                streak={streak}
                totalPracticed={totalPracticed}
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
