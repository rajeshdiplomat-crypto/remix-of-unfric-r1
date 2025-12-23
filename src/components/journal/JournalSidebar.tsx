import { format, isToday } from "date-fns";
import { ChevronDown } from "lucide-react";

interface JournalEntry {
  id: string;
  entry_date: string;
  daily_feeling: string | null;
  daily_gratitude: string | null;
  daily_kindness: string | null;
  created_at: string;
  tags: string[] | null;
}

interface JournalSidebarProps {
  entries: JournalEntry[];
  currentDate: Date;
  onSelectDate: (date: Date) => void;
  onUsePrompt?: (prompt: string) => void;
}

// Daily prompts for reflection
const DAILY_PROMPTS = [
  '"Describe a place where you feel completely safe. What does it smell like? What do you hear?"',
  '"What moment today made you pause and appreciate life?"',
  '"If you could tell your past self one thing, what would it be?"',
  '"What are you learning about yourself lately?"',
  '"What small thing brought you joy today?"',
  '"What would your ideal day look like?"',
  '"What are you ready to let go of?"',
  '"What makes you feel most alive?"',
];

export function JournalSidebar({
  entries,
  currentDate,
  onSelectDate,
  onUsePrompt,
}: JournalSidebarProps) {
  // Get a consistent daily prompt based on the date
  const getDailyPrompt = () => {
    const dayOfYear = Math.floor(
      (currentDate.getTime() - new Date(currentDate.getFullYear(), 0, 0).getTime()) / 
      (1000 * 60 * 60 * 24)
    );
    return DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length];
  };

  const formatEntryDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return `Today, ${format(date, "h:mm a")}`;
    }
    return format(date, "MMM d, yyyy");
  };

  const getEntryPreview = (entry: JournalEntry) => {
    const content = entry.daily_feeling || entry.daily_gratitude || entry.daily_kindness || "";
    return content.length > 80 ? content.substring(0, 80) + "..." : content;
  };

  const getEntryTitle = (entry: JournalEntry) => {
    // Try to extract a title from the first line of content
    const content = entry.daily_feeling || entry.daily_gratitude || "";
    const firstLine = content.split("\n")[0];
    if (firstLine && firstLine.length > 3 && firstLine.length < 50) {
      return firstLine;
    }
    // Default to date-based title - escape literal text with single quotes
    return format(new Date(entry.entry_date), "EEEE") + " Reflection";
  };

  const recentEntries = entries.slice(0, 5);

  return (
    <div className="w-72 flex-shrink-0 space-y-6">
      {/* Daily Prompt */}
      <div className="bg-card rounded-xl border border-border/50 p-4">
        <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
          Daily Prompt
        </h3>
        <p className="text-sm text-primary leading-relaxed mb-3">
          {getDailyPrompt()}
        </p>
        <button
          onClick={() => onUsePrompt?.(getDailyPrompt())}
          className="flex items-center gap-1 text-sm text-primary font-medium hover:underline transition-all"
        >
          Use this prompt
          <ChevronDown className="h-3.5 w-3.5 rotate-[-90deg]" />
        </button>
      </div>

      {/* Recent Journals */}
      <div>
        <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3 px-1">
          Recent Journals
        </h3>
        <div className="space-y-1">
          {recentEntries.length > 0 ? (
            recentEntries.map((entry) => {
              const isActive = entry.entry_date === format(currentDate, "yyyy-MM-dd");
              return (
                <button
                  key={entry.id}
                  onClick={() => onSelectDate(new Date(entry.entry_date))}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 group relative ${
                    isActive 
                      ? "bg-primary/5" 
                      : "hover:bg-muted/50"
                  }`}
                >
                  {/* Active indicator */}
                  <div 
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-full transition-all duration-200 ${
                      isActive ? "h-12 bg-primary" : "h-0 bg-primary"
                    }`}
                  />
                  
                  <div className="pl-2">
                    <h4 className="text-sm font-medium text-foreground mb-0.5 line-clamp-1">
                      {getEntryTitle(entry)}
                    </h4>
                    <p className="text-xs text-muted-foreground mb-1">
                      {formatEntryDate(entry.entry_date)}
                    </p>
                    <p className="text-xs text-muted-foreground/80 line-clamp-2">
                      {getEntryPreview(entry)}
                    </p>
                  </div>
                </button>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground px-3 py-4">
              No journal entries yet. Start writing to see your entries here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
