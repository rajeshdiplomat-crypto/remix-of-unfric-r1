import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay } from "date-fns";
import {
  Settings,
  Save,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Loader2,
  Cloud,
  CloudOff,
  Calendar,
  PenLine,
  Heart,
  Smile,
  Meh,
  Frown,
  TrendingUp,
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
import { JournalDateDetailsPanel } from "@/components/journal/JournalDateDetailsPanel";
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

// Mood options with emojis
const MOOD_OPTIONS = [
  { id: "great", label: "Great", icon: Smile, color: "text-emerald-500", bg: "bg-emerald-50" },
  { id: "good", label: "Good", icon: Heart, color: "text-blue-500", bg: "bg-blue-50" },
  { id: "okay", label: "Okay", icon: Meh, color: "text-amber-500", bg: "bg-amber-50" },
  { id: "low", label: "Low", icon: Frown, color: "text-rose-500", bg: "bg-rose-50" },
];

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

// Get word count from content
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
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);

  const [template, setTemplate] = useState<JournalTemplate>(() => {
    const saved = localStorage.getItem("journal_template");
    return saved ? JSON.parse(saved) : DEFAULT_TEMPLATE;
  });

  const [currentSkinId, setCurrentSkinId] = useState(() => localStorage.getItem("journal_skin_id") || "minimal-light");

  const currentSkin = useMemo(
    () => JOURNAL_SKINS.find((s) => s.id === currentSkinId) || JOURNAL_SKINS[0],
    [currentSkinId],
  );

  // Word count
  const wordCount = useMemo(() => getWordCount(content), [content]);

  // Streak calculation
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

    // Clear any pending autosave when changing dates
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    // Update current date ref
    currentDateRef.current = dateStr;
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
          setSelectedMood(entryData.daily_feeling || null);

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

  // Save function
  const performSave = useCallback(async () => {
    // Prevent duplicate saves and skip if content unchanged
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
          .update({
            text_formatting: content,
            daily_feeling: selectedMood,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentEntry.id);

        if (error) throw error;

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

        const { data } = await supabase.from("journal_answers").select("*").eq("journal_entry_id", currentEntry.id);
        setCurrentAnswers(data || []);
      } else {
        const { data: newEntry, error } = await supabase
          .from("journal_entries")
          .insert({
            user_id: user.id,
            entry_date: dateStr,
            text_formatting: content,
            daily_feeling: selectedMood,
          })
          .select()
          .single();

        if (error) throw error;

        if (newEntry) {
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
            title: selectedMood || "Untitled",
            contentJSON: content,
            mood: selectedMood,
            tags: [],
          };

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

  // Handle content change with autosave
  const handleContentChange = useCallback(
    (newContent: string) => {
      setContent(newContent);

      if (newContent !== lastSavedContentRef.current) {
        setSaveStatus("unsaved");

        if (autosaveTimerRef.current) {
          clearTimeout(autosaveTimerRef.current);
        }

        autosaveTimerRef.current = setTimeout(() => {
          performSave();
        }, 2000);
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

  // Handle mood selection
  const handleMoodSelect = (moodId: string) => {
    setSelectedMood(moodId);
    setSaveStatus("unsaved");
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => performSave(), 1000);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, []);

  // Save before switching dates
  const switchDate = useCallback(
    async (newDate: Date) => {
      // Clear pending autosave
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
      // If there are unsaved changes, save them first
      if (content !== lastSavedContentRef.current && !isSavingRef.current) {
        await performSave();
      }
      setSelectedDate(newDate);
    },
    [content, performSave],
  );

  const goToPreviousDay = () => switchDate(subDays(selectedDate, 1));
  const goToNextDay = () => switchDate(addDays(selectedDate, 1));

  const handleInsertPrompt = (prompt: string) => {
    editorRef.current?.editor?.chain().focus().insertContent(`\n\n${prompt}\n\n`).run();
    setSaveStatus("unsaved");
  };

  if (isLoading && !currentEntry && !content) {
    return <PageLoadingScreen module="journal" />;
  }

  return (
    <div
      className={cn(
        "flex flex-col w-full flex-1 transition-all duration-300",
        isFullscreen && "fixed inset-0 z-50 overflow-auto",
      )}
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

      {/* Compact Header */}
      <div
        className={cn("sticky top-0 z-40 backdrop-blur-xl border-b", isFullscreen ? "bg-white/95" : "")}
        style={{
          backgroundColor: isFullscreen ? undefined : `${currentSkin.pageBg}f8`,
          borderColor: `${currentSkin.border}30`,
        }}
      >
        <div className="px-4 sm:px-6 py-2 flex items-center justify-between gap-4">
          {/* Left - 7 Day Date Strip */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={goToPreviousDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-0.5">
              {Array.from({ length: 7 }, (_, i) => {
                const day = addDays(subDays(selectedDate, 3), i);
                const isSelected = isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "flex flex-col items-center px-2.5 py-1.5 rounded-xl transition-all min-w-[44px]",
                      isSelected
                        ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md"
                        : isTodayDate
                          ? "bg-violet-50 text-violet-600 hover:bg-violet-100"
                          : "hover:bg-slate-100 text-slate-600",
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
                    <span className={cn("text-sm font-bold", isSelected ? "text-white" : "")}>{format(day, "d")}</span>
                  </button>
                );
              })}
            </div>

            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={goToNextDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Center - Quick Stats (hidden on small screens) */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-violet-50 rounded-lg">
              <TrendingUp className="h-3.5 w-3.5 text-violet-500" />
              <span className="text-xs font-medium text-violet-700">{streak}d</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded-lg">
              <PenLine className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-xs font-medium text-blue-700">{wordCount}w</span>
            </div>
            {/* Mood - compact */}
            <div className="flex items-center gap-0.5">
              {MOOD_OPTIONS.map((mood) => {
                const MoodIcon = mood.icon;
                const isActive = selectedMood === mood.id;
                return (
                  <button
                    key={mood.id}
                    onClick={() => handleMoodSelect(mood.id)}
                    className={cn("p-1.5 rounded-lg transition-all", isActive ? mood.bg : "hover:bg-slate-100")}
                    title={mood.label}
                  >
                    <MoodIcon className={cn("h-4 w-4", isActive ? mood.color : "text-slate-300")} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right - Controls */}
          <div className="flex items-center gap-1.5">
            {/* Save Status */}
            <div
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
                saveStatus === "saved" && "bg-emerald-50 text-emerald-600",
                saveStatus === "saving" && "bg-amber-50 text-amber-600",
                saveStatus === "unsaved" && "bg-slate-100 text-slate-500",
              )}
            >
              {saveStatus === "saved" && <Cloud className="h-3 w-3" />}
              {saveStatus === "saving" && <Loader2 className="h-3 w-3 animate-spin" />}
              {saveStatus === "unsaved" && <CloudOff className="h-3 w-3" />}
              <span className="hidden sm:inline">
                {saveStatus === "saving" ? "Saving" : saveStatus === "saved" ? "Saved" : "Unsaved"}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>

            {!isFullscreen && (
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setSettingsOpen(true)}>
                <Settings className="h-4 w-4" />
              </Button>
            )}

            <Button
              size="sm"
              onClick={handleManualSave}
              disabled={saveStatus === "saved" || saveStatus === "saving"}
              className="h-8 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-xs px-3"
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div
        className={cn(
          "flex-1 grid gap-6 w-full px-4 sm:px-6 py-4 transition-all duration-300",
          isFullscreen
            ? "grid-cols-1 max-w-4xl mx-auto"
            : leftPanelCollapsed
              ? "grid-cols-1 lg:grid-cols-[64px_1fr_280px]"
              : "grid-cols-1 lg:grid-cols-[280px_1fr_280px]",
        )}
      >
        {/* Left Panel - Calendar */}
        {!isFullscreen && (
          <div className={cn("hidden lg:block transition-all duration-300", leftPanelCollapsed && "w-16")}>
            <JournalSidebarPanel
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              entries={entries}
              onInsertPrompt={handleInsertPrompt}
              skin={currentSkin}
              showSection="calendar"
              isCollapsed={leftPanelCollapsed}
              onToggleCollapse={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
            />
          </div>
        )}

        <div className="flex flex-col min-w-0">
          <div
            className={cn(
              "transition-all duration-200 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50 bg-white",
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

        {/* Right Panel - Date Details */}
        {!isFullscreen && (
          <div className="hidden lg:block">
            <JournalDateDetailsPanel
              selectedDate={selectedDate}
              wordCount={wordCount}
              streak={streak}
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
