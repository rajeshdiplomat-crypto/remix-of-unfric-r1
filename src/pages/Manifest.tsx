import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Sparkles, Target, Heart, Check, Trash2, Flame, BookOpen, ChevronDown, ChevronUp, Calendar, BarChart3, TrendingUp, Award, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, isSameDay, parseISO, startOfWeek, addDays, isToday, differenceInDays } from "date-fns";

interface ManifestGoal {
  id: string;
  title: string;
  description: string | null;
  feeling_when_achieved: string | null;
  affirmations: string[];
  is_completed: boolean;
  created_at: string;
}

interface ManifestJournalEntry {
  id: string;
  goal_id: string;
  gratitude: string | null;
  visualization: string | null;
  entry_date: string;
  created_at: string;
}

export default function Manifest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<ManifestGoal[]>([]);
  const [journalEntries, setJournalEntries] = useState<ManifestJournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<ManifestGoal | null>(null);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);

  // Form state for goal
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [feeling, setFeeling] = useState("");
  const [affirmations, setAffirmations] = useState("");
  const [saving, setSaving] = useState(false);

  // Journal dialog state
  const [journalDialogOpen, setJournalDialogOpen] = useState(false);
  const [journalGoal, setJournalGoal] = useState<ManifestGoal | null>(null);
  const [journalGratitude, setJournalGratitude] = useState("");
  const [journalVisualization, setJournalVisualization] = useState("");
  const [savingJournal, setSavingJournal] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

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

  const getStreakForGoal = (goalId: string): number => {
    const goalEntries = journalEntries
      .filter((e) => e.goal_id === goalId)
      .map((e) => parseISO(e.entry_date))
      .sort((a, b) => b.getTime() - a.getTime());

    if (goalEntries.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const hasToday = goalEntries.some((d) => isSameDay(d, currentDate));
    const yesterday = subDays(currentDate, 1);
    const hasYesterday = goalEntries.some((d) => isSameDay(d, yesterday));

    if (!hasToday && !hasYesterday) return 0;

    let checkDate = hasToday ? currentDate : yesterday;

    for (const entryDate of goalEntries) {
      if (isSameDay(entryDate, checkDate)) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else if (entryDate < checkDate) {
        break;
      }
    }

    return streak;
  };

  const getLongestStreakForGoal = (goalId: string): number => {
    const goalEntries = journalEntries
      .filter((e) => e.goal_id === goalId)
      .map((e) => parseISO(e.entry_date))
      .sort((a, b) => a.getTime() - b.getTime());

    if (goalEntries.length === 0) return 0;

    let longestStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < goalEntries.length; i++) {
      const diff = differenceInDays(goalEntries[i], goalEntries[i - 1]);
      if (diff === 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else if (diff > 1) {
        currentStreak = 1;
      }
    }

    return longestStreak;
  };

  const getCompletionRate = (goalId: string, days: number = 30): number => {
    const startDate = subDays(new Date(), days - 1);
    const goalEntries = journalEntries.filter(
      (e) => e.goal_id === goalId && parseISO(e.entry_date) >= startDate
    );
    return Math.round((goalEntries.length / days) * 100);
  };

  const getTotalEntries = (goalId: string): number => {
    return journalEntries.filter((e) => e.goal_id === goalId).length;
  };

  const hasTodayEntry = (goalId: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return journalEntries.some(
      (e) => e.goal_id === goalId && isSameDay(parseISO(e.entry_date), today)
    );
  };

  const hasEntryOnDate = (goalId: string, date: Date): boolean => {
    return journalEntries.some(
      (e) => e.goal_id === goalId && isSameDay(parseISO(e.entry_date), date)
    );
  };

  const getGoalEntries = (goalId: string): ManifestJournalEntry[] => {
    return journalEntries.filter((e) => e.goal_id === goalId).slice(0, 5);
  };

  // Get overall insights
  const getOverallInsights = () => {
    const totalGoals = goals.filter((g) => !g.is_completed).length;
    const todayCompleted = goals.filter((g) => !g.is_completed && hasTodayEntry(g.id)).length;
    const avgCompletionRate = goals.length > 0
      ? Math.round(goals.filter((g) => !g.is_completed).reduce((acc, g) => acc + getCompletionRate(g.id), 0) / Math.max(totalGoals, 1))
      : 0;
    const bestStreak = goals.length > 0
      ? Math.max(...goals.map((g) => getLongestStreakForGoal(g.id)), 0)
      : 0;

    return { totalGoals, todayCompleted, avgCompletionRate, bestStreak };
  };

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i)
  );

  // Generate last 12 weeks for heatmap
  const getHeatmapDays = () => {
    const days: Date[] = [];
    for (let i = 83; i >= 0; i--) {
      days.push(subDays(new Date(), i));
    }
    return days;
  };

  const heatmapDays = getHeatmapDays();

  const openDialog = (goal?: ManifestGoal) => {
    if (goal) {
      setSelectedGoal(goal);
      setTitle(goal.title);
      setDescription(goal.description || "");
      setFeeling(goal.feeling_when_achieved || "");
      setAffirmations(goal.affirmations?.join("\n") || "");
    } else {
      setSelectedGoal(null);
      setTitle("");
      setDescription("");
      setFeeling("");
      setAffirmations("");
    }
    setDialogOpen(true);
  };

  const openJournalDialog = (goal: ManifestGoal) => {
    setJournalGoal(goal);
    setJournalGratitude("");
    setJournalVisualization("");
    setJournalDialogOpen(true);
  };

  const saveGoal = async () => {
    if (!user || !title.trim()) return;

    setSaving(true);
    const affirmationsList = affirmations.split("\n").map((a) => a.trim()).filter(Boolean);

    if (selectedGoal) {
      const { error } = await supabase
        .from("manifest_goals")
        .update({
          title,
          description,
          feeling_when_achieved: feeling,
          affirmations: affirmationsList,
        })
        .eq("id", selectedGoal.id);

      if (error) {
        toast({ title: "Error", description: "Failed to update goal", variant: "destructive" });
      } else {
        toast({ title: "Updated!", description: "Your goal has been updated" });
        fetchData();
        setDialogOpen(false);
      }
    } else {
      const { error } = await supabase.from("manifest_goals").insert({
        user_id: user.id,
        title,
        description,
        feeling_when_achieved: feeling,
        affirmations: affirmationsList,
      });

      if (error) {
        toast({ title: "Error", description: "Failed to create goal", variant: "destructive" });
      } else {
        toast({ title: "Created!", description: "Your manifestation goal has been created" });
        fetchData();
        setDialogOpen(false);
      }
    }

    setSaving(false);
  };

  const saveJournalEntry = async () => {
    if (!user || !journalGoal) return;

    setSavingJournal(true);

    const { error } = await supabase.from("manifest_journal").insert({
      user_id: user.id,
      goal_id: journalGoal.id,
      gratitude: journalGratitude,
      visualization: journalVisualization,
    });

    if (error) {
      toast({ title: "Error", description: "Failed to save journal entry", variant: "destructive" });
    } else {
      toast({ title: "Saved!", description: "Your visualization journal entry has been saved" });
      fetchData();
      setJournalDialogOpen(false);
    }

    setSavingJournal(false);
  };

  const toggleComplete = async (goal: ManifestGoal) => {
    const { error } = await supabase
      .from("manifest_goals")
      .update({ is_completed: !goal.is_completed })
      .eq("id", goal.id);

    if (!error) {
      fetchData();
      toast({
        title: goal.is_completed ? "Reopened" : "Manifested!",
        description: goal.is_completed ? "Goal reopened" : "Congratulations on achieving your goal!",
      });
    }
  };

  const deleteGoal = async (id: string) => {
    const { error } = await supabase.from("manifest_goals").delete().eq("id", id);

    if (!error) {
      fetchData();
      toast({ title: "Deleted", description: "Goal has been removed" });
    }
  };

  const insights = getOverallInsights();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading goals...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manifest</h1>
          <p className="text-muted-foreground mt-1">Visualize and attract your dreams into reality</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedGoal ? "Edit Goal" : "Create Manifestation Goal"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Goal Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What do you want to manifest?"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your goal in detail..."
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  How will you feel when this is reality?
                </label>
                <Textarea
                  value={feeling}
                  onChange={(e) => setFeeling(e.target.value)}
                  placeholder="I will feel..."
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Affirmations (one per line)
                </label>
                <Textarea
                  value={affirmations}
                  onChange={(e) => setAffirmations(e.target.value)}
                  placeholder="I am worthy of abundance&#10;I attract success effortlessly"
                  rows={4}
                />
              </div>
              <Button onClick={saveGoal} disabled={saving || !title.trim()} className="w-full">
                {saving ? "Saving..." : selectedGoal ? "Update Goal" : "Create Goal"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Journal Dialog */}
      <Dialog open={journalDialogOpen} onOpenChange={setJournalDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Daily Visualization - {journalGoal?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                What are you grateful for regarding this goal?
              </label>
              <Textarea
                value={journalGratitude}
                onChange={(e) => setJournalGratitude(e.target.value)}
                placeholder="I am grateful for..."
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Visualize your goal as already achieved. Describe what you see, feel, and experience.
              </label>
              <Textarea
                value={journalVisualization}
                onChange={(e) => setJournalVisualization(e.target.value)}
                placeholder="I see myself... I feel... I am experiencing..."
                rows={5}
              />
            </div>
            <Button
              onClick={saveJournalEntry}
              disabled={savingJournal || (!journalGratitude.trim() && !journalVisualization.trim())}
              className="w-full"
            >
              {savingJournal ? "Saving..." : "Save Visualization"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Insights Cards */}
      {goals.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{insights.todayCompleted}/{insights.totalGoals}</p>
                <p className="text-xs text-muted-foreground">Visualized Today</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{insights.bestStreak}</p>
                <p className="text-xs text-muted-foreground">Best Streak</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{insights.avgCompletionRate}%</p>
                <p className="text-xs text-muted-foreground">Avg Rate</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Zap className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{journalEntries.length}</p>
                <p className="text-xs text-muted-foreground">Total Entries</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {goals.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-medium text-foreground">No manifestation goals yet</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            Create your first goal and start attracting your dreams.
          </p>
          <Button onClick={() => openDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Create Goal
          </Button>
        </Card>
      ) : (
        <Tabs defaultValue="daily" className="space-y-6">
          <TabsList>
            <TabsTrigger value="daily">
              <Calendar className="h-4 w-4 mr-2" />
              Daily View
            </TabsTrigger>
            <TabsTrigger value="heatmap">
              <BarChart3 className="h-4 w-4 mr-2" />
              Heatmap
            </TabsTrigger>
            <TabsTrigger value="goals">
              <Sparkles className="h-4 w-4 mr-2" />
              Goals
            </TabsTrigger>
          </TabsList>

          {/* Daily View Tab */}
          <TabsContent value="daily" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">This Week</CardTitle>
                  <div className="flex gap-1">
                    {weekDays.map((day) => (
                      <div
                        key={day.toString()}
                        className={`w-10 text-center text-xs ${
                          isToday(day) ? "font-bold text-primary" : "text-muted-foreground"
                        }`}
                      >
                        <div>{format(day, "EEE")}</div>
                        <div>{format(day, "d")}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {goals.filter((g) => !g.is_completed).map((goal) => (
                  <div key={goal.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-foreground">{goal.title}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Flame className="h-3 w-3 text-orange-500" />
                          <span>{getStreakForGoal(goal.id)} day streak</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        {weekDays.map((day) => {
                          const hasEntry = hasEntryOnDate(goal.id, day);
                          return (
                            <button
                              key={day.toString()}
                              onClick={() => openJournalDialog(goal)}
                              className={`w-10 h-10 rounded-lg transition-all ${
                                hasEntry
                                  ? "bg-primary text-primary-foreground"
                                  : isToday(day)
                                  ? "bg-muted ring-1 ring-primary"
                                  : "bg-muted/50 hover:bg-muted"
                              }`}
                            >
                              {hasEntry && "✓"}
                            </button>
                          );
                        })}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openJournalDialog(goal)}
                        className="text-primary hover:text-primary"
                      >
                        <BookOpen className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Heatmap Tab */}
          <TabsContent value="heatmap" className="space-y-4">
            {goals.filter((g) => !g.is_completed).map((goal) => {
              const streak = getStreakForGoal(goal.id);
              const longestStreak = getLongestStreakForGoal(goal.id);
              const completionRate = getCompletionRate(goal.id);
              const totalDone = getTotalEntries(goal.id);

              return (
                <Card key={goal.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        {goal.title}
                        {streak >= 7 && (
                          <Badge className="bg-orange-500/20 text-orange-600 border-0">
                            <Flame className="h-3 w-3 mr-1" />
                            On Fire!
                          </Badge>
                        )}
                      </CardTitle>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Flame className="h-3 w-3 text-orange-500" />
                        {streak} day streak
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      <div className="text-center p-2 rounded-lg bg-muted/50">
                        <p className="text-lg font-bold text-foreground">{streak}</p>
                        <p className="text-xs text-muted-foreground">Current</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted/50">
                        <p className="text-lg font-bold text-foreground">{longestStreak}</p>
                        <p className="text-xs text-muted-foreground">Longest</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted/50">
                        <p className="text-lg font-bold text-foreground">{completionRate}%</p>
                        <p className="text-xs text-muted-foreground">30-Day</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted/50">
                        <p className="text-lg font-bold text-foreground">{totalDone}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                    </div>

                    {/* Heatmap Grid */}
                    <div className="space-y-2">
                      <div className="flex gap-0.5 text-xs text-muted-foreground mb-1">
                        <span className="w-8">Mon</span>
                        <span className="w-8">Tue</span>
                        <span className="w-8">Wed</span>
                        <span className="w-8">Thu</span>
                        <span className="w-8">Fri</span>
                        <span className="w-8">Sat</span>
                        <span className="w-8">Sun</span>
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {heatmapDays.map((day, index) => {
                          const hasEntry = hasEntryOnDate(goal.id, day);
                          return (
                            <button
                              key={index}
                              onClick={() => openJournalDialog(goal)}
                              title={format(day, "MMM d, yyyy")}
                              className={`aspect-square w-full max-w-8 rounded-sm transition-all hover:ring-1 hover:ring-primary/50 ${
                                hasEntry
                                  ? "bg-primary"
                                  : isToday(day)
                                  ? "bg-muted ring-1 ring-primary"
                                  : "bg-muted/30"
                              }`}
                            />
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-xs text-muted-foreground">
                          Last 12 weeks
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Less</span>
                          <div className="flex gap-0.5">
                            <div className="w-3 h-3 rounded-sm bg-muted/30" />
                            <div className="w-3 h-3 rounded-sm bg-primary/40" />
                            <div className="w-3 h-3 rounded-sm bg-primary/70" />
                            <div className="w-3 h-3 rounded-sm bg-primary" />
                          </div>
                          <span>More</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">30-day visualization rate</span>
                        <span className="font-medium text-foreground">{completionRate}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {goals.map((goal) => {
                const streak = getStreakForGoal(goal.id);
                const todayDone = hasTodayEntry(goal.id);
                const recentEntries = getGoalEntries(goal.id);
                const isExpanded = expandedGoalId === goal.id;

                return (
                  <Card
                    key={goal.id}
                    className={`transition-all hover:shadow-md ${
                      goal.is_completed ? "opacity-75 bg-muted/30" : ""
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                            {goal.is_completed ? (
                              <Check className="h-4 w-4 text-primary" />
                            ) : (
                              <Target className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <CardTitle
                            className={`text-base cursor-pointer hover:text-primary ${
                              goal.is_completed ? "line-through" : ""
                            }`}
                            onClick={() => openDialog(goal)}
                          >
                            {goal.title}
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          {streak > 0 && (
                            <Badge variant="secondary" className="bg-orange-500/20 text-orange-600 flex items-center gap-1">
                              <Flame className="h-3 w-3" />
                              {streak}
                            </Badge>
                          )}
                          {goal.is_completed && (
                            <Badge variant="secondary" className="bg-green-500/20 text-green-600">
                              Manifested
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {goal.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{goal.description}</p>
                      )}

                      {goal.feeling_when_achieved && (
                        <div className="flex items-start gap-2 text-sm">
                          <Heart className="h-4 w-4 text-pink-500 mt-0.5 shrink-0" />
                          <span className="text-muted-foreground line-clamp-2">
                            {goal.feeling_when_achieved}
                          </span>
                        </div>
                      )}

                      {goal.affirmations && goal.affirmations.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {goal.affirmations.slice(0, 2).map((aff, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {aff.length > 30 ? aff.substring(0, 30) + "..." : aff}
                            </Badge>
                          ))}
                          {goal.affirmations.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{goal.affirmations.length - 2} more
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Daily Visualization Button */}
                      {!goal.is_completed && (
                        <Button
                          variant={todayDone ? "secondary" : "default"}
                          size="sm"
                          className="w-full"
                          onClick={() => openJournalDialog(goal)}
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          {todayDone ? "Add Another Entry" : "Daily Visualization"}
                        </Button>
                      )}

                      {/* Recent Entries Toggle */}
                      {recentEntries.length > 0 && (
                        <div className="border-t pt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-between text-muted-foreground"
                            onClick={() => setExpandedGoalId(isExpanded ? null : goal.id)}
                          >
                            <span>Recent Entries ({recentEntries.length})</span>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>

                          {isExpanded && (
                            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                              {recentEntries.map((entry) => (
                                <div
                                  key={entry.id}
                                  className="p-2 rounded-lg bg-muted/50 text-sm space-y-1"
                                >
                                  <div className="text-xs text-muted-foreground">
                                    {format(parseISO(entry.entry_date), "MMM d, yyyy")}
                                  </div>
                                  {entry.gratitude && (
                                    <p className="text-muted-foreground">
                                      <span className="font-medium text-foreground">Gratitude:</span>{" "}
                                      {entry.gratitude}
                                    </p>
                                  )}
                                  {entry.visualization && (
                                    <p className="text-muted-foreground">
                                      <span className="font-medium text-foreground">Visualization:</span>{" "}
                                      {entry.visualization}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => toggleComplete(goal)}
                        >
                          {goal.is_completed ? "Reopen" : "Mark Manifested"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteGoal(goal.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
