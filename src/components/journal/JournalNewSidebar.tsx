import { format, isToday } from "date-fns";
import { ChevronDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface JournalEntry {
  id: string;
  entry_date: string;
  daily_feeling: string | null;
  daily_gratitude: string | null;
  daily_kindness: string | null;
  created_at: string;
  tags: string[] | null;
}

interface JournalNewSidebarProps {
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

export function JournalNewSidebar({
  entries,
  currentDate,
  onSelectDate,
  onUsePrompt,
}: JournalNewSidebarProps) {
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
    return format(date, "MMM d, yyyy");
  };

  const getEntryPreview = (entry: JournalEntry) => {
    const content = entry.daily_feeling || entry.daily_gratitude || entry.daily_kindness || "";
    // Skip headings for preview
    const lines = content.split("\n").filter(l => !l.startsWith("##"));
    const preview = lines.join(" ").slice(0, 60);
    return preview ? preview + (preview.length >= 60 ? "..." : "") : "No content";
  };

  const getEntryTitle = (entry: JournalEntry) => {
    const content = entry.daily_feeling || entry.daily_gratitude || "";
    const firstLine = content.split("\n")[0];
    if (firstLine && !firstLine.startsWith("##") && firstLine.length > 3 && firstLine.length < 50) {
      return firstLine;
    }
    return format(new Date(entry.entry_date), "EEEE") + " Reflection";
  };

  const recentEntries = entries.slice(0, 10);

  return (
    <div className="w-72 flex-shrink-0 space-y-6">
      {/* Daily Prompt */}
      <div className="bg-card rounded-xl border border-border/50 p-4">
        <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
          Daily Prompt
        </h3>
        <p className="text-sm text-primary leading-relaxed mb-3">{getDailyPrompt()}</p>
        <button
          onClick={() => onUsePrompt?.(getDailyPrompt())}
          className="flex items-center gap-1 text-sm text-primary font-medium hover:underline transition-all"
        >
          Use this prompt
          <ChevronDown className="h-3.5 w-3.5 rotate-[-90deg]" />
        </button>
      </div>

      {/* Recent Entries - Shows Date */}
      <div>
        <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3 px-1">
          Recent Entries
        </h3>
        <ScrollArea className="h-[400px]">
          <div className="space-y-1 pr-2">
            {recentEntries.length > 0 ? (
              recentEntries.map((entry) => {
                const isActive = entry.entry_date === format(currentDate, "yyyy-MM-dd");
                const entryDate = new Date(entry.entry_date);
                return (
                  <button
                    key={entry.id}
                    onClick={() => onSelectDate(entryDate)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 group relative ${
                      isActive ? "bg-primary/5" : "hover:bg-muted/50"
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
                      <p className="text-xs text-muted-foreground mb-1 font-medium">
                        {formatEntryDate(entry.entry_date)}
                        {isToday(entryDate) && (
                          <span className="ml-2 text-primary">(Today)</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground/80 line-clamp-1">
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
        </ScrollArea>
      </div>
    </div>
  );
}
