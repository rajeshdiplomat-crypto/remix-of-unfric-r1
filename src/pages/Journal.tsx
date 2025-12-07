import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, Heart, Sparkles, HandHeart, Type, Mic, MicOff, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface JournalEntry {
  id: string;
  entry_date: string;
  daily_feeling: string | null;
  daily_gratitude: string | null;
  daily_kindness: string | null;
  created_at: string;
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
  const [allEntries, setAllEntries] = useState<JournalEntry[]>([]);
  const [entriesWithDates, setEntriesWithDates] = useState<string[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Input mode state
  const [inputMode, setInputMode] = useState<"type" | "voice" | "scribble">("type");
  const [activeSegment, setActiveSegment] = useState<"feeling" | "gratitude" | "kindness">("feeling");
  
  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Scribble canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

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
      setEntryId(data.id);
    } else {
      setDailyFeeling("");
      setDailyGratitude("");
      setDailyKindness("");
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

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const transcript = "Voice note recorded. Transcription coming soon.";
        if (activeSegment === "feeling") setDailyFeeling(prev => prev + " " + transcript);
        else if (activeSegment === "gratitude") setDailyGratitude(prev => prev + " " + transcript);
        else setDailyKindness(prev => prev + " " + transcript);
        toast({ title: "Recorded!", description: "Your voice note has been captured" });
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({ title: "Error", description: "Could not access microphone", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = "hsl(var(--foreground))";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);
  
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    setSelectedDate(newDate);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading journal...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Journal</h1>
          <p className="text-muted-foreground mt-1">Reflect on your day</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigateDate("prev")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("justify-start text-left font-normal")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "EEEE, MMMM d")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                modifiers={{
                  hasEntry: (date) => entriesWithDates.includes(format(date, "yyyy-MM-dd")),
                }}
                modifiersStyles={{
                  hasEntry: { backgroundColor: "hsl(var(--primary) / 0.2)", borderRadius: "50%" },
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button variant="ghost" size="icon" onClick={() => navigateDate("next")}>
            <ChevronRight className="h-5 w-5" />
          </Button>

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

      {/* Input Mode Selector */}
      <div className="flex gap-2">
        <Button
          variant={inputMode === "type" ? "default" : "outline"}
          size="sm"
          onClick={() => setInputMode("type")}
        >
          <Type className="h-4 w-4 mr-1" />
          Type
        </Button>
        <Button
          variant={inputMode === "voice" ? "default" : "outline"}
          size="sm"
          onClick={() => setInputMode("voice")}
        >
          <Mic className="h-4 w-4 mr-1" />
          Voice
        </Button>
        <Button
          variant={inputMode === "scribble" ? "default" : "outline"}
          size="sm"
          onClick={() => setInputMode("scribble")}
        >
          <Pencil className="h-4 w-4 mr-1" />
          Scribble
        </Button>
      </div>

      {/* Journal Entry Card - Physical Diary Style */}
      <Card className="bg-[linear-gradient(#f5f5dc_1px,transparent_1px)] bg-[size:100%_28px] border-2 border-amber-200/50">
        <CardContent className="p-8 space-y-8">
          {/* Date Header */}
          <div className="text-center border-b border-amber-200/50 pb-4">
            <p className="text-lg font-serif text-muted-foreground">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </p>
          </div>

          {/* Segment Tabs */}
          <Tabs value={activeSegment} onValueChange={(v) => setActiveSegment(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="feeling" className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-pink-500" />
                Feeling
              </TabsTrigger>
              <TabsTrigger value="gratitude" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                Gratitude
              </TabsTrigger>
              <TabsTrigger value="kindness" className="flex items-center gap-2">
                <HandHeart className="h-4 w-4 text-green-500" />
                Kindness
              </TabsTrigger>
            </TabsList>

            <TabsContent value="feeling" className="mt-6">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground italic">
                  How are you feeling today? What emotions came up?
                </p>
                {inputMode === "type" && (
                  <Textarea
                    value={dailyFeeling}
                    onChange={(e) => setDailyFeeling(e.target.value)}
                    placeholder="Today I felt..."
                    rows={6}
                    className="resize-none bg-transparent border-dashed font-serif text-lg"
                  />
                )}
                {inputMode === "voice" && (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <Button
                      size="lg"
                      variant={isRecording ? "destructive" : "default"}
                      onClick={isRecording ? stopRecording : startRecording}
                      className="h-20 w-20 rounded-full"
                    >
                      {isRecording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      {isRecording ? "Recording... Click to stop" : "Click to start recording"}
                    </p>
                    {dailyFeeling && <p className="text-sm bg-muted p-4 rounded-lg">{dailyFeeling}</p>}
                  </div>
                )}
                {inputMode === "scribble" && (
                  <div className="space-y-2">
                    <div className="border border-dashed rounded-lg overflow-hidden bg-card">
                      <canvas
                        ref={canvasRef}
                        width={600}
                        height={200}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        className="w-full cursor-crosshair"
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={clearCanvas}>
                      Clear Canvas
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="gratitude" className="mt-6">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground italic">
                  What are you grateful for today? List 3 things.
                </p>
                {inputMode === "type" && (
                  <Textarea
                    value={dailyGratitude}
                    onChange={(e) => setDailyGratitude(e.target.value)}
                    placeholder="1. I'm grateful for..."
                    rows={6}
                    className="resize-none bg-transparent border-dashed font-serif text-lg"
                  />
                )}
                {inputMode === "voice" && (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <Button
                      size="lg"
                      variant={isRecording ? "destructive" : "default"}
                      onClick={isRecording ? stopRecording : startRecording}
                      className="h-20 w-20 rounded-full"
                    >
                      {isRecording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                    </Button>
                    {dailyGratitude && <p className="text-sm bg-muted p-4 rounded-lg">{dailyGratitude}</p>}
                  </div>
                )}
                {inputMode === "scribble" && (
                  <div className="space-y-2">
                    <div className="border border-dashed rounded-lg overflow-hidden bg-card">
                      <canvas
                        ref={canvasRef}
                        width={600}
                        height={200}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        className="w-full cursor-crosshair"
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={clearCanvas}>Clear Canvas</Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="kindness" className="mt-6">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground italic">
                  What act of kindness did you do or receive today?
                </p>
                {inputMode === "type" && (
                  <Textarea
                    value={dailyKindness}
                    onChange={(e) => setDailyKindness(e.target.value)}
                    placeholder="Today I..."
                    rows={6}
                    className="resize-none bg-transparent border-dashed font-serif text-lg"
                  />
                )}
                {inputMode === "voice" && (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <Button
                      size="lg"
                      variant={isRecording ? "destructive" : "default"}
                      onClick={isRecording ? stopRecording : startRecording}
                      className="h-20 w-20 rounded-full"
                    >
                      {isRecording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                    </Button>
                    {dailyKindness && <p className="text-sm bg-muted p-4 rounded-lg">{dailyKindness}</p>}
                  </div>
                )}
                {inputMode === "scribble" && (
                  <div className="space-y-2">
                    <div className="border border-dashed rounded-lg overflow-hidden bg-card">
                      <canvas
                        ref={canvasRef}
                        width={600}
                        height={200}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        className="w-full cursor-crosshair"
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={clearCanvas}>Clear Canvas</Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <Button onClick={saveEntry} disabled={saving} className="w-full" size="lg">
            {saving ? "Saving..." : entryId ? "Update Entry" : "Save Entry"}
          </Button>
        </CardContent>
      </Card>

      {/* Previous Entries */}
      {allEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Previous Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-4">
                {allEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => setSelectedDate(new Date(entry.entry_date))}
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
                      <p className="text-sm text-muted-foreground line-clamp-2">{entry.daily_feeling}</p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
