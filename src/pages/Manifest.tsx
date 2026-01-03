import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Sparkles, Pause, Play } from "lucide-react";
import { subDays, parseISO, isSameDay, differenceInDays } from "date-fns";

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

function isVideoUrl(url?: string) {
  if (!url) return false;
  if (url.startsWith("data:video")) return true;
  return /\.(mp4|webm|ogg)(\?|#|$)/i.test(url);
}

function ManifestHero({ mediaUrl, title, subtitle }: { mediaUrl?: string | null; title: string; subtitle: string }) {
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const bgRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const isVideo = useMemo(() => isVideoUrl(mediaUrl || undefined), [mediaUrl]);

  // Respect reduced motion preferences
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();

    // Safari fallback compatibility
    if (mq.addEventListener) mq.addEventListener("change", apply);
    else mq.addListener(apply);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", apply);
      else mq.removeListener(apply);
    };
  }, []);

  // Auto-scroll effect for image background (no rerenders, direct style update)
  useEffect(() => {
    if (!mediaUrl || isVideo || paused || reduceMotion) return;
    if (!bgRef.current) return;

    let raf = 0;
    let y = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = now - last;
      last = now;

      // Slow luxury drift
      y = (y + dt * 0.012) % 2400;
      if (bgRef.current) {
        bgRef.current.style.backgroundPosition = `center ${-y}px`;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mediaUrl, isVideo, paused, reduceMotion]);

  // Play/pause video if used
  useEffect(() => {
    if (!isVideo || !videoRef.current) return;
    const v = videoRef.current;

    const sync = async () => {
      try {
        if (paused || reduceMotion) {
          v.pause();
        } else {
          // Most browsers allow autoplay only if muted; we keep it muted.
          await v.play();
        }
      } catch {
        // Ignore autoplay rejections
      }
    };

    void sync();
  }, [paused, reduceMotion, isVideo]);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
      {/* Media */}
      <div className="relative h-[220px] sm:h-[260px]">
        {mediaUrl ? (
          isVideo ? (
            <video
              ref={videoRef}
              src={mediaUrl}
              muted
              playsInline
              loop
              autoPlay={!paused && !reduceMotion}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div
              ref={bgRef}
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${mediaUrl})`,
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                transform: "scale(1.04)",
              }}
            />
          )
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-muted/30 to-muted/10" />
        )}

        {/* Soft overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/35 to-background/10" />
        <div className="absolute inset-0 ring-1 ring-inset ring-border/30" />

        {/* Pause button (tiny + hidden) */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setPaused((p) => !p)}
          className="absolute right-3 top-3 h-8 w-8 rounded-full bg-background/30 backdrop-blur-md opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
          aria-label={paused ? "Play hero media" : "Pause hero media"}
          title={paused ? "Play" : "Pause"}
        >
          {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </Button>

        {/* Copy */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/30 px-3 py-1 text-xs text-muted-foreground backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/80" />
              Manifest
            </div>
            <h2 className="mt-3 text-xl sm:text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </div>
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

  // Hero media priority: selected goal > first goal with vision image > none
  const heroMediaUrl = useMemo(() => {
    if (selectedGoal?.vision_image_url) return selectedGoal.vision_image_url;
    const withVision = activeGoals.find((g) => !!g.vision_image_url);
    return withVision?.vision_image_url || null;
  }, [selectedGoal, activeGoals]);

  const heroTitle = selectedGoal ? "Focused practice, softly." : "Your vision board, refined.";
  const heroSubtitle = selectedGoal
    ? "Stay with one manifestation — track proof, momentum, and lock your day."
    : "Create a manifestation, practice daily, and build evidence without rushing.";

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
      <div className="overflow-y-auto space-y-6 pb-6">
        <ManifestHero mediaUrl={heroMediaUrl} title={heroTitle} subtitle={heroSubtitle} />

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
