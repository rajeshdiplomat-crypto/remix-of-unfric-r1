import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  ImagePlus,
  X,
  Check,
  Briefcase,
  DollarSign,
  Heart,
  Target,
  Users,
  BookOpen,
  Clock,
  Zap,
  Eye,
  Camera,
} from "lucide-react";
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

const categoryIcons: Record<string, React.ReactNode> = {
  career: <Briefcase className="h-4 w-4" />,
  wealth: <DollarSign className="h-4 w-4" />,
  health: <Heart className="h-4 w-4" />,
  habit: <Target className="h-4 w-4" />,
  relationships: <Users className="h-4 w-4" />,
  learning: <BookOpen className="h-4 w-4" />,
};

const stepInfo = [
  { num: 1, title: "Your Vision", subtitle: "What reality are you creating?", icon: Eye },
  { num: 2, title: "Daily Action", subtitle: "How will you embody this?", icon: Zap },
  { num: 3, title: "Your Ritual", subtitle: "Build your daily practice", icon: Sparkles },
];

export function ManifestCreateModal({ open, onOpenChange, onSave, saving, editingGoal }: ManifestCreateModalProps) {
  const [draft, setDraft] = useState<DraftState>(initialDraft);
  const isEditing = !!editingGoal;

  useEffect(() => {
    if (!open) return;

    if (editingGoal) {
      const savedActAsIf = editingGoal.act_as_if || "";
      const isPreset = ACT_AS_IF_OPTIONS.includes(savedActAsIf);

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
  }, [open, editingGoal]);

  const saveDraft = (updates: Partial<DraftState>) => {
    const newDraft = { ...draft, ...updates };
    setDraft(newDraft);
    localStorage.setItem(MANIFEST_DRAFT_KEY, JSON.stringify(newDraft));
  };

  const applyTemplate = (template: StarterTemplate) => {
    saveDraft({
      title: template.assumption,
      category: template.category,
      actAsIf: template.act_as_if,
      dailyAffirmation: template.affirmation,
    });
    toast.success(`Applied "${template.name}" template!`);
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

    localStorage.removeItem(MANIFEST_DRAFT_KEY);
    setDraft(initialDraft);
  };

  const canProceedStep1 = draft.title.trim().length > 0;
  const canProceedStep2 = (draft.actAsIf || draft.customActAsIf.trim()) as unknown as boolean;
  const canSubmit = draft.dailyAffirmation.trim().length > 0;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      saveDraft({ visionImageUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const currentStepInfo = stepInfo[draft.step - 1];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-hidden flex flex-col rounded-3xl border-0 shadow-2xl p-0 gap-0">
        {/* Header with Steps */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-6 text-white">
          {/* Step Indicators */}
          <div className="flex items-center justify-center gap-3 mb-5">
            {stepInfo.map((s, i) => (
              <div key={s.num} className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    draft.step === s.num
                      ? "bg-white text-teal-600 shadow-lg scale-110"
                      : draft.step > s.num
                        ? "bg-white/30 text-white"
                        : "bg-white/20 text-white/60"
                  }`}
                >
                  {draft.step > s.num ? <Check className="h-5 w-5" /> : s.num}
                </div>
                {i < stepInfo.length - 1 && (
                  <div className={`w-12 h-0.5 ${draft.step > s.num ? "bg-white/60" : "bg-white/20"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Current Step Title */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              {currentStepInfo && <currentStepInfo.icon className="h-5 w-5" />}
              <h2 className="text-2xl font-bold">{currentStepInfo?.title}</h2>
            </div>
            <p className="text-white/80 text-sm">{currentStepInfo?.subtitle}</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {draft.step === 1 && (
            <>
              {/* Quick Templates */}
              <div className="space-y-3">
                <Label className="text-xs text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-teal-500" />
                  Quick Start
                </Label>
                <div className="flex flex-wrap gap-2">
                  {STARTER_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => applyTemplate(template)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium transition-all hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:shadow-md"
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vision Statement */}
              <div className="space-y-3">
                <Label htmlFor="assumption" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Your Belief Statement <span className="text-teal-500">*</span>
                </Label>
                <Textarea
                  id="assumption"
                  value={draft.title}
                  onChange={(e) => saveDraft({ title: e.target.value })}
                  placeholder="I am confidently working in my ideal role and growing every month..."
                  rows={3}
                  className="rounded-xl border-slate-200 dark:border-slate-700 focus:border-teal-500 focus:ring-teal-500 text-lg resize-none"
                />
                <p className="text-xs text-slate-500">💡 Write it as if it's already your reality</p>
              </div>

              {/* Category */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Category</Label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => saveDraft({ category: cat.id })}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-all ${
                        draft.category === cat.id
                          ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-transparent shadow-md"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-teal-400"
                      }`}
                    >
                      {categoryIcons[cat.id] || <Target className="h-4 w-4" />}
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vision Image */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Vision Board Image{" "}
                  <span className="text-slate-400 text-xs font-normal">(Makes visualization 3x more powerful!)</span>
                </Label>
                {draft.visionImageUrl ? (
                  <div className="relative w-full h-48 rounded-2xl overflow-hidden border-2 border-teal-200 dark:border-teal-800 group">
                    <img src={draft.visionImageUrl} alt="Vision" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-12 w-12 rounded-full"
                        onClick={() => saveDraft({ visionImageUrl: "" })}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-40 rounded-2xl border-2 border-dashed border-teal-300 dark:border-teal-700 cursor-pointer hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-900/20 transition-all group">
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/50 dark:to-cyan-900/50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <ImagePlus className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                      Upload Your Vision Image
                    </span>
                    <span className="text-xs text-slate-400 mt-1">This will be your visualization background</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
            </>
          )}

          {draft.step === 2 && (
            <>
              {/* If Already True */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  If this is already true, what do you do today?
                </Label>
                <Textarea
                  value={draft.liveFromEnd}
                  onChange={(e) => saveDraft({ liveFromEnd: e.target.value })}
                  placeholder="I walk into meetings with confidence, speak clearly, and my ideas are valued..."
                  rows={3}
                  className="rounded-xl border-slate-200 resize-none"
                />
                <p className="text-xs text-slate-500">🎬 Describe a vivid scene from your new reality</p>
              </div>

              {/* Act-as-If Actions */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Today's Act-as-If Action <span className="text-teal-500">*</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {ACT_AS_IF_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() => saveDraft({ actAsIf: option, customActAsIf: "" })}
                      className={`px-4 py-2.5 rounded-full border text-sm font-medium transition-all ${
                        draft.actAsIf === option
                          ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-transparent shadow-md"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-teal-400"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <Input
                  value={draft.customActAsIf}
                  onChange={(e) => saveDraft({ customActAsIf: e.target.value, actAsIf: "custom" })}
                  placeholder="Or write your own action..."
                  className="h-12 rounded-xl"
                />
              </div>

              {/* Conviction Level */}
              <div className="space-y-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    How much do you believe this?
                  </Label>
                  <span className="text-3xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
                    {draft.conviction}/10
                  </span>
                </div>
                <Slider
                  value={[draft.conviction]}
                  onValueChange={(v) => saveDraft({ conviction: v[0] })}
                  min={1}
                  max={10}
                  step={1}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>1 — Warming up</span>
                  <span>10 — Already living it</span>
                </div>
              </div>
            </>
          )}

          {draft.step === 3 && (
            <>
              {/* Visualization Duration */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Daily Visualization Time
                </Label>
                <RadioGroup
                  value={String(draft.visualizationMinutes)}
                  onValueChange={(v) => saveDraft({ visualizationMinutes: Number(v) as 3 | 5 | 10 })}
                  className="flex gap-3"
                >
                  {[3, 5, 10].map((min) => (
                    <label
                      key={min}
                      className={`flex-1 flex flex-col items-center gap-2 p-5 rounded-2xl border cursor-pointer transition-all ${
                        draft.visualizationMinutes === min
                          ? "bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/30 dark:to-cyan-900/30 border-teal-300 dark:border-teal-700 shadow-md"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-teal-300"
                      }`}
                    >
                      <RadioGroupItem value={String(min)} id={`viz-${min}`} className="sr-only" />
                      <Clock
                        className={`h-6 w-6 ${draft.visualizationMinutes === min ? "text-teal-600" : "text-slate-400"}`}
                      />
                      <span
                        className={`text-2xl font-bold ${draft.visualizationMinutes === min ? "text-teal-600" : "text-slate-600"}`}
                      >
                        {min}
                      </span>
                      <span className="text-xs text-slate-500">minutes</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              {/* Daily Affirmation */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Daily Affirmation <span className="text-teal-500">*</span>
                </Label>
                <Textarea
                  value={draft.dailyAffirmation}
                  onChange={(e) => saveDraft({ dailyAffirmation: e.target.value })}
                  placeholder="This success is already unfolding for me. I trust the process..."
                  rows={2}
                  className="rounded-xl resize-none"
                />
                <p className="text-xs text-slate-500">🗣️ You'll see this during visualization</p>
              </div>

              {/* Check-in Time */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Daily Check-in Time</Label>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="time"
                      value={draft.checkInTime}
                      onChange={(e) => saveDraft({ checkInTime: e.target.value })}
                      className="w-44 h-12 pl-10 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Commitment */}
              <div className="flex items-start space-x-4 p-5 rounded-2xl bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/30 dark:to-cyan-900/30 border border-teal-200 dark:border-teal-800">
                <Checkbox
                  id="commitment"
                  checked={draft.committed7Days}
                  onCheckedChange={(checked) => saveDraft({ committed7Days: checked === true })}
                  className="mt-0.5 h-5 w-5 data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500"
                />
                <div>
                  <Label
                    htmlFor="commitment"
                    className="cursor-pointer font-semibold text-sm text-slate-700 dark:text-slate-200"
                  >
                    I commit to 7 days of practice ✨
                  </Label>
                  <p className="text-xs text-slate-500 mt-1">Making a commitment increases success by 3x</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <Button
            variant="ghost"
            onClick={draft.step === 1 ? () => onOpenChange(false) : handleBack}
            className="rounded-full px-5"
          >
            {draft.step === 1 ? (
              "Cancel"
            ) : (
              <>
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back
              </>
            )}
          </Button>

          {draft.step < 3 ? (
            <Button
              onClick={handleNext}
              disabled={(draft.step === 1 && !canProceedStep1) || (draft.step === 2 && !canProceedStep2)}
              className="rounded-full px-8 h-12 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg"
            >
              Next Step
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || saving}
              className="rounded-full px-8 h-12 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg"
            >
              {saving ? "Creating..." : isEditing ? "Save Changes ✓" : "Start Manifesting ✨"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
