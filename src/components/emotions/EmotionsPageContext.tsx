import React from "react";
import {
  ArrowLeft,
  ArrowRight,
  Users,
  Activity,
  Moon,
  Dumbbell,
  BookOpen,
  Loader2,
  Check,
  Sparkles,
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

const CONTEXT_CONTENT = {
  badge: "Add Context",
  title: {
    line1: "Capture the",
    line2: "Moment",
  },
  description:
    "Understanding the context of your emotions helps identify patterns and triggers. This information builds your personal emotional intelligence over time.",
  features: ["Connect emotions to activities", "Track sleep and energy patterns", "Discover your emotional triggers"],
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

  const PillButton = ({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={cn(
        "h-8 px-4 rounded-lg text-xs font-medium transition-all duration-200 border",
        selected
          ? "border-transparent shadow-sm scale-105"
          : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground hover:bg-muted/30",
      )}
      style={{
        background: selected ? `linear-gradient(135deg, ${quadrantInfo.color}30, ${quadrantInfo.color}15)` : undefined,
        color: selected ? quadrantInfo.color : undefined,
        borderColor: selected ? quadrantInfo.color : undefined,
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col min-h-[calc(100vh-300px)] animate-in fade-in slide-in-from-right-4 duration-400 mx-auto w-full">
      {/* Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-14 flex-1">
        {/* Left: FormCards */}
        <div className="flex flex-col order-2 lg:order-1">
          {/* Header Area: Back Button & Journal Toggle */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-1.5 text-muted-foreground hover:text-foreground pl-0"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border">
              <Label htmlFor="journal-toggle" className="text-xs font-medium text-muted-foreground cursor-pointer">
                Journal Entry
              </Label>
              <Switch
                id="journal-toggle"
                checked={sendToJournal}
                onCheckedChange={onSendToJournalChange}
                className="scale-75 data-[state=checked]:bg-primary"
                style={{ "--primary": quadrantInfo.color } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Form Cards - Compact */}
          <div className="flex flex-col gap-3 flex-1">
            {/* Notes Card */}
            <div className="p-4 rounded-2xl border border-border bg-card/50">
              <Label className="flex items-center gap-2 text-xs font-bold tracking-wide text-muted-foreground mb-3">
                <BookOpen className="h-3.5 w-3.5" />
                Notes
              </Label>
              <Textarea
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder="What's on your mind?"
                className="min-h-[80px] rounded-xl resize-none text-sm bg-background/50 focus-visible:ring-1"
                style={{ "--ring": quadrantInfo.color } as React.CSSProperties}
              />
            </div>

            {/* Who Card */}
            <div className="p-4 rounded-2xl border border-border bg-card/50">
              <Label className="flex items-center gap-2 text-xs font-bold tracking-wide text-muted-foreground mb-3">
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

            {/* What Card */}
            <div className="p-4 rounded-2xl border border-border bg-card/50">
              <Label className="flex items-center gap-2 text-xs font-bold tracking-wide text-muted-foreground mb-3">
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

            {/* Sleep & Activity Row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Sleep Card */}
              <div className="p-4 rounded-2xl border border-border bg-card/50">
                <Label className="flex items-center gap-2 text-xs font-bold tracking-wide text-muted-foreground mb-3">
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

              {/* Activity Card */}
              <div className="p-4 rounded-2xl border border-border bg-card/50">
                <Label className="flex items-center gap-2 text-xs font-bold tracking-wide text-muted-foreground mb-3">
                  <Dumbbell className="h-3.5 w-3.5" />
                  Activity
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

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 mt-auto border-t border-border/50">
              <Button variant="ghost" onClick={onSkip} className="text-muted-foreground hover:text-foreground">
                Skip
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>

              <Button
                onClick={onSave}
                disabled={saving}
                className="px-8 rounded-xl font-semibold shadow-lg transition-all hover:scale-105 active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${quadrantInfo.color}, ${quadrantInfo.color}dd)`,
                  boxShadow: `0 4px 14px 0 ${quadrantInfo.color}40`,
                }}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save Check-in
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Right: Info & Context - Clean & Visible */}
        <div className="flex flex-col order-1 lg:order-2 lg:pl-8 pt-2">
          {/* Capture Content - Ensured Visibility */}
          <div className="animate-in slide-in-from-bottom-4 fade-in duration-700 delay-100">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-6 w-fit border"
              style={{
                background: `linear-gradient(135deg, ${quadrantInfo.color}15, ${quadrantInfo.color}05)`,
                borderColor: `${quadrantInfo.color}30`,
                color: quadrantInfo.color,
              }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {CONTEXT_CONTENT.badge}
            </div>

            <h1 className="text-4xl md:text-5xl font-light text-foreground mb-1 leading-tight">
              {CONTEXT_CONTENT.title.line1}
            </h1>
            <h1 className="text-4xl md:text-5xl font-semibold mb-6 leading-tight" style={{ color: quadrantInfo.color }}>
              {CONTEXT_CONTENT.title.line2}
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed mb-6 max-w-md">{CONTEXT_CONTENT.description}</p>

            {/* Features List (NOW ABOVE THE BOX) */}
            <ul className="space-y-4 mb-8">
              {CONTEXT_CONTENT.features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3 text-sm font-medium text-foreground/80">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${quadrantInfo.color}15` }}
                  >
                    <Check className="h-3.5 w-3.5" style={{ color: quadrantInfo.color }} />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            {/* Enhanced Dark Currently Feeling Box (NOW AT THE BOTTOM) */}
            <div className="bg-slate-900/95 backdrop-blur-md rounded-2xl p-5 mb-8 text-white shadow-xl dark:bg-slate-950 border border-white/10 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
              <div
                className="absolute -top-10 -right-10 w-20 h-20 rounded-full blur-2xl opacity-20"
                style={{ backgroundColor: quadrantInfo.color }}
              />
              <div className="flex items-center gap-5 relative z-10">
                <div className="text-4xl filter drop-shadow-md pb-1">{quadrantEmoji[selectedQuadrant]}</div>
                <div>
                  <p className="text-[10px] tracking-wide font-bold text-white/50 mb-0.5">
                    Currently feeling
                  </p>
                  <p
                    className="text-2xl font-bold text-white tracking-wide"
                    style={{ textShadow: `0 0 15px ${quadrantInfo.color}40` }}
                  >
                    {selectedEmotion}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
