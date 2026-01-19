import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, ImagePlus, Sparkles, X } from "lucide-react";
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


// Category-based auto-fill suggestions with multiple options
const CATEGORY_SUGGESTIONS: Record<string, {
  assumptions: string[];
  liveFromEnds: string[];
  actAsIfs: string[];
  affirmations: string[];
}> = {
  health: {
    assumptions: [
      "My body is healthy, strong, and full of energy.",
      "I am radiantly healthy and vibrant.",
      "Every cell in my body functions perfectly.",
      "I am fit, energetic, and thriving.",
    ],
    liveFromEnds: [
      "I wake up feeling energized, excited for the day ahead.",
      "I move through my day with ease and vitality.",
      "I look in the mirror and love what I see.",
      "I feel strong and capable in my body.",
    ],
    actAsIfs: [
      "Exercise for 10 minutes",
      "Drink 8 glasses of water",
      "Take a mindful walk",
      "Prepare a nourishing meal",
    ],
    affirmations: [
      "Every cell in my body radiates health and vitality.",
      "I am getting healthier every single day.",
      "My body heals quickly and efficiently.",
      "I treat my body with love and respect.",
    ],
  },
  wealth: {
    assumptions: [
      "Money flows to me easily and abundantly.",
      "I am wealthy beyond measure.",
      "I attract financial opportunities effortlessly.",
      "Abundance is my natural state.",
    ],
    liveFromEnds: [
      "I check my finances with joy and gratitude.",
      "I make purchases without financial stress.",
      "I invest confidently in my future.",
      "I give generously because I have plenty.",
    ],
    actAsIfs: [
      "Track my spending today",
      "Research one investment opportunity",
      "Create a budget for the month",
      "Save a small amount today",
    ],
    affirmations: [
      "I am a magnet for financial abundance.",
      "Wealth constantly flows into my life.",
      "I deserve to be financially free.",
      "Money comes to me from expected and unexpected sources.",
    ],
  },
  career: {
    assumptions: [
      "I am thriving in my dream career.",
      "I am successful and fulfilled in my work.",
      "My skills are valued and in high demand.",
      "I do work that I love and get paid well for it.",
    ],
    liveFromEnds: [
      "I walk into work feeling confident and valued.",
      "I receive recognition for my contributions.",
      "I lead projects that make a real impact.",
      "I collaborate with amazing colleagues.",
    ],
    actAsIfs: [
      "Update my professional profile",
      "Network with one new person",
      "Learn something new in my field",
      "Apply to one dream opportunity",
    ],
    affirmations: [
      "Opportunities flow to me effortlessly.",
      "I am exactly where I need to be in my career.",
      "My work makes a positive difference.",
      "I am becoming more successful every day.",
    ],
  },
  relationships: {
    assumptions: [
      "I am surrounded by loving, supportive people.",
      "I attract healthy, fulfilling relationships.",
      "I am deeply loved and appreciated.",
      "My relationships bring me joy and growth.",
    ],
    liveFromEnds: [
      "I feel deeply connected and appreciated.",
      "I have meaningful conversations daily.",
      "I receive love and give love freely.",
      "My relationships are harmonious and balanced.",
    ],
    actAsIfs: [
      "Send a heartfelt message to someone",
      "Plan quality time with a loved one",
      "Express gratitude to someone important",
      "Practice active listening today",
    ],
    affirmations: [
      "Love flows freely in my life.",
      "I attract loving, genuine people.",
      "My relationships are healing and growing.",
      "I am worthy of deep, meaningful connections.",
    ],
  },
  personal: {
    assumptions: [
      "I am becoming my best self every day.",
      "I am confident, capable, and worthy.",
      "I trust myself completely.",
      "I am exactly who I want to be.",
    ],
    liveFromEnds: [
      "I feel proud of who I am becoming.",
      "I handle challenges with grace and wisdom.",
      "I live authentically and unapologetically.",
      "I wake up excited about my life.",
    ],
    actAsIfs: [
      "Do one thing outside my comfort zone",
      "Practice self-care for 15 minutes",
      "Journal about my growth",
      "Celebrate a small win today",
    ],
    affirmations: [
      "I embrace growth and positive change.",
      "I am enough exactly as I am.",
      "I trust the journey of my life.",
      "Every day I become more confident.",
    ],
  },
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

  // Auto-apply category suggestions when category changes
  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    const suggestions = CATEGORY_SUGGESTIONS[newCategory];
    if (suggestions) {
      // Auto-fill ALL fields with first suggestion from each category
      setAssumption(suggestions.assumptions[0]);
      setLiveFromEnd(suggestions.liveFromEnds[0]);
      setActAsIf(suggestions.actAsIfs[0]);
      setAffirmation(suggestions.affirmations[0]);
    }
  };

  // Get current suggestions based on category
  const currentSuggestions = CATEGORY_SUGGESTIONS[category] || CATEGORY_SUGGESTIONS.personal;

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
                <Label className="text-sm font-medium text-slate-700 mb-2 block">Category</Label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => handleCategoryChange(c.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${category === c.value ? "ring-2 ring-teal-500 " + c.color : c.color}`}
                    >
                      {c.label}
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
                {/* Quick select options */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {currentSuggestions.assumptions.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAssumption(opt)}
                      className={`text-[10px] px-2 py-1 rounded-full border transition-all ${
                        assumption === opt
                          ? "bg-teal-500 text-white border-teal-500"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:border-teal-300"
                      }`}
                    >
                      {opt.length > 35 ? opt.slice(0, 35) + "..." : opt}
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
                <Label className="text-sm font-medium text-slate-700 mb-2 block">
                  If this is true, what would you do today?
                </Label>
                <Textarea
                  value={liveFromEnd}
                  onChange={(e) => setLiveFromEnd(e.target.value)}
                  placeholder="I would wake up feeling..."
                  rows={2}
                  className="rounded-xl resize-none"
                />
                {/* Quick select options */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {currentSuggestions.liveFromEnds.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setLiveFromEnd(opt)}
                      className={`text-[10px] px-2 py-1 rounded-full border transition-all ${
                        liveFromEnd === opt
                          ? "bg-teal-500 text-white border-teal-500"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:border-teal-300"
                      }`}
                    >
                      {opt.length > 35 ? opt.slice(0, 35) + "..." : opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">Daily Act-As-If Action</Label>
                <Input
                  value={actAsIf}
                  onChange={(e) => setActAsIf(e.target.value)}
                  placeholder="e.g., Speak confidently in meetings"
                  className="rounded-xl h-10"
                />
                {/* Quick select options */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {currentSuggestions.actAsIfs.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActAsIf(opt)}
                      className={`text-[10px] px-2 py-1 rounded-full border transition-all ${
                        actAsIf === opt
                          ? "bg-teal-500 text-white border-teal-500"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:border-teal-300"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
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
                <Label className="text-sm font-medium text-slate-700 mb-2 block">Daily Affirmation</Label>
                <Input
                  value={affirmation}
                  onChange={(e) => setAffirmation(e.target.value)}
                  placeholder={assumption || "I am..."}
                  className="rounded-xl h-10"
                />
                {/* Quick select options */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {currentSuggestions.affirmations.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAffirmation(opt)}
                      className={`text-[10px] px-2 py-1 rounded-full border transition-all ${
                        affirmation === opt
                          ? "bg-teal-500 text-white border-teal-500"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:border-teal-300"
                      }`}
                    >
                      {opt.length > 35 ? opt.slice(0, 35) + "..." : opt}
                    </button>
                  ))}
                </div>
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
