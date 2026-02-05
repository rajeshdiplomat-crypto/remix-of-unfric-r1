import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmotionEntry, QUADRANTS } from "./types";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { cn } from "@/lib/utils";

interface EmotionsPageLayoutProps {
  children: React.ReactNode;
  entries: EmotionEntry[];
  onDateClick?: (date: string, entries: EmotionEntry[]) => void;
  showCalendar?: boolean;
}

export function EmotionsPageLayout({ 
  children, 
  entries, 
  onDateClick,
  showCalendar = true 
}: EmotionsPageLayoutProps) {
  const [calendarExpanded, setCalendarExpanded] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Get entries by date for calendar dots
  const entriesByDate = entries.reduce((acc, entry) => {
    if (!acc[entry.entry_date]) {
      acc[entry.entry_date] = [];
    }
    acc[entry.entry_date].push(entry);
    return acc;
  }, {} as Record<string, EmotionEntry[]>);

  // Get dominant quadrant for a date
  const getDominantQuadrant = (dateEntries: EmotionEntry[]) => {
    const counts: Record<string, number> = {};
    dateEntries.forEach(e => {
      counts[e.quadrant] = (counts[e.quadrant] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || null;
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date || !onDateClick) return;
    const dateStr = format(date, "yyyy-MM-dd");
    const dayEntries = entriesByDate[dateStr] || [];
    if (dayEntries.length > 0) {
      onDateClick(dateStr, dayEntries);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Calendar Sidebar - Left */}
      {showCalendar && (
        <div 
          className={cn(
            "shrink-0 border-r border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-500 ease-out overflow-hidden",
            calendarExpanded ? "w-[280px]" : "w-12"
          )}
        >
          <div className="h-full flex flex-col">
            {/* Toggle Button */}
            <div className="p-3 flex items-center justify-between border-b border-border/30">
              {calendarExpanded && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {format(selectedMonth, "MMMM yyyy")}
                  </span>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCalendarExpanded(!calendarExpanded)}
                className="h-8 w-8 rounded-lg hover:bg-muted"
              >
                {calendarExpanded ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Calendar Content */}
            {calendarExpanded && (
              <div className="flex-1 p-4 overflow-y-auto">
                <CalendarComponent
                  mode="single"
                  selected={undefined}
                  onSelect={handleDateSelect}
                  month={selectedMonth}
                  onMonthChange={setSelectedMonth}
                  className="rounded-xl"
                  modifiers={{
                    hasEntry: (date) => {
                      const dateStr = format(date, "yyyy-MM-dd");
                      return !!entriesByDate[dateStr];
                    },
                  }}
                  modifiersStyles={{
                    hasEntry: {
                      fontWeight: 600,
                    },
                  }}
                  components={{
                    Day: ({ date, ...props }) => {
                      const dateStr = format(date, "yyyy-MM-dd");
                      const dayEntries = entriesByDate[dateStr];
                      const dominantQuadrant = dayEntries ? getDominantQuadrant(dayEntries) : null;
                      
                      return (
                        <button
                          {...props}
                          onClick={() => handleDateSelect(date)}
                          className={cn(
                            "relative h-9 w-9 p-0 font-normal text-sm rounded-lg",
                            "hover:bg-muted transition-colors",
                            dayEntries && "font-semibold"
                          )}
                        >
                          {format(date, "d")}
                          {dominantQuadrant && (
                            <div 
                              className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: QUADRANTS[dominantQuadrant as keyof typeof QUADRANTS].color }}
                            />
                          )}
                        </button>
                      );
                    },
                  }}
                />

                {/* Legend */}
                <div className="mt-6 space-y-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-3">
                    Mood Legend
                  </p>
                  {Object.entries(QUADRANTS).map(([key, quadrant]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div 
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: quadrant.color }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {quadrant.label.split(",")[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Collapsed state - just icon */}
            {!calendarExpanded && (
              <div className="flex-1 flex flex-col items-center py-4 gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[900px] mx-auto px-6 lg:px-8 py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
