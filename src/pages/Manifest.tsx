import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Sparkles, Plus } from "lucide-react";
import { PageLoadingScreen } from "@/components/common/PageLoadingScreen";
import { PageHero, PAGE_HERO_TEXT } from "@/components/common/PageHero";
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

  if (loading) return <PageLoadingScreen module="manifest" />;

  return (
    <div className="flex flex-col w-full flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen">
      {/* Hero */}
      <PageHero
        storageKey="manifest_hero_src"
        typeKey="manifest_hero_type"
        badge={PAGE_HERO_TEXT.manifest.badge}
        title={PAGE_HERO_TEXT.manifest.title}
        subtitle={PAGE_HERO_TEXT.manifest.subtitle}
      />

      {/* Top Bar */}
      <div className="px-6 lg:px-8 py-5">
        <ManifestTopBar
          activeCount={activeGoals.length}
          streak={aggregateStreak}
          avgMomentum={avgMomentum}
          onNewManifest={() => setShowCreateModal(true)}
        />
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_520px] gap-0 flex-1 min-h-0">
        {/* Goals - Left Panel with separate scroll */}
        <div className="overflow-y-auto px-6 lg:px-8 pb-8" style={{ maxHeight: "calc(100vh - 280px)" }}>
          {activeGoals.length === 0 ? (
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
          ) : (
            <div className="space-y-4">
              {activeGoals.map((goal) => {
                const { streak, momentum, lastProof } = getGoalMetrics(goal);
                return (
                  <ManifestCard
                    key={goal.id}
                    goal={goal}
                    streak={streak}
                    momentum={momentum}
                    isSelected={selectedGoal?.id === goal.id}
                    onClick={() => handleSelectGoal(goal)}
                    onEdit={() => handleEditGoal(goal)}
                    onDelete={() => setDeletingGoal(goal)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Practice Panel - Right Panel with separate scroll */}
        <aside className="hidden lg:block border-l border-slate-200 dark:border-slate-700 overflow-y-auto" style={{ maxHeight: "calc(100vh - 280px)" }}>
          <div className="bg-white dark:bg-slate-900 h-full">
            {selectedGoal ? (
              <ManifestPracticePanel
                goal={selectedGoal}
                streak={getGoalMetrics(selectedGoal).streak}
                onClose={() => setSelectedGoal(null)}
                onPracticeComplete={handlePracticeComplete}
              />
            ) : (
              <div className="p-8 flex flex-col items-center justify-center h-full text-center min-h-[400px]">
                <div className="mx-auto mb-4 h-14 w-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">Select a Vision</h3>
                <p className="text-sm text-slate-500">Click on any card to start your daily practice</p>
              </div>
            )}
          </div>
        </aside>
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
  );
}
