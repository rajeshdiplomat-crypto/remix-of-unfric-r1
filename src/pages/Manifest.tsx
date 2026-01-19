import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Sparkles, Plus } from "lucide-react";
import { PageLoadingScreen } from "@/components/common/PageLoadingScreen";
import { PageHero, PAGE_HERO_TEXT } from "@/components/common/PageHero";
import { subDays, parseISO, isSameDay, format } from "date-fns";

import { ManifestCard } from "@/components/manifest/ManifestCard";
import { ManifestCreateModal } from "@/components/manifest/ManifestCreateModal";
import { ManifestPracticePanel } from "@/components/manifest/ManifestPracticePanel";
import { ManifestSidebarPanel } from "@/components/manifest/ManifestSidebarPanel";

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
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [newlyCreatedGoalId, setNewlyCreatedGoalId] = useState<string | null>(null);

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

  // Handlers
  const handleSaveGoal = async (goalData: any) => {
    if (!user) return;
    setSaving(true);

    try {
      let goalId: string;

      if (editingGoal) {
        const { error } = await supabase
          .from("manifest_goals")
          .update({ title: goalData.title })
          .eq("id", editingGoal.id);
        if (error) throw error;
        goalId = editingGoal.id;
        toast.success("Vision updated!");
      } else {
        const { data, error } = await supabase
          .from("manifest_goals")
          .insert({ user_id: user.id, title: goalData.title, is_completed: false })
          .select()
          .single();
        if (error) throw error;
        goalId = data.id;
        // Trigger energy animation for new vision
        setNewlyCreatedGoalId(goalId);
        setTimeout(() => setNewlyCreatedGoalId(null), 2000);
        toast.success("Vision created!");
      }

      saveGoalExtras(goalId, {
        category: goalData.category,
        vision_image_url: goalData.vision_image_url,
        start_date: goalData.start_date,
        live_from_end: goalData.live_from_end,
        act_as_if: goalData.act_as_if,
        conviction: goalData.conviction,
        visualization_minutes: goalData.visualization_minutes,
        daily_affirmation: goalData.daily_affirmation,
        check_in_time: goalData.check_in_time,
        committed_7_days: goalData.committed_7_days,
        is_locked: false,
      });

      setShowCreateModal(false);
      setEditingGoal(null);
      fetchData();
    } catch (error) {
      console.error("Error saving goal:", error);
      toast.error("Failed to save vision");
    } finally {
      setSaving(false);
    }
  };

  const handlePracticeComplete = useCallback(() => fetchData(), [fetchData]);
  const handleSelectGoal = (goal: ManifestGoal) => setSelectedGoal(goal);
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

      toast.success("Vision deleted");
      fetchData();
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast.error("Failed to delete");
    } finally {
      setDeletingGoal(null);
    }
  };

  const handleCloseModal = (open: boolean) => {
    setShowCreateModal(open);
    if (!open) setEditingGoal(null);
  };

  // Dynamic greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "";
    const firstName = userName.split(" ")[0];
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : hour < 21 ? "Good evening" : "Good night";
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
      <div className="flex flex-col w-full flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen overflow-hidden">
        {/* Hero */}
        <PageHero
          storageKey="manifest_hero_src"
          typeKey="manifest_hero_type"
          badge={PAGE_HERO_TEXT.manifest.badge}
          title={PAGE_HERO_TEXT.manifest.title}
          subtitle={PAGE_HERO_TEXT.manifest.subtitle}
        />

      {/* Content Area - Journal-style 3-column layout */}
      <div
        className={cn(
          "flex-1 grid gap-6 w-full px-4 sm:px-6 py-4 transition-all duration-300",
          leftPanelCollapsed
            ? "grid-cols-1 lg:grid-cols-[64px_1fr_280px]"
            : "grid-cols-1 lg:grid-cols-[280px_1fr_280px]"
        )}
      >
        {/* Left Panel - Calendar & Recent */}
        <div
          className={cn("hidden lg:flex flex-col transition-all duration-300 h-full", leftPanelCollapsed && "w-16")}
        >
          <ManifestSidebarPanel
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            goals={goals}
            practices={practices}
            isCollapsed={leftPanelCollapsed}
            onToggleCollapse={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
            activeCount={activeGoals.length}
            streak={aggregateStreak}
            avgMomentum={avgMomentum}
          />
        </div>

        {/* Center - Main Content */}
        <div className="flex flex-col min-w-0 min-h-0">
          {/* Greeting Section with Create Button */}
          <div className="mb-4 px-1 flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white">{getGreeting()}</h2>
              <p className="text-sm text-slate-500 mt-1">{getMotivationalQuote()}</p>
              <p className="text-xs text-teal-500 mt-2">{getStreakMessage()}</p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="rounded-xl h-10 px-5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md hover:shadow-lg transition-all flex-shrink-0"
            >
              <Plus className="h-4 w-4 mr-2" /> Create New Vision
            </Button>
          </div>

          {/* Goals Container - Fixed height, only entries scroll */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 flex flex-col overflow-hidden" style={{ maxHeight: "calc(100vh - 380px)" }}>
            {activeGoals.length === 0 ? (
              <div className="p-4">
                <Card className="rounded-2xl border-2 border-dashed border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900">
                  <CardContent className="py-16 px-8 text-center">
                    <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Start Your First Vision</h3>
                    <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                      Write a belief in present tense and practice it daily until it becomes your reality.
                    </p>
                    <Button
                      onClick={() => setShowCreateModal(true)}
                      className="rounded-xl h-11 px-6 bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Create Vision
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="overflow-y-auto p-4 flex-1">
                <div className="space-y-4">
                  {activeGoals.map((goal) => {
                    const { streak, momentum, lastProof } = getGoalMetrics(goal);
                    const isNewlyCreated = newlyCreatedGoalId === goal.id;
                    return (
                      <div
                        key={goal.id}
                        className={isNewlyCreated ? "animate-energy-entry" : ""}
                      >
                        <ManifestCard
                          goal={goal}
                          streak={streak}
                          momentum={momentum}
                          isSelected={selectedGoal?.id === goal.id}
                          onClick={() => handleSelectGoal(goal)}
                          onEdit={() => handleEditGoal(goal)}
                          onDelete={() => setDeletingGoal(goal)}
                        />
                        {/* Energy particles effect for new vision */}
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
          </div>
        </div>

        {/* Right Panel - Only Practice Panel */}
        <div className="hidden lg:block h-full">
          {selectedGoal ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 h-full overflow-hidden">
              <ManifestPracticePanel
                goal={selectedGoal}
                streak={getGoalMetrics(selectedGoal).streak}
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 h-full p-6">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-teal-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-0.5">Select a Vision</h3>
                  <p className="text-xs text-slate-400">Choose a vision to start your practice</p>
                </div>
              </div>
            </div>
          )}
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
            <AlertDialogTitle>Delete Vision</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingGoal?.title}"? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGoal} className="bg-red-500 hover:bg-red-600 text-white rounded-xl">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </>
  );
}
