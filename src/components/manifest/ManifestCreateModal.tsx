import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, ImagePlus, Sparkles, X, Clock, Plus, Trash2, Bell } from "lucide-react";
import { format } from "date-fns";
import { UnifiedDatePicker } from "@/components/common/UnifiedDatePicker";
import { type ManifestGoal, MANIFEST_DRAFT_KEY } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UnifiedTimePicker } from "@/components/common/UnifiedTimePicker";

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

const DEFAULT_REMINDER_TIMES: Record<number, string[]> = {
  1: ["08:00"],
  2: ["08:00", "20:00"],
  3: ["08:00", "13:00", "20:00"],
  4: ["08:00", "12:00", "17:00", "21:00"],
};

export function ManifestCreateModal({ open, onOpenChange, onSave, saving, editingGoal }: ManifestCreateModalProps) {
  const [step, setStep] = useState(1);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const multiImageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [assumption, setAssumption] = useState("");
  const [category, setCategory] = useState("personal");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [visionImages, setVisionImages] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [liveFromEnd, setLiveFromEnd] = useState("");
  const [actAsIf, setActAsIf] = useState("");
  const [vizMinutes, setVizMinutes] = useState<"3" | "5" | "10">("3");
  const [affirmation, setAffirmation] = useState("");
  const [checkInTime, setCheckInTime] = useState("08:00");
  const [committed, setCommitted] = useState(false);

  // Reminder settings
  const [reminderCount, setReminderCount] = useState<1 | 2 | 3 | 4>(1);
  const [reminderTimes, setReminderTimes] = useState<string[]>(["08:00"]);

  useEffect(() => {
    if (!open) return;
    if (editingGoal) {
      setAssumption(editingGoal.title);
      setCategory(editingGoal.category || "personal");
      setImageUrl(editingGoal.vision_image_url || null);
      setVisionImages(Array.isArray(editingGoal.vision_images) ? editingGoal.vision_images : (() => { try { const p = typeof editingGoal.vision_images === 'string' ? JSON.parse(editingGoal.vision_images) : []; return Array.isArray(p) ? p : []; } catch { return []; } })());
      setStartDate(editingGoal.start_date || "");
      setLiveFromEnd(editingGoal.live_from_end || "");
      setActAsIf(editingGoal.act_as_if || "");
      setVizMinutes(String(editingGoal.visualization_minutes || 3) as "3" | "5" | "10");
      setAffirmation(editingGoal.daily_affirmation || "");
      setCheckInTime(editingGoal.check_in_time || "08:00");
      setCommitted(editingGoal.committed_7_days || false);
      setReminderCount(editingGoal.reminder_count || 1);
      setReminderTimes(Array.isArray(editingGoal.reminder_times) ? editingGoal.reminder_times : (() => { try { const p = typeof editingGoal.reminder_times === 'string' ? JSON.parse(editingGoal.reminder_times) : null; return Array.isArray(p) ? p : ["08:00"]; } catch { return ["08:00"]; } })());
    } else {
      try {
        const draft = localStorage.getItem(MANIFEST_DRAFT_KEY);
        if (draft) {
          const d = JSON.parse(draft);
          setAssumption(d.assumption || "");
          setCategory(d.category || "personal");
          if (d.imageUrl && !d.imageUrl.startsWith("data:")) {
            setImageUrl(d.imageUrl);
          } else {
            setImageUrl(null);
          }
          setVisionImages(d.visionImages || []);
          setStartDate(d.startDate || "");
          setLiveFromEnd(d.liveFromEnd || "");
          setActAsIf(d.actAsIf || "");
          setVizMinutes(d.vizMinutes || "3");
          setAffirmation(d.affirmation || "");
          setCheckInTime(d.checkInTime || "08:00");
          setCommitted(d.committed || false);
          setReminderCount(d.reminderCount || 1);
          setReminderTimes(d.reminderTimes || ["08:00"]);
        }
      } catch (e) {
        console.warn("Failed to load draft:", e);
      }
    }
    setStep(1);
  }, [open, editingGoal]);

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    const suggestions = CATEGORY_SUGGESTIONS[newCategory];
    if (suggestions) {
      setAssumption(suggestions.assumptions[0]);
      setLiveFromEnd(suggestions.liveFromEnds[0]);
      setActAsIf(suggestions.actAsIfs[0]);
      setAffirmation(suggestions.affirmations[0]);
    }
  };

  const handleReminderCountChange = (count: 1 | 2 | 3 | 4) => {
    setReminderCount(count);
    setReminderTimes(DEFAULT_REMINDER_TIMES[count]);
  };

  const handleReminderTimeChange = (index: number, time: string) => {
    const newTimes = [...reminderTimes];
    newTimes[index] = time;
    setReminderTimes(newTimes);
  };

  const currentSuggestions = CATEGORY_SUGGESTIONS[category] || CATEGORY_SUGGESTIONS.personal;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large. Max 5MB.");
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "entry-covers");

      const { data: uploadRes, error: uploadError } = await supabase.functions.invoke("upload-image", {
        body: formData,
      });

      if (uploadError || !uploadRes?.url) throw uploadError || new Error("Failed to upload image");

      setImageUrl(uploadRes.url);
      toast.success("Image uploaded!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleMultiImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (visionImages.length + files.length > 5) {
      toast.error("Maximum 5 visualization images allowed");
      return;
    }

    setUploadingImage(true);

    try {
      const newUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Max 5MB.`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucket", "entry-covers");

        const { data: uploadRes, error: uploadError } = await supabase.functions.invoke("upload-image", {
          body: formData,
        });

        if (uploadError || !uploadRes?.url) {
          console.error("Upload error:", uploadError);
          continue;
        }

        newUrls.push(uploadRes.url);
      }

      if (newUrls.length > 0) {
        setVisionImages([...visionImages, ...newUrls]);
        toast.success(`${newUrls.length} image(s) uploaded!`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload images");
    } finally {
      setUploadingImage(false);
      if (multiImageInputRef.current) {
        multiImageInputRef.current.value = "";
      }
    }
  };

  const removeVisionImage = (index: number) => {
    setVisionImages(visionImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    let finalImageUrl = imageUrl;
    if (imageUrl && imageUrl.startsWith("data:")) {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const formData = new FormData();
        formData.append("file", blob, `manifest-${Date.now()}.jpg`);
        formData.append("bucket", "entry-covers");

        const { data: uploadRes, error: uploadError } = await supabase.functions.invoke("upload-image", {
          body: formData,
        });

        if (!uploadError && uploadRes?.url) {
          finalImageUrl = uploadRes.url;
        }
      } catch (e) {
        console.warn("Failed to upload base64 image:", e);
        finalImageUrl = undefined;
      }
    }

    onSave({
      title: assumption,
      category,
      vision_image_url: finalImageUrl && !finalImageUrl.startsWith("data:") ? finalImageUrl : undefined,
      vision_images: visionImages.filter(img => !img.startsWith("data:")),
      start_date: startDate || undefined,
      live_from_end: liveFromEnd || undefined,
      act_as_if: actAsIf || "Take one aligned action",
      conviction: 7,
      visualization_minutes: parseInt(vizMinutes) as 3 | 5 | 10,
      daily_affirmation: affirmation,
      check_in_time: checkInTime,
      committed_7_days: committed,
      reminder_count: reminderCount,
      reminder_times: reminderTimes,
    });

    try {
      localStorage.removeItem(MANIFEST_DRAFT_KEY);
    } catch (e) {
      console.warn("Failed to clear draft:", e);
    }
  };

  const handleClose = (o: boolean) => {
    if (!o) {
      if (!editingGoal) {
        try {
          localStorage.removeItem(MANIFEST_DRAFT_KEY);
        } catch (e) {
          console.warn("Failed to clear draft:", e);
        }
        setAssumption("");
        setCategory("personal");
        setImageUrl(null);
        setVisionImages([]);
        setStartDate("");
        setLiveFromEnd("");
        setActAsIf("");
        setVizMinutes("3");
        setAffirmation("");
        setCheckInTime("08:00");
        setCommitted(false);
        setReminderCount(1);
        setReminderTimes(["08:00"]);
        setStep(1);
      }
    }
    onOpenChange(o);
  };

  const canNext = step === 1 ? assumption.trim().length > 0 : step === 2 ? true : committed;

  const getReminderLabel = (index: number, total: number) => {
    if (total === 1) return "Reminder Time";
    if (total === 2) return index === 0 ? "Morning" : "Evening";
    if (total === 3) return ["Morning", "Afternoon", "Evening"][index];
    return ["Morning", "Noon", "Afternoon", "Evening"][index];
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg p-0 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-4 text-white flex-shrink-0">
          <DialogTitle className="text-lg font-semibold">{editingGoal ? "Edit Reality" : "Create Reality"}</DialogTitle>
          <div className="flex gap-2 mt-3">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`flex-1 h-1.5 rounded-full ${step >= s ? "bg-white" : "bg-white/30"}`} />
            ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
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
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {currentSuggestions.assumptions.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAssumption(opt)}
                      className={`text-[10px] px-2 py-1 rounded-full border transition-all ${assumption === opt
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
                <Label className="text-sm font-medium text-slate-700 mb-2 block">Cover Image</Label>
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
                    <span className="text-sm">{uploadingImage ? "Uploading..." : "Upload Cover Image"}</span>
                  </button>
                )}
              </div>

              {/* Multiple Visualization Images */}
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">
                  Visualization Images (up to 5)
                </Label>
                <p className="text-xs text-slate-500 mb-2">
                  These images will cycle during your visualization sessions
                </p>
                <input
                  ref={multiImageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleMultiImageUpload}
                  className="hidden"
                />
                <div className="grid grid-cols-5 gap-2">
                  {visionImages.map((img, i) => (
                    <div key={i} className="relative aspect-square">
                      <img
                        src={img}
                        alt={`Vision ${i + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full"
                        onClick={() => removeVisionImage(i)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {visionImages.length < 5 && (
                    <button
                      onClick={() => multiImageInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="aspect-square rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 hover:border-teal-300 hover:text-teal-500 transition disabled:opacity-50"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">Start Date</Label>
                <UnifiedDatePicker
                  value={startDate ? new Date(startDate) : undefined}
                  onChange={(date) => setStartDate(date ? format(date, "yyyy-MM-dd") : "")}
                  placeholder="Pick a start date"
                  displayFormat="PPP"
                  triggerClassName="w-full rounded-xl h-10"
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
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {currentSuggestions.liveFromEnds.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setLiveFromEnd(opt)}
                      className={`text-[10px] px-2 py-1 rounded-full border transition-all ${liveFromEnd === opt
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
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {currentSuggestions.actAsIfs.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActAsIf(opt)}
                      className={`text-[10px] px-2 py-1 rounded-full border transition-all ${actAsIf === opt
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
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {currentSuggestions.affirmations.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAffirmation(opt)}
                      className={`text-[10px] px-2 py-1 rounded-full border transition-all ${affirmation === opt
                          ? "bg-teal-500 text-white border-teal-500"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:border-teal-300"
                        }`}
                    >
                      {opt.length > 35 ? opt.slice(0, 35) + "..." : opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reminder Settings */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 mb-3">
                  <Bell className="h-4 w-4 text-amber-600" />
                  <Label className="text-sm font-medium text-slate-700">Daily Reminders</Label>
                </div>

                <p className="text-xs text-slate-500 mb-3">How many times per day would you like to be reminded?</p>

                <div className="flex gap-2 mb-4">
                  {[1, 2, 3, 4].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => handleReminderCountChange(count as 1 | 2 | 3 | 4)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition ${reminderCount === count
                          ? "bg-amber-500 text-white border-amber-500"
                          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-amber-200 dark:border-amber-800 hover:border-amber-400"
                        }`}
                    >
                      {count}x
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  {reminderTimes.map((time, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span className="text-xs text-slate-600 w-20">{getReminderLabel(index, reminderCount)}</span>
                      <UnifiedTimePicker
                        value={time}
                        onChange={(v) => handleReminderTimeChange(index, v)}
                        intervalMinutes={30}
                        triggerClassName="flex-1 rounded-lg h-9 text-sm"
                      />
                    </div>
                  ))}
                </div>
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
