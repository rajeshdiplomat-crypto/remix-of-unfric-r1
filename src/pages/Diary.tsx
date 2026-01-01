import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PenLine, Search, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DiaryFeedCard } from "@/components/diary/DiaryFeedCard";
import { DiarySidebar } from "@/components/diary/DiarySidebar";
import { JournalQuestionCard } from "@/components/diary/JournalQuestionCard";
import { useFeedEvents } from "@/components/diary/useFeedEvents";
import { useDiaryMetrics } from "@/components/diary/useDiaryMetrics";
import { cn } from "@/lib/utils";
import type { TimeRange, FeedEvent, SourceModule } from "@/components/diary/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Helper to extract plain text from TipTap JSON
const extractTextFromTiptap = (json: any): string => {
  if (!json) return "";
  try {
    const parsed = typeof json === "string" ? JSON.parse(json) : json;
    const extractText = (node: any): string => {
      if (!node) return "";
      if (node.text) return node.text;
      if (node.content && Array.isArray(node.content)) {
        return node.content.map(extractText).join(" ");
      }
      return "";
    };
    return extractText(parsed).trim();
  } catch {
    return "";
  }
};

const FILTER_TABS = [
  { value: "all", label: "All" },
  { value: "journal", label: "Journal" },
  { value: "tasks", label: "Tasks" },
  { value: "notes", label: "Notes" },
  { value: "trackers", label: "Trackers" },
  { value: "manifest", label: "Manifest" },
  { value: "focus", label: "Focus" },
];

export default function Diary() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const [searchQuery, setSearchQuery] = useState("");

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
    createFeedEvent,
    refetch,
  } = useFeedEvents(user?.id);

  const { metrics, chartData, smartInsight } = useDiaryMetrics(user?.id, timeRange);

  // Seed feed events from existing data on mount
  useEffect(() => {
    if (!user?.id) return;

    const seedFeedEvents = async () => {
      // Fetch all module data including emotions
      const [tasksRes, journalRes, notesRes, habitsRes, goalsRes, emotionsRes] = await Promise.all([
        supabase.from("tasks").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
        supabase
          .from("journal_entries")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
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

      // Journal - create separate feed events for each question
      journalRes.data?.forEach((entry) => {
        const questions = [
          { label: "How I Feel", content: entry.daily_feeling },
          { label: "Gratitude", content: entry.daily_gratitude },
          { label: "Kindness", content: entry.daily_kindness },
        ];

        // Extract body content from TipTap JSON (text_formatting field)
        const bodyContent = extractTextFromTiptap(entry.text_formatting);

        // Add body content as a separate question card if it exists
        if (bodyContent) {
          questions.push({ label: "Journal Entry", content: bodyContent });
        }

        // Create a separate feed event for each question
        questions.forEach((question, idx) => {
          feedEvents.push({
            user_id: user.id,
            type: "journal_question",
            source_module: "journal",
            source_id: `${entry.id}_q${idx}`,
            title: question.label,
            summary: question.content || "",
            content_preview: question.content || "",
            metadata: {
              tags: entry.tags || [],
              journal_date: entry.entry_date, // The date being written about
              entry_id: entry.id,
              question_label: question.label,
              answer_content: question.content || "",
            },
            created_at: entry.created_at, // When user wrote it
          });
        });
      });

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
        const emotionParts = emotion.emotion.split(":");
        const primaryEmotion = emotionParts[0];
        const secondaryEmotion = emotionParts[1] && !Number(emotionParts[1]) ? emotionParts[1] : null;
        const intensity = emotionParts[emotionParts.length - 1];

        feedEvents.push({
          user_id: user.id,
          type: "checkin",
          source_module: "emotions",
          source_id: emotion.id,
          title: `Emotion Check-in: ${primaryEmotion.charAt(0).toUpperCase() + primaryEmotion.slice(1)}${secondaryEmotion ? ` - ${secondaryEmotion}` : ""}`,
          summary: `Feeling ${primaryEmotion} (intensity: ${intensity}/10)`,
          content_preview: emotion.notes,
          metadata: { tags: emotion.tags, intensity, primary: primaryEmotion, secondary: secondaryEmotion },
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

    seedFeedEvents();
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
        navigate("/journal");
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
    }
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

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading your diary...</div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 w-full flex-1">
      {/* Main Feed */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Your Diary</h1>
          <p className="text-muted-foreground text-sm mt-0.5">A timeline of everything you do in MindFlow</p>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="flex items-center gap-2 bg-card border border-border/40 rounded-lg px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 px-0 h-8 text-sm placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
          {FILTER_TABS.map((tab) => (
            <Button
              key={tab.value}
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-3 text-sm rounded-md whitespace-nowrap",
                filter === tab.value
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
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

        {filteredEvents.length === 0 ? (
          <Card className="p-12 text-center bg-card border-border/40">
            <PenLine className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">No entries yet</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Start journaling, adding tasks, or notes to see them here.
            </p>
          </Card>
        ) : (
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-4 pr-2">
              {filteredEvents.map((event) => 
                event.type === "journal_question" ? (
                  <JournalQuestionCard
                    key={event.id}
                    questionLabel={(event.metadata as any)?.question_label || event.title}
                    answerContent={(event.metadata as any)?.answer_content || event.content_preview || ""}
                    journalDate={(event.metadata as any)?.journal_date || event.created_at}
                    entryDate={event.created_at}
                    emotionTag={(event.metadata as any)?.tags?.[0]}
                    isSaved={saves.has(event.id)}
                    onToggleSave={() => toggleSave(event.id)}
                    onEdit={() => handleNavigateToSource(event)}
                    onNavigate={() => handleNavigateToSource(event)}
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
                )
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Right Sidebar */}
      <aside className="w-[400px] shrink-0 hidden lg:block">
        <div className="sticky top-4" style={{ height: "calc(100vh - 32px)", overflowY: "auto" }}>
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
        </div>
      </aside>
    </div>
  );
}
