import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Sparkles, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { PageLoadingScreen } from "@/components/common/PageLoadingScreen";
import { PageHero, PAGE_HERO_TEXT } from "@/components/common/PageHero";
import { subDays, parseISO, isSameDay, format } from "date-fns";

import { ManifestCard } from "@/components/manifest/ManifestCard";
import { ManifestCreateModal } from "@/components/manifest/ManifestCreateModal";
import { ManifestPracticePanel } from "@/components/manifest/ManifestPracticePanel";
import { ManifestSidebarPanel } from "@/components/manifest/ManifestSidebarPanel";
import { ManifestAnalyticsModal } from "@/components/manifest/ManifestAnalyticsModal";
import { HistoryDrawer } from "@/components/manifest/HistoryDrawer";

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
import { cn } from "@/lib/utils";

import {
  type ManifestGoal,
  type ManifestProof,
  type ManifestDailyPractice,
  GOAL_EXTRAS_KEY,
  DAILY_PRACTICE_KEY,
} from "@/components/manifest/types";

// Local storage helpers
function saveGoalExtras(goalId: string, extras: Partial<ManifestGoal>) {
  try {
    const safeExtras = { ...extras };
    if (safeExtras.vision_image_url && safeExtras.vision_image_url.startsWith("data:")) {
      safeExtras.vision_image_url = undefined;
    }
    // Filter out base64 from vision_images array
    if (safeExtras.vision_images) {
      safeExtras.vision_images = safeExtras.vision_images.filter((img) => !img.startsWith("data:"));
    }

    const all = JSON.parse(localStorage.getItem(GOAL_EXTRAS_KEY) || "{}");
    all[goalId] = { ...all[goalId], ...safeExtras };
    localStorage.setItem(GOAL_EXTRAS_KEY, JSON.stringify(all));
  } catch (e) {
    console.warn("Failed to save goal extras:", e);
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      try {
        localStorage.removeItem(GOAL_EXTRAS_KEY);
        const safeExtras = { ...extras };
        if (safeExtras.vision_image_url && safeExtras.vision_image_url.startsWith("data:")) {
          safeExtras.vision_image_url = undefined;
        }
        localStorage.setItem(GOAL_EXTRAS_KEY, JSON.stringify({ [goalId]: safeExtras }));
      } catch (e2) {
        console.error("Failed to save after clearing:", e2);
      }
    }
  }
}

function loadAllGoalExtras(): Record<string, Partial<ManifestGoal>> {
  return JSON.parse(localStorage.getItem(GOAL_EXTRAS_KEY) || "{}");
}

function loadAllPractices(): Record<string, ManifestDailyPractice> {
  return JSON.parse(localStorage.getItem(DAILY_PRACTICE_KEY) || "{}");
}

export default function Manifest() {
  const { user } = useAuth();

  const [goals, setGoals] = useState<ManifestGoal[]>([]);
  const [proofs, setProofs] = useState<ManifestProof[]>([]);
  const [practices, setPractices] = useState<ManifestDailyPractice[]>([]);
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [editingGoal, setEditingGoal] = useState<ManifestGoal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<ManifestGoal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<ManifestGoal | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [newlyCreatedGoalId, setNewlyCreatedGoalId] = useState<string | null>(null);
  const [historyGoal, setHistoryGoal] = useState<ManifestGoal | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

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

      const extras = loadAllGoalExtras();
      const mergedGoals: ManifestGoal[] = (goalsData || []).map((g) => ({
        id: g.id,
        user_id: g.user_id,
        title: g.title,
        category: extras[g.id]?.category || "other",
        vision_image_url: extras[g.id]?.vision_image_url || g.cover_image_url,
        vision_images: extras[g.id]?.vision_images || [],
        cover_image_url: g.cover_image_url,
        start_date: extras[g.id]?.start_date,
        live_from_end: extras[g.id]?.live_from_end,
        act_as_if: extras[g.id]?.act_as_if || "Take one small action",
        conviction: extras[g.id]?.conviction ?? 5,
        visualization_minutes: extras[g.id]?.visualization_minutes || 3,
        daily_affirmation: extras[g.id]?.daily_affirmation || "",
        check_in_time: extras[g.id]?.check_in_time || "08:00",
        committed_7_days: extras[g.id]?.committed_7_days || false,
        is_completed: g.is_completed || false,
        is_locked: extras[g.id]?.is_locked || false,
        created_at: g.created_at,
        updated_at: g.updated_at,
        reminder_count: extras[g.id]?.reminder_count,
        reminder_times: extras[g.id]?.reminder_times,
      }));

      setGoals(mergedGoals);

      const allPractices = loadAllPractices();
      const practicesList = Object.values(allPractices).filter((p) => p.user_id === user.id);
      setPractices(practicesList);

      const extractedProofs: ManifestProof[] = practicesList.flatMap((p) =>
        (p.proofs || []).map((proof) => ({
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
      toast.error("Failed to load manifestations");
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
    const allPractices = loadAllPractices();
    return allPractices[`${goalId}_${yesterday}`] || null;
  }, []);

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
          })
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
          })
          .select()
          .single();
        if (error) throw error;
        goalId = data.id;
        // Trigger energy animation for new reality
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
      toast.error("Failed to save reality");
    } finally {
      setSaving(false);
    }
  };

  const handlePracticeComplete = useCallback(() => fetchData(), [fetchData]);

  const handleSelectGoal = (goal: ManifestGoal) => {
    setSelectedGoal(goal);
    // When selecting a goal, reset to today's date
    setSelectedDate(new Date());
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

      const extras = JSON.parse(localStorage.getItem(GOAL_EXTRAS_KEY) || "{}");
      delete extras[deletingGoal.id];
      localStorage.setItem(GOAL_EXTRAS_KEY, JSON.stringify(extras));

      if (selectedGoal?.id === deletingGoal.id) setSelectedGoal(null);

      toast.success("Reality deleted");
      fetchData();
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast.error("Failed to delete");
    } finally {
      setDeletingGoal(null);
    }
  };

  const handleCompleteGoal = async (goal: ManifestGoal) => {
    try {
      const { error } = await supabase.from("manifest_goals").update({ is_completed: true }).eq("id", goal.id);
      if (error) throw error;

      if (selectedGoal?.id === goal.id) setSelectedGoal(null);

      toast.success("🎉 Reality manifested! Congratulations!");
      fetchData();
    } catch (error) {
      console.error("Error completing goal:", error);
      toast.error("Failed to complete reality");
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
      toast.error("Failed to reactivate reality");
    }
  };

  const handleCloseModal = (open: boolean) => {
    setShowCreateModal(open);
    if (!open) setEditingGoal(null);
  };

  // Handle calendar date selection - sync with center panel
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // If a goal is selected, it will now show practice for the selected date
  };

  // Dynamic greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "";
    const firstName = userName.split(" ")[0];
    const greeting =
      hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : hour < 21 ? "Good evening" : "Good night";
    const emoji = hour < 12 ? "☀️" : hour < 17 ? "🌤️" : hour < 21 ? "🌅" : "🌙";
    return firstName ? `${greeting}, ${firstName} ${emoji}` : `${greeting} ${emoji}`;
  };

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

  const getStreakMessage = () => {
    if (aggregateStreak === 0) {
      return "Start your manifestation practice today — even small steps create big changes.";
    } else if (aggregateStreak === 1) {
      return "You practiced yesterday! Keep the momentum going with today's session.";
    } else if (aggregateStreak < 7) {
      return `You've been manifesting for ${aggregateStreak} days straight. Amazing consistency — keep it up!`;
    } else if (aggregateStreak < 30) {
      return `Incredible! ${aggregateStreak} days of manifestation. Your dedication is inspiring.`;
    } else {
      return `${aggregateStreak} days of aligned action! You've built a powerful manifestation habit.`;
    }
  };

  if (loading) return <PageLoadingScreen module="manifest" />;

  return (
    <>
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

        {/* Content Area - 3-column layout */}
        <div
          className={cn(
            "flex-1 grid gap-6 w-full px-6 lg:px-8 py-6 transition-all duration-300 overflow-hidden",
            rightPanelCollapsed
              ? "grid-cols-1 lg:grid-cols-[22%_1fr_64px]"
              : "grid-cols-1 lg:grid-cols-[22%_1fr_22%]",
          )}
        >
          {/* Left Panel - Entries List */}
          <div className="hidden lg:flex flex-col h-full min-h-0">
            {/* Goals Container */}
            <div className="flex flex-col overflow-hidden flex-1 min-h-0">
              {/* Header with Create Button */}
              <div className="pb-4 flex items-center justify-between flex-shrink-0">
                <h2 className="text-sm font-medium text-muted-foreground tracking-wide">Your Realities</h2>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs text-primary hover:text-primary/80"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> New
                </Button>
              </div>
              {activeGoals.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-8">
                  <div className="text-center space-y-4">
                    <div className="mx-auto h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-1">
                        Start Your First Reality
                      </h3>
                      <p className="text-muted-foreground text-xs max-w-xs mx-auto leading-relaxed">
                        Write a belief in present tense and practice it daily.
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowCreateModal(true)}
                      size="sm"
                      className="h-9 px-5"
                    >
                      <Plus className="h-4 w-4 mr-1.5" /> Create Reality
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="overflow-y-auto flex-1 min-h-0 custom-scrollbar relative"
                  style={{ maxHeight: "calc(5 * 152px + 4 * 20px)" }}
                >
                  <div className="space-y-5">
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
                            isSelected={selectedGoal?.id === goal.id}
                            onClick={() => handleSelectGoal(goal)}
                            onEdit={() => handleEditGoal(goal)}
                            onDelete={() => setDeletingGoal(goal)}
                            onComplete={() => handleCompleteGoal(goal)}
                            onImageUpdate={fetchData}
                          />
                          {/* Energy particles effect for new reality */}
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
                  {/* Fade indicator at bottom */}
                  {activeGoals.length > 5 && (
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                  )}
                </div>
              )}

              {/* Completed Realities Section */}
              {completedGoals.length > 0 && (
                <div className="border-t border-border/50 mt-4 pt-2">
                  <button
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="w-full py-3 flex items-center justify-between hover:opacity-70 transition-opacity"
                  >
                    <span className="text-xs font-normal text-muted-foreground">
                      Manifested Realities ({completedGoals.length})
                    </span>
                    {showCompleted ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                  {showCompleted && (
                    <div className="pt-2 space-y-4 max-h-[300px] overflow-y-auto">
                      {completedGoals.map((goal) => {
                        const { streak, momentum } = getGoalMetrics(goal);
                        return (
                          <ManifestCard
                            key={goal.id}
                            goal={goal}
                            streak={streak}
                            momentum={momentum}
                            practices={practices}
                            isSelected={selectedGoal?.id === goal.id}
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

          {/* Center - Greeting + Practice Panel */}
          <div className="flex flex-col min-w-0 min-h-0 gap-6 h-full overflow-y-auto">
            {/* Greeting Section */}
            <div className="rounded-xl px-6 py-5 bg-muted/40 border border-border/30">
              <h2 className="text-base font-normal text-foreground">{getGreeting()}</h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{getStreakMessage()}</p>
            </div>

            {/* Practice Panel */}
            {selectedGoal ? (
              <div className="flex-1 overflow-hidden rounded-xl border border-border/30">
                <ManifestPracticePanel
                  goal={selectedGoal}
                  streak={getGoalMetrics(selectedGoal).streak}
                  selectedDate={selectedDate}
                  previousPractice={getPreviousDayPractice(selectedGoal.id)}
                  onClose={() => setSelectedGoal(null)}
                  onPracticeComplete={handlePracticeComplete}
                  onGoalUpdate={() => {
                    fetchData();
                    const updatedGoal = goals.find((g) => g.id === selectedGoal.id);
                    if (updatedGoal) setSelectedGoal(updatedGoal);
                  }}
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-16 space-y-6">
                <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center">
                  <Sparkles className="h-7 w-7 text-muted-foreground" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-base font-normal text-foreground">Select a Reality</h3>
                  <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                    Choose a reality from the left panel to start your daily practice
                  </p>
                </div>
                <p className="text-xs text-muted-foreground/60 text-center max-w-md italic">{getMotivationalQuote()}</p>
              </div>
            )}
          </div>

          {/* Right Panel - Progress & Calendar */}
          <div
            className={cn("hidden lg:flex flex-col transition-all duration-300 h-full min-h-0", rightPanelCollapsed && "w-16")}
          >
            <ManifestSidebarPanel
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              goals={goals}
              practices={practices}
              isCollapsed={rightPanelCollapsed}
              onToggleCollapse={() => setRightPanelCollapsed(!rightPanelCollapsed)}
              activeCount={activeGoals.length}
              streak={aggregateStreak}
              avgMomentum={avgMomentum}
              onOpenAnalytics={() => setShowAnalytics(true)}
            />
          </div>
        </div>

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
