import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Play,
  Check,
  Camera,
  Lock,
  ChevronRight,
  X,
  Clock,
  ImagePlus,
  Trash2,
  Plus,
  Sparkles,
  Flame,
} from "lucide-react";
import {
  type ManifestGoal,
  type ManifestDailyPractice,
  type ProofEntry,
  type ActEntry,
  type VisualizationEntry,
  DAILY_PRACTICE_KEY,
} from "./types";
import { ManifestVisualizationMode } from "./ManifestVisualizationMode";
import { format } from "date-fns";
import confetti from "canvas-confetti";
import { toast } from "sonner";

interface ManifestPracticePanelProps {
  goal: ManifestGoal;
  streak: number;
  onClose: () => void;
  onPracticeComplete: (practice: ManifestDailyPractice) => void;
}

export function ManifestPracticePanel({ goal, streak, onClose, onPracticeComplete }: ManifestPracticePanelProps) {
  const today = format(new Date(), "yyyy-MM-dd");
  const proofImageInputRef = useRef<HTMLInputElement>(null);

  const loadTodaysPractice = (): Partial<ManifestDailyPractice> => {
    const stored = localStorage.getItem(DAILY_PRACTICE_KEY);
    if (stored) {
      const all = JSON.parse(stored);
      return all[`${goal.id}_${today}`] || {};
    }
    return {};
  };

  const savePractice = (practice: Partial<ManifestDailyPractice>) => {
    const stored = localStorage.getItem(DAILY_PRACTICE_KEY);
    const all = stored ? JSON.parse(stored) : {};
    all[`${goal.id}_${today}`] = { ...all[`${goal.id}_${today}`], ...practice };
    localStorage.setItem(DAILY_PRACTICE_KEY, JSON.stringify(all));
  };

  const [visualizations, setVisualizations] = useState<VisualizationEntry[]>([]);
  const [acts, setActs] = useState<ActEntry[]>([]);
  const [proofs, setProofs] = useState<ProofEntry[]>([]);

  const [currentActText, setCurrentActText] = useState("");
  const [currentProofText, setCurrentProofText] = useState("");
  const [currentProofImageUrl, setCurrentProofImageUrl] = useState<string | null>(null);

  const [showVisualization, setShowVisualization] = useState(false);

  const [alignment, setAlignment] = useState(5);
  const [growthNote, setGrowthNote] = useState("");
  const [gratitude, setGratitude] = useState("");
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    setVisualizations([]);
    setActs([]);
    setProofs([]);
    setCurrentActText("");
    setCurrentProofText("");
    setCurrentProofImageUrl(null);
    setAlignment(5);
    setGrowthNote("");
    setGratitude("");
    setIsLocked(false);

    const saved = loadTodaysPractice();
    if (saved.visualizations) setVisualizations(saved.visualizations);
    if (saved.acts) setActs(saved.acts);
    if (saved.proofs) setProofs(saved.proofs);
    if (saved.alignment) setAlignment(saved.alignment);
    if (saved.growth_note) setGrowthNote(saved.growth_note);
    if (saved.gratitude) setGratitude(saved.gratitude || "");
    if (saved.locked) setIsLocked(true);
  }, [goal.id, today]);

  const hasVisualization = visualizations.length > 0;
  const hasAct = acts.length > 0;
  const hasProof = proofs.length > 0;
  const section1Complete = hasVisualization && hasAct && hasProof;
  const section2Ready = section1Complete;
  const canLock = section2Ready && growthNote.trim().length > 0;

  const handleVisualizationComplete = () => {
    const newEntry: VisualizationEntry = {
      id: crypto.randomUUID(),
      duration: goal.visualization_minutes,
      created_at: new Date().toISOString(),
    };
    const updated = [...visualizations, newEntry];
    setVisualizations(updated);
    setShowVisualization(false);
    savePractice({ visualizations: updated, visualization_count: updated.length });
    toast.success("Visualization complete!");
  };

  const handleAddAct = () => {
    const text = currentActText.trim() || goal.act_as_if;
    const newEntry: ActEntry = {
      id: crypto.randomUUID(),
      text,
      created_at: new Date().toISOString(),
    };
    const updated = [...acts, newEntry];
    setActs(updated);
    setCurrentActText("");
    savePractice({ acts: updated, act_count: updated.length });
    toast.success("Nice move — that's practice!");
  };

  const handleRemoveAct = (id: string) => {
    const updated = acts.filter((a) => a.id !== id);
    setActs(updated);
    savePractice({ acts: updated, act_count: updated.length });
  };

  const handleProofImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setCurrentProofImageUrl(base64);
      toast.success("Image attached!");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCurrentProofImage = () => {
    setCurrentProofImageUrl(null);
    if (proofImageInputRef.current) proofImageInputRef.current.value = "";
  };

  const handleAddProof = () => {
    if (!currentProofText.trim()) {
      toast.error("Please enter at least one line of proof");
      return;
    }

    const newEntry: ProofEntry = {
      id: crypto.randomUUID(),
      text: currentProofText.trim(),
      image_url: currentProofImageUrl || undefined,
      created_at: new Date().toISOString(),
    };
    const updated = [...proofs, newEntry];
    setProofs(updated);
    setCurrentProofText("");
    setCurrentProofImageUrl(null);
    if (proofImageInputRef.current) proofImageInputRef.current.value = "";

    savePractice({ proofs: updated });

    confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
    toast.success("Great — proof saved. Momentum +1");
  };

  const handleRemoveProof = (id: string) => {
    const updated = proofs.filter((p) => p.id !== id);
    setProofs(updated);
    savePractice({ proofs: updated });
  };

  const handleLockToday = () => {
    if (!canLock) return;

    const practice: ManifestDailyPractice = {
      id: `${goal.id}_${today}`,
      goal_id: goal.id,
      user_id: goal.user_id,
      entry_date: today,
      created_at: new Date().toISOString(),
      visualization_count: visualizations.length,
      visualizations,
      act_count: acts.length,
      acts,
      proofs,
      alignment,
      growth_note: growthNote,
      gratitude: gratitude || undefined,
      locked: true,
    };

    savePractice(practice);
    setIsLocked(true);

    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    toast.success("Day locked — celebrate your progress!");
    onPracticeComplete(practice);
  };

  const section1Progress = [hasVisualization, hasAct, hasProof].filter(Boolean).length;

  if (showVisualization) {
    return (
      <ManifestVisualizationMode
        goal={goal}
        duration={goal.visualization_minutes}
        onComplete={handleVisualizationComplete}
        onClose={() => setShowVisualization(false)}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="p-5 border-b border-border/30">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {goal.vision_image_url && (
              <div className="w-full h-40 rounded-2xl overflow-hidden mb-4 border border-border/30 shadow-lg vision-card-float">
                <img src={goal.vision_image_url} alt="Vision" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Badge className="text-xs rounded-full bg-[hsl(var(--accent-turquoise))] hover:bg-[hsl(var(--accent-turquoise))]/90">
                <Sparkles className="h-3 w-3 mr-1" />
                Active
              </Badge>
              <Badge variant="outline" className="text-xs rounded-full border-[hsl(var(--accent-turquoise))]/30">
                <Flame className="h-3 w-3 mr-1 text-orange-500" />
                Day {streak}
              </Badge>
              <Badge variant="outline" className="text-xs rounded-full">
                Conviction {goal.conviction}/10
              </Badge>
            </div>

            {goal.check_in_time && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>Daily check-in: {goal.check_in_time}</span>
              </div>
            )}

            <p className="mt-3 text-xs text-muted-foreground tracking-wide uppercase">Practicing:</p>
            <h3 className="mt-1 font-medium text-foreground leading-snug line-clamp-3 text-lg">{goal.title}</h3>
          </div>

          <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted/50" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="p-5 space-y-6">
          {/* Section 1 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[hsl(var(--accent-turquoise))]/10 flex items-center justify-center text-xs font-bold text-[hsl(var(--accent-turquoise))]">
                  1
                </span>
                Daily Practice
              </h4>
              <Badge variant="outline" className="text-xs rounded-full">
                {section1Progress}/3
              </Badge>
            </div>

            {/* Visualization */}
            <Card
              className={`glass-card rounded-2xl border-0 transition-all ${hasVisualization ? "ring-2 ring-[hsl(var(--accent-turquoise))]/30" : ""}`}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {hasVisualization ? (
                      <div className="w-5 h-5 rounded-full bg-[hsl(var(--accent-turquoise))] flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    ) : (
                      <Play className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">Visualization</span>
                    {visualizations.length > 0 && (
                      <Badge className="text-xs rounded-full bg-[hsl(var(--accent-turquoise))]/10 text-[hsl(var(--accent-turquoise))] hover:bg-[hsl(var(--accent-turquoise))]/20">
                        {visualizations.length}x
                      </Badge>
                    )}
                  </div>

                  <Button
                    size="sm"
                    onClick={() => setShowVisualization(true)}
                    className={`rounded-full ${hasVisualization ? "" : "btn-gradient"}`}
                    variant={hasVisualization ? "outline" : "default"}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {hasVisualization ? "Add Another" : `Visualize (${goal.visualization_minutes}m)`}
                  </Button>
                </div>

                {visualizations.length > 0 && (
                  <div className="space-y-1.5 ml-7">
                    {visualizations.map((v, i) => (
                      <div key={v.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check className="h-3 w-3 text-[hsl(var(--accent-turquoise))]" />
                        <span>
                          Session {i + 1} • {v.duration}min • {format(new Date(v.created_at), "h:mm a")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Act-as-If */}
            <Card
              className={`glass-card rounded-2xl border-0 transition-all ${hasAct ? "ring-2 ring-[hsl(var(--accent-turquoise))]/30" : ""}`}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  {hasAct ? (
                    <div className="w-5 h-5 rounded-full bg-[hsl(var(--accent-turquoise))] flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">Act-as-If</span>
                  {acts.length > 0 && (
                    <Badge className="text-xs rounded-full bg-[hsl(var(--accent-turquoise))]/10 text-[hsl(var(--accent-turquoise))] hover:bg-[hsl(var(--accent-turquoise))]/20">
                      {acts.length}x
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-muted-foreground ml-7">Suggestion: {goal.act_as_if}</p>

                <div className="ml-7 flex gap-2">
                  <Input
                    value={currentActText}
                    onChange={(e) => setCurrentActText(e.target.value)}
                    placeholder="Or write your own action..."
                    className="text-sm flex-1 rounded-xl border-border/50 bg-background/60"
                  />
                  <Button size="sm" onClick={handleAddAct} className="rounded-full btn-gradient">
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>

                {acts.length > 0 && (
                  <div className="space-y-2 ml-7">
                    {acts.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between gap-2 p-3 bg-[hsl(var(--accent-turquoise))]/5 rounded-xl border border-[hsl(var(--accent-turquoise))]/20"
                      >
                        <div className="flex items-center gap-2 text-xs">
                          <Check className="h-3 w-3 text-[hsl(var(--accent-turquoise))]" />
                          <span>{a.text}</span>
                          <span className="text-muted-foreground">• {format(new Date(a.created_at), "h:mm a")}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleRemoveAct(a.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Save Proof */}
            <Card
              className={`glass-card rounded-2xl border-0 transition-all ${hasProof ? "ring-2 ring-[hsl(var(--accent-turquoise))]/30" : ""}`}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  {hasProof ? (
                    <div className="w-5 h-5 rounded-full bg-[hsl(var(--accent-turquoise))] flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  ) : (
                    <Camera className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">Save Proof</span>
                  {proofs.length > 0 && (
                    <Badge className="text-xs rounded-full bg-[hsl(var(--accent-turquoise))]/10 text-[hsl(var(--accent-turquoise))] hover:bg-[hsl(var(--accent-turquoise))]/20">
                      {proofs.length}x
                    </Badge>
                  )}
                </div>

                <Textarea
                  value={currentProofText}
                  onChange={(e) => setCurrentProofText(e.target.value)}
                  placeholder="A colleague asked for my input; I felt calm in the meeting."
                  rows={2}
                  className="text-sm rounded-xl border-border/50 bg-background/60"
                />

                <div className="space-y-2">
                  <input
                    ref={proofImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProofImageUpload}
                    className="hidden"
                  />

                  {currentProofImageUrl ? (
                    <div className="relative group">
                      <img
                        src={currentProofImageUrl}
                        alt="Proof"
                        className="w-full h-32 object-cover rounded-xl border border-border/30"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={handleRemoveCurrentProofImage}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full rounded-full border-dashed hover:border-[hsl(var(--accent-turquoise))] hover:bg-[hsl(var(--accent-turquoise))]/5"
                      onClick={() => proofImageInputRef.current?.click()}
                    >
                      <ImagePlus className="h-4 w-4 mr-2" />
                      Attach Image
                    </Button>
                  )}
                </div>

                <Button
                  size="sm"
                  onClick={handleAddProof}
                  disabled={!currentProofText.trim()}
                  className="w-full rounded-full btn-gradient"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Proof
                </Button>

                {proofs.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-border/30">
                    {proofs.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 bg-[hsl(var(--accent-turquoise))]/5 rounded-xl border border-[hsl(var(--accent-turquoise))]/20 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-xs">{p.text}</p>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(p.created_at), "h:mm a")}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleRemoveProof(p.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        {p.image_url && (
                          <img src={p.image_url} alt="Proof" className="w-full h-24 object-cover rounded-lg" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          {/* Section 2 */}
          <div className={`space-y-4 transition-all ${!section2Ready ? "opacity-40 pointer-events-none" : ""}`}>
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[hsl(var(--accent-turquoise))]/10 flex items-center justify-center text-xs font-bold text-[hsl(var(--accent-turquoise))]">
                  2
                </span>
                Daily Check-in
              </h4>
              {!section2Ready && <Lock className="h-4 w-4 text-muted-foreground" />}
            </div>

            <div className="glass-card rounded-2xl p-5 space-y-5">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">Alignment</Label>
                  <span className="text-lg font-bold text-[hsl(var(--accent-turquoise))]">{alignment}/10</span>
                </div>
                <div className="slider-gradient">
                  <Slider
                    value={[alignment]}
                    onValueChange={(v) => {
                      setAlignment(v[0]);
                      savePractice({ alignment: v[0] });
                    }}
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>
                <p className="text-xs text-muted-foreground">How aligned did you feel?</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Growth Note <span className="text-[hsl(var(--accent-turquoise))]">*</span>
                </Label>
                <Input
                  value={growthNote}
                  onChange={(e) => {
                    setGrowthNote(e.target.value);
                    savePractice({ growth_note: e.target.value });
                  }}
                  placeholder="Short insight or idea for tomorrow."
                  className="rounded-xl border-border/50 bg-background/60"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Gratitude <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Textarea
                  value={gratitude}
                  onChange={(e) => {
                    setGratitude(e.target.value);
                    savePractice({ gratitude: e.target.value });
                  }}
                  placeholder="1–3 things you appreciate"
                  rows={2}
                  className="rounded-xl border-border/50 bg-background/60 resize-none"
                />
              </div>

              <Button
                onClick={handleLockToday}
                disabled={!canLock}
                className="w-full rounded-full btn-gradient h-12 text-sm font-medium"
              >
                <Lock className="h-4 w-4 mr-2" />
                {isLocked ? "Update Day" : "Lock Today ✨"}
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
