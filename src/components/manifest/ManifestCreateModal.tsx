import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, ImagePlus, Sparkles, X, Check } from "lucide-react";
import { type ManifestGoal, MANIFEST_DRAFT_KEY } from "./types";

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

export function ManifestCreateModal({ open, onOpenChange, onSave, saving, editingGoal }: ManifestCreateModalProps) {
  const [step, setStep] = useState(1);
  const imageInputRef = useRef<HTMLInputElement>(null);

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
      const draft = localStorage.getItem(MANIFEST_DRAFT_KEY);
      if (draft) {
        const d = JSON.parse(draft);
        setAssumption(d.assumption || "");
        setCategory(d.category || "personal");
        setImageUrl(d.imageUrl || null);
        setStartDate(d.startDate || "");
        setLiveFromEnd(d.liveFromEnd || "");
        setActAsIf(d.actAsIf || "");
        setVizMinutes(d.vizMinutes || "3");
        setAffirmation(d.affirmation || "");
        setCheckInTime(d.checkInTime || "08:00");
        setCommitted(d.committed || false);
      }
    }
    setStep(1);
  }, [open, editingGoal]);

  const saveDraft = () => {
    localStorage.setItem(
      MANIFEST_DRAFT_KEY,
      JSON.stringify({
        assumption,
        category,
        imageUrl,
        startDate,
        liveFromEnd,
        actAsIf,
        vizMinutes,
        affirmation,
        checkInTime,
        committed,
      }),
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    onSave({
      title: assumption,
      category,
      vision_image_url: imageUrl || undefined,
      start_date: startDate || undefined,
      live_from_end: liveFromEnd || undefined,
      act_as_if: actAsIf || "Take one aligned action",
      conviction: 7,
      visualization_minutes: parseInt(vizMinutes) as 3 | 5 | 10,
      daily_affirmation: affirmation,
      check_in_time: checkInTime,
      committed_7_days: committed,
    });
    localStorage.removeItem(MANIFEST_DRAFT_KEY);
  };

  const canNext = step === 1 ? assumption.trim().length > 0 : step === 2 ? true : committed;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) saveDraft();
        onOpenChange(o);
      }}
    >
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
                <Label className="text-sm font-medium text-slate-700 mb-2 block">Quick Start</Label>
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
                      onError={(e) => {
                        // Handle broken base64 or invalid URLs
                        e.currentTarget.style.display = 'none';
                        setImageUrl(null);
                      }}
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 rounded-full"
                      onClick={() => setImageUrl(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="w-full h-32 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-teal-300 hover:text-teal-500 transition"
                  >
                    <ImagePlus className="h-6 w-6" />
                    <span className="text-sm">Upload Image</span>
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
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">Daily Act-As-If Action</Label>
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
                <Label className="text-sm font-medium text-slate-700 mb-2 block">Daily Affirmation</Label>
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
                disabled={!canNext || saving}
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
