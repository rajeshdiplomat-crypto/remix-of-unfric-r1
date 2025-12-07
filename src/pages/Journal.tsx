import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Heart, Sparkles, HandHeart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    if (!user) return;

    const fetchEntry = async () => {
      setLoading(true);
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      
      const { data } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .eq("entry_date", dateStr)
        .maybeSingle();

      if (data) {
        setDailyFeeling(data.daily_feeling || "");
        setDailyGratitude(data.daily_gratitude || "");
        setDailyKindness(data.daily_kindness || "");
        setEntryId(data.id);
      } else {
        setDailyFeeling("");
        setDailyGratitude("");
        setDailyKindness("");
        setEntryId(null);
      }
      setLoading(false);
    };

    fetchEntry();
  }, [user, selectedDate]);

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
        })
        .eq("id", entryId);

      if (error) {
        toast({ title: "Error", description: "Failed to update journal", variant: "destructive" });
      } else {
        toast({ title: "Saved!", description: "Your journal entry has been updated" });
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
        })
        .select()
        .single();

      if (error) {
        toast({ title: "Error", description: "Failed to save journal", variant: "destructive" });
      } else {
        setEntryId(data.id);
        toast({ title: "Saved!", description: "Your journal entry has been saved" });
      }
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading journal...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Journal</h1>
          <p className="text-muted-foreground mt-1">Reflect on your day</p>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("justify-start text-left font-normal")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="h-8 w-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
                <Heart className="h-4 w-4 text-pink-500" />
              </div>
              Daily Feeling
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              How are you feeling today? What emotions came up?
            </p>
            <Textarea
              value={dailyFeeling}
              onChange={(e) => setDailyFeeling(e.target.value)}
              placeholder="Today I felt..."
              rows={4}
              className="resize-none bg-background/50"
            />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-yellow-500/5 border-yellow-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="h-8 w-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-yellow-500" />
              </div>
              Daily Gratitude
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              What are you grateful for today? List 3 things.
            </p>
            <Textarea
              value={dailyGratitude}
              onChange={(e) => setDailyGratitude(e.target.value)}
              placeholder="1. I'm grateful for..."
              rows={4}
              className="resize-none bg-background/50"
            />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-green-500/5 border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="h-8 w-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                <HandHeart className="h-4 w-4 text-green-500" />
              </div>
              Daily Kindness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              What act of kindness did you do or receive today?
            </p>
            <Textarea
              value={dailyKindness}
              onChange={(e) => setDailyKindness(e.target.value)}
              placeholder="Today I..."
              rows={4}
              className="resize-none bg-background/50"
            />
          </CardContent>
        </Card>

        <Button onClick={saveEntry} disabled={saving} className="w-full" size="lg">
          {saving ? "Saving..." : entryId ? "Update Entry" : "Save Entry"}
        </Button>
      </div>
    </div>
  );
}
