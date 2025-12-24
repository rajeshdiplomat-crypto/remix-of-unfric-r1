import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Target, Home, Heart, Sparkles, DollarSign, TrendingUp, Award, Pin, Check, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, isSameDay, parseISO, startOfWeek, addDays, isToday } from "date-fns";

interface ManifestGoal {
  id: string;
  title: string;
  description: string | null;
  feeling_when_achieved: string | null;
  affirmations: string[];
  is_completed: boolean;
  created_at: string;
  category?: string;
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
  { id: "all", label: "All", icon: Target },
  { id: "wealth", label: "Wealth", icon: DollarSign },
  { id: "health", label: "Health", icon: Heart },
  { id: "love", label: "Love", icon: Home },
];

const CATEGORY_ICONS: Record<string, typeof Target> = {
  wealth: DollarSign,
  health: Heart,
  love: Home,
  default: Target,
};

export default function Manifest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<ManifestGoal[]>([]);
  const [journalEntries, setJournalEntries] = useState<ManifestJournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<ManifestGoal | null>(null);
  const [rightPanelGoal, setRightPanelGoal] = useState<ManifestGoal | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [feeling, setFeeling] = useState("");
  const [affirmations, setAffirmations] = useState("");
  const [category, setCategory] = useState("wealth");
  const [saving, setSaving] = useState(false);

  // Daily affirmation state
  const [dailyAffirmationRepeated, setDailyAffirmationRepeated] = useState(false);
  const [visualizationDone, setVisualizationDone] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  useEffect(() => {
    // Auto-select first goal for right panel
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

  const getWeekDays = () => {
    return Array.from({ length: 7 }, (_, i) =>
      addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i)
    );
  };

  const weekDays = getWeekDays();

  const hasEntryOnDate = (goalId: string, date: Date): boolean => {
    return journalEntries.some(
      (e) => e.goal_id === goalId && isSameDay(parseISO(e.entry_date), date)
    );
  };

  const getVisualizationStreak = (): number => {
    if (journalEntries.length === 0) return 0;
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const checkDate = subDays(currentDate, i);
      const hasEntry = journalEntries.some(e => isSameDay(parseISO(e.entry_date), checkDate));
      if (hasEntry) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  };

  const getGoalProgress = (goalId: string): number => {
    const totalDays = 30;
    const entries = journalEntries.filter(e => e.goal_id === goalId).length;
    return Math.min(Math.round((entries / totalDays) * 100), 100);
  };

  const toggleWeeklyCheckIn = async (goalId: string, date: Date) => {
    if (!user) return;
    
    const dateStr = format(date, "yyyy-MM-dd");
    const existingEntry = journalEntries.find(
      e => e.goal_id === goalId && e.entry_date === dateStr
    );

    if (existingEntry) {
      // Remove entry
      await supabase.from("manifest_journal").delete().eq("id", existingEntry.id);
    } else {
      // Add entry
      await supabase.from("manifest_journal").insert({
        user_id: user.id,
        goal_id: goalId,
        entry_date: dateStr,
        gratitude: "Quick visualization check-in",
        visualization: "Completed daily visualization",
      });
    }
    fetchData();
  };

  const openDialog = (goal?: ManifestGoal) => {
    if (goal) {
      setSelectedGoal(goal);
      setTitle(goal.title);
      setDescription(goal.description || "");
      setFeeling(goal.feeling_when_achieved || "");
      setAffirmations(goal.affirmations?.join("\n") || "");
      setCategory((goal as any).category || "wealth");
    } else {
      setSelectedGoal(null);
      setTitle("");
      setDescription("");
      setFeeling("");
      setAffirmations("");
      setCategory("wealth");
    }
    setDialogOpen(true);
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
      const { data, error } = await supabase.from("manifest_goals").insert({
        user_id: user.id,
        title,
        description,
        feeling_when_achieved: feeling,
        affirmations: affirmationsList,
      }).select().single();

      if (error) {
        toast({ title: "Error", description: "Failed to create goal", variant: "destructive" });
      } else {
        toast({ title: "Created!", description: "Your manifestation goal has been created" });
        fetchData();
        setDialogOpen(false);
        if (data) setRightPanelGoal(data);
      }
    }
    setSaving(false);
  };

  const activeGoals = goals.filter(g => !g.is_completed);
  const completedGoals = goals.filter(g => g.is_completed);
  const filteredGoals = activeFilter === "all" 
    ? goals 
    : goals.filter(g => (g as any).category === activeFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading goals...</div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-100px)]">
      {/* Main Content - Center */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto space-y-6 pb-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Manifestation Board</h1>
              <p className="text-muted-foreground mt-1">Visualize and track your dreams into reality.</p>
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
                    <label className="text-sm font-medium mb-2 block">Goal Name</label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="What do you want to manifest?"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Category</label>
                    <div className="flex gap-2">
                      {CATEGORIES.filter(c => c.id !== "all").map(cat => (
                        <Button
                          key={cat.id}
                          variant={category === cat.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCategory(cat.id)}
                        >
                          <cat.icon className="h-4 w-4 mr-1" />
                          {cat.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Affirmation</label>
                    <Textarea
                      value={affirmations}
                      onChange={(e) => setAffirmations(e.target.value)}
                      placeholder="I am worthy of abundance..."
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Visualization Script (Optional)</label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your goal in vivid detail..."
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

          {/* KPI Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{activeGoals.length}</p>
                  <p className="text-xs text-muted-foreground">Active Goals</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Award className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{completedGoals.length}</p>
                  <p className="text-xs text-muted-foreground">Total Manifested</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{getVisualizationStreak()}</p>
                  <p className="text-xs text-muted-foreground">Visualization Streak</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2">
            {CATEGORIES.map(cat => (
              <Button
                key={cat.id}
                variant={activeFilter === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(cat.id)}
                className="rounded-full"
              >
                {cat.label}
              </Button>
            ))}
          </div>

          {/* Goals List */}
          <div className="space-y-3">
            {filteredGoals.length === 0 ? (
              <Card className="p-8 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground">No goals yet</h3>
                <p className="text-muted-foreground mt-1">Create your first manifestation goal to get started.</p>
              </Card>
            ) : (
              filteredGoals.map(goal => {
                const CategoryIcon = CATEGORY_ICONS[(goal as any).category || "default"] || Target;
                const progress = getGoalProgress(goal.id);
                const isSelected = rightPanelGoal?.id === goal.id;
                
                return (
                  <Card 
                    key={goal.id} 
                    className={`p-4 cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setRightPanelGoal(goal)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <CategoryIcon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{goal.title}</h3>
                          {goal.is_completed && (
                            <Badge variant="secondary" className="bg-green-500/10 text-green-500">Manifested</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground italic mb-3">
                          {goal.affirmations?.[0] || "I am manifesting this goal into reality"}
                        </p>
                        <div className="mb-2">
                          <Progress value={progress} className="h-1.5" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{progress}% complete</span>
                          {/* Weekly Check-in */}
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground mr-2">THIS WEEK</span>
                            {weekDays.map((day, i) => {
                              const hasEntry = hasEntryOnDate(goal.id, day);
                              return (
                                <button
                                  key={i}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleWeeklyCheckIn(goal.id, day);
                                  }}
                                  className={`h-5 w-5 rounded transition-colors ${
                                    hasEntry 
                                      ? 'bg-primary' 
                                      : 'bg-muted hover:bg-muted-foreground/20'
                                  }`}
                                  title={format(day, "EEEE")}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Sticky */}
      <div className="w-80 flex-shrink-0 space-y-4 overflow-auto pb-8">
        {/* Manifestation Assistant */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Manifestation</p>
              <p className="font-semibold text-foreground">Assistant</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Pin className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Gentle guidance for your selected goal
          </p>
        </Card>

        {/* Selected Goal */}
        {rightPanelGoal && (
          <Card className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Selected Goal</p>
            <h3 className="font-semibold text-foreground mb-3 line-clamp-2">{rightPanelGoal.title}</h3>
            <Progress value={getGoalProgress(rightPanelGoal.id)} className="h-2 mb-2" />
            <p className="text-sm text-muted-foreground">{getGoalProgress(rightPanelGoal.id)}% complete</p>
          </Card>
        )}

        {/* Daily Affirmation */}
        {rightPanelGoal && (
          <Card className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Daily Affirmation</p>
            <div className="bg-muted/50 rounded-lg p-3 mb-3">
              <p className="text-sm text-foreground italic">
                {rightPanelGoal.affirmations?.[0] || "I am worthy of achieving all my dreams"}
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={dailyAffirmationRepeated}
                onChange={(e) => setDailyAffirmationRepeated(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm text-muted-foreground">Mark as repeated today</span>
            </label>
          </Card>
        )}

        {/* Visualization */}
        {rightPanelGoal && (
          <Card className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Visualization</p>
            <div className="space-y-2 mb-3">
              <p className="text-sm text-foreground">1. Close your eyes and breathe deeply</p>
              <p className="text-sm text-foreground">2. Picture yourself achieving this goal</p>
              <p className="text-sm text-foreground">3. Feel the emotions of success</p>
              <p className="text-sm text-foreground">4. Express gratitude for this reality</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={visualizationDone}
                onChange={(e) => {
                  setVisualizationDone(e.target.checked);
                  if (e.target.checked && rightPanelGoal) {
                    toggleWeeklyCheckIn(rightPanelGoal.id, new Date());
                  }
                }}
                className="rounded border-border"
              />
              <span className="text-sm text-muted-foreground">Done today</span>
            </label>
          </Card>
        )}
      </div>
    </div>
  );
}
