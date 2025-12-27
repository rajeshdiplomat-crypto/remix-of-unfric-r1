import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Sparkles, Target, Heart, Home, DollarSign, Eye, Plus, ChevronDown,
  CheckCircle2, TrendingUp, Calendar, Flame, Award, ImagePlus, X,
  Lightbulb, ArrowRight, Clock, BarChart3, Edit, Zap, BookOpen
} from "lucide-react";
import { format, subDays, isSameDay, parseISO, startOfWeek, addDays, differenceInDays } from "date-fns";

const CATEGORY_ICONS: Record<string, typeof Target> = {
  wealth: DollarSign,
  health: Heart,
  love: Home,
  growth: Target,
  default: Target,
};

interface ManifestGoal {
  id: string;
  title: string;
  description: string | null;
  feeling_when_achieved: string | null;
  affirmations: string[];
  is_completed: boolean;
  created_at: string;
  category?: string;
  cover_image?: string;
  target_date?: string;
  visualization_images?: string[];
  woop?: {
    wish: string;
    outcome: string;
    obstacle: string;
    plan: string;
  };
  if_then_triggers?: Array<{ id: string; if_part: string; then_part: string }>;
  micro_step?: string;
}

interface JournalEntry {
  id: string;
  goal_id: string;
  gratitude: string | null;
  visualization: string | null;
  entry_date: string;
  created_at: string;
  note?: string;
}

interface GoalDetailPanelProps {
  selectedGoal: ManifestGoal | null;
  journalEntries: JournalEntry[];
  onCheckInToday: () => void;
  onEdit: () => void;
  onAddNote: (note: string) => void;
  onImageChange: (goalId: string, imageUrl: string | null) => void;
  onUpdateWoop: (goalId: string, woop: ManifestGoal["woop"]) => void;
  onAddIfThen: (goalId: string, trigger: { if_part: string; then_part: string }) => void;
  onUpdateMicroStep: (goalId: string, step: string) => void;
}

export function GoalDetailPanel({
  selectedGoal,
  journalEntries,
  onCheckInToday,
  onEdit,
  onAddNote,
  onImageChange,
  onUpdateWoop,
  onAddIfThen,
  onUpdateMicroStep,
}: GoalDetailPanelProps) {
  const [quickNote, setQuickNote] = useState("");
  const [woopOpen, setWoopOpen] = useState(false);
  const [ifThenOpen, setIfThenOpen] = useState(false);
  const [microStepOpen, setMicroStepOpen] = useState(false);
  const [newIfPart, setNewIfPart] = useState("");
  const [newThenPart, setNewThenPart] = useState("");
  const [localMicroStep, setLocalMicroStep] = useState("");
  const [localWoop, setLocalWoop] = useState({ wish: "", outcome: "", obstacle: "", plan: "" });
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Calculate metrics for selected goal
  const goalEntries = selectedGoal 
    ? journalEntries.filter(e => e.goal_id === selectedGoal.id)
    : [];

  const getStreak = (): number => {
    if (goalEntries.length === 0) return 0;
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const checkDate = subDays(new Date(), i);
      const hasEntry = goalEntries.some(e => isSameDay(parseISO(e.entry_date), checkDate));
      if (hasEntry) streak++;
      else if (i > 0) break;
    }
    return streak;
  };

  const getBestStreak = (): number => {
    if (goalEntries.length === 0) return 0;
    const sortedDates = goalEntries
      .map(e => parseISO(e.entry_date))
      .sort((a, b) => a.getTime() - b.getTime());
    
    let maxStreak = 1;
    let currentStreak = 1;
    
    for (let i = 1; i < sortedDates.length; i++) {
      const diff = differenceInDays(sortedDates[i], sortedDates[i - 1]);
      if (diff === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else if (diff > 1) {
        currentStreak = 1;
      }
    }
    return maxStreak;
  };

  const getWeekCompletion = (): number => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    let completed = 0;
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      if (goalEntries.some(e => isSameDay(parseISO(e.entry_date), day))) {
        completed++;
      }
    }
    return Math.round((completed / 7) * 100);
  };

  const getMissedDays = (): number => {
    if (!selectedGoal) return 0;
    const createdDate = parseISO(selectedGoal.created_at);
    const totalDays = differenceInDays(new Date(), createdDate) + 1;
    return Math.max(0, totalDays - goalEntries.length);
  };

  const getMostConsistentDay = (): string => {
    if (goalEntries.length === 0) return "—";
    const dayCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    goalEntries.forEach(e => {
      const day = parseISO(e.entry_date).getDay();
      dayCounts[day]++;
    });
    const maxDay = Object.entries(dayCounts).reduce((a, b) => b[1] > a[1] ? b : a);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[Number(maxDay[0])];
  };

  const getOnTrackStatus = (): "on-track" | "behind" | "ahead" => {
    if (!selectedGoal || goalEntries.length === 0) return "on-track";
    const createdDate = parseISO(selectedGoal.created_at);
    const expectedEntries = differenceInDays(new Date(), createdDate) + 1;
    const actual = goalEntries.length;
    if (actual >= expectedEntries) return actual > expectedEntries + 2 ? "ahead" : "on-track";
    return "behind";
  };

  const progress = Math.min(Math.round((goalEntries.length / 30) * 100), 100);
  const currentStreak = getStreak();
  const bestStreak = getBestStreak();
  const weekCompletion = getWeekCompletion();
  const missedDays = getMissedDays();
  const consistentDay = getMostConsistentDay();
  const onTrack = getOnTrackStatus();

  // Get last 7 days data for chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const hasEntry = goalEntries.some(e => isSameDay(parseISO(e.entry_date), date));
    return { date, hasEntry, completion: hasEntry ? 100 : 0 };
  });

  // Get last 30 days for heat strip
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i);
    const hasEntry = goalEntries.some(e => isSameDay(parseISO(e.entry_date), date));
    const isToday = isSameDay(date, new Date());
    return { date, hasEntry, isToday };
  });

  // Activity timeline
  const recentActivity = [...goalEntries]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedGoal) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File too large. Max 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        onImageChange(selectedGoal.id, ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddNote = () => {
    if (quickNote.trim()) {
      onAddNote(quickNote);
      setQuickNote("");
    }
  };

  const handleSaveWoop = () => {
    if (selectedGoal && (localWoop.wish || localWoop.outcome || localWoop.obstacle || localWoop.plan)) {
      onUpdateWoop(selectedGoal.id, localWoop);
    }
  };

  const handleAddIfThen = () => {
    if (selectedGoal && newIfPart.trim() && newThenPart.trim()) {
      onAddIfThen(selectedGoal.id, { if_part: newIfPart, then_part: newThenPart });
      setNewIfPart("");
      setNewThenPart("");
    }
  };

  const CategoryIcon = selectedGoal 
    ? (CATEGORY_ICONS[selectedGoal.category || "default"] || Target)
    : Target;

  return (
    <div className="w-[400px] flex-shrink-0 border-l border-border bg-muted/30">
      <div className="sticky top-4 h-[calc(100vh-32px)] overflow-auto">
        <ScrollArea className="h-full">
          <div className="space-y-4 p-4">
            {/* Header Card - Always Visible */}
            <Card className="p-5 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Goal Dashboard</p>
                  <p className="text-xs text-muted-foreground">Science-backed tools for success</p>
                </div>
              </div>
            </Card>

            {!selectedGoal ? (
              <>
                {/* Default State - No Goal Selected */}
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Today's Focus</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Select a goal to begin</p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Daily Affirmation</span>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
                    <p className="text-sm text-foreground italic">"I am capable of achieving anything I set my mind to"</p>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Visualization Guide</span>
                  </div>
                  <div className="space-y-2">
                    {["Close your eyes and breathe deeply", "Picture yourself achieving this goal", "Feel the emotions of success", "Express gratitude for this reality"].map((step, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0">{i + 1}</span>
                        <p className="text-sm text-foreground">{step}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Plus className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Quick Add</span>
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                      <Sparkles className="h-4 w-4" />Add Affirmation
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                      <BookOpen className="h-4 w-4" />Add Gratitude
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                      <CheckCircle2 className="h-4 w-4" />Quick Check-in
                    </Button>
                  </div>
                </Card>
              </>
            ) : (
              <>
                {/* A) Cover + Title */}
                <Card className="overflow-hidden">
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverUpload}
                  />
                  {selectedGoal.cover_image ? (
                    <div className="relative h-32 w-full group">
                      <img src={selectedGoal.cover_image} alt="" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => coverInputRef.current?.click()}>Replace</Button>
                        <Button size="sm" variant="destructive" onClick={() => onImageChange(selectedGoal.id, null)}>Remove</Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => coverInputRef.current?.click()}
                      className="h-24 w-full border-b border-border flex flex-col items-center justify-center gap-1 hover:bg-muted/50 transition-colors"
                    >
                      <ImagePlus className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Upload cover image</span>
                    </button>
                  )}
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${selectedGoal.is_completed ? "bg-green-500/10" : "bg-primary/10"}`}>
                        {selectedGoal.is_completed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <CategoryIcon className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{selectedGoal.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs capitalize">{selectedGoal.category || "General"}</Badge>
                          <Badge variant={selectedGoal.is_completed ? "default" : "outline"} className={selectedGoal.is_completed ? "bg-green-500" : ""}>
                            {selectedGoal.is_completed ? "Completed" : "Active"}
                          </Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* B) Progress + Check-in */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2 mb-4" />
                  <Button className="w-full mb-3" onClick={onCheckInToday}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Check in today
                  </Button>
                  <div className="flex gap-2">
                    <Input
                      value={quickNote}
                      onChange={(e) => setQuickNote(e.target.value)}
                      placeholder="How did you act today?"
                      className="flex-1 text-sm"
                    />
                    <Button variant="outline" size="icon" onClick={handleAddNote} disabled={!quickNote.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>

                {/* C) Science-backed Goal Tools */}
                {/* WOOP Plan */}
                <Collapsible open={woopOpen} onOpenChange={setWoopOpen}>
                  <Card className="overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">WOOP Plan</span>
                          <Badge variant="secondary" className="text-[10px]">Evidence-based</Badge>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${woopOpen ? "rotate-180" : ""}`} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 space-y-3">
                        <p className="text-xs text-muted-foreground">Mental contrasting + implementation intentions</p>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Wish (What do you want?)</label>
                          <Input
                            value={localWoop.wish || selectedGoal.woop?.wish || ""}
                            onChange={(e) => setLocalWoop({ ...localWoop, wish: e.target.value })}
                            placeholder="Your deepest wish..."
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Outcome (Best result?)</label>
                          <Input
                            value={localWoop.outcome || selectedGoal.woop?.outcome || ""}
                            onChange={(e) => setLocalWoop({ ...localWoop, outcome: e.target.value })}
                            placeholder="Best possible outcome..."
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Obstacle (What's in the way?)</label>
                          <Input
                            value={localWoop.obstacle || selectedGoal.woop?.obstacle || ""}
                            onChange={(e) => setLocalWoop({ ...localWoop, obstacle: e.target.value })}
                            placeholder="Main internal obstacle..."
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Plan (If obstacle, then I will...)</label>
                          <Input
                            value={localWoop.plan || selectedGoal.woop?.plan || ""}
                            onChange={(e) => setLocalWoop({ ...localWoop, plan: e.target.value })}
                            placeholder="If [obstacle] then I will..."
                            className="mt-1"
                          />
                        </div>
                        <Button size="sm" onClick={handleSaveWoop} className="w-full">Save WOOP Plan</Button>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* If-Then Triggers */}
                <Collapsible open={ifThenOpen} onOpenChange={setIfThenOpen}>
                  <Card className="overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <ArrowRight className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">If–Then Triggers</span>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${ifThenOpen ? "rotate-180" : ""}`} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 space-y-3">
                        <p className="text-xs text-muted-foreground">Implementation intentions for automatic action</p>
                        {(selectedGoal.if_then_triggers || []).map((trigger, i) => (
                          <div key={trigger.id || i} className="bg-muted/50 rounded-lg p-3 text-sm">
                            <span className="text-primary font-medium">If</span> {trigger.if_part}{" "}
                            <span className="text-primary font-medium">→ then</span> {trigger.then_part}
                          </div>
                        ))}
                        <div className="space-y-2">
                          <Input
                            value={newIfPart}
                            onChange={(e) => setNewIfPart(e.target.value)}
                            placeholder="If..."
                          />
                          <Input
                            value={newThenPart}
                            onChange={(e) => setNewThenPart(e.target.value)}
                            placeholder="Then I will..."
                          />
                          <Button size="sm" onClick={handleAddIfThen} className="w-full" disabled={!newIfPart.trim() || !newThenPart.trim()}>
                            <Plus className="h-4 w-4 mr-1" />Add Trigger
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Micro-step */}
                <Collapsible open={microStepOpen} onOpenChange={setMicroStepOpen}>
                  <Card className="overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Next Micro-step</span>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${microStepOpen ? "rotate-180" : ""}`} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 space-y-3">
                        <p className="text-xs text-muted-foreground">One small action for today</p>
                        {selectedGoal.micro_step ? (
                          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                            <p className="text-sm font-medium">{selectedGoal.micro_step}</p>
                          </div>
                        ) : null}
                        <div className="flex gap-2">
                          <Input
                            value={localMicroStep}
                            onChange={(e) => setLocalMicroStep(e.target.value)}
                            placeholder="What's one tiny action?"
                          />
                          <Button
                            size="icon"
                            onClick={() => {
                              if (localMicroStep.trim()) {
                                onUpdateMicroStep(selectedGoal.id, localMicroStep);
                                setLocalMicroStep("");
                              }
                            }}
                            disabled={!localMicroStep.trim()}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* D) Streak + Consistency */}
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Flame className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Consistency</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-foreground">{currentStreak}</p>
                      <p className="text-xs text-muted-foreground">Day Streak</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-foreground">{bestStreak}</p>
                      <p className="text-xs text-muted-foreground">Best Streak</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-foreground">{weekCompletion}%</p>
                      <p className="text-xs text-muted-foreground">This Week</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-foreground">{missedDays}</p>
                      <p className="text-xs text-muted-foreground">Missed Days</p>
                    </div>
                  </div>
                </Card>

                {/* E) Mini Insights */}
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Insights</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Most consistent day</span>
                      <span className="font-medium">{consistentDay}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant={onTrack === "on-track" ? "default" : onTrack === "ahead" ? "secondary" : "destructive"} className={onTrack === "on-track" ? "bg-green-500" : onTrack === "ahead" ? "bg-blue-500" : ""}>
                        {onTrack === "on-track" ? "On Track" : onTrack === "ahead" ? "Ahead" : "Behind"}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Last 7 Days Chart */}
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2">Last 7 Days</p>
                    <div className="flex items-end justify-between gap-1 h-12">
                      {last7Days.map((day, i) => (
                        <TooltipProvider key={i}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex-1 flex flex-col items-center gap-1">
                                <div
                                  className={`w-full rounded-sm transition-all ${day.hasEntry ? "bg-primary" : "bg-muted"}`}
                                  style={{ height: day.hasEntry ? "32px" : "8px" }}
                                />
                                <span className="text-[10px] text-muted-foreground">{format(day.date, "EEE")}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{format(day.date, "MMM d")}: {day.hasEntry ? "Completed" : "Missed"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  </div>

                  {/* Last 30 Days Heat Strip */}
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2">Last 30 Days</p>
                    <div className="flex flex-wrap gap-1">
                      {last30Days.map((day, i) => (
                        <TooltipProvider key={i}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={`h-3 w-3 rounded-sm transition-all ${
                                  day.hasEntry
                                    ? "bg-primary"
                                    : "bg-muted"
                                } ${day.isToday ? "ring-1 ring-primary ring-offset-1" : ""}`}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{format(day.date, "MMM d")}: {day.hasEntry ? "Done" : "Missed"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* F) Activity / Evidence Log */}
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Activity Log</span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-auto">
                    {recentActivity.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
                    ) : (
                      recentActivity.map((entry) => (
                        <div key={entry.id} className="flex items-start gap-2 text-sm">
                          <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-foreground truncate">{entry.gratitude || entry.visualization || "Check-in"}</p>
                            <p className="text-xs text-muted-foreground">{format(parseISO(entry.entry_date), "MMM d, yyyy")}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}