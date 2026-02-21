import { useState, useEffect, useRef } from "react";
import { useDatePreferences } from "@/hooks/useDatePreferences";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
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
  Heart,
} from "lucide-react";
import {
  type ManifestGoal,
  type ManifestDailyPractice,
  type ProofEntry,
  type ActEntry,
  type VisualizationEntry,
  type GratitudeEntry,
} from "./types";
import { ManifestVisualizationMode } from "./ManifestVisualizationMode";
import { format, isToday, isBefore, startOfDay } from "date-fns";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { isOfflineError } from "@/lib/offlineAwareOperation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
  onGoalUpdate,
}: ManifestPracticePanelProps) {
  const { formatDate: fmtDate } = useDatePreferences();
  const { user } = useAuth();
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const isViewingToday = isToday(selectedDate);
  const isViewingPast = isBefore(startOfDay(selectedDate), startOfDay(new Date()));
  const proofImageInputRef = useRef<HTMLInputElement>(null);

  const loadPractice = async (date: string): Promise<Partial<ManifestDailyPractice>> => {
    if (!user) return {};
    try {
      const { data } = await supabase
        .from("manifest_practices")
        .select("*")
        .eq("goal_id", goal.id)
        .eq("entry_date", date)
        .maybeSingle();
      if (data) {
        return {
          visualizations: (data as any).visualizations || [],
          acts: (data as any).acts || [],
          proofs: (data as any).proofs || [],
          gratitudes: (data as any).gratitudes || [],
          alignment: (data as any).alignment,
          growth_note: (data as any).growth_note,
          locked: (data as any).locked || false,
        };
      }
    } catch (e) {
      console.warn("Failed to load practice:", e);
    }
    return {};
  };

  const savePractice = async (practice: Partial<ManifestDailyPractice>) => {
    if (!isViewingToday || !user) return;

    // Save to DB
    try {
      const upsertData: any = {
        goal_id: goal.id,
        user_id: user.id,
        entry_date: dateStr,
        visualizations: JSON.stringify(practice.visualizations ?? []),
        acts: JSON.stringify(practice.acts ?? []),
        proofs: JSON.stringify(practice.proofs ?? []),
        gratitudes: JSON.stringify(practice.gratitudes ?? []),
        alignment: practice.alignment ?? null,
        growth_note: practice.growth_note ?? null,
        locked: practice.locked ?? false,
      };
      await supabase
        .from("manifest_practices")
        .upsert(upsertData, { onConflict: "goal_id,entry_date" } as any);
    } catch (e) {
      console.warn("Failed to save practice to DB:", e);
    }
  };

  const [visualizations, setVisualizations] = useState<VisualizationEntry[]>([]);
  const [acts, setActs] = useState<ActEntry[]>([]);
  const [proofs, setProofs] = useState<ProofEntry[]>([]);
  const [gratitudes, setGratitudes] = useState<GratitudeEntry[]>([]);
  const [showVisualization, setShowVisualization] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("viz");
  const [isLocked, setIsLocked] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  // Use refs for text inputs to prevent re-render issues
  const actInputRef = useRef<HTMLInputElement>(null);
  const proofTextRef = useRef<HTMLTextAreaElement>(null);
  const growthNoteRef = useRef<HTMLInputElement>(null);
  const gratitudeInputRef = useRef<HTMLInputElement>(null);
  const [currentProofImageUrl, setCurrentProofImageUrl] = useState<string | null>(null);
  const [growthNoteValue, setGrowthNoteValue] = useState("");

  // Track goal id and date separately to avoid full resets on goal object changes
  const goalIdRef = useRef(goal.id);
  const dateStrRef = useRef(dateStr);

  useEffect(() => {
    const goalChanged = goalIdRef.current !== goal.id;
    const dateChanged = dateStrRef.current !== dateStr;

    if (goalChanged || dateChanged) {
      goalIdRef.current = goal.id;
      dateStrRef.current = dateStr;

      if (actInputRef.current) actInputRef.current.value = "";
      if (proofTextRef.current) proofTextRef.current.value = "";
      if (growthNoteRef.current) growthNoteRef.current.value = "";
      if (gratitudeInputRef.current) gratitudeInputRef.current.value = "";
      setCurrentProofImageUrl(null);
      setGrowthNoteValue("");

      setVisualizations([]);
      setActs([]);
      setProofs([]);
      setGratitudes([]);
      setIsLocked(false);
      setExpandedSection("viz");
      setCurrentImageUrl(goal.cover_image_url || goal.vision_image_url || null);

      (async () => {
        const saved = await loadPractice(dateStr);
        if (saved.visualizations) setVisualizations(saved.visualizations);
        if (saved.acts) setActs(saved.acts);
        if (saved.proofs) setProofs(saved.proofs);
        if (saved.gratitudes) setGratitudes(saved.gratitudes);
        if (saved.growth_note) {
          setGrowthNoteValue(saved.growth_note);
          if (growthNoteRef.current) growthNoteRef.current.value = saved.growth_note;
        }
        if (saved.locked) setIsLocked(true);
      })();
    }
  }, [goal.id, dateStr]);

  const hasViz = visualizations.length > 0;
  const hasAct = acts.length > 0;
  const hasProof = proofs.length > 0;
  const hasGratitude = gratitudes.length > 0;
  const allDone = hasViz && hasAct && hasProof && hasGratitude;
  const canLock = allDone && growthNoteValue.trim().length > 0;
  const completedCount = [hasViz, hasAct, hasProof, hasGratitude].filter(Boolean).length;

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
    if (!hasGratitude) setExpandedSection("gratitude");
  };

  const handleRemoveProof = (id: string) => {
    const updated = proofs.filter((p) => p.id !== id);
    setProofs(updated);
    savePractice({ proofs: updated });
  };

  const handleAddGratitude = () => {
    const text = gratitudeInputRef.current?.value.trim() || "";
    if (!text) {
      toast.error("Enter something you're grateful for");
      return;
    }
    const newEntry: GratitudeEntry = {
      id: crypto.randomUUID(),
      text,
      created_at: new Date().toISOString(),
    };
    const updated = [...gratitudes, newEntry];
    setGratitudes(updated);
    if (gratitudeInputRef.current) gratitudeInputRef.current.value = "";
    savePractice({ gratitudes: updated });
    toast.success("Gratitude added! 🙏");
    if (hasViz && hasAct && hasProof && updated.length > 0) {
      setExpandedSection("complete");
    }
  };

  const handleRemoveGratitude = (id: string) => {
    const updated = gratitudes.filter((g) => g.id !== id);
    setGratitudes(updated);
    savePractice({ gratitudes: updated });
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
      gratitudes,
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

    // Update database directly (no more localStorage extras)
    try {
      const { error } = await supabase.from("manifest_goals").update({ cover_image_url: url }).eq("id", goal.id);

      if (error) throw error;
      toast.success("Vision image updated");

      // Notify parent to refresh
      if (onGoalUpdate) {
        onGoalUpdate();
      }
    } catch (error) {
      console.error("Failed to update image in database:", error);
      if (!isOfflineError()) {
        toast.error("Failed to save image change");
      } else {
        toast.info("You're offline — changes will sync when connected");
      }
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

  const StepCard = ({
    id,
    icon: Icon,
    title,
    done,
    disabled,
    children,
    accentColor = "teal",
  }: {
    id: string;
    icon: any;
    title: string;
    done: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    accentColor?: string;
  }) => {
    const isExpanded = expandedSection === id;
    return (
      <Card
        className={`overflow-hidden cursor-pointer transition-all ${
          done
            ? "border-teal-200 dark:border-teal-800 bg-teal-50/30 dark:bg-teal-900/10"
            : ""
        } ${disabled ? "opacity-60 pointer-events-none" : ""}`}
        onClick={() => !disabled && toggle(id)}
      >
        {/* Square card header */}
        <div className="flex items-center gap-3 p-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              done ? "bg-teal-500 text-white" : "bg-muted text-muted-foreground"
            }`}
          >
            {done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <span className={`font-medium text-sm leading-tight ${done ? "text-teal-700 dark:text-teal-300" : "text-foreground"}`}>
              {title}
            </span>
            {done && (
              <span className="ml-2 text-[9px] bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 px-1.5 py-0.5 rounded-full">
                Done
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
        </div>
        {isExpanded && !disabled && (
          <div className="px-3 pb-3 space-y-3 border-t border-border pt-3" onClick={(e) => e.stopPropagation()}>
            {children}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Header with Vision Image */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
        {/* Vision Image - Read-only display */}
        <div className="relative h-36 w-full overflow-hidden">
          {currentImageUrl ? (
            <img src={currentImageUrl} alt={goal.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-muted" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
        </div>

        <div className="p-3">
          <div className="flex items-start justify-between mb-2">
            <div className="flex gap-1.5 flex-wrap">
              {!isViewingToday && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 font-medium flex items-center gap-1">
                  <CalendarDays className="h-2.5 w-2.5" /> {fmtDate(selectedDate, "full")}
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

          {/* Start Date & Total Practice Days */}
          <div className="flex gap-3 mt-2">
            <div className="text-xs text-slate-500">
              <span className="text-slate-400">Started:</span>{" "}
              <span className="font-medium text-slate-600 dark:text-slate-300">
                {fmtDate(new Date(goal.start_date || goal.created_at), "full")}
              </span>
            </div>
            {goal.created_at && (
              <div className="text-xs text-slate-500">
                <span className="text-slate-400">Practice Days:</span>{" "}
                <span className="font-medium text-slate-600 dark:text-slate-300">{streak}</span>
              </div>
            )}
          </div>

          {/* Vision Board - Show additional images - Larger and stretched */}
          {goal.vision_images && goal.vision_images.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1.5">
              {goal.vision_images.map((img, i) => (
                <div
                  key={i}
                  className="flex-1 min-w-0 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600"
                >
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
              <span className="font-semibold text-teal-600">{completedCount}/4</span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all"
                style={{ width: `${(completedCount / 4) * 100}%` }}
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
        <div className="grid grid-cols-2 gap-2">
          {/* Visualize card */}
          <StepCard
            id="viz"
            icon={Eye}
            title={`Visualize (${goal.visualization_minutes} min)`}
            done={hasViz}
            disabled={isViewingPast && !isLocked}
          >
            <p className="text-sm text-muted-foreground mb-3">Close your eyes and feel your new reality</p>
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
                    className="text-xs text-muted-foreground bg-teal-50 dark:bg-teal-900/30 px-3 py-2 rounded-lg flex items-center gap-2"
                  >
                    <Check className="h-3 w-3 text-teal-500" /> Session {i + 1} •{" "}
                    {format(new Date(v.created_at), "h:mm a")}
                  </div>
                ))}
              </div>
            )}
          </StepCard>

          {/* Take Action card */}
          <StepCard id="act" icon={Zap} title="Take Action" done={hasAct} disabled={isViewingPast && !isLocked}>
            <p className="text-sm text-muted-foreground mb-2">Suggestion: {goal.act_as_if}</p>
            <div className="flex gap-2">
              <Input
                ref={actInputRef}
                defaultValue=""
                placeholder="What did you do?"
                className="flex-1 rounded-xl h-10"
                disabled={isViewingPast}
              />
              <Button
                onClick={handleAddAct}
                className="h-10 w-10 rounded-xl bg-teal-500 text-white p-0"
                disabled={isViewingPast}
              >
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
                      <span className="text-sm text-foreground flex items-center gap-2">
                        <Check className="h-3 w-3 text-teal-500 flex-shrink-0" /> {a.text}
                      </span>
                      <span className="text-[9px] text-muted-foreground ml-5">{format(new Date(a.created_at), "h:mm a")}</span>
                    </div>
                    {isViewingToday && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={() => handleRemoveAct(a.id)}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </StepCard>

          {/* Record Proof card */}
          <StepCard id="proof" icon={Camera} title="Record Proof" done={hasProof} disabled={isViewingPast && !isLocked}>
            <p className="text-sm text-muted-foreground mb-2">What happened today that proves your reality?</p>
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
                        <p className="text-sm text-foreground">{p.text}</p>
                        <span className="text-[9px] text-muted-foreground">{format(new Date(p.created_at), "h:mm a")}</span>
                      </div>
                      {isViewingToday && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={() => handleRemoveProof(p.id)}
                        >
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
          </StepCard>

          {/* Gratitude card */}
          <StepCard
            id="gratitude"
            icon={Heart}
            title="Practice Gratitude"
            done={hasGratitude}
            disabled={isViewingPast && !isLocked}
          >
            <p className="text-sm text-muted-foreground mb-2">What are you grateful for today?</p>
            <div className="flex gap-2">
              <Input
                ref={gratitudeInputRef}
                defaultValue=""
                placeholder="I'm grateful for..."
                className="flex-1 rounded-xl h-10"
                disabled={isViewingPast}
              />
              <Button
                onClick={handleAddGratitude}
                className="h-10 w-10 rounded-xl bg-pink-500 hover:bg-pink-600 text-white p-0"
                disabled={isViewingPast}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {gratitudes.length > 0 && (
              <div className="mt-3 space-y-2">
                {gratitudes.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-start justify-between bg-pink-50 dark:bg-pink-900/30 px-3 py-2 rounded-lg"
                  >
                    <div className="flex-1">
                      <span className="text-sm text-foreground flex items-center gap-2">
                        <Heart className="h-3 w-3 text-pink-500 flex-shrink-0 fill-pink-500" /> {g.text}
                      </span>
                      <span className="text-[9px] text-muted-foreground ml-5">{format(new Date(g.created_at), "h:mm a")}</span>
                    </div>
                    {isViewingToday && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={() => handleRemoveGratitude(g.id)}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </StepCard>
        </div>

        {/* Complete Day - Full width below the grid */}
        {allDone && (
          <div className="mt-2">
            <StepCard id="complete" icon={Lock} title="Complete Day" done={isLocked} disabled={isViewingPast && !isLocked}>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Add a growth note to lock your practice</p>
                <Input
                  ref={growthNoteRef}
                  defaultValue={growthNoteValue}
                  placeholder="Today I learned that..."
                  className="rounded-xl h-10"
                  disabled={isViewingPast || isLocked}
                  onBlur={(e) => {
                    setGrowthNoteValue(e.target.value);
                    savePractice({ growth_note: e.target.value });
                  }}
                />
                <Button
                  onClick={handleLockToday}
                  disabled={!canLock || isViewingPast || isLocked}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium"
                >
                  <Lock className="h-4 w-4 mr-2" /> Complete Day ✨
                </Button>
              </div>
            </StepCard>
          </div>
        )}
      </div>
    </div>
  );
}
