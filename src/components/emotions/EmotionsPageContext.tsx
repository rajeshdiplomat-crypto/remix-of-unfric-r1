import { ArrowLeft, ArrowRight, Users, Activity, Moon, Dumbbell, BookOpen, Loader2 } from "lucide-react";
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
        "h-11 px-5 rounded-xl text-sm font-medium transition-all duration-200",
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
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {/* Selected Emotion Badge */}
        <div 
          className="flex items-center gap-2 px-4 py-2 rounded-2xl border-2"
          style={{
            background: `linear-gradient(135deg, ${quadrantInfo.bgColor}, ${quadrantInfo.borderColor}20)`,
            borderColor: quadrantInfo.borderColor,
          }}
        >
          <span className="text-xl">{quadrantEmoji[selectedQuadrant]}</span>
          <span className="font-medium" style={{ color: quadrantInfo.color }}>
            {selectedEmotion}
          </span>
        </div>

        <Button 
          variant="ghost" 
          onClick={onSkip}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          Skip
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Title */}
      <h2 className="text-2xl md:text-3xl font-light text-center text-muted-foreground mb-12">
        Tell us more about this moment
      </h2>

      {/* Context Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Notes Card */}
        <div className="md:col-span-2 p-6 rounded-2xl border border-border bg-card/50">
          <Label className="flex items-center gap-2 text-sm font-medium mb-4">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            Notes
          </Label>
          <Textarea
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="What's on your mind?"
            className="min-h-[100px] rounded-xl resize-none text-base bg-background/50"
          />
        </div>

        {/* Who Card */}
        <div className="p-6 rounded-2xl border border-border bg-card/50">
          <Label className="flex items-center gap-2 text-sm font-medium mb-4">
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
        <div className="p-6 rounded-2xl border border-border bg-card/50">
          <Label className="flex items-center gap-2 text-sm font-medium mb-4">
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

        {/* Sleep Card */}
        <div className="p-6 rounded-2xl border border-border bg-card/50">
          <Label className="flex items-center gap-2 text-sm font-medium mb-4">
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
        <div className="p-6 rounded-2xl border border-border bg-card/50">
          <Label className="flex items-center gap-2 text-sm font-medium mb-4">
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

        {/* Journal Toggle Card */}
        <div className="md:col-span-2 p-6 rounded-2xl border border-border bg-card/50">
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
      </div>

      {/* Save Button */}
      <div className="flex justify-center mt-auto pt-8">
        <Button
          onClick={onSave}
          disabled={saving}
          size="lg"
          className="h-14 px-12 rounded-2xl text-base font-semibold gap-3 transition-all duration-300 hover:scale-105 active:scale-95"
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
  );
}
