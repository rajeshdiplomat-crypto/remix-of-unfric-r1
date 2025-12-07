import { useState, useEffect } from "react";
import { format, startOfWeek, addDays, isSameDay, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Flame, Trash2, Calendar, BarChart3 } from "lucide-react";
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

    const startDate = format(subDays(new Date(), 30), "yyyy-MM-dd");
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

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i)
  );

  const monthDays = eachDayOfInterval({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  });

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
                  <div className="flex flex-wrap gap-1">
                    {monthDays.map((day) => (
                      <button
                        key={day.toString()}
                        onClick={() => toggleCompletion(habit.id, day)}
                        title={format(day, "MMM d")}
                        className={`w-6 h-6 rounded text-xs transition-all ${
                          isCompleted(habit.id, day)
                            ? "bg-primary text-primary-foreground"
                            : isToday(day)
                            ? "bg-muted ring-1 ring-primary"
                            : "bg-muted/50 hover:bg-muted"
                        }`}
                      >
                        {isToday(day) && !isCompleted(habit.id, day) && (
                          <span className="text-primary">•</span>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(), "MMMM yyyy")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
