import { useState, useEffect, useRef, useMemo } from "react";
import { useDatePreferences } from "@/hooks/useDatePreferences";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Check,
  Camera,
  Lock,
  X,
  ImagePlus,
  Trash2,
  Plus,
  Flame,
  Eye,
  Zap,
  CalendarDays,
  Heart,
  Quote,
  Sparkles,
  Clock,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  type ManifestGoal,
  type ManifestDailyPractice,
  type ProofEntry,
  type ActEntry,
  type VisualizationEntry,
  type GratitudeEntry,
  CATEGORIES,
} from "./types";
import { ManifestVisualizationMode } from "./ManifestVisualizationMode";
import { format, isToday, isBefore, startOfDay, differenceInDays } from "date-fns";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { isOfflineError } from "@/lib/offlineAwareOperation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface ManifestPracticePanelProps {
  goal: ManifestGoal;
  streak: number;
  totalPracticed?: number;
  selectedDate?: Date;
  previousPractice?: ManifestDailyPractice | null;
  onClose: () => void;
  onPracticeComplete: (practice: ManifestDailyPractice) => void;
  onGoalUpdate?: () => void;
}

const RING_CONFIG = [
  { id: "viz", icon: Eye, label: "Visualize", color: "hsl(175, 84%, 40%)", bgClass: "bg-[hsl(175,84%,40%)]" },
  { id: "act", icon: Zap, label: "Act", color: "hsl(45, 93%, 47%)", bgClass: "bg-[hsl(45,93%,47%)]" },
  { id: "proof", icon: Camera, label: "Proof", color: "hsl(200, 80%, 50%)", bgClass: "bg-[hsl(200,80%,50%)]" },
  { id: "gratitude", icon: Heart, label: "Gratitude", color: "hsl(330, 70%, 55%)", bgClass: "bg-[hsl(330,70%,55%)]" },
];

export function ManifestPracticePanel({
  goal,
  streak,
  totalPracticed = 0,
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
        const safeArr = (val: any): any[] => {
          if (Array.isArray(val)) return val;
          if (typeof val === "string") { try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; } }
          return [];
        };
        return {
          visualizations: safeArr((data as any).visualizations),
          acts: safeArr((data as any).acts),
          proofs: safeArr((data as any).proofs),
          gratitudes: safeArr((data as any).gratitudes),
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
    try {
      const upsertData: any = {
        goal_id: goal.id,
        user_id: user.id,
        entry_date: dateStr,
        visualizations: JSON.stringify(practice.visualizations ?? visualizations),
        acts: JSON.stringify(practice.acts ?? acts),
        proofs: JSON.stringify(practice.proofs ?? proofs),
        gratitudes: JSON.stringify(practice.gratitudes ?? gratitudes),
        alignment: practice.alignment ?? alignmentValue,
        growth_note: practice.growth_note ?? growthNoteValue,
        locked: practice.locked ?? isLocked,
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
  const [activeRing, setActiveRing] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [alignmentValue, setAlignmentValue] = useState(5);

  const actInputRef = useRef<HTMLInputElement>(null);
  const proofTextRef = useRef<HTMLTextAreaElement>(null);
  const growthNoteRef = useRef<HTMLInputElement>(null);
  const gratitudeInputRef = useRef<HTMLInputElement>(null);
  const [currentProofImageUrl, setCurrentProofImageUrl] = useState<string | null>(null);
  const [growthNoteValue, setGrowthNoteValue] = useState("");
  const proofScrollRef = useRef<HTMLDivElement>(null);

  const goalIdRef = useRef(goal.id);
  const dateStrRef = useRef(dateStr);

  const dayNumber = useMemo(() => {
    if (!goal.start_date) return 0;
    return differenceInDays(selectedDate, new Date(goal.start_date)) + 1;
  }, [goal.start_date, selectedDate]);

  const categoryLabel = useMemo(() => {
    return CATEGORIES.find(c => c.id === goal.category)?.label || goal.category;
  }, [goal.category]);

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
      setAlignmentValue(5);

      setVisualizations([]);
      setActs([]);
      setProofs([]);
      setGratitudes([]);
      setIsLocked(false);
      setActiveRing(null);
      setCurrentImageUrl(goal.cover_image_url || goal.vision_image_url || null);

      (async () => {
        const saved = await loadPractice(dateStr);
        if (saved.visualizations) setVisualizations(saved.visualizations);
        if (saved.acts) setActs(saved.acts);
        if (saved.proofs) setProofs(saved.proofs);
        if (saved.gratitudes) setGratitudes(saved.gratitudes);
        if (saved.alignment !== undefined && saved.alignment !== null) setAlignmentValue(saved.alignment);
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

  const stepDone = useMemo(() => ({
    viz: hasViz,
    act: hasAct,
    proof: hasProof,
    gratitude: hasGratitude,
  }), [hasViz, hasAct, hasProof, hasGratitude]);

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
    setActiveRing(null);
  };

  const handleAddAct = () => {
    const text = actInputRef.current?.value.trim() || goal.act_as_if;
    const newEntry: ActEntry = { id: crypto.randomUUID(), text, created_at: new Date().toISOString() };
    const updated = [...acts, newEntry];
    setActs(updated);
    if (actInputRef.current) actInputRef.current.value = "";
    savePractice({ acts: updated, act_count: updated.length });
    toast.success("Action logged! 💪");
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
      alignment: alignmentValue,
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
    try {
      const { error } = await supabase.from("manifest_goals").update({ cover_image_url: url }).eq("id", goal.id);
      if (error) throw error;
      toast.success("Vision image updated");
      if (onGoalUpdate) onGoalUpdate();
    } catch (error) {
      console.error("Failed to update image in database:", error);
      if (!isOfflineError()) {
        toast.error("Failed to save image change");
      } else {
        toast.info("You're offline — changes will sync when connected");
      }
    }
  };

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

  const safeProofs = Array.isArray(proofs) ? proofs : [];
  const allProofs = safeProofs.filter((p) => p.image_url || p.text);

  const ProgressRing = ({
    done,
    color,
    icon: Icon,
    label,
    id,
    stepNumber,
  }: {
    done: boolean;
    color: string;
    icon: any;
    label: string;
    id: string;
    stepNumber: number;
  }) => {
    const isActive = activeRing === id;
    const radius = 26;
    const circumference = 2 * Math.PI * radius;
    const progress = done ? 1 : 0;

    return (
      <button
        onClick={() => setActiveRing(isActive ? null : id)}
        className={cn(
          "flex flex-col items-center transition-all duration-500 group relative",
          (isViewingPast && !isLocked) && "opacity-50 pointer-events-none"
        )}
        style={{ gap: "6px" }}
      >
        <div
          className={cn(
            "relative flex items-center justify-center rounded-full transition-all duration-500",
            isActive && "scale-105",
          )}
          style={{
            width: 60, height: 60,
            ...(isActive ? { boxShadow: `0 0 24px ${color}30, 0 0 8px ${color}15` } : {}),
          }}
        >
          {/* Outer ring SVG */}
          <svg width="60" height="60" className="absolute inset-0 -rotate-90">
            <circle cx="30" cy="30" r={radius} fill="none" stroke={done ? color : "hsl(var(--border))"} strokeWidth={done ? "3" : "2.5"} opacity={done ? 1 : 0.5} className="transition-all duration-500" />
            {isActive && !done && (
              <circle
                cx="30"
                cy="30"
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * 0.25}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              >
                <animateTransform attributeName="transform" type="rotate" from="0 30 30" to="360 30 30" dur="3s" repeatCount="indefinite" />
              </circle>
            )}
          </svg>
          {/* Inner circle — always shows the icon */}
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 relative",
              done ? "bg-background shadow-sm" : "bg-muted/80",
              isActive && !done && "bg-muted"
            )}
          >
            <Icon className={cn("h-4 w-4 transition-colors duration-500")} style={done ? { color } : { color: "hsl(var(--muted-foreground))" }} />
          </div>
          {/* Completion badge */}
          {done && (
            <div
              className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-background"
              style={{ background: color, width: 18, height: 18 }}
            >
              <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
            </div>
          )}
        </div>
        {/* Label + step number */}
        <div className="flex flex-col items-center gap-0">
          <span
            className={cn(
              "text-[10px] font-semibold tracking-wide transition-colors duration-300",
              done ? "text-foreground" : isActive ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {label}
          </span>
          <span
            className={cn(
              "text-[8px] font-medium tracking-widest uppercase transition-colors duration-300",
              done ? "opacity-70" : "text-muted-foreground/50"
            )}
            style={done ? { color } : {}}
          >
            Step {stepNumber}
          </span>
        </div>
      </button>
    );
  };

  const renderActiveInput = () => {
    if (!activeRing) return null;

    return (
      <div className="mx-4 mt-3 p-4 rounded-2xl border border-foreground/10 bg-background/60 backdrop-blur-xl animate-in slide-in-from-top-2 duration-300">
        {activeRing === "viz" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Close your eyes and feel your new reality</p>
            <Button
              onClick={() => setShowVisualization(true)}
              className="w-full h-10 rounded-xl"
              disabled={isViewingPast}
              style={{ background: "linear-gradient(135deg, hsl(175, 84%, 40%), hsl(185, 85%, 50%))" }}
            >
              <Play className="h-4 w-4 mr-2 text-white" />
              <span className="text-white">{hasViz ? "Add Session" : `Start ${goal.visualization_minutes} min`}</span>
            </Button>
            {visualizations.length > 0 && (
              <div className="space-y-1">
                {visualizations.map((v, i) => (
                  <div key={v.id} className="text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <Check className="h-3 w-3" style={{ color: "hsl(175, 84%, 40%)" }} /> Session {i + 1} • {format(new Date(v.created_at), "h:mm a")}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeRing === "act" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Suggestion: {goal.act_as_if}</p>
            <div className="flex gap-2">
              <Input ref={actInputRef} defaultValue="" placeholder="What did you do?" className="flex-1 rounded-xl h-9 text-sm" disabled={isViewingPast} />
              <Button onClick={handleAddAct} className="h-9 px-3 rounded-xl text-xs text-white" disabled={isViewingPast}
                style={{ background: "hsl(45, 93%, 47%)" }}>
                Save
              </Button>
            </div>
            {acts.length > 0 && (
              <div className="space-y-1">
                {acts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between bg-muted/50 px-3 py-1.5 rounded-lg">
                    <span className="text-xs text-foreground flex items-center gap-2">
                      <Check className="h-3 w-3" style={{ color: "hsl(45, 93%, 47%)" }} /> {a.text}
                    </span>
                    {isViewingToday && (
                      <button onClick={() => handleRemoveAct(a.id)} className="text-muted-foreground hover:text-foreground">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeRing === "proof" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">What happened today that proves your reality?</p>
            <Textarea ref={proofTextRef} defaultValue="" placeholder="I noticed..." rows={2} className="rounded-xl resize-none text-sm" disabled={isViewingPast} />
            <input ref={proofImageInputRef} type="file" accept="image/*" onChange={handleProofImageUpload} className="hidden" />
            {currentProofImageUrl ? (
              <div className="relative">
                <img src={currentProofImageUrl} alt="Proof" className="w-full h-20 object-cover rounded-xl" />
                <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-5 w-5 rounded-full" onClick={() => setCurrentProofImageUrl(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button variant="outline" className="w-full rounded-xl border-dashed h-9 text-xs" onClick={() => proofImageInputRef.current?.click()} disabled={isViewingPast}>
                <ImagePlus className="h-3.5 w-3.5 mr-1.5" /> Add Photo
              </Button>
            )}
          </div>
        )}

        {/* Sticky save for proof — pinned to bottom of viewport on mobile */}
        {activeRing === "proof" && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-3 bg-background/80 backdrop-blur-xl border-t border-border">
            <Button onClick={handleAddProof} disabled={isViewingPast} className="w-full h-10 rounded-xl text-white text-sm font-semibold"
              style={{ background: "hsl(200, 80%, 50%)" }}>
              Save Proof
            </Button>
          </div>
        )}
        {activeRing === "proof" && (
          <div className="hidden lg:block">
            <Button onClick={handleAddProof} disabled={isViewingPast} className="w-full h-9 rounded-xl text-white text-sm"
              style={{ background: "hsl(200, 80%, 50%)" }}>
              Save Proof
            </Button>
          </div>
        )}

        {activeRing === "gratitude" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">What are you grateful for today?</p>
            <div className="flex gap-2">
              <Input ref={gratitudeInputRef} defaultValue="" placeholder="I'm grateful for..." className="flex-1 rounded-xl h-9 text-sm" disabled={isViewingPast} />
              <Button onClick={handleAddGratitude} className="h-9 px-3 rounded-xl text-xs text-white" disabled={isViewingPast}
                style={{ background: "hsl(330, 70%, 55%)" }}>
                Save
              </Button>
            </div>
            {gratitudes.length > 0 && (
              <div className="space-y-1">
                {gratitudes.map((g) => (
                  <div key={g.id} className="flex items-center justify-between bg-muted/50 px-3 py-1.5 rounded-lg">
                    <span className="text-xs text-foreground flex items-center gap-2">
                      <Heart className="h-3 w-3 fill-current" style={{ color: "hsl(330, 70%, 55%)" }} /> {g.text}
                    </span>
                    {isViewingToday && (
                      <button onClick={() => handleRemoveGratitude(g.id)} className="text-muted-foreground hover:text-foreground">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden antialiased">
      {/* ===== Immersive Hero Banner ===== */}
      <div className="relative w-full h-40 sm:h-56 flex-shrink-0 overflow-hidden">
        {currentImageUrl ? (
          <img src={currentImageUrl} alt={goal.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-accent" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />

        {/* Close button */}
        <Button variant="ghost" size="icon" className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/40 backdrop-blur-md text-foreground z-10" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>

        {/* Overlay content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              {!isViewingToday && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-foreground/10 backdrop-blur-sm text-foreground/80 font-medium inline-flex items-center gap-1">
                  <CalendarDays className="h-2.5 w-2.5" /> {fmtDate(selectedDate, "full")}
                </span>
              )}
              <Badge variant="secondary" className="rounded-full text-[9px] px-2 py-0.5 h-auto">
                {categoryLabel}
              </Badge>
              {dayNumber > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-foreground/10 backdrop-blur-sm text-foreground/80 font-medium">
                  Day {dayNumber}
                </span>
              )}
            </div>
            <h2 className="font-semibold text-foreground text-xl leading-tight line-clamp-1">{goal.title}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <CalendarDays className="h-2.5 w-2.5" /> {goal.start_date ? fmtDate(new Date(goal.start_date), "full") : "No start date"}
              </span>
              {goal.check_in_time && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" /> {goal.check_in_time}
                </span>
              )}
              {streak > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-foreground/10 text-foreground/70 font-medium flex items-center gap-0.5">
                  <Flame className="h-2.5 w-2.5" /> {streak} day streak
                </span>
              )}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-foreground/10 text-foreground/70 font-medium flex items-center gap-0.5">
                <Check className="h-2.5 w-2.5" /> {totalPracticed} day{totalPracticed !== 1 ? "s" : ""} practiced
              </span>
            </div>
          </div>

          {/* Master Progress Ring */}
          <div className="flex-shrink-0 ml-3">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <svg width="56" height="56" className="-rotate-90">
                <circle cx="28" cy="28" r="22" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
                <circle
                  cx="28"
                  cy="28"
                  r="22"
                  fill="none"
                  stroke="hsl(var(--foreground))"
                  strokeWidth="3"
                  strokeDasharray={2 * Math.PI * 22}
                  strokeDashoffset={2 * Math.PI * 22 * (1 - completedCount / 4)}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <span className="absolute text-xs font-bold text-foreground">{completedCount}/4</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* ===== Daily Affirmation ===== */}
        {goal.daily_affirmation && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-muted/30 border border-border">
            <div className="flex items-start gap-2">
              <Quote className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground italic leading-relaxed">{goal.daily_affirmation}</p>
            </div>
          </div>
        )}

        {/* Past date warning */}
        {isViewingPast && !isLocked && (
          <div className="mx-4 mt-2 p-2 rounded-lg bg-muted/50 border border-border">
            <p className="text-[10px] text-muted-foreground">
              You're viewing a past date. This practice was not completed.
            </p>
          </div>
        )}

        {/* ===== Locked Day Summary ===== */}
        {isLocked && (
          <div className="mx-4 mt-3 p-4 rounded-2xl border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                <Check className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">Day Complete</span>
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-background/60 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Eye className="h-3 w-3" style={{ color: "hsl(175, 84%, 40%)" }} />
                  <span className="text-[10px] font-medium text-muted-foreground">Visualized</span>
                </div>
                <p className="text-xs text-foreground">{visualizations.length} session{visualizations.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="bg-background/60 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap className="h-3 w-3" style={{ color: "hsl(45, 93%, 47%)" }} />
                  <span className="text-[10px] font-medium text-muted-foreground">Actions</span>
                </div>
                <p className="text-xs text-foreground">{acts.length} action{acts.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="bg-background/60 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Camera className="h-3 w-3" style={{ color: "hsl(200, 80%, 50%)" }} />
                  <span className="text-[10px] font-medium text-muted-foreground">Proofs</span>
                </div>
                <p className="text-xs text-foreground">{proofs.length} proof{proofs.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="bg-background/60 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Heart className="h-3 w-3" style={{ color: "hsl(330, 70%, 55%)" }} />
                  <span className="text-[10px] font-medium text-muted-foreground">Gratitude</span>
                </div>
                <p className="text-xs text-foreground">{gratitudes.length} entr{gratitudes.length !== 1 ? "ies" : "y"}</p>
              </div>
            </div>
            {growthNoteValue && (
              <div className="mt-2.5 p-2.5 bg-background/60 rounded-lg">
                <p className="text-[10px] text-muted-foreground mb-0.5 font-medium">Growth Note</p>
                <p className="text-xs text-foreground leading-relaxed">{growthNoteValue}</p>
              </div>
            )}
            {alignmentValue > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <Target className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Alignment: {alignmentValue}/10</span>
              </div>
            )}
          </div>
        )}

        {/* ===== Practice Flow Steps ===== */}
        <div className="flex items-center justify-center py-5 px-6 flex-shrink-0">
          {RING_CONFIG.map((ring, index) => {
            const done = stepDone[ring.id as keyof typeof stepDone];
            return (
              <div key={ring.id} className="flex items-center">
                <ProgressRing
                  id={ring.id}
                  done={done}
                  color={ring.color}
                  icon={ring.icon}
                  label={ring.label}
                  stepNumber={index + 1}
                />
                {index < RING_CONFIG.length - 1 && (
                  <div className="flex items-center mx-1 sm:mx-2 -mt-5">
                    <div
                      className={cn(
                        "h-[1.5px] rounded-full transition-all duration-700 ease-out",
                        done ? "w-5 sm:w-8 opacity-80" : "w-5 sm:w-8 opacity-20 bg-border"
                      )}
                      style={done ? {
                        background: `linear-gradient(90deg, ${ring.color}, ${RING_CONFIG[index + 1].color})`,
                      } : {}}
                    />
                    <div
                      className={cn(
                        "w-1 h-1 rounded-full transition-all duration-500",
                        done ? "opacity-60" : "opacity-15 bg-border"
                      )}
                      style={done ? { background: RING_CONFIG[index + 1].color } : {}}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ===== Active Input Area (glassmorphic) ===== */}
        {renderActiveInput()}

        {/* ===== Complete Day Section ===== */}
        {allDone && !isLocked && (
          <div className="mx-4 mt-3 p-4 rounded-2xl border border-foreground/10 bg-background/60 backdrop-blur-xl">
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                <Lock className="h-4 w-4" /> Complete your day
              </p>

              {/* Alignment Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Target className="h-3 w-3" /> How aligned do you feel?
                  </span>
                  <span className="text-xs font-medium text-foreground">{alignmentValue}/10</span>
                </div>
                <Slider
                  value={[alignmentValue]}
                  onValueChange={(v) => setAlignmentValue(v[0])}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                  disabled={isViewingPast}
                />
              </div>

              <Input
                ref={growthNoteRef}
                defaultValue={growthNoteValue}
                placeholder="Today I learned that..."
                className="rounded-xl h-9 text-sm"
                disabled={isViewingPast || isLocked}
                onBlur={(e) => {
                  setGrowthNoteValue(e.target.value);
                  savePractice({ growth_note: e.target.value });
                }}
              />
              <Button
                onClick={handleLockToday}
                disabled={!canLock || isViewingPast || isLocked}
                className="w-full h-10 rounded-xl text-white font-medium"
                style={{ background: "linear-gradient(135deg, hsl(175, 84%, 40%), hsl(185, 85%, 50%))" }}
              >
                <Lock className="h-4 w-4 mr-2" /> Complete Day ✨
              </Button>
            </div>
          </div>
        )}

        {/* ===== Proof Timeline Gallery ===== */}
        {allProofs.length > 0 && (
          <div className="mt-4 px-4 flex-shrink-0">
            <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3" /> Proof Timeline
            </h3>
            <div ref={proofScrollRef} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {allProofs.map((p) => (
                <div key={p.id} className="flex-shrink-0 group relative">
                  {p.image_url ? (
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-border">
                      <img src={p.image_url} alt={p.text} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl border border-border bg-muted/50 flex items-center justify-center p-1.5">
                      <p className="text-[8px] text-muted-foreground line-clamp-3 text-center leading-tight">{p.text}</p>
                    </div>
                  )}
                  {isViewingToday && !isLocked && (
                    <button
                      onClick={() => handleRemoveProof(p.id)}
                      className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Spacer at bottom */}
        <div className="h-6 flex-shrink-0" />
      </div>
    </div>
  );
}
