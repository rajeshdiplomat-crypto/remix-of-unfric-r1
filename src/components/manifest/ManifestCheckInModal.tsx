import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Sparkles, Camera, Plus, Check } from "lucide-react";
import confetti from "canvas-confetti";
import { useToast } from "@/hooks/use-toast";
import type { ManifestGoal, ManifestCheckIn } from "./types";

interface ManifestCheckInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: ManifestGoal | null;
  onSave: (checkIn: Partial<ManifestCheckIn>) => void;
  saving?: boolean;
}

export function ManifestCheckInModal({
  open,
  onOpenChange,
  goal,
  onSave,
  saving
}: ManifestCheckInModalProps) {
  const { toast } = useToast();
  const [alignment, setAlignment] = useState([7]);
  const [actedToday, setActedToday] = useState<'yes' | 'mostly' | 'not_yet'>('yes');
  const [proofText, setProofText] = useState("");
  const [proofs, setProofs] = useState<string[]>([]);
  const [growthNote, setGrowthNote] = useState("");
  const [gratitude, setGratitude] = useState("");
  
  // Reset on open
  useEffect(() => {
    if (open) {
      setAlignment([7]);
      setActedToday('yes');
      setProofText("");
      setProofs([]);
      setGrowthNote("");
      setGratitude("");
    }
  }, [open]);
  
  const addProof = () => {
    if (proofText.trim()) {
      setProofs([...proofs, proofText.trim()]);
      setProofText("");
      
      // Mini celebration
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10b981', '#3b82f6', '#8b5cf6']
      });
      
      toast({ title: "Nice — proof saved!", duration: 2000 });
    }
  };
  
  const handleSubmit = () => {
    const checkInData: Partial<ManifestCheckIn> = {
      goal_id: goal?.id,
      entry_date: new Date().toISOString().split('T')[0],
      alignment: alignment[0],
      acted_today: actedToday,
      proofs,
      growth_note: growthNote || undefined,
      gratitude: gratitude || undefined,
    };
    
    onSave(checkInData);
    
    // Celebration confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  if (!goal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Daily Check-in
          </DialogTitle>
          <p className="text-sm text-muted-foreground truncate">{goal.title}</p>
        </DialogHeader>
        
        <div className="space-y-5 py-2">
          {/* Alignment Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm">How aligned did you feel?</Label>
              <span className="text-sm font-medium text-primary">{alignment[0]}/10</span>
            </div>
            <Slider
              value={alignment}
              onValueChange={setAlignment}
              max={10}
              min={1}
              step={1}
            />
          </div>
          
          {/* Acted Today */}
          <div>
            <Label className="text-sm mb-2 block">Acted today?</Label>
            <div className="flex gap-2">
              {[
                { value: 'yes', label: 'Yes' },
                { value: 'mostly', label: 'Mostly' },
                { value: 'not_yet', label: 'Not Yet' }
              ].map(option => (
                <Button
                  key={option.value}
                  variant={actedToday === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActedToday(option.value as typeof actedToday)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Proofs */}
          <div>
            <Label className="text-sm mb-2 block">Proofs & Observations</Label>
            <div className="flex gap-2">
              <Textarea
                value={proofText}
                onChange={(e) => setProofText(e.target.value)}
                placeholder="What evidence did you notice today?"
                rows={2}
                className="flex-1"
              />
              <div className="flex flex-col gap-1">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={addProof}
                  disabled={!proofText.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {proofs.length > 0 && (
              <div className="mt-2 space-y-1">
                {proofs.map((proof, i) => (
                  <div key={i} className="text-sm bg-muted/50 px-2 py-1 rounded flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-500" />
                    {proof}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Growth Note */}
          <div>
            <Label className="text-sm mb-2 block">Growth Note (Optional)</Label>
            <Textarea
              value={growthNote}
              onChange={(e) => setGrowthNote(e.target.value)}
              placeholder="Any insights or reflections?"
              rows={2}
            />
          </div>
          
          {/* Gratitude */}
          <div>
            <Label className="text-sm mb-2 block">Gratitude (Optional)</Label>
            <Textarea
              value={gratitude}
              onChange={(e) => setGratitude(e.target.value)}
              placeholder="What are you grateful for regarding this goal?"
              rows={2}
            />
          </div>
        </div>
        
        <div className="flex justify-end pt-2">
          <Button onClick={handleSubmit} disabled={saving} className="gap-2">
            <Sparkles className="h-4 w-4" />
            {saving ? "Saving..." : "Lock Today — Celebrate"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
