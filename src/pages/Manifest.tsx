import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDatePreferences } from "@/hooks/useDatePreferences";
import { toast } from "sonner";
import { isOfflineError } from "@/lib/offlineAwareOperation";
import { Sparkles, Plus, ChevronDown, ChevronUp, Calendar, BarChart3, TrendingUp, Clock } from "lucide-react";
import { PageLoadingScreen } from "@/components/common/PageLoadingScreen";
import { PageHero, PAGE_HERO_TEXT } from "@/components/common/PageHero";
import { subDays, parseISO, isSameDay, format } from "date-fns";

function safeJsonArray(val: any): any[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try { const parsed = JSON.parse(val); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
  }
  return [];
}

import { ManifestCard } from "@/components/manifest/ManifestCard";
import { ManifestCreateModal } from "@/components/manifest/ManifestCreateModal";
import { ManifestSidebarPanel } from "@/components/manifest/ManifestSidebarPanel";
import { ManifestAnalyticsModal } from "@/components/manifest/ManifestAnalyticsModal";
import { HistoryDrawer } from "@/components/manifest/HistoryDrawer";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  type ManifestGoal,
  type ManifestProof,
  type ManifestDailyPractice,
} from "@/components/manifest/types";

// Save goal extras directly to DB
async function saveGoalExtras(goalId: string, extras: Partial<ManifestGoal>) {
  try {
    const updateData: any = {};
    if (extras.category !== undefined) updateData.category = extras.category;
    if (extras.vision_images !== undefined) updateData.vision_images = JSON.stringify(extras.vision_images);
    if (extras.start_date !== undefined) updateData.start_date = extras.start_date || null;
    if (extras.live_from_end !== undefined) updateData.live_from_end = extras.live_from_end;
    if (extras.act_as_if !== undefined) updateData.act_as_if = extras.act_as_if;
    if (extras.conviction !== undefined) updateData.conviction = extras.conviction;
    if (extras.visualization_minutes !== undefined) updateData.visualization_minutes = extras.visualization_minutes;
    if (extras.daily_affirmation !== undefined) updateData.daily_affirmation = extras.daily_affirmation;
    if (extras.check_in_time !== undefined) updateData.check_in_time = extras.check_in_time;
    if (extras.committed_7_days !== undefined) updateData.committed_7_days = extras.committed_7_days;
    if (extras.is_locked !== undefined) updateData.is_locked = extras.is_locked;
    if (extras.reminder_count !== undefined) updateData.reminder_count = extras.reminder_count;
    if (extras.reminder_times !== undefined) updateData.reminder_times = JSON.stringify(extras.reminder_times);

    if (Object.keys(updateData).length > 0) {
      await supabase.from("manifest_goals").update(updateData).eq("id", goalId);
    }
  } catch (e) {
    console.warn("Failed to save goal extras to DB:", e);
  }
}

export default function Manifest() {
  const { user } = useAuth();
  const { formatDate: fmtDate } = useDatePreferences();
  const navigate = useNavigate();

  const [goals, setGoals] = useState<ManifestGoal[]>([]);
  const [proofs, setProofs] = useState<ManifestProof[]>([]);
  const [practices, setPractices] = useState<ManifestDailyPractice[]>([]);
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [editingGoal, setEditingGoal] = useState<ManifestGoal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<ManifestGoal | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newlyCreatedGoalId, setNewlyCreatedGoalId] = useState<string | null>(null);
  const [historyGoal, setHistoryGoal] = useState<ManifestGoal | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  const [showProgressPopup, setShowProgressPopup] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      const { data: goalsData, error: goalsError } = await supabase
        .from("manifest_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (goalsError) throw goalsError;

      // All goal data comes from DB columns directly
      const mergedGoals: ManifestGoal[] = (goalsData || []).map((g: any) => ({
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
      }));

      setGoals(mergedGoals);

      // Load practices from DB first, then localStorage fallback
      const { data: dbPractices } = await supabase
        .from("manifest_practices")
        .select("*")
        .eq("user_id", user.id);

      let practicesList: ManifestDailyPractice[];
      if (dbPractices && dbPractices.length > 0) {
        practicesList = dbPractices.map((p: any) => ({
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
      } else {
        practicesList = [];
      }
      setPractices(practicesList);

      const extractedProofs: ManifestProof[] = practicesList.flatMap((p) =>
        safeJsonArray(p.proofs).map((proof) => ({
          id: proof.id,
          goal_id: p.goal_id,
          text: proof.text,
          image_url: proof.image_url,
          created_at: proof.created_at,
        })),
      );
      setProofs(extractedProofs);
    } catch (error) {
      console.error("Error fetching data:", error);
      if (!isOfflineError()) {
        toast.error("Failed to load manifestations");
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate metrics
  const getGoalMetrics = useCallback(
    (goal: ManifestGoal) => {
      const today = new Date();
      const goalPractices = practices.filter((p) => p.goal_id === goal.id && p.locked);

      let streak = 0;
      for (let i = 0; i < 30; i++) {
        const checkDate = subDays(today, i);
        const hasPractice = goalPractices.some((p) => isSameDay(parseISO(p.entry_date), checkDate));
        if (hasPractice) streak++;
        else if (i > 0) break;
      }

      const last7Practices = goalPractices.filter((p) => parseISO(p.entry_date) >= subDays(today, 7));
      const convictionAvg = goal.conviction * 10;
      const actConsistency = (last7Practices.filter((p) => (p.act_count || 0) > 0).length / 7) * 100;
      const proofRate = Math.min((last7Practices.filter((p) => (p.proofs?.length || 0) > 0).length / 7) * 100, 100);
      const momentum = Math.round(convictionAvg * 0.4 + actConsistency * 0.3 + proofRate * 0.3);

      const goalProofs = proofs.filter((p) => p.goal_id === goal.id);
      const lastProof = goalProofs[0];

      return { streak, momentum, lastProof };
    },
    [practices, proofs],
  );

  const activeGoals = goals.filter((g) => !g.is_completed && !g.is_locked);
  const completedGoals = goals.filter((g) => g.is_completed);

  const aggregateStreak = useMemo(() => {
    const today = new Date();
    let streak = 0;
    const lockedPractices = practices.filter((p) => p.locked);

    for (let i = 0; i < 30; i++) {
      const checkDate = subDays(today, i);
      const hasPractice = lockedPractices.some((p) => isSameDay(parseISO(p.entry_date), checkDate));
      if (hasPractice) streak++;
      else if (i > 0) break;
    }
    return streak;
  }, [practices]);

  const avgMomentum = useMemo(() => {
    if (activeGoals.length === 0) return 0;
    const total = activeGoals.reduce((sum, goal) => sum + getGoalMetrics(goal).momentum, 0);
    return Math.round(total / activeGoals.length);
  }, [activeGoals, getGoalMetrics]);

  // Get previous day's practice for visualization mode
  const getPreviousDayPractice = useCallback((goalId: string): ManifestDailyPractice | null => {
    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
    return practices.find(p => p.goal_id === goalId && p.entry_date === yesterday) || null;
  }, [practices]);

  // Handlers
  const handleSaveGoal = async (goalData: any) => {
    if (!user) return;
    setSaving(true);

    try {
      let goalId: string;

      if (editingGoal) {
        const { error } = await supabase
          .from("manifest_goals")
          .update({
            title: goalData.title,
            cover_image_url: goalData.vision_image_url || editingGoal.cover_image_url || null,
            category: goalData.category,
            vision_images: JSON.stringify(goalData.vision_images || []),
            start_date: goalData.start_date || null,
            live_from_end: goalData.live_from_end,
            act_as_if: goalData.act_as_if,
            conviction: goalData.conviction,
            visualization_minutes: goalData.visualization_minutes,
            daily_affirmation: goalData.daily_affirmation,
            check_in_time: goalData.check_in_time,
            committed_7_days: goalData.committed_7_days,
            is_locked: false,
            reminder_count: goalData.reminder_count,
            reminder_times: JSON.stringify(goalData.reminder_times || []),
          } as any)
          .eq("id", editingGoal.id);
        if (error) throw error;
        goalId = editingGoal.id;
        toast.success("Reality updated!");
      } else {
        const { data, error } = await supabase
          .from("manifest_goals")
          .insert({
            user_id: user.id,
            title: goalData.title,
            is_completed: false,
            cover_image_url: goalData.vision_image_url || null,
            category: goalData.category,
            vision_images: JSON.stringify(goalData.vision_images || []),
            start_date: goalData.start_date || null,
            live_from_end: goalData.live_from_end,
            act_as_if: goalData.act_as_if,
            conviction: goalData.conviction,
            visualization_minutes: goalData.visualization_minutes,
            daily_affirmation: goalData.daily_affirmation,
            check_in_time: goalData.check_in_time,
            committed_7_days: goalData.committed_7_days,
            reminder_count: goalData.reminder_count,
            reminder_times: JSON.stringify(goalData.reminder_times || []),
          } as any)
          .select()
          .single();
        if (error) throw error;
        goalId = data.id;
        setNewlyCreatedGoalId(goalId);
        setTimeout(() => setNewlyCreatedGoalId(null), 2000);
        toast.success("Reality created!");
      }

      saveGoalExtras(goalId, {
        category: goalData.category,
        vision_image_url: goalData.vision_image_url,
        vision_images: goalData.vision_images,
        start_date: goalData.start_date,
        live_from_end: goalData.live_from_end,
        act_as_if: goalData.act_as_if,
        conviction: goalData.conviction,
        visualization_minutes: goalData.visualization_minutes,
        daily_affirmation: goalData.daily_affirmation,
        check_in_time: goalData.check_in_time,
        committed_7_days: goalData.committed_7_days,
        is_locked: false,
        reminder_count: goalData.reminder_count,
        reminder_times: goalData.reminder_times,
      });

      setShowCreateModal(false);
      setEditingGoal(null);
      fetchData();
    } catch (error) {
      console.error("Error saving goal:", error);
      if (!isOfflineError()) {
        toast.error("Failed to save reality");
      } else {
        toast.info("You're offline — changes will sync when connected");
      }
    } finally {
      setSaving(false);
    }
  };

  

  const handleSelectGoal = (goal: ManifestGoal) => {
    navigate(`/manifest/practice/${goal.id}`);
  };

  const handleEditGoal = (goal: ManifestGoal) => {
    setEditingGoal(goal);
    setShowCreateModal(true);
  };

  const handleDeleteGoal = async () => {
    if (!deletingGoal) return;
    try {
      const { error } = await supabase.from("manifest_goals").delete().eq("id", deletingGoal.id);
      if (error) throw error;

      // Goal deleted, no selected state needed

      toast.success("Reality deleted");
      fetchData();
    } catch (error) {
      console.error("Error deleting goal:", error);
      if (!isOfflineError()) {
        toast.error("Failed to delete");
      } else {
        toast.info("You're offline — deletions require a connection");
      }
    } finally {
      setDeletingGoal(null);
    }
  };

  const handleCompleteGoal = async (goal: ManifestGoal) => {
    try {
      const { error } = await supabase.from("manifest_goals").update({ is_completed: true }).eq("id", goal.id);
      if (error) throw error;

      // Goal completed

      toast.success("🎉 Reality manifested! Congratulations!");
      fetchData();
    } catch (error) {
      console.error("Error completing goal:", error);
      if (!isOfflineError()) {
        toast.error("Failed to complete reality");
      } else {
        toast.info("You're offline — changes will sync when connected");
      }
    }
  };

  const handleReactivateGoal = async (goal: ManifestGoal) => {
    try {
      const { error } = await supabase.from("manifest_goals").update({ is_completed: false }).eq("id", goal.id);
      if (error) throw error;

      toast.success("Reality reactivated!");
      fetchData();
    } catch (error) {
      console.error("Error reactivating goal:", error);
      if (!isOfflineError()) {
        toast.error("Failed to reactivate reality");
      } else {
        toast.info("You're offline — changes will sync when connected");
      }
    }
  };

  const handleCloseModal = (open: boolean) => {
    setShowCreateModal(open);
    if (!open) setEditingGoal(null);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  // Get goals that have practice entries on a specific date
  const getGoalsWithPracticeOnDate = useCallback((date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const goalIdsWithPractice = new Set(
      practices.filter((p) => p.entry_date === dateStr && p.locked).map((p) => p.goal_id)
    );
    return goals.filter((g) => goalIdsWithPractice.has(g.id));
  }, [practices, goals]);

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

  return (
    <>
      {!loadingFinished && (
        <PageLoadingScreen
          module="manifest"
          isDataReady={isDataReady}
          onFinished={() => setLoadingFinished(true)}
        />
      )}
      {/* Energy animation styles */}
      <style>{`
        @keyframes energy-entry {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
            filter: brightness(1.5);
          }
          50% {
            transform: scale(1.02) translateY(-5px);
            filter: brightness(1.2);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: brightness(1);
          }
        }
        @keyframes float-particle {
          0% {
            opacity: 0;
            transform: translateY(0) scale(0);
          }
          20% {
            opacity: 1;
            transform: translateY(-20px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-60px) scale(0.5);
          }
        }
        .animate-energy-entry {
          animation: energy-entry 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
        }
        .animate-float-particle {
          animation: float-particle 1.5s ease-out forwards;
        }
      `}</style>
      <div className="flex flex-col w-full flex-1 bg-background min-h-screen overflow-hidden">
        {/* Hero */}
        <PageHero
          storageKey="manifest_hero_src"
          typeKey="manifest_hero_type"
          badge={PAGE_HERO_TEXT.manifest.badge}
          title={PAGE_HERO_TEXT.manifest.title}
          subtitle={PAGE_HERO_TEXT.manifest.subtitle}
        />

        {/* Content Area - 2-column layout: [Left: Goals+Calendar] [Right: Editorial or Practice] */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-3 w-full max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6 py-2 overflow-hidden min-h-0">
          {/* ========== LEFT COLUMN: Goals List + Toggle Panels ========== */}
          <div className="flex flex-col h-full min-h-0 gap-3">
            {/* Goals Container */}
            <div className="bg-card rounded-2xl shadow-sm border border-border flex flex-col overflow-hidden flex-1 min-h-0">
              {/* Header with Create Button */}
              <div className="p-3 flex items-center justify-between border-b border-border flex-shrink-0">
                <h2 className="text-base font-semibold text-foreground">Your Realities</h2>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-lg h-8 px-2 text-muted-foreground"
                    onClick={() => setShowCalendarPopup(true)}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-lg h-8 px-2 text-muted-foreground"
                    onClick={() => setShowProgressPopup(true)}
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    onClick={() => setShowAnalytics(true)}
                    variant="ghost"
                    size="sm"
                    className="rounded-lg h-8 px-2 text-muted-foreground"
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    size="sm"
                    className="hidden lg:inline-flex rounded-lg h-8 px-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md hover:shadow-lg transition-all text-xs"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> New
                  </Button>
                </div>
              </div>

              {activeGoals.length === 0 ? (
                <div className="p-3 flex-1 flex items-center justify-center">
                  <Card className="rounded-xl border-2 border-dashed border-teal-200 dark:border-teal-800 bg-card w-full">
                    <CardContent className="py-8 px-4 text-center">
                      <div className="mx-auto mb-3 h-10 w-10 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground mb-1">
                        Start Your First Reality
                      </h3>
                      <p className="text-muted-foreground mb-3 text-xs max-w-xs mx-auto">
                        Write a belief in present tense and practice it daily.
                      </p>
                      <Button
                        onClick={() => setShowCreateModal(true)}
                        className="rounded-lg h-9 px-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm"
                      >
                        <Plus className="h-4 w-4 mr-1.5" /> Create Reality
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="overflow-y-auto flex-1 min-h-0 p-2 relative scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                  <div className="space-y-2">
                    {activeGoals.map((goal) => {
                      const { streak, momentum } = getGoalMetrics(goal);
                      const isNewlyCreated = newlyCreatedGoalId === goal.id;
                      return (
                        <div key={goal.id} className={isNewlyCreated ? "animate-energy-entry relative" : "relative"}>
                          <ManifestCard
                            goal={goal}
                            streak={streak}
                            momentum={momentum}
                            practices={practices}
                            isSelected={false}
                            onClick={() => handleSelectGoal(goal)}
                            onEdit={() => handleEditGoal(goal)}
                            onDelete={() => setDeletingGoal(goal)}
                            onComplete={() => handleCompleteGoal(goal)}
                            onImageUpdate={fetchData}
                          />
                          {isNewlyCreated && (
                            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                              <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-teal-500/20 via-cyan-500/20 to-teal-500/20" />
                              {[...Array(8)].map((_, i) => (
                                <div
                                  key={i}
                                  className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 animate-float-particle"
                                  style={{
                                    left: `${10 + i * 12}%`,
                                    animationDelay: `${i * 0.1}s`,
                                    top: "50%",
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Completed Realities Section */}
              {completedGoals.length > 0 && (
                <div className="border-t border-border">
                  <button
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-xs font-medium text-muted-foreground">
                      Manifested Realities ({completedGoals.length})
                    </span>
                    {showCompleted ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {showCompleted && (
                    <div className="p-2 space-y-2 max-h-[300px] overflow-y-auto">
                      {completedGoals.map((goal) => {
                        const { streak, momentum } = getGoalMetrics(goal);
                        return (
                          <ManifestCard
                            key={goal.id}
                            goal={goal}
                            streak={streak}
                            momentum={momentum}
                            practices={practices}
                            isSelected={false}
                            onClick={() => handleSelectGoal(goal)}
                            onDelete={() => setDeletingGoal(goal)}
                            onReactivate={() => handleReactivateGoal(goal)}
                            onImageUpdate={fetchData}
                            isCompleted
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* ========== RIGHT COLUMN: Editorial ========== */}
          <div className="hidden lg:flex flex-col h-full min-h-0 overflow-y-auto">
            <div className="flex flex-col gap-6 py-6 px-5">
              {/* Badge */}
              <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 gap-1.5">
                <Sparkles className="h-3 w-3" />
                Manifestation
              </Badge>

              {/* Title */}
              <div>
                <h1 className="text-3xl font-light text-foreground tracking-tight leading-tight">
                  Manifest Your
                </h1>
                <h1 className="text-3xl font-semibold text-foreground tracking-tight leading-tight">
                  Reality
                </h1>
              </div>

              {/* Description */}
              <p className="text-muted-foreground text-base leading-relaxed max-w-md">
                What you imagine, you create. Visualize daily, act boldly, and trust the process. Small aligned actions compound into extraordinary transformations.
              </p>

              {/* Divider */}
              <div className="h-px bg-border" />

              {/* Motivational quote */}
              <div className="bg-muted/30 rounded-xl p-4 border border-border">
                <p className="text-sm text-muted-foreground italic leading-relaxed">
                  "{getMotivationalQuote()}"
                </p>
              </div>

              {/* Stats summary */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{activeGoals.length} Active {activeGoals.length === 1 ? "Reality" : "Realities"}</p>
                    <p className="text-xs text-muted-foreground">Select one to begin practicing</p>
                  </div>
                </div>

                {aggregateStreak > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <span className="text-sm font-bold text-orange-600">{aggregateStreak}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Day Streak</p>
                      <p className="text-xs text-muted-foreground">Consecutive practice days</p>
                    </div>
                  </div>
                )}

                {avgMomentum > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{avgMomentum}% Momentum</p>
                      <p className="text-xs text-muted-foreground">Average across all realities</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile FAB */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="lg:hidden fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-xl hover:shadow-2xl transition-all flex items-center justify-center active:scale-95"
        >
          <Plus className="h-6 w-6" />
        </button>

        {/* Modal */}
        <ManifestCreateModal
          open={showCreateModal}
          onOpenChange={handleCloseModal}
          onSave={handleSaveGoal}
          saving={saving}
          editingGoal={editingGoal}
        />

        {/* Delete Dialog */}
        <AlertDialog open={!!deletingGoal} onOpenChange={(open) => !open && setDeletingGoal(null)}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Reality</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deletingGoal?.title}"? This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteGoal}
                className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Calendar Popup */}
        <Dialog open={showCalendarPopup} onOpenChange={setShowCalendarPopup}>
          <DialogContent className="rounded-2xl max-w-sm p-0 overflow-hidden">
            <DialogHeader className="p-4 pb-0">
              <DialogTitle>Calendar</DialogTitle>
            </DialogHeader>
            <div className="p-4 pt-2">
              <ManifestSidebarPanel
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                goals={goals}
                practices={practices}
                activeCount={activeGoals.length}
                streak={aggregateStreak}
                avgMomentum={avgMomentum}
                onOpenAnalytics={() => {
                  setShowCalendarPopup(false);
                  setShowAnalytics(true);
                }}
                section="calendar"
              />
              {/* Goals practiced on selected date */}
              {(() => {
                const practicedGoals = getGoalsWithPracticeOnDate(selectedDate);
                if (practicedGoals.length === 0) return null;
                return (
                  <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      Practiced on {fmtDate(selectedDate, "short")}
                    </p>
                    {practicedGoals.map((goal) => (
                      <button
                        key={goal.id}
                        onClick={() => {
                          setShowCalendarPopup(false);
                          navigate(`/manifest/practice/${goal.id}?date=${format(selectedDate, "yyyy-MM-dd")}`);
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className="h-6 w-6 rounded-md bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="h-3 w-3 text-teal-600" />
                        </div>
                        <span className="text-sm text-foreground line-clamp-1">{goal.title}</span>
                        <ChevronDown className="h-3 w-3 text-muted-foreground ml-auto -rotate-90" />
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>

        {/* Progress Popup */}
        <Dialog open={showProgressPopup} onOpenChange={setShowProgressPopup}>
          <DialogContent className="rounded-2xl max-w-sm p-0 overflow-hidden">
            <DialogHeader className="p-4 pb-0">
              <DialogTitle>Progress</DialogTitle>
            </DialogHeader>
            <div className="p-4 pt-2">
              <ManifestSidebarPanel
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                goals={goals}
                practices={practices}
                activeCount={activeGoals.length}
                streak={aggregateStreak}
                avgMomentum={avgMomentum}
                onOpenAnalytics={() => {
                  setShowProgressPopup(false);
                  setShowAnalytics(true);
                }}
                section="progress"
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Analytics Modal */}
        <ManifestAnalyticsModal
          open={showAnalytics}
          onOpenChange={setShowAnalytics}
          goals={goals}
          practices={practices}
        />

        {/* History Drawer */}
        {historyGoal && (
          <HistoryDrawer
            goal={historyGoal}
            isOpen={!!historyGoal}
            onClose={() => setHistoryGoal(null)}
            onUseAsMicroAction={() => {}}
          />
        )}
      </div>
    </>
  );
}
