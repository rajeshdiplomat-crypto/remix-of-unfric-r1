import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { subDays, parseISO, isSameDay, differenceInDays } from "date-fns";

import { ManifestTopBar } from "@/components/manifest/ManifestTopBar";
import { ManifestCard } from "@/components/manifest/ManifestCard";
import { ManifestCreateModal } from "@/components/manifest/ManifestCreateModal";
import { ManifestPracticePanel } from "@/components/manifest/ManifestPracticePanel";
import { PageHeroMedia, HERO_TEXT } from "@/components/common/PageHeroMedia";

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

      void activeDays;
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
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 h-[calc(100vh-4rem)]">
      {/* LEFT: Board */}
      <div className="overflow-y-auto space-y-6 pb-6 pr-1">
        {/* Hero Media Block */}
        <PageHeroMedia
          storageKey="manifest_page_hero_media"
          typeKey="manifest_page_hero_media_type"
          badge={HERO_TEXT.manifest.badge}
          title={HERO_TEXT.manifest.title}
          subtitle={HERO_TEXT.manifest.subtitle}
        />

        <ManifestTopBar
          activeCount={activeGoals.length}
          streak={aggregateStreak}
          avgMomentum={avgMomentum}
          onNewManifest={() => setShowCreateModal(true)}
        />

        {/* Goals List */}
        {activeGoals.length === 0 ? (
          <div className="text-center py-14 px-4 rounded-2xl border border-border/50 bg-card shadow-sm">
            <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-muted/40 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Start your manifestation journey</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Write it present-tense. Practice it daily. Celebrate progress.
            </p>
            <Button onClick={() => setShowCreateModal(true)} className="rounded-full px-5">
              Create your first
            </Button>
          </div>
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
                  lastProof={lastProof}
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

      {/* RIGHT: Practice Panel */}
      <aside
        className="hidden lg:flex flex-col h-full overflow-y-auto rounded-2xl border border-border/50 bg-card shadow-sm"
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
          <div className="p-6 flex items-center justify-center h-full">
            <div className="text-center max-w-xs">
              <div className="mx-auto mb-3 h-10 w-10 rounded-2xl bg-muted/40 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Select a manifestation to begin practice</p>
            </div>
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Manifestation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingGoal?.title}&quot;? This action cannot be undone and all
              practice history for this goal will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGoal}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
