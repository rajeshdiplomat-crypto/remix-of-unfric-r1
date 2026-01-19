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
  Flame,
  Eye,
  Zap,
  ChevronDown,
  ChevronUp,
  Image,
  CalendarDays,
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
import { format, isToday, isBefore, startOfDay } from "date-fns";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { EntryImageUpload } from "@/components/common/EntryImageUpload";
import { supabase } from "@/integrations/supabase/client";

interface ManifestPracticePanelProps {
  goal: ManifestGoal;
  streak: number;
  selectedDate?: Date;
  previousPractice?: ManifestDailyPractice | null;
  onClose: () => void;
  onPracticeComplete: (practice: ManifestDailyPractice) => void;
  onGoalUpdate?: () => void;
}

export function ManifestPracticePanel({ 
  goal, 
  streak, 
  selectedDate = new Date(),
  previousPractice,
  onClose, 
  onPracticeComplete, 
  onGoalUpdate 
}: ManifestPracticePanelProps) {
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const isViewingToday = isToday(selectedDate);
  const isViewingPast = isBefore(startOfDay(selectedDate), startOfDay(new Date()));
  const proofImageInputRef = useRef<HTMLInputElement>(null);

  const loadPractice = (date: string): Partial<ManifestDailyPractice> => {
    try {
      const stored = localStorage.getItem(DAILY_PRACTICE_KEY);
      if (stored) {
        const all = JSON.parse(stored);
        return all[`${goal.id}_${date}`] || {};
      }
    } catch (e) {
      console.warn("Failed to load practice:", e);
    }
    return {};
  };

  const savePractice = (practice: Partial<ManifestDailyPractice>) => {
    if (!isViewingToday) return; // Don't save for past dates
    try {
      const stored = localStorage.getItem(DAILY_PRACTICE_KEY);
      const all = stored ? JSON.parse(stored) : {};
      all[`${goal.id}_${dateStr}`] = { ...all[`${goal.id}_${dateStr}`], ...practice };
      localStorage.setItem(DAILY_PRACTICE_KEY, JSON.stringify(all));
    } catch (e) {
      console.warn("Failed to save practice:", e);
    }
  };

  const [visualizations, setVisualizations] = useState<VisualizationEntry[]>([]);
  const [acts, setActs] = useState<ActEntry[]>([]);
  const [proofs, setProofs] = useState<ProofEntry[]>([]);
  const [showVisualization, setShowVisualization] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("viz");
  const [isLocked, setIsLocked] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  
  // Use refs for text inputs to prevent re-render issues
  const actInputRef = useRef<HTMLInputElement>(null);
  const proofTextRef = useRef<HTMLTextAreaElement>(null);
  const growthNoteRef = useRef<HTMLInputElement>(null);
  const [currentProofImageUrl, setCurrentProofImageUrl] = useState<string | null>(null);
  const [growthNoteValue, setGrowthNoteValue] = useState("");

  // Track goal id and date separately to avoid full resets on goal object changes
  const goalIdRef = useRef(goal.id);
  const dateStrRef = useRef(dateStr);

  useEffect(() => {
    // Only reset state when goal or date actually changes
    const goalChanged = goalIdRef.current !== goal.id;
    const dateChanged = dateStrRef.current !== dateStr;
    
    if (goalChanged || dateChanged) {
      goalIdRef.current = goal.id;
      dateStrRef.current = dateStr;
      
      // Clear input refs
      if (actInputRef.current) actInputRef.current.value = "";
      if (proofTextRef.current) proofTextRef.current.value = "";
      if (growthNoteRef.current) growthNoteRef.current.value = "";
      setCurrentProofImageUrl(null);
      setGrowthNoteValue("");
      
      setVisualizations([]);
      setActs([]);
      setProofs([]);
      setIsLocked(false);
      setExpandedSection("viz");
      setCurrentImageUrl(goal.vision_image_url || goal.cover_image_url || null);

      const saved = loadPractice(dateStr);
      if (saved.visualizations) setVisualizations(saved.visualizations);
      if (saved.acts) setActs(saved.acts);
      if (saved.proofs) setProofs(saved.proofs);
      if (saved.growth_note) {
        setGrowthNoteValue(saved.growth_note);
        if (growthNoteRef.current) growthNoteRef.current.value = saved.growth_note;
      }
      if (saved.locked) setIsLocked(true);
    }
  }, [goal.id, dateStr]);

  const hasViz = visualizations.length > 0;
  const hasAct = acts.length > 0;
  const hasProof = proofs.length > 0;
  const allDone = hasViz && hasAct && hasProof;
  const canLock = allDone && growthNoteValue.trim().length > 0;
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
    const text = actInputRef.current?.value.trim() || goal.act_as_if;
    const newEntry: ActEntry = { id: crypto.randomUUID(), text, created_at: new Date().toISOString() };
    const updated = [...acts, newEntry];
    setActs(updated);
    if (actInputRef.current) actInputRef.current.value = "";
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
    const proofText = proofTextRef.current?.value.trim() || "";
    if (!proofText) {
      toast.error("Add a description");
      return;
    }
    const newEntry: ProofEntry = {
      id: crypto.randomUUID(),
      text: proofText,
      image_url: currentProofImageUrl || undefined,
      created_at: new Date().toISOString(),
    };
    const updated = [...proofs, newEntry];
    setProofs(updated);
    if (proofTextRef.current) proofTextRef.current.value = "";
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
      id: `${goal.id}_${dateStr}`,
      goal_id: goal.id,
      user_id: goal.user_id,
      entry_date: dateStr,
      created_at: new Date().toISOString(),
      visualization_count: visualizations.length,
      visualizations,
      act_count: acts.length,
      acts,
      proofs,
      alignment: 5,
      growth_note: growthNoteValue,
      locked: true,
    };
    savePractice(practice);
    setIsLocked(true);
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
    toast.success("Day complete! 🎉");
    onPracticeComplete(practice);
  };

  const handleImageChange = async (url: string | null) => {
    setCurrentImageUrl(url);
    
    // Update local storage
    try {
      const extras = JSON.parse(localStorage.getItem(GOAL_EXTRAS_KEY) || "{}");
      extras[goal.id] = { ...extras[goal.id], vision_image_url: url };
      localStorage.setItem(GOAL_EXTRAS_KEY, JSON.stringify(extras));
    } catch (e) {
      console.warn("Failed to update local storage:", e);
    }

    // Update database
    try {
      const { error } = await supabase
        .from("manifest_goals")
        .update({ cover_image_url: url })
        .eq("id", goal.id);
      
      if (error) throw error;
      toast.success("Vision image updated");
      
      // Notify parent to refresh
      if (onGoalUpdate) {
        onGoalUpdate();
      }
    } catch (error) {
      console.error("Failed to update image in database:", error);
      toast.error("Failed to save image change");
    }
  };

  const toggle = (id: string) => setExpandedSection(expandedSection === id ? null : id);

  if (showVisualization) {
    return (
      <ManifestVisualizationMode
        goal={goal}
        duration={goal.visualization_minutes}
        previousPractice={previousPractice}
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
    disabled,
    children,
  }: {
    id: string;
    icon: any;
    title: string;
    done: boolean;
    disabled?: boolean;
    children: React.ReactNode;
  }) => (
    <div
      className={`rounded-xl border ${done ? "border-teal-200 bg-teal-50/50 dark:border-teal-800 dark:bg-teal-900/20" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"} ${disabled ? "opacity-60" : ""}`}
    >
      <button onClick={() => !disabled && toggle(id)} className="w-full flex items-center justify-between p-4" disabled={disabled}>
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
      {expandedSection === id && !disabled && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Header with Vision Image */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
        {/* Vision Image - Full width, editable */}
        <div className="relative h-36 w-full overflow-hidden">
          <EntryImageUpload
            currentImageUrl={currentImageUrl}
            presetType="manifest"
            category={goal.category || "other"}
            onImageChange={handleImageChange}
            className="w-full h-full"
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] text-white/80 bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm">
            <Image className="h-3 w-3" /> Tap to change
          </div>
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
        </div>
        
        <div className="p-3">
          <div className="flex items-start justify-between mb-2">
            <div className="flex gap-1.5 flex-wrap">
              {!isViewingToday && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 font-medium flex items-center gap-1">
                  <CalendarDays className="h-2.5 w-2.5" /> {format(selectedDate, "MMM d, yyyy")}
                </span>
              )}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-600 font-medium">
                {isLocked ? "Completed" : "Active"}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 font-medium flex items-center gap-1">
                <Flame className="h-2.5 w-2.5" /> Day {streak}
              </span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={onClose}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <h2 className="font-semibold text-slate-800 dark:text-white text-base leading-tight">{goal.title}</h2>
          {goal.check_in_time && (
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Check-in at {goal.check_in_time}
            </p>
          )}
          
          {/* Vision Board - Show additional images - Larger and stretched */}
          {goal.vision_images && goal.vision_images.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1.5">
              {goal.vision_images.map((img, i) => (
                <div key={i} className="flex-1 min-w-0 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600">
                  <img src={img} alt={`Vision ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="px-3 pt-3">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="flex-1">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-slate-500">{isViewingToday ? "Today's Progress" : "Day Progress"}</span>
              <span className="font-semibold text-teal-600">{completedCount}/3</span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all"
                style={{ width: `${(completedCount / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Past date warning */}
      {isViewingPast && !isLocked && (
        <div className="mx-3 mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-[10px] text-amber-700 dark:text-amber-300">
            You're viewing a past date. This practice was not completed.
          </p>
        </div>
      )}

      {/* Steps - Single scrollable area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3">
        <div className="space-y-2">
          <Step id="viz" icon={Eye} title={`Visualize (${goal.visualization_minutes} min)`} done={hasViz} disabled={isViewingPast && !isLocked}>
            <p className="text-sm text-slate-500 mb-3">Close your eyes and feel your new reality</p>
            <Button
              onClick={() => setShowVisualization(true)}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
              disabled={isViewingPast}
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

          <Step id="act" icon={Zap} title="Take Action" done={hasAct} disabled={isViewingPast && !isLocked}>
            <p className="text-sm text-slate-500 mb-2">Suggestion: {goal.act_as_if}</p>
            <div className="flex gap-2">
              <Input
                ref={actInputRef}
                defaultValue=""
                placeholder="What did you do?"
                className="flex-1 rounded-xl h-10"
                disabled={isViewingPast}
              />
              <Button onClick={handleAddAct} className="h-10 w-10 rounded-xl bg-teal-500 text-white p-0" disabled={isViewingPast}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {acts.length > 0 && (
              <div className="mt-3 space-y-2">
                {acts.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-start justify-between bg-teal-50 dark:bg-teal-900/30 px-3 py-2 rounded-lg"
                  >
                    <div className="flex-1">
                      <span className="text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <Check className="h-3 w-3 text-teal-500 flex-shrink-0" /> {a.text}
                      </span>
                      <span className="text-[9px] text-slate-400 ml-5">
                        {format(new Date(a.created_at), "h:mm a")}
                      </span>
                    </div>
                    {isViewingToday && (
                      <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => handleRemoveAct(a.id)}>
                        <Trash2 className="h-3 w-3 text-slate-400" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Step>

          <Step id="proof" icon={Camera} title="Record Proof" done={hasProof} disabled={isViewingPast && !isLocked}>
            <p className="text-sm text-slate-500 mb-2">What happened today that proves your reality?</p>
            <Textarea
              ref={proofTextRef}
              defaultValue=""
              placeholder="I noticed..."
              rows={2}
              className="rounded-xl resize-none mb-2"
              disabled={isViewingPast}
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
                disabled={isViewingPast}
              >
                <ImagePlus className="h-4 w-4 mr-2" /> Add Photo
              </Button>
            )}
            <Button
              onClick={handleAddProof}
              disabled={isViewingPast}
              className="w-full h-10 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
            >
              Save Proof
            </Button>
            {proofs.length > 0 && (
              <div className="mt-3 space-y-2">
                {proofs.map((p) => (
                  <div key={p.id} className="bg-teal-50 dark:bg-teal-900/30 p-3 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-slate-700 dark:text-slate-200">{p.text}</p>
                        <span className="text-[9px] text-slate-400">
                          {format(new Date(p.created_at), "h:mm a")}
                        </span>
                      </div>
                      {isViewingToday && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => handleRemoveProof(p.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
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
            <Step id="complete" icon={Lock} title="Complete Day" done={isLocked} disabled={isViewingPast && !isLocked}>
              <div className="space-y-3">
                <Input
                  ref={growthNoteRef}
                  defaultValue={growthNoteValue}
                  onChange={(e) => {
                    setGrowthNoteValue(e.target.value);
                    savePractice({ growth_note: e.target.value });
                  }}
                  placeholder="What did you learn today?"
                  className="rounded-xl h-10"
                  disabled={isViewingPast || isLocked}
                />
                <Button
                  onClick={handleLockToday}
                  disabled={!canLock || isViewingPast || isLocked}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium"
                >
                  <Lock className="h-4 w-4 mr-2" /> Complete Day ✨
                </Button>
              </div>
            </Step>
          )}
        </div>
      </div>
    </div>
  );
}
