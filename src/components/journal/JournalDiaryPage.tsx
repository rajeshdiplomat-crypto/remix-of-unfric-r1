import { useState, useRef } from "react";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Type, Mic, MicOff, Pencil } from "lucide-react";
import { JournalScribbleCanvas } from "./JournalScribbleCanvas";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface JournalDiaryPageProps {
  selectedDate: Date;
  onNavigate: (direction: "prev" | "next") => void;
  dailyFeeling: string;
  dailyGratitude: string;
  dailyKindness: string;
  onFeelingChange: (value: string) => void;
  onGratitudeChange: (value: string) => void;
  onKindnessChange: (value: string) => void;
  onSave: () => void;
  saving: boolean;
  hasEntry: boolean;
}

export function JournalDiaryPage({
  selectedDate,
  onNavigate,
  dailyFeeling,
  dailyGratitude,
  dailyKindness,
  onFeelingChange,
  onGratitudeChange,
  onKindnessChange,
  onSave,
  saving,
  hasEntry,
}: JournalDiaryPageProps) {
  const { toast } = useToast();
  const [inputMode, setInputMode] = useState<"type" | "voice" | "scribble">("type");
  const [isRecording, setIsRecording] = useState(false);
  const [activeField, setActiveField] = useState<"feeling" | "gratitude" | "kindness">("feeling");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const dayName = format(selectedDate, "EEEE").toUpperCase();
  const dayNumber = format(selectedDate, "d");
  const monthName = format(selectedDate, "MMMM").toUpperCase();

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.onstop = async () => {
        const transcript = "Voice note recorded. Transcription coming soon.";
        if (activeField === "feeling") onFeelingChange(dailyFeeling + " " + transcript);
        else if (activeField === "gratitude") onGratitudeChange(dailyGratitude + " " + transcript);
        else onKindnessChange(dailyKindness + " " + transcript);
        toast({ title: "Recorded!", description: "Your voice note has been captured" });
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      toast({ title: "Error", description: "Could not access microphone", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const renderInputArea = (
    value: string,
    onChange: (val: string) => void,
    placeholder: string,
    field: "feeling" | "gratitude" | "kindness"
  ) => {
    if (inputMode === "scribble") {
      return (
        <JournalScribbleCanvas height={120} />
      );
    }
    
    if (inputMode === "voice") {
      return (
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant={isRecording && activeField === field ? "destructive" : "outline"}
            onClick={() => {
              setActiveField(field);
              isRecording ? stopRecording() : startRecording();
            }}
            className="h-10 w-10 rounded-full p-0"
          >
            {isRecording && activeField === field ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={2}
            className="flex-1 resize-none bg-transparent border-0 border-b border-dashed border-muted-foreground/30 rounded-none focus-visible:ring-0 focus-visible:border-primary font-serif text-base leading-7 p-0"
          />
        </div>
      );
    }
    
    return (
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="resize-none bg-transparent border-0 border-b border-dashed border-muted-foreground/30 rounded-none focus-visible:ring-0 focus-visible:border-primary font-serif text-base leading-7 p-0 min-h-[56px]"
        style={{ lineHeight: "28px" }}
      />
    );
  };

  return (
    <div className="relative">
      {/* Page Navigation Arrows */}
      <button
        onClick={() => onNavigate("prev")}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 p-2 rounded-full bg-card shadow-lg border border-border hover:bg-muted transition-colors"
        aria-label="Previous date"
      >
        <ChevronLeft className="h-6 w-6 text-foreground" />
      </button>
      
      <button
        onClick={() => onNavigate("next")}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 p-2 rounded-full bg-card shadow-lg border border-border hover:bg-muted transition-colors"
        aria-label="Next date"
      >
        <ChevronRight className="h-6 w-6 text-foreground" />
      </button>

      {/* Diary Page */}
      <div className="bg-card border-2 border-border rounded-lg shadow-xl overflow-hidden">
        {/* Lined paper background */}
        <div 
          className="relative"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                transparent,
                transparent 27px,
                hsl(var(--muted-foreground) / 0.15) 27px,
                hsl(var(--muted-foreground) / 0.15) 28px
              )
            `,
            backgroundPosition: "0 60px",
          }}
        >
          {/* Ring binder holes */}
          <div className="absolute left-4 top-0 bottom-0 flex flex-col justify-around py-8">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-full bg-muted-foreground/20 border-2 border-muted-foreground/30"
              />
            ))}
          </div>

          <div className="pl-12 pr-6 py-6">
            {/* Date Header - Top Right */}
            <div className="flex justify-end mb-6">
              <div className="text-right">
                <p className="text-sm font-semibold text-destructive tracking-widest">{dayName}</p>
                <p className="text-5xl font-bold text-destructive leading-none">{dayNumber}</p>
                <p className="text-sm font-semibold text-destructive tracking-widest">{monthName}</p>
              </div>
            </div>

            {/* My Feelings Section */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                <h3 className="text-sm font-semibold text-foreground">My Feelings</h3>
              </div>
              <p className="text-xs text-muted-foreground italic ml-5 mb-2">
                How are you feeling today? What emotions came up?
              </p>
              <div className="ml-5">
                {renderInputArea(dailyFeeling, onFeelingChange, "Today I felt...", "feeling")}
              </div>
            </div>

            {/* Gratitude Section */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                <h3 className="text-sm font-semibold text-foreground">Gratitude</h3>
              </div>
              <p className="text-xs text-muted-foreground italic ml-5 mb-2">
                What are you grateful for today? List 3 things.
              </p>
              <div className="ml-5">
                {renderInputArea(dailyGratitude, onGratitudeChange, "1. I'm grateful for...", "gratitude")}
              </div>
            </div>

            {/* Kindness Section */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                <h3 className="text-sm font-semibold text-foreground">Kindness</h3>
              </div>
              <p className="text-xs text-muted-foreground italic ml-5 mb-2">
                What act of kindness did you do or receive today?
              </p>
              <div className="ml-5">
                {renderInputArea(dailyKindness, onKindnessChange, "Today I...", "kindness")}
              </div>
            </div>

            {/* Input Mode Selector at Bottom */}
            <div className="border-t border-dashed border-muted-foreground/30 pt-4 mt-8">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    variant={inputMode === "type" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setInputMode("type")}
                    className="gap-1"
                  >
                    <Type className="h-4 w-4" />
                    Type
                  </Button>
                  <Button
                    variant={inputMode === "voice" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setInputMode("voice")}
                    className="gap-1"
                  >
                    <Mic className="h-4 w-4" />
                    Voice
                  </Button>
                  <Button
                    variant={inputMode === "scribble" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setInputMode("scribble")}
                    className="gap-1"
                  >
                    <Pencil className="h-4 w-4" />
                    Scribble
                  </Button>
                </div>

                <Button onClick={onSave} disabled={saving} size="sm">
                  {saving ? "Saving..." : hasEntry ? "Update" : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
