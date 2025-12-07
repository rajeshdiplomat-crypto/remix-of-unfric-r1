import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Sparkles, Target, Heart, Check, Trash2, Flame, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, isSameDay, parseISO } from "date-fns";

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

    // Check if there's an entry today or yesterday to start the streak
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

  const hasTodayEntry = (goalId: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return journalEntries.some(
      (e) => e.goal_id === goalId && isSameDay(parseISO(e.entry_date), today)
    );
  };

  const getGoalEntries = (goalId: string): ManifestJournalEntry[] => {
    return journalEntries.filter((e) => e.goal_id === goalId).slice(0, 5);
  };

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
      )}
    </div>
  );
}
