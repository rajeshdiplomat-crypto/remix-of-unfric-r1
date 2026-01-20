import { useRef } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";
import { EmotionEntry, QUADRANTS } from "./types";
import { Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface JourneyTimelineProps {
  entries: EmotionEntry[];
  onEdit: (entry: EmotionEntry) => void;
  onDelete: (entryId: string) => void;
  maxEntries?: number;
}

const formatTimeAgo = (dateStr: string, createdAt: string) => {
  const date = new Date(createdAt);
  if (isToday(date)) {
    const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    return `${hours}h ago`;
  }
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d");
};

export function JourneyTimeline({ 
  entries, 
  onEdit, 
  onDelete, 
  maxEntries = 12 
}: JourneyTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const displayedEntries = entries.slice(0, maxEntries);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 200;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">🌱</div>
        <p className="text-sm text-muted-foreground">
          Your emotional journey begins here
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Check in above to start tracking
        </p>
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Scroll buttons */}
      {entries.length > 4 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-background/80 backdrop-blur-sm shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-background/80 backdrop-blur-sm shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Timeline container */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-hide scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {displayedEntries.map((entry, index) => {
          const quadrantInfo = QUADRANTS[entry.quadrant];
          const timeAgo = formatTimeAgo(entry.entry_date, entry.created_at);

          return (
            <Popover key={entry.id}>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "flex-shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all",
                    "hover:scale-105 hover:shadow-md active:scale-95",
                    "min-w-[80px] border border-border/30",
                    index === 0 && "ring-2 ring-offset-2 ring-offset-background"
                  )}
                  style={{ 
                    backgroundColor: quadrantInfo.bgColor,
                    borderColor: quadrantInfo.borderColor,
                    ...(index === 0 ? { ringColor: quadrantInfo.color } : {}),
                  }}
                >
                  {/* Emotion dot */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-base shadow-sm"
                    style={{ backgroundColor: quadrantInfo.color }}
                  >
                    <span className="text-white text-xs font-semibold">
                      {entry.emotion.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  {/* Emotion name */}
                  <span 
                    className="text-xs font-medium truncate max-w-[70px]"
                    style={{ color: quadrantInfo.color }}
                  >
                    {entry.emotion}
                  </span>
                  
                  {/* Time */}
                  <span className="text-[10px] text-muted-foreground">
                    {timeAgo}
                  </span>
                </button>
              </PopoverTrigger>
              
              <PopoverContent 
                className="w-64 p-3 rounded-xl" 
                side="bottom"
                align="center"
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: quadrantInfo.color }}
                    />
                    <span className="font-medium" style={{ color: quadrantInfo.color }}>
                      {entry.emotion}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {format(new Date(entry.created_at), "h:mm a")}
                    </span>
                  </div>

                  {/* Note */}
                  {entry.note && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {entry.note}
                    </p>
                  )}

                  {/* Context tags */}
                  {(entry.context?.who || entry.context?.what) && (
                    <div className="flex flex-wrap gap-1.5">
                      {entry.context.who && (
                        <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                          With: {entry.context.who}
                        </span>
                      )}
                      {entry.context.what && (
                        <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                          {entry.context.what}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={() => onEdit(entry)}
                    >
                      <Pencil className="h-3 w-3 mr-1.5" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 h-8 text-xs text-destructive hover:text-destructive"
                      onClick={() => onDelete(entry.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          );
        })}
      </div>

      {/* Subtle gradient fade on edges */}
      <div className="absolute left-0 top-0 bottom-2 w-6 bg-gradient-to-r from-background to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-2 w-6 bg-gradient-to-l from-background to-transparent pointer-events-none" />
    </div>
  );
}
