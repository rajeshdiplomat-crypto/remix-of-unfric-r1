import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RefreshCw, Sparkles, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { JournalEntry, DAILY_PROMPTS, JournalSkin } from "./types";

interface JournalSidebarPanelProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  entries: JournalEntry[];
  onInsertPrompt: (prompt: string) => void;
  skin?: JournalSkin;
}

export function JournalSidebarPanel({
  selectedDate,
  onDateSelect,
  entries,
  onInsertPrompt,
  skin,
}: JournalSidebarPanelProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dailyPrompt, setDailyPrompt] = useState(() => 
    DAILY_PROMPTS[Math.floor(Math.random() * DAILY_PROMPTS.length)]
  );

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const entriesDates = useMemo(() => {
    return new Set(entries.map(e => e.entryDate));
  }, [entries]);

  const hasEntry = (date: Date) => {
    return entriesDates.has(format(date, "yyyy-MM-dd"));
  };

  const recentEntries = useMemo(() => {
    return [...entries]
      .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())
      .slice(0, 8);
  }, [entries]);

  const refreshPrompt = () => {
    const newPrompt = DAILY_PROMPTS[Math.floor(Math.random() * DAILY_PROMPTS.length)];
    setDailyPrompt(newPrompt);
  };

  const cardStyle = skin ? {
    backgroundColor: skin.cardBg,
    borderColor: skin.border,
    color: skin.text,
  } : {};

  const mutedStyle = skin ? { color: skin.mutedText } : {};

  return (
    <div 
      className="w-[400px] flex-shrink-0 sticky top-4 h-[calc(100vh-32px)] overflow-auto space-y-4 pr-2"
      style={skin ? { backgroundColor: skin.panelBg } : undefined}
    >
      {/* Calendar Card */}
      <Card style={cardStyle} className="border border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Calendar
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium min-w-[80px] text-center">
                {format(currentMonth, "MMM yyyy")}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
              <div key={i} className="text-[10px] font-medium" style={mutedStyle}>
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before start of month */}
            {Array.from({ length: daysInMonth[0].getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8" />
            ))}
            {daysInMonth.map((day) => {
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);
              const hasEntryOnDay = hasEntry(day);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => onDateSelect(day)}
                  className={cn(
                    "h-8 w-8 rounded-md text-xs font-medium transition-all relative flex items-center justify-center",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : isTodayDate
                      ? "bg-primary/20 text-primary"
                      : "hover:bg-muted/50"
                  )}
                >
                  {format(day, "d")}
                  {hasEntryOnDay && !isSelected && (
                    <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-3 text-xs"
            onClick={() => onDateSelect(new Date())}
          >
            Jump to Today
          </Button>
        </CardContent>
      </Card>

      {/* Daily Prompt Card */}
      <Card style={cardStyle} className="border border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Daily Prompt
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={refreshPrompt}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm mb-3 italic" style={mutedStyle}>
            "{dailyPrompt}"
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => onInsertPrompt(dailyPrompt)}
          >
            Use this prompt
          </Button>
        </CardContent>
      </Card>

      {/* Recent Entries Card */}
      <Card style={cardStyle} className="border border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Recent Entries</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {recentEntries.length === 0 ? (
            <p className="text-xs" style={mutedStyle}>
              No entries yet. Start writing!
            </p>
          ) : (
            <div className="space-y-2">
              {recentEntries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => onDateSelect(new Date(entry.entryDate))}
                  className={cn(
                    "w-full text-left p-2 rounded-md hover:bg-muted/30 transition-colors",
                    isSameDay(new Date(entry.entryDate), selectedDate) && "bg-muted/50"
                  )}
                >
                  <div className="text-sm font-medium truncate">
                    {entry.title || "Untitled"}
                  </div>
                  <div className="text-xs" style={mutedStyle}>
                    {format(new Date(entry.entryDate), "MMM d, yyyy")}
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
