import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Play,
  Check,
  Camera,
  Lock,
  X,
  Clock,
  ImagePlus,
  Trash2,
  Plus,
  Sparkles,
  Flame,
  Eye,
  Zap,
  ChevronDown,
  ChevronUp,
  Image,
} from "lucide-react";
import {
  type ManifestGoal,
  type ManifestDailyPractice,
  type ProofEntry,
  type ActEntry,
  type VisualizationEntry,
  DAILY_PRACTICE_KEY,
  GOAL_EXTRAS_KEY,
} from "./types";
import { ManifestVisualizationMode } from "./ManifestVisualizationMode";
import { format } from "date-fns";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { EntryImageUpload } from "@/components/common/EntryImageUpload";

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
  const [expandedSection, setExpandedSection] = useState<string | null>("viz");
  const [growthNote, setGrowthNote] = useState("");
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    setVisualizations([]);
    setActs([]);
    setProofs([]);
    setCurrentActText("");
    setCurrentProofText("");
    setCurrentProofImageUrl(null);
    setGrowthNote("");
    setIsLocked(false);
    setExpandedSection("viz");

    const saved = loadTodaysPractice();
    if (saved.visualizations) setVisualizations(saved.visualizations);
    if (saved.acts) setActs(saved.acts);
    if (saved.proofs) setProofs(saved.proofs);
    if (saved.growth_note) setGrowthNote(saved.growth_note);
    if (saved.locked) setIsLocked(true);
  }, [goal.id, today]);

  const hasViz = visualizations.length > 0;
  const hasAct = acts.length > 0;
  const hasProof = proofs.length > 0;
  const allDone = hasViz && hasAct && hasProof;
  const canLock = allDone && growthNote.trim().length > 0;
  const completedCount = [hasViz, hasAct, hasProof].filter(Boolean).length;

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
    toast.success("Visualization complete! ✨");
    if (!hasAct) setExpandedSection("act");
  };

  const handleAddAct = () => {
    const text = currentActText.trim() || goal.act_as_if;
    const newEntry: ActEntry = { id: crypto.randomUUID(), text, created_at: new Date().toISOString() };
    const updated = [...acts, newEntry];
    setActs(updated);
    setCurrentActText("");
    savePractice({ acts: updated, act_count: updated.length });
    toast.success("Action logged! 💪");
    if (!hasProof) setExpandedSection("proof");
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
    reader.onloadend = () => setCurrentProofImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddProof = () => {
    if (!currentProofText.trim()) {
      toast.error("Add a description");
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
    toast.success("Proof recorded! 🚀");
    setExpandedSection("complete");
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
      alignment: 5,
      growth_note: growthNote,
      locked: true,
    };
    savePractice(practice);
    setIsLocked(true);
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
    toast.success("Day complete! 🎉");
    onPracticeComplete(practice);
  };

  const toggle = (id: string) => setExpandedSection(expandedSection === id ? null : id);

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

  const Step = ({
    id,
    icon: Icon,
    title,
    done,
    children,
  }: {
    id: string;
    icon: any;
    title: string;
    done: boolean;
    children: React.ReactNode;
  }) => (
    <div
      className={`rounded-xl border ${done ? "border-teal-200 bg-teal-50/50 dark:border-teal-800 dark:bg-teal-900/20" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"}`}
    >
      <button onClick={() => toggle(id)} className="w-full flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${done ? "bg-teal-500 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-500"}`}
          >
            {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
          </div>
          <span
            className={`font-medium ${done ? "text-teal-700 dark:text-teal-300" : "text-slate-700 dark:text-slate-200"}`}
          >
            {title}
          </span>
          {done && <span className="text-xs bg-teal-100 text-teal-600 px-2 py-0.5 rounded-full">Done</span>}
        </div>
        {expandedSection === id ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>
      {expandedSection === id && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header with Vision Image */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        {/* Vision Image - Editable */}
        <div className="relative h-32 w-full">
          <EntryImageUpload
            currentImageUrl={goal.vision_image_url || goal.cover_image_url || null}
            presetType="manifest"
            category={goal.category || "other"}
            onImageChange={(url) => {
              // Update local storage
              const extras = JSON.parse(localStorage.getItem(GOAL_EXTRAS_KEY) || "{}");
              extras[goal.id] = { ...extras[goal.id], vision_image_url: url };
              localStorage.setItem(GOAL_EXTRAS_KEY, JSON.stringify(extras));
              toast.success("Vision image updated");
            }}
            className="w-full h-full"
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] text-white/80 bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm">
            <Image className="h-3 w-3" /> Tap to change
          </div>
        </div>
        
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-teal-100 text-teal-600 font-medium">Active</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-orange-100 text-orange-600 font-medium flex items-center gap-1">
                <Flame className="h-3 w-3" /> Day {streak}
              </span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="font-semibold text-slate-800 dark:text-white text-lg leading-tight">{goal.title}</h2>
          {goal.check_in_time && (
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Check-in at {goal.check_in_time}
            </p>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-500">Today's Progress</span>
              <span className="font-semibold text-teal-600">{completedCount}/3</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all"
                style={{ width: `${(completedCount / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Steps */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-3">
          <Step id="viz" icon={Eye} title={`Visualize (${goal.visualization_minutes} min)`} done={hasViz}>
            <p className="text-sm text-slate-500 mb-3">Close your eyes and feel your new reality</p>
            <Button
              onClick={() => setShowVisualization(true)}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
            >
              <Play className="h-4 w-4 mr-2" /> {hasViz ? "Add Session" : "Start"}
            </Button>
            {visualizations.length > 0 && (
              <div className="mt-3 space-y-1">
                {visualizations.map((v, i) => (
                  <div
                    key={v.id}
                    className="text-xs text-slate-500 bg-teal-50 dark:bg-teal-900/30 px-3 py-2 rounded-lg flex items-center gap-2"
                  >
                    <Check className="h-3 w-3 text-teal-500" /> Session {i + 1} •{" "}
                    {format(new Date(v.created_at), "h:mm a")}
                  </div>
                ))}
              </div>
            )}
          </Step>

          <Step id="act" icon={Zap} title="Take Action" done={hasAct}>
            <p className="text-sm text-slate-500 mb-2">Suggestion: {goal.act_as_if}</p>
            <div className="flex gap-2">
              <Input
                value={currentActText}
                onChange={(e) => setCurrentActText(e.target.value)}
                placeholder="What did you do?"
                className="flex-1 rounded-xl h-10"
              />
              <Button onClick={handleAddAct} className="h-10 w-10 rounded-xl bg-teal-500 text-white p-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {acts.length > 0 && (
              <div className="mt-3 space-y-2">
                {acts.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between bg-teal-50 dark:bg-teal-900/30 px-3 py-2 rounded-lg"
                  >
                    <span className="text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
                      <Check className="h-3 w-3 text-teal-500" /> {a.text}
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveAct(a.id)}>
                      <Trash2 className="h-3 w-3 text-slate-400" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Step>

          <Step id="proof" icon={Camera} title="Record Proof" done={hasProof}>
            <p className="text-sm text-slate-500 mb-2">What happened today that proves your reality?</p>
            <Textarea
              value={currentProofText}
              onChange={(e) => setCurrentProofText(e.target.value)}
              placeholder="I noticed..."
              rows={2}
              className="rounded-xl resize-none mb-2"
            />
            <input
              ref={proofImageInputRef}
              type="file"
              accept="image/*"
              onChange={handleProofImageUpload}
              className="hidden"
            />
            {currentProofImageUrl ? (
              <div className="relative mb-2">
                <img src={currentProofImageUrl} alt="Proof" className="w-full h-24 object-cover rounded-xl" />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 rounded-full"
                  onClick={() => setCurrentProofImageUrl(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full rounded-xl border-dashed mb-2 h-10"
                onClick={() => proofImageInputRef.current?.click()}
              >
                <ImagePlus className="h-4 w-4 mr-2" /> Add Photo
              </Button>
            )}
            <Button
              onClick={handleAddProof}
              disabled={!currentProofText.trim()}
              className="w-full h-10 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
            >
              Save Proof
            </Button>
            {proofs.length > 0 && (
              <div className="mt-3 space-y-2">
                {proofs.map((p) => (
                  <div key={p.id} className="bg-teal-50 dark:bg-teal-900/30 p-3 rounded-lg">
                    <div className="flex items-start justify-between">
                      <p className="text-sm text-slate-700 dark:text-slate-200 flex-1">{p.text}</p>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveProof(p.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    {p.image_url && (
                      <img src={p.image_url} alt="Proof" className="w-full h-20 object-cover rounded-lg mt-2" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </Step>

          {allDone && (
            <Step id="complete" icon={Lock} title="Complete Day" done={isLocked}>
              <div className="space-y-3">
                <Input
                  value={growthNote}
                  onChange={(e) => {
                    setGrowthNote(e.target.value);
                    savePractice({ growth_note: e.target.value });
                  }}
                  placeholder="What did you learn today?"
                  className="rounded-xl h-10"
                />
                <Button
                  onClick={handleLockToday}
                  disabled={!canLock}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium"
                >
                  <Lock className="h-4 w-4 mr-2" /> Complete Day ✨
                </Button>
              </div>
            </Step>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
