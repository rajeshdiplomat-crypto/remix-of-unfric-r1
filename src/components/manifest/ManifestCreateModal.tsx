import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, ImagePlus, Sparkles, X, Wand2 } from "lucide-react";
import { type ManifestGoal, MANIFEST_DRAFT_KEY } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ManifestCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
  saving: boolean;
  editingGoal?: ManifestGoal | null;
}

const CATEGORIES = [
  { value: "health", label: "Health", color: "bg-emerald-100 text-emerald-600 border-emerald-200" },
  { value: "wealth", label: "Wealth", color: "bg-amber-100 text-amber-600 border-amber-200" },
  { value: "career", label: "Career", color: "bg-blue-100 text-blue-600 border-blue-200" },
  { value: "relationships", label: "Relationships", color: "bg-pink-100 text-pink-600 border-pink-200" },
  { value: "personal", label: "Personal", color: "bg-purple-100 text-purple-600 border-purple-200" },
];

const TEMPLATES = [
  { label: "I am confident", assumption: "I am confident and speak with authority." },
  { label: "I am wealthy", assumption: "Money flows to me easily and abundantly." },
  { label: "I am healthy", assumption: "My body is healthy, strong, and full of energy." },
  { label: "I am loved", assumption: "I am surrounded by love and loving relationships." },
];

// Category-based auto-fill suggestions
const CATEGORY_SUGGESTIONS: Record<string, {
  assumption: string;
  liveFromEnd: string;
  actAsIf: string;
  affirmation: string;
}> = {
  health: {
    assumption: "My body is healthy, strong, and full of energy.",
    liveFromEnd: "I wake up feeling energized, excited for the day ahead.",
    actAsIf: "Exercise for 10 minutes",
    affirmation: "Every cell in my body radiates health and vitality."
  },
  wealth: {
    assumption: "Money flows to me easily and abundantly.",
    liveFromEnd: "I check my finances with joy and gratitude.",
    actAsIf: "Track my spending today",
    affirmation: "I am a magnet for financial abundance."
  },
  career: {
    assumption: "I am thriving in my dream career.",
    liveFromEnd: "I walk into work feeling confident and valued.",
    actAsIf: "Update my professional profile",
    affirmation: "Opportunities flow to me effortlessly."
  },
  relationships: {
    assumption: "I am surrounded by loving, supportive people.",
    liveFromEnd: "I feel deeply connected and appreciated.",
    actAsIf: "Send a heartfelt message to someone",
    affirmation: "Love flows freely in my life."
  },
  personal: {
    assumption: "I am becoming my best self every day.",
    liveFromEnd: "I feel proud of who I am becoming.",
    actAsIf: "Do one thing outside my comfort zone",
    affirmation: "I embrace growth and positive change."
  }
};

export function ManifestCreateModal({ open, onOpenChange, onSave, saving, editingGoal }: ManifestCreateModalProps) {
  const [step, setStep] = useState(1);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [assumption, setAssumption] = useState("");
  const [category, setCategory] = useState("personal");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [liveFromEnd, setLiveFromEnd] = useState("");
  const [actAsIf, setActAsIf] = useState("");
  const [vizMinutes, setVizMinutes] = useState<"3" | "5" | "10">("3");
  const [affirmation, setAffirmation] = useState("");
  const [checkInTime, setCheckInTime] = useState("08:00");
  const [committed, setCommitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editingGoal) {
      setAssumption(editingGoal.title);
      setCategory(editingGoal.category || "personal");
      setImageUrl(editingGoal.vision_image_url || null);
      setStartDate(editingGoal.start_date || "");
      setLiveFromEnd(editingGoal.live_from_end || "");
      setActAsIf(editingGoal.act_as_if || "");
      setVizMinutes(String(editingGoal.visualization_minutes || 3) as "3" | "5" | "10");
      setAffirmation(editingGoal.daily_affirmation || "");
      setCheckInTime(editingGoal.check_in_time || "08:00");
      setCommitted(editingGoal.committed_7_days || false);
    } else {
      try {
        const draft = localStorage.getItem(MANIFEST_DRAFT_KEY);
        if (draft) {
          const d = JSON.parse(draft);
          setAssumption(d.assumption || "");
          setCategory(d.category || "personal");
          // Only restore URL if it's not a base64 string
          if (d.imageUrl && !d.imageUrl.startsWith("data:")) {
            setImageUrl(d.imageUrl);
          } else {
            setImageUrl(null);
          }
          setStartDate(d.startDate || "");
          setLiveFromEnd(d.liveFromEnd || "");
          setActAsIf(d.actAsIf || "");
          setVizMinutes(d.vizMinutes || "3");
          setAffirmation(d.affirmation || "");
          setCheckInTime(d.checkInTime || "08:00");
          setCommitted(d.committed || false);
        }
      } catch (e) {
        console.warn("Failed to load draft:", e);
      }
    }
    setStep(1);
  }, [open, editingGoal]);

  // Apply category suggestions when category changes
  const applySuggestions = () => {
    const suggestions = CATEGORY_SUGGESTIONS[category];
    if (suggestions) {
      if (!assumption.trim()) setAssumption(suggestions.assumption);
      if (!liveFromEnd.trim()) setLiveFromEnd(suggestions.liveFromEnd);
      if (!actAsIf.trim()) setActAsIf(suggestions.actAsIf);
      if (!affirmation.trim()) setAffirmation(suggestions.affirmation);
      toast.success("Suggestions applied!");
    }
  };

  const saveDraft = () => {
    try {
      // Only save URL, not base64 data
      const safeImageUrl = imageUrl && !imageUrl.startsWith("data:") ? imageUrl : null;
      localStorage.setItem(
        MANIFEST_DRAFT_KEY,
        JSON.stringify({
          assumption,
          category,
          imageUrl: safeImageUrl,
          startDate,
          liveFromEnd,
          actAsIf,
          vizMinutes,
          affirmation,
          checkInTime,
          committed,
        }),
      );
    } catch (e) {
      console.warn("Failed to save draft:", e);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large. Max 5MB.");
      return;
    }

    setUploadingImage(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `manifest-${Date.now()}.${fileExt}`;
      const filePath = `vision-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("entry-covers")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("entry-covers")
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
      toast.success("Image uploaded!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
      // Fallback: show preview but don't store base64
      const reader = new FileReader();
      reader.onloadend = () => {
        // Store temporarily for preview only
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    // If image is still base64, try to upload it first
    let finalImageUrl = imageUrl;
    if (imageUrl && imageUrl.startsWith("data:")) {
      try {
        // Convert base64 to blob and upload
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const fileName = `manifest-${Date.now()}.jpg`;
        const filePath = `vision-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("entry-covers")
          .upload(filePath, blob, { upsert: true });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from("entry-covers")
            .getPublicUrl(filePath);
          finalImageUrl = publicUrl;
        }
      } catch (e) {
        console.warn("Failed to upload base64 image:", e);
        finalImageUrl = undefined; // Don't save base64 to storage
      }
    }

    onSave({
      title: assumption,
      category,
      vision_image_url: finalImageUrl && !finalImageUrl.startsWith("data:") ? finalImageUrl : undefined,
      start_date: startDate || undefined,
      live_from_end: liveFromEnd || undefined,
      act_as_if: actAsIf || "Take one aligned action",
      conviction: 7,
      visualization_minutes: parseInt(vizMinutes) as 3 | 5 | 10,
      daily_affirmation: affirmation,
      check_in_time: checkInTime,
      committed_7_days: committed,
    });
    
    try {
      localStorage.removeItem(MANIFEST_DRAFT_KEY);
    } catch (e) {
      console.warn("Failed to clear draft:", e);
    }
  };

  const handleClose = (o: boolean) => {
    if (!o) {
      try {
        saveDraft();
      } catch (e) {
        console.warn("Draft save failed:", e);
      }
    }
    onOpenChange(o);
  };

  const canNext = step === 1 ? assumption.trim().length > 0 : step === 2 ? true : committed;

  const hasSuggestions = CATEGORY_SUGGESTIONS[category];
  const canApplySuggestions = hasSuggestions && (!assumption.trim() || !liveFromEnd.trim() || !actAsIf.trim() || !affirmation.trim());

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg p-0 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-4 text-white">
          <DialogTitle className="text-lg font-semibold">{editingGoal ? "Edit Vision" : "Create Vision"}</DialogTitle>
          <div className="flex gap-2 mt-3">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`flex-1 h-1.5 rounded-full ${step >= s ? "bg-white" : "bg-white/30"}`} />
            ))}
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium text-slate-700">Quick Start</Label>
                  {canApplySuggestions && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={applySuggestions}
                      className="h-7 text-xs text-teal-600 hover:text-teal-700"
                    >
                      <Wand2 className="h-3 w-3 mr-1" /> Auto-fill for {category}
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.label}
                      onClick={() => setAssumption(t.assumption)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${assumption === t.assumption ? "bg-teal-500 text-white border-teal-500" : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">Your Assumption</Label>
                <Textarea
                  value={assumption}
                  onChange={(e) => setAssumption(e.target.value)}
                  placeholder="I am..."
                  rows={2}
                  className="rounded-xl resize-none"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">Category</Label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setCategory(c.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${category === c.value ? "ring-2 ring-teal-500 " + c.color : c.color}`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">Vision Image</Label>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {imageUrl ? (
                  <div className="relative">
                    <img 
                      src={imageUrl} 
                      alt="Vision" 
                      className="w-full h-32 object-cover rounded-xl" 
                      onError={() => setImageUrl(null)}
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 rounded-full"
                      onClick={() => setImageUrl(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                        <span className="text-white text-sm">Uploading...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-full h-32 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-teal-300 hover:text-teal-500 transition disabled:opacity-50"
                  >
                    <ImagePlus className="h-6 w-6" />
                    <span className="text-sm">{uploadingImage ? "Uploading..." : "Upload Image"}</span>
                  </button>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-xl h-10"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium text-slate-700">
                    If this is true, what would you do today?
                  </Label>
                  {!liveFromEnd.trim() && CATEGORY_SUGGESTIONS[category] && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLiveFromEnd(CATEGORY_SUGGESTIONS[category].liveFromEnd)}
                      className="h-6 text-xs text-teal-600"
                    >
                      <Wand2 className="h-3 w-3 mr-1" /> Suggest
                    </Button>
                  )}
                </div>
                <Textarea
                  value={liveFromEnd}
                  onChange={(e) => setLiveFromEnd(e.target.value)}
                  placeholder="I would wake up feeling..."
                  rows={2}
                  className="rounded-xl resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium text-slate-700">Daily Act-As-If Action</Label>
                  {!actAsIf.trim() && CATEGORY_SUGGESTIONS[category] && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActAsIf(CATEGORY_SUGGESTIONS[category].actAsIf)}
                      className="h-6 text-xs text-teal-600"
                    >
                      <Wand2 className="h-3 w-3 mr-1" /> Suggest
                    </Button>
                  )}
                </div>
                <Input
                  value={actAsIf}
                  onChange={(e) => setActAsIf(e.target.value)}
                  placeholder="e.g., Speak confidently in meetings"
                  className="rounded-xl h-10"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">Visualization Duration</Label>
                <RadioGroup
                  value={vizMinutes}
                  onValueChange={(v) => setVizMinutes(v as "3" | "5" | "10")}
                  className="flex gap-3"
                >
                  {["3", "5", "10"].map((m) => (
                    <label
                      key={m}
                      className={`flex-1 flex items-center justify-center py-3 rounded-xl border cursor-pointer transition ${vizMinutes === m ? "bg-teal-50 border-teal-500 text-teal-600" : "border-slate-200 text-slate-600 hover:border-teal-300"}`}
                    >
                      <RadioGroupItem value={m} className="hidden" />
                      <span className="font-medium">{m} min</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium text-slate-700">Daily Affirmation</Label>
                  {!affirmation.trim() && CATEGORY_SUGGESTIONS[category] && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAffirmation(CATEGORY_SUGGESTIONS[category].affirmation)}
                      className="h-6 text-xs text-teal-600"
                    >
                      <Wand2 className="h-3 w-3 mr-1" /> Suggest
                    </Button>
                  )}
                </div>
                <Input
                  value={affirmation}
                  onChange={(e) => setAffirmation(e.target.value)}
                  placeholder={assumption || "I am..."}
                  className="rounded-xl h-10"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">Check-in Time</Label>
                <Input
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="rounded-xl h-10"
                />
              </div>

              <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 cursor-pointer hover:border-teal-300 transition">
                <Checkbox checked={committed} onCheckedChange={(c) => setCommitted(!!c)} />
                <div>
                  <p className="font-medium text-slate-700">I commit to 7 days</p>
                  <p className="text-xs text-slate-500">Build the habit that changes everything</p>
                </div>
              </label>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6 pt-4 border-t border-slate-100">
            {step > 1 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)} className="rounded-xl">
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            ) : (
              <div />
            )}
            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canNext}
                className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canNext || saving || uploadingImage}
                className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
              >
                {saving ? (
                  "Saving..."
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" /> {editingGoal ? "Update" : "Create Vision"}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
