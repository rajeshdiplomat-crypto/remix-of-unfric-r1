import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { subDays, parseISO, isSameDay } from "date-fns";

import { ManifestTopBar } from "@/components/manifest/ManifestTopBar";
import { ManifestCard } from "@/components/manifest/ManifestCard";
import { ManifestCreateForm } from "@/components/manifest/ManifestCreateForm";
import { ManifestCheckInModal } from "@/components/manifest/ManifestCheckInModal";
import { ManifestWeeklyPanel } from "@/components/manifest/ManifestWeeklyPanel";
import { type ManifestGoal, type ManifestCheckIn } from "@/components/manifest/types";

// Local storage helpers for extended goal data
const GOAL_EXTRAS_KEY = "manifest_goal_extras";

function saveGoalExtras(goalId: string, extras: Partial<ManifestGoal>) {
  const all = JSON.parse(localStorage.getItem(GOAL_EXTRAS_KEY) || "{}");
  all[goalId] = { ...all[goalId], ...extras };
  localStorage.setItem(GOAL_EXTRAS_KEY, JSON.stringify(all));
}

function loadGoalExtras(goalId: string): Partial<ManifestGoal> {
  const all = JSON.parse(localStorage.getItem(GOAL_EXTRAS_KEY) || "{}");
  return all[goalId] || {};
}

function loadAllGoalExtras(): Record<string, Partial<ManifestGoal>> {
  return JSON.parse(localStorage.getItem(GOAL_EXTRAS_KEY) || "{}");
}

export default function Manifest() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<ManifestGoal[]>([]);
  const [checkIns, setCheckIns] = useState<ManifestCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<ManifestGoal | null>(null);
  const [checkInOpen, setCheckInOpen] = useState(false);

  // Fetch data
  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch goals
      const { data: goalsData, error: goalsError } = await supabase
        .from("manifest_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (goalsError) throw goalsError;

      // Fetch journal entries as check-ins
      const { data: journalData, error: journalError } = await supabase
        .from("manifest_journal")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (journalError) throw journalError;

      // Merge with local extras
      const extras = loadAllGoalExtras();
      const mergedGoals: ManifestGoal[] = (goalsData || []).map((g) => ({
        id: g.id,
        title: g.title,
        conviction: extras[g.id]?.conviction ?? 5,
        live_from_end: extras[g.id]?.live_from_end,
        act_as_if: extras[g.id]?.act_as_if || "Take one small action",
        visualization_minutes: extras[g.id]?.visualization_minutes || 3,
        daily_affirmation: extras[g.id]?.daily_affirmation || "",
        check_in_time: extras[g.id]?.check_in_time || "08:00",
        committed_7_days: extras[g.id]?.committed_7_days || false,
        is_completed: g.is_completed || false,
        created_at: g.created_at,
      }));

      // Transform journal entries to check-ins
      const transformedCheckIns: ManifestCheckIn[] = (journalData || []).map((j) => ({
        id: j.id,
        goal_id: j.goal_id,
        user_id: j.user_id,
        entry_date: j.entry_date,
        created_at: j.created_at,
        alignment: 5,
        acted_today: "yes" as const,
        proofs: j.visualization ? [j.visualization] : [],
        gratitude: j.gratitude || undefined,
      }));

      setGoals(mergedGoals);
      setCheckIns(transformedCheckIns);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load manifestations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Calculate metrics
  const activeGoals = goals.filter((g) => !g.is_completed);

  const dayStreak = useMemo(() => {
    const today = new Date();
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const checkDate = subDays(today, i);
      const hasCheckIn = checkIns.some((c) =>
        isSameDay(parseISO(c.entry_date), checkDate)
      );
      if (hasCheckIn) streak++;
      else if (i > 0) break;
    }
    return streak;
  }, [checkIns]);

  const momentumScore = useMemo(() => {
    const today = new Date();
    const recentCheckIns = checkIns.filter((c) => {
      const entryDate = parseISO(c.entry_date);
      return entryDate >= subDays(today, 7);
    });
    if (!recentCheckIns.length) return 0;
    const avgAlignment =
      recentCheckIns.reduce((sum, c) => sum + c.alignment, 0) / recentCheckIns.length;
    return Math.round((avgAlignment / 10) * 100);
  }, [checkIns]);

  // Handlers
  const handleSaveGoal = async (goalData: {
    title: string;
    conviction: number;
    live_from_end?: string;
    act_as_if: string;
    visualization_minutes: 3 | 5 | 10;
    daily_affirmation: string;
    check_in_time: string;
    committed_7_days: boolean;
  }) => {
    if (!user) return;
    setSaving(true);

    try {
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

      // Save extras to localStorage
      saveGoalExtras(data.id, {
        conviction: goalData.conviction,
        live_from_end: goalData.live_from_end,
        act_as_if: goalData.act_as_if,
        visualization_minutes: goalData.visualization_minutes,
        daily_affirmation: goalData.daily_affirmation,
        check_in_time: goalData.check_in_time,
        committed_7_days: goalData.committed_7_days,
      });

      toast.success("Manifestation created!");
      setShowCreateForm(false);
      fetchData();
    } catch (error) {
      console.error("Error creating goal:", error);
      toast.error("Failed to create manifestation");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCheckIn = async (
    checkIn: Omit<ManifestCheckIn, "id" | "user_id" | "created_at">
  ) => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase.from("manifest_journal").insert({
        user_id: user.id,
        goal_id: checkIn.goal_id,
        entry_date: checkIn.entry_date,
        visualization: checkIn.proofs.join("\n"),
        gratitude: checkIn.gratitude,
      });

      if (error) throw error;

      toast.success("Check-in saved!");
      setCheckInOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving check-in:", error);
      toast.error("Failed to save check-in");
    } finally {
      setSaving(false);
    }
  };

  const handleVisualize = (goal: ManifestGoal) => {
    toast.info(`Starting ${goal.visualization_minutes}-minute visualization...`);
  };

  const handleDoAction = (goal: ManifestGoal) => {
    toast.success(`Nice move — that's practice! Log one proof so your progress stacks.`);
  };

  const handleLogProof = (goal: ManifestGoal) => {
    setSelectedGoal(goal);
    setCheckInOpen(true);
  };

  const handleCelebrate = (proof: string) => {
    toast.success("Celebrated! 🎉");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <ManifestCreateForm
        onSave={handleSaveGoal}
        onCancel={() => setShowCreateForm(false)}
        saving={saving}
      />
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 lg:p-6 w-full">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        <ManifestTopBar
          activeCount={activeGoals.length}
          dayStreak={dayStreak}
          momentumScore={momentumScore}
          onNewManifest={() => setShowCreateForm(true)}
        />

        {/* Goals List */}
        {activeGoals.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Start your manifestation journey
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Write it present-tense. Practice it daily. Celebrate progress.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeGoals.map((goal) => (
              <ManifestCard
                key={goal.id}
                goal={goal}
                checkIns={checkIns.filter((c) => c.goal_id === goal.id)}
                onVisualize={() => handleVisualize(goal)}
                onDoAction={() => handleDoAction(goal)}
                onLogProof={() => handleLogProof(goal)}
                onOpenCheckIn={() => {
                  setSelectedGoal(goal);
                  setCheckInOpen(true);
                }}
                onCelebrate={handleCelebrate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-80 lg:sticky lg:top-4 lg:self-start space-y-4">
        <ManifestWeeklyPanel checkIns={checkIns} />
      </div>

      {/* Check-in Modal */}
      <ManifestCheckInModal
        open={checkInOpen}
        onOpenChange={setCheckInOpen}
        goal={selectedGoal}
        onSave={handleSaveCheckIn}
        saving={saving}
      />
    </div>
  );
}
