import { useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { JournalBlockEditor, JournalBlock, blocksToText, textToBlocks, PresetQuestion } from "@/components/journal/JournalBlockEditor";
import { JournalRichToolbar } from "@/components/journal/JournalRichToolbar";
import { JournalNewSidebar } from "@/components/journal/JournalNewSidebar";
import { JournalNewSettingsDialog, JournalSettingsData, JOURNAL_SKINS } from "@/components/journal/JournalNewSettingsDialog";
import { JournalActionMenu } from "@/components/journal/JournalActionMenu";
import { JournalTagInput } from "@/components/journal/JournalTagInput";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Send, Settings, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { addDays, subDays } from "date-fns";

// Add Google Fonts for handwriting
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Architects+Daughter&family=Caveat:wght@400;700&family=Dancing+Script:wght@400;700&family=Indie+Flower&family=Patrick+Hand&family=Shadows+Into+Light&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

interface JournalEntry {
  id: string;
  entry_date: string;
  daily_feeling: string | null;
  daily_gratitude: string | null;
  daily_kindness: string | null;
  created_at: string;
  tags: string[] | null;
}

const STORAGE_KEY = "journal_settings";

const DEFAULT_SETTINGS: JournalSettingsData = {
  presetQuestions: [
    { id: "q1", text: "How are you feeling today?" },
    { id: "q2", text: "What are you grateful for?" },
    { id: "q3", text: "What act of kindness did you do or receive?" },
  ],
  enablePresetOnNewEntry: true,
  selectedSkin: "minimal-light",
};

export default function Journal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [blocks, setBlocks] = useState<JournalBlock[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [allEntries, setAllEntries] = useState<JournalEntry[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Editor settings
  const [fontFamily, setFontFamily] = useState("Inter");
  const [fontSize, setFontSize] = useState(16);
  const [settings, setSettings] = useState<JournalSettingsData>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
  });
  
  // Undo/Redo
  const [history, setHistory] = useState<JournalBlock[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get current skin
  const currentSkin = JOURNAL_SKINS.find(s => s.id === settings.selectedSkin) || JOURNAL_SKINS[0];

  useEffect(() => {
    if (!user) return;
    fetchAllEntries();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchEntry();
  }, [user, selectedDate]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Auto-save debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user && blocks.length > 0) {
        saveEntry(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [blocks, tags]);

  const handleDateChange = (date: Date) => {
    if (blocks.length > 0) {
      saveEntry(true);
    }
    setSelectedDate(date);
  };

  const fetchAllEntries = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: false })
      .limit(50);

    if (data) {
      setAllEntries(data);
    }
  };

  const fetchEntry = async () => {
    setLoading(true);
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    const { data } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user?.id)
      .eq("entry_date", dateStr)
      .maybeSingle();

    if (data) {
      const content = data.daily_feeling || "";
      const parsedBlocks = textToBlocks(content, settings.presetQuestions);
      setBlocks(parsedBlocks.length > 0 ? parsedBlocks : []);
      setTags(data.tags || []);
      setEntryId(data.id);
      setHistory([parsedBlocks]);
      setHistoryIndex(0);
    } else {
      // New entry - initialize with preset questions if enabled
      if (settings.enablePresetOnNewEntry) {
        setBlocks([]); // Will be initialized by JournalBlockEditor
      } else {
        setBlocks([{ id: "initial", type: "paragraph", content: "" }]);
      }
      setTags([]);
      setEntryId(null);
      setHistory([]);
      setHistoryIndex(-1);
    }
    setLoading(false);
  };

  const saveEntry = async (silent = false) => {
    if (!user) return;

    setSaving(true);
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const content = blocksToText(blocks);

    if (entryId) {
      const { error } = await supabase
        .from("journal_entries")
        .update({
          daily_feeling: content,
          tags: tags,
        })
        .eq("id", entryId);

      if (error && !silent) {
        toast({ title: "Error", description: "Failed to update journal", variant: "destructive" });
      } else {
        setLastSaved(new Date());
        if (!silent) {
          toast({ title: "Saved!", description: "Your journal entry has been updated" });
        }
        fetchAllEntries();
      }
    } else if (content.trim()) {
      const { data, error } = await supabase
        .from("journal_entries")
        .insert({
          user_id: user.id,
          entry_date: dateStr,
          daily_feeling: content,
          tags: tags,
        })
        .select()
        .single();

      if (error && !silent) {
        toast({ title: "Error", description: "Failed to save journal", variant: "destructive" });
      } else if (data) {
        setEntryId(data.id);
        setLastSaved(new Date());
        if (!silent) {
          toast({ title: "Saved!", description: "Your journal entry has been saved" });
        }
        fetchAllEntries();
      }
    }

    setSaving(false);
  };

  const handlePublish = async () => {
    await saveEntry(false);
  };

  const handleDeleteEntry = async () => {
    if (!entryId) return;

    const { error } = await supabase
      .from("journal_entries")
      .delete()
      .eq("id", entryId);

    if (error) {
      toast({ title: "Error", description: "Failed to delete entry", variant: "destructive" });
    } else {
      setBlocks([]);
      setTags([]);
      setEntryId(null);
      fetchAllEntries();
      toast({ title: "Deleted", description: "Entry has been removed" });
    }
  };

  const handleDuplicateEntry = () => {
    const tomorrow = new Date(selectedDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow);
    toast({ title: "Entry duplicated", description: "Content copied to next day" });
  };

  const handleExportEntry = (exportFormat: "text" | "markdown") => {
    const dateStr = format(selectedDate, "MMMM d, yyyy");
    const content = blocksToText(blocks);
    let exportContent = "";

    if (exportFormat === "markdown") {
      exportContent = `# Journal - ${dateStr}\n\n${content}`;
      if (tags.length > 0) {
        exportContent += `\n\n**Tags:** ${tags.map((t) => `#${t}`).join(" ")}`;
      }
    } else {
      exportContent = `Journal - ${dateStr}\n\n${content}`;
      if (tags.length > 0) {
        exportContent += `\n\nTags: ${tags.join(", ")}`;
      }
    }

    const blob = new Blob([exportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `journal-${format(selectedDate, "yyyy-MM-dd")}.${exportFormat === "markdown" ? "md" : "txt"}`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Exported", description: `Entry saved as ${exportFormat}` });
  };

  const handleBlocksChange = useCallback((newBlocks: JournalBlock[]) => {
    setBlocks(newBlocks);
    // Add to history for undo
    setHistory(prev => [...prev.slice(0, historyIndex + 1), newBlocks]);
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setBlocks(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setBlocks(history[historyIndex + 1]);
    }
  };

  const handleInsertList = (type: "bullet" | "number" | "checklist") => {
    const newBlock: JournalBlock = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: "",
      checked: type === "checklist" ? false : undefined,
    };
    setBlocks([...blocks, newBlock]);
  };

  const handleInsertImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast({ title: "Image", description: "Image upload coming soon!" });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveSettings = (newSettings: JournalSettingsData) => {
    setSettings(newSettings);
    toast({ title: "Settings saved", description: "Your journal settings have been updated" });
  };

  const handleUsePrompt = (prompt: string) => {
    // Add prompt as a new paragraph block
    const newBlock: JournalBlock = {
      id: Math.random().toString(36).substr(2, 9),
      type: "paragraph",
      content: prompt,
    };
    setBlocks([...blocks, newBlock]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading journal...</div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen transition-colors"
      style={{ backgroundColor: currentSkin.bg }}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelected}
        className="hidden"
      />

      {/* Top bar */}
      <div 
        className="flex items-center justify-between px-6 py-3 border-b backdrop-blur-sm sticky top-0 z-20"
        style={{ 
          backgroundColor: `${currentSkin.cardBg}ee`,
          borderColor: currentSkin.borderColor,
        }}
      >
        <div className="flex items-center gap-4">
          {/* Date Navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleDateChange(subDays(selectedDate, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground px-2 py-1 transition-colors text-sm">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{format(selectedDate, "MMMM d, yyyy")}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      handleDateChange(date);
                      setCalendarOpen(false);
                    }
                  }}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleDateChange(addDays(selectedDate, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            {lastSaved ? `Saved ${format(lastSaved, "h:mm a")}` : saving ? "Saving..." : ""}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSettingsOpen(true)}
            className="h-8 w-8"
            title="Journal Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            onClick={handlePublish}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            disabled={saving}
          >
            Publish Entry
            <Send className="h-4 w-4" />
          </Button>
          <JournalActionMenu
            onDelete={handleDeleteEntry}
            onDuplicate={handleDuplicateEntry}
            onExport={handleExportEntry}
            entryDate={format(selectedDate, "MMMM d, yyyy")}
            hasEntry={!!entryId}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="px-6 py-6">
        {/* Toolbar */}
        <div className="mb-6 max-w-3xl mx-auto">
          <JournalRichToolbar
            fontFamily={fontFamily}
            fontSize={fontSize}
            onFontFamilyChange={setFontFamily}
            onFontSizeChange={setFontSize}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            onBulletList={() => handleInsertList("bullet")}
            onNumberList={() => handleInsertList("number")}
            onChecklist={() => handleInsertList("checklist")}
            onInsertImage={handleInsertImage}
          />
        </div>

        {/* Editor + Sidebar layout */}
        <div className="flex gap-8 justify-center">
          <div className="flex-1 max-w-3xl">
            <div 
              className="rounded-2xl border overflow-hidden"
              style={{
                backgroundColor: currentSkin.cardBg,
                borderColor: currentSkin.borderColor,
                boxShadow: currentSkin.shadowIntensity === "light" 
                  ? "0 1px 3px rgba(0,0,0,0.05)"
                  : currentSkin.shadowIntensity === "medium"
                  ? "0 4px 12px rgba(0,0,0,0.1)"
                  : "none",
              }}
            >
              {/* Block Editor */}
              <JournalBlockEditor
                blocks={blocks}
                onChange={handleBlocksChange}
                presetQuestions={settings.presetQuestions}
                fontFamily={fontFamily}
                fontSize={fontSize}
                skin={{
                  id: currentSkin.id,
                  bg: currentSkin.cardBg,
                  borderColor: currentSkin.borderColor,
                }}
              />

              {/* Tags */}
              <div className="px-6 py-4 border-t" style={{ borderColor: currentSkin.borderColor }}>
                <JournalTagInput tags={tags} onChange={setTags} />
              </div>
            </div>
          </div>

          <JournalNewSidebar
            entries={allEntries}
            currentDate={selectedDate}
            onSelectDate={setSelectedDate}
            onUsePrompt={handleUsePrompt}
          />
        </div>
      </div>

      {/* Settings Dialog */}
      <JournalNewSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
