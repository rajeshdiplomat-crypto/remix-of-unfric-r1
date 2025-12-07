import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Heart, PenLine, Sparkles, BarChart3, FileText, CheckSquare, MessageCircle, Share2, ThumbsUp, Smile, Send } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface DiaryEntry {
  id: string;
  type: "emotion" | "journal" | "manifest" | "habit" | "note" | "task";
  title: string;
  preview: string;
  question?: string;
  date: string;
  icon: typeof Heart;
  reactions: string[];
  comments: string[];
}

const typeConfig = {
  emotion: { icon: Heart, label: "Emotion", color: "bg-pink-500/10 text-pink-500", question: "How are you feeling?" },
  journal: { icon: PenLine, label: "Journal", color: "bg-blue-500/10 text-blue-500", question: "" },
  manifest: { icon: Sparkles, label: "Manifest", color: "bg-purple-500/10 text-purple-500", question: "What are you manifesting?" },
  habit: { icon: BarChart3, label: "Habit", color: "bg-green-500/10 text-green-500", question: "Daily habit check-in" },
  note: { icon: FileText, label: "Note", color: "bg-orange-500/10 text-orange-500", question: "" },
  task: { icon: CheckSquare, label: "Task", color: "bg-cyan-500/10 text-cyan-500", question: "" },
};

const reactionEmojis = ["👍", "❤️", "😊", "🎉", "🙏", "💪"];

export default function Diary() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [localReactions, setLocalReactions] = useState<Record<string, string[]>>({});
  const [localComments, setLocalComments] = useState<Record<string, string[]>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;

    async function fetchAllEntries() {
      setLoading(true);
      const allEntries: DiaryEntry[] = [];

      // Fetch emotions
      const { data: emotions } = await supabase
        .from("emotions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      emotions?.forEach((e) => {
        allEntries.push({
          id: e.id,
          type: "emotion",
          title: e.emotion,
          preview: e.notes || `Feeling ${e.emotion} today`,
          question: "How are you feeling today?",
          date: e.created_at,
          icon: Heart,
          reactions: [],
          comments: [],
        });
      });

      // Fetch journal entries
      const { data: journals } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      journals?.forEach((j) => {
        if (j.daily_feeling) {
          allEntries.push({
            id: `${j.id}-feeling`,
            type: "journal",
            title: "Daily Feeling",
            preview: j.daily_feeling,
            question: "How are you feeling today?",
            date: j.created_at,
            icon: PenLine,
            reactions: [],
            comments: [],
          });
        }
        if (j.daily_gratitude) {
          allEntries.push({
            id: `${j.id}-gratitude`,
            type: "journal",
            title: "Daily Gratitude",
            preview: j.daily_gratitude,
            question: "What are you grateful for?",
            date: j.created_at,
            icon: PenLine,
            reactions: [],
            comments: [],
          });
        }
        if (j.daily_kindness) {
          allEntries.push({
            id: `${j.id}-kindness`,
            type: "journal",
            title: "Daily Kindness",
            preview: j.daily_kindness,
            question: "What act of kindness did you do/receive?",
            date: j.created_at,
            icon: PenLine,
            reactions: [],
            comments: [],
          });
        }
      });

      // Fetch manifest goals
      const { data: goals } = await supabase
        .from("manifest_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      goals?.forEach((g) => {
        allEntries.push({
          id: g.id,
          type: "manifest",
          title: g.title,
          preview: g.description || "Manifestation goal",
          question: "What do you want to manifest?",
          date: g.created_at,
          icon: Sparkles,
          reactions: [],
          comments: [],
        });
      });

      // Fetch notes
      const { data: notes } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      notes?.forEach((n) => {
        allEntries.push({
          id: n.id,
          type: "note",
          title: n.title,
          preview: n.content?.substring(0, 200) || "Note",
          date: n.created_at,
          icon: FileText,
          reactions: [],
          comments: [],
        });
      });

      // Fetch tasks
      const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      tasks?.forEach((t) => {
        allEntries.push({
          id: t.id,
          type: "task",
          title: t.title,
          preview: t.description || (t.is_completed ? "Completed ✓" : "Pending"),
          date: t.created_at,
          icon: CheckSquare,
          reactions: [],
          comments: [],
        });
      });

      // Sort all entries by date
      allEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEntries(allEntries);
      setLoading(false);
    }

    fetchAllEntries();
  }, [user]);

  const addReaction = (entryId: string, emoji: string) => {
    setLocalReactions((prev) => ({
      ...prev,
      [entryId]: [...(prev[entryId] || []), emoji],
    }));
    toast({ title: "Reaction added!", description: `You reacted with ${emoji}` });
  };

  const addComment = (entryId: string) => {
    const text = commentText[entryId];
    if (!text?.trim()) return;

    setLocalComments((prev) => ({
      ...prev,
      [entryId]: [...(prev[entryId] || []), text],
    }));
    setCommentText((prev) => ({ ...prev, [entryId]: "" }));
    toast({ title: "Comment added!" });
  };

  const shareEntry = (entry: DiaryEntry) => {
    if (navigator.share) {
      navigator.share({
        title: entry.title,
        text: entry.preview,
      });
    } else {
      navigator.clipboard.writeText(entry.preview);
      toast({ title: "Copied!", description: "Entry copied to clipboard" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading your diary...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Your Diary</h1>
        <p className="text-muted-foreground mt-1">
          A timeline of all your entries across modules
        </p>
      </div>

      {entries.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <PenLine className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground">No entries yet</h3>
          <p className="text-muted-foreground mt-1">
            Start journaling, tracking emotions, or creating goals to see them here.
          </p>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-220px)]">
          <div className="space-y-4 pr-4">
            {entries.map((entry) => {
              const config = typeConfig[entry.type];
              const IconComponent = config.icon;
              const entryReactions = localReactions[entry.id] || [];
              const entryComments = localComments[entry.id] || [];

              return (
                <Card key={entry.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${config.color}`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div>
                          <Badge variant="secondary" className={`${config.color} mb-1`}>
                            {config.label}
                          </Badge>
                          <CardTitle className="text-base">{entry.title}</CardTitle>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(entry.date), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {entry.question && (
                      <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-3">
                        {entry.question}
                      </p>
                    )}
                    <p className="text-sm text-foreground">{entry.preview}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(entry.date), "EEEE, MMMM d, yyyy")}
                    </p>

                    {/* Reactions Display */}
                    {entryReactions.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {entryReactions.map((emoji, i) => (
                          <span key={i} className="text-lg">{emoji}</span>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                            <Smile className="h-4 w-4 mr-1" />
                            React
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2">
                          <div className="flex gap-1">
                            {reactionEmojis.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => addReaction(entry.id, emoji)}
                                className="text-2xl hover:scale-125 transition-transform p-1"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Comment {entryComments.length > 0 && `(${entryComments.length})`}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-3">
                            {entryComments.map((comment, i) => (
                              <div key={i} className="text-sm bg-muted p-2 rounded">
                                {comment}
                              </div>
                            ))}
                            <div className="flex gap-2">
                              <Textarea
                                value={commentText[entry.id] || ""}
                                onChange={(e) =>
                                  setCommentText((prev) => ({ ...prev, [entry.id]: e.target.value }))
                                }
                                placeholder="Add a comment..."
                                rows={2}
                                className="resize-none text-sm"
                              />
                              <Button size="icon" onClick={() => addComment(entry.id)}>
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => shareEntry(entry)}
                      >
                        <Share2 className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
