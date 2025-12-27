import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Heart, PenLine, Sparkles, BarChart3, FileText, CheckSquare, Target,
  MessageCircle, Share2, Send, MoreHorizontal, Edit2, Trash2, Copy, 
  Bookmark, BookmarkCheck, ChevronDown, ChevronUp, Reply
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { FeedEvent, FeedReaction, FeedComment, ModuleConfig, SourceModule } from "./types";
import { REACTION_EMOJIS } from "./types";

const MODULE_CONFIG: Record<SourceModule, ModuleConfig> = {
  tasks: { icon: CheckSquare, label: "Task", color: "text-cyan-500", bgColor: "bg-cyan-500/10" },
  journal: { icon: PenLine, label: "Journal", color: "text-blue-500", bgColor: "bg-blue-500/10" },
  notes: { icon: FileText, label: "Note", color: "text-orange-500", bgColor: "bg-orange-500/10" },
  mindmap: { icon: Target, label: "Mind Map", color: "text-indigo-500", bgColor: "bg-indigo-500/10" },
  trackers: { icon: BarChart3, label: "Tracker", color: "text-green-500", bgColor: "bg-green-500/10" },
  manifest: { icon: Sparkles, label: "Manifest", color: "text-purple-500", bgColor: "bg-purple-500/10" },
  focus: { icon: Target, label: "Focus", color: "text-red-500", bgColor: "bg-red-500/10" },
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

  const config = MODULE_CONFIG[event.source_module];
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

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <CardHeader className="pb-2 bg-muted/30">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", config.bgColor, config.color)}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div>
              <button 
                onClick={() => onNavigateToSource(event)}
                className="font-medium text-foreground hover:underline text-left"
              >
                {event.title}
              </button>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" className={cn("text-xs px-2 py-0", config.bgColor, config.color)}>
                  {config.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
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
      </CardHeader>

      {/* Content */}
      <CardContent className="pt-3 pb-2">
        {event.summary && (
          <p className="text-sm text-muted-foreground mb-2">{event.summary}</p>
        )}
        {event.content_preview && (
          <p className="text-foreground whitespace-pre-wrap">{event.content_preview}</p>
        )}
        
        {/* Media grid */}
        {event.media && event.media.length > 0 && (
          <div className={cn(
            "grid gap-2 mt-3",
            event.media.length === 1 && "grid-cols-1",
            event.media.length === 2 && "grid-cols-2",
            event.media.length >= 3 && "grid-cols-3"
          )}>
            {event.media.slice(0, 4).map((url, i) => (
              <img 
                key={i} 
                src={url} 
                alt="" 
                className="rounded-lg w-full h-32 object-cover"
              />
            ))}
          </div>
        )}

        {/* Reaction summary */}
        {topReactions.length > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/50">
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
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className={cn("gap-1", userReaction && "text-primary")}>
                {userReaction || <Heart className="h-4 w-4" />}
                <span className="hidden sm:inline">React</span>
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

          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-1"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Comment</span>
            {showComments ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>

          <Button variant="ghost" size="sm" className="gap-1" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("gap-1", isSaved && "text-primary")}
            onClick={() => onToggleSave(event.id)}
          >
            {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            <span className="hidden sm:inline">Save</span>
          </Button>
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
                className="flex-1"
              />
              <Button size="icon" onClick={handleAddComment} disabled={!commentText.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Comments list */}
            {topLevelComments.map(comment => (
              <div key={comment.id} className="space-y-2">
                <div className="bg-muted/50 rounded-lg p-3">
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
                  <div key={reply.id} className="ml-6 bg-muted/30 rounded-lg p-3">
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
                      className="flex-1"
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
