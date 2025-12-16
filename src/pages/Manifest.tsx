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
import { format, subDays, isSameDay, parseISO, startOfWeek, addDays, isToday, differenceInDays, subWeeks, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

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

  // Get 7-day sparkline data for a goal
  const getSparklineData = (goalId: string): number[] => {
    const data: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const hasEntry = hasEntryOnDate(goalId, day);
      data.push(hasEntry ? 1 : 0);
    }
    return data;
  };

  // Get monthly trend data (last 4 weeks)
  const getMonthlyTrendData = () => {
    const data: { week: string; entries: number; rate: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = subWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), i);
      const weekEnd = addDays(weekStart, 6);
      const weekLabel = format(weekStart, "MMM d");
      
      const weekEntries = journalEntries.filter(e => {
        const entryDate = parseISO(e.entry_date);
        return entryDate >= weekStart && entryDate <= weekEnd;
      }).length;
      
      const activeGoals = goals.filter(g => !g.is_completed).length;
      const maxPossible = activeGoals * 7;
      const rate = maxPossible > 0 ? Math.round((weekEntries / maxPossible) * 100) : 0;
      
      data.push({ week: weekLabel, entries: weekEntries, rate });
    }
    return data;
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

      {/* Graphical Insights Dashboard */}
      {goals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Weekly Progress Chart */}
          <Card className="p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Weekly Progress</h3>
            <div className="flex items-end justify-between h-32 gap-2">
              {weekDays.map((day) => {
                const dayEntries = journalEntries.filter(e => 
                  isSameDay(parseISO(e.entry_date), day)
                ).length;
                const maxEntries = Math.max(...weekDays.map(d => 
                  journalEntries.filter(e => isSameDay(parseISO(e.entry_date), d)).length
                ), 1);
                const height = (dayEntries / maxEntries) * 100;
                return (
                  <div key={day.toString()} className="flex flex-col items-center flex-1">
                    <div className="w-full flex flex-col items-center">
                      <span className="text-xs text-muted-foreground mb-1">{dayEntries}</span>
                      <div 
                        className={`w-full rounded-t transition-all ${
                          isToday(day) ? 'bg-primary' : 'bg-primary/60'
                        }`}
                        style={{ height: `${Math.max(height, 8)}%`, minHeight: '4px' }}
                      />
                    </div>
                    <span className={`text-xs mt-2 ${isToday(day) ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                      {format(day, "EEE")}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Goal Completion Donut */}
          <Card className="p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Today's Progress</h3>
            <div className="flex items-center justify-center gap-6">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18" cy="18" r="15.5"
                    fill="none"
                    className="stroke-muted"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18" cy="18" r="15.5"
                    fill="none"
                    className="stroke-primary"
                    strokeWidth="3"
                    strokeDasharray={`${(insights.todayCompleted / Math.max(insights.totalGoals, 1)) * 97.5} 97.5`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-foreground">
                    {insights.todayCompleted}/{insights.totalGoals}
                  </span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-muted-foreground">Best: <span className="font-medium text-foreground">{insights.bestStreak} days</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">Avg: <span className="font-medium text-foreground">{insights.avgCompletionRate}%</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-500" />
                  <span className="text-muted-foreground">Total: <span className="font-medium text-foreground">{journalEntries.length}</span></span>
                </div>
              </div>
            </div>
          </Card>

          {/* Monthly Trend Line Chart */}
          <Card className="p-4 md:col-span-2">
            <h3 className="text-sm font-medium text-foreground mb-3">Monthly Visualization Consistency</h3>
            <div className="h-40">
              <div className="flex items-end justify-between h-32 gap-4">
                {getMonthlyTrendData().map((weekData, index, arr) => {
                  const maxRate = Math.max(...arr.map(d => d.rate), 1);
                  const height = (weekData.rate / maxRate) * 100;
                  return (
                    <div key={weekData.week} className="flex-1 flex flex-col items-center">
                      <span className="text-xs text-muted-foreground mb-1">{weekData.rate}%</span>
                      <div className="w-full flex flex-col items-center relative">
                        <div 
                          className="w-full max-w-16 bg-primary/80 rounded-t transition-all"
                          style={{ height: `${Math.max(height, 8)}%`, minHeight: '8px' }}
                        />
                        {index < arr.length - 1 && (
                          <svg 
                            className="absolute top-0 left-1/2 w-full h-full pointer-events-none" 
                            style={{ transform: 'translateX(50%)' }}
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                          >
                            <line 
                              x1="0" 
                              y1={100 - height} 
                              x2="100" 
                              y2={100 - (arr[index + 1].rate / maxRate) * 100} 
                              className="stroke-primary" 
                              strokeWidth="2"
                              strokeDasharray="4 2"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2">
                {getMonthlyTrendData().map(weekData => (
                  <div key={weekData.week} className="flex-1 text-center">
                    <span className="text-xs text-muted-foreground">{weekData.week}</span>
                  </div>
                ))}
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
                <CardTitle className="text-lg">This Week</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Header Row with Day Labels */}
                <div className="flex items-center py-2 border-b border-border">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-muted-foreground text-sm">Goal</p>
                  </div>
                  <div className="flex items-center gap-1">
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
                    <div className="w-10" /> {/* Spacer for action button */}
                  </div>
                </div>
                {/* Goal Rows */}
                {goals.filter((g) => !g.is_completed).map((goal) => (
                  <div key={goal.id} className="flex items-center py-2 border-b border-border last:border-0">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-medium text-foreground truncate">{goal.title}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Flame className="h-3 w-3 text-orange-500" />
                        <span>{getStreakForGoal(goal.id)} day streak</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {weekDays.map((day) => {
                        const hasEntry = hasEntryOnDate(goal.id, day);
                        return (
                          <button
                            key={day.toString()}
                            onClick={() => openJournalDialog(goal)}
                            className={`w-10 h-10 rounded-lg transition-all flex items-center justify-center ${
                              hasEntry
                                ? "bg-primary text-primary-foreground"
                                : isToday(day)
                                ? "bg-muted ring-1 ring-primary"
                                : "bg-muted/50 hover:bg-muted"
                            }`}
                          >
                            {hasEntry && <Check className="h-4 w-4" />}
                          </button>
                        );
                      })}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openJournalDialog(goal)}
                        className="text-primary hover:text-primary w-10"
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

                    {/* Heatmap Grid with aligned day labels */}
                    <div className="space-y-2">
                      {/* Day labels row */}
                      <div className="grid grid-cols-7 gap-1 mb-1">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                          <div key={day} className="text-xs text-muted-foreground text-center">
                            {day}
                          </div>
                        ))}
                      </div>
                      {/* Heatmap cells aligned under day labels */}
                      <div className="grid grid-cols-7 gap-1">
                        {heatmapDays.map((day, index) => {
                          const hasEntry = hasEntryOnDate(goal.id, day);
                          return (
                            <button
                              key={index}
                              onClick={() => openJournalDialog(goal)}
                              title={format(day, "MMM d, yyyy")}
                              className={`aspect-square w-full max-w-8 mx-auto rounded-sm transition-all hover:ring-1 hover:ring-primary/50 ${
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
                const sparklineData = getSparklineData(goal.id);

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

                      {/* 7-Day Sparkline Chart */}
                      {!goal.is_completed && (
                        <div className="py-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">Last 7 days</span>
                            <span className="text-xs text-muted-foreground">
                              {sparklineData.filter(d => d === 1).length}/7
                            </span>
                          </div>
                          <div className="flex items-end gap-1 h-8">
                            {sparklineData.map((value, i) => (
                              <div 
                                key={i}
                                className={`flex-1 rounded-sm transition-all ${
                                  value === 1 ? 'bg-primary' : 'bg-muted/50'
                                }`}
                                style={{ height: value === 1 ? '100%' : '20%' }}
                              />
                            ))}
                          </div>
                          <div className="flex justify-between mt-1">
                            {sparklineData.map((_, i) => (
                              <span key={i} className="flex-1 text-center text-[10px] text-muted-foreground">
                                {format(subDays(new Date(), 6 - i), "E")[0]}
                              </span>
                            ))}
                          </div>
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
