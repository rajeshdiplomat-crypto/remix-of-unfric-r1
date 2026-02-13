import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay, parseISO } from "date-fns";
import { extractImagesFromTiptapJSON } from "@/lib/editorUtils";
import {
  Settings,
  Save,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Maximize2,
  Minimize2,
  Loader2,
  Cloud,
  CloudOff,
  Calendar,
  Heart,
  Smile,
  Meh,
  Frown,
  Search,
  X,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
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
import { JournalRecentEntriesView } from "@/components/journal/JournalRecentEntriesView";
import { JournalInsightsModal } from "@/components/journal/JournalInsightsModal";
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

const ANSWER_PLACEHOLDERS: { [key: string]: string } = {
  "How are you feeling today?": "Share your thoughts and emotions...",
  "What are you grateful for?": "List the things that brought you joy...",
  "What act of kindness did you do or receive?": "Describe a moment of kindness...",
  "Additional thoughts…": "Anything else on your mind...",
};

const generateInitialContent = (questions: { text: string }[]) =>
  JSON.stringify({
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1, textAlign: "left" },
        content: [],
      },
      ...questions.flatMap((q) => [
        {
          type: "heading",
          attrs: { level: 2, textAlign: "left" },
          content: [{ type: "text", text: q.text }],
        },
        {
          type: "paragraph",
          attrs: { textAlign: "left", class: "placeholder-hint" },
          content: [],
        },
      ]),
    ],
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
  const [searchQuery, setSearchQuery] = useState("");
  const [showRecentEntries, setShowRecentEntries] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  const [template, setTemplate] = useState<JournalTemplate>(() => {
    const saved = localStorage.getItem("journal_template");
    return saved ? JSON.parse(saved) : DEFAULT_TEMPLATE;
  });

  const { theme } = useTheme();
  const [currentSkinId, setCurrentSkinId] = useState(() => localStorage.getItem("journal_skin_id") || "minimal-light");

  // Sync skin with global dark mode if needed
  useEffect(() => {
    if (theme.isDark && currentSkinId !== "midnight-dark") {
      setCurrentSkinId("midnight-dark");
    } else if (!theme.isDark && currentSkinId === "midnight-dark") {
      setCurrentSkinId("minimal-light");
    }
  }, [theme.isDark, currentSkinId]);

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

  // Helper: Extract preview from content JSON
  const extractPreview = (contentJSON: string) => {
    try {
      const parsed = JSON.parse(contentJSON);
      if (parsed?.content) {
        const textParts: string[] = [];
        parsed.content.forEach((node: any) => {
          // Only extract text from paragraphs (answers), skip headings (questions)
          if (node.type === "paragraph" && node.content) {
            node.content.forEach((child: any) => {
              if (child.type === "text" && child.text) {
                textParts.push(child.text);
              }
            });
          }
        });
        return textParts.join(" ").trim().slice(0, 150);
      }
    } catch {
      return "";
    }
    return "";
  };
  // Helper: Extract title from H1 in content JSON
  const extractTitle = (contentJSON: string) => {
    try {
      const parsed = JSON.parse(contentJSON);
      if (parsed?.content) {
        const h1 = parsed.content.find((node: any) => node.type === "heading" && node.attrs?.level === 1);
        if (h1?.content?.[0]?.text) {
          return h1.content[0].text;
        }
      }
    } catch {
      return null;
    }
    return null;
  };

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
          (data || []).map((e) => {
            const contentJSON =
              typeof e.text_formatting === "string" ? e.text_formatting : JSON.stringify(e.text_formatting) || "";

            // Extract preview text and title
            const preview = extractPreview(contentJSON);
            const customTitle = extractTitle(contentJSON);

            return {
              id: e.id,
              entryDate: e.entry_date,
              createdAt: e.created_at,
              updatedAt: e.updated_at,
              title: customTitle || e.daily_feeling || "Untitled",
              preview,
              contentJSON,
              mood: e.daily_feeling,
              tags: e.tags || [],
            };
          }),
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

          // Helper to ensure proper content structure with H1 Title
          const existingTitle = extractTitle(contentJSON);

          // Always use the original contentJSON (text_formatting) as the source of truth.
          // It preserves images, formatting, and all rich content.
          // Only reconstruct from answers if there's NO existing content.
          let finalContent = contentJSON;

          try {
            const parsed = JSON.parse(contentJSON);
            const hasRealContent = parsed?.content?.some((node: any) => {
              if (node.type === "heading" && node.attrs?.level === 1) return false; // skip title
              if (node.type === "heading" && node.attrs?.level === 2) return false; // skip question headers
              if (node.type === "paragraph" && (!node.content || node.content.length === 0)) return false; // empty paragraph
              return true; // has real content (text, images, etc.)
            });

            if (!hasRealContent && answersData?.length) {
              // Content is empty/skeleton — reconstruct from answers
              finalContent = JSON.stringify({
                type: "doc",
                content: [
                  {
                    type: "heading",
                    attrs: { level: 1, textAlign: "left" },
                    content: existingTitle ? [{ type: "text", text: existingTitle }] : [],
                  },
                  ...template.questions.flatMap((q) => {
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
                ],
              });
            } else {
              // Ensure content starts with H1
              const firstNode = parsed.content?.[0];
              if (!firstNode || !(firstNode.type === "heading" && firstNode.attrs?.level === 1)) {
                parsed.content = [
                  {
                    type: "heading",
                    attrs: { level: 1, textAlign: "left" },
                    content: [],
                  },
                  ...(parsed.content || []),
                ];
                finalContent = JSON.stringify(parsed);
              }
            }
          } catch (e) {
            console.error("Error processing contentJSON", e);
          }

          setContent(finalContent);
          lastSavedContentRef.current = finalContent;
          // Updated current entry state to match
          setCurrentEntry((prev) => (prev ? { ...prev, contentJSON: finalContent } : prev));
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
      return true;
    }

    isSavingRef.current = true;
    setSaveStatus("saving");
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    try {
      const extractedAnswers = extractAnswersFromContent(content, template.questions);

      // Extract image URLs from TipTap JSON content and save to images_data
      const contentImages = extractImagesFromTiptapJSON(content);
      const imagesDataPayload = contentImages.map(url => ({ url }));

      if (currentEntry) {
        const { error } = await supabase
          .from("journal_entries")
          .update({
            text_formatting: content,
            daily_feeling: selectedMood,
            images_data: imagesDataPayload,
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

        // Update local entries state for sidebar preview
        setEntries((prev) =>
          prev.map((e) =>
            e.id === currentEntry.id
              ? {
                  ...e,
                  updatedAt: new Date().toISOString(),
                  contentJSON: content,
                  preview: extractPreview(content),
                  title: extractTitle(content) || selectedMood || "Untitled",
                  mood: selectedMood,
                }
              : e,
          ),
        );
      } else {
        const { data: newEntry, error } = await supabase
          .from("journal_entries")
          .insert({
            user_id: user.id,
            entry_date: dateStr,
            text_formatting: content,
            daily_feeling: selectedMood,
            images_data: imagesDataPayload,
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
            title: extractTitle(content) || selectedMood || "Untitled",
            contentJSON: content,
            preview: extractPreview(content),
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
      return true;
    } catch (err) {
      console.error("Save error:", err);
      setSaveStatus("unsaved");
      toast({ title: "Error saving", description: "Please try again", variant: "destructive" });
      return false;
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
  const handleManualSave = useCallback(async () => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    if (content === lastSavedContentRef.current && saveStatus === "saved") {
      toast({
        title: "All changes saved",
        duration: 2000,
      });
      return;
    }

    const success = await performSave();
    if (success) {
      toast({
        title: "Saved successfully",
        duration: 2000,
      });
    }
  }, [content, saveStatus, performSave, toast]);

  // Keyboard shortcut for manual save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleManualSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleManualSave]);

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
        "flex flex-col w-full transition-all duration-300",
        isFullscreen ? "fixed inset-0 z-50 bg-background" : "h-full overflow-hidden",
      )}
      style={{
        backgroundColor: currentSkin.pageBg,
        color: currentSkin.text,
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
        className={cn(
          "sticky top-0 z-40 backdrop-blur-xl border-b",
          isFullscreen ? "bg-white/95 dark:bg-slate-900/95" : "",
        )}
        style={{
          backgroundColor: isFullscreen ? undefined : `${currentSkin.pageBg}e6`,
          borderColor: isFullscreen ? undefined : `${currentSkin.border}40`,
        }}
      >
        <div className="px-4 sm:px-6 py-2 flex items-center justify-between gap-4">
          {/* Left - Date Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={goToPreviousDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <button
              onClick={() => setSelectedDate(new Date())}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/80 hover:bg-white rounded-xl border border-slate-200 transition-all"
            >
              <Calendar className="h-4 w-4 text-stone-500" />
              <span className="text-sm font-semibold text-slate-700">{format(selectedDate, "EEE, MMM d")}</span>
            </button>

            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={goToNextDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => setShowRecentEntries(true)}
              title="Recent Entries"
            >
              <BookOpen className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => setShowInsights(true)}
              title="Journal Insights"
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          </div>

          {/* Center - Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search journal entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-10 py-1.5 text-sm bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-200 focus:border-stone-300 transition-all font-medium text-slate-700 dark:text-slate-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5 text-slate-400" />
                </button>
              )}
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
              disabled={saveStatus === "saving"}
              className="h-8 rounded-lg bg-gradient-to-r from-stone-500 to-orange-600 hover:from-stone-600 hover:to-orange-700 text-xs px-3"
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
          "flex-1 min-h-0 grid gap-6 w-full px-4 sm:px-6 py-4 transition-all duration-300 overflow-hidden",
          isFullscreen
            ? "grid-cols-1 max-w-4xl mx-auto"
            : leftPanelCollapsed
              ? "grid-cols-1 lg:grid-cols-[64px_1fr_280px]"
              : "grid-cols-1 lg:grid-cols-[280px_1fr_280px]",
        )}
      >
        {/* Left Panel - Calendar */}
        {!isFullscreen && (
          <div
            className={cn("hidden lg:flex flex-col transition-all duration-300 h-full overflow-y-auto", leftPanelCollapsed && "w-16")}
          >
            <JournalSidebarPanel
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              entries={entries}
              onInsertPrompt={handleInsertPrompt}
              skin={currentSkin}
              showSection="calendar"
              isCollapsed={leftPanelCollapsed}
              onToggleCollapse={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
              searchQuery={searchQuery}
            />
          </div>
        )}

        <div className={cn("flex flex-col min-w-0 overflow-y-auto", isFullscreen ? "h-full" : "h-full")}>
          {/* Greeting Section */}
          <div className="mb-4 px-1">
            <h2 className="text-xl font-semibold text-slate-800">
              {(() => {
                const hour = new Date().getHours();
                const userName =
                  user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "";
                const firstName = userName.split(" ")[0];
                const greeting =
                  hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : hour < 21 ? "Good evening" : "Good night";
                const emoji = hour < 12 ? "☀️" : hour < 17 ? "🌤️" : hour < 21 ? "🌅" : "🌙";
                return firstName ? `${greeting}, ${firstName} ${emoji}` : `${greeting} ${emoji}`;
              })()}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {(() => {
                const quotes = [
                  "Every page you write is a step toward understanding yourself.",
                  "Your thoughts matter. Let them flow freely today.",
                  "Writing is the painting of the voice.",
                  "Today's reflections shape tomorrow's clarity.",
                  "Be gentle with yourself as you explore your thoughts.",
                  "Every word you write is a gift to your future self.",
                  "Let your journal be a safe space for your authentic voice.",
                ];
                return quotes[Math.floor(new Date().getDate() % quotes.length)];
              })()}
            </p>
            <p className="text-xs text-stone-500 mt-2">
              {(() => {
                if (streak === 0) {
                  return "Start your journaling journey today — even a few words can make a difference.";
                } else if (streak === 1) {
                  return "You wrote yesterday! Keep the momentum going with today's entry.";
                } else if (streak < 7) {
                  return `You've been writing for ${streak} days straight. Amazing consistency — keep it up!`;
                } else if (streak < 30) {
                  return `Incredible! ${streak} days of journaling. Your dedication is inspiring.`;
                } else {
                  return `${streak} days of reflection! You've built a powerful habit. Keep writing.`;
                }
              })()}
            </p>
          </div>

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
          <div className="hidden lg:block h-full overflow-y-auto">
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
      />

      {showRecentEntries && (
        <JournalRecentEntriesView
          entries={entries}
          onSelectEntry={(dateStr) => {
            switchDate(parseISO(dateStr));
            setShowRecentEntries(false);
          }}
          onClose={() => setShowRecentEntries(false)}
        />
      )}

      <JournalInsightsModal open={showInsights} onOpenChange={setShowInsights} />
    </div>
  );
}
