import { useState, useEffect, useRef, useCallback } from "react";
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
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Heart, 
  Wind, 
  Timer, 
  CalendarIcon, 
  PenLine, 
  Volume2, 
  Play, 
  Pause, 
  ChevronRight,
  BarChart3,
  TrendingUp,
} from "lucide-react";

// Emotion wheel data with primary and secondary emotions
const emotionWheel = {
  happy: {
    emoji: "😊",
    color: "bg-yellow-500/20 border-yellow-500/50",
    secondary: ["joyful", "content", "proud", "optimistic", "playful", "peaceful"]
  },
  sad: {
    emoji: "😢",
    color: "bg-blue-500/20 border-blue-500/50",
    secondary: ["lonely", "disappointed", "hopeless", "grieving", "hurt", "melancholic"]
  },
  angry: {
    emoji: "😤",
    color: "bg-red-500/20 border-red-500/50",
    secondary: ["frustrated", "irritated", "resentful", "jealous", "annoyed", "furious"]
  },
  fearful: {
    emoji: "😰",
    color: "bg-purple-500/20 border-purple-500/50",
    secondary: ["anxious", "worried", "nervous", "insecure", "overwhelmed", "scared"]
  },
  surprised: {
    emoji: "😲",
    color: "bg-amber-500/20 border-amber-500/50",
    secondary: ["amazed", "confused", "shocked", "excited", "stunned", "startled"]
  },
  disgusted: {
    emoji: "🤢",
    color: "bg-green-600/20 border-green-600/50",
    secondary: ["disapproving", "embarrassed", "repelled", "judgemental", "uncomfortable", "revolted"]
  },
};

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
  
  // Main state
  const [selectedPrimary, setSelectedPrimary] = useState<string | null>(null);
  const [selectedSecondary, setSelectedSecondary] = useState<string | null>(null);
  const [intensity, setIntensity] = useState([5]);
  const [triggers, setTriggers] = useState<string>("");
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
    if (!user || !selectedPrimary) {
      toast({ title: "Error", description: "Please select an emotion", variant: "destructive" });
      return;
    }

    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    const emotionValue = selectedSecondary 
      ? `${selectedPrimary}:${selectedSecondary}:${intensity[0]}`
      : `${selectedPrimary}:${intensity[0]}`;

    const { error } = await supabase.from("emotions").upsert({
      user_id: user.id,
      emotion: emotionValue,
      tags: triggers.split(",").map((t) => t.trim()).filter(Boolean),
      notes,
      entry_date: today,
    }, { onConflict: "user_id,entry_date" });

    setSaving(false);

    if (error) {
      toast({ title: "Error", description: error.message || "Failed to save emotion", variant: "destructive" });
    } else {
      toast({ title: "Saved!", description: "Your emotion has been recorded" });
      fetchPreviousEntries();
      // Reset form
      setSelectedPrimary(null);
      setSelectedSecondary(null);
      setIntensity([5]);
      setTriggers("");
      setNotes("");
    }
  };

  // Sound functions
  const playBreathingSound = useCallback((phase: string) => {
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
  }, [soundEnabled]);

  const playMeditationBell = useCallback(() => {
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
  }, [meditationSound]);

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
  }, [breathingActive, breathingPhase, selectedExercise, playBreathingSound]);

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
  }, [meditationActive, meditationRemaining, toast, playMeditationBell]);

  const phases = ["Inhale", "Hold", "Exhale", "Hold"];
  const currentPhase = phases[breathingPhase];

  // Analytics calculations
  const getEmotionStats = () => {
    const emotionCounts: Record<string, number> = {};
    previousEntries.forEach(entry => {
      const primary = entry.emotion.split(':')[0];
      emotionCounts[primary] = (emotionCounts[primary] || 0) + 1;
    });
    
    const sorted = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, 3);
  };

  const topEmotions = getEmotionStats();

  const parseEmotionDisplay = (emotionStr: string) => {
    const parts = emotionStr.split(':');
    const primary = parts[0];
    const data = emotionWheel[primary as keyof typeof emotionWheel];
    return {
      primary,
      emoji: data?.emoji || "😊",
      secondary: parts[1] && !Number(parts[1]) ? parts[1] : null,
      intensity: parts[parts.length - 1],
    };
  };

  return (
    <main className="flex-1 w-full px-8 lg:px-10 py-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            My Emotions
          </h1>
          <p className="text-muted-foreground mt-1">Check in with yourself and practice mindfulness</p>
        </div>
        
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <CalendarIcon className="h-5 w-5" />
              {entriesWithDates.length > 0 && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />
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
                    const parsed = parseEmotionDisplay(entry.emotion);
                    setSelectedPrimary(parsed.primary);
                    setSelectedSecondary(parsed.secondary);
                    setIntensity([parseInt(parsed.intensity) || 5]);
                    setNotes(entry.notes || "");
                    setTriggers(entry.tags?.join(", ") || "");
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
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <Tabs defaultValue="checkin" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="checkin" className="text-xs sm:text-sm">
            <Heart className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Check-in</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm">
            <BarChart3 className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="breathing" className="text-xs sm:text-sm">
            <Wind className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Breathing</span>
          </TabsTrigger>
          <TabsTrigger value="meditation" className="text-xs sm:text-sm">
            <Timer className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Meditation</span>
          </TabsTrigger>
        </TabsList>

        {/* Check-in Tab with Emotion Wheel */}
        <TabsContent value="checkin" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>How are you feeling?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Emotion Wheel - Primary */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3">Select your primary emotion:</p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {Object.entries(emotionWheel).map(([emotion, data]) => (
                    <button
                      key={emotion}
                      onClick={() => {
                        setSelectedPrimary(emotion);
                        setSelectedSecondary(null);
                      }}
                      className={`p-3 sm:p-4 rounded-xl transition-all hover:scale-105 border-2 ${
                        selectedPrimary === emotion
                          ? `${data.color} ring-2 ring-primary scale-105`
                          : `${data.color.split(' ')[0]} border-transparent`
                      }`}
                    >
                      <div className="text-2xl sm:text-3xl mb-1">{data.emoji}</div>
                      <div className="text-xs font-medium text-foreground capitalize">{emotion}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Secondary Emotions */}
              {selectedPrimary && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-sm font-medium text-muted-foreground mb-3">
                    More specifically, you feel:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {emotionWheel[selectedPrimary as keyof typeof emotionWheel]?.secondary.map((sec) => (
                      <Badge
                        key={sec}
                        variant={selectedSecondary === sec ? "default" : "outline"}
                        className="cursor-pointer py-1.5 px-3 capitalize hover:bg-primary/20"
                        onClick={() => setSelectedSecondary(selectedSecondary === sec ? null : sec)}
                      >
                        {sec}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Intensity Slider */}
              {selectedPrimary && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300 delay-100">
                  <p className="text-sm font-medium text-muted-foreground mb-3">
                    How intense is this feeling? ({intensity[0]}/10)
                  </p>
                  <Slider
                    value={intensity}
                    onValueChange={setIntensity}
                    max={10}
                    min={1}
                    step={1}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Mild</span>
                    <span>Moderate</span>
                    <span>Intense</span>
                  </div>
                </div>
              )}

              {/* Triggers & Notes */}
              {selectedPrimary && (
                <div className="space-y-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-2 duration-300 delay-200">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Triggers (comma separated)
                    </label>
                    <Input
                      value={triggers}
                      onChange={(e) => setTriggers(e.target.value)}
                      placeholder="work, family, health..."
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
                  <div className="flex gap-3 flex-wrap">
                    <Button onClick={saveEmotion} disabled={saving} className="flex-1 sm:flex-none">
                      {saving ? "Saving..." : "Save Check-in"}
                    </Button>
                    <Button onClick={() => navigate("/journal")} variant="outline" className="flex items-center gap-2">
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
                <CardTitle className="text-lg">Recent Check-ins</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {previousEntries.slice(0, 10).map((entry) => {
                      const parsed = parseEmotionDisplay(entry.emotion);
                      return (
                        <div
                          key={entry.id}
                          className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="text-2xl">{parsed.emoji}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-foreground capitalize">{parsed.primary}</span>
                              {parsed.secondary && (
                                <Badge variant="secondary" className="text-xs capitalize">
                                  {parsed.secondary}
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {parsed.intensity}/10
                              </Badge>
                            </div>
                            {entry.notes && (
                              <p className="text-sm text-muted-foreground truncate">{entry.notes}</p>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(entry.created_at), "MMM d")}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Check-ins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{previousEntries.length}</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Most Frequent</CardTitle>
              </CardHeader>
              <CardContent>
                {topEmotions[0] ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {emotionWheel[topEmotions[0][0] as keyof typeof emotionWheel]?.emoji}
                      </span>
                      <span className="text-xl font-bold capitalize">{topEmotions[0][0]}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{topEmotions[0][1]} times</p>
                  </>
                ) : (
                  <p className="text-muted-foreground">No data yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Current Streak</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  <span className="text-3xl font-bold">
                    {(() => {
                      let streak = 0;
                      const today = new Date();
                      for (let i = 0; i < 30; i++) {
                        const checkDate = format(new Date(today.getTime() - i * 86400000), "yyyy-MM-dd");
                        if (entriesWithDates.includes(checkDate)) {
                          streak++;
                        } else if (i > 0) {
                          break;
                        }
                      }
                      return streak;
                    })()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">days in a row</p>
              </CardContent>
            </Card>
          </div>

          {/* Emotion Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Emotion Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topEmotions.map(([emotion, count]) => (
                  <div key={emotion} className="flex items-center gap-3">
                    <span className="text-xl">
                      {emotionWheel[emotion as keyof typeof emotionWheel]?.emoji}
                    </span>
                    <span className="w-20 capitalize text-sm">{emotion}</span>
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ width: `${(count / previousEntries.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {Math.round((count / previousEntries.length) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Breathing Tab */}
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
                  className={`w-40 h-40 sm:w-48 sm:h-48 rounded-full flex items-center justify-center transition-all duration-1000 ${
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
                    <div className="text-xl sm:text-2xl font-bold text-foreground">
                      {breathingActive ? currentPhase : "Ready"}
                    </div>
                    {breathingActive && (
                      <div className="text-3xl sm:text-4xl font-mono mt-2 text-primary">
                        {selectedExercise.pattern[breathingPhase] - breathingSeconds}
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  size="lg"
                  className="mt-8"
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
                  {breathingActive ? (
                    <>
                      <Pause className="h-5 w-5 mr-2" /> Stop
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" /> Start Breathing
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meditation Tab */}
        <TabsContent value="meditation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Meditation Timer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[150px]">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Duration</label>
                  <Select
                    value={meditationTime.toString()}
                    onValueChange={(v) => {
                      const time = parseInt(v);
                      setMeditationTime(time);
                      setMeditationRemaining(time);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">1 minute</SelectItem>
                      <SelectItem value="180">3 minutes</SelectItem>
                      <SelectItem value="300">5 minutes</SelectItem>
                      <SelectItem value="600">10 minutes</SelectItem>
                      <SelectItem value="900">15 minutes</SelectItem>
                      <SelectItem value="1200">20 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[150px]">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Sound</label>
                  <Select value={meditationSound} onValueChange={(v: "none" | "nature" | "bells") => setMeditationSound(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="nature">Nature</SelectItem>
                      <SelectItem value="bells">Singing Bowl</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col items-center py-8">
                <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-muted flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl sm:text-5xl font-mono text-foreground">
                      {Math.floor(meditationRemaining / 60)}:{(meditationRemaining % 60).toString().padStart(2, "0")}
                    </div>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="mt-8"
                  onClick={() => {
                    if (meditationActive) {
                      setMeditationActive(false);
                    } else {
                      setMeditationActive(true);
                      playMeditationBell();
                    }
                  }}
                >
                  {meditationActive ? (
                    <>
                      <Pause className="h-5 w-5 mr-2" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" /> Start Meditation
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
