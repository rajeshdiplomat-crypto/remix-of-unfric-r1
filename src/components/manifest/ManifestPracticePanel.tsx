import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Play,
  Check,
  Camera,
  Lock,
  Sparkles,
  ChevronRight,
  X,
} from "lucide-react";
import { type ManifestGoal, type ManifestDailyPractice, DAILY_PRACTICE_KEY } from "./types";
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

export function ManifestPracticePanel({
  goal,
  streak,
  onClose,
  onPracticeComplete,
}: ManifestPracticePanelProps) {
  const today = format(new Date(), "yyyy-MM-dd");

  // Load today's practice from localStorage
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

  // Section 1 state
  const [visualizationCompleted, setVisualizationCompleted] = useState(false);
  const [acted, setActed] = useState(false);
  const [proofText, setProofText] = useState("");
  const [proofSaved, setProofSaved] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);

  // Section 2 state
  const [alignment, setAlignment] = useState(5);
  const [growthNote, setGrowthNote] = useState("");
  const [gratitude, setGratitude] = useState("");
  const [isLocked, setIsLocked] = useState(false);

  // Load saved state on mount and when goal changes - RESET all state first
  useEffect(() => {
    // Reset all state to defaults first
    setVisualizationCompleted(false);
    setActed(false);
    setProofText("");
    setProofSaved(false);
    setAlignment(5);
    setGrowthNote("");
    setGratitude("");
    setIsLocked(false);

    // Then load saved values for this specific goal
    const saved = loadTodaysPractice();
    if (saved.visualization_completed) setVisualizationCompleted(true);
    if (saved.acted) setActed(true);
    if (saved.proof_text) {
      setProofText(saved.proof_text);
      setProofSaved(true);
    }
    if (saved.alignment) setAlignment(saved.alignment);
    if (saved.growth_note) setGrowthNote(saved.growth_note);
    if (saved.gratitude) setGratitude(saved.gratitude || "");
    if (saved.locked) setIsLocked(true);
  }, [goal.id, today]);

  const section1Complete = visualizationCompleted && acted && proofSaved;
  const section2Ready = section1Complete;
  const canLock = section2Ready && growthNote.trim().length > 0;

  const handleVisualizationComplete = () => {
    setVisualizationCompleted(true);
    setShowVisualization(false);
    savePractice({ visualization_completed: true });
    toast.success("Visualization complete!");
  };

  const handleActComplete = () => {
    setActed(true);
    savePractice({ acted: true });
    toast.success("Nice move — that's practice!");
  };

  const handleSaveProof = () => {
    if (!proofText.trim()) {
      toast.error("Please enter at least one line of proof");
      return;
    }
    setProofSaved(true);
    savePractice({ proof_text: proofText });
    
    // Confetti celebration
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
    });
    toast.success("Great — proof saved. Momentum +1");
  };

  const handleLockToday = () => {
    if (!canLock) return;

    const practice: ManifestDailyPractice = {
      id: `${goal.id}_${today}`,
      goal_id: goal.id,
      user_id: goal.user_id,
      entry_date: today,
      created_at: new Date().toISOString(),
      visualization_completed: true,
      acted: true,
      proof_text: proofText,
      alignment,
      growth_note: growthNote,
      gratitude: gratitude || undefined,
      locked: true,
    };

    savePractice(practice);
    setIsLocked(true);

    // Celebration
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    toast.success("Day locked — celebrate your progress!");
    onPracticeComplete(practice);
  };

  const section1Progress = [visualizationCompleted, acted, proofSaved].filter(Boolean).length;

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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Vision Image */}
            {goal.vision_image_url && (
              <div className="w-full h-32 rounded-lg overflow-hidden mb-3 border border-border/50">
                <img
                  src={goal.vision_image_url}
                  alt="Vision"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground mb-1">Practicing:</p>
            <h3 className="font-semibold text-foreground leading-tight">
              {goal.title}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="default" className="text-xs">Active</Badge>
              <Badge variant="outline" className="text-xs">Day {streak}</Badge>
              <Badge variant="outline" className="text-xs">
                Conviction {goal.conviction}/10
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Section 1: Daily Practice */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-foreground">Section 1 — Daily Practice</h4>
              <Badge variant="outline" className="text-xs">
                {section1Progress}/3
              </Badge>
            </div>

            {/* 1. Visualization */}
            <Card className={`border-border/50 ${visualizationCompleted ? "bg-primary/5 border-primary/30" : ""}`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {visualizationCompleted ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Play className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">Visualization</span>
                  </div>
                  <Button
                    size="sm"
                    variant={visualizationCompleted ? "outline" : "default"}
                    onClick={() => setShowVisualization(true)}
                    disabled={isLocked}
                  >
                    {visualizationCompleted ? "Redo" : `Visualize (${goal.visualization_minutes}m)`}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 2. Act-as-If */}
            <Card className={`border-border/50 ${acted ? "bg-primary/5 border-primary/30" : ""}`}>
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {acted ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium">Act-as-If</span>
                    </div>
                    <Button
                      size="sm"
                      variant={acted ? "outline" : "default"}
                      onClick={handleActComplete}
                      disabled={isLocked}
                    >
                      {acted ? "Done" : "Mark Action Done"}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">
                    {goal.act_as_if}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 3. Save Proof */}
            <Card className={`border-border/50 ${proofSaved ? "bg-primary/5 border-primary/30" : ""}`}>
              <CardContent className="p-3 space-y-3">
                <div className="flex items-center gap-2">
                  {proofSaved ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Camera className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">Save Proof</span>
                </div>
                <Textarea
                  value={proofText}
                  onChange={(e) => {
                    setProofText(e.target.value);
                    if (proofSaved) setProofSaved(false);
                  }}
                  placeholder="A colleague asked for my input; I felt calm in the meeting."
                  rows={2}
                  disabled={isLocked}
                  className="text-sm"
                />
                <Button
                  size="sm"
                  onClick={handleSaveProof}
                  disabled={!proofText.trim() || isLocked}
                  className="w-full"
                >
                  {proofSaved ? "Update Proof" : "Save Proof"}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Section 2: Daily Check-in */}
          <div className={`space-y-4 ${!section2Ready ? "opacity-50 pointer-events-none" : ""}`}>
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-foreground">Section 2 — Daily Check-in</h4>
              {!section2Ready && (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
            </div>

            {/* Alignment Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm">Alignment</Label>
                <span className="text-sm font-medium text-primary">{alignment}/10</span>
              </div>
              <Slider
                value={[alignment]}
                onValueChange={(v) => {
                  setAlignment(v[0]);
                  savePractice({ alignment: v[0] });
                }}
                min={1}
                max={10}
                step={1}
                disabled={isLocked}
              />
              <p className="text-xs text-muted-foreground">How aligned did you feel?</p>
            </div>

            {/* Growth Note */}
            <div className="space-y-2">
              <Label className="text-sm">Growth Note *</Label>
              <Input
                value={growthNote}
                onChange={(e) => {
                  setGrowthNote(e.target.value);
                  savePractice({ growth_note: e.target.value });
                }}
                placeholder="Short insight or idea for tomorrow."
                disabled={isLocked}
              />
            </div>

            {/* Gratitude */}
            <div className="space-y-2">
              <Label className="text-sm">Gratitude (optional)</Label>
              <Textarea
                value={gratitude}
                onChange={(e) => {
                  setGratitude(e.target.value);
                  savePractice({ gratitude: e.target.value });
                }}
                placeholder="1–3 things you appreciate"
                rows={2}
                disabled={isLocked}
              />
            </div>

            {/* Lock Button */}
            <Button
              onClick={handleLockToday}
              disabled={!canLock || isLocked}
              className="w-full"
            >
              {isLocked ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Day Locked
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Lock Today — Celebrate
                </>
              )}
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
