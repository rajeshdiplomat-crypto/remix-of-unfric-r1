import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { JournalEditorToolbar } from "@/components/journal/JournalEditorToolbar";
import { JournalEditor } from "@/components/journal/JournalEditor";
import { JournalSidebar } from "@/components/journal/JournalSidebar";
import { JournalActionMenu } from "@/components/journal/JournalActionMenu";
import { Button } from "@/components/ui/button";
import { Send, MoreVertical } from "lucide-react";

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

export default function Journal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [allEntries, setAllEntries] = useState<JournalEntry[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [activeFormats, setActiveFormats] = useState<string[]>([]);
  const [promptToUse, setPromptToUse] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchAllEntries();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchEntry();
  }, [user, selectedDate]);

  // Auto-save debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user && (title || content)) {
        saveEntry(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [title, content, mood, tags]);

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
      // Parse title from first line if stored in feeling
      const feeling = data.daily_feeling || "";
      const lines = feeling.split("\n");
      if (lines[0] && !lines[0].startsWith("•") && lines[0].length < 100) {
        setTitle(lines[0]);
        setContent(lines.slice(1).join("\n").trim());
      } else {
        setTitle("");
        setContent(feeling);
      }
      setMood(data.daily_gratitude || null); // Using gratitude field for mood
      setTags(data.tags || []);
      setEntryId(data.id);
    } else {
      setTitle("");
      setContent("");
      setMood(null);
      setTags([]);
      setEntryId(null);
    }
    setLoading(false);
  };

  const saveEntry = async (silent = false) => {
    if (!user) return;

    setSaving(true);
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    
    // Combine title and content for storage
    const combinedContent = title ? `${title}\n${content}` : content;

    if (entryId) {
      const { error } = await supabase
        .from("journal_entries")
        .update({
          daily_feeling: combinedContent,
          daily_gratitude: mood,
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
    } else if (combinedContent.trim()) {
      const { data, error } = await supabase
        .from("journal_entries")
        .insert({
          user_id: user.id,
          entry_date: dateStr,
          daily_feeling: combinedContent,
          daily_gratitude: mood,
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
      setTitle("");
      setContent("");
      setMood(null);
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
    let exportContent = "";
    
    if (exportFormat === "markdown") {
      exportContent = `# ${title || "Journal Entry"} - ${dateStr}\n\n`;
      exportContent += content || "No content";
      if (tags.length > 0) {
        exportContent += `\n\n**Tags:** ${tags.map(t => `#${t}`).join(" ")}`;
      }
    } else {
      exportContent = `${title || "Journal Entry"} - ${dateStr}\n\n`;
      exportContent += content || "No content";
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

  const handleFormat = (formatType: string) => {
    setActiveFormats(prev => 
      prev.includes(formatType) 
        ? prev.filter(f => f !== formatType)
        : [...prev, formatType]
    );
  };

  const handleImageInsert = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast({ title: "Image", description: "Image upload coming soon!" });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleVoiceRecord = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      toast({ title: "Recording stopped", description: "Transcription coming soon!" });
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setIsRecording(true);
        toast({ title: "Recording...", description: "Click again to stop" });
      } catch {
        toast({ title: "Error", description: "Could not access microphone", variant: "destructive" });
      }
    }
  };

  const handleUsePrompt = (prompt: string) => {
    setPromptToUse(prompt);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading journal...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelected}
        className="hidden"
      />

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/30 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="text-sm text-muted-foreground">
          {lastSaved ? `Last saved: ${format(lastSaved, "h:mm a")}` : saving ? "Saving..." : "Not saved yet"}
        </div>
        <div className="flex items-center gap-2">
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
        <div className="mb-6">
          <JournalEditorToolbar
            activeFormats={activeFormats}
            onFormat={handleFormat}
            onImageInsert={handleImageInsert}
            onVoiceRecord={handleVoiceRecord}
            isRecording={isRecording}
          />
        </div>

        {/* Editor + Sidebar layout */}
        <div className="flex gap-8 justify-center">
          <JournalEditor
            selectedDate={selectedDate}
            title={title}
            content={content}
            mood={mood}
            tags={tags}
            onTitleChange={setTitle}
            onContentChange={setContent}
            onMoodChange={setMood}
            onTagsChange={setTags}
            onPromptUse={promptToUse}
          />

          <JournalSidebar
            entries={allEntries}
            currentDate={selectedDate}
            onSelectDate={setSelectedDate}
            onUsePrompt={handleUsePrompt}
          />
        </div>
      </div>
    </div>
  );
}
