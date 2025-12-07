import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Heart, Wind, Timer, CalendarIcon, PenLine, Volume2, Music, Play, Pause, ChevronRight } from "lucide-react";

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
  { name: "Energizing", pattern: [2, 0, 2, 0], description: "Quick breaths: Inhale 2s → Exhale 2s" },
  { name: "Deep Relaxation", pattern: [5, 5, 5, 5], description: "Deep: Inhale 5s → Hold 5s → Exhale 5s → Hold 5s" },
];

interface EmotionEntry {
  id: string;
  emotion: string;
  notes: string | null;
  tags: string[];
  entry_date: string;
  created_at: string;
}

export default function Emotions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [tags, setTags] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [previousEntries, setPreviousEntries] = useState<EmotionEntry[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [entriesWithDates, setEntriesWithDates] = useState<string[]>([]);

  // Breathing exercise state
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState(0);
  const [breathingSeconds, setBreathingSeconds] = useState(0);
  const [selectedExercise, setSelectedExercise] = useState(breathingExercises[0]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Meditation state
  const [meditationActive, setMeditationActive] = useState(false);
  const [meditationTime, setMeditationTime] = useState(300);
  const [meditationRemaining, setMeditationRemaining] = useState(300);
  const [meditationSound, setMeditationSound] = useState<"none" | "nature" | "bells">("nature");

  useEffect(() => {
    if (!user) return;
    fetchPreviousEntries();
  }, [user]);

  const fetchPreviousEntries = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("emotions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (data) {
      setPreviousEntries(data);
      setEntriesWithDates(data.map(e => e.entry_date));
    }
  };

  const saveEmotion = async () => {
    if (!user || !selectedEmotion) {
      toast({ title: "Error", description: "Please select an emotion", variant: "destructive" });
      return;
    }

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
      toast({ title: "Error", description: error.message || "Failed to save emotion", variant: "destructive" });
    } else {
      toast({ title: "Saved!", description: "Your emotion has been recorded" });
      fetchPreviousEntries();
    }
  };

  const goToJournal = () => {
    navigate("/journal");
  };

  // Sound functions
  const playBreathingSound = (phase: string) => {
    if (!soundEnabled) return;
    
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    if (phase === "Inhale") {
      oscillator.frequency.value = 440;
    } else if (phase === "Exhale") {
      oscillator.frequency.value = 330;
    } else {
      oscillator.frequency.value = 380;
    }
    
    gainNode.gain.value = 0.1;
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.15);
  };

  const playMeditationBell = () => {
    if (meditationSound === "none") return;
    
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.value = 528;
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2);
    
    oscillator.start();
    oscillator.stop(ctx.currentTime + 2);
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
            playBreathingSound(phases[next]);
            return next;
          });
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [breathingActive, breathingPhase, selectedExercise, soundEnabled]);

  // Meditation timer logic
  useEffect(() => {
    if (!meditationActive || meditationRemaining <= 0) return;

    const interval = setInterval(() => {
      setMeditationRemaining((prev) => {
        if (prev <= 1) {
          setMeditationActive(false);
          playMeditationBell();
          toast({ title: "Meditation Complete", description: "Great job! You've completed your meditation session." });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [meditationActive, meditationRemaining, toast, meditationSound]);

  const phases = ["Inhale", "Hold", "Exhale", "Hold"];
  const currentPhase = phases[breathingPhase];

  const getEmotionEmoji = (label: string) => {
    return emotions.find(e => e.label === label)?.emoji || "😊";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Emotions</h1>
          <p className="text-muted-foreground mt-1">Check in with yourself and practice mindfulness</p>
        </div>
        
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <CalendarIcon className="h-5 w-5" />
              {entriesWithDates.length > 0 && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              onSelect={(date) => {
                if (date) {
                  const dateStr = format(date, "yyyy-MM-dd");
                  const entry = previousEntries.find(e => e.entry_date === dateStr);
                  if (entry) {
                    setSelectedEmotion(entry.emotion);
                    setNotes(entry.notes || "");
                    setTags(entry.tags?.join(", ") || "");
                  }
                }
                setCalendarOpen(false);
              }}
              modifiers={{
                hasEntry: (date) => entriesWithDates.includes(format(date, "yyyy-MM-dd")),
              }}
              modifiersStyles={{
                hasEntry: { backgroundColor: "hsl(var(--primary) / 0.2)", borderRadius: "50%" },
              }}
            />
          </PopoverContent>
        </Popover>
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
                  <div className="flex gap-3">
                    <Button onClick={saveEmotion} disabled={saving} className="flex-1">
                      {saving ? "Saving..." : "Save Emotion"}
                    </Button>
                    <Button onClick={goToJournal} variant="outline" className="flex items-center gap-2">
                      <PenLine className="h-4 w-4" />
                      Go to Journal
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Previous Entries */}
          {previousEntries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Previous Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {previousEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="text-2xl">{getEmotionEmoji(entry.emotion)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{entry.emotion}</span>
                            {entry.tags && entry.tags.length > 0 && (
                              <div className="flex gap-1">
                                {entry.tags.slice(0, 2).map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          {entry.notes && (
                            <p className="text-sm text-muted-foreground truncate">{entry.notes}</p>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(entry.created_at), "MMM d, h:mm a")}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
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

              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={soundEnabled ? "bg-primary/10" : ""}
                >
                  <Volume2 className="h-4 w-4 mr-2" />
                  Sound {soundEnabled ? "On" : "Off"}
                </Button>
              </div>

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
                      playBreathingSound("Inhale");
                    }
                  }}
                >
                  {breathingActive ? <Pause className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
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

              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Sound:</label>
                <Select value={meditationSound} onValueChange={(v) => setMeditationSound(v as any)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Sound</SelectItem>
                    <SelectItem value="nature">Nature Sounds</SelectItem>
                    <SelectItem value="bells">Meditation Bells</SelectItem>
                  </SelectContent>
                </Select>
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
                      playMeditationBell();
                    }
                  }}
                >
                  {meditationActive ? <Pause className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
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
