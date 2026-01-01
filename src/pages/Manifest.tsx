import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Sparkles, Target, Heart, DollarSign, Briefcase, TrendingUp, Repeat } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, isSameDay, parseISO } from "date-fns";
import { ManifestSummaryStrip } from "@/components/manifest/ManifestSummaryStrip";
import { ManifestGoalCardCompact } from "@/components/manifest/ManifestGoalCardCompact";
import { ManifestCreateWizard } from "@/components/manifest/ManifestCreateWizard";
import { ManifestCheckInModal } from "@/components/manifest/ManifestCheckInModal";
import { ManifestRightPanel } from "@/components/manifest/ManifestRightPanel";
import { CATEGORIES, type ManifestGoal, type ManifestCheckIn } from "@/components/manifest/types";

const CATEGORY_ICONS: Record<string, typeof Target> = {
  all: Target,
  wealth: DollarSign,
  health: Heart,
  career: Briefcase,
  growth: TrendingUp,
  habits: Repeat,
};

// Local storage helpers
function saveGoalExtras(goalId: string, data: Partial<ManifestGoal>) {
  const stored = JSON.parse(localStorage.getItem("manifest_goal_extras") || "{}");
  stored[goalId] = { ...stored[goalId], ...data };
  localStorage.setItem("manifest_goal_extras", JSON.stringify(stored));
}

function loadGoalExtras(goalId: string): Partial<ManifestGoal> {
  const stored = JSON.parse(localStorage.getItem("manifest_goal_extras") || "{}");
  return stored[goalId] || {};
}

function loadAllGoalExtras(): Record<string, Partial<ManifestGoal>> {
  return JSON.parse(localStorage.getItem("manifest_goal_extras") || "{}");
}

export default function Manifest() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [goals, setGoals] = useState<ManifestGoal[]>([]);
  const [checkIns, setCheckIns] = useState<ManifestCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [createOpen, setCreateOpen] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<ManifestGoal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<ManifestGoal | null>(null);
  
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  useEffect(() => {
    if (goals.length > 0 && !selectedGoal) {
      setSelectedGoal(goals.find(g => !g.is_completed) || goals[0]);
    }
  }, [goals]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const [goalsResult, journalResult] = await Promise.all([
      supabase
        .from("manifest_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("manifest_journal")
        .select("*")
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false }),
    ]);

    if (!goalsResult.error && goalsResult.data) {
      const extras = loadAllGoalExtras();
      const mergedGoals = goalsResult.data.map(g => ({
        ...g,
        ...extras[g.id],
      })) as ManifestGoal[];
      setGoals(mergedGoals);
    }
    
    if (!journalResult.error && journalResult.data) {
      // Transform journal entries to check-ins format
      const transformedCheckIns: ManifestCheckIn[] = journalResult.data.map(entry => ({
        id: entry.id,
        goal_id: entry.goal_id,
        user_id: entry.user_id,
        entry_date: entry.entry_date,
        created_at: entry.created_at,
        alignment: 7, // Default
        acted_today: 'yes' as const,
        proofs: entry.gratitude ? [entry.gratitude] : [],
        gratitude: entry.visualization || undefined,
      }));
      setCheckIns(transformedCheckIns);
    }
    
    setLoading(false);
  };

  // Calculate stats
  const activeGoals = goals.filter(g => !g.is_completed);
  const manifestedGoals = goals.filter(g => g.is_completed);
  
  const dayStreak = (() => {
    if (checkIns.length === 0) return 0;
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const checkDate = subDays(new Date(), i);
      const hasCheckIn = checkIns.some(c => isSameDay(parseISO(c.entry_date), checkDate));
      if (hasCheckIn) streak++;
      else if (i > 0) break;
    }
    return streak;
  })();
  
  const momentumScore = (() => {
    const recentCheckIns = checkIns.filter(c => {
      const daysDiff = Math.floor((Date.now() - parseISO(c.entry_date).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff < 7;
    });
    if (recentCheckIns.length === 0) return 0;
    const avgAlignment = recentCheckIns.reduce((acc, c) => acc + c.alignment, 0) / recentCheckIns.length;
    const actedDays = recentCheckIns.filter(c => c.acted_today === 'yes' || c.acted_today === 'mostly').length;
    const proofCount = recentCheckIns.reduce((acc, c) => acc + (c.proofs?.length || 0), 0);
    return Math.round((avgAlignment * 4 + (actedDays / 7) * 30 + Math.min(proofCount * 5, 30)));
  })();

  // Filter goals
  const filteredGoals = goals.filter(goal => {
    const matchesFilter = activeFilter === "all" || goal.category === activeFilter;
    const matchesSearch = !searchQuery || goal.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleSaveGoal = async (data: Partial<ManifestGoal>) => {
    if (!user) return;
    setSaving(true);

    if (editGoal) {
      const { error } = await supabase
        .from("manifest_goals")
        .update({
          title: data.title,
          description: data.live_from_end || null,
          feeling_when_achieved: data.daily_affirmation || null,
          affirmations: data.affirmations || [],
        })
        .eq("id", editGoal.id);

      if (error) {
        toast({ title: "Error", description: "Failed to update", variant: "destructive" });
      } else {
        saveGoalExtras(editGoal.id, data);
        toast({ title: "Updated!", description: "Your manifestation has been updated" });
        setCreateOpen(false);
        setEditGoal(null);
        fetchData();
      }
    } else {
      const { data: newGoal, error } = await supabase.from("manifest_goals").insert({
        user_id: user.id,
        title: data.title,
        description: data.live_from_end || null,
        feeling_when_achieved: data.daily_affirmation || null,
        affirmations: data.affirmations || [],
      }).select().single();

      if (error) {
        toast({ title: "Error", description: "Failed to create", variant: "destructive" });
      } else if (newGoal) {
        saveGoalExtras(newGoal.id, data);
        toast({ title: "Created!", description: "Your manifestation is ready" });
        setCreateOpen(false);
        fetchData();
        
        const fullGoal = { ...newGoal, ...data } as ManifestGoal;
        setSelectedGoal(fullGoal);
      }
    }
    setSaving(false);
  };

  const handleSaveCheckIn = async (checkIn: Partial<ManifestCheckIn>) => {
    if (!user || !checkIn.goal_id) return;
    setSaving(true);

    const { error } = await supabase.from("manifest_journal").insert({
      user_id: user.id,
      goal_id: checkIn.goal_id,
      entry_date: checkIn.entry_date,
      gratitude: checkIn.proofs?.join("; ") || null,
      visualization: checkIn.gratitude || null,
    });

    if (error) {
      toast({ title: "Error", description: "Failed to save check-in", variant: "destructive" });
    } else {
      toast({ title: "Locked in!", description: "Today's check-in saved" });
      setCheckInOpen(false);
      fetchData();
    }
    setSaving(false);
  };

  const handleQuickAction = async (action: string) => {
    if (!user || !selectedGoal) return;
    
    await supabase.from("manifest_journal").insert({
      user_id: user.id,
      goal_id: selectedGoal.id,
      entry_date: format(new Date(), "yyyy-MM-dd"),
      gratitude: action,
    });
    
    toast({ title: "Action logged!", description: action });
    fetchData();
  };

  const handleUpdateWoop = (woop: ManifestGoal['woop']) => {
    if (!selectedGoal) return;
    saveGoalExtras(selectedGoal.id, { woop });
    setGoals(prev => prev.map(g => g.id === selectedGoal.id ? { ...g, woop } : g));
    setSelectedGoal(prev => prev ? { ...prev, woop } : null);
    toast({ title: "WOOP updated" });
  };

  const handleAddIfThen = (trigger: { if_part: string; then_part: string }) => {
    if (!selectedGoal) return;
    const existing = selectedGoal.if_then_triggers || [];
    const updated = [...existing, { id: crypto.randomUUID(), ...trigger }];
    saveGoalExtras(selectedGoal.id, { if_then_triggers: updated });
    setGoals(prev => prev.map(g => g.id === selectedGoal.id ? { ...g, if_then_triggers: updated } : g));
    setSelectedGoal(prev => prev ? { ...prev, if_then_triggers: updated } : null);
    toast({ title: "Trigger added" });
  };

  const handleUpdateMicroStep = (step: string) => {
    if (!selectedGoal) return;
    saveGoalExtras(selectedGoal.id, { micro_step: step });
    setGoals(prev => prev.map(g => g.id === selectedGoal.id ? { ...g, micro_step: step } : g));
    setSelectedGoal(prev => prev ? { ...prev, micro_step: step } : null);
    toast({ title: "Micro-step set" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading manifestations...</div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-100px)] w-full">
      {/* Main Content - Left */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-auto pr-4">
          <div className="space-y-4 pb-8">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-foreground">Manifestation Board</h1>
              <p className="text-sm text-muted-foreground">Assume the feeling of the wish fulfilled</p>
            </div>
            
            {/* Summary Strip */}
            <ManifestSummaryStrip
              activeGoals={activeGoals.length}
              manifestedGoals={manifestedGoals.length}
              dayStreak={dayStreak}
              momentumScore={momentumScore}
              onNewManifest={() => setCreateOpen(true)}
            />
            
            {/* Search & Filters */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search assumptions..."
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Category Filter Pills */}
            <ScrollArea className="w-full">
              <div className="flex items-center gap-2 pb-1">
                {CATEGORIES.map(cat => {
                  const Icon = CATEGORY_ICONS[cat.id] || Target;
                  return (
                    <Button
                      key={cat.id}
                      variant={activeFilter === cat.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveFilter(cat.id)}
                      className="rounded-full gap-1.5 shrink-0"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {cat.label}
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
            
            {/* Goals List */}
            <div className="space-y-3">
              {filteredGoals.length === 0 ? (
                <div className="text-center py-16">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {searchQuery ? "No matches found" : "Begin Your Journey"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                    {searchQuery 
                      ? "Try different keywords" 
                      : "Create your first manifestation and start living from the end."
                    }
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => setCreateOpen(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      New Manifestation
                    </Button>
                  )}
                </div>
              ) : (
                filteredGoals.map(goal => (
                  <ManifestGoalCardCompact
                    key={goal.id}
                    goal={goal}
                    checkIns={checkIns.filter(c => c.goal_id === goal.id)}
                    isSelected={selectedGoal?.id === goal.id}
                    onClick={() => setSelectedGoal(goal)}
                    onVisualize={() => {
                      setSelectedGoal(goal);
                      toast({ title: `Visualize: ${goal.visualization_length || 3} minutes` });
                    }}
                    onActAsIf={() => {
                      setSelectedGoal(goal);
                      if (goal.act_as_if) {
                        toast({ title: "Today's Act-as-If", description: goal.act_as_if });
                      }
                    }}
                    onLogProof={() => {
                      setSelectedGoal(goal);
                      setCheckInOpen(true);
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Panel */}
      <ManifestRightPanel
        selectedGoal={selectedGoal}
        checkIns={checkIns}
        onCheckIn={() => setCheckInOpen(true)}
        onQuickAction={handleQuickAction}
        onUpdateWoop={handleUpdateWoop}
        onAddIfThen={handleAddIfThen}
        onUpdateMicroStep={handleUpdateMicroStep}
      />
      
      {/* Create Wizard */}
      <ManifestCreateWizard
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSave={handleSaveGoal}
        onOpenCheckIn={() => setCheckInOpen(true)}
        editGoal={editGoal}
        saving={saving}
      />
      
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
