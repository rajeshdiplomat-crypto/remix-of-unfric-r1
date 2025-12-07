import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Heart, Wind, Timer } from "lucide-react";

const emotions = [
  { emoji: "😊", label: "Happy", color: "bg-yellow-500/20" },
  { emoji: "😢", label: "Sad", color: "bg-blue-500/20" },
  { emoji: "😤", label: "Angry", color: "bg-red-500/20" },
  { emoji: "😰", label: "Anxious", color: "bg-purple-500/20" },
  { emoji: "😌", label: "Calm", color: "bg-green-500/20" },
  { emoji: "😴", label: "Tired", color: "bg-gray-500/20" },
  { emoji: "🥰", label: "Loved", color: "bg-pink-500/20" },
  { emoji: "😐", label: "Neutral", color: "bg-slate-500/20" },
  { emoji: "🤗", label: "Grateful", color: "bg-orange-500/20" },
  { emoji: "😔", label: "Lonely", color: "bg-indigo-500/20" },
  { emoji: "🤩", label: "Excited", color: "bg-amber-500/20" },
  { emoji: "😟", label: "Worried", color: "bg-cyan-500/20" },
];

const breathingExercises = [
  { name: "Box Breathing", pattern: [4, 4, 4, 4], description: "Inhale 4s → Hold 4s → Exhale 4s → Hold 4s" },
  { name: "4-7-8 Relaxing", pattern: [4, 7, 8, 0], description: "Inhale 4s → Hold 7s → Exhale 8s" },
  { name: "Calm Breath", pattern: [4, 0, 6, 0], description: "Inhale 4s → Exhale 6s" },
];

export default function Emotions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [tags, setTags] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [todayEmotion, setTodayEmotion] = useState<string | null>(null);

  // Breathing exercise state
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState(0);
  const [breathingSeconds, setBreathingSeconds] = useState(0);
  const [selectedExercise, setSelectedExercise] = useState(breathingExercises[0]);

  // Meditation state
  const [meditationActive, setMeditationActive] = useState(false);
  const [meditationTime, setMeditationTime] = useState(300);
  const [meditationRemaining, setMeditationRemaining] = useState(300);

  useEffect(() => {
    if (!user) return;
    
    const fetchTodayEmotion = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("emotions")
        .select("emotion")
        .eq("user_id", user.id)
        .eq("entry_date", today)
        .maybeSingle();
      
      if (data) {
        setTodayEmotion(data.emotion);
        setSelectedEmotion(data.emotion);
      }
    };

    fetchTodayEmotion();
  }, [user]);

  const saveEmotion = async () => {
    if (!user || !selectedEmotion) return;

    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    
    const { error } = await supabase.from("emotions").upsert({
      user_id: user.id,
      emotion: selectedEmotion,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      notes,
      entry_date: today,
    }, { onConflict: "user_id,entry_date" });

    setSaving(false);

    if (error) {
      toast({ title: "Error", description: "Failed to save emotion", variant: "destructive" });
    } else {
      toast({ title: "Saved!", description: "Your emotion has been recorded" });
      setTodayEmotion(selectedEmotion);
    }
  };

  // Breathing exercise logic
  useEffect(() => {
    if (!breathingActive) return;

    const phases = ["Inhale", "Hold", "Exhale", "Hold"];
    const pattern = selectedExercise.pattern;
    
    const interval = setInterval(() => {
      setBreathingSeconds((prev) => {
        if (prev >= pattern[breathingPhase] - 1) {
          setBreathingPhase((p) => {
            let next = (p + 1) % 4;
            while (pattern[next] === 0) {
              next = (next + 1) % 4;
            }
            return next;
          });
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [breathingActive, breathingPhase, selectedExercise]);

  // Meditation timer logic
  useEffect(() => {
    if (!meditationActive || meditationRemaining <= 0) return;

    const interval = setInterval(() => {
      setMeditationRemaining((prev) => {
        if (prev <= 1) {
          setMeditationActive(false);
          toast({ title: "Meditation Complete", description: "Great job! You've completed your meditation session." });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [meditationActive, meditationRemaining, toast]);

  const phases = ["Inhale", "Hold", "Exhale", "Hold"];
  const currentPhase = phases[breathingPhase];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Emotions</h1>
        <p className="text-muted-foreground mt-1">Check in with yourself and practice mindfulness</p>
      </div>

      <Tabs defaultValue="checkin" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="checkin">
            <Heart className="h-4 w-4 mr-2" />
            Check-in
          </TabsTrigger>
          <TabsTrigger value="breathing">
            <Wind className="h-4 w-4 mr-2" />
            Breathing
          </TabsTrigger>
          <TabsTrigger value="meditation">
            <Timer className="h-4 w-4 mr-2" />
            Meditation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checkin" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>How are you feeling today?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                {emotions.map((emotion) => (
                  <button
                    key={emotion.label}
                    onClick={() => setSelectedEmotion(emotion.label)}
                    className={`p-4 rounded-xl transition-all hover:scale-105 ${
                      selectedEmotion === emotion.label
                        ? "ring-2 ring-primary scale-105"
                        : ""
                    } ${emotion.color}`}
                  >
                    <div className="text-3xl mb-1">{emotion.emoji}</div>
                    <div className="text-xs font-medium text-foreground">{emotion.label}</div>
                  </button>
                ))}
              </div>

              {selectedEmotion && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Add tags (comma separated)
                    </label>
                    <Input
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="work, stress, family..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Notes (optional)
                    </label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="What's on your mind?"
                      rows={3}
                    />
                  </div>
                  <Button onClick={saveEmotion} disabled={saving} className="w-full">
                    {saving ? "Saving..." : todayEmotion ? "Update Today's Emotion" : "Save Emotion"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breathing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Breathing Exercises</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {breathingExercises.map((exercise) => (
                  <Badge
                    key={exercise.name}
                    variant={selectedExercise.name === exercise.name ? "default" : "outline"}
                    className="cursor-pointer py-2 px-4"
                    onClick={() => {
                      setSelectedExercise(exercise);
                      setBreathingActive(false);
                      setBreathingPhase(0);
                      setBreathingSeconds(0);
                    }}
                  >
                    {exercise.name}
                  </Badge>
                ))}
              </div>

              <p className="text-sm text-muted-foreground">{selectedExercise.description}</p>

              <div className="flex flex-col items-center py-8">
                <div
                  className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-1000 ${
                    breathingActive
                      ? currentPhase === "Inhale"
                        ? "scale-110 bg-primary/20"
                        : currentPhase === "Exhale"
                        ? "scale-90 bg-primary/10"
                        : "bg-primary/15"
                      : "bg-muted"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">
                      {breathingActive ? currentPhase : "Ready"}
                    </div>
                    {breathingActive && (
                      <div className="text-4xl font-mono mt-2 text-primary">
                        {selectedExercise.pattern[breathingPhase] - breathingSeconds}
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  className="mt-8"
                  size="lg"
                  onClick={() => {
                    if (breathingActive) {
                      setBreathingActive(false);
                      setBreathingPhase(0);
                      setBreathingSeconds(0);
                    } else {
                      setBreathingActive(true);
                    }
                  }}
                >
                  {breathingActive ? "Stop" : "Start Breathing"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meditation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Meditation Timer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {[1, 3, 5, 10, 15, 20].map((mins) => (
                  <Badge
                    key={mins}
                    variant={meditationTime === mins * 60 ? "default" : "outline"}
                    className="cursor-pointer py-2 px-4"
                    onClick={() => {
                      if (!meditationActive) {
                        setMeditationTime(mins * 60);
                        setMeditationRemaining(mins * 60);
                      }
                    }}
                  >
                    {mins} min
                  </Badge>
                ))}
              </div>

              <div className="flex flex-col items-center py-8">
                <div className="w-48 h-48 rounded-full bg-primary/10 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-mono font-bold text-foreground">
                      {Math.floor(meditationRemaining / 60)}:
                      {(meditationRemaining % 60).toString().padStart(2, "0")}
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                      {meditationActive ? "Focus on your breath" : "Choose duration"}
                    </div>
                  </div>
                </div>

                <Button
                  className="mt-8"
                  size="lg"
                  onClick={() => {
                    if (meditationActive) {
                      setMeditationActive(false);
                      setMeditationRemaining(meditationTime);
                    } else {
                      setMeditationActive(true);
                    }
                  }}
                >
                  {meditationActive ? "Stop" : "Start Meditation"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
