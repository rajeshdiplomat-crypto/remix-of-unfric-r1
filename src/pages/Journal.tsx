import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { Settings, Save, Check, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { JournalTiptapEditor, TiptapEditorRef } from "@/components/journal/JournalTiptapEditor";
import { JournalToolbar } from "@/components/journal/JournalToolbar";
import { JournalSidebarPanel } from "@/components/journal/JournalSidebarPanel";
import { JournalSettingsModal } from "@/components/journal/JournalSettingsModal";
import {
  JournalEntry,
  JournalTemplate,
  JOURNAL_SKINS,
  DEFAULT_TEMPLATE,
} from "@/components/journal/types";

const generateInitialContent = (questions: { text: string }[]) => {
  const content = {
    type: "doc",
    content: questions.flatMap((q) => [
      { type: "heading", attrs: { level: 2, textAlign: "left" }, content: [{ type: "text", text: q.text }] },
      { type: "paragraph", attrs: { textAlign: "left" }, content: [] },
    ]),
  };
  return JSON.stringify(content);
};

export default function Journal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const editorRef = useRef<TiptapEditorRef>(null);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [content, setContent] = useState("");
  const [isSaved, setIsSaved] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fontFamily, setFontFamily] = useState("Inter");
  const [fontSize, setFontSize] = useState(16);

  const [template, setTemplate] = useState<JournalTemplate>(() => {
    const saved = localStorage.getItem("journal_template");
    return saved ? JSON.parse(saved) : DEFAULT_TEMPLATE;
  });

  const [currentSkinId, setCurrentSkinId] = useState(() => {
    return localStorage.getItem("journal_skin_id") || "minimal-light";
  });

  const currentSkin = useMemo(
    () => JOURNAL_SKINS.find((s) => s.id === currentSkinId) || JOURNAL_SKINS[0],
    [currentSkinId]
  );

  // Fetch all entries
  useEffect(() => {
    if (!user) return;
    const fetchEntries = async () => {
      const { data } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false });

      const mappedEntries: JournalEntry[] = (data || []).map((e) => ({
        id: e.id,
        entryDate: e.entry_date,
        createdAt: e.created_at,
        updatedAt: e.updated_at,
        title: e.daily_feeling || "Untitled",
        contentJSON:
          typeof e.text_formatting === "string"
            ? e.text_formatting
            : JSON.stringify(e.text_formatting) || "",
        mood: e.daily_feeling || undefined,
        tags: e.tags || [],
      }));
      setEntries(mappedEntries);
    };
    fetchEntries();
  }, [user]);

  // Fetch or create entry for selected date
  useEffect(() => {
    if (!user) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    const fetchOrCreateEntry = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .eq("entry_date", dateStr)
        .maybeSingle();

      if (data) {
        const contentJSON =
          typeof data.text_formatting === "string"
            ? data.text_formatting
            : JSON.stringify(data.text_formatting) || "";

        setCurrentEntry({
          id: data.id,
          entryDate: data.entry_date,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          title: data.daily_feeling || "Untitled",
          contentJSON,
          mood: data.daily_feeling || undefined,
          tags: data.tags || [],
        });
        setContent(contentJSON);
      } else {
        const initialContent = template.applyOnNewEntry
          ? generateInitialContent(template.questions)
          : JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] });
        setCurrentEntry(null);
        setContent(initialContent);
      }
      setIsSaved(true);
      setIsLoading(false);
    };

    fetchOrCreateEntry();
  }, [selectedDate, user, template.applyOnNewEntry, template.questions]);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    setIsSaved(false);
  }, []);

  const handleSave = async () => {
    if (!user) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    try {
      if (currentEntry) {
        await supabase
          .from("journal_entries")
          .update({
            text_formatting: content,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentEntry.id);
      } else {
        const { data } = await supabase
          .from("journal_entries")
          .insert({
            user_id: user.id,
            entry_date: dateStr,
            text_formatting: content,
          })
          .select()
          .single();

        if (data) {
          const newEntry: JournalEntry = {
            id: data.id,
            entryDate: data.entry_date,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            title: "Untitled",
            contentJSON: content,
            tags: [],
          };
          setCurrentEntry(newEntry);
          setEntries((prev) => [newEntry, ...prev]);
        }
      }
      setIsSaved(true);
      toast({ title: "Saved", description: "Your journal entry has been saved." });
    } catch (error) {
      console.error("Save error:", error);
      toast({ title: "Error", description: "Failed to save entry.", variant: "destructive" });
    }
  };

  const handleTemplateChange = (newTemplate: JournalTemplate) => {
    setTemplate(newTemplate);
    localStorage.setItem("journal_template", JSON.stringify(newTemplate));
  };

  const handleSkinChange = (skinId: string) => {
    setCurrentSkinId(skinId);
    localStorage.setItem("journal_skin_id", skinId);
  };

  const handleInsertPrompt = (prompt: string) => {
    editorRef.current?.editor?.chain().focus().insertContent(`\n\n${prompt}\n\n`).run();
    setIsSaved(false);
  };

  return (
    <div
      className="flex w-full"
      style={{
        backgroundColor: currentSkin.pageBg,
        color: currentSkin.text,
        minHeight: "100vh",
      }}
    >
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col min-w-0 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              Journal
            </h1>
            <p className="text-sm" style={{ color: currentSkin.mutedText }}>
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-xs flex items-center gap-1"
              style={{ color: currentSkin.mutedText }}
            >
              {isSaved ? (
                <>
                  <Check className="h-3 w-3" /> Saved
                </>
              ) : (
                "Not saved yet"
              )}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSettingsOpen(true)}
              style={{ borderColor: currentSkin.border, color: currentSkin.text }}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaved}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mb-4">
          <JournalToolbar
            editor={editorRef.current?.editor || null}
            fontFamily={fontFamily}
            fontSize={fontSize}
            onFontFamilyChange={setFontFamily}
            onFontSizeChange={setFontSize}
          />
        </div>

        {/* Editor */}
        {isLoading ? (
          <div
            className="flex-1 rounded-lg border flex items-center justify-center"
            style={{
              backgroundColor: currentSkin.editorPaperBg,
              borderColor: currentSkin.border,
            }}
          >
            <p style={{ color: currentSkin.mutedText }}>Loading...</p>
          </div>
        ) : (
          <JournalTiptapEditor
            ref={editorRef}
            content={content}
            onChange={handleContentChange}
            skinStyles={{
              editorPaperBg: currentSkin.editorPaperBg,
              text: currentSkin.text,
              mutedText: currentSkin.mutedText,
            }}
            fontFamily={fontFamily}
            fontSize={fontSize}
          />
        )}
      </div>

      {/* Right Sidebar */}
      <div className="p-4 pl-0">
        <JournalSidebarPanel
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          entries={entries}
          onInsertPrompt={handleInsertPrompt}
          skin={currentSkin}
        />
      </div>

      {/* Settings Modal */}
      <JournalSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        template={template}
        onTemplateChange={handleTemplateChange}
        currentSkinId={currentSkinId}
        onSkinChange={handleSkinChange}
      />
    </div>
  );
}
