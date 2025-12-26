import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, Target, Heart, Sparkles, DollarSign, TrendingUp, Award, 
  Search, SlidersHorizontal, Home, ArrowUpDown, Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, isSameDay, parseISO, startOfWeek, addDays } from "date-fns";
import { ManifestGoalCard } from "@/components/manifest/ManifestGoalCard";
import { ManifestAssistantPanel } from "@/components/manifest/ManifestAssistantPanel";
import { ManifestCreateDialog } from "@/components/manifest/ManifestCreateDialog";
import { ManifestGoalDashboard } from "@/components/manifest/ManifestGoalDashboard";

interface ManifestGoal {
  id: string;
  title: string;
  description: string | null;
  feeling_when_achieved: string | null;
  affirmations: string[];
  is_completed: boolean;
  created_at: string;
  category?: string;
  cover_image?: string;
  target_date?: string;
  visualization_images?: string[];
  milestones?: Array<{ id: string; title: string; completed: boolean }>;
  action_steps?: Array<{ id: string; title: string; completed: boolean; taskId?: string }>;
}

interface ManifestJournalEntry {
  id: string;
  goal_id: string;
  gratitude: string | null;
  visualization: string | null;
  entry_date: string;
  created_at: string;
}

const CATEGORIES = [
  { id: "all", label: "All Goals", icon: Target },
  { id: "wealth", label: "Wealth", icon: DollarSign },
  { id: "health", label: "Health", icon: Heart },
  { id: "love", label: "Love", icon: Home },
  { id: "growth", label: "Growth", icon: Target },
];

const SORT_OPTIONS = [
  { id: "recent", label: "Most Recent" },
  { id: "progress", label: "By Progress" },
  { id: "target", label: "By Target Date" },
  { id: "name", label: "Alphabetical" },
];

export default function Manifest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<ManifestGoal[]>([]);
  const [journalEntries, setJournalEntries] = useState<ManifestJournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<ManifestGoal | null>(null);
  const [dashboardGoal, setDashboardGoal] = useState<ManifestGoal | null>(null);
  const [rightPanelGoal, setRightPanelGoal] = useState<ManifestGoal | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  useEffect(() => {
    if (goals.length > 0 && !rightPanelGoal) {
      setRightPanelGoal(goals.find(g => !g.is_completed) || goals[0]);
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
      setGoals(goalsResult.data);
    }
    if (!journalResult.error && journalResult.data) {
      setJournalEntries(journalResult.data);
    }
    setLoading(false);
  };

  const getGoalProgress = (goalId: string): number => {
    const totalDays = 30;
    const entries = journalEntries.filter(e => e.goal_id === goalId).length;
    return Math.min(Math.round((entries / totalDays) * 100), 100);
  };

  const getVisualizationStreak = (): number => {
    if (journalEntries.length === 0) return 0;
    let streak = 0;
    let currentDate = new Date();
    for (let i = 0; i < 365; i++) {
      const checkDate = subDays(currentDate, i);
      const hasEntry = journalEntries.some(e => isSameDay(parseISO(e.entry_date), checkDate));
      if (hasEntry) streak++;
      else if (i > 0) break;
    }
    return streak;
  };

  const toggleWeeklyCheckIn = async (goalId: string, date: Date) => {
    if (!user) return;
    
    const dateStr = format(date, "yyyy-MM-dd");
    const existingEntry = journalEntries.find(
      e => e.goal_id === goalId && e.entry_date === dateStr
    );

    if (existingEntry) {
      await supabase.from("manifest_journal").delete().eq("id", existingEntry.id);
    } else {
      await supabase.from("manifest_journal").insert({
        user_id: user.id,
        goal_id: goalId,
        entry_date: dateStr,
        gratitude: "Daily check-in",
        visualization: "Completed visualization",
      });
    }
    fetchData();
  };

  const handleSaveGoal = async (data: {
    title: string;
    description: string;
    category: string;
    affirmations: string[];
    feeling: string;
    targetDate: Date | null;
    coverImage: string | null;
    visualizationImages: string[];
  }) => {
    if (!user) return;
    setSaving(true);

    if (editGoal) {
      const { error } = await supabase
        .from("manifest_goals")
        .update({
          title: data.title,
          description: data.description,
          feeling_when_achieved: data.feeling,
          affirmations: data.affirmations,
        })
        .eq("id", editGoal.id);

      if (error) {
        toast({ title: "Error", description: "Failed to update goal", variant: "destructive" });
      } else {
        toast({ title: "Updated!", description: "Your goal has been updated" });
        fetchData();
        setCreateDialogOpen(false);
        setEditGoal(null);
      }
    } else {
      const { data: newGoal, error } = await supabase.from("manifest_goals").insert({
        user_id: user.id,
        title: data.title,
        description: data.description,
        feeling_when_achieved: data.feeling,
        affirmations: data.affirmations,
      }).select().single();

      if (error) {
        toast({ title: "Error", description: "Failed to create goal", variant: "destructive" });
      } else {
        toast({ title: "Created!", description: "Your manifestation goal has been created" });
        fetchData();
        setCreateDialogOpen(false);
        if (newGoal) setRightPanelGoal(newGoal);
      }
    }
    setSaving(false);
  };

  const handleDeleteGoal = async (goalId: string) => {
    await supabase.from("manifest_journal").delete().eq("goal_id", goalId);
    await supabase.from("manifest_goals").delete().eq("id", goalId);
    toast({ title: "Deleted", description: "Goal has been removed" });
    setDashboardGoal(null);
    fetchData();
  };

  const handleMarkAchieved = async (goalId: string) => {
    await supabase.from("manifest_goals").update({ is_completed: true }).eq("id", goalId);
    toast({ title: "Congratulations! 🎉", description: "You've manifested your goal!" });
    fetchData();
  };

  const handleAddJournalEntry = async (goalId: string, entry: { gratitude: string; visualization: string }) => {
    if (!user) return;
    await supabase.from("manifest_journal").insert({
      user_id: user.id,
      goal_id: goalId,
      entry_date: format(new Date(), "yyyy-MM-dd"),
      gratitude: entry.gratitude,
      visualization: entry.visualization,
    });
    toast({ title: "Entry saved", description: "Your reflection has been recorded" });
    fetchData();
  };

  // Filter and sort goals
  const filteredGoals = goals
    .filter(goal => {
      const matchesFilter = activeFilter === "all" || (goal as any).category === activeFilter;
      const matchesSearch = !searchQuery || 
        goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        goal.affirmations?.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "progress":
          return getGoalProgress(b.id) - getGoalProgress(a.id);
        case "target":
          if (!a.target_date) return 1;
          if (!b.target_date) return -1;
          return new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
        case "name":
          return a.title.localeCompare(b.title);
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const activeGoals = goals.filter(g => !g.is_completed);
  const completedGoals = goals.filter(g => g.is_completed);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading your manifestations...</div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-100px)]">
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6 pb-8 px-1">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Manifestation Board
              </h1>
              <p className="text-muted-foreground mt-1">
                Visualize your dreams and watch them become reality
              </p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Goal
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-5 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{activeGoals.length}</p>
                  <p className="text-sm text-muted-foreground">Active Goals</p>
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Award className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{completedGoals.length}</p>
                  <p className="text-sm text-muted-foreground">Manifested</p>
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-gradient-to-br from-orange-500/5 to-orange-500/10 border-orange-500/20">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{getVisualizationStreak()}</p>
                  <p className="text-sm text-muted-foreground">Day Streak</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search goals..."
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(option => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter Pills */}
          <ScrollArea className="w-full">
            <div className="flex items-center gap-2 pb-1">
              {CATEGORIES.map(cat => (
                <Button
                  key={cat.id}
                  variant={activeFilter === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveFilter(cat.id)}
                  className="rounded-full gap-2 shrink-0"
                >
                  <cat.icon className="h-4 w-4" />
                  {cat.label}
                </Button>
              ))}
            </div>
          </ScrollArea>

          {/* Goals List */}
          <div className="space-y-4">
            {filteredGoals.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {searchQuery ? "No goals found" : "Start Your Manifestation Journey"}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {searchQuery 
                    ? "Try adjusting your search or filters"
                    : "Create your first manifestation goal and begin visualizing your dreams into reality."
                  }
                </p>
                {!searchQuery && (
                  <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Your First Goal
                  </Button>
                )}
              </Card>
            ) : (
              filteredGoals.map(goal => (
                <ManifestGoalCard
                  key={goal.id}
                  goal={goal}
                  progress={getGoalProgress(goal.id)}
                  isSelected={rightPanelGoal?.id === goal.id}
                  journalEntries={journalEntries}
                  onClick={() => setRightPanelGoal(goal)}
                  onEdit={() => {
                    setEditGoal(goal);
                    setCreateDialogOpen(true);
                  }}
                  onOpenDashboard={() => setDashboardGoal(goal)}
                  onArchive={() => handleDeleteGoal(goal.id)}
                  onCheckIn={(date) => toggleWeeklyCheckIn(goal.id, date)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Assistant Panel */}
      <div className="w-80 flex-shrink-0 border-l border-border bg-muted/30">
        <ManifestAssistantPanel
          selectedGoal={rightPanelGoal}
          progress={rightPanelGoal ? getGoalProgress(rightPanelGoal.id) : 0}
          onCheckInToday={() => {
            if (rightPanelGoal) toggleWeeklyCheckIn(rightPanelGoal.id, new Date());
          }}
        />
      </div>

      {/* Create/Edit Dialog */}
      <ManifestCreateDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) setEditGoal(null);
        }}
        onSave={handleSaveGoal}
        editGoal={editGoal}
        saving={saving}
      />

      {/* Goal Dashboard Modal */}
      {dashboardGoal && (
        <ManifestGoalDashboard
          open={!!dashboardGoal}
          onOpenChange={(open) => !open && setDashboardGoal(null)}
          goal={dashboardGoal}
          journalEntries={journalEntries}
          onEdit={() => {
            setEditGoal(dashboardGoal);
            setCreateDialogOpen(true);
          }}
          onDuplicate={() => {
            toast({ title: "Coming soon", description: "Duplicate feature is under development" });
          }}
          onArchive={() => handleDeleteGoal(dashboardGoal.id)}
          onDelete={() => handleDeleteGoal(dashboardGoal.id)}
          onMarkAchieved={() => handleMarkAchieved(dashboardGoal.id)}
          onCheckIn={(date) => toggleWeeklyCheckIn(dashboardGoal.id, date)}
          onAddAction={(title) => {
            toast({ title: "Action added", description: title });
          }}
          onAddJournalEntry={(entry) => handleAddJournalEntry(dashboardGoal.id, entry)}
        />
      )}
    </div>
  );
}
