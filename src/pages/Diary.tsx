import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PenLine, Search, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DiaryFeedCard } from "@/components/diary/DiaryFeedCard";
import { DiarySidebar } from "@/components/diary/DiarySidebar";
import { DiaryLeftSidebar } from "@/components/diary/DiaryLeftSidebar";
import { DiaryCreatePost } from "@/components/diary/DiaryCreatePost";
import { PageHero, PAGE_HERO_TEXT } from "@/components/common/PageHero";
import { JournalQuestionCard } from "@/components/diary/JournalQuestionCard";
import { DiaryJournalModal } from "@/components/diary/DiaryJournalModal";
import { useFeedEvents } from "@/components/diary/useFeedEvents";
import { useDiaryMetrics } from "@/components/diary/useDiaryMetrics";
import { cn } from "@/lib/utils";
import { PageLoadingScreen } from "@/components/common/PageLoadingScreen";
import type { TimeRange, FeedEvent, SourceModule } from "@/components/diary/types";
import { extractImagesFromHTML, extractImagesFromTiptapJSON } from "@/lib/editorUtils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DEFAULT_QUESTIONS } from "@/components/journal/types";

const FILTER_TABS = [
  { value: "all", label: "All" },
  { value: "journal", label: "Journal" },
  { value: "tasks", label: "Tasks" },
  { value: "notes", label: "Notes" },
  { value: "trackers", label: "Trackers" },
  { value: "manifest", label: "Manifest" },
  { value: "focus", label: "Focus" },
  { value: "emotions", label: "Emotions" },
];

export default function Diary() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const [searchQuery, setSearchQuery] = useState("");
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);

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
    const [tasksRes, journalRes, journalAnswersRes, notesRes, habitsRes, goalsRes, emotionsRes] = await Promise.all([
      supabase.from("tasks").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
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
      supabase.from("notes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("habits").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase
        .from("manifest_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("emotions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);

    const feedEvents: any[] = [];

    // Tasks
    tasksRes.data?.forEach((task) => {
      feedEvents.push({
        user_id: user.id,
        type: task.is_completed ? "complete" : "create",
        source_module: "tasks",
        source_id: task.id,
        title: task.title,
        summary: task.is_completed ? "Completed a task" : "Created a new task",
        content_preview: task.description,
        metadata: { priority: task.priority, due_date: task.due_date },
        created_at: task.created_at,
      });
    });

    // Journal Answers - each answer is a separate feed event
    const answersData = journalAnswersRes.data?.filter((a: any) => a.journal_entries?.user_id === user.id) || [];

    // Build a map of journal entry images from images_data AND text_formatting (TipTap JSON)
    const journalImageMap = new Map<string, string[]>();
    journalRes.data?.forEach((entry) => {
      const images: string[] = [];
      // 1. Extract from images_data column
      if (entry.images_data) {
        try {
          const parsed = typeof entry.images_data === 'string' ? JSON.parse(entry.images_data as string) : entry.images_data;
          if (Array.isArray(parsed)) {
            parsed.forEach((img: any) => {
              const url = typeof img === 'string' ? img : img?.url || img?.src;
              if (url && typeof url === 'string' && url.startsWith('http')) images.push(url);
            });
          }
        } catch {}
      }
      // 2. Extract from text_formatting (TipTap JSON content) - this is where inline images live
      if (entry.text_formatting) {
        const tiptapImages = extractImagesFromTiptapJSON(entry.text_formatting as string);
        tiptapImages.forEach(url => {
          if (!images.includes(url)) images.push(url);
        });
      }
      journalImageMap.set(entry.id, images);
    });

    answersData.forEach((answer: any) => {
      const question = DEFAULT_QUESTIONS.find((q) => q.id === answer.question_id);
      const questionLabel = question?.text || answer.question_id;
      const journalEntry = answer.journal_entries;

      // Extract images from answer HTML content
      const answerImages = extractImagesFromHTML(answer.answer_text || "");
      // Also get entry-level images
      const entryImages = journalImageMap.get(answer.journal_entry_id) || [];
      const media = [...new Set([...entryImages, ...answerImages])];

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
        content_preview: note.content?.substring(0, 200),
        media: noteMedia,
        metadata: { category: note.category, tags: note.tags },
        created_at: note.created_at,
      });
    });

    // Trackers (Habits) - use cover_image_url from database
    habitsRes.data?.forEach((habit) => {
      feedEvents.push({
        user_id: user.id,
        type: "create",
        source_module: "trackers",
        source_id: habit.id,
        title: habit.name,
        summary: "Created a habit tracker",
        content_preview: habit.description,
        media: habit.cover_image_url ? [habit.cover_image_url] : [],
        metadata: { frequency: habit.frequency },
        created_at: habit.created_at,
      });
    });

    // Manifest Goals - also check localStorage extras for vision images
    const manifestExtras = JSON.parse(localStorage.getItem("manifest_goal_extras") || "{}");
    goalsRes.data?.forEach((goal) => {
      const extras = manifestExtras[goal.id] || {};
      const visionUrl = goal.cover_image_url || extras.vision_image_url;
      // Collect all valid image URLs (exclude base64)
      const media: string[] = [];
      if (visionUrl && typeof visionUrl === "string" && visionUrl.startsWith("http")) media.push(visionUrl);
      if (extras.vision_images?.length) {
        extras.vision_images.forEach((img: string) => {
          if (typeof img === "string" && img.startsWith("http") && !media.includes(img)) media.push(img);
        });
      }
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
        navigate("/trackers");
        break;
      case "manifest":
        navigate("/manifest");
        break;
      case "focus":
        navigate("/deep-focus");
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
        navigate("/trackers");
        break;
      case "manifest":
        navigate("/manifest");
        break;
      case "focus":
        navigate("/deep-focus");
        break;
      case "emotions":
        navigate("/emotions");
        break;
    }
  };

  const handleJournalSuccess = () => {
    seedFeedEvents();
  };

  // Filter events based on search
  const filteredEvents = events.filter((event) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      event.title.toLowerCase().includes(query) ||
      event.content_preview?.toLowerCase().includes(query) ||
      event.summary?.toLowerCase().includes(query)
    );
  });

  // Sort by entry date (newest first)
  const sortedEvents = [...filteredEvents].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const [contentReady, setContentReady] = useState(false);
  const userName = user?.email?.split("@")[0] || "User";

  useEffect(() => {
    if (!loading || events.length > 0) {
      const timer = setTimeout(() => setContentReady(true), 100);
      return () => clearTimeout(timer);
    }
  }, [loading, events.length]);

  if (loading && events.length === 0) {
    return <PageLoadingScreen module="diary" />;
  }

  return (
    <div
      className={cn(
        "flex flex-col w-full h-full overflow-hidden",
        "transition-all duration-500 ease-out",
        contentReady ? "opacity-100" : "opacity-0",
      )}
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
      <div className="flex flex-1 w-full overflow-hidden min-h-0">
        {/* Left Sidebar - Hidden on mobile/tablet, visible on desktop */}
        <aside className="hidden lg:flex flex-col w-[280px] shrink-0 h-full overflow-y-auto border-r border-border/20 bg-background">
          <DiaryLeftSidebar 
            userName={userName}
            filter={filter}
            onFilterChange={setFilter}
          />
        </aside>

        {/* Center Feed - Scrollable */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto bg-muted/20">
          <div className="w-full px-4 lg:px-6 py-4">
            {/* Create Post Box */}
            <DiaryCreatePost 
              userName={userName}
              onOpenJournal={() => setIsJournalModalOpen(true)}
            />

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
          <div className="flex items-center gap-4 mb-4 overflow-x-auto pb-1">
            {FILTER_TABS.map((tab) => (
              <Button
                key={tab.value}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 px-3 text-xs font-medium rounded-full whitespace-nowrap",
                  filter === tab.value
                    ? "bg-primary/10 text-primary hover:bg-primary/15"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                onClick={() => setFilter(tab.value as SourceModule | "all" | "saved")}
              >
                {tab.label}
              </Button>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-3 text-xs text-muted-foreground ml-auto">
                  Latest <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Latest</DropdownMenuItem>
                <DropdownMenuItem>Oldest</DropdownMenuItem>
                <DropdownMenuItem>Most Active</DropdownMenuItem>
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
            <div className="space-y-4 pb-8">
              {sortedEvents.map((event) =>
                event.type === "journal_question" ? (
                  <JournalQuestionCard
                    key={event.id}
                    eventId={event.id}
                    questionLabel={(event.metadata as any)?.question_label || event.title}
                    answerContent={(event.metadata as any)?.answer_content || event.content_preview || ""}
                    contentHtml={(event.metadata as any)?.content_html}
                    journalDate={(event.metadata as any)?.journal_date || event.created_at}
                    entryDate={event.created_at}
                    emotionTag={(event.metadata as any)?.tags?.[0]}
                    authorName={userName}
                    isSaved={saves.has(event.id)}
                    userReaction={reactions[event.id]?.find((r) => r.user_id === user?.id)?.emoji as any}
                    reactionCounts={reactions[event.id]?.reduce(
                      (acc, r) => {
                        acc[r.emoji as any] = (acc[r.emoji as any] || 0) + 1;
                        return acc;
                      },
                      {} as Record<string, number>,
                    )}
                    onToggleSave={() => toggleSave(event.id)}
                    onEdit={() => handleNavigateToSource(event)}
                    onNavigate={() => handleNavigateToSource(event)}
                    onToggleReaction={(eventId, reaction) => toggleReaction(eventId, reaction || "")}
                    onAddComment={(eventId, text) => addComment(eventId, text)}
                  />
                ) : (
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
                ),
              )}
            </div>
          )}
        </div>
      </main>

      {/* Right Sidebar - Hidden on mobile/tablet, visible on large desktop */}
      <aside className="hidden xl:flex flex-col w-[340px] shrink-0 h-full overflow-y-auto border-l border-border/20 bg-background/50 p-4">
        <DiarySidebar
          metrics={metrics}
          smartInsight={smartInsight}
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
    </div>
  );
}
