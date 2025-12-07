import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Sparkles, Target, Heart, Check, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ManifestGoal {
  id: string;
  title: string;
  description: string | null;
  feeling_when_achieved: string | null;
  affirmations: string[];
  is_completed: boolean;
  created_at: string;
}

export default function Manifest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<ManifestGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<ManifestGoal | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [feeling, setFeeling] = useState("");
  const [affirmations, setAffirmations] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchGoals();
  }, [user]);

  const fetchGoals = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("manifest_goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setGoals(data);
    }
    setLoading(false);
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
        fetchGoals();
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
        fetchGoals();
        setDialogOpen(false);
      }
    }

    setSaving(false);
  };

  const toggleComplete = async (goal: ManifestGoal) => {
    const { error } = await supabase
      .from("manifest_goals")
      .update({ is_completed: !goal.is_completed })
      .eq("id", goal.id);

    if (!error) {
      fetchGoals();
      toast({
        title: goal.is_completed ? "Reopened" : "Manifested!",
        description: goal.is_completed ? "Goal reopened" : "Congratulations on achieving your goal!",
      });
    }
  };

  const deleteGoal = async (id: string) => {
    const { error } = await supabase.from("manifest_goals").delete().eq("id", id);

    if (!error) {
      fetchGoals();
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
          {goals.map((goal) => (
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
                  {goal.is_completed && (
                    <Badge variant="secondary" className="bg-green-500/20 text-green-600">
                      Manifested
                    </Badge>
                  )}
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
          ))}
        </div>
      )}
    </div>
  );
}
