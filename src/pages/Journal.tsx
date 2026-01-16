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
  Sparkles,
  Calendar,
  BookOpen,
  PenLine,
  Timer,
  Target,
  Heart,
  Smile,
  Meh,
  Frown,
  TrendingUp,
  Quote,
  Sun,
  Moon,
  CloudSun,
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

// Motivational quotes for the journal
const DAILY_QUOTES = [
  { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { quote: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
  { quote: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { quote: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { quote: "Your limitation—it's only your imagination.", author: "Unknown" },
  { quote: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { quote: "Great things never come from comfort zones.", author: "Unknown" },
];

// Mood options with emojis
const MOOD_OPTIONS = [
  { id: "great", label: "Great", icon: Smile, color: "text-emerald-500", bg: "bg-emerald-50" },
  { id: "good", label: "Good", icon: Heart, color: "text-blue-500", bg: "bg-blue-50" },
  { id: "okay", label: "Okay", icon: Meh, color: "text-amber-500", bg: "bg-amber-50" },
  { id: "low", label: "Low", icon: Frown, color: "text-rose-500", bg: "bg-rose-50" },
];

// Get greeting based on time
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good Morning", icon: Sun, gradient: "from-amber-400 to-orange-500" };
  if (hour < 17) return { text: "Good Afternoon", icon: CloudSun, gradient: "from-blue-400 to-cyan-500" };
  return { text: "Good Evening", icon: Moon, gradient: "from-indigo-500 to-purple-600" };
};

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
  const [showQuote, setShowQuote] = useState(true);

  const [template, setTemplate] = useState<JournalTemplate>(() => {
    const saved = localStorage.getItem("journal_template");
    return saved ? JSON.parse(saved) : DEFAULT_TEMPLATE;
  });

  const [currentSkinId, setCurrentSkinId] = useState(() => localStorage.getItem("journal_skin_id") || "minimal-light");

  const currentSkin = useMemo(
    () => JOURNAL_SKINS.find((s) => s.id === currentSkinId) || JOURNAL_SKINS[0],
    [currentSkinId],
  );

  // Get daily quote based on date
  const dailyQuote = useMemo(() => {
    const dayOfYear = Math.floor(
      (selectedDate.getTime() - new Date(selectedDate.getFullYear(), 0, 0).getTime()) / 86400000,
    );
    return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
  }, [selectedDate]);

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

  // Greeting
  const greeting = useMemo(() => getGreeting(), []);

  // Week days for calendar
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
    const end = endOfWeek(selectedDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

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
    if (!user || content === lastSavedContentRef.current) return;

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

  const goToPreviousDay = () => setSelectedDate(subDays(selectedDate, 1));
  const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1));

  const handleInsertPrompt = (prompt: string) => {
    editorRef.current?.editor?.chain().focus().insertContent(`\n\n${prompt}\n\n`).run();
    setSaveStatus("unsaved");
  };

  if (isLoading && !currentEntry && !content) {
    return <PageLoadingScreen module="journal" />;
  }

  const GreetingIcon = greeting.icon;

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

      {/* Modern Header */}
      <div
        className={cn("sticky top-0 z-40 backdrop-blur-xl border-b", isFullscreen ? "bg-white/90" : "")}
        style={{
          backgroundColor: isFullscreen ? undefined : `${currentSkin.pageBg}f0`,
          borderColor: `${currentSkin.border}50`,
        }}
      >
        <div className="px-4 sm:px-6 py-3">
          {/* Top Row - Greeting & Controls */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-xl bg-gradient-to-br shadow-lg", `${greeting.gradient}`)}>
                <GreetingIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2
                  className={cn("text-lg font-bold bg-gradient-to-r bg-clip-text text-transparent", greeting.gradient)}
                >
                  {greeting.text}
                </h2>
                <p className="text-xs text-slate-500">{format(selectedDate, "EEEE, MMMM d, yyyy")}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Save Status */}
              <div
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  saveStatus === "saved" && "bg-emerald-100 text-emerald-700",
                  saveStatus === "saving" && "bg-amber-100 text-amber-700",
                  saveStatus === "unsaved" && "bg-slate-100 text-slate-600",
                )}
              >
                {saveStatus === "saved" && <Cloud className="h-3.5 w-3.5" />}
                {saveStatus === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {saveStatus === "unsaved" && <CloudOff className="h-3.5 w-3.5" />}
                {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : "Unsaved"}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>

              {!isFullscreen && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl"
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

          {/* Week Calendar */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg shrink-0" onClick={goToPreviousDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex-1 flex items-center justify-center gap-1 bg-white/60 backdrop-blur rounded-2xl p-1.5 shadow-sm border border-white/50">
              {weekDays.map((day) => {
                const isSelected = isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);
                const hasEntry = entries.some((e) => e.entryDate === format(day, "yyyy-MM-dd"));

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "flex-1 flex flex-col items-center py-2 px-1 rounded-xl transition-all relative",
                      isSelected
                        ? "bg-gradient-to-b from-violet-500 to-purple-600 text-white shadow-lg shadow-purple-200/50"
                        : "hover:bg-white/80",
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
                      className={cn(
                        "text-sm font-bold",
                        isSelected ? "text-white" : isTodayDate ? "text-violet-600" : "text-slate-700",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {hasEntry && !isSelected && (
                      <div className="absolute bottom-1 w-1 h-1 rounded-full bg-violet-400" />
                    )}
                  </button>
                );
              })}
            </div>

            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg shrink-0" onClick={goToNextDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats & Mood Bar */}
      <div className="px-4 sm:px-6 py-3 border-b" style={{ borderColor: `${currentSkin.border}30` }}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-50 rounded-xl">
              <TrendingUp className="h-4 w-4 text-violet-500" />
              <span className="text-sm font-semibold text-violet-700">{streak} day streak</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-xl">
              <PenLine className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-semibold text-blue-700">{wordCount} words</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-xl">
              <BookOpen className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-semibold text-emerald-700">{entries.length} entries</span>
            </div>
          </div>

          {/* Mood Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">How are you feeling?</span>
            <div className="flex items-center gap-1">
              {MOOD_OPTIONS.map((mood) => {
                const MoodIcon = mood.icon;
                const isActive = selectedMood === mood.id;
                return (
                  <button
                    key={mood.id}
                    onClick={() => handleMoodSelect(mood.id)}
                    className={cn(
                      "p-2 rounded-xl transition-all",
                      isActive
                        ? `${mood.bg} ring-2 ring-offset-1 ring-${mood.color.replace("text-", "")}`
                        : "hover:bg-slate-100",
                    )}
                    title={mood.label}
                  >
                    <MoodIcon className={cn("h-5 w-5", isActive ? mood.color : "text-slate-400")} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Quote Card */}
      {showQuote && !isFullscreen && (
        <div className="px-4 sm:px-6 py-3">
          <div className="relative bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50 rounded-2xl p-4 border border-violet-100/50 overflow-hidden">
            <Quote className="absolute right-4 top-4 h-8 w-8 text-violet-200" />
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white/80 rounded-xl shadow-sm">
                <Sparkles className="h-5 w-5 text-violet-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-700 italic leading-relaxed">"{dailyQuote.quote}"</p>
                <p className="text-xs text-violet-600 font-medium mt-1">— {dailyQuote.author}</p>
              </div>
              <button onClick={() => setShowQuote(false)} className="text-xs text-slate-400 hover:text-slate-600">
                Hide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div
        className={cn(
          "flex-1 grid gap-6 w-full px-4 sm:px-6 py-4",
          isFullscreen ? "grid-cols-1 max-w-4xl mx-auto" : "grid-cols-1 lg:grid-cols-[1fr_320px]",
        )}
      >
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
