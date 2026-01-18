import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";
import {
  type ManifestGoal,
  type ManifestDailyPractice,
  type ProofEntry,
  type ActEntry,
  type VisualizationEntry,
  DAILY_PRACTICE_KEY,
} from "./types";
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

  const [alignment, setAlignment] = useState(5);
  const [growthNote, setGrowthNote] = useState("");
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    setVisualizations([]);
    setActs([]);
    setProofs([]);
    setCurrentActText("");
    setCurrentProofText("");
    setCurrentProofImageUrl(null);
    setAlignment(5);
    setGrowthNote("");
    setIsLocked(false);
    setExpandedSection("viz");

    const saved = loadTodaysPractice();
    if (saved.visualizations) setVisualizations(saved.visualizations);
    if (saved.acts) setActs(saved.acts);
    if (saved.proofs) setProofs(saved.proofs);
    if (saved.alignment) setAlignment(saved.alignment);
    if (saved.growth_note) setGrowthNote(saved.growth_note);
    if (saved.locked) setIsLocked(true);
  }, [goal.id, today]);

  const hasVisualization = visualizations.length > 0;
  const hasAct = acts.length > 0;
  const hasProof = proofs.length > 0;
  const allTasksDone = hasVisualization && hasAct && hasProof;
  const canLock = allTasksDone && growthNote.trim().length > 0;

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
    const newEntry: ActEntry = {
      id: crypto.randomUUID(),
      text,
      created_at: new Date().toISOString(),
    };
    const updated = [...acts, newEntry];
    setActs(updated);
    setCurrentActText("");
    savePractice({ acts: updated, act_count: updated.length });
    toast.success("Action recorded! 💪");
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
    reader.onloadend = () => {
      setCurrentProofImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddProof = () => {
    if (!currentProofText.trim()) {
      toast.error("Describe your proof");
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
    toast.success("Proof saved! 🚀");
    setExpandedSection("checkin");
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
      alignment,
      growth_note: growthNote,
      locked: true,
    };

    savePractice(practice);
    setIsLocked(true);

    confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
    toast.success("Day complete! 🎉");
    onPracticeComplete(practice);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

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

  const TaskItem = ({
    id,
    icon: Icon,
    title,
    isComplete,
    children,
  }: {
    id: string;
    icon: React.ElementType;
    title: string;
    isComplete: boolean;
    children: React.ReactNode;
  }) => {
    const isExpanded = expandedSection === id;

    return (
      <div
        className={`rounded-2xl border transition-all ${
          isComplete
            ? "border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-900/20"
            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        }`}
      >
        <button onClick={() => toggleSection(id)} className="w-full flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isComplete
                  ? "bg-gradient-to-br from-teal-500 to-cyan-500 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              }`}
            >
              {isComplete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </div>
            <span
              className={`font-medium ${isComplete ? "text-teal-700 dark:text-teal-300" : "text-slate-700 dark:text-slate-200"}`}
            >
              {title}
            </span>
            {isComplete && (
              <span className="text-xs bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded-full">
                Done
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </button>

        {isExpanded && <div className="px-4 pb-4 space-y-3">{children}</div>}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs font-semibold flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Active
              </div>
              <div className="px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-semibold flex items-center gap-1">
                <Flame className="h-3 w-3" />
                Day {streak}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Vision Image Preview */}
        {goal.vision_image_url && (
          <div
            className="w-full h-32 rounded-xl overflow-hidden mb-4 relative group cursor-pointer"
            onClick={() => setShowVisualization(true)}
          >
            <img src={goal.vision_image_url} alt="Vision" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-sm font-medium flex items-center gap-2">
                <Play className="h-4 w-4" /> Start Visualization
              </span>
            </div>
          </div>
        )}

        <h3 className="font-semibold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2 mb-1">
          {goal.title}
        </h3>

        {goal.check_in_time && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="h-3 w-3" />
            <span>Check-in at {goal.check_in_time}</span>
          </div>
        )}
      </div>

      {/* Scrollable Tasks */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-0">
          {/* Progress Indicator */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 mb-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-500 font-medium">Today's Progress</span>
                <span className="font-bold text-teal-600">
                  {[hasVisualization, hasAct, hasProof].filter(Boolean).length}/3 tasks
                </span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-500"
                  style={{ width: `${([hasVisualization, hasAct, hasProof].filter(Boolean).length / 3) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Tasks with connecting line */}
          <div className="relative">
            {/* Vertical connecting line */}
            <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-700 z-0">
              {/* Filled portion based on progress */}
              <div
                className="w-full bg-gradient-to-b from-teal-500 to-cyan-500 transition-all duration-500"
                style={{ height: `${([hasVisualization, hasAct, hasProof].filter(Boolean).length / 3) * 100}%` }}
              />
            </div>

            {/* Task 1: Visualization */}
            <div className="relative z-10 mb-3">
              <TaskItem
                id="viz"
                icon={Eye}
                title={`Visualize (${goal.visualization_minutes} min)`}
                isComplete={hasVisualization}
              >
                <p className="text-sm text-slate-500 mb-3">Close your eyes and vividly imagine your new reality</p>
                <Button
                  onClick={() => setShowVisualization(true)}
                  className={`w-full rounded-full h-12 ${hasVisualization ? "bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200" : "bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600"}`}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {hasVisualization ? "Add Another Session" : "Start Visualization"}
                </Button>
                {visualizations.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {visualizations.map((v, i) => (
                      <div
                        key={v.id}
                        className="flex items-center gap-2 text-xs text-slate-500 bg-teal-50 dark:bg-teal-900/30 px-3 py-2 rounded-lg"
                      >
                        <Check className="h-3 w-3 text-teal-500" />
                        Session {i + 1} • {format(new Date(v.created_at), "h:mm a")}
                      </div>
                    ))}
                  </div>
                )}
              </TaskItem>
            </div>

            {/* Task 2: Act-as-If */}
            <div className="relative z-10 mb-3">
              <TaskItem id="act" icon={Zap} title="Take One Action" isComplete={hasAct}>
                <p className="text-sm text-slate-500 mb-2">
                  Suggestion: <span className="font-medium text-slate-600">{goal.act_as_if}</span>
                </p>
                <div className="flex gap-2">
                  <Input
                    value={currentActText}
                    onChange={(e) => setCurrentActText(e.target.value)}
                    placeholder="What action did you take?"
                    className="flex-1 rounded-xl"
                  />
                  <Button
                    onClick={handleAddAct}
                    className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-4"
                  >
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
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="h-3 w-3 text-teal-500" />
                          <span className="text-slate-700 dark:text-slate-300">{a.text}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveAct(a.id)}>
                          <Trash2 className="h-3 w-3 text-slate-400" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TaskItem>
            </div>

            {/* Task 3: Record Proof */}
            <div className="relative z-10 mb-3">
              <TaskItem id="proof" icon={Camera} title="Record Proof" isComplete={hasProof}>
                <p className="text-sm text-slate-500 mb-2">What happened today that proves your new reality?</p>
                <Textarea
                  value={currentProofText}
                  onChange={(e) => setCurrentProofText(e.target.value)}
                  placeholder="I received positive feedback on my presentation..."
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
                    className="w-full rounded-xl border-dashed mb-2"
                    onClick={() => proofImageInputRef.current?.click()}
                  >
                    <ImagePlus className="h-4 w-4 mr-2" />
                    Attach Screenshot
                  </Button>
                )}

                <Button
                  onClick={handleAddProof}
                  disabled={!currentProofText.trim()}
                  className="w-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
                >
                  Save Proof
                </Button>

                {proofs.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {proofs.map((p) => (
                      <div key={p.id} className="bg-teal-50 dark:bg-teal-900/30 p-3 rounded-lg space-y-2">
                        <div className="flex items-start justify-between">
                          <p className="text-sm text-slate-700 dark:text-slate-300 flex-1">{p.text}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleRemoveProof(p.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        {p.image_url && (
                          <img src={p.image_url} alt="Proof" className="w-full h-20 object-cover rounded-lg" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TaskItem>
            </div>

            {/* Check-in Section - appears when all tasks done */}
            {allTasksDone && (
              <div className="relative z-10">
                <TaskItem id="checkin" icon={Lock} title="Complete Day" isComplete={isLocked}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm">
                        Growth Note <span className="text-teal-500">*</span>
                      </Label>
                      <Input
                        value={growthNote}
                        onChange={(e) => {
                          setGrowthNote(e.target.value);
                          savePractice({ growth_note: e.target.value });
                        }}
                        placeholder="What did you learn? What will you do tomorrow?"
                        className="rounded-xl"
                      />
                    </div>

                    <Button
                      onClick={handleLockToday}
                      disabled={!canLock}
                      className="w-full rounded-full h-12 bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Complete Today ✨
                    </Button>
                  </div>
                </TaskItem>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
