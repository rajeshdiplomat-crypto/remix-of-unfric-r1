import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmotionEntry, QUADRANTS } from "../types";
import { ChevronDown, ChevronUp, ArrowRight, Calendar } from "lucide-react";
import { useTimezone } from "@/hooks/useTimezone";
import { formatTimeAgo } from "@/lib/formatDate";
import { EmotionCalendarSidebar } from "../EmotionCalendarSidebar";

interface EmotionRightRailProps {
  entries: EmotionEntry[];
  onViewPatterns: () => void;
  onDateClick?: (date: string, entries: EmotionEntry[]) => void;
}

/**
 * Right Rail Content
 * - Recent 3 entries (compact view)
 * - Collapsible mini calendar
 * - "View full history" link
 */
export function EmotionRightRail({
  entries,
  onViewPatterns,
  onDateClick,
}: EmotionRightRailProps) {
  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const { timezone } = useTimezone();
  
  const recentEntries = entries.slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Recent Check-ins - Last 3 */}
      <div className="rounded-2xl bg-muted/30 p-3 space-y-3">
        <h3 className="text-xs font-medium text-foreground/70 uppercase tracking-wide">
          Recent Check-ins
        </h3>
        
        {recentEntries.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">
            No check-ins yet
          </p>
        ) : (
          <div className="space-y-2">
            {recentEntries.map((entry) => {
              const quadrant = QUADRANTS[entry.quadrant];
              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-background/50"
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: quadrant.color }}
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground/80 truncate">
                      {entry.emotion}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatTimeAgo(entry.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mini Calendar - Collapsed by Default */}
      <div className="rounded-2xl bg-muted/30 overflow-hidden">
        <button
          onClick={() => setCalendarExpanded(!calendarExpanded)}
          className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
          aria-expanded={calendarExpanded}
          aria-controls="mini-calendar"
        >
          <span className="flex items-center gap-2 text-xs font-medium text-foreground/70 uppercase tracking-wide">
            <Calendar className="h-3 w-3" />
            Calendar
          </span>
          {calendarExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        
        {calendarExpanded && (
          <div id="mini-calendar" className="border-t border-border/50">
            <EmotionCalendarSidebar 
              entries={entries} 
              onDateClick={onDateClick}
            />
          </div>
        )}
      </div>

      {/* View Full History Link */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onViewPatterns}
        className="w-full justify-between text-xs font-medium text-foreground/70 hover:text-foreground h-10 rounded-xl"
        aria-label="View full emotion history and patterns"
      >
        View full history
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
