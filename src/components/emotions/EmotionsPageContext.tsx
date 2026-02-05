import { ArrowLeft, ArrowRight, Users, Activity, Moon, Dumbbell, BookOpen, Loader2, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { QuadrantType, QUADRANTS } from "./types";
import { cn } from "@/lib/utils";

interface EmotionsPageContextProps {
  selectedQuadrant: QuadrantType;
  selectedEmotion: string;
  note: string;
  context: {
    who?: string;
    what?: string;
    sleepHours?: string;
    physicalActivity?: string;
  };
  sendToJournal: boolean;
  saving: boolean;
  onNoteChange: (note: string) => void;
  onContextChange: (context: EmotionsPageContextProps["context"]) => void;
  onSendToJournalChange: (value: boolean) => void;
  onBack: () => void;
  onSave: () => void;
  onSkip: () => void;
}

const WHO_PRESETS = ["Alone", "Friend", "Partner", "Family", "Team", "Colleagues"];
const WHAT_PRESETS = ["Work", "Eating", "Commuting", "Socializing", "Resting", "Exercise"];
const SLEEP_PRESETS = ["< 4 hrs", "4-6 hrs", "6-8 hrs", "> 8 hrs"];
const ACTIVITY_PRESETS = ["None", "Walk", "Gym", "Yoga", "Sport", "Running"];

const CONTEXT_CONTENT = {
  badge: "Add Context",
  title: {
    line1: "Capture the",
    line2: "Moment"
  },
  description: "Understanding the context of your emotions helps identify patterns and triggers. This information builds your personal emotional intelligence over time.",
  features: [
    "Connect emotions to activities",
    "Track sleep and energy patterns",
    "Discover your emotional triggers"
  ]
};

const quadrantEmoji: Record<QuadrantType, string> = {
  "high-pleasant": "😊",
  "high-unpleasant": "😰",
  "low-unpleasant": "😔",
  "low-pleasant": "😌",
};

export function EmotionsPageContext({
  selectedQuadrant,
  selectedEmotion,
  note,
  context,
  sendToJournal,
  saving,
  onNoteChange,
  onContextChange,
  onSendToJournalChange,
  onBack,
  onSave,
  onSkip,
}: EmotionsPageContextProps) {
  const quadrantInfo = QUADRANTS[selectedQuadrant];

  const updateContext = (key: keyof typeof context, value: string | undefined) => {
    onContextChange({ ...context, [key]: value });
  };

  const PillButton = ({ 
    label, 
    selected, 
    onClick 
  }: { 
    label: string; 
    selected: boolean; 
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "h-10 px-4 rounded-xl text-sm font-medium transition-all duration-200",
        "border-2 hover:scale-105 active:scale-95",
        selected
          ? "text-white border-transparent shadow-lg"
          : "bg-background text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
      )}
      style={{
        background: selected 
          ? `linear-gradient(135deg, ${quadrantInfo.color}, ${quadrantInfo.color}DD)` 
          : undefined,
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col min-h-[calc(100vh-300px)] animate-in fade-in slide-in-from-right-4 duration-400">
      {/* Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 flex-1">
        {/* Left: Form Cards */}
        <div className="flex flex-col order-2 lg:order-1">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="gap-2 text-muted-foreground hover:text-foreground self-start mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          {/* Form Cards */}
          <div className="flex flex-col gap-4 flex-1">
            {/* Notes Card */}
            <div className="p-5 rounded-2xl border border-border bg-card/50">
              <Label className="flex items-center gap-2 text-sm font-medium mb-3">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Notes
              </Label>
              <Textarea
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder="What's on your mind?"
                className="min-h-[80px] rounded-xl resize-none text-base bg-background/50"
              />
            </div>

            {/* Who Card */}
            <div className="p-5 rounded-2xl border border-border bg-card/50">
              <Label className="flex items-center gap-2 text-sm font-medium mb-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                Who are you with?
              </Label>
              <div className="flex flex-wrap gap-2">
                {WHO_PRESETS.map((preset) => (
                  <PillButton
                    key={preset}
                    label={preset}
                    selected={context.who === preset}
                    onClick={() => updateContext("who", context.who === preset ? undefined : preset)}
                  />
                ))}
              </div>
            </div>

            {/* What Card */}
            <div className="p-5 rounded-2xl border border-border bg-card/50">
              <Label className="flex items-center gap-2 text-sm font-medium mb-3">
                <Activity className="h-4 w-4 text-muted-foreground" />
                What are you doing?
              </Label>
              <div className="flex flex-wrap gap-2">
                {WHAT_PRESETS.map((preset) => (
                  <PillButton
                    key={preset}
                    label={preset}
                    selected={context.what === preset}
                    onClick={() => updateContext("what", context.what === preset ? undefined : preset)}
                  />
                ))}
              </div>
            </div>

            {/* Sleep & Activity Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sleep Card */}
              <div className="p-5 rounded-2xl border border-border bg-card/50">
                <Label className="flex items-center gap-2 text-sm font-medium mb-3">
                  <Moon className="h-4 w-4 text-muted-foreground" />
                  Sleep last night
                </Label>
                <div className="flex flex-wrap gap-2">
                  {SLEEP_PRESETS.map((preset) => (
                    <PillButton
                      key={preset}
                      label={preset}
                      selected={context.sleepHours === preset}
                      onClick={() => updateContext("sleepHours", context.sleepHours === preset ? undefined : preset)}
                    />
                  ))}
                </div>
              </div>

              {/* Activity Card */}
              <div className="p-5 rounded-2xl border border-border bg-card/50">
                <Label className="flex items-center gap-2 text-sm font-medium mb-3">
                  <Dumbbell className="h-4 w-4 text-muted-foreground" />
                  Physical activity
                </Label>
                <div className="flex flex-wrap gap-2">
                  {ACTIVITY_PRESETS.map((preset) => (
                    <PillButton
                      key={preset}
                      label={preset}
                      selected={context.physicalActivity === preset}
                      onClick={() => updateContext("physicalActivity", context.physicalActivity === preset ? undefined : preset)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Journal Toggle Card */}
            <div className="p-5 rounded-2xl border border-border bg-card/50">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    Send to Journal
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">Add this check-in to today's journal entry</p>
                </div>
                <Switch 
                  checked={sendToJournal} 
                  onCheckedChange={onSendToJournalChange}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 mt-auto">
              <Button 
                variant="ghost" 
                onClick={onSkip}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                Skip
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Button
                onClick={onSave}
                disabled={saving}
                size="lg"
                className="h-12 px-8 rounded-2xl text-base font-semibold gap-2 transition-all duration-300 hover:scale-105 active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${quadrantInfo.color}, ${quadrantInfo.color}DD)`,
                }}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save Check-in
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Right: Descriptive Text */}
        <div className="flex flex-col justify-center order-1 lg:order-2 lg:pl-8">
          {/* Badge */}
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 w-fit"
            style={{
              background: `linear-gradient(135deg, ${quadrantInfo.color}20, ${quadrantInfo.color}10)`,
              color: quadrantInfo.color,
            }}
          >
            <Sparkles className="h-4 w-4" />
            {CONTEXT_CONTENT.badge}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-light text-foreground mb-2">
            {CONTEXT_CONTENT.title.line1}
          </h1>
          <h1 
            className="text-4xl md:text-5xl font-light mb-6"
            style={{ color: quadrantInfo.color }}
          >
            {CONTEXT_CONTENT.title.line2}
          </h1>

          {/* Description */}
          <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-md">
            {CONTEXT_CONTENT.description}
          </p>

          {/* Features */}
          <ul className="space-y-3 mb-8">
            {CONTEXT_CONTENT.features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-3 text-muted-foreground">
                <div 
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${quadrantInfo.color}20` }}
                >
                  <Check className="h-3 w-3" style={{ color: quadrantInfo.color }} />
                </div>
                {feature}
              </li>
            ))}
          </ul>

          {/* Selected Emotion Badge */}
          <div 
            className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl border-2 w-fit"
            style={{
              background: `linear-gradient(135deg, ${quadrantInfo.bgColor}, ${quadrantInfo.borderColor}20)`,
              borderColor: quadrantInfo.borderColor,
            }}
          >
            <span className="text-2xl">{quadrantEmoji[selectedQuadrant]}</span>
            <div>
              <p className="text-xs text-muted-foreground">Currently feeling</p>
              <p className="font-medium" style={{ color: quadrantInfo.color }}>
                {selectedEmotion}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
