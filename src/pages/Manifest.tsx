import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Sparkles, Eye, Zap, Camera, CheckCircle2, Plus, ArrowRight } from "lucide-react";
import { PageLoadingScreen } from "@/components/common/PageLoadingScreen";
import { subDays, parseISO, isSameDay, differenceInDays, format } from "date-fns";

import { ManifestTopBar } from "@/components/manifest/ManifestTopBar";
import { ManifestCard } from "@/components/manifest/ManifestCard";
import { ManifestCreateModal } from "@/components/manifest/ManifestCreateModal";
import { ManifestPracticePanel } from "@/components/manifest/ManifestPracticePanel";

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

import {
  type ManifestGoal,
  type ManifestProof,
  type ManifestDailyPractice,
  GOAL_EXTRAS_KEY,
  DAILY_PRACTICE_KEY,
} from "@/components/manifest/types";

// Local storage helpers
function saveGoalExtras(goalId: string, extras: Partial<ManifestGoal>) {
  const all = JSON.parse(localStorage.getItem(GOAL_EXTRAS_KEY) || "{}");
  all[goalId] = { ...all[goalId], ...extras };
  localStorage.setItem(GOAL_EXTRAS_KEY, JSON.stringify(all));
}

function loadAllGoalExtras(): Record<string, Partial<ManifestGoal>> {
  return JSON.parse(localStorage.getItem(GOAL_EXTRAS_KEY) || "{}");
}

function loadAllPractices(): Record<string, ManifestDailyPractice> {
  return JSON.parse(localStorage.getItem(DAILY_PRACTICE_KEY) || "{}");
}

// Journey Step Component
function JourneyStep({
  step,
  label,
  icon: Icon,
  isActive,
  isComplete,
}: {
  step: number;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  isComplete: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-5 py-3 rounded-full transition-all ${
        isActive
          ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30"
          : isComplete
            ? "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300"
            : "bg-slate-100 dark:bg-slate-800 text-slate-500"
      }`}
    >
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
          isActive ? "bg-white/20" : isComplete ? "bg-teal-500 text-white" : "bg-slate-200 dark:bg-slate-700"
        }`}
      >
        {isComplete ? <CheckCircle2 className="h-4 w-4" /> : step}
      </div>
      <Icon className="h-4 w-4" />
      <span className="text-sm font-medium hidden sm:inline">{label}</span>
    </div>
  );
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
        vision_image_url: extras[g.id]?.vision_image_url,
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

  // Calculate metrics for each goal
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

      const activeDays = Math.max(1, differenceInDays(today, parseISO(goal.created_at)));

      const last7Practices = goalPractices.filter((p) => {
        const entryDate = parseISO(p.entry_date);
        return entryDate >= subDays(today, 7);
      });

      const convictionAvg = goal.conviction * 10;
      const actConsistency = (last7Practices.filter((p) => (p.act_count || 0) > 0).length / 7) * 100;

      const proofRate = Math.min((last7Practices.filter((p) => (p.proofs?.length || 0) > 0).length / 7) * 100, 100);

      const momentum = Math.round(convictionAvg * 0.4 + actConsistency * 0.3 + proofRate * 0.3);

      const goalProofs = proofs.filter((p) => p.goal_id === goal.id);
      const lastProof = goalProofs[0];

      // Check today's practice
      const todayStr = format(today, "yyyy-MM-dd");
      const todayPractice = goalPractices.find((p) => p.entry_date === todayStr);

      void activeDays;
      return { streak, momentum, lastProof, todayPractice };
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
  const handleSaveGoal = async (goalData: {
    title: string;
    category: string;
    vision_image_url?: string;
    start_date?: string;
    live_from_end?: string;
    act_as_if: string;
    conviction: number;
    visualization_minutes: 3 | 5 | 10;
    daily_affirmation: string;
    check_in_time: string;
    committed_7_days: boolean;
  }) => {
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
        toast.success("Manifestation updated!");
      } else {
        const { data, error } = await supabase
          .from("manifest_goals")
          .insert({
            user_id: user.id,
            title: goalData.title,
            is_completed: false,
          })
          .select()
          .single();

        if (error) throw error;
        goalId = data.id;
        toast.success("Manifestation created!");
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
      toast.error(editingGoal ? "Failed to update manifestation" : "Failed to create manifestation");
    } finally {
      setSaving(false);
    }
  };

  const handlePracticeComplete = useCallback(
    (practice: ManifestDailyPractice) => {
      void practice;
      fetchData();
    },
    [fetchData],
  );

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

      if (selectedGoal?.id === deletingGoal.id) {
        setSelectedGoal(null);
      }

      toast.success("Manifestation deleted");
      fetchData();
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast.error("Failed to delete manifestation");
    } finally {
      setDeletingGoal(null);
    }
  };

  const handleCloseModal = (open: boolean) => {
    setShowCreateModal(open);
    if (!open) setEditingGoal(null);
  };

  if (loading) {
    return <PageLoadingScreen module="manifest" />;
  }

  return (
    <div className="flex flex-col w-full flex-1 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 min-h-screen">
      {/* Header Section */}
      <div className="px-6 lg:px-8 pt-8 pb-6">
        {/* Title */}
        <div className="mb-6">
          <span className="text-xs font-semibold uppercase tracking-widest text-teal-600 dark:text-teal-400">
            Daily Practice
          </span>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">MANIFEST</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Create a vision, practice daily, and build evidence</p>
        </div>

        {/* Journey Flow - Shows the 4-step process */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
          <JourneyStep
            step={1}
            label="Set Vision"
            icon={Eye}
            isActive={activeGoals.length === 0}
            isComplete={activeGoals.length > 0}
          />
          <ArrowRight className="h-4 w-4 text-slate-300 dark:text-slate-600 shrink-0" />
          <JourneyStep
            step={2}
            label="Daily Actions"
            icon={Zap}
            isActive={activeGoals.length > 0 && !selectedGoal}
            isComplete={false}
          />
          <ArrowRight className="h-4 w-4 text-slate-300 dark:text-slate-600 shrink-0" />
          <JourneyStep step={3} label="Visualize" icon={Sparkles} isActive={!!selectedGoal} isComplete={false} />
          <ArrowRight className="h-4 w-4 text-slate-300 dark:text-slate-600 shrink-0" />
          <JourneyStep step={4} label="Build Evidence" icon={Camera} isActive={false} isComplete={false} />
        </div>

        {/* Stats Bar */}
        <ManifestTopBar
          activeCount={activeGoals.length}
          streak={aggregateStreak}
          avgMomentum={avgMomentum}
          onNewManifest={() => setShowCreateModal(true)}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 px-6 lg:px-8 pb-8 flex-1">
        {/* LEFT: Goals Board */}
        <div className="overflow-y-auto space-y-4 pr-1">
          {activeGoals.length === 0 ? (
            <Card className="rounded-2xl border-2 border-dashed border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20">
              <CardContent className="py-16 px-8 text-center">
                <div className="mx-auto mb-6 h-20 w-20 rounded-3xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">
                  Start Your Manifestation Journey
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
                  Write your belief in present tense. Practice it daily. Watch it become your reality.
                </p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  size="lg"
                  className="rounded-full px-8 h-14 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white text-lg shadow-lg shadow-teal-500/30"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Vision
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {activeGoals.map((goal) => {
                const { streak, momentum, lastProof } = getGoalMetrics(goal);
                return (
                  <ManifestCard
                    key={goal.id}
                    goal={goal}
                    streak={streak}
                    momentum={momentum}
                    lastProof={lastProof}
                    isSelected={selectedGoal?.id === goal.id}
                    onClick={() => handleSelectGoal(goal)}
                    onEdit={() => handleEditGoal(goal)}
                    onDelete={() => setDeletingGoal(goal)}
                  />
                );
              })}
            </>
          )}
        </div>

        {/* RIGHT: Practice Panel */}
        <aside
          className="hidden lg:flex flex-col h-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl"
          tabIndex={-1}
          aria-label="Practice panel"
        >
          {selectedGoal ? (
            <ManifestPracticePanel
              goal={selectedGoal}
              streak={getGoalMetrics(selectedGoal).streak}
              onClose={() => setSelectedGoal(null)}
              onPracticeComplete={handlePracticeComplete}
            />
          ) : (
            <div className="p-8 flex flex-col items-center justify-center h-full text-center">
              <div className="mx-auto mb-6 h-20 w-20 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Select a Manifestation</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                Click on any goal from the left to begin your daily practice
              </p>
            </div>
          )}
        </aside>

        {/* Create/Edit Modal */}
        <ManifestCreateModal
          open={showCreateModal}
          onOpenChange={handleCloseModal}
          onSave={handleSaveGoal}
          saving={saving}
          editingGoal={editingGoal}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingGoal} onOpenChange={(open) => !open && setDeletingGoal(null)}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Manifestation</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{deletingGoal?.title}&quot;? This action cannot be undone and all
                practice history for this goal will be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteGoal}
                className="bg-red-500 hover:bg-red-600 text-white rounded-full"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
