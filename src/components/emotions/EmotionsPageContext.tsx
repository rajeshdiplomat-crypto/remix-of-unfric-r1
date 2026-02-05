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
        "h-8 px-3 rounded-lg text-xs font-medium transition-all duration-200",
        "border hover:scale-105 active:scale-95",
        selected
          ? "text-white border-transparent shadow-md"
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 flex-1">
        {/* Left: Form Cards */}
        <div className="flex flex-col order-2 lg:order-1">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onBack}
            className="gap-1.5 text-muted-foreground hover:text-foreground self-start mb-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>

          {/* Form Cards - Compact */}
          <div className="flex flex-col gap-2 flex-1">
            {/* Notes Card */}
            <div className="p-3 rounded-xl border border-border bg-card/50">
              <Label className="flex items-center gap-1.5 text-xs font-medium mb-2">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                Notes
              </Label>
              <Textarea
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder="What's on your mind?"
                className="min-h-[50px] rounded-lg resize-none text-sm bg-background/50"
              />
            </div>

            {/* Who Card */}
            <div className="p-3 rounded-xl border border-border bg-card/50">
              <Label className="flex items-center gap-1.5 text-xs font-medium mb-2">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                Who are you with?
              </Label>
              <div className="flex flex-wrap gap-1.5">
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
            <div className="p-3 rounded-xl border border-border bg-card/50">
              <Label className="flex items-center gap-1.5 text-xs font-medium mb-2">
                <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                What are you doing?
              </Label>
              <div className="flex flex-wrap gap-1.5">
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
            <div className="grid grid-cols-2 gap-2">
              {/* Sleep Card */}
              <div className="p-3 rounded-xl border border-border bg-card/50">
                <Label className="flex items-center gap-1.5 text-xs font-medium mb-2">
                  <Moon className="h-3.5 w-3.5 text-muted-foreground" />
                  Sleep
                </Label>
                <div className="flex flex-wrap gap-1">
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
              <div className="p-3 rounded-xl border border-border bg-card/50">
                <Label className="flex items-center gap-1.5 text-xs font-medium mb-2">
                  <Dumbbell className="h-3.5 w-3.5 text-muted-foreground" />
                  Activity
                </Label>
                <div className="flex flex-wrap gap-1">
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

            {/* Action Row with Journal Toggle */}
            <div className="flex items-center justify-between pt-2 mt-auto">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onSkip}
                  className="gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  Skip
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/50 border border-border">
                  <Label className="text-xs text-muted-foreground">Journal</Label>
                  <Switch 
                    checked={sendToJournal} 
                    onCheckedChange={onSendToJournalChange}
                    className="scale-75"
                  />
                </div>
              </div>

              <Button
                onClick={onSave}
                disabled={saving}
                className="h-10 px-6 rounded-xl text-sm font-semibold gap-2 transition-all duration-300 hover:scale-105 active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${quadrantInfo.color}, ${quadrantInfo.color}DD)`,
                }}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save Check-in
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Right: Descriptive Text */}
        <div className="flex flex-col justify-center order-1 lg:order-2 lg:pl-6">
          {/* Badge */}
          <div 
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4 w-fit"
            style={{
              background: `linear-gradient(135deg, ${quadrantInfo.color}20, ${quadrantInfo.color}10)`,
              color: quadrantInfo.color,
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {CONTEXT_CONTENT.badge}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-light text-foreground mb-1">
            {CONTEXT_CONTENT.title.line1}
          </h1>
          <h1 
            className="text-3xl md:text-4xl font-light mb-4"
            style={{ color: quadrantInfo.color }}
          >
            {CONTEXT_CONTENT.title.line2}
          </h1>

          {/* Description */}
          <p className="text-base text-muted-foreground leading-relaxed mb-5 max-w-sm">
            {CONTEXT_CONTENT.description}
          </p>

          {/* Features */}
          <ul className="space-y-2 mb-5">
            {CONTEXT_CONTENT.features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                <div 
                  className="w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${quadrantInfo.color}20` }}
                >
                  <Check className="h-2.5 w-2.5" style={{ color: quadrantInfo.color }} />
                </div>
                {feature}
              </li>
            ))}
          </ul>

          {/* Selected Emotion Badge */}
          <div 
            className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 w-fit"
            style={{
              background: `linear-gradient(135deg, ${quadrantInfo.bgColor}, ${quadrantInfo.borderColor}20)`,
              borderColor: quadrantInfo.borderColor,
            }}
          >
            <span className="text-xl">{quadrantEmoji[selectedQuadrant]}</span>
            <div>
              <p className="text-[10px] text-muted-foreground">Currently feeling</p>
              <p className="text-sm font-medium" style={{ color: quadrantInfo.color }}>
                {selectedEmotion}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
