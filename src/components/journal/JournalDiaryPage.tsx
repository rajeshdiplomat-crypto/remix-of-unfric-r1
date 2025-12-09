import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Type, Mic, MicOff, Pencil, Image, Settings, X } from "lucide-react";
import { JournalScribbleCanvas } from "./JournalScribbleCanvas";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

// Diary skin presets
const DIARY_SKINS = [
  { id: "classic", name: "Classic", bg: "hsl(45, 30%, 96%)", lineColor: "hsl(200, 70%, 80%)", marginColor: "hsl(0, 70%, 70%)" },
  { id: "cream", name: "Cream", bg: "hsl(40, 40%, 94%)", lineColor: "hsl(30, 20%, 80%)", marginColor: "hsl(30, 50%, 60%)" },
  { id: "dark", name: "Dark Mode", bg: "hsl(222, 47%, 11%)", lineColor: "hsl(222, 30%, 25%)", marginColor: "hsl(200, 70%, 50%)" },
  { id: "pink", name: "Soft Pink", bg: "hsl(350, 50%, 96%)", lineColor: "hsl(350, 40%, 85%)", marginColor: "hsl(350, 60%, 70%)" },
  { id: "green", name: "Sage Green", bg: "hsl(120, 20%, 95%)", lineColor: "hsl(120, 30%, 80%)", marginColor: "hsl(120, 40%, 50%)" },
  { id: "kraft", name: "Kraft Paper", bg: "hsl(35, 35%, 85%)", lineColor: "hsl(35, 25%, 70%)", marginColor: "hsl(0, 60%, 50%)" },
];

// Line height for proper diary alignment
const LINE_HEIGHT = 24;
const TOP_MARGIN = 48; // Blank space at top like real diary
const LEFT_MARGIN = 60; // Red margin line position

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
  const [selectedSkin, setSelectedSkin] = useState(DIARY_SKINS[0]);
  const [pageFlip, setPageFlip] = useState<"none" | "left" | "right">("none");
  const [showPromptsDialog, setShowPromptsDialog] = useState(false);
  const [prompts, setPrompts] = useState({
    feeling: "How are you feeling today? What emotions came up?",
    gratitude: "What are you grateful for today? List 3 things.",
    kindness: "What act of kindness did you do or receive today?",
  });
  const [images, setImages] = useState<{ id: string; src: string; top: number }[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dayName = format(selectedDate, "EEEE").toUpperCase();
  const dayNumber = format(selectedDate, "d");
  const monthName = format(selectedDate, "MMMM").toUpperCase();
  const year = format(selectedDate, "yyyy");

  // Page flip animation handler
  const handleNavigate = (direction: "prev" | "next") => {
    setPageFlip(direction === "prev" ? "left" : "right");
    setTimeout(() => {
      onNavigate(direction);
      setPageFlip("none");
    }, 300);
  };

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

  // Image insertion handler
  const handleImageInsert = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newImage = {
          id: Date.now().toString(),
          src: event.target?.result as string,
          top: 200,
        };
        setImages([...images, newImage]);
        toast({ title: "Image added!", description: "You can position it on the page" });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (id: string) => {
    setImages(images.filter((img) => img.id !== id));
  };

  // Calculate text area height based on content (auto-expand like Notion)
  const calculateTextHeight = (text: string) => {
    const lines = text.split("\n").length;
    const charLines = Math.ceil(text.length / 50); // Approximate chars per line
    return Math.max(lines, charLines, 2) * LINE_HEIGHT;
  };

  const renderInputArea = (
    value: string,
    onChange: (val: string) => void,
    placeholder: string,
    field: "feeling" | "gratitude" | "kindness"
  ) => {
    if (inputMode === "voice") {
      return (
        <div className="flex items-start gap-3">
          <Button
            size="sm"
            variant={isRecording && activeField === field ? "destructive" : "outline"}
            onClick={() => {
              setActiveField(field);
              isRecording ? stopRecording() : startRecording();
            }}
            className="h-8 w-8 rounded-full p-0 flex-shrink-0 mt-1"
          >
            {isRecording && activeField === field ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
          </Button>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 resize-none bg-transparent border-0 focus:outline-none focus:ring-0 font-serif text-sm p-0 overflow-hidden"
            style={{
              lineHeight: `${LINE_HEIGHT}px`,
              minHeight: `${LINE_HEIGHT * 2}px`,
              height: `${calculateTextHeight(value)}px`,
              color: selectedSkin.id === "dark" ? "hsl(210, 40%, 96%)" : "hsl(222, 47%, 11%)",
            }}
          />
        </div>
      );
    }

    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-none bg-transparent border-0 focus:outline-none focus:ring-0 font-serif text-sm p-0 overflow-hidden"
        style={{
          lineHeight: `${LINE_HEIGHT}px`,
          minHeight: `${LINE_HEIGHT * 2}px`,
          height: `${calculateTextHeight(value)}px`,
          color: selectedSkin.id === "dark" ? "hsl(210, 40%, 96%)" : "hsl(222, 47%, 11%)",
        }}
      />
    );
  };

  // Get animation class for page flip
  const getPageFlipClass = () => {
    if (pageFlip === "left") return "animate-[flip-left_0.3s_ease-in-out]";
    if (pageFlip === "right") return "animate-[flip-right_0.3s_ease-in-out]";
    return "";
  };

  return (
    <div className="relative">
      {/* Page Navigation Arrows */}
      <button
        onClick={() => handleNavigate("prev")}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 z-10 p-2 rounded-full bg-card shadow-lg border border-border hover:bg-muted transition-colors"
        aria-label="Previous date"
      >
        <ChevronLeft className="h-5 w-5 text-foreground" />
      </button>

      <button
        onClick={() => handleNavigate("next")}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 z-10 p-2 rounded-full bg-card shadow-lg border border-border hover:bg-muted transition-colors"
        aria-label="Next date"
      >
        <ChevronRight className="h-5 w-5 text-foreground" />
      </button>

      {/* Diary Page - Proportions similar to A5 notebook (148mm x 210mm ratio) */}
      <div
        className={cn(
          "relative mx-auto shadow-2xl overflow-hidden transition-transform duration-300",
          getPageFlipClass()
        )}
        style={{
          width: "100%",
          maxWidth: "420px",
          aspectRatio: "148 / 210", // A5 ratio
          backgroundColor: selectedSkin.bg,
          borderRadius: "4px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15), inset 0 0 60px rgba(0,0,0,0.03)",
        }}
      >
        {/* Lined paper background with proper spacing */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(
                ${selectedSkin.lineColor} 1px,
                transparent 1px
              )
            `,
            backgroundSize: `100% ${LINE_HEIGHT}px`,
            backgroundPosition: `0 ${TOP_MARGIN}px`,
          }}
        />

        {/* Red margin line */}
        <div
          className="absolute top-0 bottom-0"
          style={{
            left: `${LEFT_MARGIN}px`,
            width: "1px",
            backgroundColor: selectedSkin.marginColor,
          }}
        />

        {/* Ring binder holes */}
        <div className="absolute left-3 top-0 bottom-0 flex flex-col justify-evenly py-8">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: selectedSkin.id === "dark" ? "hsl(222, 30%, 20%)" : "hsl(0, 0%, 90%)",
                border: `1px solid ${selectedSkin.id === "dark" ? "hsl(222, 30%, 30%)" : "hsl(0, 0%, 80%)"}`,
              }}
            />
          ))}
        </div>

        {/* Page Content */}
        <div
          className="relative h-full flex flex-col"
          style={{ paddingLeft: `${LEFT_MARGIN + 12}px`, paddingRight: "16px" }}
        >
          {/* Top blank margin - Date Header */}
          <div
            className="flex justify-end items-start pt-3"
            style={{ minHeight: `${TOP_MARGIN}px` }}
          >
            <div className="text-right">
              <p
                className="text-[10px] font-semibold tracking-widest"
                style={{ color: selectedSkin.marginColor }}
              >
                {dayName}
              </p>
              <p
                className="text-2xl font-bold leading-none"
                style={{ color: selectedSkin.marginColor }}
              >
                {dayNumber}
              </p>
              <p
                className="text-[10px] font-semibold tracking-widest"
                style={{ color: selectedSkin.marginColor }}
              >
                {monthName} {year}
              </p>
            </div>
          </div>

          {/* Scrollable content area for scribble mode or regular content */}
          <div className="flex-1 overflow-y-auto pb-16">
            {inputMode === "scribble" ? (
              <div className="pt-2">
                <JournalScribbleCanvas
                  height={500}
                  bgColor={selectedSkin.bg}
                  lineColor={selectedSkin.lineColor}
                  lineHeight={LINE_HEIGHT}
                />
              </div>
            ) : (
              <>
                {/* My Feelings Section */}
                <div className="mb-4">
                  <h3
                    className="font-semibold text-xs mb-1"
                    style={{
                      lineHeight: `${LINE_HEIGHT}px`,
                      color: selectedSkin.id === "dark" ? "hsl(210, 40%, 80%)" : "hsl(222, 47%, 30%)",
                    }}
                  >
                    My Feelings
                  </h3>
                  <p
                    className="text-[11px] italic mb-1 opacity-70"
                    style={{
                      lineHeight: `${LINE_HEIGHT}px`,
                      color: selectedSkin.id === "dark" ? "hsl(210, 40%, 70%)" : "hsl(222, 30%, 50%)",
                    }}
                  >
                    {prompts.feeling}
                  </p>
                  {renderInputArea(dailyFeeling, onFeelingChange, "Today I felt...", "feeling")}
                </div>

                {/* Gratitude Section */}
                <div className="mb-4">
                  <h3
                    className="font-semibold text-xs mb-1"
                    style={{
                      lineHeight: `${LINE_HEIGHT}px`,
                      color: selectedSkin.id === "dark" ? "hsl(210, 40%, 80%)" : "hsl(222, 47%, 30%)",
                    }}
                  >
                    Gratitude
                  </h3>
                  <p
                    className="text-[11px] italic mb-1 opacity-70"
                    style={{
                      lineHeight: `${LINE_HEIGHT}px`,
                      color: selectedSkin.id === "dark" ? "hsl(210, 40%, 70%)" : "hsl(222, 30%, 50%)",
                    }}
                  >
                    {prompts.gratitude}
                  </p>
                  {renderInputArea(dailyGratitude, onGratitudeChange, "1. I'm grateful for...", "gratitude")}
                </div>

                {/* Kindness Section */}
                <div className="mb-4">
                  <h3
                    className="font-semibold text-xs mb-1"
                    style={{
                      lineHeight: `${LINE_HEIGHT}px`,
                      color: selectedSkin.id === "dark" ? "hsl(210, 40%, 80%)" : "hsl(222, 47%, 30%)",
                    }}
                  >
                    Kindness
                  </h3>
                  <p
                    className="text-[11px] italic mb-1 opacity-70"
                    style={{
                      lineHeight: `${LINE_HEIGHT}px`,
                      color: selectedSkin.id === "dark" ? "hsl(210, 40%, 70%)" : "hsl(222, 30%, 50%)",
                    }}
                  >
                    {prompts.kindness}
                  </p>
                  {renderInputArea(dailyKindness, onKindnessChange, "Today I...", "kindness")}
                </div>

                {/* Inserted Images */}
                {images.map((img) => (
                  <div key={img.id} className="relative my-3 group">
                    <img
                      src={img.src}
                      alt="Journal attachment"
                      className="max-w-full rounded shadow-sm"
                      style={{ maxHeight: "150px" }}
                    />
                    <button
                      onClick={() => removeImage(img.id)}
                      className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Bottom Toolbar - Fixed at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-center justify-between"
          style={{
            backgroundColor: selectedSkin.id === "dark" ? "hsl(222, 47%, 15%)" : "hsl(0, 0%, 97%)",
            borderTop: `1px solid ${selectedSkin.lineColor}`,
          }}
        >
          <div className="flex gap-1">
            <Button
              variant={inputMode === "type" ? "default" : "ghost"}
              size="sm"
              onClick={() => setInputMode("type")}
              className="h-7 w-7 p-0"
            >
              <Type className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={inputMode === "voice" ? "default" : "ghost"}
              size="sm"
              onClick={() => setInputMode("voice")}
              className="h-7 w-7 p-0"
            >
              <Mic className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={inputMode === "scribble" ? "default" : "ghost"}
              size="sm"
              onClick={() => setInputMode("scribble")}
              className="h-7 w-7 p-0"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>

            {/* Image Insert */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageInsert}
              accept="image/*"
              className="hidden"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-7 w-7 p-0"
            >
              <Image className="h-3.5 w-3.5" />
            </Button>

            {/* Skin & Prompts Settings */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <Settings className="h-3.5 w-3.5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Journal Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Skin Selection */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Page Skin</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {DIARY_SKINS.map((skin) => (
                        <button
                          key={skin.id}
                          onClick={() => setSelectedSkin(skin)}
                          className={cn(
                            "p-2 rounded-lg border-2 transition-all text-xs",
                            selectedSkin.id === skin.id
                              ? "border-primary"
                              : "border-transparent hover:border-muted"
                          )}
                          style={{ backgroundColor: skin.bg }}
                        >
                          <div
                            className="h-8 rounded mb-1"
                            style={{
                              backgroundImage: `linear-gradient(${skin.lineColor} 1px, transparent 1px)`,
                              backgroundSize: "100% 8px",
                            }}
                          />
                          <span
                            style={{
                              color: skin.id === "dark" ? "hsl(210, 40%, 90%)" : "hsl(222, 47%, 20%)",
                            }}
                          >
                            {skin.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Prompts */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Customize Prompts</Label>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Feelings Prompt</Label>
                        <Input
                          value={prompts.feeling}
                          onChange={(e) => setPrompts({ ...prompts, feeling: e.target.value })}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Gratitude Prompt</Label>
                        <Input
                          value={prompts.gratitude}
                          onChange={(e) => setPrompts({ ...prompts, gratitude: e.target.value })}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Kindness Prompt</Label>
                        <Input
                          value={prompts.kindness}
                          onChange={(e) => setPrompts({ ...prompts, kindness: e.target.value })}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Button onClick={onSave} disabled={saving} size="sm" className="h-7 text-xs px-3">
            {saving ? "Saving..." : hasEntry ? "Update" : "Save"}
          </Button>
        </div>
      </div>

      {/* Page flip animation keyframes */}
      <style>{`
        @keyframes flip-left {
          0% { transform: perspective(1000px) rotateY(0deg); }
          50% { transform: perspective(1000px) rotateY(-15deg); }
          100% { transform: perspective(1000px) rotateY(0deg); }
        }
        @keyframes flip-right {
          0% { transform: perspective(1000px) rotateY(0deg); }
          50% { transform: perspective(1000px) rotateY(15deg); }
          100% { transform: perspective(1000px) rotateY(0deg); }
        }
      `}</style>
    </div>
  );
}
