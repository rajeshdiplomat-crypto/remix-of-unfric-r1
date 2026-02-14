import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import DOMPurify from "dompurify";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart,
  PenLine,
  Sparkles,
  BarChart3,
  FileText,
  CheckSquare,
  Target,
  MessageCircle,
  Share2,
  Send,
  MoreHorizontal,
  Trash2,
  Copy,
  Bookmark,
  BookmarkCheck,
  Reply,
  Flame,
  Calendar,
  Check,
  ThumbsUp,
  Lightbulb,
  PartyPopper,
  HandHeart,
  ExternalLink,
  Code,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getPresetImage } from "@/lib/presetImages";
import type { FeedEvent, FeedReaction, FeedComment, ModuleConfig, SourceModule } from "./types";

// Reaction types matching JournalQuestionCard
const REACTION_TYPES = [
  { type: 'like', emoji: '👍', icon: ThumbsUp, label: 'Like' },
  { type: 'love', emoji: '❤️', icon: Heart, label: 'Love' },
  { type: 'insight', emoji: '💡', icon: Lightbulb, label: 'Insight' },
  { type: 'celebrate', emoji: '🎉', icon: PartyPopper, label: 'Celebrate' },
  { type: 'support', emoji: '🤝', icon: HandHeart, label: 'Support' },
] as const;

type ReactionType = typeof REACTION_TYPES[number]['type'];

// Soft pastel module colors matching the new design system
// Default circular images for each module
const MODULE_IMAGES: Record<string, string> = {
  tasks: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=100&h=100&fit=crop",
  journal: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=100&h=100&fit=crop",
  notes: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=100&h=100&fit=crop",
  trackers: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop",
  manifest: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop",
  emotions: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=100&h=100&fit=crop",
  mindmap: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=100&h=100&fit=crop",
};

const MODULE_CONFIG: Record<SourceModule | "emotions", ModuleConfig> = {
  tasks: { icon: CheckSquare, label: "Tasks", color: "text-emerald-600", bgColor: "bg-emerald-50" },
  journal: { icon: PenLine, label: "Journal", color: "text-amber-600", bgColor: "bg-amber-50" },
  notes: { icon: FileText, label: "Notes", color: "text-sky-600", bgColor: "bg-sky-50" },
  mindmap: { icon: Target, label: "Mind Map", color: "text-violet-600", bgColor: "bg-violet-50" },
  trackers: { icon: BarChart3, label: "Habits", color: "text-teal-600", bgColor: "bg-teal-50" },
  manifest: { icon: Sparkles, label: "Manifest", color: "text-purple-600", bgColor: "bg-purple-50" },
  emotions: { icon: Heart, label: "Emotions", color: "text-pink-500", bgColor: "bg-pink-50" },
};

interface DiaryFeedCardProps {
  event: FeedEvent;
  reactions: FeedReaction[];
  comments: FeedComment[];
  isSaved: boolean;
  currentUserId: string;
  onToggleReaction: (eventId: string, emoji: string) => void;
  onAddComment: (eventId: string, text: string, parentId?: string) => void;
  onEditComment: (commentId: string, text: string) => void;
  onDeleteComment: (commentId: string) => void;
  onToggleSave: (eventId: string) => void;
  onNavigateToSource: (event: FeedEvent) => void;
}

export function DiaryFeedCard({
  event,
  reactions,
  comments,
  isSaved,
  currentUserId,
  onToggleReaction,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onToggleSave,
  onNavigateToSource,
}: DiaryFeedCardProps) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const config = MODULE_CONFIG[event.source_module as keyof typeof MODULE_CONFIG] || MODULE_CONFIG.journal;
  const IconComponent = config.icon;
  const userReaction = reactions.find((r) => r.user_id === currentUserId)?.emoji;

  // Check if user actually attached media (not preset images)
  // Check if user actually attached media (not preset images)
  const hasUserAttachedMedia = event.media && event.media.length > 0;

  // Group reactions by emoji
  const reactionCounts: Record<string, number> = {};
  reactions.forEach((r) => {
    reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
  });
  const topReactions = Object.entries(reactionCounts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const totalReactions = reactions.length;

  // Organize comments with replies
  const topLevelComments = comments.filter((c) => !c.parent_comment_id);
  const getReplies = (commentId: string) => comments.filter((c) => c.parent_comment_id === commentId);

  // Parse metadata
  const metadata = event.metadata as any;
  const priority = metadata?.priority;
  const dueDate = metadata?.due_date;
  const subtasks = metadata?.subtasks as { text: string; completed: boolean }[] | undefined;
  const tags = metadata?.tags as string[] | undefined;
  const entryDateStr = metadata?.entry_date; // For emotions, journal entries, etc.

  // Date formatting - entry_date for display, created_at for logged time
  const displayDate = entryDateStr ? new Date(entryDateStr + 'T12:00:00') : new Date(event.created_at);
  const formattedDate = format(displayDate, "d MMM");
  
  const eventDate = new Date(event.created_at);
  const formattedTime = "Logged " + format(eventDate, "d MMM yy") + ", " + format(eventDate, "h:mm a").toLowerCase();
  const fullDate = displayDate.toISOString();

  // Content expansion
  const contentPreview = event.content_preview || event.summary || "";
  const needsReadMore = contentPreview.length > 140;

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/share/feed/${event.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Link copied to clipboard" });
  };

  const handleShareToX = () => {
    const shareUrl = `${window.location.origin}/share/feed/${event.id}`;
    const text = encodeURIComponent(`${event.title}\n\n${contentPreview.slice(0, 100)}...`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleEmbed = () => {
    const embedCode = `<iframe src="${window.location.origin}/embed/feed/${event.id}" width="400" height="300" frameborder="0"></iframe>`;
    navigator.clipboard.writeText(embedCode);
    toast({ title: "Embed code copied to clipboard" });
  };

  const handleToggleReaction = (emoji: string) => {
    onToggleReaction(event.id, emoji);
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    onAddComment(event.id, commentText);
    setCommentText("");
    toast({ title: "Comment posted" });
  };

  const handleAddReply = (parentId: string) => {
    if (!replyText.trim()) return;
    onAddComment(event.id, replyText, parentId);
    setReplyText("");
    setReplyingTo(null);
  };

  const handleEditComment = (commentId: string) => {
    if (!editText.trim()) return;
    onEditComment(commentId, editText);
    setEditingComment(null);
    setEditText("");
  };

  return (
    <Card className="overflow-hidden max-w-full bg-card border-border/40 shadow-[0_6px_18px_hsl(210_29%_8%/0.06)] hover:shadow-[0_10px_30px_hsl(210_29%_8%/0.08)] transition-all duration-200 rounded-[10px]">
      {/* All modules now use vertical layout - no left-side images */}
      <div className="flex flex-col">
        <div className="flex-1 min-w-0">
          {/* Header with Avatar - matching JournalQuestionCard */}
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between" role="banner">
              {/* Left: Avatar + Label block */}
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={MODULE_IMAGES[event.source_module]} alt={config.label} className="object-cover" />
                  <AvatarFallback className={cn("text-xs font-medium", config.bgColor, config.color)}>
                    <IconComponent className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
            
            <div className="flex flex-col">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm font-semibold text-foreground cursor-default">
                      {config.label} | {formattedDate}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs font-mono">{fullDate}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-muted-foreground cursor-default">
                      {formattedTime}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs font-mono">{fullDate}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Right: More menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleCopyLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copy link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleSave(event.id)}>
                {isSaved ? <BookmarkCheck className="h-4 w-4 mr-2" /> : <Bookmark className="h-4 w-4 mr-2" />}
                {isSaved ? "Unsave" : "Save post"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onNavigateToSource(event)}>
                Open in {config.label}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Body */}
      <CardContent className="px-4 pb-4 pt-2">
        {/* Title */}
        <h3 
          className="text-base font-medium text-foreground mb-2 cursor-pointer hover:underline"
          onClick={() => onNavigateToSource(event)}
        >
          {event.type === "complete" ? `Completed: ${event.title}` : event.title}
        </h3>

        {/* Content - Inline expandable matching JournalQuestionCard */}
        {contentPreview ? (
          <>
            <div 
              className={cn(
                "overflow-hidden transition-[max-height] duration-200 ease-in-out",
                expanded ? "max-h-[1000px]" : "max-h-[72px]"
              )}
            >
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {contentPreview}
              </p>
            </div>
            
            {needsReadMore && (
              <button 
                onClick={() => setExpanded(!expanded)}
                className="text-sm text-primary hover:text-primary/80 underline mt-2"
              >
                {expanded ? "Show less" : "Read more"}
              </button>
            )}
          </>
        ) : null}

        {/* Subtasks for tasks */}
        {subtasks && subtasks.length > 0 && (
          <div className="space-y-1.5 mt-3">
            {subtasks.map((task, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className={cn(
                  "h-4 w-4 rounded border flex items-center justify-center",
                  task.completed ? "bg-emerald-100 border-emerald-300" : "border-border"
                )}>
                  {task.completed && <Check className="h-3 w-3 text-emerald-600" />}
                </span>
                <span className={cn(task.completed && "line-through text-muted-foreground")}>{task.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {tags.map((tag, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="text-xs px-2 py-0 h-5"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Priority and Due date badges */}
        {(priority || dueDate) && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {priority && (
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs font-medium px-2 py-0.5",
                  priority === "high" && "bg-rose-100 text-rose-700",
                  priority === "medium" && "bg-amber-100 text-amber-700",
                  priority === "low" && "bg-emerald-100 text-emerald-700",
                )}
              >
                <Flame className="h-3 w-3 mr-1" />
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </Badge>
            )}
            {dueDate && (
              <Badge variant="secondary" className="bg-sky-100 text-sky-700 text-xs font-medium px-2 py-0.5">
                <Calendar className="h-3 w-3 mr-1" />
                Due {format(new Date(dueDate), "MMM d")}
              </Badge>
            )}
          </div>
        )}

        {/* Facebook-style media grid - for any module with attached images */}
        {hasUserAttachedMedia && (() => {
          const images = event.media!;
          const count = images.length;
          
          if (count === 1) {
            return (
              <div className="mt-3">
                <img src={images[0]} alt="" className="w-full rounded-lg" />
              </div>
            );
          }
          
          if (count === 2) {
            return (
              <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
                {images.map((url, i) => (
                  <img key={i} src={url} alt="" className="w-full aspect-[4/5] object-cover" />
                ))}
              </div>
            );
          }
          
          if (count === 3) {
            return (
              <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg overflow-hidden" style={{ height: 280 }}>
                <img src={images[0]} alt="" className="w-full h-full object-cover row-span-2" style={{ gridRow: '1 / 3' }} />
                <img src={images[1]} alt="" className="w-full object-cover" style={{ height: 139 }} />
                <img src={images[2]} alt="" className="w-full object-cover" style={{ height: 139 }} />
              </div>
            );
          }
          
          // 4+ images: 2x2 grid with "+N" overlay
          const extra = count - 4;
          return (
            <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
              {images.slice(0, 4).map((url, i) => (
                <div key={i} className="relative">
                  <img src={url} alt="" className="w-full h-40 object-cover" />
                  {i === 3 && extra > 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-2xl font-semibold text-white">+{extra}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })()}

        {/* Facebook-style reaction summary */}
        {totalReactions > 0 && (
          <div className="flex items-center justify-between py-2 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1">
                {topReactions.map(([emoji]) => (
                  <span key={emoji} className="text-sm leading-none">
                    {emoji}
                  </span>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {totalReactions}
              </span>
            </div>
          </div>
        )}

        {/* Facebook-style action bar */}
        <div className="border-t border-border/50 mt-2">
          <div className="grid grid-cols-3 py-1">
            {/* React */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  aria-pressed={!!userReaction}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50 rounded transition-colors",
                    userReaction && "text-primary"
                  )}
                >
                  {userReaction ? (
                    <span className="text-base leading-none">{userReaction}</span>
                  ) : (
                    <ThumbsUp className="h-[18px] w-[18px]" />
                  )}
                  <span>{userReaction ? REACTION_TYPES.find(r => r.emoji === userReaction)?.label || 'Like' : 'Like'}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-1.5" side="top">
                <div className="flex gap-0.5">
                  {REACTION_TYPES.map((reaction) => (
                    <button
                      key={reaction.type}
                      onClick={() => handleToggleReaction(reaction.emoji)}
                      aria-pressed={userReaction === reaction.emoji}
                      className={cn(
                        "text-xl p-1.5 rounded-full hover:bg-muted transition-transform hover:scale-125",
                        userReaction === reaction.emoji && "bg-primary/20"
                      )}
                      title={reaction.label}
                    >
                      {reaction.emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Comment */}
            <button
              onClick={() => setShowComments(!showComments)}
              aria-pressed={showComments}
              className={cn(
                "flex items-center justify-center gap-2 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50 rounded transition-colors",
                showComments && "text-primary"
              )}
            >
              <MessageCircle className="h-[18px] w-[18px]" />
              <span>Comment</span>
            </button>

            {/* Share */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50 rounded transition-colors">
                  <Share2 className="h-[18px] w-[18px]" />
                  <span>Share</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleCopyLink}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareToX}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Share to X
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleEmbed}>
                  <Code className="h-4 w-4 mr-2" />
                  Embed
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="mt-3 pt-3 border-t border-border/30 space-y-3">
            {/* Comment input */}
            <div className="flex gap-2">
              <Input
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAddComment()}
                className="flex-1 bg-muted/30"
              />
              <Button size="icon" onClick={handleAddComment} disabled={!commentText.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Comments list */}
            {topLevelComments.map((comment) => (
              <div key={comment.id} className="space-y-2">
                <div className="bg-muted/30 rounded-lg p-3">
                  {editingComment === comment.id ? (
                    <div className="flex gap-2">
                      <Input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleEditComment(comment.id)}
                      />
                      <Button size="sm" onClick={() => handleEditComment(comment.id)}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingComment(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm">{comment.text}</p>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                        <span>{format(new Date(comment.created_at), "MMM d, h:mm a")}</span>
                        {comment.is_edited && <span>(edited)</span>}
                        <button
                          className="hover:text-foreground"
                          onClick={() => {
                            setReplyingTo(comment.id);
                            setReplyText("");
                          }}
                        >
                          Reply
                        </button>
                        {comment.user_id === currentUserId && (
                          <>
                            <button
                              className="hover:text-foreground"
                              onClick={() => {
                                setEditingComment(comment.id);
                                setEditText(comment.text);
                              }}
                            >
                              Edit
                            </button>
                            <button className="hover:text-destructive" onClick={() => onDeleteComment(comment.id)}>
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Replies */}
                {getReplies(comment.id).map((reply) => (
                  <div key={reply.id} className="ml-6 bg-muted/20 rounded-lg p-3">
                    <p className="text-sm">{reply.text}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                      <span>{format(new Date(reply.created_at), "MMM d, h:mm a")}</span>
                      {reply.is_edited && <span>(edited)</span>}
                      {reply.user_id === currentUserId && (
                        <button className="hover:text-destructive" onClick={() => onDeleteComment(reply.id)}>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Reply input */}
                {replyingTo === comment.id && (
                  <div className="ml-6 flex gap-2">
                    <Input
                      placeholder="Write a reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddReply(comment.id)}
                      className="flex-1 bg-muted/30"
                    />
                    <Button size="icon" onClick={() => handleAddReply(comment.id)} disabled={!replyText.trim()}>
                      <Reply className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
        </div>
      </div>
    </Card>
  );
}
