import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { Settings, Save, Check, Maximize2, X, ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { JournalTiptapEditor, TiptapEditorRef } from "@/components/journal/JournalTiptapEditor";
import { JournalToolbar } from "@/components/journal/JournalToolbar";
import { JournalSidebarPanel } from "@/components/journal/JournalSidebarPanel";
import { JournalSettingsModal } from "@/components/journal/JournalSettingsModal";
import { PageHero, PAGE_HERO_TEXT } from "@/components/common/PageHero";
import {
  JournalEntry,
  JournalTemplate,
  JOURNAL_SKINS,
  DEFAULT_TEMPLATE,
  DEFAULT_QUESTIONS,
} from "@/components/journal/types";

interface JournalAnswer {
  id: string;
  journal_entry_id: string;
  question_id: string;
  answer_text: string | null;
  created_at: string;
  updated_at: string;
}

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

// Extract answers from TipTap content based on question headings
const extractAnswersFromContent = (contentJSON: string, questions: { id: string; text: string }[]): { question_id: string; answer_text: string }[] => {
  try {
    const parsed = typeof contentJSON === "string" ? JSON.parse(contentJSON) : contentJSON;
    if (!parsed?.content) return [];

    const answers: { question_id: string; answer_text: string }[] = [];
    let currentQuestionId: string | null = null;
    let currentAnswerParts: string[] = [];

    const extractText = (node: any): string => {
      if (!node) return "";
      if (node.text) return node.text;
      if (node.content && Array.isArray(node.content)) {
        return node.content.map(extractText).join("");
      }
      return "";
    };

    for (const node of parsed.content) {
      if (node.type === "heading" && node.attrs?.level === 2) {
        // Save previous answer if exists
        if (currentQuestionId) {
          answers.push({
            question_id: currentQuestionId,
            answer_text: currentAnswerParts.join("\n").trim(),
          });
        }

        // Find matching question
        const headingText = extractText(node).trim();
        const matchedQuestion = questions.find((q) => q.text === headingText);
        currentQuestionId = matchedQuestion?.id || null;
        currentAnswerParts = [];
      } else if (currentQuestionId) {
        // Collect answer content
        const text = extractText(node);
        if (text) currentAnswerParts.push(text);
      }
    }

    // Save last answer
    if (currentQuestionId) {
      answers.push({
        question_id: currentQuestionId,
        answer_text: currentAnswerParts.join("\n").trim(),
      });
    }

    return answers;
  } catch {
    return [];
  }
};

export default function Journal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const editorRef = useRef<TiptapEditorRef>(null);
  
  // Track editor availability for toolbar - refs don't cause re-renders
  const [editorReady, setEditorReady] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [currentAnswers, setCurrentAnswers] = useState<JournalAnswer[]>([]);
  const [content, setContent] = useState("");
  const [isSaved, setIsSaved] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFullPage, setIsFullPage] = useState(false);
  const [fontFamily, setFontFamily] = useState("Inter");
  const [fontSize, setFontSize] = useState(16);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check for editor readiness after content state is defined
  useEffect(() => {
    setEditorReady(false); // Reset when content changes
    const checkEditor = setInterval(() => {
      if (editorRef.current?.editor) {
        setEditorReady(true);
        clearInterval(checkEditor);
      }
    }, 50);
    return () => clearInterval(checkEditor);
  }, [content]);

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
        imagesData: Array.isArray(e.images_data) ? (e.images_data as string[]) : [],
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
      
      // Fetch entry
      const { data: entryData } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .eq("entry_date", dateStr)
        .maybeSingle();

      if (entryData) {
        // Fetch answers for this entry
        const { data: answersData } = await supabase
          .from("journal_answers")
          .select("*")
          .eq("journal_entry_id", entryData.id);

        const contentJSON =
          typeof entryData.text_formatting === "string"
            ? entryData.text_formatting
            : JSON.stringify(entryData.text_formatting) || "";

        const images = Array.isArray(entryData.images_data) ? (entryData.images_data as string[]) : [];
        setCurrentEntry({
          id: entryData.id,
          entryDate: entryData.entry_date,
          createdAt: entryData.created_at,
          updatedAt: entryData.updated_at,
          title: entryData.daily_feeling || "Untitled",
          contentJSON,
          mood: entryData.daily_feeling || undefined,
          tags: entryData.tags || [],
          imagesData: images,
        });
        setAttachedImages(images);
        setCurrentAnswers(answersData || []);
        
        // If we have answers, rebuild content from them
        if (answersData && answersData.length > 0) {
          const rebuiltContent = rebuildContentFromAnswers(answersData, template.questions);
          setContent(rebuiltContent);
        } else {
          setContent(contentJSON);
        }
      } else {
        const initialContent = template.applyOnNewEntry
          ? generateInitialContent(template.questions)
          : JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] });
        setCurrentEntry(null);
        setCurrentAnswers([]);
        setContent(initialContent);
        setAttachedImages([]);
      }
      setIsSaved(true);
      setIsLoading(false);
    };

    fetchOrCreateEntry();
  }, [selectedDate, user, template.applyOnNewEntry, template.questions]);

  // Rebuild TipTap content from answers
  const rebuildContentFromAnswers = (answers: JournalAnswer[], questions: { id: string; text: string }[]) => {
    const content = {
      type: "doc",
      content: questions.flatMap((q) => {
        const answer = answers.find((a) => a.question_id === q.id);
        const answerContent = answer?.answer_text 
          ? [{ type: "text", text: answer.answer_text }]
          : [];
        
        return [
          { type: "heading", attrs: { level: 2, textAlign: "left" }, content: [{ type: "text", text: q.text }] },
          { type: "paragraph", attrs: { textAlign: "left" }, content: answerContent },
        ];
      }),
    };
    return JSON.stringify(content);
  };

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    setIsSaved(false);
  }, []);

  const handleSave = async () => {
    if (!user) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    try {
      // Extract answers from current content
      const extractedAnswers = extractAnswersFromContent(content, template.questions);

      if (currentEntry) {
        // Update entry
        await supabase
          .from("journal_entries")
          .update({
            text_formatting: content,
            images_data: attachedImages,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentEntry.id);

        // Upsert answers
        for (const answer of extractedAnswers) {
          const existingAnswer = currentAnswers.find((a) => a.question_id === answer.question_id);
          
          if (existingAnswer) {
            await supabase
              .from("journal_answers")
              .update({
                answer_text: answer.answer_text,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingAnswer.id);
          } else {
            await supabase
              .from("journal_answers")
              .insert({
                journal_entry_id: currentEntry.id,
                question_id: answer.question_id,
                answer_text: answer.answer_text,
              });
          }
        }
      } else {
        // Create new entry
        const { data: newEntry } = await supabase
          .from("journal_entries")
          .insert({
            user_id: user.id,
            entry_date: dateStr,
            text_formatting: content,
            images_data: attachedImages,
          })
          .select()
          .single();

        if (newEntry) {
          // Insert answers
          const answersToInsert = extractedAnswers.map((a) => ({
            journal_entry_id: newEntry.id,
            question_id: a.question_id,
            answer_text: a.answer_text,
          }));

          if (answersToInsert.length > 0) {
            await supabase.from("journal_answers").insert(answersToInsert);
          }

          const entry: JournalEntry = {
            id: newEntry.id,
            entryDate: newEntry.entry_date,
            createdAt: newEntry.created_at,
            updatedAt: newEntry.updated_at,
            title: "Untitled",
            contentJSON: content,
            tags: [],
          };
          setCurrentEntry(entry);
          setEntries((prev) => [entry, ...prev]);
        }
      }

      // Refetch answers
      if (currentEntry) {
        const { data: refreshedAnswers } = await supabase
          .from("journal_answers")
          .select("*")
          .eq("journal_entry_id", currentEntry.id);
        setCurrentAnswers(refreshedAnswers || []);
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

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || !user) return;
    setIsUploading(true);

    const uploadedUrls: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Max 5MB per image", variant: "destructive" });
        continue;
      }

      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("journal-images").upload(path, file);
      
      if (error) {
        console.error("Upload error:", error);
        toast({ title: "Upload failed", description: error.message, variant: "destructive" });
        continue;
      }

      const { data: urlData } = supabase.storage.from("journal-images").getPublicUrl(path);
      uploadedUrls.push(urlData.publicUrl);
    }

    if (uploadedUrls.length > 0) {
      setAttachedImages((prev) => [...prev, ...uploadedUrls]);
      setIsSaved(false);
    }
    setIsUploading(false);
  };

  const removeImage = (index: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index));
    setIsSaved(false);
  };

  // Escape key to exit full page mode
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullPage) setIsFullPage(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isFullPage]);

  // Full page mode - render via portal to escape layout stacking context
  if (isFullPage) {
    return createPortal(
      <div
        className="fixed inset-0 z-[100] flex flex-col overflow-hidden"
        style={{
          backgroundColor: currentSkin.pageBg,
          color: currentSkin.text,
        }}
      >
        {/* Minimal header */}
        <div
          className="flex items-center justify-between px-8 py-3 border-b"
          style={{ borderColor: currentSkin.border }}
        >
          <span className="text-sm font-light tracking-wide uppercase">
            {format(selectedDate, "EEEE, MMMM d")}
          </span>
          <div className="flex items-center gap-3">
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
            <Button size="sm" onClick={handleSave} disabled={isSaved}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullPage(false)}
              className="rounded-lg"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Centered editor */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto w-full px-8 py-6">
            <div className="mb-4">
            <JournalToolbar
                editor={editorReady ? editorRef.current?.editor ?? null : null}
                fontFamily={fontFamily}
                fontSize={fontSize}
                onFontFamilyChange={setFontFamily}
                onFontSizeChange={setFontSize}
              />
            </div>
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
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return (
    <div
      className="flex flex-col w-full flex-1"
      style={{
        backgroundColor: currentSkin.pageBg,
        color: currentSkin.text,
        minHeight: "100vh",
      }}
    >
      {/* Full-bleed Hero */}
      <PageHero
        storageKey="journal_hero_src"
        typeKey="journal_hero_type"
        badge={PAGE_HERO_TEXT.journal.badge}
        title={PAGE_HERO_TEXT.journal.title}
        subtitle={PAGE_HERO_TEXT.journal.subtitle}
      />

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 w-full px-6 lg:px-8 pt-6 flex-1 pb-4">
        {/* Main Editor Area */}
        <div className="flex flex-col min-w-0 min-h-0">
          <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4">
          {/* Date and Day - Left side */}
          <span 
            className="text-sm font-light tracking-wide uppercase"
            style={{ color: currentSkin.text }}
          >
            {format(selectedDate, "EEEE, MMMM d, yyyy")}
          </span>
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
              onClick={() => setIsFullPage(true)}
              style={{ borderColor: currentSkin.border, color: currentSkin.text }}
              title="Full page mode"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSettingsOpen(true)}
              style={{ borderColor: currentSkin.border, color: currentSkin.text }}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              style={{ borderColor: currentSkin.border, color: currentSkin.text }}
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleImageUpload(e.target.files)}
            />
            <Button size="sm" onClick={handleSave} disabled={isSaved}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mb-4">
          <JournalToolbar
            editor={editorReady ? editorRef.current?.editor ?? null : null}
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
          <div className="flex flex-col gap-4">
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
            
            {/* Display attached images */}
            {attachedImages.length > 0 && (
              <div 
                className="rounded-lg border p-4"
                style={{ backgroundColor: currentSkin.editorPaperBg, borderColor: currentSkin.border }}
              >
                <p className="text-sm font-medium mb-3" style={{ color: currentSkin.mutedText }}>
                  Attached Images
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {attachedImages.map((url, i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden relative group">
                      <img
                        src={url}
                        alt={`Attached ${i + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => window.open(url, '_blank')}
                      />
                      <button
                        onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {/* Right Sidebar */}
      <aside className="hidden lg:flex flex-col h-full overflow-y-auto p-4 pl-0">
        <JournalSidebarPanel
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          entries={entries}
          onInsertPrompt={handleInsertPrompt}
          skin={currentSkin}
        />
      </aside>

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
    </div>
  );
}
