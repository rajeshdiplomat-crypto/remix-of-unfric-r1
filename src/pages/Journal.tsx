import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { format, addDays, subDays } from "date-fns";
import { Settings, Save, Check, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { JournalTiptapEditor, TiptapEditorRef } from "@/components/journal/JournalTiptapEditor";
import { JournalSidebarPanel } from "@/components/journal/JournalSidebarPanel";
import { JournalSettingsModal } from "@/components/journal/JournalSettingsModal";
import { PageHero, PAGE_HERO_TEXT } from "@/components/common/PageHero";
import { JournalEntry, JournalTemplate, JOURNAL_SKINS, DEFAULT_TEMPLATE } from "@/components/journal/types";

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
      { type: "heading", attrs: { level: 2, textAlign: "left" }, content: [{ type: "text", text: q.text }] },
      { type: "paragraph", attrs: { textAlign: "left" }, content: [] },
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
    let currentQuestionId: string | null = null,
      currentAnswerParts: string[] = [];
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

export default function Journal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const editorRef = useRef<TiptapEditorRef>(null);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [currentAnswers, setCurrentAnswers] = useState<JournalAnswer[]>([]);
  const [content, setContent] = useState("");
  const [isSaved, setIsSaved] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [template, setTemplate] = useState<JournalTemplate>(() => {
    const saved = localStorage.getItem("journal_template");
    return saved ? JSON.parse(saved) : DEFAULT_TEMPLATE;
  });
  const [currentSkinId, setCurrentSkinId] = useState(() => localStorage.getItem("journal_skin_id") || "minimal-light");
  const currentSkin = useMemo(
    () => JOURNAL_SKINS.find((s) => s.id === currentSkinId) || JOURNAL_SKINS[0],
    [currentSkinId],
  );

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
    setIsLoading(true);
    supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("entry_date", dateStr)
      .maybeSingle()
      .then(async ({ data: entryData }) => {
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
          setContent(
            answersData?.length
              ? JSON.stringify({
                  type: "doc",
                  content: template.questions.flatMap((q) => {
                    const answer = answersData.find((a) => a.question_id === q.id);
                    return [
                      {
                        type: "heading",
                        attrs: { level: 2, textAlign: "left" },
                        content: [{ type: "text", text: q.text }],
                      },
                      {
                        type: "paragraph",
                        attrs: { textAlign: "left" },
                        content: answer?.answer_text ? [{ type: "text", text: answer.answer_text }] : [],
                      },
                    ];
                  }),
                })
              : contentJSON,
          );
        } else {
          setCurrentEntry(null);
          setCurrentAnswers([]);
          setContent(
            template.applyOnNewEntry
              ? generateInitialContent(template.questions)
              : JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] }),
          );
        }
        setIsSaved(true);
        setIsLoading(false);
      });
  }, [selectedDate, user, template]);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    setIsSaved(false);
  }, []);

  const handleSave = async () => {
    if (!user) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    try {
      const extractedAnswers = extractAnswersFromContent(content, template.questions);
      if (currentEntry) {
        await supabase
          .from("journal_entries")
          .update({ text_formatting: content, updated_at: new Date().toISOString() })
          .eq("id", currentEntry.id);
        for (const answer of extractedAnswers) {
          const existing = currentAnswers.find((a) => a.question_id === answer.question_id);
          existing
            ? await supabase
                .from("journal_answers")
                .update({ answer_text: answer.answer_text, updated_at: new Date().toISOString() })
                .eq("id", existing.id)
            : await supabase
                .from("journal_answers")
                .insert({
                  journal_entry_id: currentEntry.id,
                  question_id: answer.question_id,
                  answer_text: answer.answer_text,
                });
        }
      } else {
        const { data: newEntry } = await supabase
          .from("journal_entries")
          .insert({ user_id: user.id, entry_date: dateStr, text_formatting: content })
          .select()
          .single();
        if (newEntry) {
          const answersToInsert = extractedAnswers.map((a) => ({
            journal_entry_id: newEntry.id,
            question_id: a.question_id,
            answer_text: a.answer_text,
          }));
          if (answersToInsert.length) await supabase.from("journal_answers").insert(answersToInsert);
          setCurrentEntry({
            id: newEntry.id,
            entryDate: newEntry.entry_date,
            createdAt: newEntry.created_at,
            updatedAt: newEntry.updated_at,
            title: "Untitled",
            contentJSON: content,
            tags: [],
          });
          setEntries((prev) => [
            {
              id: newEntry.id,
              entryDate: newEntry.entry_date,
              createdAt: newEntry.created_at,
              updatedAt: newEntry.updated_at,
              title: "Untitled",
              contentJSON: content,
              tags: [],
            },
            ...prev,
          ]);
        }
      }
      if (currentEntry) {
        const { data } = await supabase.from("journal_answers").select("*").eq("journal_entry_id", currentEntry.id);
        setCurrentAnswers(data || []);
      }
      setIsSaved(true);
      toast({ title: "Saved" });
    } catch (err) {
      console.error(err);
      toast({ title: "Error saving", variant: "destructive" });
    }
  };

  const goToPreviousDay = () => setSelectedDate(subDays(selectedDate, 1));
  const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const handleInsertPrompt = (prompt: string) => {
    editorRef.current?.editor?.chain().focus().insertContent(`\n\n${prompt}\n\n`).run();
    setIsSaved(false);
  };

  return (
    <div
      className={`flex flex-col w-full flex-1 ${isFullscreen ? "fixed inset-0 z-50" : "-mx-6 -mt-6"}`}
      style={{ backgroundColor: currentSkin.pageBg, color: currentSkin.text, minHeight: "100vh" }}
    >
      {!isFullscreen && (
        <PageHero
          storageKey="journal_hero_src"
          typeKey="journal_hero_type"
          badge={PAGE_HERO_TEXT.journal.badge}
          title={PAGE_HERO_TEXT.journal.title}
          subtitle={PAGE_HERO_TEXT.journal.subtitle}
        />
      )}

      {/* Single Unified Header */}
      <div
        className="sticky top-0 z-40 border-b px-4 py-2 flex items-center justify-between gap-3 flex-wrap"
        style={{ backgroundColor: currentSkin.pageBg, borderColor: currentSkin.border }}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToPreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center min-w-[140px]">
            <p className="text-xs uppercase tracking-wider" style={{ color: currentSkin.mutedText }}>
              {format(selectedDate, "EEE")}
            </p>
            <p className="text-sm font-semibold">{format(selectedDate, "MMM d, yyyy")}</p>
          </div>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs flex items-center gap-1" style={{ color: currentSkin.mutedText }}>
            {isSaved ? (
              <>
                <Check className="h-3 w-3" /> Saved
              </>
            ) : (
              "Unsaved"
            )}
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setIsFullscreen(!isFullscreen)}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaved}>
            <Save className="h-4 w-4 mr-1" /> Save
          </Button>
        </div>
      </div>

      <div
        className={`grid gap-6 w-full px-4 pt-4 pb-8 ${isFullscreen ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-[1fr_320px]"}`}
      >
        <div className="flex flex-col min-w-0">
          {isLoading ? (
            <div
              className="flex-1 rounded-lg border flex items-center justify-center min-h-[400px]"
              style={{ backgroundColor: currentSkin.editorPaperBg, borderColor: currentSkin.border }}
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
            />
          )}
        </div>

        {!isFullscreen && (
          <div>
            <JournalSidebarPanel
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              entries={entries}
              onInsertPrompt={handleInsertPrompt}
              skin={currentSkin}
            />
          </div>
        )}
      </div>

      <JournalSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        template={template}
        onTemplateChange={(t) => {
          setTemplate(t);
          localStorage.setItem("journal_template", JSON.stringify(t));
        }}
        currentSkinId={currentSkinId}
        onSkinChange={(id) => {
          setCurrentSkinId(id);
          localStorage.setItem("journal_skin_id", id);
        }}
      />
    </div>
  );
}
