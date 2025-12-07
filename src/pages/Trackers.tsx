import { useState, useEffect } from "react";
import { format, startOfWeek, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isToday, differenceInDays, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Flame, Trash2, Calendar, BarChart3, TrendingUp, Target, Award, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Habit {
  id: string;
  name: string;
  description: string | null;
  frequency: string;
  target_days: number[];
  created_at: string;
}

interface HabitCompletion {
  id: string;
  habit_id: string;
  completed_date: string;
}

export default function Trackers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchHabits();
  }, [user]);

  const fetchHabits = async () => {
    if (!user) return;
    setLoading(true);

    const { data: habitsData } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    // Fetch last 90 days of completions for better heatmap
    const startDate = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const { data: completionsData } = await supabase
      .from("habit_completions")
      .select("*")
      .eq("user_id", user.id)
      .gte("completed_date", startDate);

    if (habitsData) setHabits(habitsData);
    if (completionsData) setCompletions(completionsData);
    setLoading(false);
  };

  const createHabit = async () => {
    if (!user || !name.trim()) return;

    setSaving(true);
    const { error } = await supabase.from("habits").insert({
      user_id: user.id,
      name,
      description,
    });

    if (error) {
      toast({ title: "Error", description: "Failed to create habit", variant: "destructive" });
    } else {
      toast({ title: "Created!", description: "Your habit has been created" });
      fetchHabits();
      setDialogOpen(false);
      setName("");
      setDescription("");
    }
    setSaving(false);
  };

  const toggleCompletion = async (habitId: string, date: Date) => {
    if (!user) return;

    const dateStr = format(date, "yyyy-MM-dd");
    const existing = completions.find(
      (c) => c.habit_id === habitId && c.completed_date === dateStr
    );

    if (existing) {
      await supabase.from("habit_completions").delete().eq("id", existing.id);
    } else {
      await supabase.from("habit_completions").insert({
        habit_id: habitId,
        user_id: user.id,
        completed_date: dateStr,
      });
    }

    fetchHabits();
  };

  const deleteHabit = async (id: string) => {
    const { error } = await supabase.from("habits").delete().eq("id", id);
    if (!error) {
      fetchHabits();
      toast({ title: "Deleted", description: "Habit has been removed" });
    }
  };

  const isCompleted = (habitId: string, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return completions.some((c) => c.habit_id === habitId && c.completed_date === dateStr);
  };

  const getStreak = (habitId: string) => {
    let streak = 0;
    let currentDate = new Date();

    while (true) {
      if (isCompleted(habitId, currentDate)) {
        streak++;
        currentDate = subDays(currentDate, 1);
      } else if (isToday(currentDate)) {
        currentDate = subDays(currentDate, 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const getLongestStreak = (habitId: string) => {
    const habitCompletions = completions
      .filter((c) => c.habit_id === habitId)
      .map((c) => parseISO(c.completed_date))
      .sort((a, b) => a.getTime() - b.getTime());

    if (habitCompletions.length === 0) return 0;

    let longestStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < habitCompletions.length; i++) {
      const diff = differenceInDays(habitCompletions[i], habitCompletions[i - 1]);
      if (diff === 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else if (diff > 1) {
        currentStreak = 1;
      }
    }

    return longestStreak;
  };

  const getCompletionRate = (habitId: string, days: number = 30) => {
    const startDate = subDays(new Date(), days - 1);
    const habitCompletions = completions.filter(
      (c) => c.habit_id === habitId && parseISO(c.completed_date) >= startDate
    );
    return Math.round((habitCompletions.length / days) * 100);
  };

  const getTotalCompletions = (habitId: string) => {
    return completions.filter((c) => c.habit_id === habitId).length;
  };

  // Get overall insights
  const getOverallInsights = () => {
    const totalHabits = habits.length;
    const todayCompleted = habits.filter((h) => isCompleted(h.id, new Date())).length;
    const avgCompletionRate = habits.length > 0 
      ? Math.round(habits.reduce((acc, h) => acc + getCompletionRate(h.id), 0) / habits.length)
      : 0;
    const bestStreak = habits.length > 0
      ? Math.max(...habits.map((h) => getLongestStreak(h.id)))
      : 0;

    return { totalHabits, todayCompleted, avgCompletionRate, bestStreak };
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

  const getHeatmapColor = (habitId: string, date: Date) => {
    if (isCompleted(habitId, date)) {
      return "bg-primary";
    }
    if (isToday(date)) {
      return "bg-muted ring-1 ring-primary";
    }
    return "bg-muted/30";
  };

  const insights = getOverallInsights();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading habits...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Habit Trackers</h1>
          <p className="text-muted-foreground mt-1">Build consistency and track your progress</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Habit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Habit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Habit Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Morning meditation"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description (optional)</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Why is this habit important to you?"
                  rows={3}
                />
              </div>
              <Button onClick={createHabit} disabled={saving || !name.trim()} className="w-full">
                {saving ? "Creating..." : "Create Habit"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Insights Cards */}
      {habits.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{insights.todayCompleted}/{insights.totalHabits}</p>
                <p className="text-xs text-muted-foreground">Today</p>
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
                <p className="text-2xl font-bold text-foreground">{completions.length}</p>
                <p className="text-xs text-muted-foreground">Total Done</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {habits.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-medium text-foreground">No habits yet</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            Create your first habit to start building consistency.
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Habit
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
            <TabsTrigger value="insights">
              <TrendingUp className="h-4 w-4 mr-2" />
              Insights
            </TabsTrigger>
          </TabsList>

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
                {habits.map((habit) => (
                  <div key={habit.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-foreground">{habit.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Flame className="h-3 w-3 text-orange-500" />
                          <span>{getStreak(habit.id)} day streak</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        {weekDays.map((day) => (
                          <button
                            key={day.toString()}
                            onClick={() => toggleCompletion(habit.id, day)}
                            className={`w-10 h-10 rounded-lg transition-all ${
                              isCompleted(habit.id, day)
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted/50 hover:bg-muted"
                            }`}
                          >
                            {isCompleted(habit.id, day) && "✓"}
                          </button>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteHabit(habit.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="heatmap" className="space-y-4">
            {habits.map((habit) => (
              <Card key={habit.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{habit.name}</CardTitle>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Flame className="h-3 w-3 text-orange-500" />
                      {getStreak(habit.id)} day streak
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Heatmap Grid - 12 weeks (84 days) */}
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
                      {heatmapDays.map((day, index) => (
                        <button
                          key={index}
                          onClick={() => toggleCompletion(habit.id, day)}
                          title={format(day, "MMM d, yyyy")}
                          className={`aspect-square w-full max-w-8 rounded-sm transition-all hover:ring-1 hover:ring-primary/50 ${getHeatmapColor(habit.id, day)}`}
                        />
                      ))}
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
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            {habits.map((habit) => {
              const streak = getStreak(habit.id);
              const longestStreak = getLongestStreak(habit.id);
              const completionRate = getCompletionRate(habit.id);
              const totalDone = getTotalCompletions(habit.id);

              return (
                <Card key={habit.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        {habit.name}
                        {streak >= 7 && (
                          <Badge className="bg-orange-500/20 text-orange-600 border-0">
                            <Flame className="h-3 w-3 mr-1" />
                            On Fire!
                          </Badge>
                        )}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteHabit(habit.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {habit.description && (
                      <p className="text-sm text-muted-foreground">{habit.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-center gap-1 text-orange-500 mb-1">
                          <Flame className="h-4 w-4" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">{streak}</p>
                        <p className="text-xs text-muted-foreground">Current Streak</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-center gap-1 text-yellow-500 mb-1">
                          <Award className="h-4 w-4" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">{longestStreak}</p>
                        <p className="text-xs text-muted-foreground">Longest Streak</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-center gap-1 text-green-500 mb-1">
                          <TrendingUp className="h-4 w-4" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">{completionRate}%</p>
                        <p className="text-xs text-muted-foreground">30-Day Rate</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-center gap-1 text-primary mb-1">
                          <Target className="h-4 w-4" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">{totalDone}</p>
                        <p className="text-xs text-muted-foreground">Total Completions</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">30-day completion</span>
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
        </Tabs>
      )}
    </div>
  );
}
