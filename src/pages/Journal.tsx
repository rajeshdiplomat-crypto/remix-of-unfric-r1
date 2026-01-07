import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { Settings, Save, Check, Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { EvernoteToolbarEditor, EvernoteToolbarEditorRef } from "@/components/editor/EvernoteToolbarEditor";
import { JournalSidebarPanel } from "@/components/journal/JournalSidebarPanel";
import { JournalSettingsModal } from "@/components/journal/JournalSettingsModal";
import { PageHero, PAGE_HERO_TEXT } from "@/components/common/PageHero";
import { extractImagesFromHTML, isJSONContent, tiptapJSONToHTML } from "@/lib/editorUtils";
import {
  JournalEntry,
  JournalTemplate,
  JOURNAL_SKINS,
  DEFAULT_TEMPLATE,
} from "@/components/journal/types";

interface JournalAnswer {
  id: string;
  journal_entry_id: string;
  question_id: string;
  answer_text: string | null;
  created_at: string;
  updated_at: string;
}

// Generate initial HTML content with questions as headings
const generateInitialHTMLContent = (questions: { text: string }[]) => {
  return questions.map(q => `<h2>${q.text}</h2><p></p>`).join('');
};

// Extract answers from HTML content based on question headings
const extractAnswersFromHTMLContent = (html: string, questions: { id: string; text: string }[]): { question_id: string; answer_text: string }[] => {
  if (!html) return [];
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const answers: { question_id: string; answer_text: string }[] = [];
  
  // Find all h2 elements
  const headings = doc.querySelectorAll('h2');
  
  headings.forEach((heading) => {
    const headingText = heading.textContent?.trim() || '';
    const matchedQuestion = questions.find(q => q.text === headingText);
    
    if (matchedQuestion) {
      // Collect all sibling elements until the next h2
      let answerParts: string[] = [];
      let sibling = heading.nextElementSibling;
      
      while (sibling && sibling.tagName !== 'H2') {
        const text = sibling.textContent?.trim();
        if (text) answerParts.push(text);
        sibling = sibling.nextElementSibling;
      }
      
      answers.push({
        question_id: matchedQuestion.id,
        answer_text: answerParts.join('\n'),
      });
    }
  });
  
  return answers;
};

// Rebuild HTML content from answers
const rebuildHTMLFromAnswers = (answers: JournalAnswer[], questions: { id: string; text: string }[]) => {
  return questions.map(q => {
    const answer = answers.find(a => a.question_id === q.id);
    const answerText = answer?.answer_text || '';
    return `<h2>${q.text}</h2><p>${answerText}</p>`;
  }).join('');
};

export default function Journal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const editorRef = useRef<EvernoteToolbarEditorRef>(null);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [currentAnswers, setCurrentAnswers] = useState<JournalAnswer[]>([]);
  const [content, setContent] = useState("");
  const [isSaved, setIsSaved] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFullPage, setIsFullPage] = useState(false);

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

        // Get the content and convert from JSON to HTML if necessary
        let contentToUse = typeof entryData.text_formatting === "string"
          ? entryData.text_formatting
          : JSON.stringify(entryData.text_formatting) || "";
        
        // Convert legacy JSON content to HTML
        if (isJSONContent(contentToUse)) {
          contentToUse = tiptapJSONToHTML(contentToUse);
        }

        const images = Array.isArray(entryData.images_data) ? (entryData.images_data as string[]) : [];
        setCurrentEntry({
          id: entryData.id,
          entryDate: entryData.entry_date,
          createdAt: entryData.created_at,
          updatedAt: entryData.updated_at,
          title: entryData.daily_feeling || "Untitled",
          contentJSON: contentToUse,
          mood: entryData.daily_feeling || undefined,
          tags: entryData.tags || [],
          imagesData: images,
        });
        setCurrentAnswers(answersData || []);
        
        // If we have answers but empty content, rebuild from answers
        if (answersData && answersData.length > 0 && !contentToUse.trim()) {
          const rebuiltContent = rebuildHTMLFromAnswers(answersData, template.questions);
          setContent(rebuiltContent);
        } else {
          setContent(contentToUse);
        }
      } else {
        const initialContent = template.applyOnNewEntry
          ? generateInitialHTMLContent(template.questions)
          : '<p></p>';
        setCurrentEntry(null);
        setCurrentAnswers([]);
        setContent(initialContent);
      }
      setIsSaved(true);
      setIsLoading(false);
    };

    fetchOrCreateEntry();
  }, [selectedDate, user, template.applyOnNewEntry, template.questions]);

  const handleContentChange = useCallback(({ contentRich, plainText }: { contentRich: string; plainText: string }) => {
    setContent(contentRich);
    setIsSaved(false);
  }, []);

  const handleSave = async () => {
    if (!user) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    
    // Get content from editor
    const contentHTML = editorRef.current?.getHTML() || content;
    const contentPlainText = editorRef.current?.getText() || '';
    
    // Extract inline images from the HTML content
    const inlineImages = extractImagesFromHTML(contentHTML);

    try {
      // Extract answers from current HTML content
      const extractedAnswers = extractAnswersFromHTMLContent(contentHTML, template.questions);

      if (currentEntry) {
        // Update entry
        await supabase
          .from("journal_entries")
          .update({
            text_formatting: contentHTML,
            images_data: inlineImages.length > 0 ? inlineImages : null,
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

        // Update feed event with inline images
        const { data: existingFeedEvent } = await supabase
          .from("feed_events")
          .select("id")
          .eq("source_id", currentEntry.id)
          .eq("source_module", "journal")
          .maybeSingle();

        if (existingFeedEvent) {
          await supabase
            .from("feed_events")
            .update({
              content_preview: contentPlainText.substring(0, 500),
              media: inlineImages.length > 0 ? inlineImages : null,
            })
            .eq("id", existingFeedEvent.id);
        }
      } else {
        // Create new entry
        const { data: newEntry } = await supabase
          .from("journal_entries")
          .insert({
            user_id: user.id,
            entry_date: dateStr,
            text_formatting: contentHTML,
            images_data: inlineImages.length > 0 ? inlineImages : null,
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

          // Create feed event with inline images
          await supabase.from("feed_events").insert({
            user_id: user.id,
            type: "journal_entry",
            source_module: "journal",
            source_id: newEntry.id,
            title: `Journal Entry - ${format(selectedDate, "MMMM d, yyyy")}`,
            content_preview: contentPlainText.substring(0, 500),
            media: inlineImages.length > 0 ? inlineImages : null,
            metadata: {
              journal_date: dateStr,
              entry_id: newEntry.id,
            },
          });

          const entry: JournalEntry = {
            id: newEntry.id,
            entryDate: newEntry.entry_date,
            createdAt: newEntry.created_at,
            updatedAt: newEntry.updated_at,
            title: "Untitled",
            contentJSON: contentHTML,
            tags: [],
            imagesData: inlineImages,
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
    editorRef.current?.editor?.chain().focus().insertContent(`<p>${prompt}</p>`).run();
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

        {/* Centered editor with Evernote toolbar */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto w-full px-8 py-6">
            <EvernoteToolbarEditor
              ref={editorRef}
              initialContentRich={content}
              onContentChange={handleContentChange}
              onSave={handleSave}
              autosaveDebounce={1500}
              placeholder="Start writing your journal entry..."
              className="min-h-[500px]"
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
                <Button size="sm" onClick={handleSave} disabled={isSaved}>
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </div>
            </div>

            {/* Editor with integrated toolbar */}
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
              <EvernoteToolbarEditor
                ref={editorRef}
                initialContentRich={content}
                onContentChange={handleContentChange}
                onSave={handleSave}
                autosaveDebounce={1500}
                placeholder="Start writing your journal entry..."
                className="min-h-[400px]"
              />
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
