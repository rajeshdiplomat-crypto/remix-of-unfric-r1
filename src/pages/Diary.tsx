import { useEffect, useState } from "react";
import { format, subDays, isSameDay, parseISO, startOfWeek, addDays } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Heart, PenLine, Sparkles, BarChart3, FileText, CheckSquare, MessageCircle, Share2, Send, MoreHorizontal, Edit2, Trash2, Copy, Bookmark, Flag, EyeOff, ChevronDown, ChevronUp, Reply, RefreshCw, Quote, TrendingUp, Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { LucideIcon } from "lucide-react";

interface ReplyType {
  id: string;
  text: string;
  timestamp: Date;
  isEdited?: boolean;
}

interface Comment {
  id: string;
  text: string;
  timestamp: Date;
  replies: ReplyType[];
  isEdited?: boolean;
}

interface DiaryEntry {
  id: string;
  type: "emotion" | "journal" | "manifest" | "habit" | "note" | "task";
  title: string;
  preview: string;
  question?: string;
  date: string;
  entryDate: string;
  icon: LucideIcon;
  reactions: string[];
  comments: string[];
}

const typeConfig: Record<string, { icon: LucideIcon; label: string; color: string }> = {
  emotion: { icon: Heart, label: "Daily Feeling", color: "bg-pink-500/10 text-pink-500" },
  journal: { icon: PenLine, label: "Journal Entry", color: "bg-blue-500/10 text-blue-500" },
  manifest: { icon: Sparkles, label: "Manifest", color: "bg-purple-500/10 text-purple-500" },
  habit: { icon: BarChart3, label: "Habit", color: "bg-green-500/10 text-green-500" },
  note: { icon: FileText, label: "Note", color: "bg-orange-500/10 text-orange-500" },
  task: { icon: CheckSquare, label: "Task", color: "bg-cyan-500/10 text-cyan-500" },
};

const reactionEmojis = ["👍", "❤️", "😂", "😮", "🙏"];

const DAILY_QUOTES = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
];

const PREVIEW_LENGTH = 200;

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
  const [expandedContent, setExpandedContent] = useState<Record<string, boolean>>({});
  const [editingComment, setEditingComment] = useState<{ entryId: string; commentId: string } | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ entryId: string; commentId: string } | null>(null);
  const [replyText, setReplyText] = useState("");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareEntry, setShareEntry] = useState<DiaryEntry | null>(null);
  const [hiddenEntries, setHiddenEntries] = useState<Set<string>>(new Set());
  const [dailyQuote, setDailyQuote] = useState(DAILY_QUOTES[0]);
  const [savedQuotes, setSavedQuotes] = useState<typeof DAILY_QUOTES>([]);

  useEffect(() => {
    // Set daily quote based on date
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    setDailyQuote(DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length]);
  }, []);

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
          entryDate: e.entry_date,
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
            entryDate: j.entry_date,
            icon: PenLine,
            reactions: [],
            comments: [],
          });
        }
        if (j.daily_gratitude) {
          allEntries.push({
            id: `${j.id}-gratitude`,
            type: "journal",
            title: "Gratitude",
            preview: j.daily_gratitude,
            question: "What are you grateful for?",
            date: j.created_at,
            entryDate: j.entry_date,
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
          date: g.created_at,
          entryDate: g.created_at.split("T")[0],
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
          preview: n.content || "Note",
          date: n.created_at,
          entryDate: n.created_at.split("T")[0],
          icon: FileText,
          reactions: [],
          comments: [],
        });
      });

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
      
      setReactionCounts((prevCounts) => {
        const entryCounts = { ...(prevCounts[entryId] || {}) };
        if (currentReaction) {
          entryCounts[currentReaction] = Math.max(0, (entryCounts[currentReaction] || 1) - 1);
          if (entryCounts[currentReaction] === 0) delete entryCounts[currentReaction];
        }
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
      id: crypto.randomUUID(),
      text: text.trim(),
      timestamp: new Date(),
      replies: [],
    };

    setLocalComments((prev) => ({
      ...prev,
      [entryId]: [...(prev[entryId] || []), newComment],
    }));
    setCommentText((prev) => ({ ...prev, [entryId]: "" }));
    setExpandedComments((prev) => ({ ...prev, [entryId]: true }));
  };

  const editComment = (entryId: string, commentId: string, newText: string) => {
    if (!newText.trim()) return;
    setLocalComments((prev) => ({
      ...prev,
      [entryId]: prev[entryId]?.map((c) =>
        c.id === commentId ? { ...c, text: newText.trim(), isEdited: true } : c
      ) || [],
    }));
    setEditingComment(null);
    setEditCommentText("");
  };

  const deleteComment = (entryId: string, commentId: string) => {
    setLocalComments((prev) => ({
      ...prev,
      [entryId]: prev[entryId]?.filter((c) => c.id !== commentId) || [],
    }));
    toast({ title: "Comment deleted" });
  };

  const addReply = (entryId: string, commentId: string) => {
    if (!replyText.trim()) return;
    
    const newReply: ReplyType = {
      id: crypto.randomUUID(),
      text: replyText.trim(),
      timestamp: new Date(),
    };

    setLocalComments((prev) => ({
      ...prev,
      [entryId]: prev[entryId]?.map((c) =>
        c.id === commentId ? { ...c, replies: [...c.replies, newReply] } : c
      ) || [],
    }));
    setReplyingTo(null);
    setReplyText("");
  };

  const deleteReply = (entryId: string, commentId: string, replyId: string) => {
    setLocalComments((prev) => ({
      ...prev,
      [entryId]: prev[entryId]?.map((c) =>
        c.id === commentId ? { ...c, replies: c.replies.filter((r) => r.id !== replyId) } : c
      ) || [],
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent, entryId: string) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addComment(entryId);
    }
  };

  const handleShare = (entry: DiaryEntry, method: "copy" | "native") => {
    if (method === "native" && navigator.share) {
      navigator.share({ title: entry.title, text: entry.preview });
    } else {
      navigator.clipboard.writeText(`${entry.title}\n\n${entry.preview}`);
      toast({ title: "Copied!", description: "Entry copied to clipboard" });
    }
    setShareDialogOpen(false);
  };

  const handleHideEntry = (entryId: string) => {
    setHiddenEntries((prev) => new Set(prev).add(entryId));
    toast({ title: "Entry hidden" });
  };

  const refreshQuote = () => {
    const newIndex = Math.floor(Math.random() * DAILY_QUOTES.length);
    setDailyQuote(DAILY_QUOTES[newIndex]);
  };

  const saveQuote = () => {
    setSavedQuotes(prev => [...prev, dailyQuote]);
    toast({ title: "Quote saved!" });
  };

  const copyQuote = () => {
    navigator.clipboard.writeText(`"${dailyQuote.text}" — ${dailyQuote.author}`);
    toast({ title: "Quote copied!" });
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

  const formatEntryDate = (dateStr: string) => format(new Date(dateStr), "d MMM yy");
  const formatFullDateTime = (dateStr: string) => format(new Date(dateStr), "d MMM yyyy '•' h:mm a");

  // Calculate insights
  const entriesThisWeek = entries.filter(e => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    return new Date(e.date) >= weekStart;
  }).length;

  const totalComments = Object.values(localComments).reduce((acc, comments) => acc + comments.length, 0);
  const totalReactions = Object.values(reactionCounts).reduce((acc, counts) => 
    acc + Object.values(counts).reduce((a, b) => a + b, 0), 0
  );

  // Mood trend (mock data for demo)
  const moodTrend = [60, 75, 65, 80, 70, 85, 90];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading your diary...</div>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Main Feed */}
      <div className="flex-1 max-w-2xl space-y-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Your Diary</h1>
          <p className="text-muted-foreground mt-1">A timeline of all your entries</p>
        </div>

        {entries.length === 0 ? (
          <Card className="p-12 text-center">
            <PenLine className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">No entries yet</h3>
            <p className="text-muted-foreground mt-1">Start journaling to see them here.</p>
          </Card>
        ) : (
          <ScrollArea className="h-[calc(100vh-220px)]">
            <div className="space-y-4 pr-4">
              {entries.filter((e) => !hiddenEntries.has(e.id)).map((entry) => {
                const config = typeConfig[entry.type];
                const IconComponent = config.icon;
                const entryComments = localComments[entry.id] || [];
                const currentReaction = userReaction[entry.id];
                const totalReactions = getTotalReactions(entry.id);
                const topReactions = getTopReactions(entry.id);
                const isExpanded = expandedComments[entry.id];
                const isContentExpanded = expandedContent[entry.id];
                const isLongContent = entry.preview.length > PREVIEW_LENGTH;
                const displayContent = isLongContent && !isContentExpanded 
                  ? entry.preview.substring(0, PREVIEW_LENGTH) + "..." 
                  : entry.preview;

                return (
                  <Card key={entry.id} className="overflow-hidden">
                    {/* Header */}
                    <CardHeader className="pb-2 bg-muted/30">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${config.color}`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="secondary" className={`${config.color} text-xs px-2 py-0.5`}>
                                {config.label} | {formatEntryDate(entry.entryDate)}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Posted: {formatFullDateTime(entry.date)}
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => {
                              navigator.clipboard.writeText(entry.preview);
                              toast({ title: "Copied to clipboard" });
                            }}>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy text
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Bookmark className="h-4 w-4 mr-2" />
                              Pin post
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleHideEntry(entry.id)}>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Hide entry
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>

                    {/* Content */}
                    <CardContent className="pt-3 pb-2">
                      <p className="text-foreground whitespace-pre-wrap">{displayContent}</p>
                      {isLongContent && (
                        <button
                          onClick={() => setExpandedContent(prev => ({ ...prev, [entry.id]: !isContentExpanded }))}
                          className="text-primary text-sm font-medium mt-2 hover:underline"
                        >
                          {isContentExpanded ? "See less" : "See more"}
                        </button>
                      )}
                    </CardContent>

                    {/* Reaction summary */}
                    {totalReactions > 0 && (
                      <div className="px-4 pb-2">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          {topReactions.map((emoji, i) => (
                            <span key={i}>{emoji}</span>
                          ))}
                          <span className="ml-1">{totalReactions}</span>
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Action Row - Evenly Spaced */}
                    <div className="grid grid-cols-3 divide-x divide-border">
                      {/* React */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="flex items-center justify-center gap-2 py-2.5 hover:bg-muted/50 transition-colors">
                            {currentReaction ? (
                              <span className="text-lg">{currentReaction}</span>
                            ) : (
                              <span className="text-lg">👍</span>
                            )}
                            <span className="text-sm text-muted-foreground">React</span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2" align="start">
                          <div className="flex gap-1">
                            {reactionEmojis.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => toggleReaction(entry.id, emoji)}
                                className={`text-xl p-2 rounded-full hover:bg-muted transition-transform hover:scale-125 ${
                                  currentReaction === emoji ? "bg-primary/10" : ""
                                }`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>

                      {/* Comment */}
                      <button 
                        onClick={() => setExpandedComments(prev => ({ ...prev, [entry.id]: !isExpanded }))}
                        className="flex items-center justify-center gap-2 py-2.5 hover:bg-muted/50 transition-colors"
                      >
                        <MessageCircle className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Comment {entryComments.length > 0 && `(${entryComments.length})`}
                        </span>
                      </button>

                      {/* Share */}
                      <button 
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({ title: entry.title, text: entry.preview });
                          } else {
                            setShareEntry(entry);
                            setShareDialogOpen(true);
                          }
                        }}
                        className="flex items-center justify-center gap-2 py-2.5 hover:bg-muted/50 transition-colors"
                      >
                        <Share2 className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Share</span>
                      </button>
                    </div>

                    {/* Comments Section */}
                    {isExpanded && (
                      <div className="px-4 py-3 bg-muted/20 space-y-3">
                        {/* Comment Input */}
                        <div className="flex gap-2">
                          <Input
                            value={commentText[entry.id] || ""}
                            onChange={(e) => setCommentText(prev => ({ ...prev, [entry.id]: e.target.value }))}
                            onKeyDown={(e) => handleKeyPress(e, entry.id)}
                            placeholder="Write a comment..."
                            className="flex-1"
                          />
                          <Button size="icon" onClick={() => addComment(entry.id)} disabled={!commentText[entry.id]?.trim()}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Comments List */}
                        {entryComments.map((comment) => (
                          <div key={comment.id} className="space-y-2">
                            <div className="bg-background rounded-lg p-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  {editingComment?.entryId === entry.id && editingComment?.commentId === comment.id ? (
                                    <div className="flex gap-2">
                                      <Input
                                        value={editCommentText}
                                        onChange={(e) => setEditCommentText(e.target.value)}
                                        className="flex-1"
                                      />
                                      <Button size="sm" onClick={() => editComment(entry.id, comment.id, editCommentText)}>
                                        Save
                                      </Button>
                                      <Button size="sm" variant="ghost" onClick={() => setEditingComment(null)}>
                                        Cancel
                                      </Button>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="text-sm text-foreground">{comment.text}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-muted-foreground">
                                          {format(comment.timestamp, "h:mm a")}
                                          {comment.isEdited && " · Edited"}
                                        </span>
                                        <button 
                                          className="text-xs text-primary hover:underline"
                                          onClick={() => setReplyingTo({ entryId: entry.id, commentId: comment.id })}
                                        >
                                          Reply
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => {
                                      setEditingComment({ entryId: entry.id, commentId: comment.id });
                                      setEditCommentText(comment.text);
                                    }}>
                                      <Edit2 className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => deleteComment(entry.id, comment.id)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>

                            {/* Replies */}
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="ml-6 bg-background rounded-lg p-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="text-sm text-foreground">{reply.text}</p>
                                    <span className="text-xs text-muted-foreground">
                                      {format(reply.timestamp, "h:mm a")}
                                    </span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => deleteReply(entry.id, comment.id, reply.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}

                            {/* Reply Input */}
                            {replyingTo?.entryId === entry.id && replyingTo?.commentId === comment.id && (
                              <div className="ml-6 flex gap-2">
                                <Input
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Write a reply..."
                                  className="flex-1"
                                  autoFocus
                                />
                                <Button size="sm" onClick={() => addReply(entry.id, comment.id)}>
                                  Reply
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>
                                  Cancel
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="w-80 flex-shrink-0 space-y-4">
        {/* Daily Quote */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Daily Quote</p>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={refreshQuote}>
                <RefreshCw className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={saveQuote}>
                <Bookmark className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyQuote}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <Quote className="h-4 w-4 text-primary mb-2" />
            <p className="text-sm text-foreground italic">"{dailyQuote.text}"</p>
            <p className="text-xs text-muted-foreground mt-2">— {dailyQuote.author}</p>
          </div>
          <div className="flex gap-1 mt-3">
            <Badge variant="outline" className="text-xs">Calm</Badge>
            <Badge variant="outline" className="text-xs">Motivation</Badge>
          </div>
        </Card>

        {/* Weekly Mood Trend */}
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Weekly Mood Trend</p>
          <div className="flex items-end justify-between h-16 gap-1">
            {moodTrend.map((value, i) => (
              <div
                key={i}
                className="flex-1 bg-primary/60 rounded-t transition-all hover:bg-primary"
                style={{ height: `${value}%` }}
                title={`Day ${i + 1}: ${value}%`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Mon</span>
            <span>Sun</span>
          </div>
        </Card>

        {/* Entries Snapshot */}
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">This Week</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-muted/30 rounded-lg">
              <p className="text-xl font-bold text-foreground">{entriesThisWeek}</p>
              <p className="text-xs text-muted-foreground">Entries</p>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded-lg">
              <p className="text-xl font-bold text-foreground">{totalComments}</p>
              <p className="text-xs text-muted-foreground">Comments</p>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded-lg">
              <p className="text-xl font-bold text-foreground">{totalReactions}</p>
              <p className="text-xs text-muted-foreground">Reactions</p>
            </div>
          </div>
        </Card>

        {/* Module Mix */}
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Entry Types</p>
          <div className="space-y-2">
            {Object.entries(typeConfig).slice(0, 4).map(([key, config]) => {
              const count = entries.filter(e => e.type === key).length;
              if (count === 0) return null;
              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-6 w-6 rounded flex items-center justify-center ${config.color}`}>
                      <config.icon className="h-3 w-3" />
                    </div>
                    <span className="text-sm text-foreground">{config.label}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Entry</DialogTitle>
            <DialogDescription>Choose how you want to share this entry</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button variant="outline" onClick={() => shareEntry && handleShare(shareEntry, "copy")}>
              <Copy className="h-4 w-4 mr-2" />
              Copy to clipboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
