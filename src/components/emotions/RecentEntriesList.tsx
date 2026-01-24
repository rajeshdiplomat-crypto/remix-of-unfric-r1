import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmotionEntry, QUADRANTS } from "./types";
import { format, formatDistanceToNow } from "date-fns";
import { ChevronDown, ChevronUp, Pencil, Trash2, Clock } from "lucide-react";

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

  const toggleExpand = (id: string) => {
    setExpandedEntryId((prev) => (prev === id ? null : id));
  };

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm p-6 text-center">
        <Clock className="h-8 w-8 mx-auto text-slate-300 mb-2" />
        <p className="text-sm text-slate-500">No check-ins yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-indigo-500" />
          <span className="font-semibold text-sm text-slate-800 dark:text-white">Recent Check-ins</span>
        </div>
        <span className="text-xs text-slate-500">{entries.length} total</span>
      </div>

      {/* Entries List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[400px] overflow-y-auto">
        {entries.slice(0, maxItems).map((entry) => {
          const isExpanded = expandedEntryId === entry.id;
          const quadrant = QUADRANTS[entry.quadrant];
          const timeAgo = formatDistanceToNow(new Date(entry.created_at), { addSuffix: true });

          return (
            <div key={entry.id} className="group">
              <div
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
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
                    <span className="font-medium text-sm text-slate-800 dark:text-white truncate">
                      {entry.emotion}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-slate-400">{timeAgo}</span>
                    <span className="text-[10px] text-slate-300">•</span>
                    <span className="text-[11px] text-slate-400">{format(new Date(entry.entry_date), "MMM d")}</span>
                  </div>
                </div>

                {/* Expand icon */}
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0">
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </Button>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-3 space-y-2 bg-slate-50/50 dark:bg-slate-800/50">
                  {/* Quadrant label */}
                  <div
                    className="text-xs px-2 py-1 rounded-md inline-block"
                    style={{ backgroundColor: quadrant.bgColor, color: quadrant.color }}
                  >
                    {quadrant.label}
                  </div>

                  {/* Note */}
                  {entry.note && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">{entry.note}</p>
                  )}

                  {/* Context tags */}
                  {entry.context && (entry.context.who || entry.context.what) && (
                    <div className="flex flex-wrap gap-1.5">
                      {entry.context.who && (
                        <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300">
                          With: {entry.context.who}
                        </span>
                      )}
                      {entry.context.what && (
                        <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300">
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
