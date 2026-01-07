import { useState, useMemo } from "react";
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
  Edit2,
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
  HandHeart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

// Reaction types with icons
const REACTION_TYPES = [
  { type: "like", emoji: "👍", icon: ThumbsUp, label: "Like" },
  { type: "love", emoji: "❤️", icon: Heart, label: "Love" },
  { type: "insight", emoji: "💡", icon: Lightbulb, label: "Insight" },
  { type: "celebrate", emoji: "🎉", icon: PartyPopper, label: "Celebrate" },
  { type: "support", emoji: "🤝", icon: HandHeart, label: "Support" },
] as const;

type ReactionType = (typeof REACTION_TYPES)[number]["type"];

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
  isSaved: boolean;
  userReaction?: ReactionType | null;
  reactionCounts?: Record<ReactionType, number>;
  onToggleSave: () => void;
  onEdit: () => void;
  onNavigate: () => void;
  onToggleReaction?: (eventId: string, reaction: ReactionType | null) => void;
  onAddComment?: (eventId: string, text: string) => void;
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
  isSaved,
  userReaction: initialUserReaction,
  reactionCounts: initialReactionCounts,
  onToggleSave,
  onEdit,
  onNavigate,
  onToggleReaction,
  onAddComment,
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

  const authorInitials = authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleToggleReaction = (type: ReactionType) => {
    const prevReaction = userReaction;
    const nextReaction = prevReaction === type ? null : type;

    setUserReaction(nextReaction);
    setReactionCounts((prev) => {
      const updated = { ...prev };
      if (prevReaction) updated[prevReaction] = Math.max(0, (updated[prevReaction] || 0) - 1);
      if (nextReaction) updated[nextReaction] = (updated[nextReaction] || 0) + 1;
      return updated;
    });

    onToggleReaction?.(eventId, nextReaction);
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/share/journal-answer/${eventId}`;
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Link copied to clipboard" });
  };

  const handleShareToX = () => {
    const shareUrl = `${window.location.origin}/share/journal-answer/${eventId}`;
    const text = encodeURIComponent(`${questionLabel}\n\n${answerContent.slice(0, 100)}...`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, "_blank");
  };

  const handleEmbed = () => {
    const embedCode = `<iframe src="${window.location.origin}/embed/journal-answer/${eventId}" width="400" height="300" frameborder="0"></iframe>`;
    navigator.clipboard.writeText(embedCode);
    toast({ title: "Embed code copied to clipboard" });
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    onAddComment?.(eventId, commentText.trim());
    setCommentText("");
    setShowComposer(false);
    toast({ title: "Comment posted" });
  };

  const totalReactions = Object.values(reactionCounts).reduce((sum, count) => sum + count, 0);

  const topReactions = Object.entries(reactionCounts)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const actionBtn =
    "w-full h-9 px-3 rounded-lg flex items-center justify-center gap-2 " +
    "text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  return (
    <Card className="overflow-hidden bg-card border-border/40 shadow-sm hover:shadow-md transition-shadow rounded-xl">
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between" role="banner">
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
                    <span className="text-sm font-semibold text-foreground cursor-default">
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
                    <span className="text-xs text-muted-foreground cursor-default">{formattedEntryDate}</span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs font-mono">{fullEntryDate}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

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
              <DropdownMenuItem onClick={onNavigate}>Open in Journal</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CardContent className="px-4 pb-4 pt-2">
        <h3 className="text-base font-medium text-foreground mb-2">{questionLabel}</h3>

        {isEmptyAnswer ? (
          <div className="flex items-center justify-between py-3 px-3 bg-muted/30 rounded-lg">
            <span className="text-sm text-muted-foreground italic">No response</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-primary hover:text-primary/80"
              onClick={onEdit}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
        ) : (
          <>
            <div
              className={cn(
                "overflow-hidden transition-[max-height] duration-200 ease-in-out",
                expanded ? "max-h-[1000px]" : "max-h-[72px]",
              )}
            >
              {contentHtml ? (
                <div
                  className="text-sm text-foreground/80 leading-relaxed prose prose-sm max-w-none break-words"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contentHtml) }}
                />
              ) : (
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{answerContent}</p>
              )}
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
        )}

        {emotionTag && (
          <div className="flex items-center gap-2 mt-3">
            <PenLine className="h-3.5 w-3.5 text-muted-foreground" />
            <Badge variant="secondary" className="text-xs px-2 py-0 h-5 bg-rose-100 text-rose-700">
              {emotionTag}
            </Badge>
          </div>
        )}

        {totalReactions > 0 && (
          <div className="flex items-center gap-2 py-2 mt-2">
            <div className="flex -space-x-1">
              {topReactions.map(([type]) => {
                const reaction = REACTION_TYPES.find((r) => r.type === type);
                return reaction ? (
                  <span key={type} className="text-sm">
                    {reaction.emoji}
                  </span>
                ) : null;
              })}
            </div>
            <span className="text-xs text-muted-foreground">
              {totalReactions} reaction{totalReactions !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* ✅ Equal-width actions row */}
        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="grid grid-cols-3 gap-2 w-full">
            <Popover>
              <PopoverTrigger asChild>
                <button aria-pressed={!!userReaction} className={cn(actionBtn, userReaction && "text-primary")}>
                  {userReaction ? (
                    <span className="text-base">{REACTION_TYPES.find((r) => r.type === userReaction)?.emoji}</span>
                  ) : (
                    <ThumbsUp className="h-4 w-4" />
                  )}
                  <span>{userReaction ? REACTION_TYPES.find((r) => r.type === userReaction)?.label : "React"}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" side="top">
                <div className="flex gap-1">
                  {REACTION_TYPES.map((reaction) => (
                    <button
                      key={reaction.type}
                      onClick={() => handleToggleReaction(reaction.type)}
                      aria-pressed={userReaction === reaction.type}
                      className={cn(
                        "text-xl p-1.5 rounded hover:bg-muted transition-transform hover:scale-125",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        userReaction === reaction.type && "bg-primary/20",
                      )}
                      title={reaction.label}
                    >
                      {reaction.emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <button
              onClick={() => setShowComposer(!showComposer)}
              aria-pressed={showComposer}
              className={cn(actionBtn, showComposer && "text-primary")}
            >
              <MessageCircle className="h-4 w-4" />
              <span>Comment</span>
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={actionBtn}>
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
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

        {showComposer && (
          <div className="mt-3 pt-3 border-t border-border/30">
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
