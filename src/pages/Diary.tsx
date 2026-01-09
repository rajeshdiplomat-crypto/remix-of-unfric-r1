import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PenLine, Search, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DiaryFeedCard } from "@/components/diary/DiaryFeedCard";
import { DiarySidebar } from "@/components/diary/DiarySidebar";
import { JournalQuestionCard } from "@/components/diary/JournalQuestionCard";
import { DiaryHero } from "@/components/diary/DiaryHero";
import { DiaryJournalModal } from "@/components/diary/DiaryJournalModal";
import { useFeedEvents } from "@/components/diary/useFeedEvents";
import { useDiaryMetrics } from "@/components/diary/useDiaryMetrics";
import { cn } from "@/lib/utils";
import { PageLoadingScreen } from "@/components/common/PageLoadingScreen";
import type { TimeRange, FeedEvent, SourceModule } from "@/components/diary/types";
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
      supabase
        .from("emotions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
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

    answersData.forEach((answer: any) => {
      const question = DEFAULT_QUESTIONS.find((q) => q.id === answer.question_id);
      const questionLabel = question?.text || answer.question_id;
      const journalEntry = answer.journal_entries;

      feedEvents.push({
        user_id: user.id,
        type: "journal_question",
        source_module: "journal",
        source_id: answer.id,
        title: questionLabel,
        summary: answer.answer_text || "",
        content_preview: answer.answer_text || "",
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

    // Notes
    notesRes.data?.forEach((note) => {
      feedEvents.push({
        user_id: user.id,
        type: "create",
        source_module: "notes",
        source_id: note.id,
        title: note.title,
        summary: "Created a note",
        content_preview: note.content?.substring(0, 200),
        metadata: { category: note.category, tags: note.tags },
        created_at: note.created_at,
      });
    });

    // Trackers (Habits)
    habitsRes.data?.forEach((habit) => {
      feedEvents.push({
        user_id: user.id,
        type: "create",
        source_module: "trackers",
        source_id: habit.id,
        title: habit.name,
        summary: "Created a habit tracker",
        content_preview: habit.description,
        metadata: { frequency: habit.frequency },
        created_at: habit.created_at,
      });
    });

    // Manifest Goals
    goalsRes.data?.forEach((goal) => {
      feedEvents.push({
        user_id: user.id,
        type: goal.is_completed ? "complete" : "create",
        source_module: "manifest",
        source_id: goal.id,
        title: goal.title,
        summary: goal.is_completed ? "Achieved a goal!" : "Set a new manifestation goal",
        content_preview: goal.description,
        metadata: { affirmations: goal.affirmations, feeling: goal.feeling_when_achieved },
        created_at: goal.created_at,
      });
    });

    // Emotions check-ins
    emotionsRes.data?.forEach((emotion) => {
      let parsedEmotion = { quadrant: '', emotion: '', context: {} as any };
      try {
        // Try to parse as JSON first (new format from EmotionSliderPicker)
        const parsed = JSON.parse(emotion.emotion);
        parsedEmotion = parsed;
      } catch {
        // Fallback for old colon-separated format
        const emotionParts = emotion.emotion.split(":");
        parsedEmotion.emotion = emotionParts[0];
        parsedEmotion.quadrant = emotionParts[1] || '';
      }

      const contextParts: string[] = [];
      if (parsedEmotion.context?.who) contextParts.push(`with ${parsedEmotion.context.who}`);
      if (parsedEmotion.context?.what) contextParts.push(`while ${parsedEmotion.context.what}`);

      const emotionLabel = parsedEmotion.emotion || 'Unknown';
      const summary = contextParts.length > 0 ? contextParts.join(' ') : null;

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
          entry_date: emotion.entry_date 
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${user.id}` },
        () => {
          // Re-seed feed when tasks change
          seedFeedEvents();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "habits", filter: `user_id=eq.${user.id}` },
        () => {
          // Re-seed feed when habits change
          seedFeedEvents();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "habit_completions", filter: `user_id=eq.${user.id}` },
        () => {
          // Re-seed feed when habit completions change
          seedFeedEvents();
        }
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

  if (loading && events.length === 0) {
    return <PageLoadingScreen module="diary" />;
  }

  return (
    <div className="flex flex-col w-full flex-1">
      {/* Full-bleed Hero */}
      <DiaryHero />

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 w-full px-6 lg:px-8 pt-6">
        {/* Main Feed */}
        <div className="min-w-0 overflow-hidden">

        {/* Search Bar */}
        <div className="mb-4">
          <div className="flex items-center gap-2 bg-card border border-border/40 rounded-xl px-3 py-1">
            <Search className="h-2 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 px-0 h-8 text-sm placeholder:text-muted-foreground"
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
                "h-6 px-0 text-[10px] uppercase tracking-zara-wide font-light rounded-none whitespace-nowrap hover:bg-transparent",
                filter === tab.value
                  ? "text-foreground border-b border-foreground"
                  : "text-muted-foreground hover:text-foreground border-b border-transparent",
              )}
              onClick={() => setFilter(tab.value as SourceModule | "all" | "saved")}
            >
              {tab.label}
            </Button>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-3 text-sm text-muted-foreground ml-auto">
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

        {sortedEvents.length === 0 ? (
          <Card className="p-12 text-center bg-card border-border/40">
            <PenLine className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">No entries yet</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Start journaling, adding tasks, or notes to see them here.
            </p>
          </Card>
        ) : (
          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-4 pr-2">
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
                    authorName={user?.email?.split("@")[0] || "You"}
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
          </ScrollArea>
        )}
      </div>

      {/* Right Sidebar */}
      <aside className="hidden lg:flex flex-col h-full overflow-y-auto">
        <DiarySidebar
          metrics={metrics}
          chartData={chartData}
          smartInsight={smartInsight}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          filter={filter}
          onFilterChange={setFilter}
          onQuickAction={handleQuickAction}
        />
      </aside>
    </div>

      {/* Journal Entry Modal */}
      <DiaryJournalModal
        open={isJournalModalOpen}
        onOpenChange={setIsJournalModalOpen}
        onSuccess={handleJournalSuccess}
      />
    </div>
  );
}
