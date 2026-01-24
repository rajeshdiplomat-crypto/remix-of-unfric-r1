import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Users, Activity, Heart, Moon, Dumbbell, BookOpen, Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTimezone } from "@/hooks/useTimezone";
import { format, parse } from "date-fns";

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

interface Props {
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

function PresetPills({
  options,
  selected,
  onSelect,
  allowCustom = true,
}: {
  options: string[];
  selected?: string;
  onSelect: (v: string) => void;
  allowCustom?: boolean;
}) {
  const [showCustom, setShowCustom] = useState(false);
  const [customValue, setCustomValue] = useState("");

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onSelect(o === selected ? "" : o)}
            className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium transition-all border",
              selected === o
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted",
            )}
          >
            {o}
          </button>
        ))}
        {allowCustom && (
          <button
            onClick={() => setShowCustom(!showCustom)}
            className="px-2.5 py-1 rounded-full text-xs font-medium border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary"
          >
            + Other
          </button>
        )}
      </div>
      {showCustom && (
        <div className="flex gap-2">
          <Input
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder="Enter custom value..."
            className="h-8 text-sm"
            onKeyDown={(e) =>
              e.key === "Enter" &&
              customValue.trim() &&
              (onSelect(customValue.trim()), setShowCustom(false), setCustomValue(""))
            }
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              customValue.trim() && (onSelect(customValue.trim()), setShowCustom(false), setCustomValue(""))
            }
            className="h-8"
          >
            Add
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Get current date/time formatted for datetime-local input in user's timezone
 */
function getLocalDateTimeString(date: Date, timezone: string): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };
  
  const parts = new Intl.DateTimeFormat("en-CA", options).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  const hour = parts.find((p) => p.type === "hour")?.value;
  const minute = parts.find((p) => p.type === "minute")?.value;
  
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * Format date for display in user's timezone
 */
function formatDisplayDateTime(date: Date, timezone: string): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };
  
  return new Intl.DateTimeFormat("en-US", options).format(date);
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
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const { timezone } = useTimezone();
  
  const updateContext = (field: keyof EnhancedContextData, value: string) =>
    onContextChange({ ...context, [field]: value });

  // Format datetime-local value in user's timezone
  const dateTimeValue = getLocalDateTimeString(checkInTime, timezone);
  const displayDateTime = formatDisplayDateTime(checkInTime, timezone);

  const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      // Parse the datetime-local value and create a new Date
      const newDate = new Date(value);
      if (!isNaN(newDate.getTime())) {
        onCheckInTimeChange(newDate);
      }
    }
  };

  return (
    <div className="space-y-4">
      {(!hideTimeField || !hideJournalToggle) && (
        <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/30">
          {!hideTimeField && (
            <div className="flex items-center gap-2 flex-1">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                type="datetime-local"
                value={dateTimeValue}
                onChange={handleDateTimeChange}
                className="text-sm bg-transparent border-none focus:outline-none text-foreground w-auto"
              />
              <Calendar className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
            </div>
          )}
          {!hideJournalToggle && (
            <div className="flex items-center gap-2 shrink-0">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="journal-sync" className="text-sm text-muted-foreground cursor-pointer whitespace-nowrap">
                Send to Journal
              </Label>
              <Switch id="journal-sync" checked={sendToJournal} onCheckedChange={onSendToJournalChange} />
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="note" className="text-sm text-muted-foreground">
          Add a note (optional)
        </Label>
        <Textarea
          id="note"
          placeholder="What's on your mind?"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          className="min-h-[80px] resize-none"
        />
      </div>

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between px-3 py-2 h-auto">
            <span className="text-sm text-muted-foreground">Add more details</span>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-2 pt-2">
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" /> Who are you with?
            </Label>
            <PresetPills options={WHO_PRESETS} selected={context.who} onSelect={(v) => updateContext("who", v)} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-2 text-muted-foreground">
              <Activity className="h-4 w-4" /> What are you doing?
            </Label>
            <PresetPills options={WHAT_PRESETS} selected={context.what} onSelect={(v) => updateContext("what", v)} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-2 text-muted-foreground">
              <Heart className="h-4 w-4" /> Body sensations?
            </Label>
            <PresetPills options={BODY_PRESETS} selected={context.body} onSelect={(v) => updateContext("body", v)} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-2 text-muted-foreground">
              <Moon className="h-4 w-4" /> Sleep last night?
            </Label>
            <PresetPills
              options={SLEEP_PRESETS}
              selected={context.sleepHours}
              onSelect={(v) => updateContext("sleepHours", v)}
              allowCustom={false}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-2 text-muted-foreground">
              <Dumbbell className="h-4 w-4" /> Physical activity today?
            </Label>
            <PresetPills
              options={ACTIVITY_PRESETS}
              selected={context.physicalActivity}
              onSelect={(v) => updateContext("physicalActivity", v)}
            />
          </div>
          <p className="text-xs text-muted-foreground/60 italic">These details help you spot patterns over time</p>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
