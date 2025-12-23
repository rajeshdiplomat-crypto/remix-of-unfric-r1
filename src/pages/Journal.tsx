import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { JournalDiaryPage } from "@/components/journal/JournalDiaryPage";
import { JournalFeedDialog } from "@/components/journal/JournalFeedDialog";

// Add Google Fonts for handwriting
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Architects+Daughter&family=Caveat:wght@400;700&family=Dancing+Script:wght@400;700&family=Indie+Flower&family=Patrick+Hand&family=Shadows+Into+Light&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

interface JournalEntry {
  id: string;
  entry_date: string;
  daily_feeling: string | null;
  daily_gratitude: string | null;
  daily_kindness: string | null;
  created_at: string;
  tags: string[] | null;
}

export default function Journal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dailyFeeling, setDailyFeeling] = useState("");
  const [dailyGratitude, setDailyGratitude] = useState("");
  const [dailyKindness, setDailyKindness] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [allEntries, setAllEntries] = useState<JournalEntry[]>([]);
  const [entriesWithDates, setEntriesWithDates] = useState<string[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [feedOpen, setFeedOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchAllEntries();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchEntry();
  }, [user, selectedDate]);

  const fetchAllEntries = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: false })
      .limit(50);

    if (data) {
      setAllEntries(data);
      setEntriesWithDates(data.map(e => e.entry_date));
    }
  };

  const fetchEntry = async () => {
    setLoading(true);
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    const { data } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user?.id)
      .eq("entry_date", dateStr)
      .maybeSingle();

    if (data) {
      setDailyFeeling(data.daily_feeling || "");
      setDailyGratitude(data.daily_gratitude || "");
      setDailyKindness(data.daily_kindness || "");
      setTags(data.tags || []);
      setEntryId(data.id);
    } else {
      setDailyFeeling("");
      setDailyGratitude("");
      setDailyKindness("");
      setTags([]);
      setEntryId(null);
    }
    setLoading(false);
  };

  const saveEntry = async () => {
    if (!user) return;

    setSaving(true);
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    if (entryId) {
      const { error } = await supabase
        .from("journal_entries")
        .update({
          daily_feeling: dailyFeeling,
          daily_gratitude: dailyGratitude,
          daily_kindness: dailyKindness,
          tags: tags,
        })
        .eq("id", entryId);

      if (error) {
        toast({ title: "Error", description: "Failed to update journal", variant: "destructive" });
      } else {
        toast({ title: "Saved!", description: "Your journal entry has been updated" });
        fetchAllEntries();
      }
    } else {
      const { data, error } = await supabase
        .from("journal_entries")
        .insert({
          user_id: user.id,
          entry_date: dateStr,
          daily_feeling: dailyFeeling,
          daily_gratitude: dailyGratitude,
          daily_kindness: dailyKindness,
          tags: tags,
        })
        .select()
        .single();

      if (error) {
        toast({ title: "Error", description: "Failed to save journal", variant: "destructive" });
      } else {
        setEntryId(data.id);
        toast({ title: "Saved!", description: "Your journal entry has been saved" });
        fetchAllEntries();
      }
    }

    setSaving(false);
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    setSelectedDate(newDate);
  };

  const handleDeleteEntry = async () => {
    if (!entryId) return;
    
    const { error } = await supabase
      .from("journal_entries")
      .delete()
      .eq("id", entryId);
    
    if (error) {
      toast({ title: "Error", description: "Failed to delete entry", variant: "destructive" });
    } else {
      setDailyFeeling("");
      setDailyGratitude("");
      setDailyKindness("");
      setTags([]);
      setEntryId(null);
      fetchAllEntries();
    }
  };

  const handleDuplicateEntry = () => {
    // Copy current content to tomorrow
    const tomorrow = new Date(selectedDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow);
    toast({ title: "Entry duplicated", description: "Content copied to next day" });
  };

  const handleExportEntry = (exportFormat: "text" | "markdown") => {
    const dateStr = format(selectedDate, "MMMM d, yyyy");
    let content = "";
    
    if (exportFormat === "markdown") {
      content = `# Journal Entry - ${dateStr}\n\n`;
      content += `## Feelings\n${dailyFeeling || "No entry"}\n\n`;
      content += `## Gratitude\n${dailyGratitude || "No entry"}\n\n`;
      content += `## Kindness\n${dailyKindness || "No entry"}\n\n`;
      if (tags.length > 0) {
        content += `**Tags:** ${tags.map(t => `#${t}`).join(" ")}\n`;
      }
    } else {
      content = `Journal Entry - ${dateStr}\n\n`;
      content += `Feelings:\n${dailyFeeling || "No entry"}\n\n`;
      content += `Gratitude:\n${dailyGratitude || "No entry"}\n\n`;
      content += `Kindness:\n${dailyKindness || "No entry"}\n\n`;
      if (tags.length > 0) {
        content += `Tags: ${tags.join(", ")}\n`;
      }
    }
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `journal-${format(selectedDate, "yyyy-MM-dd")}.${exportFormat === "markdown" ? "md" : "txt"}`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: "Exported", description: `Entry saved as ${exportFormat}` });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading journal...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Journal</h1>
          <p className="text-muted-foreground mt-1">Reflect on your day</p>
        </div>

        <div className="flex gap-2">
          {/* Journal Feed Button */}
          <Button variant="outline" size="icon" onClick={() => setFeedOpen(true)} className="relative">
            <BookOpen className="h-5 w-5" />
            {allEntries.length > 0 && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full text-[8px] text-primary-foreground flex items-center justify-center">
                {allEntries.length > 9 ? "9+" : allEntries.length}
              </span>
            )}
          </Button>

          {/* Calendar */}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <CalendarIcon className="h-5 w-5" />
                {entriesWithDates.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) setSelectedDate(date);
                  setCalendarOpen(false);
                }}
                modifiers={{
                  hasEntry: (date) => entriesWithDates.includes(format(date, "yyyy-MM-dd")),
                }}
                modifiersStyles={{
                  hasEntry: { backgroundColor: "hsl(142 76% 36% / 0.3)", borderRadius: "50%" },
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Diary Page Component */}
      <JournalDiaryPage
        selectedDate={selectedDate}
        onNavigate={navigateDate}
        dailyFeeling={dailyFeeling}
        dailyGratitude={dailyGratitude}
        dailyKindness={dailyKindness}
        onFeelingChange={setDailyFeeling}
        onGratitudeChange={setDailyGratitude}
        onKindnessChange={setDailyKindness}
        onSave={saveEntry}
        saving={saving}
        hasEntry={!!entryId}
        entryId={entryId}
        tags={tags}
        onTagsChange={setTags}
        onDelete={handleDeleteEntry}
        onDuplicate={handleDuplicateEntry}
        onExport={handleExportEntry}
      />

      {/* Journal Feed Dialog */}
      <JournalFeedDialog
        open={feedOpen}
        onOpenChange={setFeedOpen}
        entries={allEntries}
        onSelectDate={setSelectedDate}
      />
    </div>
  );
}
