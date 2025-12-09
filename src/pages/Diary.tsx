import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Heart, PenLine, Sparkles, BarChart3, FileText, CheckSquare, MessageCircle, Share2, ThumbsUp, Send, MoreHorizontal, Edit2, Trash2, Copy, Bookmark, Flag, EyeOff, ChevronDown, ChevronUp, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { LucideIcon } from "lucide-react";

interface Reply {
  id: string;
  text: string;
  timestamp: Date;
}

interface Comment {
  id: string;
  text: string;
  timestamp: Date;
  replies: Reply[];
}

interface DiaryEntry {
  id: string;
  type: "emotion" | "journal" | "manifest" | "habit" | "note" | "task";
  title: string;
  preview: string;
  question?: string;
  date: string;
  entryDate: string; // The date the entry belongs to
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
            title: "Daily Gratitude",
            preview: j.daily_gratitude,
            question: "What are you grateful for?",
            date: j.created_at,
            entryDate: j.entry_date,
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
          question: "What do you want to manifest?",
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
          entryDate: t.created_at.split("T")[0],
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
  };

  const editComment = (entryId: string, commentId: string, newText: string) => {
    if (!newText.trim()) return;
    setLocalComments((prev) => ({
      ...prev,
      [entryId]: prev[entryId]?.map((c) =>
        c.id === commentId ? { ...c, text: newText.trim() } : c
      ) || [],
    }));
    setEditingComment(null);
    setEditCommentText("");
    toast({ title: "Comment updated" });
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
    
    const newReply: Reply = {
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
    toast({ title: "Reply deleted" });
  };

  const handleKeyPress = (e: React.KeyboardEvent, entryId: string) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addComment(entryId);
    }
  };

  const handleShare = (entry: DiaryEntry, method: "copy" | "native") => {
    if (method === "native" && navigator.share) {
      navigator.share({
        title: entry.title,
        text: entry.preview,
      });
    } else {
      navigator.clipboard.writeText(`${entry.title}\n\n${entry.preview}`);
      toast({ title: "Copied!", description: "Entry copied to clipboard" });
    }
    setShareDialogOpen(false);
  };

  const handleSaveEntry = (entry: DiaryEntry) => {
    toast({ title: "Saved!", description: "Entry saved to your bookmarks" });
  };

  const handleHideEntry = (entryId: string) => {
    setHiddenEntries((prev) => new Set(prev).add(entryId));
    toast({ title: "Entry hidden", description: "This entry is now hidden from your feed" });
  };

  const handleReportEntry = () => {
    toast({ title: "Reported", description: "Thank you for your feedback" });
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

  const formatEntryDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "d MMM yy");
  };

  const formatFullDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "d MMM yyyy 'at' h:mm a");
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
                  {/* Post Header */}
                  <CardHeader className="pb-2 bg-muted/30">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${config.color}`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-foreground">{entry.title}</span>
                            <Badge variant="secondary" className={`${config.color} text-xs px-1.5 py-0`}>
                              {config.label} | {formatEntryDate(entry.entryDate)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatFullDateTime(entry.date)}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleSaveEntry(entry)}>
                            <Bookmark className="h-4 w-4 mr-2" />
                            Save entry
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            navigator.clipboard.writeText(entry.preview);
                            toast({ title: "Copied to clipboard" });
                          }}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy text
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleHideEntry(entry.id)}>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Hide entry
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleReportEntry} className="text-destructive">
                            <Flag className="h-4 w-4 mr-2" />
                            Report issue
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-3 space-y-3">
                    {/* Post Content */}
                    {entry.question && (
                      <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2">
                        {entry.question}
                      </p>
                    )}
                    <div className="bg-background rounded-lg p-3 border border-border/50">
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{displayContent}</p>
                      {isLongContent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary/80 p-0 h-auto mt-2"
                          onClick={() => setExpandedContent((prev) => ({ ...prev, [entry.id]: !prev[entry.id] }))}
                        >
                          {isContentExpanded ? (
                            <>See less <ChevronUp className="h-4 w-4 ml-1" /></>
                          ) : (
                            <>See more <ChevronDown className="h-4 w-4 ml-1" /></>
                          )}
                        </Button>
                      )}
                    </div>

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
                            {entryComments.length} comment{entryComments.length !== 1 ? "s" : ""}
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
                            className={`flex-1 gap-2 ${currentReaction ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
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
                                className={`text-2xl hover:scale-125 transition-transform p-1 rounded ${currentReaction === emoji ? "bg-primary/20" : ""}`}
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
                        onClick={() => {
                          setShareEntry(entry);
                          setShareDialogOpen(true);
                        }}
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
                        {entryComments.map((comment) => (
                          <div key={comment.id} className="space-y-2">
                            <div className="flex gap-2">
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarFallback className="text-xs bg-muted">You</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                {editingComment?.entryId === entry.id && editingComment?.commentId === comment.id ? (
                                  <div className="space-y-2">
                                    <Input
                                      value={editCommentText}
                                      onChange={(e) => setEditCommentText(e.target.value)}
                                      className="text-sm"
                                      autoFocus
                                    />
                                    <div className="flex gap-2">
                                      <Button size="sm" onClick={() => editComment(entry.id, comment.id, editCommentText)}>
                                        Save
                                      </Button>
                                      <Button size="sm" variant="ghost" onClick={() => {
                                        setEditingComment(null);
                                        setEditCommentText("");
                                      }}>
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="bg-muted rounded-2xl px-3 py-2 relative group">
                                      <p className="text-xs font-semibold text-foreground">You</p>
                                      <p className="text-sm text-foreground">{comment.text}</p>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-6 w-6 absolute -right-1 -top-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background border shadow-sm"
                                          >
                                            <MoreHorizontal className="h-3 w-3" />
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
                                            className="text-destructive"
                                            onClick={() => deleteComment(entry.id, comment.id)}
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 ml-3 text-xs text-muted-foreground">
                                      <button className="font-semibold hover:underline">Like</button>
                                      <button 
                                        className="font-semibold hover:underline"
                                        onClick={() => setReplyingTo({ entryId: entry.id, commentId: comment.id })}
                                      >
                                        Reply
                                      </button>
                                      <span>{format(comment.timestamp, "d MMM 'at' h:mm a")}</span>
                                    </div>
                                  </>
                                )}

                                {/* Replies */}
                                {comment.replies.length > 0 && (
                                  <div className="mt-2 space-y-2 ml-4 border-l-2 border-muted pl-3">
                                    {comment.replies.map((reply) => (
                                      <div key={reply.id} className="flex gap-2">
                                        <Avatar className="h-6 w-6 flex-shrink-0">
                                          <AvatarFallback className="text-xs bg-muted">You</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                          <div className="bg-muted rounded-2xl px-3 py-2 relative group">
                                            <p className="text-xs font-semibold text-foreground">You</p>
                                            <p className="text-sm text-foreground">{reply.text}</p>
                                            <Button 
                                              variant="ghost" 
                                              size="icon" 
                                              className="h-5 w-5 absolute -right-1 -top-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background border shadow-sm"
                                              onClick={() => deleteReply(entry.id, comment.id, reply.id)}
                                            >
                                              <X className="h-3 w-3" />
                                            </Button>
                                          </div>
                                          <div className="flex items-center gap-3 mt-1 ml-3 text-xs text-muted-foreground">
                                            <button className="font-semibold hover:underline">Like</button>
                                            <span>{format(reply.timestamp, "d MMM 'at' h:mm a")}</span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Reply Input */}
                                {replyingTo?.entryId === entry.id && replyingTo?.commentId === comment.id && (
                                  <div className="flex gap-2 items-center mt-2 ml-4">
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="text-xs bg-muted">You</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 relative">
                                      <Input
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            addReply(entry.id, comment.id);
                                          }
                                        }}
                                        placeholder="Write a reply..."
                                        className="rounded-full pr-10 bg-muted border-0 text-sm h-8"
                                        autoFocus
                                      />
                                      {replyText.trim() && (
                                        <Button 
                                          size="icon" 
                                          variant="ghost"
                                          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-primary"
                                          onClick={() => addReply(entry.id, comment.id)}
                                        >
                                          <Send className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-6 w-6"
                                      onClick={() => setReplyingTo(null)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
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

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Entry</DialogTitle>
            <DialogDescription>Choose how you want to share this entry</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3"
              onClick={() => shareEntry && handleShare(shareEntry, "copy")}
            >
              <Copy className="h-4 w-4" />
              Copy to clipboard
            </Button>
            {navigator.share && (
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3"
                onClick={() => shareEntry && handleShare(shareEntry, "native")}
              >
                <Share2 className="h-4 w-4" />
                Share via...
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
