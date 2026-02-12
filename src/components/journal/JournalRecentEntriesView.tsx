import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { ArrowLeft, FileText, Grid3X3, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { extractImagesFromTiptapJSON } from "@/lib/editorUtils";
import { JournalEntry } from "./types";
import { cn } from "@/lib/utils";

interface JournalRecentEntriesViewProps {
  entries: JournalEntry[];
  onSelectEntry: (entryDate: string) => void;
  onClose: () => void;
}

type ViewMode = "large" | "small" | "list";

const MOOD_COLORS: Record<string, string> = {
  great: "bg-emerald-500",
  good: "bg-blue-500",
  okay: "bg-amber-500",
  low: "bg-rose-500",
};

const VIEW_OPTIONS: { mode: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
  { mode: "large", icon: LayoutGrid, label: "Large Grid" },
  { mode: "small", icon: Grid3X3, label: "Small Grid" },
  { mode: "list", icon: List, label: "List" },
];

export function JournalRecentEntriesView({ entries, onSelectEntry, onClose }: JournalRecentEntriesViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("large");

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-in fade-in-0 duration-200 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-background/80 border-b border-border px-4 sm:px-6 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-sm font-normal uppercase tracking-widest text-foreground">Recent Entries</h1>

        {/* View toggles */}
        <div className="ml-auto flex items-center gap-1 bg-muted rounded-lg p-0.5">
          {VIEW_OPTIONS.map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              title={label}
              className={cn(
                "p-1.5 rounded-md transition-all duration-150",
                viewMode === mode
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        <span className="text-xs text-muted-foreground">{entries.length} entries</span>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <FileText className="h-12 w-12 mb-4 opacity-40" />
            <p className="text-sm">No journal entries yet</p>
          </div>
        ) : viewMode === "list" ? (
          /* ── List View ── */
          <div className="flex flex-col gap-1">
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
                    "group flex items-center gap-4 text-left rounded-lg border border-border bg-card px-4 py-3",
                    "transition-all duration-200 hover:border-foreground/20 hover:bg-muted/50",
                    "focus:outline-none focus:ring-2 focus:ring-ring"
                  )}
                >
                  {/* Thumbnail */}
                  {firstImage ? (
                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted shrink-0">
                      <img src={firstImage} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-muted-foreground/30" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{format(date, "MMM d, yyyy")}</p>
                      <span className="text-xs text-muted-foreground">{format(date, "EEEE")}</span>
                      {moodColor && <span className={cn("h-2 w-2 rounded-full shrink-0", moodColor)} />}
                    </div>
                    {entry.preview && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{entry.preview}</p>
                    )}
                  </div>

                  <span className="text-[10px] text-muted-foreground/60 shrink-0">
                    {format(parseISO(entry.updatedAt), "h:mm a")}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          /* ── Grid Views (large / small) ── */
          <div
            className={cn(
              "grid gap-4",
              viewMode === "large"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            )}
          >
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
                    <div className={cn(
                      "w-full overflow-hidden bg-muted",
                      viewMode === "large" ? "aspect-[16/9]" : "aspect-square"
                    )}>
                      <img
                        src={firstImage}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className={cn(
                      "w-full bg-muted/50 flex items-center justify-center",
                      viewMode === "large" ? "aspect-[16/9]" : "aspect-square"
                    )}>
                      <FileText className={cn(
                        "text-muted-foreground/30",
                        viewMode === "large" ? "h-10 w-10" : "h-6 w-6"
                      )} />
                    </div>
                  )}

                  {/* Content */}
                  <div className={cn("space-y-1", viewMode === "large" ? "p-4 space-y-2" : "p-2.5")}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={cn(
                          "font-semibold text-foreground",
                          viewMode === "large" ? "text-lg" : "text-xs"
                        )}>
                          {format(date, viewMode === "large" ? "MMM d, yyyy" : "MMM d")}
                        </p>
                        {viewMode === "large" && (
                          <p className="text-xs text-muted-foreground">{format(date, "EEEE")}</p>
                        )}
                      </div>
                      {moodColor && (
                        <span className={cn("rounded-full shrink-0", moodColor, viewMode === "large" ? "h-3 w-3" : "h-2 w-2")} />
                      )}
                    </div>

                    {viewMode === "large" && entry.title && entry.title !== "Untitled" && entry.title !== entry.mood && (
                      <p className="text-sm font-medium text-foreground truncate">{entry.title}</p>
                    )}

                    {viewMode === "large" && entry.preview && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{entry.preview}</p>
                    )}

                    {viewMode === "large" && (
                      <p className="text-[10px] text-muted-foreground/60 pt-1">
                        Edited {format(parseISO(entry.updatedAt), "h:mm a")}
                      </p>
                    )}
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
