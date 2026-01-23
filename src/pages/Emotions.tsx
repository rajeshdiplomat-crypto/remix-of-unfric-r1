import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import {
  Check,
  Loader2,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Heart,
  Sparkles,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { PatternsDashboardEnhanced } from "@/components/emotions/PatternsDashboardEnhanced";
import { CheckinReminders } from "@/components/emotions/CheckinReminders";
import { PageHero, PAGE_HERO_TEXT } from "@/components/common/PageHero";
import { PageLoadingScreen } from "@/components/common/PageLoadingScreen";

export default function Emotions() {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  // For expanded check-in cards
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

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

        try {
          const parsedData = JSON.parse(row.emotion);
          if (parsedData.quadrant) quadrant = parsedData.quadrant;
          if (parsedData.emotion) emotion = parsedData.emotion;
          if (parsedData.context) parsedContext = parsedData.context;
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
      const emotionData = JSON.stringify({
        quadrant: selectedQuadrant,
        emotion: selectedEmotion,
        context: context,
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

      if (sendToJournal && note) {
        await saveToJournal(entryDate, note, selectedEmotion);
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
    note?: string,
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
        content_preview: note || null,
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

      const emotionNote = `[${emotion}] ${noteText}`;

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

  const toggleExpandEntry = (entryId: string) => setExpandedEntryId((prev) => (prev === entryId ? null : entryId));

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
      const emotionData = JSON.stringify({ quadrant: editQuadrant, emotion: editEmotion, context: editContext });
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

  // Stats
  const totalCheckins = entries.length;
  const todayCount = entries.filter((e) => e.entry_date === format(new Date(), "yyyy-MM-dd")).length;

  if (loading) return <PageLoadingScreen module="emotions" />;

  return (
    <div className="flex flex-col w-full flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen">
      {/* Hero */}
      <PageHero
        storageKey="emotion_hero_src"
        typeKey="emotion_hero_type"
        badge={PAGE_HERO_TEXT.emotions.badge}
        title={PAGE_HERO_TEXT.emotions.title}
        subtitle={PAGE_HERO_TEXT.emotions.subtitle}
      />

      {/* Stats Strip */}
      <div className="px-6 lg:px-8 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-indigo-500" />
            <span className="font-medium text-slate-700 dark:text-slate-200">{totalCheckins}</span>
            <span className="text-slate-500">check-ins</span>
          </div>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="font-medium text-slate-700 dark:text-slate-200">{todayCount}</span>
            <span className="text-slate-500">today</span>
          </div>
          {latestEntry && (
            <>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: QUADRANTS[latestEntry.quadrant].color }}
                />
                <span className="text-slate-500">Last:</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">{latestEntry.emotion}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Left Column - Check-in & Patterns */}
          <div className="space-y-6">
            {/* Check-in Card */}
            <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-800 dark:text-white">
                  How are you feeling?
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {step === "sliders" && <EmotionSliderPicker onSelect={handleSliderComplete} />}

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
                        <p className="text-xs text-slate-500">{QUADRANTS[selectedQuadrant].description}</p>
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
                        className="flex-1 rounded-xl h-10 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white"
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

            {/* Patterns Dashboard */}
            <PatternsDashboardEnhanced entries={entries} onDateClick={handleDateClick} />
          </div>

          {/* Right Column - Recent, Strategies, Reminders */}
          <div className="space-y-4">
            {/* Recent Check-ins */}
            {entries.length > 0 && (
              <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <Clock className="h-4 w-4 text-slate-400" />
                    Recent
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-1.5 max-h-64 overflow-y-auto">
                  {entries.slice(0, 6).map((entry) => {
                    const isExpanded = expandedEntryId === entry.id;

                    return (
                      <div key={entry.id} className="rounded-lg bg-slate-50 dark:bg-slate-800">
                        <div className="flex items-center justify-between p-2.5">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: QUADRANTS[entry.quadrant].color }}
                            />
                            <span className="text-sm font-medium truncate text-slate-700 dark:text-slate-200">
                              {entry.emotion}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-xs text-slate-400">
                              {format(new Date(entry.entry_date + "T12:00:00"), "MMM d")}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0"
                              onClick={() => toggleExpandEntry(entry.id)}
                            >
                              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </Button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-2.5 pb-2.5 space-y-2 border-t border-slate-200 dark:border-slate-700">
                            {entry.note && <p className="text-xs text-slate-500 mt-2">{entry.note}</p>}
                            <div className="flex flex-wrap gap-1">
                              {entry.context?.who && (
                                <span className="text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">
                                  {entry.context.who}
                                </span>
                              )}
                              {entry.context?.what && (
                                <span className="text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">
                                  {entry.context.what}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-1.5 pt-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs px-2"
                                onClick={() => startEditEntry(entry)}
                              >
                                <Pencil className="h-3 w-3 mr-1" /> Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs px-2 text-red-500 hover:text-red-600"
                                onClick={() => setDeletingEntryId(entry.id)}
                              >
                                <Trash2 className="h-3 w-3 mr-1" /> Delete
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Strategies */}
            <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm">
              <CardContent className="p-4">
                <StrategiesPanelEnhanced currentQuadrant={currentQuadrant} currentEmotion={currentEmotion} />
              </CardContent>
            </Card>

            {/* Reminders */}
            <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm">
              <CardContent className="p-4">
                <CheckinReminders />
              </CardContent>
            </Card>
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
                    <span className="text-xs text-slate-500">{format(new Date(entry.created_at), "h:mm a")}</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => startEditEntry(entry)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-500"
                      onClick={() => setDeletingEntryId(entry.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {entry.note && <p className="text-sm text-slate-500 mb-2">{entry.note}</p>}
                <div className="flex flex-wrap gap-1.5">
                  {entry.context?.who && (
                    <span className="text-xs px-2 py-0.5 bg-white/50 rounded-full">With: {entry.context.who}</span>
                  )}
                  {entry.context?.what && (
                    <span className="text-xs px-2 py-0.5 bg-white/50 rounded-full">{entry.context.what}</span>
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
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
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
                  className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white"
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
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
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
