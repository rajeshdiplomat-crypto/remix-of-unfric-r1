import { format, parseISO } from "date-fns";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { extractImagesFromTiptapJSON } from "@/lib/editorUtils";
import { JournalEntry } from "./types";
import { cn } from "@/lib/utils";

interface JournalRecentEntriesViewProps {
  entries: JournalEntry[];
  onSelectEntry: (entryDate: string) => void;
  onClose: () => void;
}

const MOOD_COLORS: Record<string, string> = {
  great: "bg-emerald-500",
  good: "bg-blue-500",
  okay: "bg-amber-500",
  low: "bg-rose-500",
};

export function JournalRecentEntriesView({ entries, onSelectEntry, onClose }: JournalRecentEntriesViewProps) {
  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-in fade-in-0 duration-200 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-background/80 border-b border-border px-4 sm:px-6 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-sm font-normal uppercase tracking-widest text-foreground">Recent Entries</h1>
        <span className="text-xs text-muted-foreground ml-auto">{entries.length} entries</span>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <FileText className="h-12 w-12 mb-4 opacity-40" />
            <p className="text-sm">No journal entries yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {entries.map((entry) => {
              const images = extractImagesFromTiptapJSON(entry.contentJSON);
              const firstImage = images[0];
              const date = parseISO(entry.entryDate);
              const moodColor = entry.mood ? MOOD_COLORS[entry.mood] : null;

              return (
                <button
                  key={entry.id}
                  onClick={() => onSelectEntry(entry.entryDate)}
                  className={cn(
                    "group text-left rounded-xl border border-border bg-card overflow-hidden",
                    "transition-all duration-200 hover:border-foreground/20 hover:shadow-lg hover:shadow-foreground/5",
                    "focus:outline-none focus:ring-2 focus:ring-ring"
                  )}
                >
                  {/* Image cover */}
                  {firstImage ? (
                    <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
                      <img
                        src={firstImage}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/9] w-full bg-muted/50 flex items-center justify-center">
                      <FileText className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4 space-y-2">
                    {/* Date & mood */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-semibold text-foreground">{format(date, "MMM d, yyyy")}</p>
                        <p className="text-xs text-muted-foreground">{format(date, "EEEE")}</p>
                      </div>
                      {moodColor && (
                        <span className={cn("h-3 w-3 rounded-full shrink-0", moodColor)} />
                      )}
                    </div>

                    {/* Title */}
                    {entry.title && entry.title !== "Untitled" && entry.title !== entry.mood && (
                      <p className="text-sm font-medium text-foreground truncate">{entry.title}</p>
                    )}

                    {/* Preview */}
                    {entry.preview && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{entry.preview}</p>
                    )}

                    {/* Last edited */}
                    <p className="text-[10px] text-muted-foreground/60 pt-1">
                      Edited {format(parseISO(entry.updatedAt), "h:mm a")}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
