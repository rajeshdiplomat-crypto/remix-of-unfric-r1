import {
  ArrowLeft,
  ArrowRight,
  Users,
  Activity,
  Moon,
  Dumbbell,
  BookOpen,
  Loader2,
  Sparkles,
  AlertCircle,
} from "lucide-react";
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

  const PillButton = ({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={cn(
        "h-8 px-4 rounded-full text-xs font-medium transition-all duration-200 border",
        selected
          ? "text-white border-transparent shadow-sm scale-105"
          : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground hover:bg-muted/30",
      )}
      style={{
        background: selected ? `linear-gradient(135deg, ${quadrantInfo.color}, ${quadrantInfo.color}DD)` : undefined,
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
        {/* LEFT COLUMN: Visuals & Info */}
        <div className="space-y-6">
          {/* Currently Feeling Card */}
          <div className="p-8 rounded-3xl bg-card border border-border text-center relative overflow-hidden group">
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-700"
              style={{ background: `radial-gradient(circle at center, ${quadrantInfo.color}, transparent)` }}
            />

            <div className="relative z-10">
              <div
                className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-4xl shadow-lg mb-4 ring-4 ring-offset-4 ring-offset-card"
                style={{
                  backgroundColor: `${quadrantInfo.color}20`,
                  ringColor: `${quadrantInfo.color}20`,
                }}
              >
                {quadrantEmoji[selectedQuadrant]}
              </div>

              <h2 className="text-2xl font-bold mb-1" style={{ color: quadrantInfo.color }}>
                {selectedEmotion}
              </h2>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">
                Currently Feeling
              </p>
            </div>
          </div>

          {/* Why Context Text */}
          <div className="px-2">
            <h3 className="font-semibold text-foreground mb-3 text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Context Matters
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-xs text-muted-foreground leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>
                  adding context helps identify <strong className="text-foreground">hidden triggers</strong> in your
                  routine
                </span>
              </li>
              <li className="flex items-start gap-3 text-xs text-muted-foreground leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>
                  connect your moods to specific <strong className="text-foreground">people or places</strong>
                </span>
              </li>
              <li className="flex items-start gap-3 text-xs text-muted-foreground leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>
                  see how <strong className="text-foreground">sleep & activity</strong> impact your feelings
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* RIGHT COLUMN: Form */}
        <div className="bg-card rounded-3xl border border-border flex flex-col overflow-hidden shadow-sm">
          {/* Header */}
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/10">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 rounded-full hover:bg-muted">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-lg font-semibold">Add Context</h1>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 border border-border">
              <Label htmlFor="journal-mode" className="text-xs font-medium cursor-pointer">
                Journal Entry
              </Label>
              <Switch
                id="journal-mode"
                checked={sendToJournal}
                onCheckedChange={onSendToJournalChange}
                className="scale-75 data-[state=checked]:bg-primary"
              />
            </div>
          </div>

          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Notes Section */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5" />
                Notes
              </Label>
              <Textarea
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder="What's on your mind?..."
                className="min-h-[80px] rounded-xl resize-none text-sm bg-muted/20 border-border/50 focus:bg-background transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
              {/* Who Section */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
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

              {/* What Section */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Activity className="h-3.5 w-3.5" />
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

              {/* Sleep Section */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Moon className="h-3.5 w-3.5" />
                  Sleep
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

              {/* Activity Section */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Dumbbell className="h-3.5 w-3.5" />
                  Physical Activity
                </Label>
                <div className="flex flex-wrap gap-2">
                  {ACTIVITY_PRESETS.map((preset) => (
                    <PillButton
                      key={preset}
                      label={preset}
                      selected={context.physicalActivity === preset}
                      onClick={() =>
                        updateContext("physicalActivity", context.physicalActivity === preset ? undefined : preset)
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="p-4 border-t border-border bg-muted/5 flex items-center justify-between">
            <Button variant="ghost" onClick={onSkip} className="text-muted-foreground hover:text-foreground">
              Skip
            </Button>

            <Button
              onClick={onSave}
              disabled={saving}
              className="px-8 rounded-xl font-semibold shadow-lg transition-all hover:scale-105 active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${quadrantInfo.color}, ${quadrantInfo.color}dd)`,
              }}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  Save & Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
