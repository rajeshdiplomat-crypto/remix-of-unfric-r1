import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay, parseISO } from "date-fns";
import { extractImagesFromTiptapJSON } from "@/lib/editorUtils";
import {
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
  Sparkles,
  TrendingUp,
  Settings2,
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
import { PageHero, PAGE_HERO_TEXT } from "@/components/common/PageHero";
import { PageLoadingScreen } from "@/components/common/PageLoadingScreen";
import { JournalEntry, JournalTemplate, JOURNAL_SKINS, DEFAULT_TEMPLATE } from "@/components/journal/types";
import { JournalRecentEntriesView } from "@/components/journal/JournalRecentEntriesView";
import { JournalInsightsModal } from "@/components/journal/JournalInsightsModal";
import { JournalSettingsModal } from "@/components/journal/JournalSettingsModal";
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
  const [_settingsOpen, _setSettingsOpen] = useState(false); // kept for compat
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [activeLeftPanel, setActiveLeftPanel] = useState<"calendar" | "emotions" | "progress" | null>("progress");
  const [searchQuery, setSearchQuery] = useState("");
  const [showRecentEntries, setShowRecentEntries] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  const [template, setTemplate] = useState<JournalTemplate>(() => {
    const saved = localStorage.getItem("journal_template");
    return saved ? JSON.parse(saved) : DEFAULT_TEMPLATE;
  });

  // Re-sync template and journal mode when window regains focus (e.g. after Settings changes)
  useEffect(() => {
    const syncFromSettings = () => {
      // Sync template from localStorage
      const saved = localStorage.getItem("journal_template");
      if (saved) {
        try {
          setTemplate(JSON.parse(saved));
        } catch { /* ignore parse errors */ }
      }
      // Sync journal mode from DB
      if (user) {
        supabase
          .from("user_settings")
          .select("journal_mode")
          .eq("user_id", user.id)
          .maybeSingle()
          .then(({ data }) => {
            const mode = (data as any)?.journal_mode;
            if (mode) setJournalMode(mode);
          });
      }
    };
    window.addEventListener("focus", syncFromSettings);
    return () => window.removeEventListener("focus", syncFromSettings);
  }, [user]);

  const [journalMode, setJournalMode] = useState<string>("structured");

  // Per-entry page settings state
  const [entryPageSettings, setEntryPageSettings] = useState<{ skinId?: string; lineStyle?: string; mode?: string } | null>(null);
  const [entrySettingsOpen, setEntrySettingsOpen] = useState(false);

  // Load journal mode from DB
  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_settings")
      .select("journal_mode")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const mode = (data as any)?.journal_mode;
        if (mode) setJournalMode(mode);
      });
  }, [user]);

  const { theme } = useTheme();
  const [currentSkinId, setCurrentSkinId] = useState(() => localStorage.getItem("journal_skin_id") || "minimal-light");

  // Sync skin with per-entry settings and dark mode
  useEffect(() => {
    if (theme.isDark) {
      setCurrentSkinId("midnight-dark");
    } else if (entryPageSettings?.skinId) {
      setCurrentSkinId(entryPageSettings.skinId);
    } else {
      setCurrentSkinId(template.defaultSkinId || "minimal-light");
    }
  }, [theme.isDark, entryPageSettings?.skinId, template.defaultSkinId]);

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

          // Load per-entry page settings
          const ps = entryData.page_settings as any;
          setEntryPageSettings(ps ? { skinId: ps.skinId, lineStyle: ps.lineStyle, mode: ps.mode } : null);

          // Helper to ensure proper content structure with H1 Title
          const existingTitle = extractTitle(contentJSON);

          // Always use the original contentJSON (text_formatting) as the source of truth.
          // It preserves images, formatting, and all rich content.
          // Only reconstruct from answers if there's NO existing content.
          let finalContent = contentJSON;

          try {
            const parsed = JSON.parse(contentJSON);
            const hasRealContent = parsed?.content?.some((node: any) => {
              if (node.type === "heading" && node.attrs?.level === 1) return false;
              if (node.type === "heading" && node.attrs?.level === 2) return false;
              if (node.type === "paragraph") {
                if (!node.content || node.content.length === 0) return false;
                // Check if paragraph has only whitespace text
                const textOnly = node.content.every((c: any) => c.type === "text");
                if (textOnly && node.content.every((c: any) => !c.text?.trim())) return false;
                return true; // Has non-empty content (text, images, etc.)
              }
              // Any other node type (image, taskList, etc.) counts as real content
              return true;
            });

            if (!hasRealContent) {
              // Entry has no user content — regenerate based on per-entry mode or current global mode
              const ps = entryData.page_settings as any;
              const effectiveMode = ps?.mode || journalMode;
              const isUnstructured = effectiveMode === "unstructured";
              if (isUnstructured) {
                finalContent = JSON.stringify({
                  type: "doc",
                  content: [
                    { type: "heading", attrs: { level: 1, textAlign: "left" }, content: existingTitle ? [{ type: "text", text: existingTitle }] : [] },
                    { type: "paragraph", attrs: { textAlign: "left" }, content: [] },
                  ],
                });
              } else if (answersData?.length) {
                finalContent = JSON.stringify({
                  type: "doc",
                  content: [
                    { type: "heading", attrs: { level: 1, textAlign: "left" }, content: existingTitle ? [{ type: "text", text: existingTitle }] : [] },
                    ...template.questions.flatMap((q) => {
                      const answer = answersData.find((a) => a.question_id === q.id);
                      return [
                        { type: "heading", attrs: { level: 2, textAlign: "left" }, content: [{ type: "text", text: q.text }] },
                        { type: "paragraph", attrs: { textAlign: "left" }, content: answer?.answer_text ? [{ type: "text", text: answer.answer_text }] : [] },
                      ];
                    }),
                  ],
                });
              } else {
                // Structured mode but no answers — generate fresh template
                finalContent = generateInitialContent(template.questions);
              }
            } else {
              const firstNode = parsed.content?.[0];
              if (!firstNode || !(firstNode.type === "heading" && firstNode.attrs?.level === 1)) {
                parsed.content = [
                  { type: "heading", attrs: { level: 1, textAlign: "left" }, content: [] },
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
          setCurrentEntry((prev) => (prev ? { ...prev, contentJSON: finalContent } : prev));
        } else {
          setCurrentEntry(null);
          setCurrentAnswers([]);
          setSelectedMood(null);
          setEntryPageSettings(null);
          const isUnstructured = journalMode === "unstructured";
          const shouldApplyTemplate = !isUnstructured;
          const newContent = shouldApplyTemplate
            ? generateInitialContent(template.questions)
            : JSON.stringify({
                type: "doc",
                content: [
                  { type: "heading", attrs: { level: 1, textAlign: "left" }, content: [] },
                  { type: "paragraph", attrs: { textAlign: "left" }, content: [] },
                ],
              });
          setContent(newContent);
          lastSavedContentRef.current = newContent;
        }

        setSaveStatus("saved");
        setIsLoading(false);
      });
  }, [selectedDate, user]); // eslint-disable-line react-hooks/exhaustive-deps
  // Note: template and journalMode intentionally excluded — we read their current values
  // inside the callback. Including them would cause unwanted re-fetches mid-edit.

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
            page_settings: entryPageSettings ? { skinId: entryPageSettings.skinId, lineStyle: entryPageSettings.lineStyle || template.defaultLineStyle || "none", mode: entryPageSettings.mode } : null,
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
            page_settings: entryPageSettings ? { skinId: entryPageSettings.skinId, lineStyle: entryPageSettings.lineStyle || template.defaultLineStyle || "none", mode: entryPageSettings.mode } : null,
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
  }, [user, content, selectedDate, currentEntry, currentAnswers, template.questions, template.defaultLineStyle, selectedMood, entryPageSettings, currentSkinId, toast]);

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

  // Escape key exits fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isFullscreen]);

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

  // Clear the editor back to a fresh state (as if no entry exists)
  const handleClearEntry = useCallback(async () => {
    // Delete the entry from DB if it exists
    if (currentEntry && user) {
      await supabase.from("journal_answers").delete().eq("journal_entry_id", currentEntry.id);
      await supabase.from("journal_entries").delete().eq("id", currentEntry.id);
      setEntries((prev) => prev.filter((e) => e.id !== currentEntry.id));
      setCurrentEntry(null);
      setCurrentAnswers([]);
    }
    setSelectedMood(null);
    setEntryPageSettings(null);

    // Re-read the latest template from localStorage to pick up any Settings changes
    const savedTemplate = localStorage.getItem("journal_template");
    const latestTemplate: JournalTemplate = savedTemplate ? JSON.parse(savedTemplate) : DEFAULT_TEMPLATE;
    setTemplate(latestTemplate);

    // Re-read the latest journal mode from the database
    let latestMode = journalMode;
    if (user) {
      const { data } = await supabase
        .from("user_settings")
        .select("journal_mode")
        .eq("user_id", user.id)
        .maybeSingle();
      if ((data as any)?.journal_mode) {
        latestMode = (data as any).journal_mode;
        setJournalMode(latestMode);
      }
    }

    // Re-initialize content based on current settings
    const isUnstructured = latestMode === "unstructured";
    const newContent = !isUnstructured
      ? generateInitialContent(latestTemplate.questions)
      : JSON.stringify({
          type: "doc",
          content: [
            { type: "heading", attrs: { level: 1, textAlign: "left" }, content: [] },
            { type: "paragraph", attrs: { textAlign: "left" }, content: [] },
          ],
        });
    setContent(newContent);
    lastSavedContentRef.current = newContent;
    setSaveStatus("saved");

    // Reset skin and line style to latest global defaults
    setCurrentSkinId(latestTemplate.defaultSkinId || (theme.isDark ? "midnight-dark" : "minimal-light"));
  }, [currentEntry, user, journalMode, theme.isDark]);

  if (isLoading && !currentEntry && !content) {
    return <PageLoadingScreen module="journal" />;
  }

  const journalHeader = (
    <div
      className={cn(
        "shrink-0 backdrop-blur-xl border-b border-border/40",
        isFullscreen ? "" : "sticky top-0 z-40",
      )}
    >
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={goToPreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted rounded-xl transition-all"
          >
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{format(selectedDate, "EEE, MMM d")}</span>
          </button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={goToNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setShowRecentEntries(true)} title="Recent Entries">
            <BookOpen className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setShowInsights(true)} title="Journal Insights">
            <BarChart3 className="h-4 w-4" />
          </Button>
        </div>
        {/* Search bar removed */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground">
            {saveStatus === "saved" && <Cloud className="h-3 w-3" />}
            {saveStatus === "saving" && <Loader2 className="h-3 w-3 animate-spin" />}
            {saveStatus === "unsaved" && <CloudOff className="h-3 w-3" />}
            <span className="hidden sm:inline">
              {saveStatus === "saving" ? "Saving" : saveStatus === "saved" ? "Saved" : "Unsaved"}
            </span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setEntrySettingsOpen(true)} title="Entry Appearance">
            <Settings2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setIsFullscreen(!isFullscreen)}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={handleManualSave} disabled={saveStatus === "saving"} className="h-8 rounded-lg text-xs px-3">
            <Save className="h-3.5 w-3.5 mr-1" />
            Save
          </Button>
        </div>
      </div>
    </div>
  );

  const editorContent = (
    <div className="flex flex-col min-w-0">

      <div
        className={cn("transition-all duration-200 rounded-2xl overflow-hidden shadow-sm border border-border", isLoading && "opacity-50 pointer-events-none")}
        style={{ backgroundColor: currentSkin.cardBg }}
      >
        <MemoizedJournalTiptapEditor
          ref={editorRef}
          content={content}
          onChange={handleContentChange}
          skinStyles={{ editorPaperBg: currentSkin.editorPaperBg, text: currentSkin.text, mutedText: currentSkin.mutedText }}
          defaultLineStyle={entryPageSettings?.lineStyle || template.defaultLineStyle || "none"}
          onClear={handleClearEntry}
        />
      </div>
    </div>
  );

  // Fullscreen portal — renders at document.body to escape all parent stacking contexts
  const fullscreenView = isFullscreen
    ? createPortal(
        <div
          className="fixed inset-0 z-[9999] flex flex-col bg-background text-foreground"
        >
          {journalHeader}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 max-w-4xl mx-auto w-full">
            {editorContent}
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      {fullscreenView}

      {!isFullscreen && (
        <>
          <PageHero
            storageKey="journal_hero_src"
            typeKey="journal_hero_type"
            badge={PAGE_HERO_TEXT.journal.badge}
            title={PAGE_HERO_TEXT.journal.title}
            subtitle={PAGE_HERO_TEXT.journal.subtitle}
          />
          {journalHeader}
          <div className="flex-1 min-h-0 grid gap-12 w-full px-6 lg:px-8 py-8 overflow-hidden grid-cols-1 lg:grid-cols-[1fr_2fr]">
            {/* Left column: Editorial + toggle panels */}
            <div className="hidden lg:flex flex-col justify-start gap-6 h-full pt-12">
              <div className="space-y-6 max-w-md">
                {/* Badge */}
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  <Sparkles className="h-4 w-4" />
                  Daily Journal
                </span>

                {/* Title */}
                <h2 className="text-3xl md:text-4xl font-light leading-tight">
                  Capture Your <span className="font-semibold">Inner World</span>
                </h2>

                {/* Description */}
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Journaling helps you process emotions, track growth, and find clarity. A few minutes each day can transform how you understand yourself.
                </p>

                <div className="h-px bg-border" />

                {/* Toggle buttons */}
                <div className="flex gap-2">
                  <Button
                    variant={activeLeftPanel === "calendar" ? "outline" : "ghost"}
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setActiveLeftPanel(activeLeftPanel === "calendar" ? null : "calendar")}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    Calendar
                  </Button>
                  <Button
                    variant={activeLeftPanel === "emotions" ? "outline" : "ghost"}
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setActiveLeftPanel(activeLeftPanel === "emotions" ? null : "emotions")}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Emotions
                  </Button>
                  <Button
                    variant={activeLeftPanel === "progress" ? "outline" : "ghost"}
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setActiveLeftPanel(activeLeftPanel === "progress" ? null : "progress")}
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    Progress
                  </Button>
                </div>

                {/* Expandable panel area */}
                {activeLeftPanel === "calendar" && (
                  <JournalSidebarPanel
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    entries={entries}
                    onInsertPrompt={handleInsertPrompt}
                    skin={currentSkin}
                    showSection="calendar"
                    searchQuery={searchQuery}
                    compact
                  />
                )}
                {activeLeftPanel === "emotions" && (
                  <JournalDateDetailsPanel selectedDate={selectedDate} wordCount={wordCount} streak={streak} skin={currentSkin} section="emotions" />
                )}
                {activeLeftPanel === "progress" && (
                  <JournalDateDetailsPanel selectedDate={selectedDate} wordCount={wordCount} streak={streak} skin={currentSkin} section="progress" />
                )}
              </div>
            </div>

            {/* Right column: Editor only (2/3 width) */}
            {editorContent}
          </div>
        </>
      )}



      {showRecentEntries && (
        <JournalRecentEntriesView
          entries={entries}
          onSelectEntry={(dateStr) => { switchDate(parseISO(dateStr)); setShowRecentEntries(false); }}
          onClose={() => setShowRecentEntries(false)}
        />
      )}
      <JournalInsightsModal open={showInsights} onOpenChange={setShowInsights} />
      <JournalSettingsModal
        open={entrySettingsOpen}
        onOpenChange={setEntrySettingsOpen}
        mode="entry"
        currentSkinId={currentSkinId}
        onSkinChange={setCurrentSkinId}
        currentLineStyle={entryPageSettings?.lineStyle || template.defaultLineStyle || "none"}
        entryMode={(entryPageSettings?.mode || journalMode) as "structured" | "unstructured"}
        onEntryOverrideSave={(skinId, lineStyle, newMode) => {
          const previousEffectiveMode = entryPageSettings?.mode || journalMode;
          setEntryPageSettings({ skinId, lineStyle, mode: newMode });
          setCurrentSkinId(skinId);

          // Only regenerate content if mode actually changed AND entry has no real user content
          if (newMode && newMode !== previousEffectiveMode) {
            try {
              const parsed = JSON.parse(content);
              const hasRealContent = parsed?.content?.some((node: any) => {
                if (node.type === "heading") return false;
                if (node.type === "paragraph") {
                  if (!node.content || node.content.length === 0) return false;
                  const textOnly = node.content.every((c: any) => c.type === "text");
                  if (textOnly && node.content.every((c: any) => !c.text?.trim())) return false;
                  return true;
                }
                return true;
              });

              if (!hasRealContent) {
                const existingTitle = extractTitle(content);
                const isUnstructured = newMode === "unstructured";
                const newContent = !isUnstructured
                  ? generateInitialContent(template.questions)
                  : JSON.stringify({
                      type: "doc",
                      content: [
                        { type: "heading", attrs: { level: 1, textAlign: "left" }, content: existingTitle ? [{ type: "text", text: existingTitle }] : [] },
                        { type: "paragraph", attrs: { textAlign: "left" }, content: [] },
                      ],
                    });
                setContent(newContent);
                lastSavedContentRef.current = "";
              }
            } catch { /* keep current content on parse error */ }
          }

          setSaveStatus("unsaved");
          if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
          autosaveTimerRef.current = setTimeout(() => performSave(), 1000);
        }}
        onEntryOverrideReset={() => {
          setEntryPageSettings(null);
          setCurrentSkinId(theme.isDark ? "midnight-dark" : template.defaultSkinId || "minimal-light");

          // Regenerate content based on global mode if entry has no real content
          try {
            const parsed = JSON.parse(content);
            const hasRealContent = parsed?.content?.some((node: any) => {
              if (node.type === "heading") return false;
              if (node.type === "paragraph") {
                if (!node.content || node.content.length === 0) return false;
                const textOnly = node.content.every((c: any) => c.type === "text");
                if (textOnly && node.content.every((c: any) => !c.text?.trim())) return false;
                return true;
              }
              return true;
            });

            if (!hasRealContent) {
              const existingTitle = extractTitle(content);
              const isUnstructured = journalMode === "unstructured";
              const newContent = !isUnstructured
                ? generateInitialContent(template.questions)
                : JSON.stringify({
                    type: "doc",
                    content: [
                      { type: "heading", attrs: { level: 1, textAlign: "left" }, content: existingTitle ? [{ type: "text", text: existingTitle }] : [] },
                      { type: "paragraph", attrs: { textAlign: "left" }, content: [] },
                    ],
                  });
              setContent(newContent);
              lastSavedContentRef.current = "";
            }
          } catch { /* keep current content */ }

          setSaveStatus("unsaved");
          if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
          autosaveTimerRef.current = setTimeout(() => performSave(), 1000);
        }}
      />
    </div>
  );
}
