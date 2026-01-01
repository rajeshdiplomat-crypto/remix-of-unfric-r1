import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Plus, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { type ManifestGoal, type ManifestCheckIn } from "./types";

interface ManifestCheckInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: ManifestGoal | null;
  onSave: (checkIn: Omit<ManifestCheckIn, "id" | "user_id" | "created_at">) => void;
  saving?: boolean;
}

export function ManifestCheckInModal({
  open,
  onOpenChange,
  goal,
  onSave,
  saving,
}: ManifestCheckInModalProps) {
  const [alignment, setAlignment] = useState(5);
  const [actedToday, setActedToday] = useState<"yes" | "mostly" | "not_yet">("yes");
  const [proofText, setProofText] = useState("");
  const [proofs, setProofs] = useState<string[]>([]);
  const [growthNote, setGrowthNote] = useState("");
  const [gratitude, setGratitude] = useState("");

  useEffect(() => {
    if (open) {
      setAlignment(5);
      setActedToday("yes");
      setProofText("");
      setProofs([]);
      setGrowthNote("");
      setGratitude("");
    }
  }, [open]);

  const addProof = () => {
    if (proofText.trim()) {
      setProofs((prev) => [...prev, proofText.trim()]);
      setProofText("");
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#10b981", "#3b82f6", "#8b5cf6"],
      });
      toast.success("Nice — proof saved.");
    }
  };

  const handleSubmit = () => {
    if (!goal) return;

    const allProofs = proofText.trim()
      ? [...proofs, proofText.trim()]
      : proofs;

    onSave({
      goal_id: goal.id,
      entry_date: new Date().toISOString().split("T")[0],
      alignment,
      acted_today: actedToday,
      proofs: allProofs,
      growth_note: growthNote || undefined,
      gratitude: gratitude || undefined,
    });

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  if (!goal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Today's Check-in</DialogTitle>
          <p className="text-sm text-muted-foreground truncate">{goal.title}</p>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Alignment Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>How aligned did you feel?</Label>
              <span className="text-sm font-medium text-primary">{alignment}/10</span>
            </div>
            <Slider
              value={[alignment]}
              onValueChange={(v) => setAlignment(v[0])}
              min={1}
              max={10}
              step={1}
            />
          </div>

          {/* Acted Today */}
          <div className="space-y-2">
            <Label>Acted today?</Label>
            <div className="flex gap-2">
              {[
                { value: "yes", label: "Yes" },
                { value: "mostly", label: "Mostly" },
                { value: "not_yet", label: "Not yet" },
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={actedToday === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActedToday(option.value as typeof actedToday)}
                  className="flex-1"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Proofs */}
          <div className="space-y-2">
            <Label>What positive signs did you notice?</Label>
            {proofs.length > 0 && (
              <div className="space-y-1 mb-2">
                {proofs.map((proof, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm p-2 rounded bg-muted/30">
                    <Sparkles className="h-3 w-3 text-primary shrink-0" />
                    <span className="truncate">{proof}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Textarea
                value={proofText}
                onChange={(e) => setProofText(e.target.value)}
                placeholder="A colleague asked for my input; I felt calm in the meeting."
                rows={2}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={addProof}
                disabled={!proofText.trim()}
                className="shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Growth Note */}
          <div className="space-y-2">
            <Label>What did you learn today? (optional)</Label>
            <Textarea
              value={growthNote}
              onChange={(e) => setGrowthNote(e.target.value)}
              placeholder="Short insight or idea for tomorrow."
              rows={2}
            />
          </div>

          {/* Gratitude */}
          <div className="space-y-2">
            <Label>1–3 things you appreciate (optional)</Label>
            <Textarea
              value={gratitude}
              onChange={(e) => setGratitude(e.target.value)}
              placeholder="I appreciate..."
              rows={2}
            />
          </div>

          {/* Submit */}
          <Button onClick={handleSubmit} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Lock Today — Celebrate"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
