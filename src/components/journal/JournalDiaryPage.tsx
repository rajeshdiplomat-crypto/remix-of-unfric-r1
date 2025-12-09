import { useState, useRef, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Type, Mic, MicOff, Pencil, Image, Settings, X, Move } from "lucide-react";
import { JournalScribbleCanvas } from "./JournalScribbleCanvas";
import { JournalSettingsDialog, DIARY_SKINS, JournalSettings, DiarySkin } from "./JournalSettingsDialog";
import { JournalTextToolbar, TextFormatting } from "./JournalTextToolbar";
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

interface InsertedImage {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  section: "feeling" | "gratitude" | "kindness" | "general";
}

// Line height for proper diary alignment
const LINE_HEIGHT = 24;
const TOP_MARGIN = 48;
const LEFT_MARGIN = 60;

// Page size ratios
const PAGE_SIZES = {
  a5: { ratio: 148 / 210, maxWidth: 420 },
  a4: { ratio: 210 / 297, maxWidth: 500 },
  letter: { ratio: 8.5 / 11, maxWidth: 480 },
  custom: { ratio: 1 / 1.4, maxWidth: 450 },
};

const defaultSectionSettings = (header: string, prompt: string) => ({
  header,
  prompts: [prompt],
  headerStyle: {
    fontSize: 12,
    bold: true,
    italic: false,
    underline: false,
    color: "default",
  },
  promptStyle: {
    fontSize: 11,
    bold: false,
    italic: true,
    underline: false,
    color: "default",
  },
});

const defaultSettings: JournalSettings = {
  skin: DIARY_SKINS[0],
  pageSize: "a5",
  zoom: 100,
  sections: {
    feeling: defaultSectionSettings("My Feelings", "How are you feeling today? What emotions came up?"),
    gratitude: defaultSectionSettings("Gratitude", "What are you grateful for today? List 3 things."),
    kindness: defaultSectionSettings("Kindness", "What act of kindness did you do or receive today?"),
  },
};

const defaultTextFormatting: TextFormatting = {
  fontSize: 12,
  fontFamily: "serif",
  bold: false,
  italic: false,
  underline: false,
  color: "hsl(222, 47%, 11%)",
  alignment: "left",
};

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
  const [pageFlip, setPageFlip] = useState<"none" | "left" | "right">("none");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<JournalSettings>(defaultSettings);
  const [textFormatting, setTextFormatting] = useState<TextFormatting>(defaultTextFormatting);
  const [images, setImages] = useState<InsertedImage[]>([]);
  const [draggingImage, setDraggingImage] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  const dayName = format(selectedDate, "EEEE").toUpperCase();
  const dayNumber = format(selectedDate, "d");
  const monthName = format(selectedDate, "MMMM").toUpperCase();
  const year = format(selectedDate, "yyyy");

  const selectedSkin = settings.skin;
  const pageSize = PAGE_SIZES[settings.pageSize];
  const zoomScale = settings.zoom / 100;

  // Update text color based on skin
  useEffect(() => {
    if (selectedSkin.id === "dark") {
      setTextFormatting((prev) => ({
        ...prev,
        color: "hsl(210, 40%, 96%)",
      }));
    } else {
      setTextFormatting((prev) => ({
        ...prev,
        color: "hsl(222, 47%, 11%)",
      }));
    }
  }, [selectedSkin.id]);

  // Page flip animation handler
  const handleNavigate = (direction: "prev" | "next") => {
    setPageFlip(direction === "prev" ? "left" : "right");
    setTimeout(() => {
      onNavigate(direction);
      setPageFlip("none");
    }, 400);
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
        const newImage: InsertedImage = {
          id: Date.now().toString(),
          src: event.target?.result as string,
          x: 70,
          y: 100,
          width: 120,
          section: activeField,
        };
        setImages([...images, newImage]);
        toast({ title: "Image added!", description: "Drag to position it on the page" });
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (id: string) => {
    setImages(images.filter((img) => img.id !== id));
  };

  // Image drag handling
  const handleImageDragStart = (id: string) => {
    setDraggingImage(id);
  };

  const handleImageDrag = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!draggingImage || !pageRef.current) return;

      const pageRect = pageRef.current.getBoundingClientRect();
      let clientX: number, clientY: number;

      if ("touches" in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const x = Math.max(LEFT_MARGIN, Math.min(clientX - pageRect.left, pageRect.width - 50));
      const y = Math.max(TOP_MARGIN, Math.min(clientY - pageRect.top, pageRect.height - 50));

      setImages((prev) =>
        prev.map((img) =>
          img.id === draggingImage ? { ...img, x, y } : img
        )
      );
    },
    [draggingImage]
  );

  const handleImageDragEnd = () => {
    setDraggingImage(null);
  };

  // Calculate text area height based on content
  const calculateTextHeight = (text: string) => {
    const lines = text.split("\n").length;
    const charLines = Math.ceil(text.length / 40);
    return Math.max(lines, charLines, 2) * LINE_HEIGHT;
  };

  // Get style for section header
  const getHeaderStyle = (section: "feeling" | "gratitude" | "kindness") => {
    const style = settings.sections[section].headerStyle;
    const color =
      style.color === "default"
        ? selectedSkin.id === "dark"
          ? "hsl(210, 40%, 80%)"
          : "hsl(222, 47%, 30%)"
        : style.color;

    return {
      fontSize: `${style.fontSize}px`,
      fontWeight: style.bold ? "bold" : "600",
      fontStyle: style.italic ? "italic" : "normal",
      textDecoration: style.underline ? "underline" : "none",
      color,
      lineHeight: `${LINE_HEIGHT}px`,
    };
  };

  // Get style for prompts
  const getPromptStyle = (section: "feeling" | "gratitude" | "kindness") => {
    const style = settings.sections[section].promptStyle;
    const color =
      style.color === "default"
        ? selectedSkin.id === "dark"
          ? "hsl(210, 40%, 70%)"
          : "hsl(222, 30%, 50%)"
        : style.color;

    return {
      fontSize: `${style.fontSize}px`,
      fontWeight: style.bold ? "bold" : "normal",
      fontStyle: style.italic ? "italic" : "normal",
      textDecoration: style.underline ? "underline" : "none",
      color,
      lineHeight: `${LINE_HEIGHT}px`,
      opacity: 0.8,
    };
  };

  // Get textarea style from formatting
  const getTextareaStyle = () => ({
    fontSize: `${textFormatting.fontSize}px`,
    fontFamily: textFormatting.fontFamily,
    fontWeight: textFormatting.bold ? "bold" : "normal",
    fontStyle: textFormatting.italic ? "italic" : "normal",
    textDecoration: textFormatting.underline ? "underline" : "none",
    color: textFormatting.color,
    textAlign: textFormatting.alignment as React.CSSProperties["textAlign"],
    lineHeight: `${LINE_HEIGHT}px`,
    minHeight: `${LINE_HEIGHT * 2}px`,
  });

  const renderInputArea = (
    value: string,
    onChange: (val: string) => void,
    placeholder: string,
    field: "feeling" | "gratitude" | "kindness"
  ) => {
    const baseTextareaClass =
      "w-full resize-none bg-transparent border-0 focus:outline-none focus:ring-0 p-0 overflow-hidden";

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
            onFocus={() => setActiveField(field)}
            placeholder={placeholder}
            className={baseTextareaClass}
            style={{
              ...getTextareaStyle(),
              height: `${calculateTextHeight(value)}px`,
            }}
          />
        </div>
      );
    }

    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setActiveField(field)}
        placeholder={placeholder}
        className={baseTextareaClass}
        style={{
          ...getTextareaStyle(),
          height: `${calculateTextHeight(value)}px`,
        }}
      />
    );
  };

  // Get background style for skin
  const getBackgroundStyle = () => {
    const skin = selectedSkin;
    if (skin.lineStyle === "blank") {
      return {};
    }
    if (skin.lineStyle === "grid") {
      return {
        backgroundImage: `
          linear-gradient(${skin.lineColor} 1px, transparent 1px),
          linear-gradient(90deg, ${skin.lineColor} 1px, transparent 1px)
        `,
        backgroundSize: `${LINE_HEIGHT}px ${LINE_HEIGHT}px`,
        backgroundPosition: `${LEFT_MARGIN}px ${TOP_MARGIN}px`,
      };
    }
    if (skin.lineStyle === "dotted") {
      return {
        backgroundImage: `radial-gradient(circle, ${skin.lineColor} 1px, transparent 1px)`,
        backgroundSize: `${LINE_HEIGHT}px ${LINE_HEIGHT}px`,
        backgroundPosition: `${LEFT_MARGIN}px ${TOP_MARGIN}px`,
      };
    }
    // Default lined
    return {
      backgroundImage: `linear-gradient(${skin.lineColor} 1px, transparent 1px)`,
      backgroundSize: `100% ${LINE_HEIGHT}px`,
      backgroundPosition: `0 ${TOP_MARGIN}px`,
    };
  };

  const renderSection = (
    section: "feeling" | "gratitude" | "kindness",
    value: string,
    onChange: (val: string) => void,
    placeholder: string
  ) => {
    const sectionSettings = settings.sections[section];

    return (
      <div className="mb-4">
        <h3 style={getHeaderStyle(section)} className="mb-1">
          {sectionSettings.header}
        </h3>
        {sectionSettings.prompts.map((prompt, index) => (
          <p key={index} style={getPromptStyle(section)} className="mb-1">
            {prompt}
          </p>
        ))}
        {renderInputArea(value, onChange, placeholder, section)}
      </div>
    );
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

      {/* Text Formatting Toolbar - Only show in type mode */}
      {inputMode === "type" && (
        <div className="mb-3">
          <JournalTextToolbar
            formatting={textFormatting}
            onChange={setTextFormatting}
            skinBgColor={selectedSkin.bg}
          />
        </div>
      )}

      {/* Diary Page Container with zoom */}
      <div
        className="flex justify-center"
        style={{ transform: `scale(${zoomScale})`, transformOrigin: "top center" }}
      >
        {/* Diary Page */}
        <div
          ref={pageRef}
          className={cn(
            "relative shadow-2xl overflow-hidden transition-all duration-500",
            pageFlip === "left" && "animate-page-flip-left",
            pageFlip === "right" && "animate-page-flip-right"
          )}
          style={{
            width: "100%",
            maxWidth: `${pageSize.maxWidth}px`,
            aspectRatio: pageSize.ratio.toString(),
            backgroundColor: selectedSkin.bg,
            borderRadius: "4px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15), inset 0 0 60px rgba(0,0,0,0.03)",
            transformStyle: "preserve-3d",
          }}
          onMouseMove={draggingImage ? handleImageDrag : undefined}
          onMouseUp={handleImageDragEnd}
          onMouseLeave={handleImageDragEnd}
          onTouchMove={draggingImage ? handleImageDrag : undefined}
          onTouchEnd={handleImageDragEnd}
        >
          {/* Background pattern */}
          <div className="absolute inset-0" style={getBackgroundStyle()} />

          {/* Red margin line */}
          {selectedSkin.lineStyle !== "blank" && (
            <div
              className="absolute top-0 bottom-0"
              style={{
                left: `${LEFT_MARGIN}px`,
                width: "1px",
                backgroundColor: selectedSkin.marginColor,
              }}
            />
          )}

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

            {/* Content area */}
            <div className="flex-1 overflow-y-auto pb-16 relative">
              {/* Sections - Always visible regardless of mode */}
              {renderSection("feeling", dailyFeeling, onFeelingChange, "Today I felt...")}
              {renderSection("gratitude", dailyGratitude, onGratitudeChange, "1. I'm grateful for...")}
              {renderSection("kindness", dailyKindness, onKindnessChange, "Today I...")}

              {/* Scribble Canvas Overlay when in scribble mode */}
              {inputMode === "scribble" && (
                <div className="absolute inset-0 z-10">
                  <JournalScribbleCanvas
                    height={600}
                    bgColor="transparent"
                    lineColor="transparent"
                    lineHeight={LINE_HEIGHT}
                  />
                </div>
              )}

              {/* Draggable Images */}
              {images.map((img) => (
                <div
                  key={img.id}
                  className={cn(
                    "absolute group cursor-move",
                    draggingImage === img.id && "opacity-75"
                  )}
                  style={{
                    left: img.x,
                    top: img.y,
                    width: img.width,
                    zIndex: draggingImage === img.id ? 100 : 20,
                  }}
                  onMouseDown={() => handleImageDragStart(img.id)}
                  onTouchStart={() => handleImageDragStart(img.id)}
                >
                  <img
                    src={img.src}
                    alt="Journal attachment"
                    className="w-full rounded shadow-sm pointer-events-none"
                    draggable={false}
                  />
                  <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(img.id);
                      }}
                      className="p-1 bg-destructive text-destructive-foreground rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="absolute -bottom-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Move className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Toolbar */}
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

              {/* Settings */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSettingsOpen(true)}
                className="h-7 w-7 p-0"
              >
                <Settings className="h-3.5 w-3.5" />
              </Button>
            </div>

            <Button onClick={onSave} disabled={saving} size="sm" className="h-7 text-xs px-3">
              {saving ? "Saving..." : hasEntry ? "Update" : "Save"}
            </Button>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <JournalSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSave={setSettings}
      />

      {/* Page flip animation styles */}
      <style>{`
        @keyframes page-flip-left {
          0% { transform: perspective(1500px) rotateY(0deg); }
          25% { transform: perspective(1500px) rotateY(-5deg) translateX(-2%); }
          50% { transform: perspective(1500px) rotateY(-25deg) translateX(-5%); box-shadow: 20px 0 60px rgba(0,0,0,0.3); }
          75% { transform: perspective(1500px) rotateY(-5deg) translateX(-2%); }
          100% { transform: perspective(1500px) rotateY(0deg); }
        }
        @keyframes page-flip-right {
          0% { transform: perspective(1500px) rotateY(0deg); }
          25% { transform: perspective(1500px) rotateY(5deg) translateX(2%); }
          50% { transform: perspective(1500px) rotateY(25deg) translateX(5%); box-shadow: -20px 0 60px rgba(0,0,0,0.3); }
          75% { transform: perspective(1500px) rotateY(5deg) translateX(2%); }
          100% { transform: perspective(1500px) rotateY(0deg); }
        }
        .animate-page-flip-left {
          animation: page-flip-left 0.5s ease-in-out;
        }
        .animate-page-flip-right {
          animation: page-flip-right 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
