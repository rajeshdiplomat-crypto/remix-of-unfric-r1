import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Heart, PenLine, Sparkles, BarChart3, FileText, CheckSquare, Target,
  MessageCircle, Share2, Send, MoreHorizontal, Edit2, Trash2, Copy, 
  Bookmark, BookmarkCheck, ChevronDown, ChevronUp, Reply, Flame, Calendar,
  Check, List
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { FeedEvent, FeedReaction, FeedComment, ModuleConfig, SourceModule } from "./types";
import { REACTION_EMOJIS } from "./types";

const MODULE_CONFIG: Record<SourceModule | 'emotions', ModuleConfig> = {
  tasks: { icon: CheckSquare, label: "Tasks", color: "text-emerald-700", bgColor: "bg-emerald-100" },
  journal: { icon: PenLine, label: "Journal Entry", color: "text-stone-700", bgColor: "bg-stone-200" },
  notes: { icon: FileText, label: "Notes", color: "text-amber-700", bgColor: "bg-amber-100" },
  mindmap: { icon: Target, label: "Mind Map", color: "text-indigo-700", bgColor: "bg-indigo-100" },
  trackers: { icon: BarChart3, label: "Trackers", color: "text-teal-700", bgColor: "bg-teal-100" },
  manifest: { icon: Sparkles, label: "Manifest", color: "text-purple-700", bgColor: "bg-purple-100" },
  focus: { icon: Target, label: "Focus", color: "text-rose-700", bgColor: "bg-rose-100" },
  emotions: { icon: Heart, label: "Emotion Check-in", color: "text-rose-600", bgColor: "bg-rose-100" },
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
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const config = MODULE_CONFIG[event.source_module as keyof typeof MODULE_CONFIG] || MODULE_CONFIG.journal;
  const IconComponent = config.icon;
  const userReaction = reactions.find(r => r.user_id === currentUserId)?.emoji;

  // Group reactions by emoji
  const reactionCounts: Record<string, number> = {};
  reactions.forEach(r => {
    reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
  });
  const topReactions = Object.entries(reactionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Organize comments with replies
  const topLevelComments = comments.filter(c => !c.parent_comment_id);
  const getReplies = (commentId: string) => comments.filter(c => c.parent_comment_id === commentId);

  const handleShare = () => {
    navigator.clipboard.writeText(`${event.title}\n\n${event.content_preview || event.summary || ''}`);
    toast({ title: "Copied to clipboard" });
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    onAddComment(event.id, commentText);
    setCommentText("");
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

  // Parse metadata for task-specific display
  const metadata = event.metadata as any;
  const priority = metadata?.priority;
  const dueDate = metadata?.due_date;
  const subtasks = metadata?.subtasks as { text: string; completed: boolean }[] | undefined;
  const tags = metadata?.tags as string[] | undefined;

  return (
    <Card className="overflow-hidden bg-card border-border/40 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center text-lg font-semibold shrink-0",
              config.bgColor, config.color
            )}>
              {event.source_module === 'journal' ? 'B' : <IconComponent className="h-5 w-5" />}
            </div>
            
            <div className="min-w-0">
              {/* Module name + date (only once) */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground text-sm">{config.label}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(event.created_at), 'MMM d, yyyy')} · {format(new Date(event.created_at), 'h:mm a')}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(event.created_at), { addSuffix: false })} ago
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleShare}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy text
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
      </div>

      {/* Content */}
      <CardContent className="pt-2 pb-3 px-4">
        {/* Title */}
        <button 
          onClick={() => onNavigateToSource(event)}
          className="text-lg font-semibold text-foreground hover:underline text-left block mb-2"
        >
          {event.type === 'complete' ? `Completed: ${event.title}` : event.title}
        </button>

        {/* Content preview */}
        {event.content_preview && (
          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
            {event.content_preview}
          </p>
        )}

        {/* Subtasks for tasks */}
        {subtasks && subtasks.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {subtasks.map((task, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">•</span>
                <span className={cn(task.completed && "line-through text-muted-foreground")}>
                  {task.text}
                </span>
                {task.completed && <List className="h-3.5 w-3.5 text-muted-foreground" />}
                {task.completed && <Check className="h-3.5 w-3.5 text-emerald-600" />}
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {tags.map((tag, i) => (
              <Badge 
                key={i} 
                variant="secondary" 
                className="bg-stone-200 text-stone-700 hover:bg-stone-300 text-xs font-normal px-2.5 py-0.5"
              >
                {tag}
              </Badge>
            ))}
            <div className="flex items-center gap-1 ml-auto text-muted-foreground">
              <List className="h-4 w-4" />
              <Heart className="h-4 w-4 fill-rose-400 text-rose-400" />
            </div>
          </div>
        )}

        {/* Priority and Due date badges */}
        {(priority || dueDate) && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {priority && (
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-xs font-medium px-2 py-0.5",
                  priority === 'high' && "bg-rose-100 text-rose-700",
                  priority === 'medium' && "bg-amber-100 text-amber-700",
                  priority === 'low' && "bg-emerald-100 text-emerald-700"
                )}
              >
                <Flame className="h-3 w-3 mr-1" />
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </Badge>
            )}
            {dueDate && (
              <Badge variant="secondary" className="bg-sky-100 text-sky-700 text-xs font-medium px-2 py-0.5">
                <Calendar className="h-3 w-3 mr-1" />
                Due {format(new Date(dueDate), 'MMM d')}
              </Badge>
            )}
            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              <span>Mothive</span>
              <ChevronDown className="h-3 w-3" />
            </div>
          </div>
        )}
        
        {/* Media grid */}
        {event.media && event.media.length > 0 && (
          <div className={cn(
            "grid gap-2 mb-3",
            event.media.length === 1 && "grid-cols-1",
            event.media.length === 2 && "grid-cols-2",
            event.media.length >= 3 && "grid-cols-4"
          )}>
            {event.media.slice(0, 4).map((url, i) => (
              <img 
                key={i} 
                src={url} 
                alt="" 
                className="rounded-lg w-full h-20 object-cover"
              />
            ))}
          </div>
        )}

        {/* Reaction summary */}
        {topReactions.length > 0 && (
          <div className="flex items-center gap-2 py-2">
            <div className="flex -space-x-1">
              {topReactions.map(([emoji]) => (
                <span key={emoji} className="text-sm">{emoji}</span>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {reactions.length} reaction{reactions.length !== 1 ? 's' : ''}
            </span>
            {comments.length > 0 && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {comments.length} comment{comments.length !== 1 ? 's' : ''}
                </span>
              </>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center border-t border-border/50 pt-2 -mx-4 px-4">
          <div className="flex-1 flex items-center justify-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className={cn("gap-2 text-muted-foreground hover:text-foreground", userReaction && "text-primary")}>
                  {userReaction ? <span className="text-base">{userReaction}</span> : <span className="text-base">🖐</span>}
                  <span className="text-sm">React</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" side="top">
                <div className="flex gap-1">
                  {REACTION_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => onToggleReaction(event.id, emoji)}
                      className={cn(
                        "text-xl p-1.5 rounded hover:bg-muted transition-transform hover:scale-125",
                        userReaction === emoji && "bg-primary/20"
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex-1 flex items-center justify-center border-l border-r border-border/50">
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">Comment</span>
            </Button>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              <span className="text-sm">Share</span>
            </Button>
          </div>
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
            {/* Comment input */}
            <div className="flex gap-2">
              <Input
                placeholder="Write a comment..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
                className="flex-1 bg-muted/30"
              />
              <Button size="icon" onClick={handleAddComment} disabled={!commentText.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Comments list */}
            {topLevelComments.map(comment => (
              <div key={comment.id} className="space-y-2">
                <div className="bg-muted/30 rounded-lg p-3">
                  {editingComment === comment.id ? (
                    <div className="flex gap-2">
                      <Input
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleEditComment(comment.id)}
                      />
                      <Button size="sm" onClick={() => handleEditComment(comment.id)}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingComment(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm">{comment.text}</p>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                        <span>{format(new Date(comment.created_at), 'MMM d, h:mm a')}</span>
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
                            <button 
                              className="hover:text-destructive"
                              onClick={() => onDeleteComment(comment.id)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Replies */}
                {getReplies(comment.id).map(reply => (
                  <div key={reply.id} className="ml-6 bg-muted/20 rounded-lg p-3">
                    <p className="text-sm">{reply.text}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                      <span>{format(new Date(reply.created_at), 'MMM d, h:mm a')}</span>
                      {reply.is_edited && <span>(edited)</span>}
                      {reply.user_id === currentUserId && (
                        <button 
                          className="hover:text-destructive"
                          onClick={() => onDeleteComment(reply.id)}
                        >
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
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddReply(comment.id)}
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
    </Card>
  );
}
