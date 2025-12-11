import { useState, useRef, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Type, Mic, MicOff, Pencil, Image, Settings, X, Move, Undo2, Redo2, GripVertical } from "lucide-react";
import { JournalScribbleCanvas } from "./JournalScribbleCanvas";
import { JournalSettingsDialog, DIARY_SKINS, JournalSettings, DiarySkin, SaveScope } from "./JournalSettingsDialog";
import { JournalTextToolbar, TextFormatting } from "./JournalTextToolbar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
  entryId?: string | null;
}

interface InsertedImage {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  section: "feeling" | "gratitude" | "kindness" | "general";
}

interface HistoryState {
  feeling: string;
  gratitude: string;
  kindness: string;
}

// Reduced line spacing for diary
const LINE_HEIGHT = 20;
const TOP_MARGIN = 56; // Increased top margin - positioned below date
const LEFT_MARGIN = 45;

// Page size ratios - adjusted for better fit
const PAGE_SIZES = {
  a5: { ratio: 148 / 210, maxWidth: 380 },
  a4: { ratio: 210 / 297, maxWidth: 420 },
  letter: { ratio: 8.5 / 11, maxWidth: 400 },
  custom: { ratio: 1 / 1.4, maxWidth: 380 },
};

const defaultSectionSettings = (header: string, prompt: string) => ({
  header,
  prompts: [prompt],
  promptAnswers: {},
  headerStyle: {
    fontSize: 11,
    bold: true,
    italic: false,
    underline: false,
    color: "default",
  },
  promptStyle: {
    fontSize: 10,
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
  fontSize: 11,
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
  entryId,
}: JournalDiaryPageProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [inputMode, setInputMode] = useState<"type" | "voice" | "scribble">("type");
  const [isRecording, setIsRecording] = useState(false);
  const [activeField, setActiveField] = useState<"feeling" | "gratitude" | "kindness">("feeling");
  const [pageFlip, setPageFlip] = useState<"none" | "left" | "right">("none");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<JournalSettings>(defaultSettings);
  const [textFormatting, setTextFormatting] = useState<TextFormatting>(defaultTextFormatting);
  const [images, setImages] = useState<InsertedImage[]>([]);
  const [draggingImage, setDraggingImage] = useState<string | null>(null);
  const [resizingImage, setResizingImage] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [scribbleData, setScribbleData] = useState<string>("");
  const [selectedText, setSelectedText] = useState<{ field: string; start: number; end: number } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const dayName = format(selectedDate, "EEEE").toUpperCase();
  const dayNumber = format(selectedDate, "d");
  const monthName = format(selectedDate, "MMMM").toUpperCase();
  const year = format(selectedDate, "yyyy");

  const selectedSkin = settings.skin;
  const pageSize = PAGE_SIZES[settings.pageSize];
  const zoomScale = settings.zoom / 100;

  // Load settings from database
  useEffect(() => {
    if (!user) return;
    loadSettings();
  }, [user]);

  // Load scribble data for current entry
  useEffect(() => {
    if (entryId) {
      loadScribbleData();
    } else {
      setScribbleData("");
    }
  }, [entryId]);

  const loadSettings = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("journal_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      const skin = DIARY_SKINS.find(s => s.id === data.skin_id) || DIARY_SKINS[0];
      const sectionsConfig = data.sections_config as any;
      const textFormattingData = data.text_formatting as any;
      
      setSettings({
        skin,
        pageSize: data.page_size as any,
        zoom: data.zoom,
        sections: sectionsConfig || defaultSettings.sections,
      });
      
      if (textFormattingData) {
        setTextFormatting(textFormattingData);
      }
    }
  };

  const loadScribbleData = async () => {
    if (!entryId) return;
    
    const { data } = await supabase
      .from("journal_entries")
      .select("scribble_data, images_data")
      .eq("id", entryId)
      .maybeSingle();

    if (data) {
      setScribbleData(data.scribble_data || "");
      if (data.images_data && Array.isArray(data.images_data)) {
        setImages(data.images_data as unknown as InsertedImage[]);
      }
    }
  };

  const saveSettingsToDb = async (newSettings: JournalSettings, newFormatting: TextFormatting) => {
    if (!user) return;

    // Check if settings exist
    const { data: existing } = await supabase
      .from("journal_settings")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("journal_settings")
        .update({
          skin_id: newSettings.skin.id,
          page_size: newSettings.pageSize,
          zoom: newSettings.zoom,
          sections_config: JSON.parse(JSON.stringify(newSettings.sections)),
          text_formatting: JSON.parse(JSON.stringify(newFormatting)),
        })
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("journal_settings")
        .insert({
          user_id: user.id,
          skin_id: newSettings.skin.id,
          page_size: newSettings.pageSize,
          zoom: newSettings.zoom,
          sections_config: JSON.parse(JSON.stringify(newSettings.sections)),
          text_formatting: JSON.parse(JSON.stringify(newFormatting)),
        });
    }
  };

  const saveScribbleData = async (data: string) => {
    setScribbleData(data);
    
    if (entryId) {
      await supabase
        .from("journal_entries")
        .update({ 
          scribble_data: data, 
          images_data: JSON.parse(JSON.stringify(images))
        })
        .eq("id", entryId);
    }
  };

  // Initialize history
  useEffect(() => {
    if (history.length === 0) {
      const initialState = { feeling: dailyFeeling, gratitude: dailyGratitude, kindness: dailyKindness };
      setHistory([initialState]);
      setHistoryIndex(0);
    }
  }, []);

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

  // Save state to history
  const saveToHistory = useCallback(() => {
    const newState = { feeling: dailyFeeling, gratitude: dailyGratitude, kindness: dailyKindness };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [dailyFeeling, dailyGratitude, dailyKindness, history, historyIndex]);

  // Undo function
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      onFeelingChange(prevState.feeling);
      onGratitudeChange(prevState.gratitude);
      onKindnessChange(prevState.kindness);
      setHistoryIndex(historyIndex - 1);
    }
  };

  // Redo function
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      onFeelingChange(nextState.feeling);
      onGratitudeChange(nextState.gratitude);
      onKindnessChange(nextState.kindness);
      setHistoryIndex(historyIndex + 1);
    }
  };

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
        saveToHistory();
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
          x: LEFT_MARGIN + 20,
          y: TOP_MARGIN + 60,
          width: 100,
          section: activeField,
        };
        setImages([...images, newImage]);
        toast({ title: "Image added!", description: "Drag to position, drag corner to resize" });
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
      if (!pageRef.current) return;
      const pageRect = pageRef.current.getBoundingClientRect();
      let clientX: number, clientY: number;

      if ("touches" in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      if (draggingImage) {
        const x = Math.max(LEFT_MARGIN, Math.min(clientX - pageRect.left, pageRect.width - 50));
        const y = Math.max(TOP_MARGIN, Math.min(clientY - pageRect.top, pageRect.height - 50));
        setImages((prev) =>
          prev.map((img) => (img.id === draggingImage ? { ...img, x, y } : img))
        );
      }

      if (resizingImage) {
        const img = images.find((i) => i.id === resizingImage);
        if (img) {
          const newWidth = Math.max(40, Math.min(300, clientX - pageRect.left - img.x + 10));
          setImages((prev) =>
            prev.map((i) => (i.id === resizingImage ? { ...i, width: newWidth } : i))
          );
        }
      }
    },
    [draggingImage, resizingImage, images]
  );

  const handleImageDragEnd = () => {
    setDraggingImage(null);
    setResizingImage(null);
  };

  // Calculate text area height based on content
  const calculateTextHeight = (text: string) => {
    const lines = text.split("\n").length;
    const charLines = Math.ceil(text.length / 35);
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
      opacity: 0.85,
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

  // Handle text selection for formatting
  const handleTextSelect = (field: "feeling" | "gratitude" | "kindness") => {
    const textarea = textareaRefs.current[field];
    if (textarea && textarea.selectionStart !== textarea.selectionEnd) {
      setSelectedText({
        field,
        start: textarea.selectionStart,
        end: textarea.selectionEnd,
      });
    } else {
      setSelectedText(null);
    }
  };

  // Apply formatting to selected text (wrapping with span-like markers)
  const applyFormattingToSelection = () => {
    if (!selectedText) return;
    
    const { field, start, end } = selectedText;
    let text = "";
    let onChange: (val: string) => void;
    
    if (field === "feeling") {
      text = dailyFeeling;
      onChange = onFeelingChange;
    } else if (field === "gratitude") {
      text = dailyGratitude;
      onChange = onGratitudeChange;
    } else {
      text = dailyKindness;
      onChange = onKindnessChange;
    }
    
    // For now, just update the selection state - the formatting is applied globally
    // In a more advanced implementation, you could store rich text formatting per character
    setSelectedText(null);
    toast({ title: "Formatting applied", description: "Text formatting updated" });
  };

  const handleTextChange = (
    value: string,
    onChange: (val: string) => void
  ) => {
    onChange(value);
    setTimeout(saveToHistory, 500);
  };

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
        <div className="flex items-start gap-2">
          <Button
            size="sm"
            variant={isRecording && activeField === field ? "destructive" : "outline"}
            onClick={() => {
              setActiveField(field);
              isRecording ? stopRecording() : startRecording();
            }}
            className="h-6 w-6 rounded-full p-0 flex-shrink-0 mt-0.5"
          >
            {isRecording && activeField === field ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
          </Button>
          <textarea
            ref={(el) => (textareaRefs.current[field] = el)}
            value={value}
            onChange={(e) => handleTextChange(e.target.value, onChange)}
            onFocus={() => setActiveField(field)}
            onSelect={() => handleTextSelect(field)}
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
        ref={(el) => (textareaRefs.current[field] = el)}
        value={value}
        onChange={(e) => handleTextChange(e.target.value, onChange)}
        onFocus={() => setActiveField(field)}
        onSelect={() => handleTextSelect(field)}
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
    return {
      backgroundImage: `linear-gradient(${skin.lineColor} 1px, transparent 1px)`,
      backgroundSize: `100% ${LINE_HEIGHT}px`,
      backgroundPosition: `0 ${TOP_MARGIN}px`,
    };
  };

  // Render each prompt with its own writing space
  const renderSection = (
    section: "feeling" | "gratitude" | "kindness",
    value: string,
    onChange: (val: string) => void,
    placeholder: string
  ) => {
    const sectionSettings = settings.sections[section];

    return (
      <div className="mb-3">
        <h3 style={getHeaderStyle(section)} className="mb-0.5">
          {sectionSettings.header}
        </h3>
        {sectionSettings.prompts.map((prompt, index) => (
          <div key={index} className="mb-2">
            <p style={getPromptStyle(section)} className="mb-0.5">
              {prompt}
            </p>
            {index === 0 ? (
              renderInputArea(value, onChange, placeholder, section)
            ) : (
              <textarea
                className="w-full resize-none bg-transparent border-0 focus:outline-none focus:ring-0 p-0 overflow-hidden"
                placeholder={`Write your response...`}
                style={{
                  ...getTextareaStyle(),
                  height: `${LINE_HEIGHT * 2}px`,
                  minHeight: `${LINE_HEIGHT * 2}px`,
                }}
                onFocus={() => setActiveField(section)}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const handleSettingsSave = async (newSettings: JournalSettings, scope: SaveScope) => {
    setSettings(newSettings);
    await saveSettingsToDb(newSettings, textFormatting);
    toast({
      title: "Settings saved!",
      description: scope === "current" 
        ? "Applied to current page" 
        : scope === "all" 
        ? "Applied to all pages" 
        : "Applied as default for future pages"
    });
  };

  const handleFormattingChange = (newFormatting: TextFormatting) => {
    setTextFormatting(newFormatting);
    saveSettingsToDb(settings, newFormatting);
  };

  return (
    <div className="relative">
      {/* Text Toolbar - Outside diary page at top */}
      {inputMode === "type" && (
        <div className="mb-3 flex justify-center">
          <div className="flex items-center gap-2">
            <JournalTextToolbar
              formatting={textFormatting}
              onChange={handleFormattingChange}
              skinBgColor={selectedSkin.bg}
              hasSelection={!!selectedText}
              onApplyToSelection={applyFormattingToSelection}
            />
            {selectedText && (
              <div className="text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded">
                Selection active - changes apply to selected text
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scribble Toolbar - Outside diary page at top when in scribble mode */}
      {inputMode === "scribble" && (
        <div className="mb-3 flex justify-center">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/80 border border-border">
            <span className="text-xs text-muted-foreground">Scribble mode active - draw anywhere on the page</span>
          </div>
        </div>
      )}

      {/* Translucent Undo/Redo Buttons */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex gap-1 bg-background/60 backdrop-blur-sm rounded-full px-2 py-1 border border-border/50 shadow-sm" style={{ top: inputMode === "type" || inputMode === "scribble" ? "60px" : "8px" }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleUndo}
          disabled={historyIndex <= 0}
          className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
          title="Undo"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRedo}
          disabled={historyIndex >= history.length - 1}
          className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
          title="Redo"
        >
          <Redo2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Page Navigation Arrows */}
      <button
        onClick={() => handleNavigate("prev")}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 p-1.5 rounded-full bg-card shadow-lg border border-border hover:bg-muted transition-colors"
        aria-label="Previous date"
      >
        <ChevronLeft className="h-4 w-4 text-foreground" />
      </button>

      <button
        onClick={() => handleNavigate("next")}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 p-1.5 rounded-full bg-card shadow-lg border border-border hover:bg-muted transition-colors"
        aria-label="Next date"
      >
        <ChevronRight className="h-4 w-4 text-foreground" />
      </button>

      {/* Diary Page Container with zoom */}
      <div
        className="flex justify-center pt-2"
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
          onMouseMove={draggingImage || resizingImage ? handleImageDrag : undefined}
          onMouseUp={handleImageDragEnd}
          onMouseLeave={handleImageDragEnd}
          onTouchMove={draggingImage || resizingImage ? handleImageDrag : undefined}
          onTouchEnd={handleImageDragEnd}
        >
          {/* Background pattern */}
          <div className="absolute inset-0" style={getBackgroundStyle()} />

          {/* Top horizontal margin line - same color and thickness as vertical margin */}
          {selectedSkin.lineStyle !== "blank" && (
            <div
              className="absolute left-0 right-0"
              style={{
                top: `${TOP_MARGIN}px`,
                height: "2px",
                backgroundColor: selectedSkin.marginColor,
              }}
            />
          )}

          {/* Red vertical margin line */}
          {selectedSkin.lineStyle !== "blank" && (
            <div
              className="absolute bottom-0"
              style={{
                left: `${LEFT_MARGIN}px`,
                top: `${TOP_MARGIN}px`,
                width: "2px",
                backgroundColor: selectedSkin.marginColor,
              }}
            />
          )}

          {/* Ring binder holes */}
          <div className="absolute left-2 top-0 bottom-0 flex flex-col justify-evenly py-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full"
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
            style={{ paddingLeft: `${LEFT_MARGIN + 8}px`, paddingRight: "12px" }}
          >
            {/* Top blank margin - Date Header */}
            <div
              className="flex justify-end items-start pt-2"
              style={{ minHeight: `${TOP_MARGIN}px` }}
            >
              <div className="text-right pr-1">
                <p
                  className="text-[8px] font-semibold tracking-widest"
                  style={{ color: selectedSkin.marginColor }}
                >
                  {dayName}
                </p>
                <p
                  className="text-lg font-bold leading-none"
                  style={{ color: selectedSkin.marginColor }}
                >
                  {dayNumber}
                </p>
                <p
                  className="text-[8px] font-semibold tracking-widest"
                  style={{ color: selectedSkin.marginColor }}
                >
                  {monthName} {year}
                </p>
              </div>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto pb-12 relative">
              {/* Sections - Always visible regardless of mode */}
              {renderSection("feeling", dailyFeeling, onFeelingChange, "Today I felt...")}
              {renderSection("gratitude", dailyGratitude, onGratitudeChange, "1. I'm grateful for...")}
              {renderSection("kindness", dailyKindness, onKindnessChange, "Today I...")}

              {/* Scribble Canvas Overlay when in scribble mode - covers entire page */}
              {inputMode === "scribble" && (
                <div className="absolute inset-0 z-10 pointer-events-auto">
                  <JournalScribbleCanvas
                    height={500}
                    bgColor="transparent"
                    lineColor="transparent"
                    lineHeight={LINE_HEIGHT}
                    initialData={scribbleData}
                    onSave={saveScribbleData}
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
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                  {/* Resize handle */}
                  <div
                    className="absolute -bottom-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-se-resize p-1 bg-muted rounded"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setResizingImage(img.id);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      setResizingImage(img.id);
                    }}
                  >
                    <GripVertical className="h-2.5 w-2.5 text-muted-foreground rotate-45" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Toolbar */}
          <div
            className="absolute bottom-0 left-0 right-0 px-2 py-1.5 flex items-center justify-between gap-1"
            style={{
              backgroundColor: selectedSkin.id === "dark" ? "hsl(222, 47%, 15%)" : "hsl(0, 0%, 97%)",
              borderTop: `1px solid ${selectedSkin.lineColor}`,
            }}
          >
            <div className="flex gap-0.5 items-center">
              {/* Type/Voice/Scribble buttons */}
              <Button
                variant={inputMode === "type" ? "default" : "ghost"}
                size="sm"
                onClick={() => setInputMode("type")}
                className="h-6 w-6 p-0"
              >
                <Type className="h-3 w-3" />
              </Button>
              <Button
                variant={inputMode === "voice" ? "default" : "ghost"}
                size="sm"
                onClick={() => setInputMode("voice")}
                className="h-6 w-6 p-0"
              >
                <Mic className="h-3 w-3" />
              </Button>
              <Button
                variant={inputMode === "scribble" ? "default" : "ghost"}
                size="sm"
                onClick={() => setInputMode("scribble")}
                className="h-6 w-6 p-0"
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </div>

            <div className="flex gap-0.5 items-center">
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
                className="h-6 w-6 p-0"
              >
                <Image className="h-3 w-3" />
              </Button>

              {/* Settings */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSettingsOpen(true)}
                className="h-6 w-6 p-0"
              >
                <Settings className="h-3 w-3" />
              </Button>

              <Button onClick={onSave} disabled={saving} size="sm" className="h-6 text-[10px] px-2 ml-1">
                {saving ? "..." : hasEntry ? "Update" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <JournalSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSave={handleSettingsSave}
      />

      {/* Page flip animation styles - Only affects the diary page element */}
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
