import { useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, Sparkles, HandHeart, Search } from "lucide-react";

interface JournalEntry {
  id: string;
  entry_date: string;
  daily_feeling: string | null;
  daily_gratitude: string | null;
  daily_kindness: string | null;
  created_at: string;
}

interface JournalFeedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: JournalEntry[];
  onSelectDate: (date: Date) => void;
}

export function JournalFeedDialog({
  open,
  onOpenChange,
  entries,
  onSelectDate,
}: JournalFeedDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEntries = entries.filter((entry) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const dateStr = format(new Date(entry.entry_date), "MMMM d, yyyy EEEE").toLowerCase();
    return (
      dateStr.includes(query) ||
      entry.daily_feeling?.toLowerCase().includes(query) ||
      entry.daily_gratitude?.toLowerCase().includes(query) ||
      entry.daily_kindness?.toLowerCase().includes(query)
    );
  });

  const handleEntryClick = (entry: JournalEntry) => {
    onSelectDate(new Date(entry.entry_date));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Journal Feed</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search entries by date or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-[400px] pr-4">
          {filteredEntries.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {searchQuery ? "No entries found matching your search" : "No journal entries yet"}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer border border-border/50"
                  onClick={() => handleEntryClick(entry)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground">
                      {format(new Date(entry.entry_date), "EEEE, MMMM d, yyyy")}
                    </span>
                    <div className="flex gap-2">
                      {entry.daily_feeling && <Heart className="h-4 w-4 text-pink-500" />}
                      {entry.daily_gratitude && <Sparkles className="h-4 w-4 text-yellow-500" />}
                      {entry.daily_kindness && <HandHeart className="h-4 w-4 text-green-500" />}
                    </div>
                  </div>
                  {entry.daily_feeling && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                      <span className="font-medium text-pink-600">Feelings:</span> {entry.daily_feeling}
                    </p>
                  )}
                  {entry.daily_gratitude && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                      <span className="font-medium text-yellow-600">Gratitude:</span> {entry.daily_gratitude}
                    </p>
                  )}
                  {entry.daily_kindness && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      <span className="font-medium text-green-600">Kindness:</span> {entry.daily_kindness}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
