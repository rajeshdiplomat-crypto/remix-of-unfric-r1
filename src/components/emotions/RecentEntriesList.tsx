import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmotionEntry, QUADRANTS } from "./types";
import { ChevronDown, ChevronUp, Pencil, Trash2, Clock } from "lucide-react";
import { useTimezone } from "@/hooks/useTimezone";
import { formatTimeAgo, formatDateInTimezone, formatTimeInTimezone } from "@/lib/formatDate";

interface RecentEntriesListProps {
  entries: EmotionEntry[];
  onEditEntry: (entry: EmotionEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  maxItems?: number;
}

export function RecentEntriesList({
  entries,
  onEditEntry,
  onDeleteEntry,
  maxItems = 20,
}: RecentEntriesListProps) {
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const { timezone } = useTimezone();

  const toggleExpand = (id: string) => {
    setExpandedEntryId((prev) => (prev === id ? null : id));
  };

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden h-full flex flex-col">
        {/* Header - same as when entries exist */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-500" />
            <span className="font-semibold text-sm text-foreground">Recent Check-ins</span>
          </div>
          <span className="text-xs text-muted-foreground">0 total</span>
        </div>
        {/* Empty state content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <Clock className="h-8 w-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">No check-ins yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-indigo-500" />
          <span className="font-semibold text-sm text-foreground">Recent Check-ins</span>
        </div>
        <span className="text-xs text-muted-foreground">{entries.length} total</span>
      </div>

      {/* Entries List - fills remaining height */}
      <div className="divide-y divide-border flex-1 overflow-y-auto">
        {entries.slice(0, maxItems).map((entry) => {
          const isExpanded = expandedEntryId === entry.id;
          const quadrant = QUADRANTS[entry.quadrant];
          const timeAgo = formatTimeAgo(entry.created_at);
          const dateDisplay = formatDateInTimezone(entry.created_at, "MMM d", timezone);
          const timeDisplay = formatTimeInTimezone(entry.created_at, timezone);

          return (
            <div key={entry.id} className="group">
              <div
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => toggleExpand(entry.id)}
              >
                {/* Color indicator */}
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: quadrant.color }}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground truncate">
                      {entry.emotion}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-muted-foreground">{timeAgo}</span>
                    <span className="text-[10px] text-muted-foreground/50">•</span>
                    <span className="text-[11px] text-muted-foreground">{dateDisplay}</span>
                    <span className="text-[10px] text-muted-foreground/50">•</span>
                    <span className="text-[11px] text-muted-foreground">{timeDisplay}</span>
                  </div>
                </div>

                {/* Expand icon */}
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0">
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </Button>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-3 space-y-2 bg-muted/30">
                  {/* Quadrant label */}
                  <div
                    className="text-xs px-2 py-1 rounded-md inline-block"
                    style={{ backgroundColor: quadrant.bgColor, color: quadrant.color }}
                  >
                    {quadrant.label}
                  </div>

                  {/* Note */}
                  {entry.note && (
                    <p className="text-sm text-muted-foreground">{entry.note}</p>
                  )}

                  {/* Context tags */}
                  {entry.context && (entry.context.who || entry.context.what) && (
                    <div className="flex flex-wrap gap-1.5">
                      {entry.context.who && (
                        <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                          With: {entry.context.who}
                        </span>
                      )}
                      {entry.context.what && (
                        <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                          {entry.context.what}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs rounded-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditEntry(entry);
                      }}
                    >
                      <Pencil className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteEntry(entry.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
