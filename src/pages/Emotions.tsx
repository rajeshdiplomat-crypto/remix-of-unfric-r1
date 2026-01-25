import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Check, Loader2, ArrowLeft, Pencil, Trash2, Heart, Clock, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { QuadrantType, EmotionEntry, QUADRANTS } from "@/components/emotions/types";
import { EmotionSliderPicker } from "@/components/emotions/EmotionSliderPicker";
import { EmotionContextFieldsEnhanced } from "@/components/emotions/EmotionContextFieldsEnhanced";
import { StrategiesPanelEnhanced } from "@/components/emotions/StrategiesPanelEnhanced";
import { EmotionCalendarSidebar } from "@/components/emotions/EmotionCalendarSidebar";
import { RecentEntriesList } from "@/components/emotions/RecentEntriesList";
import { PatternsDashboardEnhanced } from "@/components/emotions/PatternsDashboardEnhanced";
import { PageHero, PAGE_HERO_TEXT } from "@/components/common/PageHero";
import { PageLoadingScreen } from "@/components/common/PageLoadingScreen";

import { useTimezone } from "@/hooks/useTimezone";
import { getTodayInTimezone } from "@/lib/formatDate";

export default function Emotions() {
  const { user } = useAuth();
  const { timezone } = useTimezone();
  const [entries, setEntries] = useState<EmotionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Check-in state
  const [selectedQuadrant, setSelectedQuadrant] = useState<QuadrantType | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [context, setContext] = useState<{
    who?: string;
    what?: string;
    body?: string;
    sleepHours?: string;
    physicalActivity?: string;
  }>({});
  const [sendToJournal, setSendToJournal] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date>(new Date());
  const [step, setStep] = useState<"sliders" | "details">("sliders");

  // For viewing entries by date
  const [viewingDate, setViewingDate] = useState<string | null>(null);
  const [viewingEntries, setViewingEntries] = useState<EmotionEntry[]>([]);

  // For editing entries
  const [editingEntry, setEditingEntry] = useState<EmotionEntry | null>(null);
  const [editNote, setEditNote] = useState("");
  const [editContext, setEditContext] = useState<EmotionEntry["context"]>({});
  const [editQuadrant, setEditQuadrant] = useState<QuadrantType | null>(null);
  const [editEmotion, setEditEmotion] = useState<string | null>(null);
  const [editDate, setEditDate] = useState<Date>(new Date());

  // For delete confirmation
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


  useEffect(() => {
    if (user) fetchEntries();
  }, [user]);

  const fetchEntries = async (): Promise<EmotionEntry[] | undefined> => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("emotions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      const parsed: EmotionEntry[] = (data || []).map((row) => {
        let quadrant: QuadrantType = "low-pleasant";
        let emotion = row.emotion;
        let parsedContext: EmotionEntry["context"] = undefined;
        let showInJournal: boolean | undefined = undefined;

        try {
          const parsedData = JSON.parse(row.emotion);
          if (parsedData.quadrant) quadrant = parsedData.quadrant;
          if (parsedData.emotion) emotion = parsedData.emotion;
          if (parsedData.context) parsedContext = parsedData.context;
          if (parsedData.showInJournal !== undefined) showInJournal = parsedData.showInJournal;
        } catch {
          emotion = row.emotion;
        }

        if (!parsedContext && row.tags && row.tags.length > 0) {
          parsedContext = { who: row.tags[0], what: row.tags[1], body: row.tags[2] };
        }

        return {
          id: row.id,
          quadrant,
          emotion,
          note: row.notes || undefined,
          context: parsedContext,
          showInJournal,
          entry_date: row.entry_date,
          created_at: row.created_at,
        };
      });

      setEntries(parsed);
      return parsed;
    } catch (err) {
      console.error("Error fetching emotions:", err);
      return;
    } finally {
      setLoading(false);
    }
  };

  const handleSliderComplete = (quadrant: QuadrantType, emotion: string) => {
    setSelectedQuadrant(quadrant);
    setSelectedEmotion(emotion);
    setStep("details");
  };

  const handleBack = () => setStep("sliders");

  const resetCheckIn = () => {
    setSelectedQuadrant(null);
    setSelectedEmotion(null);
    setNote("");
    setContext({});
    setSendToJournal(false);
    setCheckInTime(new Date());
    setStep("sliders");
  };

  const saveCheckIn = async () => {
    if (!user || !selectedQuadrant || !selectedEmotion) return;
    setSaving(true);
    try {
      // Include showInJournal flag so JournalDateDetailsPanel knows whether to display it
      const emotionData = JSON.stringify({
        quadrant: selectedQuadrant,
        emotion: selectedEmotion,
        context: context,
        showInJournal: sendToJournal,
      });

      const entryDate = format(checkInTime, "yyyy-MM-dd");

      const { data: insertedEmotion, error } = await supabase
        .from("emotions")
        .insert({
          user_id: user.id,
          emotion: emotionData,
          notes: note || null,
          tags: null,
          entry_date: entryDate,
        })
        .select("id")
        .single();

      if (error) throw error;

      await createEmotionFeedEvent(
        insertedEmotion.id,
        selectedQuadrant,
        selectedEmotion,
        note || undefined,
        context,
        entryDate,
      );

      // Only save to journal if toggle is ON
      if (sendToJournal) {
        await saveToJournal(entryDate, note || "", selectedEmotion);
      }

      toast.success(`Logged: ${selectedEmotion}`);
      resetCheckIn();
      await fetchEntries();
    } catch (err) {
      console.error("Error saving emotion:", err);
      toast.error("Failed to save check-in");
    } finally {
      setSaving(false);
    }
  };

  const createEmotionFeedEvent = async (
    emotionId: string,
    quadrant: QuadrantType,
    emotion: string,
    noteText?: string,
    ctx?: typeof context,
    entryDate?: string,
  ) => {
    if (!user) return;

    const contextParts: string[] = [];
    if (ctx?.who) contextParts.push(`with ${ctx.who}`);
    if (ctx?.what) contextParts.push(`while ${ctx.what}`);

    const summary = contextParts.length > 0 ? contextParts.join(" ") : null;

    try {
      await supabase.from("feed_events").insert({
        user_id: user.id,
        type: "checkin",
        source_module: "emotions",
        source_id: emotionId,
        title: `Feeling ${emotion}`,
        summary: summary,
        content_preview: noteText || null,
        media: [],
        metadata: { quadrant, emotion, context: ctx, entry_date: entryDate },
      });
    } catch (err) {
      console.error("Error creating feed event:", err);
    }
  };

  const saveToJournal = async (entryDate: string, noteText: string, emotion: string) => {
    if (!user) return;
    try {
      const { data: existingEntry } = await supabase
        .from("journal_entries")
        .select("id")
        .eq("user_id", user.id)
        .eq("entry_date", entryDate)
        .maybeSingle();

      let journalEntryId: string;

      if (existingEntry) {
        journalEntryId = existingEntry.id;
      } else {
        const { data: newEntry, error: createError } = await supabase
          .from("journal_entries")
          .insert({ user_id: user.id, entry_date: entryDate })
          .select("id")
          .single();

        if (createError) throw createError;
        journalEntryId = newEntry.id;
      }

      const { data: existingAnswer } = await supabase
        .from("journal_answers")
        .select("id, answer_text")
        .eq("journal_entry_id", journalEntryId)
        .eq("question_id", "feeling")
        .maybeSingle();

      const emotionNote = noteText ? `[${emotion}] ${noteText}` : `[${emotion}]`;

      if (existingAnswer) {
        const updatedText = existingAnswer.answer_text
          ? `${existingAnswer.answer_text}\n\n${emotionNote}`
          : emotionNote;

        await supabase.from("journal_answers").update({ answer_text: updatedText }).eq("id", existingAnswer.id);
      } else {
        await supabase.from("journal_answers").insert({
          journal_entry_id: journalEntryId,
          question_id: "feeling",
          answer_text: emotionNote,
        });
      }

      toast.success("Note added to journal");
    } catch (err) {
      console.error("Error saving to journal:", err);
    }
  };

  const latestEntry = entries[0];
  const currentQuadrant = selectedQuadrant || latestEntry?.quadrant || null;
  const currentEmotion = selectedEmotion || latestEntry?.emotion || null;

  const handleDateClick = (date: string, dayEntries: EmotionEntry[]) => {
    setViewingDate(date);
    setViewingEntries(dayEntries);
  };

  const startEditEntry = (entry: EmotionEntry) => {
    setEditingEntry(entry);
    setEditNote(entry.note || "");
    setEditContext(entry.context || {});
    setEditQuadrant(entry.quadrant);
    setEditEmotion(entry.emotion);
    setEditDate(new Date(entry.entry_date + "T12:00:00"));
  };

  const cancelEdit = () => {
    setEditingEntry(null);
    setEditNote("");
    setEditContext({});
    setEditQuadrant(null);
    setEditEmotion(null);
    setEditDate(new Date());
  };

  const saveEditedEntry = async () => {
    if (!user || !editingEntry || !editQuadrant || !editEmotion) return;
    setSaving(true);
    const wasViewingDate = viewingDate;

    try {
      // Preserve the original showInJournal flag when editing
      const emotionData = JSON.stringify({
        quadrant: editQuadrant,
        emotion: editEmotion,
        context: editContext,
        showInJournal: editingEntry.showInJournal ?? false,
      });
      const newEntryDate = format(editDate, "yyyy-MM-dd");

      const { error } = await supabase
        .from("emotions")
        .update({ emotion: emotionData, notes: editNote || null, entry_date: newEntryDate })
        .eq("id", editingEntry.id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Check-in updated");
      cancelEdit();

      const updated = (await fetchEntries()) ?? [];

      if (wasViewingDate) {
        setViewingDate(newEntryDate);
        setViewingEntries(updated.filter((e) => e.entry_date === newEntryDate));
      }
    } catch (err) {
      console.error("Error updating emotion:", err);
      toast.error("Failed to update check-in");
    } finally {
      setSaving(false);
    }
  };

  const handleEditEmotionSelect = (quadrant: QuadrantType, emotion: string) => {
    setEditQuadrant(quadrant);
    setEditEmotion(emotion);
  };

  const deleteEntry = async (entryId: string) => {
    if (!user) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("emotions").delete().eq("id", entryId).eq("user_id", user.id);
      if (error) throw error;

      toast.success("Check-in deleted");
      setDeletingEntryId(null);
      await fetchEntries();

      if (viewingDate) {
        const updatedEntries = viewingEntries.filter((e) => e.id !== entryId);
        setViewingEntries(updatedEntries);
        if (updatedEntries.length === 0) setViewingDate(null);
      }
    } catch (err) {
      console.error("Error deleting emotion:", err);
      toast.error("Failed to delete check-in");
    } finally {
      setIsDeleting(false);
    }
  };

  // Stats - use timezone-aware today
  const todayStr = getTodayInTimezone(timezone);

  if (loading) return <PageLoadingScreen module="emotions" />;

  return (
    <div className="flex flex-col w-full flex-1 bg-muted/30 h-full">
      {/* Hero - Fixed, does not scroll */}
      <div className="shrink-0">
        <PageHero
          storageKey="emotion_hero_src"
          typeKey="emotion_hero_type"
          badge={PAGE_HERO_TEXT.emotions.badge}
          title={PAGE_HERO_TEXT.emotions.title}
          subtitle={PAGE_HERO_TEXT.emotions.subtitle}
        />
      </div>

      {/* Main Content - Two Column Layout - Fixed Height */}
      <div className="flex-1 px-6 lg:px-8 py-6 overflow-hidden min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 h-full min-h-0">
          {/* Left Column - Check-in row + Dashboards below */}
          <div className="flex flex-col gap-6 overflow-y-auto h-full">
            {/* Top Row: Check-in + Strategies side by side */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {/* Check-in Card - Fixed Height */}
              <Card className="rounded-2xl border-border shadow-sm overflow-hidden h-[620px] flex flex-col">
                <CardHeader className="pb-2 bg-gradient-to-r from-rose-50/50 to-amber-50/50 dark:from-rose-900/10 dark:to-amber-900/10 shrink-0">
                  <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Heart className="h-4 w-4 text-rose-500" />
                    How are you feeling?
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 flex-1 overflow-y-auto">
                  {step === "sliders" && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {new Intl.DateTimeFormat("en-US", {
                            timeZone: timezone,
                            weekday: "long",
                            day: "numeric",
                            month: "short",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          }).format(checkInTime)}
                        </span>
                      </div>
                      <EmotionSliderPicker onSelect={handleSliderComplete} />
                    </div>
                  )}

                  {step === "details" && selectedQuadrant && selectedEmotion && (
                    <div className="space-y-4">
                      <div
                        className="flex items-center gap-3 p-3 rounded-xl"
                        style={{ backgroundColor: QUADRANTS[selectedQuadrant].bgColor }}
                      >
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: QUADRANTS[selectedQuadrant].color }}
                        />
                        <div>
                          <p className="font-medium" style={{ color: QUADRANTS[selectedQuadrant].color }}>
                            {selectedEmotion}
                          </p>
                          <p className="text-xs text-muted-foreground">{QUADRANTS[selectedQuadrant].description}</p>
                        </div>
                      </div>

                      <EmotionContextFieldsEnhanced
                        note={note}
                        onNoteChange={setNote}
                        context={context}
                        onContextChange={setContext}
                        sendToJournal={sendToJournal}
                        onSendToJournalChange={setSendToJournal}
                        checkInTime={checkInTime}
                        onCheckInTimeChange={setCheckInTime}
                      />

                      <div className="flex gap-3">
                        <Button variant="outline" onClick={handleBack} className="flex-1 rounded-xl h-10">
                          <ArrowLeft className="h-4 w-4 mr-2" /> Back
                        </Button>
                        <Button
                          onClick={saveCheckIn}
                          disabled={saving}
                          className="flex-1 rounded-xl h-10 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white border-0"
                        >
                          {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Check className="h-4 w-4 mr-2" />
                          )}
                          Save
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Strategies Panel - Fixed Height */}
              <Card className="rounded-2xl border-border shadow-sm h-[620px] flex flex-col">
                <CardContent className="p-5 flex-1 overflow-y-auto">
                  <StrategiesPanelEnhanced currentQuadrant={currentQuadrant} currentEmotion={currentEmotion} />
                </CardContent>
              </Card>
            </div>

            {/* Patterns Dashboard below - fills remaining space */}
            <div className="flex-1 min-h-0">
              <PatternsDashboardEnhanced entries={entries} onDateClick={handleDateClick} />
            </div>
          </div>

          {/* Right Column - Calendar & Recent Entries */}
          <div className="flex flex-col gap-4 overflow-y-auto h-full">
            {/* Calendar - Non-scrollable */}
            <div className="shrink-0">
              <EmotionCalendarSidebar entries={entries} onDateClick={handleDateClick} />
            </div>

            {/* Recent Entries - Fills remaining height, scrollable */}
            <div className="flex-1 min-h-0">
              <RecentEntriesList entries={entries} onEditEntry={startEditEntry} onDeleteEntry={setDeletingEntryId} />
            </div>
          </div>
        </div>
      </div>

      {/* Dialog: View entries by date */}
      <Dialog open={!!viewingDate} onOpenChange={(open) => !open && setViewingDate(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{viewingDate ? format(new Date(viewingDate), "EEEE, MMMM d, yyyy") : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {viewingEntries.map((entry) => (
              <div
                key={entry.id}
                className="p-4 rounded-xl"
                style={{ backgroundColor: QUADRANTS[entry.quadrant].bgColor }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: QUADRANTS[entry.quadrant].color }} />
                  <span className="font-medium" style={{ color: QUADRANTS[entry.quadrant].color }}>
                    {entry.emotion}
                  </span>
                  <div className="flex items-center gap-1 ml-auto">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(entry.created_at), "h:mm a")}
                    </span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => startEditEntry(entry)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-destructive"
                      onClick={() => setDeletingEntryId(entry.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {entry.note && <p className="text-sm text-muted-foreground mb-2">{entry.note}</p>}
                <div className="flex flex-wrap gap-1.5">
                  {entry.context?.who && (
                    <span className="text-xs px-2 py-0.5 bg-background/50 rounded-full">With: {entry.context.who}</span>
                  )}
                  {entry.context?.what && (
                    <span className="text-xs px-2 py-0.5 bg-background/50 rounded-full">{entry.context.what}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Edit Entry */}
      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && cancelEdit()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Check-in</DialogTitle>
          </DialogHeader>
          {editingEntry && editQuadrant && editEmotion && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Emotion</label>
                <EmotionSliderPicker
                  onSelect={handleEditEmotionSelect}
                  initialQuadrant={editQuadrant}
                  initialEmotion={editEmotion}
                  compact
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <input
                  type="date"
                  value={format(editDate, "yyyy-MM-dd")}
                  onChange={(e) => setEditDate(new Date(e.target.value + "T12:00:00"))}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm"
                />
              </div>

              <EmotionContextFieldsEnhanced
                note={editNote}
                onNoteChange={setEditNote}
                context={editContext}
                onContextChange={setEditContext}
                sendToJournal={false}
                onSendToJournalChange={() => {}}
                checkInTime={new Date(editingEntry.created_at)}
                onCheckInTimeChange={() => {}}
                hideJournalToggle
                hideTimeField
              />

              <div className="flex gap-3">
                <Button variant="outline" onClick={cancelEdit} className="flex-1 rounded-xl">
                  Cancel
                </Button>
                <Button
                  onClick={saveEditedEntry}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white border-0"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingEntryId} onOpenChange={(open) => !open && setDeletingEntryId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete check-in?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingEntryId && deleteEntry(deletingEntryId)}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
