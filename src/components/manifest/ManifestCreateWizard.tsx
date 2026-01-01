import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Target, Heart, DollarSign, Briefcase, TrendingUp, Repeat,
  ImagePlus, CalendarIcon, Sparkles, ChevronLeft, ChevronRight, 
  Check, Clock, Lightbulb
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { STARTER_TEMPLATES, type ManifestGoal, type StarterTemplate } from "./types";

const CATEGORIES = [
  { id: "wealth", label: "Wealth", icon: DollarSign },
  { id: "health", label: "Health", icon: Heart },
  { id: "career", label: "Career", icon: Briefcase },
  { id: "growth", label: "Growth", icon: TrendingUp },
  { id: "habits", label: "Habits", icon: Repeat },
];

interface ManifestCreateWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<ManifestGoal>) => void;
  onOpenCheckIn?: () => void;
  editGoal?: ManifestGoal | null;
  saving?: boolean;
}

export function ManifestCreateWizard({
  open,
  onOpenChange,
  onSave,
  onOpenCheckIn,
  editGoal,
  saving,
}: ManifestCreateWizardProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  
  // Step 1: Basics
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("growth");
  const [targetDate, setTargetDate] = useState<Date | undefined>();
  const [coverImage, setCoverImage] = useState<string | null>(null);
  
  // Step 2: Make it Executable
  const [liveFromEnd, setLiveFromEnd] = useState("");
  const [actAsIf, setActAsIf] = useState("");
  const [conviction, setConviction] = useState([5]);
  const [woop, setWoop] = useState({ wish: "", outcome: "", obstacle: "", plan: "" });
  
  // Step 3: Daily System
  const [visualizationLength, setVisualizationLength] = useState(3);
  const [dailyAffirmation, setDailyAffirmation] = useState("");
  const [checkInTime, setCheckInTime] = useState("08:00");
  const [sevenDayPledge, setSevenDayPledge] = useState(false);
  
  const coverInputRef = useRef<HTMLInputElement>(null);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize form with edit data
  useEffect(() => {
    if (editGoal) {
      setTitle(editGoal.title);
      setCategory(editGoal.category || "growth");
      setTargetDate(editGoal.target_date ? new Date(editGoal.target_date) : undefined);
      setCoverImage(editGoal.cover_image || null);
      setLiveFromEnd(editGoal.live_from_end || "");
      setActAsIf(editGoal.act_as_if || "");
      setConviction([editGoal.conviction || 5]);
      setWoop(editGoal.woop || { wish: "", outcome: "", obstacle: "", plan: "" });
      setVisualizationLength(editGoal.visualization_length || 3);
      setDailyAffirmation(editGoal.daily_affirmation || editGoal.affirmations?.[0] || "");
      setCheckInTime(editGoal.check_in_time || "08:00");
    }
  }, [editGoal]);
  
  // Autosave draft
  useEffect(() => {
    if (!open || !title.trim()) return;
    
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }
    
    autosaveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem('manifest_draft', JSON.stringify({
        title, category, targetDate, coverImage, liveFromEnd, actAsIf, 
        conviction: conviction[0], woop, visualizationLength, dailyAffirmation, checkInTime
      }));
      toast({ title: "Draft saved", duration: 2000 });
    }, 3000);
    
    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [title, category, liveFromEnd, actAsIf, conviction, woop, dailyAffirmation]);
  
  const applyTemplate = (template: StarterTemplate) => {
    setTitle(template.assumption);
    setCategory(template.category);
    setActAsIf(template.act_as_if);
    setDailyAffirmation(template.affirmation);
    setLiveFromEnd(template.visualization_script);
  };
  
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Max 5MB", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => setCoverImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = (openCheckIn = false) => {
    const goalData: Partial<ManifestGoal> = {
      title,
      category,
      target_date: targetDate?.toISOString(),
      cover_image: coverImage || undefined,
      live_from_end: liveFromEnd,
      act_as_if: actAsIf,
      conviction: conviction[0],
      woop,
      visualization_length: visualizationLength,
      daily_affirmation: dailyAffirmation,
      affirmations: dailyAffirmation ? [dailyAffirmation] : [],
      check_in_time: checkInTime,
    };
    
    onSave(goalData);
    localStorage.removeItem('manifest_draft');
    
    if (openCheckIn && onOpenCheckIn) {
      onOpenCheckIn();
    }
  };
  
  const resetForm = () => {
    setStep(1);
    setTitle("");
    setCategory("growth");
    setTargetDate(undefined);
    setCoverImage(null);
    setLiveFromEnd("");
    setActAsIf("");
    setConviction([5]);
    setWoop({ wish: "", outcome: "", obstacle: "", plan: "" });
    setVisualizationLength(3);
    setDailyAffirmation("");
    setCheckInTime("08:00");
    setSevenDayPledge(false);
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetForm();
    onOpenChange(isOpen);
  };
  
  const canProceed = () => {
    if (step === 1) return title.trim().length > 0;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[640px] max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {editGoal ? "Edit Manifestation" : "New Manifestation"}
          </DialogTitle>
        </DialogHeader>
        
        {/* Progress */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Step {step} of {totalSteps}</span>
            <span className="text-sm font-medium">
              {step === 1 ? "Basics" : step === 2 ? "Make it Real" : "Daily System"}
            </span>
          </div>
          <Progress value={(step / totalSteps) * 100} className="h-1.5" />
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto px-6">
          {step === 1 && (
            <div className="space-y-5">
              {/* Starter Templates */}
              {!editGoal && (
                <div>
                  <Label className="text-sm mb-2 block">Quick Start Templates</Label>
                  <div className="flex gap-2 flex-wrap">
                    {STARTER_TEMPLATES.map(template => (
                      <Button
                        key={template.id}
                        variant="outline"
                        size="sm"
                        onClick={() => applyTemplate(template)}
                        className="text-xs"
                      >
                        {template.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Cover Image */}
              <div>
                <Label className="text-sm mb-2 block">Cover Image</Label>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverUpload}
                />
                {coverImage ? (
                  <div className="relative h-28 rounded-lg overflow-hidden group">
                    <img src={coverImage} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => coverInputRef.current?.click()}>Change</Button>
                      <Button size="sm" variant="destructive" onClick={() => setCoverImage(null)}>Remove</Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    className="h-28 w-full border border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors"
                  >
                    <ImagePlus className="h-6 w-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Upload cover</span>
                  </button>
                )}
              </div>
              
              {/* Assumption Title */}
              <div>
                <Label className="text-sm mb-2 block">Your Assumption *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="I am confidently in my ideal role and growing every month."
                  className="text-base"
                />
                <p className="text-xs text-muted-foreground mt-1">Write as if it's already true</p>
              </div>
              
              {/* Category */}
              <div>
                <Label className="text-sm mb-2 block">Category</Label>
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIES.map(cat => (
                    <Button
                      key={cat.id}
                      variant={category === cat.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCategory(cat.id)}
                      className="gap-1.5"
                    >
                      <cat.icon className="h-3.5 w-3.5" />
                      {cat.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Target Date */}
              <div>
                <Label className="text-sm mb-2 block">Target Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start", !targetDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {targetDate ? format(targetDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={targetDate} onSelect={setTargetDate} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-5">
              {/* Quick WOOP */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">WOOP / SMART Prompts</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Wish</Label>
                    <Input 
                      value={woop.wish}
                      onChange={(e) => setWoop({ ...woop, wish: e.target.value })}
                      placeholder="What do you truly want?"
                      className="mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Best Outcome</Label>
                    <Input 
                      value={woop.outcome}
                      onChange={(e) => setWoop({ ...woop, outcome: e.target.value })}
                      placeholder="How will life improve?"
                      className="mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Obstacle</Label>
                    <Input 
                      value={woop.obstacle}
                      onChange={(e) => setWoop({ ...woop, obstacle: e.target.value })}
                      placeholder="What might hold you back?"
                      className="mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Plan</Label>
                    <Input 
                      value={woop.plan}
                      onChange={(e) => setWoop({ ...woop, plan: e.target.value })}
                      placeholder="If obstacle, then I will..."
                      className="mt-1 text-sm"
                    />
                  </div>
                </div>
              </div>
              
              {/* Live from the End */}
              <div>
                <Label className="text-sm mb-2 block">Live From the End</Label>
                <Textarea
                  value={liveFromEnd}
                  onChange={(e) => setLiveFromEnd(e.target.value)}
                  placeholder="Describe your life as if this is already your reality. What do you see, feel, and experience?"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">This becomes your visualization script</p>
              </div>
              
              {/* Today's Act-as-If */}
              <div>
                <Label className="text-sm mb-2 block">Today's Act-as-If</Label>
                <Input
                  value={actAsIf}
                  onChange={(e) => setActAsIf(e.target.value)}
                  placeholder="One small action you'd take if this were already true"
                />
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => setActAsIf("Dress as if I already have it")}>Dress</Button>
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => setActAsIf("Speak to others as if I've achieved it")}>Speak</Button>
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => setActAsIf("Make one decision from my future self")}>Decide</Button>
                </div>
              </div>
              
              {/* Conviction Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm">Conviction Today</Label>
                  <span className="text-sm font-medium">{conviction[0]}/10</span>
                </div>
                <Slider
                  value={conviction}
                  onValueChange={setConviction}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">How strongly do you believe this is your reality?</p>
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div className="space-y-5">
              {/* Visualization Length */}
              <div>
                <Label className="text-sm mb-2 block">Visualization Length</Label>
                <div className="flex gap-2">
                  {[3, 5, 10].map(mins => (
                    <Button
                      key={mins}
                      variant={visualizationLength === mins ? "default" : "outline"}
                      size="sm"
                      onClick={() => setVisualizationLength(mins)}
                    >
                      {mins} min
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Daily Affirmation */}
              <div>
                <Label className="text-sm mb-2 block">Daily Affirmation</Label>
                <Input
                  value={dailyAffirmation}
                  onChange={(e) => setDailyAffirmation(e.target.value)}
                  placeholder="I attract opportunities that align with my highest self"
                />
                <p className="text-xs text-muted-foreground mt-1">One powerful sentence you'll repeat daily</p>
              </div>
              
              {/* Check-in Time */}
              <div>
                <Label className="text-sm mb-2 block">Check-in Time</Label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    className="w-32"
                  />
                </div>
              </div>
              
              {/* 7-day Pledge */}
              <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <Checkbox
                  id="pledge"
                  checked={sevenDayPledge}
                  onCheckedChange={(checked) => setSevenDayPledge(!!checked)}
                />
                <div>
                  <Label htmlFor="pledge" className="text-sm font-medium cursor-pointer">
                    7-Day Commitment
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    I commit to checking in daily for 7 days to build momentum
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
          <Button variant="outline" onClick={() => step > 1 ? setStep(step - 1) : handleOpenChange(false)}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          
          <div className="flex gap-1.5">
            {[1, 2, 3].map(i => (
              <div 
                key={i} 
                className={cn("h-1.5 w-1.5 rounded-full", i === step ? "bg-primary" : i < step ? "bg-primary/50" : "bg-muted-foreground/30")} 
              />
            ))}
          </div>
          
          {step < totalSteps ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              Next: {step === 1 ? "Make it Real" : "Daily System"}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleSubmit(false)} disabled={saving}>
                Save Draft
              </Button>
              <Button onClick={() => handleSubmit(true)} disabled={saving || !title.trim()}>
                {saving ? "Creating..." : "Create & Start"}
                <Check className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
