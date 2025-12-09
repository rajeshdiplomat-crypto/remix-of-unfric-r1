import { useEffect, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Heart, PenLine, Sparkles, BarChart3, FileText, CheckSquare, MessageCircle, Share2, ThumbsUp, Send, MoreHorizontal, Globe } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { LucideIcon } from "lucide-react";

interface Comment {
  text: string;
  timestamp: Date;
}

interface DiaryEntry {
  id: string;
  type: "emotion" | "journal" | "manifest" | "habit" | "note" | "task";
  title: string;
  preview: string;
  question?: string;
  date: string;
  icon: LucideIcon;
  reactions: string[];
  comments: string[];
}

const typeConfig: Record<string, { icon: LucideIcon; label: string; color: string; question: string }> = {
  emotion: { icon: Heart, label: "Emotion", color: "bg-pink-500/10 text-pink-500", question: "How are you feeling?" },
  journal: { icon: PenLine, label: "Journal", color: "bg-blue-500/10 text-blue-500", question: "" },
  manifest: { icon: Sparkles, label: "Manifest", color: "bg-purple-500/10 text-purple-500", question: "What are you manifesting?" },
  habit: { icon: BarChart3, label: "Habit", color: "bg-green-500/10 text-green-500", question: "Daily habit check-in" },
  note: { icon: FileText, label: "Note", color: "bg-orange-500/10 text-orange-500", question: "" },
  task: { icon: CheckSquare, label: "Task", color: "bg-cyan-500/10 text-cyan-500", question: "" },
};

const reactionEmojis = ["👍", "❤️", "😂", "😮", "😢", "😡"];

export default function Diary() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userReaction, setUserReaction] = useState<Record<string, string | null>>({});
  const [reactionCounts, setReactionCounts] = useState<Record<string, Record<string, number>>>({});
  const [localComments, setLocalComments] = useState<Record<string, Comment[]>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

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

  const toggleReaction = (entryId: string, emoji: string) => {
    setUserReaction((prev) => {
      const currentReaction = prev[entryId];
      const newReaction = currentReaction === emoji ? null : emoji;
      
      // Update counts
      setReactionCounts((prevCounts) => {
        const entryCounts = { ...(prevCounts[entryId] || {}) };
        
        // Remove old reaction count
        if (currentReaction) {
          entryCounts[currentReaction] = Math.max(0, (entryCounts[currentReaction] || 1) - 1);
          if (entryCounts[currentReaction] === 0) delete entryCounts[currentReaction];
        }
        
        // Add new reaction count
        if (newReaction) {
          entryCounts[newReaction] = (entryCounts[newReaction] || 0) + 1;
        }
        
        return { ...prevCounts, [entryId]: entryCounts };
      });
      
      return { ...prev, [entryId]: newReaction };
    });
  };

  const addComment = (entryId: string) => {
    const text = commentText[entryId];
    if (!text?.trim()) return;

    const newComment: Comment = {
      text: text.trim(),
      timestamp: new Date(),
    };

    setLocalComments((prev) => ({
      ...prev,
      [entryId]: [...(prev[entryId] || []), newComment],
    }));
    setCommentText((prev) => ({ ...prev, [entryId]: "" }));
  };

  const handleKeyPress = (e: React.KeyboardEvent, entryId: string) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addComment(entryId);
    }
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

  const getTotalReactions = (entryId: string) => {
    const counts = reactionCounts[entryId] || {};
    return Object.values(counts).reduce((a, b) => a + b, 0);
  };

  const getTopReactions = (entryId: string) => {
    const counts = reactionCounts[entryId] || {};
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([emoji]) => emoji);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading your diary...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="mb-6">
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
              const entryComments = localComments[entry.id] || [];
              const currentReaction = userReaction[entry.id];
              const totalReactions = getTotalReactions(entry.id);
              const topReactions = getTopReactions(entry.id);
              const isExpanded = expandedComments[entry.id];

              return (
                <Card key={entry.id} className="overflow-hidden">
                  {/* Post Header */}
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${config.color}`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground">{entry.title}</span>
                            <Badge variant="secondary" className={`${config.color} text-xs px-1.5 py-0`}>
                              {config.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>{formatDistanceToNow(new Date(entry.date), { addSuffix: true })}</span>
                            <span>·</span>
                            <Globe className="h-3 w-3" />
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-3">
                    {/* Post Content */}
                    {entry.question && (
                      <p className="text-xs text-muted-foreground italic">
                        {entry.question}
                      </p>
                    )}
                    <p className="text-sm text-foreground leading-relaxed">{entry.preview}</p>

                    {/* Reactions & Comments Count */}
                    {(totalReactions > 0 || entryComments.length > 0) && (
                      <div className="flex items-center justify-between text-xs text-muted-foreground py-1">
                        <div className="flex items-center gap-1">
                          {topReactions.length > 0 && (
                            <>
                              <div className="flex -space-x-1">
                                {topReactions.map((emoji, i) => (
                                  <span key={i} className="text-sm bg-muted rounded-full p-0.5">{emoji}</span>
                                ))}
                              </div>
                              <span className="ml-1">{totalReactions}</span>
                            </>
                          )}
                        </div>
                        {entryComments.length > 0 && (
                          <button 
                            onClick={() => setExpandedComments((prev) => ({ ...prev, [entry.id]: !prev[entry.id] }))}
                            className="hover:underline"
                          >
                            {entryComments.length} comment{entryComments.length !== 1 ? 's' : ''}
                          </button>
                        )}
                      </div>
                    )}

                    <Separator />

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between py-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`flex-1 gap-2 ${currentReaction ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                          >
                            {currentReaction ? (
                              <span className="text-lg">{currentReaction}</span>
                            ) : (
                              <ThumbsUp className="h-5 w-5" />
                            )}
                            <span className="font-medium">
                              {currentReaction ? reactionEmojis.includes(currentReaction) ? 
                                (currentReaction === "👍" ? "Like" : 
                                 currentReaction === "❤️" ? "Love" : 
                                 currentReaction === "😂" ? "Haha" : 
                                 currentReaction === "😮" ? "Wow" : 
                                 currentReaction === "😢" ? "Sad" : "Angry") 
                                : "Like" : "Like"}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2" side="top">
                          <div className="flex gap-1">
                            {reactionEmojis.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => toggleReaction(entry.id, emoji)}
                                className={`text-2xl hover:scale-125 transition-transform p-1 rounded ${currentReaction === emoji ? 'bg-primary/20' : ''}`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 gap-2 text-muted-foreground hover:text-foreground"
                        onClick={() => setExpandedComments((prev) => ({ ...prev, [entry.id]: !prev[entry.id] }))}
                      >
                        <MessageCircle className="h-5 w-5" />
                        <span className="font-medium">Comment</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 gap-2 text-muted-foreground hover:text-foreground"
                        onClick={() => shareEntry(entry)}
                      >
                        <Share2 className="h-5 w-5" />
                        <span className="font-medium">Share</span>
                      </Button>
                    </div>

                    {/* Comments Section */}
                    {isExpanded && (
                      <div className="space-y-3 pt-2">
                        <Separator />
                        
                        {/* Comments List */}
                        {entryComments.map((comment, i) => (
                          <div key={i} className="flex gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs bg-muted">You</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="bg-muted rounded-2xl px-3 py-2">
                                <p className="text-xs font-semibold text-foreground">You</p>
                                <p className="text-sm text-foreground">{comment.text}</p>
                              </div>
                              <div className="flex items-center gap-3 mt-1 ml-3 text-xs text-muted-foreground">
                                <button className="font-semibold hover:underline">Like</button>
                                <button className="font-semibold hover:underline">Reply</button>
                                <span>{formatDistanceToNow(comment.timestamp, { addSuffix: true })}</span>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Comment Input */}
                        <div className="flex gap-2 items-center">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-muted">You</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 relative">
                            <Input
                              value={commentText[entry.id] || ""}
                              onChange={(e) =>
                                setCommentText((prev) => ({ ...prev, [entry.id]: e.target.value }))
                              }
                              onKeyDown={(e) => handleKeyPress(e, entry.id)}
                              placeholder="Write a comment..."
                              className="rounded-full pr-10 bg-muted border-0 text-sm"
                            />
                            {commentText[entry.id]?.trim() && (
                              <Button 
                                size="icon" 
                                variant="ghost"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-primary"
                                onClick={() => addComment(entry.id)}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
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