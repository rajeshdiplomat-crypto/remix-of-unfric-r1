import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Users, Activity, Heart, Moon, Dumbbell, BookOpen, Clock, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const WHO_PRESETS = ["Alone", "Friend", "Partner", "Family", "Team", "Colleagues", "Strangers"];
const WHAT_PRESETS = ["Work", "Eating", "Commuting", "Socializing", "Resting", "Exercise", "Creative", "Learning"];
const BODY_PRESETS = ["Tense", "Calm", "Fatigued", "Energized", "Headache", "Relaxed", "Restless", "Comfortable"];
const SLEEP_PRESETS = ["< 4 hrs", "4-6 hrs", "6-8 hrs", "> 8 hrs"];
const ACTIVITY_PRESETS = ["None", "Walk", "Gym", "Yoga", "Sport", "Running", "Swimming", "Cycling"];

export interface EnhancedContextData {
  who?: string;
  what?: string;
  body?: string;
  sleepHours?: string;
  physicalActivity?: string;
}

interface EmotionContextFieldsEnhancedProps {
  note: string;
  onNoteChange: (note: string) => void;
  context: EnhancedContextData;
  onContextChange: (context: EnhancedContextData) => void;
  sendToJournal: boolean;
  onSendToJournalChange: (value: boolean) => void;
  checkInTime: Date;
  onCheckInTimeChange: (date: Date) => void;
  hideJournalToggle?: boolean;
  hideTimeField?: boolean;
}

const gradients: Record<string, string> = {
  who: "from-blue-500 to-cyan-500",
  what: "from-purple-500 to-pink-500",
  body: "from-rose-500 to-orange-500",
  sleep: "from-indigo-500 to-blue-500",
  activity: "from-green-500 to-teal-500",
};

function PresetPills({
  options,
  selected,
  onSelect,
  allowCustom = true,
  gradient,
}: {
  options: string[];
  selected?: string;
  onSelect: (value: string) => void;
  allowCustom?: boolean;
  gradient: string;
}) {
  const [showCustom, setShowCustom] = useState(false);
  const [customValue, setCustomValue] = useState("");

  const handleCustomSubmit = () => {
    if (customValue.trim()) {
      onSelect(customValue.trim());
      setShowCustom(false);
      setCustomValue("");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onSelect(option === selected ? "" : option)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-offset-2",
              selected === option
                ? `bg-gradient-to-r ${gradient} text-white shadow-md scale-105`
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700",
            )}
            style={selected === option ? ({ "--tw-ring-color": "transparent" } as any) : {}}
          >
            {option}
          </button>
        ))}
        {allowCustom && (
          <button
            onClick={() => setShowCustom(!showCustom)}
            className="px-3 py-1.5 rounded-full text-xs font-medium border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-400 hover:border-slate-400 hover:text-slate-500 transition-all flex items-center gap-1"
          >
            <Plus className="h-3 w-3" /> Other
          </button>
        )}
      </div>
      {showCustom && (
        <div className="flex gap-2">
          <Input
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder="Enter custom value..."
            className="h-9 text-sm rounded-xl"
            onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
          />
          <Button
            size="sm"
            onClick={handleCustomSubmit}
            className={`h-9 rounded-xl bg-gradient-to-r ${gradient} text-white`}
          >
            Add
          </Button>
        </div>
      )}
    </div>
  );
}

export function EmotionContextFieldsEnhanced({
  note,
  onNoteChange,
  context,
  onContextChange,
  sendToJournal,
  onSendToJournalChange,
  checkInTime,
  onCheckInTimeChange,
  hideJournalToggle = false,
  hideTimeField = false,
}: EmotionContextFieldsEnhancedProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateContext = (field: keyof EnhancedContextData, value: string) => {
    onContextChange({ ...context, [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* Note */}
      <div className="space-y-2">
        <Label htmlFor="note" className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Add a note (optional)
        </Label>
        <Textarea
          id="note"
          placeholder="What's on your mind? What might have triggered this feeling?"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          className="min-h-[90px] resize-none rounded-xl border-slate-200 dark:border-slate-700 focus:ring-rose-500"
        />
      </div>

      {/* Time & Journal */}
      {(!hideTimeField || !hideJournalToggle) && (
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700">
          {!hideTimeField && (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white dark:bg-slate-700 shadow-sm">
                <Clock className="h-4 w-4 text-slate-500" />
              </div>
              <input
                type="datetime-local"
                value={checkInTime.toISOString().slice(0, 16)}
                onChange={(e) => onCheckInTimeChange(new Date(e.target.value))}
                className="text-sm bg-transparent border-none focus:outline-none text-slate-700 dark:text-slate-200 font-medium"
              />
            </div>
          )}
          {!hideJournalToggle && (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white dark:bg-slate-700 shadow-sm">
                <BookOpen className="h-4 w-4 text-slate-500" />
              </div>
              <Label htmlFor="journal-sync" className="text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                Journal
              </Label>
              <Switch id="journal-sync" checked={sendToJournal} onCheckedChange={onSendToJournalChange} />
            </div>
          )}
        </div>
      )}

      {/* Collapsible Details */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Add more details</span>
            <ChevronDown
              className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-5 pt-4">
          {/* Who */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <div className={`p-1.5 rounded-lg bg-gradient-to-r ${gradients.who}`}>
                <Users className="h-3.5 w-3.5 text-white" />
              </div>
              Who are you with?
            </Label>
            <PresetPills
              options={WHO_PRESETS}
              selected={context.who}
              onSelect={(v) => updateContext("who", v)}
              gradient={gradients.who}
            />
          </div>

          {/* What */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <div className={`p-1.5 rounded-lg bg-gradient-to-r ${gradients.what}`}>
                <Activity className="h-3.5 w-3.5 text-white" />
              </div>
              What are you doing?
            </Label>
            <PresetPills
              options={WHAT_PRESETS}
              selected={context.what}
              onSelect={(v) => updateContext("what", v)}
              gradient={gradients.what}
            />
          </div>

          {/* Body */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <div className={`p-1.5 rounded-lg bg-gradient-to-r ${gradients.body}`}>
                <Heart className="h-3.5 w-3.5 text-white" />
              </div>
              Body sensations?
            </Label>
            <PresetPills
              options={BODY_PRESETS}
              selected={context.body}
              onSelect={(v) => updateContext("body", v)}
              gradient={gradients.body}
            />
          </div>

          {/* Sleep */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <div className={`p-1.5 rounded-lg bg-gradient-to-r ${gradients.sleep}`}>
                <Moon className="h-3.5 w-3.5 text-white" />
              </div>
              Sleep last night?
            </Label>
            <PresetPills
              options={SLEEP_PRESETS}
              selected={context.sleepHours}
              onSelect={(v) => updateContext("sleepHours", v)}
              allowCustom={false}
              gradient={gradients.sleep}
            />
          </div>

          {/* Activity */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <div className={`p-1.5 rounded-lg bg-gradient-to-r ${gradients.activity}`}>
                <Dumbbell className="h-3.5 w-3.5 text-white" />
              </div>
              Physical activity today?
            </Label>
            <PresetPills
              options={ACTIVITY_PRESETS}
              selected={context.physicalActivity}
              onSelect={(v) => updateContext("physicalActivity", v)}
              gradient={gradients.activity}
            />
          </div>

          <p className="text-xs text-slate-400 italic pt-2">These details help you spot patterns over time</p>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
