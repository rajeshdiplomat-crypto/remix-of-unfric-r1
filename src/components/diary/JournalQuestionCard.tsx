import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PenLine, Bookmark, BookmarkCheck, Edit2, Maximize2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface JournalQuestionCardProps {
  questionLabel: string;
  answerContent: string;
  journalDate: string; // The date being written about (entry_date)
  entryDate: string; // When user wrote it (created_at)
  emotionTag?: string;
  isSaved: boolean;
  onToggleSave: () => void;
  onEdit: () => void;
  onNavigate: () => void;
}

export function JournalQuestionCard({
  questionLabel,
  answerContent,
  journalDate,
  entryDate,
  emotionTag,
  isSaved,
  onToggleSave,
  onEdit,
  onNavigate,
}: JournalQuestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const journalDateObj = new Date(journalDate);
  const entryDateObj = new Date(entryDate);
  
  const formattedJournalDate = format(journalDateObj, "d MMM");
  const formattedEntryDate = `${format(entryDateObj, "d MMM yy")}, ${format(entryDateObj, "h:mm a").toLowerCase()}`;
  const fullJournalDate = journalDateObj.toISOString();
  const fullEntryDate = entryDateObj.toISOString();

  const isEmptyAnswer = !answerContent || answerContent.trim() === "";
  const truncatedContent = answerContent?.length > 140 
    ? answerContent.substring(0, 140).trim() + "…" 
    : answerContent;
  const needsReadMore = answerContent?.length > 140;

  return (
    <>
      <Card className="overflow-hidden bg-card border-border/40 shadow-sm hover:shadow-md transition-shadow p-4 rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-muted-foreground cursor-default">
                  <span className="font-medium text-foreground">Journal</span>
                  <span className="mx-1.5">|</span>
                  <span>{formattedJournalDate}</span>
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

        {/* Body */}
        <CardContent className="p-0">
          {/* Title (Question) */}
          <h3 className="text-sm font-semibold text-foreground mb-2 line-clamp-1">
            {questionLabel}
          </h3>

          {/* Content (Answer) */}
          {isEmptyAnswer ? (
            <div className="flex items-center justify-between py-3 px-3 bg-muted/30 rounded-lg">
              <span className="text-sm text-muted-foreground italic">
                No answer yet — Add your response
              </span>
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
            <p className="text-sm text-foreground/80 leading-relaxed mb-3">
              {truncatedContent}
              {needsReadMore && (
                <button 
                  onClick={() => setIsExpanded(true)}
                  className="text-primary hover:text-primary/80 ml-1 text-sm font-medium"
                >
                  Read more
                </button>
              )}
            </p>
          )}

          {/* Metadata Row */}
          <div className="flex items-center justify-between pt-2 border-t border-border/30 mt-3">
            <div className="flex items-center gap-2">
              <PenLine className="h-3.5 w-3.5 text-muted-foreground" />
              {emotionTag && (
                <Badge 
                  variant="secondary" 
                  className="text-xs px-2 py-0 h-5 bg-rose-100 text-rose-700"
                >
                  {emotionTag}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={onToggleSave}
              >
                {isSaved ? (
                  <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Bookmark className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={onEdit}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => setIsExpanded(true)}
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expand Modal */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>
                <span className="font-medium text-foreground">Journal</span>
                <span className="mx-1.5">|</span>
                <span>{formattedJournalDate}</span>
              </span>
              <span>{formattedEntryDate}</span>
            </div>
            <DialogTitle className="text-lg font-semibold">
              {questionLabel}
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            {isEmptyAnswer ? (
              <p className="text-muted-foreground italic">No answer yet</p>
            ) : (
              <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {answerContent}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-4 border-t border-border/30 mt-4">
            <PenLine className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Journal Entry</span>
            {emotionTag && (
              <Badge 
                variant="secondary" 
                className="text-xs px-2 py-0 h-5 bg-rose-100 text-rose-700 ml-auto"
              >
                {emotionTag}
              </Badge>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
