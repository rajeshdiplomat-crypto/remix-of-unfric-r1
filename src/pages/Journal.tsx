import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { format, addDays, subDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  MemoizedJournalTiptapEditor,
  TiptapEditorRef,
} from "@/components/journal/JournalTiptapEditor";
import { EnhancedSidebar } from "@/components/journal/EnhancedSidebar";
import { JournalSettingsModal } from "@/components/journal/JournalSettingsModal";
import { GlassmorphicToolbar } from "@/components/journal/GlassmorphicToolbar";
import { PageHero, PAGE_HERO_TEXT } from "@/components/common/PageHero";
import { PageLoadingScreen } from "@/components/common/PageLoadingScreen";
import { JournalEntry, JournalTemplate, JOURNAL_SKINS, DEFAULT_TEMPLATE } from "@/components/journal/types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface JournalAnswer {
  id: string;
  journal_entry_id: string;
  question_id: string;
  answer_text: string | null;
  created_at: string;
  updated_at: string;
}

const generateInitialContent = (questions: { text: string }[]) =>
  JSON.stringify({
    type: "doc",
    content: questions.flatMap((q) => [
      {
        type: "heading",
        attrs: { level: 2, textAlign: "left" },
        content: [{ type: "text", text: q.text }],
      },
      {
        type: "paragraph",
        attrs: { textAlign: "left" },
        content: [],
      },
    ]),
  });

const extractAnswersFromContent = (
  contentJSON: string,
  questions: { id: string; text: string }[],
): { question_id: string; answer_text: string }[] => {
  try {
    const parsed = typeof contentJSON === "string" ? JSON.parse(contentJSON) : contentJSON;
    if (!parsed?.content) return [];
    const answers: { question_id: string; answer_text: string }[] = [];
    let currentQuestionId: string | null = null;
    let currentAnswerParts: string[] = [];
    const extractText = (node: any): string => node?.text || node?.content?.map(extractText).join("") || "";
    for (const node of parsed.content) {
      if (node.type === "heading" && node.attrs?.level === 2) {
        if (currentQuestionId)
          answers.push({ question_id: currentQuestionId, answer_text: currentAnswerParts.join("\n").trim() });
        const headingText = extractText(node).trim();
        currentQuestionId = questions.find((q) => q.text === headingText)?.id || null;
        currentAnswerParts = [];
      } else if (currentQuestionId) {
        const text = extractText(node);
        if (text) currentAnswerParts.push(text);
      }
    }
    if (currentQuestionId)
      answers.push({ question_id: currentQuestionId, answer_text: currentAnswerParts.join("\n").trim() });
    return answers;
  } catch {
    return [];
  }
};

const getWordCount = (contentJSON: string): number => {
  try {
    const parsed = typeof contentJSON === "string" ? JSON.parse(contentJSON) : contentJSON;
    if (!parsed?.content) return 0;
    const extractText = (node: any): string => node?.text || node?.content?.map(extractText).join(" ") || "";
    const text = parsed.content.map(extractText).join(" ");
    return text.split(/\s+/).filter(Boolean).length;
  } catch {
    return 0;
  }
};

export default function Journal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const editorRef = useRef<TiptapEditorRef>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContentRef = useRef<string>("");
  const currentDateRef = useRef<string>(format(new Date(), "yyyy-MM-dd"));
  const isSavingRef = useRef(false);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [currentAnswers, setCurrentAnswers] = useState<JournalAnswer[]>([]);
  const [content, setContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [isLoading, setIsLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [hasUsedPrompt, setHasUsedPrompt] = useState(false);

  const [template, setTemplate] = useState<JournalTemplate>(() => {
    const saved = localStorage.getItem("journal_template");
    return saved ? JSON.parse(saved) : DEFAULT_TEMPLATE;
  });

  const [currentSkinId, setCurrentSkinId] = useState(() => localStorage.getItem("journal_skin_id") || "minimal-light");

  const currentSkin = useMemo(
    () => JOURNAL_SKINS.find((s) => s.id === currentSkinId) || JOURNAL_SKINS[0],
    [currentSkinId],
  );

  const wordCount = useMemo(() => getWordCount(content), [content]);

  const streak = useMemo(() => {
    if (!entries.length) return 0;
    let count = 0;
    let checkDate = new Date();
    for (let i = 0; i < 365; i++) {
      const dateStr = format(checkDate, "yyyy-MM-dd");
      const hasEntry = entries.some((e) => e.entryDate === dateStr);
      if (hasEntry) {
        count++;
        checkDate = subDays(checkDate, 1);
      } else if (i > 0) {
        break;
      } else {
        checkDate = subDays(checkDate, 1);
      }
    }
    return count;
  }, [entries]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: false })
      .then(({ data }) => {
        setEntries(
          (data || []).map((e) => ({
            id: e.id,
            entryDate: e.entry_date,
            createdAt: e.created_at,
            updatedAt: e.updated_at,
            title: e.daily_feeling || "Untitled",
            contentJSON:
              typeof e.text_formatting === "string" ? e.text_formatting : JSON.stringify(e.text_formatting) || "",
            mood: e.daily_feeling,
            tags: e.tags || [],
          })),
        );
      });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    currentDateRef.current = dateStr;
    setIsLoading(true);
    setHasUsedPrompt(false);

    supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("entry_date", dateStr)
      .maybeSingle()
      .then(async ({ data: entryData, error }) => {
        if (error) {
          console.error("Error loading entry:", error);
          setIsLoading(false);
          return;
        }
        if (entryData) {
          const { data: answersData } = await supabase
            .from("journal_answers")
            .select("*")
            .eq("journal_entry_id", entryData.id);

          const contentJSON =
            typeof entryData.text_formatting === "string"
              ? entryData.text_formatting
              : JSON.stringify(entryData.text_formatting) || "";

          setCurrentEntry({
            id: entryData.id,
            entryDate: entryData.entry_date,
            createdAt: entryData.created_at,
            updatedAt: entryData.updated_at,
            title: entryData.daily_feeling || "Untitled",
            contentJSON,
            mood: entryData.daily_feeling,
            tags: entryData.tags || [],
          });
          setCurrentAnswers(answersData || []);
          setSelectedMood(entryData.daily_feeling || null);

          const newContent = answersData?.length
            ? JSON.stringify({
                type: "doc",
                content: template.questions.flatMap((q) => {
                  const answer = answersData.find((a) => a.question_id === q.id);
                  return [
                    { type: "heading", attrs: { level: 2, textAlign: "left" }, content: [{ type: "text", text: q.text }] },
                    { type: "paragraph", attrs: { textAlign: "left" }, content: answer?.answer_text ? [{ type: "text", text: answer.answer_text }] : [] },
                  ];
                }),
              })
            : contentJSON;

          setContent(newContent);
          lastSavedContentRef.current = newContent;
        } else {
          setCurrentEntry(null);
          setCurrentAnswers([]);
          setSelectedMood(null);
          const newContent = template.applyOnNewEntry
            ? generateInitialContent(template.questions)
            : JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] });
          setContent(newContent);
          lastSavedContentRef.current = newContent;
        }
        setSaveStatus("saved");
        setIsLoading(false);
      });
  }, [selectedDate, user, template]);

  const performSave = useCallback(async () => {
    if (!user || isSavingRef.current) return;
    if (content === lastSavedContentRef.current) {
      setSaveStatus("saved");
      return;
    }
    isSavingRef.current = true;
    setSaveStatus("saving");
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    try {
      const extractedAnswers = extractAnswersFromContent(content, template.questions);
      if (currentEntry) {
        const { error } = await supabase
          .from("journal_entries")
          .update({ text_formatting: content, daily_feeling: selectedMood, updated_at: new Date().toISOString() })
          .eq("id", currentEntry.id);
        if (error) throw error;

        for (const answer of extractedAnswers) {
          const existing = currentAnswers.find((a) => a.question_id === answer.question_id);
          if (existing) {
            await supabase.from("journal_answers").update({ answer_text: answer.answer_text, updated_at: new Date().toISOString() }).eq("id", existing.id);
          } else {
            await supabase.from("journal_answers").insert({ journal_entry_id: currentEntry.id, question_id: answer.question_id, answer_text: answer.answer_text });
          }
        }
        const { data } = await supabase.from("journal_answers").select("*").eq("journal_entry_id", currentEntry.id);
        setCurrentAnswers(data || []);
      } else {
        const { data: newEntry, error } = await supabase
          .from("journal_entries")
          .insert({ user_id: user.id, entry_date: dateStr, text_formatting: content, daily_feeling: selectedMood })
          .select()
          .single();
        if (error) throw error;

        if (newEntry) {
          const answersToInsert = extractedAnswers.map((a) => ({ journal_entry_id: newEntry.id, question_id: a.question_id, answer_text: a.answer_text }));
          if (answersToInsert.length) await supabase.from("journal_answers").insert(answersToInsert);

          const entryObj = { id: newEntry.id, entryDate: newEntry.entry_date, createdAt: newEntry.created_at, updatedAt: newEntry.updated_at, title: selectedMood || "Untitled", contentJSON: content, mood: selectedMood, tags: [] };
          setCurrentEntry(entryObj);
          setEntries((prev) => [entryObj, ...prev]);
          const { data } = await supabase.from("journal_answers").select("*").eq("journal_entry_id", newEntry.id);
          setCurrentAnswers(data || []);
        }
      }
      lastSavedContentRef.current = content;
      setSaveStatus("saved");
    } catch (err) {
      console.error("Save error:", err);
      setSaveStatus("unsaved");
      toast({ title: "Error saving", description: "Please try again", variant: "destructive" });
    } finally {
      isSavingRef.current = false;
    }
  }, [user, content, selectedDate, currentEntry, currentAnswers, template.questions, selectedMood, toast]);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    if (newContent !== lastSavedContentRef.current) {
      setSaveStatus("unsaved");
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = setTimeout(() => performSave(), 2000);
    }
  }, [performSave]);

  const handleManualSave = () => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    performSave();
  };

  const handleMoodSelect = (moodId: string) => {
    setSelectedMood(moodId);
    setSaveStatus("unsaved");
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => performSave(), 1000);
  };

  useEffect(() => {
    return () => { if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current); };
  }, []);

  const switchDate = useCallback(async (newDate: Date) => {
    if (autosaveTimerRef.current) { clearTimeout(autosaveTimerRef.current); autosaveTimerRef.current = null; }
    if (content !== lastSavedContentRef.current && !isSavingRef.current) await performSave();
    setSelectedDate(newDate);
  }, [content, performSave]);

  const handleInsertPrompt = (prompt: string) => {
    editorRef.current?.editor?.chain().focus().insertContent(`\n\n${prompt}\n\n`).run();
    setSaveStatus("unsaved");
    setHasUsedPrompt(true);
  };

  if (isLoading && !currentEntry && !content) {
    return <PageLoadingScreen module="journal" />;
  }

  return (
    <div className={cn("flex flex-col w-full flex-1 transition-all duration-300", isFullscreen && "fixed inset-0 z-50 overflow-auto")} style={{ backgroundColor: currentSkin.pageBg, color: currentSkin.text, minHeight: "100vh" }}>
      {!isFullscreen && <PageHero storageKey="journal_hero_src" typeKey="journal_hero_type" badge={PAGE_HERO_TEXT.journal.badge} title={PAGE_HERO_TEXT.journal.title} subtitle={PAGE_HERO_TEXT.journal.subtitle} />}

      <GlassmorphicToolbar
        selectedDate={selectedDate}
        onPreviousDay={() => switchDate(subDays(selectedDate, 1))}
        onNextDay={() => switchDate(addDays(selectedDate, 1))}
        onToday={() => switchDate(new Date())}
        selectedMood={selectedMood}
        onMoodSelect={handleMoodSelect}
        streak={streak}
        wordCount={wordCount}
        saveStatus={saveStatus}
        onManualSave={handleManualSave}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div className={cn("flex-1 grid gap-6 w-full px-4 sm:px-6 py-4", isFullscreen ? "grid-cols-1 max-w-4xl mx-auto" : "grid-cols-1 lg:grid-cols-[1fr_320px]")}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex flex-col min-w-0">
          <div className={cn("transition-all duration-200 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50 bg-white", isLoading && "opacity-50 pointer-events-none")}>
            <MemoizedJournalTiptapEditor ref={editorRef} content={content} onChange={handleContentChange} skinStyles={{ editorPaperBg: currentSkin.editorPaperBg, text: currentSkin.text, mutedText: currentSkin.mutedText }} />
          </div>
        </motion.div>

        {!isFullscreen && (
          <div className="hidden lg:block">
            <EnhancedSidebar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              entries={entries}
              onInsertPrompt={handleInsertPrompt}
              skin={currentSkin}
              wordCount={wordCount}
              streak={streak}
              hasMood={!!selectedMood}
              hasUsedPrompt={hasUsedPrompt}
              onViewEntry={setSelectedDate}
              mood={selectedMood}
              recentEntryPreview={content ? getWordCount(content) > 0 ? content : undefined : undefined}
            />
          </div>
        )}
      </div>

      <JournalSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} template={template} onTemplateChange={(t) => { setTemplate(t); localStorage.setItem("journal_template", JSON.stringify(t)); }} currentSkinId={currentSkinId} onSkinChange={(id) => { setCurrentSkinId(id); localStorage.setItem("journal_skin_id", id); }} />
    </div>
  );
}
