import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { format, addDays, subDays } from "date-fns";
import {
  Settings,
  Save,
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Loader2,
  Cloud,
  CloudOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  JournalTiptapEditor,
  MemoizedJournalTiptapEditor,
  TiptapEditorRef,
} from "@/components/journal/JournalTiptapEditor";
import { JournalSidebarPanel } from "@/components/journal/JournalSidebarPanel";
import { JournalSettingsModal } from "@/components/journal/JournalSettingsModal";
import { PageHero, PAGE_HERO_TEXT } from "@/components/common/PageHero";
import { PageLoadingScreen } from "@/components/common/PageLoadingScreen";
import { JournalEntry, JournalTemplate, JOURNAL_SKINS, DEFAULT_TEMPLATE } from "@/components/journal/types";
import { cn } from "@/lib/utils";

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

export default function Journal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const editorRef = useRef<TiptapEditorRef>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContentRef = useRef<string>("");

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [currentAnswers, setCurrentAnswers] = useState<JournalAnswer[]>([]);
  const [content, setContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [isLoading, setIsLoading] = useState(true);
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

  // Load all entries on mount
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

  // Load entry for selected date
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

          const newContent = answersData?.length
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
            : contentJSON;

          setContent(newContent);
          lastSavedContentRef.current = newContent;
        } else {
          setCurrentEntry(null);
          setCurrentAnswers([]);
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

  // Save function
  const performSave = useCallback(async () => {
    if (!user || content === lastSavedContentRef.current) return;

    setSaveStatus("saving");
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    try {
      const extractedAnswers = extractAnswersFromContent(content, template.questions);

      if (currentEntry) {
        // Update existing entry
        const { error } = await supabase
          .from("journal_entries")
          .update({
            text_formatting: content,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentEntry.id);

        if (error) throw error;

        // Update answers
        for (const answer of extractedAnswers) {
          const existing = currentAnswers.find((a) => a.question_id === answer.question_id);
          if (existing) {
            await supabase
              .from("journal_answers")
              .update({ answer_text: answer.answer_text, updated_at: new Date().toISOString() })
              .eq("id", existing.id);
          } else {
            await supabase.from("journal_answers").insert({
              journal_entry_id: currentEntry.id,
              question_id: answer.question_id,
              answer_text: answer.answer_text,
            });
          }
        }

        // Refresh answers
        const { data } = await supabase.from("journal_answers").select("*").eq("journal_entry_id", currentEntry.id);
        setCurrentAnswers(data || []);
      } else {
        // Create new entry
        const { data: newEntry, error } = await supabase
          .from("journal_entries")
          .insert({
            user_id: user.id,
            entry_date: dateStr,
            text_formatting: content,
          })
          .select()
          .single();

        if (error) throw error;

        if (newEntry) {
          // Insert answers
          const answersToInsert = extractedAnswers.map((a) => ({
            journal_entry_id: newEntry.id,
            question_id: a.question_id,
            answer_text: a.answer_text,
          }));
          if (answersToInsert.length) {
            await supabase.from("journal_answers").insert(answersToInsert);
          }

          const entryObj = {
            id: newEntry.id,
            entryDate: newEntry.entry_date,
            createdAt: newEntry.created_at,
            updatedAt: newEntry.updated_at,
            title: "Untitled",
            contentJSON: content,
            tags: [],
          };

          setCurrentEntry(entryObj);
          setEntries((prev) => [entryObj, ...prev]);

          // Refresh answers
          const { data } = await supabase.from("journal_answers").select("*").eq("journal_entry_id", newEntry.id);
          setCurrentAnswers(data || []);
        }
      }

      lastSavedContentRef.current = content;
      setSaveStatus("saved");
    } catch (err) {
      console.error("Save error:", err);
      setSaveStatus("unsaved");
      toast({ title: "Error saving", variant: "destructive" });
    }
  }, [user, content, selectedDate, currentEntry, currentAnswers, template.questions, toast]);

  // Handle content change with autosave
  const handleContentChange = useCallback(
    (newContent: string) => {
      setContent(newContent);

      if (newContent !== lastSavedContentRef.current) {
        setSaveStatus("unsaved");

        // Clear existing timer
        if (autosaveTimerRef.current) {
          clearTimeout(autosaveTimerRef.current);
        }

        // Set new autosave timer (3 seconds)
        autosaveTimerRef.current = setTimeout(() => {
          performSave();
        }, 3000);
      }
    },
    [performSave],
  );

  // Manual save
  const handleManualSave = () => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    performSave();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  const goToPreviousDay = () => setSelectedDate(subDays(selectedDate, 1));
  const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1));

  const handleInsertPrompt = (prompt: string) => {
    editorRef.current?.editor?.chain().focus().insertContent(`\n\n${prompt}\n\n`).run();
    setSaveStatus("unsaved");
  };

  if (isLoading && !currentEntry && !content) {
    return <PageLoadingScreen module="journal" />;
  }

  const SaveStatusIndicator = () => (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
        saveStatus === "saved" && "bg-emerald-50 text-emerald-600",
        saveStatus === "saving" && "bg-amber-50 text-amber-600",
        saveStatus === "unsaved" && "bg-slate-100 text-slate-500",
      )}
    >
      {saveStatus === "saved" && <Cloud className="h-3.5 w-3.5" />}
      {saveStatus === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {saveStatus === "unsaved" && <CloudOff className="h-3.5 w-3.5" />}
      <span className="capitalize">
        {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : "Unsaved"}
      </span>
    </div>
  );

  return (
    <div
      className={cn("flex flex-col w-full flex-1 transition-all duration-300", isFullscreen && "fixed inset-0 z-50")}
      style={{
        backgroundColor: currentSkin.pageBg,
        color: currentSkin.text,
        minHeight: "100vh",
      }}
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

      {/* Modern Sticky Header */}
      <div
        className={cn("sticky top-0 z-40 backdrop-blur-xl border-b transition-all", isFullscreen && "bg-white/80")}
        style={{
          backgroundColor: isFullscreen ? undefined : `${currentSkin.pageBg}e6`,
          borderColor: currentSkin.border,
        }}
      >
        <div
          className={cn(
            "px-4 sm:px-6 py-3 flex items-center justify-between gap-4",
            isFullscreen ? "max-w-4xl mx-auto" : "",
          )}
        >
          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl hover:bg-white/50"
              onClick={goToPreviousDay}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2 bg-white/60 backdrop-blur rounded-xl px-3 py-1.5 shadow-sm border border-white/40">
              {[-2, -1, 0, 1, 2].map((offset) => {
                const day = addDays(selectedDate, offset);
                const isSelected = offset === 0;
                const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                return (
                  <button
                    key={offset}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "flex flex-col items-center px-3 py-1 rounded-lg transition-all",
                      isSelected
                        ? "bg-gradient-to-b from-violet-500 to-purple-600 text-white shadow-lg shadow-purple-200"
                        : "hover:bg-white/80 text-slate-600",
                    )}
                  >
                    <span
                      className={cn(
                        "text-[10px] font-medium uppercase",
                        isSelected ? "text-white/80" : "text-slate-400",
                      )}
                    >
                      {format(day, "EEE")}
                    </span>
                    <span
                      className={cn("text-sm font-bold", isSelected ? "text-white" : isToday ? "text-rose-500" : "")}
                    >
                      {format(day, "d")}
                    </span>
                  </button>
                );
              })}
            </div>

            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white/50" onClick={goToNextDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <SaveStatusIndicator />

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl hover:bg-white/50"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>

            {!isFullscreen && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl hover:bg-white/50"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}

            <Button
              size="sm"
              onClick={handleManualSave}
              disabled={saveStatus === "saved" || saveStatus === "saving"}
              className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-purple-200/50"
            >
              <Save className="h-4 w-4 mr-1.5" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div
        className={cn(
          "flex-1 grid gap-6 w-full px-4 sm:px-6 py-6",
          isFullscreen ? "grid-cols-1 max-w-4xl mx-auto" : "grid-cols-1 lg:grid-cols-[1fr_320px]",
        )}
      >
        <div className="flex flex-col min-w-0">
          <div
            className={cn(
              "transition-opacity duration-200 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50",
              isLoading && "opacity-50 pointer-events-none",
            )}
          >
            <MemoizedJournalTiptapEditor
              ref={editorRef}
              content={content}
              onChange={handleContentChange}
              skinStyles={{
                editorPaperBg: currentSkin.editorPaperBg,
                text: currentSkin.text,
                mutedText: currentSkin.mutedText,
              }}
            />
          </div>
        </div>

        {!isFullscreen && (
          <div className="hidden lg:block">
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
