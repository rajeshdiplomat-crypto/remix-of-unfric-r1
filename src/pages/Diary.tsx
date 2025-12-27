import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PenLine } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DiaryFeedCard } from "@/components/diary/DiaryFeedCard";
import { DiarySidebar } from "@/components/diary/DiarySidebar";
import { useFeedEvents } from "@/components/diary/useFeedEvents";
import { useDiaryMetrics } from "@/components/diary/useDiaryMetrics";
import type { TimeRange, FeedEvent, SourceModule } from "@/components/diary/types";

export default function Diary() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

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
    if (!user?.id || events.length > 0) return;

    const seedFeedEvents = async () => {
      // Fetch recent activities and create feed events
      const [tasksRes, journalRes, notesRes] = await Promise.all([
        supabase.from("tasks").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
        supabase.from("journal_entries").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
        supabase.from("notes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      ]);

      const feedEvents: any[] = [];

      tasksRes.data?.forEach(task => {
        feedEvents.push({
          user_id: user.id,
          type: task.is_completed ? 'complete' : 'create',
          source_module: 'tasks',
          source_id: task.id,
          title: task.title,
          summary: task.is_completed ? 'Completed a task' : 'Created a new task',
          content_preview: task.description,
          metadata: { priority: task.priority, due_date: task.due_date },
          created_at: task.created_at,
        });
      });

      journalRes.data?.forEach(entry => {
        feedEvents.push({
          user_id: user.id,
          type: 'publish',
          source_module: 'journal',
          source_id: entry.id,
          title: `Journal Entry - ${format(new Date(entry.entry_date), 'MMM d, yyyy')}`,
          summary: 'Wrote a journal entry',
          content_preview: entry.daily_feeling || entry.daily_gratitude || 'Reflecting on the day...',
          created_at: entry.created_at,
        });
      });

      notesRes.data?.forEach(note => {
        feedEvents.push({
          user_id: user.id,
          type: 'create',
          source_module: 'notes',
          source_id: note.id,
          title: note.title,
          summary: 'Created a note',
          content_preview: note.content?.substring(0, 200),
          metadata: { category: note.category, tags: note.tags },
          created_at: note.created_at,
        });
      });

      // Insert all at once
      if (feedEvents.length > 0) {
        await supabase.from("feed_events").upsert(feedEvents, { onConflict: 'id' });
        refetch();
      }
    };

    seedFeedEvents();
  }, [user?.id]);

  const handleNavigateToSource = (event: FeedEvent) => {
    switch (event.source_module) {
      case 'tasks': navigate('/tasks'); break;
      case 'journal': navigate('/journal'); break;
      case 'notes': navigate('/notes'); break;
      case 'trackers': navigate('/trackers'); break;
      case 'manifest': navigate('/manifest'); break;
      case 'focus': navigate('/deep-focus'); break;
      default: break;
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'task': navigate('/tasks'); break;
      case 'journal': navigate('/journal'); break;
      case 'note': navigate('/notes'); break;
      case 'focus': navigate('/deep-focus'); break;
    }
  };

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading your diary...</div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 max-w-7xl mx-auto">
      {/* Main Feed */}
      <div className="flex-1 min-w-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Your Diary</h1>
          <p className="text-muted-foreground mt-1">A unified timeline of all your activities</p>
        </div>

        {events.length === 0 ? (
          <Card className="p-12 text-center">
            <PenLine className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">No entries yet</h3>
            <p className="text-muted-foreground mt-1">Start journaling, adding tasks, or notes to see them here.</p>
          </Card>
        ) : (
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-4 pr-4">
              {events.map(event => (
                <DiaryFeedCard
                  key={event.id}
                  event={event}
                  reactions={reactions[event.id] || []}
                  comments={comments[event.id] || []}
                  isSaved={saves.has(event.id)}
                  currentUserId={user?.id || ''}
                  onToggleReaction={toggleReaction}
                  onAddComment={addComment}
                  onEditComment={editComment}
                  onDeleteComment={deleteComment}
                  onToggleSave={toggleSave}
                  onNavigateToSource={handleNavigateToSource}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Right Sidebar */}
      <aside className="w-[380px] shrink-0 hidden lg:block">
        <div className="sticky top-4" style={{ height: 'calc(100vh - 32px)', overflowY: 'auto' }}>
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
