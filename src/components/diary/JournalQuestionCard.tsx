import { useState } from "react";
import DOMPurify from "dompurify";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  PenLine,
  Bookmark,
  BookmarkCheck,
  Plus,
  MessageCircle,
  Share2,
  Send,
  MoreHorizontal,
  Copy,
  ExternalLink,
  Code,
  ThumbsUp,
  Heart,
  Lightbulb,
  PartyPopper,
  HandHeart } from
"lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger } from
"@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger } from
"@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

// Reaction types with icons
const REACTION_TYPES = [
{ type: 'like', emoji: '👍', icon: ThumbsUp, label: 'Like' },
{ type: 'love', emoji: '❤️', icon: Heart, label: 'Love' },
{ type: 'insight', emoji: '💡', icon: Lightbulb, label: 'Insight' },
{ type: 'celebrate', emoji: '🎉', icon: PartyPopper, label: 'Celebrate' },
{ type: 'support', emoji: '🤝', icon: HandHeart, label: 'Support' }] as
const;

type ReactionType = typeof REACTION_TYPES[number]['type'];

interface FeedCommentItem {
  id: string;
  text: string;
  created_at: string;
  user_id: string;
  is_edited?: boolean | null;
  parent_comment_id?: string | null;
}

interface JournalQuestionCardProps {
  eventId: string;
  questionLabel: string;
  answerContent: string;
  contentHtml?: string;
  journalDate: string;
  entryDate: string;
  emotionTag?: string;
  authorName?: string;
  authorAvatarUrl?: string;
  media?: string[];
  isSaved: boolean;
  userReaction?: ReactionType | null;
  reactionCounts?: Record<ReactionType, number>;
  comments?: FeedCommentItem[];
  currentUserId?: string;
  onToggleSave: () => void;
  onEdit: () => void;
  onNavigate: () => void;
  onToggleReaction?: (eventId: string, reaction: ReactionType | null) => void;
  onAddComment?: (eventId: string, text: string) => void;
  onDeleteComment?: (commentId: string) => void;
}

export function JournalQuestionCard({
  eventId,
  questionLabel,
  answerContent,
  contentHtml,
  journalDate,
  entryDate,
  emotionTag,
  authorName = "You",
  authorAvatarUrl,
  media,
  isSaved,
  userReaction: initialUserReaction,
  reactionCounts: initialReactionCounts,
  comments: feedComments = [],
  currentUserId,
  onToggleSave,
  onEdit,
  onNavigate,
  onToggleReaction,
  onAddComment,
  onDeleteComment
}: JournalQuestionCardProps) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [userReaction, setUserReaction] = useState<ReactionType | null>(initialUserReaction || null);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>(initialReactionCounts || {});

  const journalDateObj = new Date(journalDate);
  const entryDateObj = new Date(entryDate);

  const formattedJournalDate = format(journalDateObj, "d MMM");
  const formattedEntryDate = `${format(entryDateObj, "d MMM yy")}, ${format(entryDateObj, "h:mm a").toLowerCase()}`;
  const fullJournalDate = journalDateObj.toISOString();
  const fullEntryDate = entryDateObj.toISOString();

  const isEmptyAnswer = !answerContent || answerContent.trim() === "";
  const needsReadMore = answerContent?.length > 140;

  // Get author initials for avatar fallback
  const authorInitials = authorName.
  split(" ").
  map((n) => n[0]).
  join("").
  toUpperCase().
  slice(0, 2);

  // Toggle reaction with optimistic update
  const handleToggleReaction = (type: ReactionType) => {
    const prevReaction = userReaction;
    const nextReaction = prevReaction === type ? null : type;

    // Optimistic update
    setUserReaction(nextReaction);
    setReactionCounts((prev) => {
      const updated = { ...prev };
      if (prevReaction) {
        updated[prevReaction] = Math.max(0, (updated[prevReaction] || 0) - 1);
      }
      if (nextReaction) {
        updated[nextReaction] = (updated[nextReaction] || 0) + 1;
      }
      return updated;
    });

    // Call parent handler
    onToggleReaction?.(eventId, nextReaction);
  };

  // Handle share actions
  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/share/journal-answer/${eventId}`;
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Link copied to clipboard" });
  };

  const handleShareToX = () => {
    const shareUrl = `${window.location.origin}/share/journal-answer/${eventId}`;
    const text = encodeURIComponent(`${questionLabel}\n\n${answerContent.slice(0, 100)}...`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleEmbed = () => {
    const embedCode = `<iframe src="${window.location.origin}/embed/journal-answer/${eventId}" width="400" height="300" frameborder="0"></iframe>`;
    navigator.clipboard.writeText(embedCode);
    toast({ title: "Embed code copied to clipboard" });
  };

  // Handle comment submission
  const handleAddComment = () => {
    if (!commentText.trim()) return;
    onAddComment?.(eventId, commentText.trim());
    setCommentText("");
    toast({ title: "Comment posted" });
  };

  // Get total reaction count
  const totalReactions = Object.values(reactionCounts).reduce((sum, count) => sum + count, 0);

  // Get top 3 reactions for display
  const topReactions = Object.entries(reactionCounts).
  filter(([, count]) => count > 0).
  sort(([, a], [, b]) => b - a).
  slice(0, 3);

  return (
    <Card className="overflow-hidden max-w-full bg-card border-border/40 shadow-sm hover:shadow-md transition-shadow rounded-xl">
      {/* Header with Avatar */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between" role="banner">
          {/* Left: Avatar + Label block */}
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={authorAvatarUrl} alt={authorName} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                {authorInitials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex flex-col">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs font-semibold text-foreground cursor-default tracking-wider">
                      Journal | {formattedJournalDate}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs font-mono">{fullJournalDate}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-muted-foreground cursor-default">
                      {formattedEntryDate}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs font-mono">{fullEntryDate}</p>
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
              <DropdownMenuItem onClick={onToggleSave}>
                {isSaved ? <BookmarkCheck className="h-4 w-4 mr-2" /> : <Bookmark className="h-4 w-4 mr-2" />}
                {isSaved ? "Unsave" : "Save post"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onNavigate}>
                Open in Journal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Body - text content with padding */}
      <CardContent className="px-4 pb-0 pt-2 py-[4px]">
        {/* Title (Question) */}
        <h3 className="text-base font-medium text-foreground mb-2">
          {questionLabel}
        </h3>

        {/* Content (Answer) - Inline expandable */}
        {isEmptyAnswer ?
        <div className="flex items-center justify-between py-3 px-3 bg-muted/30 rounded-lg">
            <span className="text-sm text-muted-foreground italic">
              No response
            </span>
            <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-primary hover:text-primary/80"
            onClick={onEdit}>

              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div> :

        <>
            <div
            className={cn(
              "overflow-hidden transition-[max-height] duration-200 ease-in-out",
              expanded ? "max-h-[1000px]" : "max-h-[72px]"
            )}>

              {contentHtml ?
            <div
              className="text-sm text-foreground/80 leading-relaxed prose prose-sm max-w-none break-words"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contentHtml) }} /> :


            <p className="text-[13px] text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {answerContent}
                </p>
            }
            </div>
            
            {needsReadMore &&
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-primary hover:text-primary/80 underline mt-2">

                {expanded ? "Show less" : "Read more"}
              </button>
          }
          </>
        }

        {emotionTag &&
        <div className="flex items-center gap-2 mt-3">
            <PenLine className="h-3.5 w-3.5 text-muted-foreground" />
            <Badge variant="secondary" className="text-xs px-2 py-0 h-5 bg-rose-100 text-rose-700">
              {emotionTag}
            </Badge>
          </div>
        }
      </CardContent>

      {/* Edge-to-edge media - outside CardContent */}
      {media && media.length > 0 && (() => {
        const images = media.filter(url => url && typeof url === 'string' && url.trim() !== '');
        if (images.length === 0) return null;
        const count = images.length;

        if (count === 1) {
          return (
            <div className="mt-2 bg-muted flex items-center justify-center min-h-[200px]">
              <img src={images[0]} alt="" className="max-w-full max-h-[500px] object-contain block" loading="lazy" />
            </div>
          );
        }

        if (count === 2) {
          return (
            <div className="mt-2 grid grid-cols-2 gap-0.5">
              {images.map((url, i) => (
                <div key={i} className="bg-muted flex items-center justify-center min-h-[150px]">
                  <img src={url} alt="" className="max-w-full max-h-80 object-contain" loading="lazy" />
                </div>
              ))}
            </div>
          );
        }

        if (count === 3) {
          return (
            <div className="mt-2 grid grid-cols-2 gap-0.5">
              <div className="row-span-2 bg-muted">
                <img src={images[0]} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="bg-muted">
                <img src={images[1]} alt="" className="w-full aspect-square object-cover" loading="lazy" />
              </div>
              <div className="bg-muted">
                <img src={images[2]} alt="" className="w-full aspect-square object-cover" loading="lazy" />
              </div>
            </div>
          );
        }

        const extra = count - 4;
        return (
          <div className="mt-2 grid grid-cols-2 gap-0.5">
            {images.slice(0, 4).map((url, i) =>
              <div key={i} className="relative bg-muted">
                <img src={url} alt="" className="w-full aspect-square object-cover" loading="lazy" />
                {i === 3 && extra > 0 &&
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-2xl font-semibold text-white">+{extra}</span>
                  </div>
                }
              </div>
            )}
          </div>
        );
      })()}

      {/* Counts + actions + comments - with padding */}
      <div className="px-4 pb-2">
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="flex items-center gap-1.5">
            {totalReactions > 0 &&
              <>
                <div className="flex -space-x-1">
                  {topReactions.map(([type]) => {
                    const reaction = REACTION_TYPES.find((r) => r.type === type);
                    return reaction ? <span key={type} className="text-xs leading-none">{reaction.emoji}</span> : null;
                  })}
                </div>
                <span className="text-xs text-muted-foreground">{totalReactions}</span>
              </>
            }
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{feedComments.length} comment{feedComments.length !== 1 ? 's' : ''}</span>
            <span>0 shares</span>
          </div>
        </div>

        <div className="border-t border-border/50 mt-1">
          <div className="flex min-h-[44px] items-stretch">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  aria-pressed={!!userReaction}
                  className={cn("flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium text-muted-foreground hover:bg-muted/50 rounded transition-colors", userReaction && "text-primary")}
                >
                  {userReaction ?
                    <span className="text-sm leading-none">{REACTION_TYPES.find((r) => r.type === userReaction)?.emoji}</span> :
                    <ThumbsUp className="h-3.5 w-3.5" />
                  }
                  <span>{userReaction ? REACTION_TYPES.find((r) => r.type === userReaction)?.label : 'Like'}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-1.5" side="top">
                <div className="flex gap-0.5">
                  {REACTION_TYPES.map((reaction) =>
                    <button
                      key={reaction.type}
                      onClick={() => handleToggleReaction(reaction.type)}
                      aria-pressed={userReaction === reaction.type}
                      className={cn("text-xl p-1.5 rounded-full hover:bg-muted transition-transform hover:scale-125", userReaction === reaction.type && "bg-primary/20")}
                      title={reaction.label}
                    >
                      {reaction.emoji}
                    </button>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <button
              onClick={() => setShowComposer(!showComposer)}
              className={cn("flex-1 flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted/50 rounded transition-colors py-[8px]", showComposer && "text-primary")}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>Comment</span>
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium text-muted-foreground hover:bg-muted/50 rounded transition-colors">
                  <Share2 className="h-3.5 w-3.5" />
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

        {showComposer &&
          <div className="mt-3 pt-3 border-t border-border/30 space-y-3">
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
            {feedComments.map((comment) =>
              <div key={comment.id} className="bg-muted/30 rounded-lg p-3">
                <p className="text-sm">{comment.text}</p>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                  <span>{format(new Date(comment.created_at), "MMM d, h:mm a")}</span>
                  {comment.is_edited && <span>(edited)</span>}
                  {comment.user_id === currentUserId &&
                    <button className="hover:text-destructive" onClick={() => onDeleteComment?.(comment.id)}>Delete</button>
                  }
                </div>
              </div>
            )}
          </div>
        }
      </div>
    </Card>
  );
}
