import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Sparkles, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import {
  STARTER_TEMPLATES,
  ACT_AS_IF_OPTIONS,
  CATEGORIES,
  MANIFEST_DRAFT_KEY,
  type StarterTemplate,
  type ManifestGoal,
} from "./types";

interface ManifestCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (goal: {
    title: string;
    category: string;
    vision_image_url?: string;
    start_date?: string;
    live_from_end?: string;
    act_as_if: string;
    conviction: number;
    visualization_minutes: 3 | 5 | 10;
    daily_affirmation: string;
    check_in_time: string;
    committed_7_days: boolean;
  }) => void;
  saving?: boolean;
  editingGoal?: ManifestGoal | null;
}

interface DraftState {
  step: number;
  title: string;
  category: string;
  visionImageUrl: string;
  startDate: string;
  liveFromEnd: string;
  actAsIf: string;
  customActAsIf: string;
  conviction: number;
  visualizationMinutes: 3 | 5 | 10;
  dailyAffirmation: string;
  checkInTime: string;
  committed7Days: boolean;
}

const initialDraft: DraftState = {
  step: 1,
  title: "",
  category: "other",
  visionImageUrl: "",
  startDate: "",
  liveFromEnd: "",
  actAsIf: "",
  customActAsIf: "",
  conviction: 5,
  visualizationMinutes: 3,
  dailyAffirmation: "",
  checkInTime: "08:00",
  committed7Days: false,
};

export function ManifestCreateModal({
  open,
  onOpenChange,
  onSave,
  saving,
  editingGoal,
}: ManifestCreateModalProps) {
  const [draft, setDraft] = useState<DraftState>(initialDraft);
  const isEditing = !!editingGoal;

  // Load draft from localStorage or from editingGoal
  useEffect(() => {
    if (open) {
      if (editingGoal) {
        // Check if act_as_if is a preset or custom
        const savedActAsIf = editingGoal.act_as_if || "";
        const isPreset = ACT_AS_IF_OPTIONS.includes(savedActAsIf);
        
        // Load from editing goal
        setDraft({
          step: 1,
          title: editingGoal.title,
          category: editingGoal.category || "other",
          visionImageUrl: editingGoal.vision_image_url || "",
          startDate: editingGoal.start_date || "",
          liveFromEnd: editingGoal.live_from_end || "",
          actAsIf: isPreset ? savedActAsIf : "custom",
          customActAsIf: isPreset ? "" : savedActAsIf,
          conviction: editingGoal.conviction ?? 5,
          visualizationMinutes: editingGoal.visualization_minutes || 3,
          dailyAffirmation: editingGoal.daily_affirmation || "",
          checkInTime: editingGoal.check_in_time || "08:00",
          committed7Days: editingGoal.committed_7_days || false,
        });
      } else {
        const saved = localStorage.getItem(MANIFEST_DRAFT_KEY);
        if (saved) {
          try {
            setDraft(JSON.parse(saved));
          } catch {
            setDraft(initialDraft);
          }
        } else {
          setDraft(initialDraft);
        }
      }
    }
  }, [open, editingGoal]);

  // Save draft to localStorage
  const saveDraft = (updates: Partial<DraftState>) => {
    const newDraft = { ...draft, ...updates };
    setDraft(newDraft);
    localStorage.setItem(MANIFEST_DRAFT_KEY, JSON.stringify(newDraft));
    toast.success("Draft saved", { duration: 1500 });
  };

  const applyTemplate = (template: StarterTemplate) => {
    saveDraft({
      title: template.assumption,
      category: template.category,
      actAsIf: template.act_as_if,
      dailyAffirmation: template.affirmation,
    });
  };

  const handleNext = () => {
    if (draft.step < 3) {
      saveDraft({ step: draft.step + 1 });
    }
  };

  const handleBack = () => {
    if (draft.step > 1) {
      saveDraft({ step: draft.step - 1 });
    }
  };

  const handleSubmit = () => {
    const finalActAsIf = draft.actAsIf === "custom" ? draft.customActAsIf : draft.actAsIf;
    onSave({
      title: draft.title,
      category: draft.category,
      vision_image_url: draft.visionImageUrl || undefined,
      start_date: draft.startDate || undefined,
      live_from_end: draft.liveFromEnd || undefined,
      act_as_if: finalActAsIf,
      conviction: draft.conviction,
      visualization_minutes: draft.visualizationMinutes,
      daily_affirmation: draft.dailyAffirmation,
      check_in_time: draft.checkInTime,
      committed_7_days: draft.committed7Days,
    });
    // Clear draft on successful save
    localStorage.removeItem(MANIFEST_DRAFT_KEY);
    setDraft(initialDraft);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const canProceedStep1 = draft.title.trim().length > 0;
  const canProceedStep2 = (draft.actAsIf || draft.customActAsIf.trim());
  const canSubmit = draft.dailyAffirmation.trim().length > 0;

  // Handle image upload (simulated for now - would need storage bucket)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        saveDraft({ visionImageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>
              {isEditing ? "Edit Manifestation" : (
                <>
                  {draft.step === 1 && "Step 1: Basics"}
                  {draft.step === 2 && "Step 2: Make it Executable"}
                  {draft.step === 3 && "Step 3: Daily System"}
                </>
              )}
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`w-2 h-2 rounded-full ${
                    s <= draft.step ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Step 1: Basics */}
          {draft.step === 1 && (
            <>
              {/* Templates */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Quick Start Templates
                </Label>
                <div className="flex flex-wrap gap-2">
                  {STARTER_TEMPLATES.map((template) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="sm"
                      onClick={() => applyTemplate(template)}
                      className="text-xs"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      {template.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Assumption */}
              <div className="space-y-2">
                <Label htmlFor="assumption">Your Assumption *</Label>
                <Input
                  id="assumption"
                  value={draft.title}
                  onChange={(e) => saveDraft({ title: e.target.value })}
                  placeholder="I am confidently working in my ideal role and growing every month."
                />
                <p className="text-xs text-muted-foreground">
                  State it as your current reality.
                </p>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={draft.category}
                  onValueChange={(v) => saveDraft({ category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Vision Image */}
              <div className="space-y-2">
                <Label>Vision Image (optional)</Label>
                {draft.visionImageUrl ? (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border/50">
                    <img
                      src={draft.visionImageUrl}
                      alt="Vision"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() => saveDraft({ visionImageUrl: "" })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-full h-24 rounded-lg border border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors">
                    <div className="text-center">
                      <ImagePlus className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                      <span className="text-xs text-muted-foreground">
                        Upload image
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date (optional)</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={draft.startDate}
                  onChange={(e) => saveDraft({ startDate: e.target.value })}
                  className="w-40"
                />
              </div>
            </>
          )}

          {/* Step 2: Make it Executable */}
          {draft.step === 2 && (
            <>
              {/* Live from the End */}
              <div className="space-y-2">
                <Label htmlFor="live-from-end">
                  If it's already true, what do you do today?
                </Label>
                <Textarea
                  id="live-from-end"
                  value={draft.liveFromEnd}
                  onChange={(e) => saveDraft({ liveFromEnd: e.target.value })}
                  placeholder="I speak confidently in meetings and lead with clarity."
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  Short, vivid scene helps the mind align.
                </p>
              </div>

              {/* Act-as-If */}
              <div className="space-y-3">
                <Label>Today's Act-as-If *</Label>
                <div className="flex flex-wrap gap-2">
                  {ACT_AS_IF_OPTIONS.map((option) => (
                    <Button
                      key={option}
                      variant={draft.actAsIf === option ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        saveDraft({ actAsIf: option, customActAsIf: "" });
                      }}
                      className="text-xs"
                    >
                      {option}
                    </Button>
                  ))}
                </div>
                <Input
                  value={draft.customActAsIf}
                  onChange={(e) => {
                    saveDraft({ customActAsIf: e.target.value, actAsIf: "custom" });
                  }}
                  placeholder="e.g., Update LinkedIn headline to 'Supply Chain Lead'"
                />
                <p className="text-xs text-muted-foreground">
                  One small, high-impact action.
                </p>
              </div>

              {/* Conviction */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Conviction</Label>
                  <span className="text-sm font-medium text-primary">
                    {draft.conviction}/10
                  </span>
                </div>
                <Slider
                  value={[draft.conviction]}
                  onValueChange={(v) => saveDraft({ conviction: v[0] })}
                  min={1}
                  max={10}
                  step={1}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 — Warming up</span>
                  <span>10 — Fully embodied</span>
                </div>
              </div>
            </>
          )}

          {/* Step 3: Daily System */}
          {draft.step === 3 && (
            <>
              {/* Visualization Duration */}
              <div className="space-y-3">
                <Label>Visualization</Label>
                <RadioGroup
                  value={String(draft.visualizationMinutes)}
                  onValueChange={(v) =>
                    saveDraft({ visualizationMinutes: Number(v) as 3 | 5 | 10 })
                  }
                  className="flex gap-4"
                >
                  {[3, 5, 10].map((min) => (
                    <div key={min} className="flex items-center space-x-2">
                      <RadioGroupItem value={String(min)} id={`viz-${min}`} />
                      <Label htmlFor={`viz-${min}`} className="text-sm cursor-pointer">
                        {min} min
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                <p className="text-xs text-muted-foreground">
                  Focused, concrete scenes beat length.
                </p>
              </div>

              {/* Daily Affirmation */}
              <div className="space-y-2">
                <Label htmlFor="affirmation">Daily Affirmation *</Label>
                <Input
                  id="affirmation"
                  value={draft.dailyAffirmation}
                  onChange={(e) => saveDraft({ dailyAffirmation: e.target.value })}
                  placeholder="This success is already unfolding for me."
                />
                <p className="text-xs text-muted-foreground">
                  Read aloud at check-in.
                </p>
              </div>

              {/* Check-in Time */}
              <div className="space-y-2">
                <Label htmlFor="check-in-time">Daily Check-in Time</Label>
                <Input
                  id="check-in-time"
                  type="time"
                  value={draft.checkInTime}
                  onChange={(e) => saveDraft({ checkInTime: e.target.value })}
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">
                  Pick a reliable moment for 1–3 minutes.
                </p>
              </div>

              {/* Commitment Pledge */}
              <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                <Checkbox
                  id="commitment"
                  checked={draft.committed7Days}
                  onCheckedChange={(checked) =>
                    saveDraft({ committed7Days: checked === true })
                  }
                  className="mt-0.5"
                />
                <div>
                  <Label htmlFor="commitment" className="cursor-pointer font-medium">
                    I commit to a 7-day practice.
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pledges increase follow-through.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <Button
            variant="ghost"
            onClick={draft.step === 1 ? handleClose : handleBack}
          >
            {draft.step === 1 ? (
              "Cancel"
            ) : (
              <>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </>
            )}
          </Button>

          {draft.step < 3 ? (
            <Button
              onClick={handleNext}
              disabled={
                (draft.step === 1 && !canProceedStep1) ||
                (draft.step === 2 && !canProceedStep2)
              }
            >
              {draft.step === 1 && "Next: Make it Real"}
              {draft.step === 2 && "Next: Daily System"}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canSubmit || saving}>
              {saving ? (isEditing ? "Saving..." : "Creating...") : (isEditing ? "Save Changes" : "Create & Start")}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
