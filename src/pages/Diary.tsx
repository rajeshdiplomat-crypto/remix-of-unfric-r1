import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PenLine, Search, ChevronDown, Filter, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DiaryFeedCard } from "@/components/diary/DiaryFeedCard";
import { DiaryLeftSidebar } from "@/components/diary/DiaryLeftSidebar";

import { DiaryProfileCard } from "@/components/diary/DiaryProfileCard";
import { PageHero, PAGE_HERO_TEXT } from "@/components/common/PageHero";

import { DiaryJournalModal } from "@/components/diary/DiaryJournalModal";
import { DiaryInsightsSheet } from "@/components/diary/DiaryInsightsSheet";
import { DiaryDateSelector } from "@/components/diary/DiaryDateSelector";
import { useFeedEvents } from "@/components/diary/useFeedEvents";
import { useDiaryMetrics } from "@/components/diary/useDiaryMetrics";
import { cn } from "@/lib/utils";
import { PageLoadingScreen } from "@/components/common/PageLoadingScreen";
import type { TimeRange, FeedEvent, SourceModule } from "@/components/diary/types";
import { extractImagesFromHTML, extractImagesFromTiptapJSON } from "@/lib/editorUtils";
import { isSameDay } from "date-fns";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DEFAULT_QUESTIONS } from "@/components/journal/types";

type TimeFilter = 'all_time' | 'today' | 'yesterday' | 'last_week';
type SortOption = 'latest' | 'oldest' | 'most_active';

const FILTER_TABS = [
  { value: "all", label: "All" },
  { value: "emotions", label: "Emotions" },
  { value: "journal", label: "Journal" },
  { value: "manifest", label: "Manifest" },
  { value: "trackers", label: "Habits" },
  { value: "notes", label: "Notes" },
  { value: "tasks", label: "Tasks" },
];

const TIME_FILTER_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: "all_time", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_week", label: "Last Week" },
];

export default function Diary() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all_time');
  const [sortOption, setSortOption] = useState<SortOption>('latest');
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const {
    events,
    reactions,
    comments,
    saves,
    loading,
    filter,
    setFilter,
    toggleReaction,
    addComment,
    editComment,
    deleteComment,
    toggleSave,
    refetch,
  } = useFeedEvents(user?.id);

  const { metrics, chartData, smartInsight } = useDiaryMetrics(user?.id, timeRange);

  // Seed feed events from existing data
  const seedFeedEvents = async () => {
    if (!user?.id) return;

    // Fetch all module data including journal answers
    const [tasksRes, journalRes, journalAnswersRes, notesRes, habitsRes, habitCompletionsRes, goalsRes, emotionsRes] = await Promise.all([
      supabase.from("tasks").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("journal_answers")
        .select("*, journal_entries!inner(user_id, entry_date, created_at)")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("notes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("habits").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("habit_completions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase
        .from("manifest_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("emotions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);

    const feedEvents: any[] = [];

    // Tasks - create separate events for creation and completion
    tasksRes.data?.forEach((task) => {
      // Always add creation event
      feedEvents.push({
        user_id: user.id,
        type: "create",
        source_module: "tasks",
        source_id: task.id,
        title: task.title,
        summary: "Created a new task",
        content_preview: task.description,
        metadata: { priority: task.priority, due_date: task.due_date },
        created_at: task.created_at,
      });
      // If completed, add a separate completion event
      if (task.is_completed && task.completed_at) {
        feedEvents.push({
          user_id: user.id,
          type: "complete",
          source_module: "tasks",
          source_id: task.id,
          title: task.title,
          summary: "Completed a task ✓",
          content_preview: task.description,
          metadata: { priority: task.priority, due_date: task.due_date },
          created_at: task.completed_at,
        });
      }
      // If updated after creation
      if (task.started_at && task.started_at !== task.created_at) {
        feedEvents.push({
          user_id: user.id,
          type: "update",
          source_module: "tasks",
          source_id: task.id,
          title: task.title,
          summary: "Started working on task",
          content_preview: task.description,
          metadata: { priority: task.priority, due_date: task.due_date },
          created_at: task.started_at,
        });
      }
    });

    // Journal Answers - each answer is a separate feed event
    const answersData = journalAnswersRes.data?.filter((a: any) => a.journal_entries?.user_id === user.id) || [];

    // Build a per-question image map from TipTap JSON by splitting on H2 headings
    const journalQuestionImageMap = new Map<string, Map<string, string[]>>();
    journalRes.data?.forEach((entry) => {
      const questionImages = new Map<string, string[]>();
      if (entry.text_formatting) {
        try {
          const parsed = typeof entry.text_formatting === 'string' 
            ? JSON.parse(entry.text_formatting as string) 
            : entry.text_formatting;
          if (parsed?.content && Array.isArray(parsed.content)) {
            let currentQuestion: string | null = null;
            for (const node of parsed.content) {
              if (node.type === 'heading' && node.attrs?.level === 2 && node.content?.[0]?.text) {
                const headingText = node.content[0].text;
                const matchedQ = DEFAULT_QUESTIONS.find(q => q.text === headingText);
                currentQuestion = matchedQ?.id || headingText;
                if (!questionImages.has(currentQuestion)) questionImages.set(currentQuestion, []);
              } else if (currentQuestion) {
                const walkNode = (n: any) => {
                  if (!n) return;
                  if ((n.type === 'image' || n.type === 'imageResize') && n.attrs?.src) {
                    const src = n.attrs.src;
                    if (typeof src === 'string' && src.startsWith('http')) {
                      questionImages.get(currentQuestion!)?.push(src);
                    }
                  }
                  if (Array.isArray(n.content)) n.content.forEach(walkNode);
                };
                walkNode(node);
              }
            }
          }
        } catch {}
      }
      journalQuestionImageMap.set(entry.id, questionImages);
    });

    answersData.forEach((answer: any) => {
      const question = DEFAULT_QUESTIONS.find((q) => q.id === answer.question_id);
      const questionLabel = question?.text || answer.question_id;
      const journalEntry = answer.journal_entries;

      // Extract images from answer HTML + per-question TipTap images
      const answerImages = extractImagesFromHTML(answer.answer_text || "");
      const entryQuestionMap = journalQuestionImageMap.get(answer.journal_entry_id);
      const tiptapImages = entryQuestionMap?.get(answer.question_id) || [];
      const media = [...new Set([...answerImages, ...tiptapImages])];

      feedEvents.push({
        user_id: user.id,
        type: "journal_question",
        source_module: "journal",
        source_id: answer.id,
        title: questionLabel,
        summary: answer.answer_text || "",
        content_preview: answer.answer_text || "",
        media,
        metadata: {
          journal_date: journalEntry?.entry_date,
          entry_id: answer.journal_entry_id,
          question_id: answer.question_id,
          question_label: questionLabel,
          answer_content: answer.answer_text || "",
        },
        created_at: journalEntry?.created_at || answer.created_at,
      });
    });

    // Fallback: If no answers exist, use legacy journal entries
    if (answersData.length === 0 && journalRes.data) {
      journalRes.data.forEach((entry) => {
        const questions = [
          { id: "q1", label: "How I Feel", content: entry.daily_feeling },
          { id: "q2", label: "Gratitude", content: entry.daily_gratitude },
          { id: "q3", label: "Kindness", content: entry.daily_kindness },
        ];

        questions.forEach((question, idx) => {
          if (question.content) {
            feedEvents.push({
              user_id: user.id,
              type: "journal_question",
              source_module: "journal",
              source_id: `${entry.id}_q${idx}`,
              title: question.label,
              summary: question.content,
              content_preview: question.content,
              metadata: {
                journal_date: entry.entry_date,
                entry_id: entry.id,
                question_id: question.id,
                question_label: question.label,
                answer_content: question.content,
              },
              created_at: entry.created_at,
            });
          }
        });
      });
    }

    // Notes - extract images from cover_image_url, inline HTML, or TipTap JSON content
    notesRes.data?.forEach((note) => {
      const noteMedia: string[] = [];
      if (note.cover_image_url) noteMedia.push(note.cover_image_url);
      if (noteMedia.length === 0 && note.content) {
        // Try HTML extraction
        const htmlImages = extractImagesFromHTML(note.content);
        htmlImages.forEach(url => { if (!noteMedia.includes(url)) noteMedia.push(url); });
        // Try TipTap JSON extraction
        if (noteMedia.length === 0) {
          const jsonImages = extractImagesFromTiptapJSON(note.content);
          jsonImages.forEach(url => { if (!noteMedia.includes(url)) noteMedia.push(url); });
        }
      }
      feedEvents.push({
        user_id: user.id,
        type: "create",
        source_module: "notes",
        source_id: note.id,
        title: note.title,
        summary: "Created a note",
        content_preview: note.content ? note.content.replace(/<[^>]*>/g, '').substring(0, 200) : undefined,
        media: noteMedia,
        metadata: { category: note.category, tags: note.tags },
        created_at: note.created_at,
      });
    });

    // Trackers (Habits) - use cover_image_url from database
    habitsRes.data?.forEach((habit) => {
      const habitImage = habit.cover_image_url;
      feedEvents.push({
        user_id: user.id,
        type: "create",
        source_module: "trackers",
        source_id: habit.id,
        title: habit.name,
        summary: "Created a habit tracker",
        content_preview: habit.description,
        media: habitImage ? [habitImage] : [],
        metadata: { frequency: habit.frequency },
        created_at: habit.created_at,
      });
    });

    // Habit Completions - daily checkmark events
    const habitsMap = new Map(habitsRes.data?.map(h => [h.id, h]) || []);
    habitCompletionsRes.data?.forEach((completion) => {
      const habit = habitsMap.get(completion.habit_id);
      const habitName = habit?.name || "Habit";
      const habitImage = habit?.cover_image_url;
      feedEvents.push({
        user_id: user.id,
        type: "complete",
        source_module: "trackers",
        source_id: completion.id,
        title: habitName,
        summary: `Completed daily check-in ✓`,
        content_preview: `Marked "${habitName}" as done for ${completion.completed_date}`,
        media: habitImage ? [habitImage] : [],
        metadata: { habit_id: completion.habit_id, completed_date: completion.completed_date },
        created_at: completion.created_at,
      });
    });

    // Notes - also track updated notes
    notesRes.data?.forEach((note) => {
      if (note.updated_at && note.updated_at !== note.created_at) {
        feedEvents.push({
          user_id: user.id,
          type: "update",
          source_module: "notes",
          source_id: note.id,
          title: note.title,
          summary: "Updated a note",
          content_preview: note.content ? note.content.replace(/<[^>]*>/g, '').substring(0, 200) : undefined,
          metadata: { category: note.category },
          created_at: note.updated_at,
        });
      }
    });

    // Manifest Goals - use DB columns for vision images (no localStorage)
    goalsRes.data?.forEach((goal) => {
      const media: string[] = [];
      if (goal.cover_image_url && typeof goal.cover_image_url === "string" && goal.cover_image_url.startsWith("http")) {
        media.push(goal.cover_image_url);
      }
      // vision_images is now stored in DB as jsonb
      const visionImages = Array.isArray(goal.vision_images) ? goal.vision_images : [];
      visionImages.forEach((img: any) => {
        if (typeof img === "string" && img.startsWith("http") && !media.includes(img)) media.push(img);
      });
      feedEvents.push({
        user_id: user.id,
        type: goal.is_completed ? "complete" : "create",
        source_module: "manifest",
        source_id: goal.id,
        title: goal.title,
        summary: goal.is_completed ? "Achieved a goal!" : "Set a new manifestation goal",
        content_preview: goal.description,
        media,
        metadata: { affirmations: goal.affirmations, feeling: goal.feeling_when_achieved },
        created_at: goal.created_at,
      });
    });

    // Manifest daily practice check-ins — from DB (manifest_practices table)
    const { data: practicesData } = await supabase
      .from("manifest_practices")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    const goalsMap = new Map(goalsRes.data?.map(g => [g.id, g]) || []);
    (practicesData || []).forEach((practice: any) => {
      if (!practice.locked) return;
      const goal = goalsMap.get(practice.goal_id);
      const goalTitle = goal?.title || "Reality";
      const goalImage = goal?.cover_image_url;
      const media: string[] = [];
      if (goalImage && typeof goalImage === "string" && goalImage.startsWith("http")) media.push(goalImage);

      // Collect proof images
      const proofs = Array.isArray(practice.proofs) ? practice.proofs : [];
      proofs.forEach((p: any) => {
        if (p.image_url && typeof p.image_url === "string" && !media.includes(p.image_url)) {
          media.push(p.image_url);
        }
      });

      // Build rich content
      const contentLines: string[] = [];
      const visualizations = Array.isArray(practice.visualizations) ? practice.visualizations : [];
      if (visualizations.length > 0) contentLines.push(`🧘 Visualized ${visualizations.length}x`);
      const acts = Array.isArray(practice.acts) ? practice.acts : [];
      if (acts.length > 0) {
        contentLines.push(`⚡ Actions taken:`);
        acts.forEach((a: any) => { if (a.text) contentLines.push(`  • ${a.text}`); });
      }
      if (proofs.length > 0) {
        contentLines.push(`📸 Proof logged:`);
        proofs.forEach((p: any) => { if (p.text) contentLines.push(`  • ${p.text}`); });
      }
      const gratitudes = Array.isArray(practice.gratitudes) ? practice.gratitudes : [];
      if (gratitudes.length > 0) {
        contentLines.push(`🙏 Gratitude:`);
        gratitudes.forEach((g: any) => { if (g.text) contentLines.push(`  • ${g.text}`); });
      }
      if (practice.growth_note) contentLines.push(`💡 ${practice.growth_note}`);

      feedEvents.push({
        user_id: user.id,
        type: "checkin",
        source_module: "manifest",
        source_id: practice.id,
        title: goalTitle,
        summary: `Daily practice completed ✓`,
        content_preview: contentLines.length > 0 ? contentLines.join("\n") : "Completed daily practice",
        media,
        metadata: {
          goal_id: practice.goal_id,
          entry_date: practice.entry_date,
          visualization_count: visualizations.length,
          act_count: acts.length,
          proofs_count: proofs.length,
          gratitudes_count: gratitudes.length,
          growth_note: practice.growth_note,
        },
        created_at: practice.created_at,
      });
    });

    // Emotions check-ins
    emotionsRes.data?.forEach((emotion) => {
      let parsedEmotion = { quadrant: "", emotion: "", context: {} as any };
      try {
        const parsed = JSON.parse(emotion.emotion);
        parsedEmotion = parsed;
      } catch {
        const emotionParts = emotion.emotion.split(":");
        parsedEmotion.emotion = emotionParts[0];
        parsedEmotion.quadrant = emotionParts[1] || "";
      }

      const contextParts: string[] = [];
      if (parsedEmotion.context?.who) contextParts.push(`with ${parsedEmotion.context.who}`);
      if (parsedEmotion.context?.what) contextParts.push(`while ${parsedEmotion.context.what}`);

      const emotionLabel = parsedEmotion.emotion || "Unknown";
      const summary = contextParts.length > 0 ? contextParts.join(" ") : null;

      feedEvents.push({
        user_id: user.id,
        type: "checkin",
        source_module: "emotions",
        source_id: emotion.id,
        title: `Feeling ${emotionLabel.charAt(0).toUpperCase() + emotionLabel.slice(1)}`,
        summary: summary,
        content_preview: emotion.notes,
        metadata: {
          quadrant: parsedEmotion.quadrant,
          emotion: parsedEmotion.emotion,
          context: parsedEmotion.context,
          tags: emotion.tags,
          entry_date: emotion.entry_date,
        },
        created_at: emotion.created_at,
      });
    });

    // Delete existing feed events first to avoid duplicates, then insert fresh
    if (feedEvents.length > 0) {
      await supabase.from("feed_events").delete().eq("user_id", user.id);
      await supabase.from("feed_events").insert(feedEvents);
      refetch();
    }
  };

  // Seed feed events on mount
  useEffect(() => {
    if (!user?.id) return;
    seedFeedEvents();
  }, [user?.id]);

  // Real-time subscriptions for tasks and habits
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("diary-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${user.id}` }, () => {
        seedFeedEvents();
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "habits", filter: `user_id=eq.${user.id}` },
        () => {
          seedFeedEvents();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "habit_completions", filter: `user_id=eq.${user.id}` },
        () => {
          seedFeedEvents();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleNavigateToSource = (event: FeedEvent) => {
    switch (event.source_module) {
      case "tasks":
        navigate("/tasks");
        break;
      case "journal":
        navigate("/journal");
        break;
      case "notes":
        navigate("/notes");
        break;
      case "trackers":
        navigate("/habits");
        break;
      case "manifest":
        navigate("/manifest");
        break;
      case "emotions":
        navigate("/emotions");
        break;
      default:
        break;
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "task":
        navigate("/tasks");
        break;
      case "journal":
        setIsJournalModalOpen(true);
        break;
      case "note":
        navigate("/notes");
        break;
      case "activity":
        navigate("/habits");
        break;
      case "manifest":
        navigate("/manifest");
        break;
      case "emotions":
        navigate("/emotions");
        break;
    }
  };

  const handleJournalSuccess = () => {
    seedFeedEvents();
  };

  // Filter events based on search, time filter, and selected date
  const filteredEvents = events.filter((event) => {
    // Date filter - show only events matching selected date
    const eventDate = new Date(event.created_at);
    if (!isSameDay(eventDate, selectedDate)) {
      // Also check metadata entry_date
      const metadata = event.metadata as any;
      const entryDateStr = metadata?.entry_date || metadata?.completed_date;
      if (entryDateStr) {
        const entryDate = new Date(entryDateStr + 'T12:00:00');
        if (!isSameDay(entryDate, selectedDate)) return false;
      } else {
        return false;
      }
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = event.title.toLowerCase().includes(query) ||
        event.content_preview?.toLowerCase().includes(query) ||
        event.summary?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    // Time filter
    if (timeFilter !== 'all_time') {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterdayStart = new Date(todayStart.getTime() - 86400000);
      const lastWeekStart = new Date(todayStart.getTime() - 7 * 86400000);
      
      if (timeFilter === 'today' && eventDate < todayStart) return false;
      if (timeFilter === 'yesterday' && (eventDate < yesterdayStart || eventDate >= todayStart)) return false;
      if (timeFilter === 'last_week' && eventDate < lastWeekStart) return false;
    }
    return true;
  });

  // Sort events
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (sortOption === 'oldest') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    if (sortOption === 'most_active') {
      // Sort by reaction/comment count (most interactions first)
      const aActivity = (reactions[a.id]?.length || 0) + (comments[a.id]?.length || 0);
      const bActivity = (reactions[b.id]?.length || 0) + (comments[b.id]?.length || 0);
      return bActivity - aActivity;
    }
    // Default: latest first
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const [loadingFinished, setLoadingFinished] = useState(false);
  const userName = user?.email?.split("@")[0] || "User";

  const isDataReady = !loading || events.length > 0;

  return (
    <>
    {!loadingFinished && (
      <PageLoadingScreen
        module="diary"
        isDataReady={isDataReady}
        onFinished={() => setLoadingFinished(true)}
      />
    )}
    <div
      className="flex flex-col w-full h-full overflow-hidden"
    >
      {/* Full-width Hero */}
      <PageHero
        storageKey="diary_hero_src"
        typeKey="diary_hero_type"
        badge={PAGE_HERO_TEXT.diary.badge}
        title={PAGE_HERO_TEXT.diary.title}
        subtitle={PAGE_HERO_TEXT.diary.subtitle}
      />

      {/* 3-Column Layout Below Hero */}
      <div className="flex flex-1 w-full max-w-[1400px] mx-auto overflow-hidden min-h-0">
        {/* Left Sidebar - Editorial style */}
        <aside className="hidden lg:flex flex-col w-[380px] shrink-0 h-full min-h-0 overflow-y-auto border-r border-border/20">
          <DiaryLeftSidebar 
            userName={userName}
            filter={filter}
            onFilterChange={setFilter}
          />
        </aside>

        {/* Center Feed - Scrollable */}
        <main className="flex-1 min-w-0 min-h-0 h-full overflow-y-auto bg-muted/20">
          <div className="w-full px-2 sm:px-4 lg:px-6 py-3 sm:py-4">

          {/* Date Selector + Insights button (mobile) */}
          <div className="flex items-center justify-center gap-2 mb-4 relative">
            <DiaryDateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
            {/* Insights icon - visible only on mobile/tablet (hidden on xl where sidebar shows) */}
            <Button
              variant="ghost"
              size="icon"
              className="xl:hidden absolute right-0 h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={() => setIsInsightsOpen(true)}
              title="Insights"
            >
              <BarChart3 className="h-5 w-5" />
            </Button>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <div className="flex items-center gap-2 bg-card border border-border/40 rounded-xl px-3 py-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search your feed..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 bg-transparent focus-visible:ring-0 px-0 h-9 text-sm placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 mb-4 overflow-x-auto border-b border-border/40">
            {FILTER_TABS.map((tab) => (
              <Button
                key={tab.value}
                variant={filter === tab.value ? "chipActive" : "chip"}
                size="chip"
                onClick={() => setFilter(tab.value as SourceModule | "all" | "saved")}
              >
                {tab.label}
              </Button>
            ))}

            {/* Time Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="chip" size="chip" className="ml-auto">
                  <Filter className="h-3 w-3 mr-1" />
                  {TIME_FILTER_OPTIONS.find(o => o.value === timeFilter)?.label || 'All Time'}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {TIME_FILTER_OPTIONS.map(opt => (
                  <DropdownMenuItem 
                    key={opt.value} 
                    onClick={() => setTimeFilter(opt.value)}
                    className={timeFilter === opt.value ? "bg-muted font-medium" : ""}
                  >
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="chip" size="chip">
                  {sortOption === 'latest' ? 'Latest' : sortOption === 'oldest' ? 'Oldest' : 'Most Active'}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortOption('latest')} className={sortOption === 'latest' ? "bg-muted font-medium" : ""}>
                  Latest
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption('oldest')} className={sortOption === 'oldest' ? "bg-muted font-medium" : ""}>
                  Oldest
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption('most_active')} className={sortOption === 'most_active' ? "bg-muted font-medium" : ""}>
                  Most Active
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Feed Cards */}
          {sortedEvents.length === 0 ? (
            <Card className="p-12 text-center bg-card border-border/40">
              <PenLine className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground">No entries yet</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Start journaling, adding tasks, or notes to see them here.
              </p>
            </Card>
          ) : (
            <div className="pb-16 space-y-4">
              {sortedEvents.map((event) => (
                  <DiaryFeedCard
                    key={event.id}
                    event={event}
                    reactions={reactions[event.id] || []}
                    comments={comments[event.id] || []}
                    isSaved={saves.has(event.id)}
                    currentUserId={user?.id || ""}
                    onToggleReaction={toggleReaction}
                    onAddComment={addComment}
                    onEditComment={editComment}
                    onDeleteComment={deleteComment}
                    onToggleSave={toggleSave}
                    onNavigateToSource={handleNavigateToSource}
                  />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Right Sidebar */}
      <aside className="hidden xl:flex flex-col w-[340px] shrink-0 h-full min-h-0 overflow-y-auto border-l border-border/20 bg-background/50 p-4 gap-4">
        <DiaryProfileCard
          userName={userName}
          userEmail={user?.email || ""}
          avatarUrl={user?.user_metadata?.avatar_url}
          metrics={metrics}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />
      </aside>
      </div>

      {/* Journal Modal */}
      <DiaryJournalModal
        open={isJournalModalOpen}
        onOpenChange={setIsJournalModalOpen}
        onSuccess={handleJournalSuccess}
      />

      {/* Insights Bottom Sheet (mobile/tablet) */}
      <DiaryInsightsSheet
        open={isInsightsOpen}
        onOpenChange={setIsInsightsOpen}
        userName={userName}
        userEmail={user?.email || ""}
        avatarUrl={user?.user_metadata?.avatar_url}
        metrics={metrics}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
      />
    </div>
    </>
  );
}
