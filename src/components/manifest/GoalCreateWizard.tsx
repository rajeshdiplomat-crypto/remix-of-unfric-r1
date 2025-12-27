import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Target, Heart, Home, DollarSign, ImagePlus, CalendarIcon,
  Sparkles, ChevronLeft, ChevronRight, Check, Lightbulb, Clock, Bell
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "wealth", label: "Wealth", icon: DollarSign, color: "hsl(45, 93%, 47%)" },
  { id: "health", label: "Health", icon: Heart, color: "hsl(142, 71%, 45%)" },
  { id: "love", label: "Love", icon: Home, color: "hsl(340, 82%, 52%)" },
  { id: "growth", label: "Growth", icon: Target, color: "hsl(262, 83%, 58%)" },
];

interface GoalCreateWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    title: string;
    description: string;
    category: string;
    affirmations: string[];
    feeling: string;
    targetDate: Date | null;
    coverImage: string | null;
    visualizationImages: string[];
    woop: { wish: string; outcome: string; obstacle: string; plan: string };
    checkInFrequency: string;
    reminderTime: string;
    gratitudePrompt: string;
  }) => void;
  editGoal?: {
    id: string;
    title: string;
    description: string | null;
    category?: string;
    affirmations: string[];
    feeling_when_achieved: string | null;
    target_date?: string;
    cover_image?: string;
    visualization_images?: string[];
    woop?: { wish: string; outcome: string; obstacle: string; plan: string };
  } | null;
  saving?: boolean;
}

export function GoalCreateWizard({
  open,
  onOpenChange,
  onSave,
  editGoal,
  saving,
}: GoalCreateWizardProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Step 1: Basics
  const [title, setTitle] = useState(editGoal?.title || "");
  const [category, setCategory] = useState(editGoal?.category || "growth");
  const [targetDate, setTargetDate] = useState<Date | undefined>(
    editGoal?.target_date ? new Date(editGoal.target_date) : undefined
  );
  const [coverImage, setCoverImage] = useState<string | null>(editGoal?.cover_image || null);

  // Step 2: SMART + WOOP
  const [description, setDescription] = useState(editGoal?.description || "");
  const [wish, setWish] = useState(editGoal?.woop?.wish || "");
  const [outcome, setOutcome] = useState(editGoal?.woop?.outcome || "");
  const [obstacle, setObstacle] = useState(editGoal?.woop?.obstacle || "");
  const [plan, setPlan] = useState(editGoal?.woop?.plan || "");

  // Step 3: Daily System
  const [checkInFrequency, setCheckInFrequency] = useState("daily");
  const [reminderTime, setReminderTime] = useState("09:00");
  const [affirmations, setAffirmations] = useState(editGoal?.affirmations?.join("\n") || "");
  const [gratitudePrompt, setGratitudePrompt] = useState("");
  const [feeling, setFeeling] = useState(editGoal?.feeling_when_achieved || "");

  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File too large. Max 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCoverImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    onSave({
      title,
      description,
      category,
      affirmations: affirmations.split("\n").map(a => a.trim()).filter(Boolean),
      feeling,
      targetDate: targetDate || null,
      coverImage,
      visualizationImages: [],
      woop: { wish, outcome, obstacle, plan },
      checkInFrequency,
      reminderTime,
      gratitudePrompt,
    });
  };

  const canProceed = () => {
    if (step === 1) return title.trim().length > 0;
    return true;
  };

  const nextStep = () => {
    if (step < totalSteps && canProceed()) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const resetForm = () => {
    setStep(1);
    setTitle("");
    setCategory("growth");
    setTargetDate(undefined);
    setCoverImage(null);
    setDescription("");
    setWish("");
    setOutcome("");
    setObstacle("");
    setPlan("");
    setCheckInFrequency("daily");
    setReminderTime("09:00");
    setAffirmations("");
    setGratitudePrompt("");
    setFeeling("");
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetForm();
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {editGoal ? "Edit Goal" : "Create Manifestation Goal"}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="space-y-2 pb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Step {step} of {totalSteps}</span>
            <span className="text-muted-foreground">
              {step === 1 ? "Goal Basics" : step === 2 ? "Make it Executable" : "Daily System"}
            </span>
          </div>
          <Progress value={(step / totalSteps) * 100} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-auto space-y-6 py-2 px-1">
          {step === 1 && (
            <>
              {/* Cover Image */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Cover Image</Label>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverUpload}
                />
                {coverImage ? (
                  <div className="relative h-32 rounded-xl overflow-hidden group">
                    <img src={coverImage} alt="Cover" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => coverInputRef.current?.click()}>Change</Button>
                      <Button size="sm" variant="destructive" onClick={() => setCoverImage(null)}>Remove</Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    className="h-32 w-full border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-muted/50 transition-colors"
                  >
                    <ImagePlus className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Upload cover image</span>
                  </button>
                )}
              </div>

              {/* Goal Name */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Goal Name *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What do you want to manifest?"
                  className="text-lg"
                />
              </div>

              {/* Category */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Category</Label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <Button
                      key={cat.id}
                      variant={category === cat.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCategory(cat.id)}
                      className="gap-2"
                      style={{
                        backgroundColor: category === cat.id ? cat.color : undefined,
                        borderColor: category === cat.id ? cat.color : undefined,
                      }}
                    >
                      <cat.icon className="h-4 w-4" />
                      {cat.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Target Date */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Target Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !targetDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {targetDate ? format(targetDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={targetDate} onSelect={setTargetDate} initialFocus className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {/* SMART Helper */}
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Make it SMART</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong>S</strong>pecific · <strong>M</strong>easurable · <strong>A</strong>chievable · <strong>R</strong>elevant · <strong>T</strong>ime-bound
                </p>
              </div>

              {/* Description / Visualization */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Describe your goal in detail</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Be specific: What exactly do you want? How will you measure success? When will you achieve it?"
                  rows={3}
                />
              </div>

              {/* WOOP */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">WOOP Method (Research-backed)</span>
                </div>
                <p className="text-xs text-muted-foreground">Mental contrasting helps achieve goals 2-3x more effectively</p>
                
                <div>
                  <Label className="text-xs text-muted-foreground">Wish — What is your most important wish?</Label>
                  <Input value={wish} onChange={(e) => setWish(e.target.value)} placeholder="My deepest wish is..." className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Outcome — What's the best outcome if you achieve this?</Label>
                  <Input value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder="The best result would be..." className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Obstacle — What's the main internal obstacle?</Label>
                  <Input value={obstacle} onChange={(e) => setObstacle(e.target.value)} placeholder="What might hold me back is..." className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Plan — If the obstacle occurs, then I will...</Label>
                  <Input value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="If [obstacle], then I will [action]..." className="mt-1" />
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              {/* Check-in Frequency */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Check-in Frequency</Label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Select value={checkInFrequency} onValueChange={setCheckInFrequency}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Reminder Time */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Reminder Time</Label>
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Default Affirmation */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Daily Affirmations (one per line)</Label>
                <Textarea
                  value={affirmations}
                  onChange={(e) => setAffirmations(e.target.value)}
                  placeholder="I am worthy of this goal...&#10;Every day I move closer to success...&#10;I believe in my ability to achieve this..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">Repeating affirmations builds positive neural pathways</p>
              </div>

              {/* Gratitude Prompt */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Gratitude Prompt (Optional)</Label>
                <Textarea
                  value={gratitudePrompt}
                  onChange={(e) => setGratitudePrompt(e.target.value)}
                  placeholder="What are you grateful for regarding this goal?"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground mt-1">Gratitude journaling improves well-being and goal commitment</p>
              </div>

              {/* Feeling When Achieved */}
              <div>
                <Label className="text-sm font-medium mb-2 block">How will you feel when achieved?</Label>
                <Textarea
                  value={feeling}
                  onChange={(e) => setFeeling(e.target.value)}
                  placeholder="Describe the emotions you'll experience..."
                  rows={2}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={step === 1}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 w-2 rounded-full transition-colors",
                  i + 1 === step ? "bg-primary" : i + 1 < step ? "bg-primary/50" : "bg-muted"
                )}
              />
            ))}
          </div>

          {step < totalSteps ? (
            <Button onClick={nextStep} disabled={!canProceed()} className="gap-1">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={saving || !title.trim()} className="gap-1">
              {saving ? "Saving..." : editGoal ? "Update Goal" : "Create Goal"}
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}