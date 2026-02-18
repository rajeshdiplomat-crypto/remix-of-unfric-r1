import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Check, Loader2 } from "lucide-react";
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
import { TooltipProvider } from "@/components/ui/tooltip";

import { QuadrantType, EmotionEntry, QUADRANTS } from "@/components/emotions/types";
import { EmotionsPageLayout } from "@/components/emotions/EmotionsPageLayout";
import { EmotionsPageFeel } from "@/components/emotions/EmotionsPageFeel";
import { EmotionsPageContext } from "@/components/emotions/EmotionsPageContext";
import { EmotionsPageRegulate } from "@/components/emotions/EmotionsPageRegulate";
import { EmotionsPageInsights } from "@/components/emotions/EmotionsPageInsights";
import { EmotionsNavigation, EmotionsView } from "@/components/emotions/EmotionsNavigation";
import { EmotionSliderPicker } from "@/components/emotions/EmotionSliderPicker";
import { EmotionContextFieldsEnhanced } from "@/components/emotions/EmotionContextFieldsEnhanced";
import { PageLoadingScreen } from "@/components/common/PageLoadingScreen";
import { PageHero, PAGE_HERO_TEXT } from "@/components/common/PageHero";



export default function Emotions() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<EmotionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Navigation state (for nav bar)
  const [activeView, setActiveView] = useState<EmotionsView>("feel");
  // Internal flow state (includes context which is not in nav)
  const [internalView, setInternalView] = useState<"feel" | "context" | "regulate" | "insights">("feel");

  // Load default emotions tab from DB
  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_settings")
      .select("default_emotions_tab")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const v = (data as any)?.default_emotions_tab;
        if (v === "regulate" || v === "insights") {
          setActiveView(v as EmotionsView);
          setInternalView(v);
        }
      });
  }, [user]);

  // Emotion selection state (persisted across pages)
  const [energy, setEnergy] = useState(50);
  const [pleasantness, setPleasantness] = useState(50);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [selectedQuadrant, setSelectedQuadrant] = useState<QuadrantType | null>(null);
  const [checkinDate, setCheckinDate] = useState<Date>(new Date());

  // Context state
  const [note, setNote] = useState("");
  const [context, setContext] = useState<{
    who?: string;
    what?: string;
    sleepHours?: string;
    physicalActivity?: string;
  }>({});
  const [sendToJournal, setSendToJournal] = useState(false);

  // Saved state (after successful save)
  const [savedQuadrant, setSavedQuadrant] = useState<QuadrantType | null>(null);
  const [savedEmotion, setSavedEmotion] = useState<string | null>(null);

  // For viewing entries by date

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

  // Compute current quadrant from sliders
  const currentQuadrant: QuadrantType =
    energy >= 50 && pleasantness >= 50
      ? "high-pleasant"
      : energy >= 50 && pleasantness < 50
        ? "high-unpleasant"
        : energy < 50 && pleasantness < 50
          ? "low-unpleasant"
          : "low-pleasant";

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
        let strategy: string | undefined = undefined;

        try {
          const parsedData = JSON.parse(row.emotion);
          if (parsedData.quadrant) quadrant = parsedData.quadrant;
          if (parsedData.emotion) emotion = parsedData.emotion;
          if (parsedData.context) parsedContext = parsedData.context;
          if (parsedData.showInJournal !== undefined) showInJournal = parsedData.showInJournal;
          if (parsedData.strategy) strategy = parsedData.strategy;
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
          strategy,
          entry_date: row.entry_date,
          created_at: row.created_at,
        };
      });

      setEntries(parsed);

      // Set latest quadrant/emotion for strategies
      if (parsed.length > 0) {
        setSavedQuadrant(parsed[0].quadrant);
        setSavedEmotion(parsed[0].emotion);
      }

      return parsed;
    } catch (err) {
      console.error("Error fetching emotions:", err);
      return;
    } finally {
      setLoading(false);
    }
  };

  // Handle emotion selection from Feel page
  const handleEmotionSelect = (emotion: string, quadrant: QuadrantType) => {
    setSelectedEmotion(emotion);
    setSelectedQuadrant(quadrant);
  };

  // Navigate from Feel to Context page
  const handleContinueToContext = () => {
    if (!selectedEmotion) return;
    setSelectedQuadrant(currentQuadrant);
    setInternalView("context");
  };

  // Skip context and save directly
  const handleSkipContext = async () => {
    await handleSaveCheckIn();
  };

  // Sync navigation bar with internal view
  const handleViewChange = (view: EmotionsView) => {
    setActiveView(view);
    setInternalView(view);
  };

  // Save check-in
  const handleSaveCheckIn = async () => {
    if (!user || !selectedEmotion) return;
    setSaving(true);

    const quadrant = selectedQuadrant || currentQuadrant;

    try {
      const emotionData = JSON.stringify({
        quadrant,
        emotion: selectedEmotion,
        context,
        showInJournal: sendToJournal,
      });

      const entryDate = format(checkinDate, "yyyy-MM-dd");

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
        quadrant,
        selectedEmotion,
        note || undefined,
        context,
        entryDate,
      );

      if (sendToJournal) {
        await saveToJournal(entryDate, note || "", selectedEmotion);
      }

      toast.success(`Logged: ${selectedEmotion}`);
      setSavedQuadrant(quadrant);
      setSavedEmotion(selectedEmotion);
      setActiveView("regulate");
      setInternalView("regulate");
      await fetchEntries();
    } catch (err) {
      console.error("Error saving emotion:", err);
      toast.error("Failed to save check-in");
    } finally {
      setSaving(false);
    }
  };

  const updateEntryStrategy = async (strategyTitle: string) => {
    if (!user || entries.length === 0) return;

    // We assume the user is updating the most recent entry they just created or are looking at
    const latestEntryId = entries[0].id;

    try {
      // 1. Fetch the raw existing data from DB to ensure we have the full JSON object
      // (The local state 'entries' has flattened/parsed data which might miss fields or be in wrong format for full update)
      const { data: currentData, error: fetchError } = await supabase
        .from("emotions")
        .select("emotion")
        .eq("id", latestEntryId)
        .single();

      if (fetchError) throw fetchError;

      // 2. Parse the current JSON
      let emotionJson: any = {};
      if (typeof currentData.emotion === "string") {
        try {
          emotionJson = JSON.parse(currentData.emotion);
        } catch (e) {
          console.error("Error parsing current emotion JSON", e);
          emotionJson = {};
        }
      } else {
        emotionJson = currentData.emotion || {}; // Handle if it's already an object (Supabase client sometimes auto-parses)
      }

      // 3. Add/Update strategy data
      const updatedJson = {
        ...emotionJson,
        strategy: strategyTitle,
        strategy_completed_at: new Date().toISOString(),
      };

      // 4. Save back
      const { error: updateError } = await supabase
        .from("emotions")
        .update({
          emotion: JSON.stringify(updatedJson),
        })
        .eq("id", latestEntryId);

      if (updateError) throw updateError;

      toast.success(`Strategy recorded: ${strategyTitle}`);
      await fetchEntries(); // Refresh to show in history
    } catch (err) {
      console.error("Error updating strategy conversation:", err);
      toast.error("Failed to record strategy");
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

  // Reset flow for new check-in
  const resetFlow = () => {
    setEnergy(50);
    setPleasantness(50);
    setSelectedEmotion(null);
    setSelectedQuadrant(null);
    setNote("");
    setContext({});
    setSendToJournal(false);
    setCheckinDate(new Date());
    setActiveView("feel");
    setInternalView("feel");
  };

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

  // Navigation permissions
  const canNavigate = {
    regulate: !!savedQuadrant && !!savedEmotion,
  };

  const showLoading = loading;

  return (
    <TooltipProvider>
      {showLoading && <PageLoadingScreen module="emotions" />}
      <div className="flex flex-col w-full h-full min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        {/* Page Hero with Navigation at bottom */}
        <div className="relative">
          <PageHero
            storageKey="emotions-hero-src"
            typeKey="emotions-hero-type"
            badge={PAGE_HERO_TEXT.emotions.badge}
            title={PAGE_HERO_TEXT.emotions.title}
            subtitle={PAGE_HERO_TEXT.emotions.subtitle}
          />

          {/* Navigation overlay at bottom of hero */}
          <div className="absolute bottom-4 left-0 right-0 z-20 px-4 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <EmotionsNavigation
                activeView={activeView}
                canNavigate={canNavigate}
                onViewChange={handleViewChange}
                entries={entries}
                onEditEntry={startEditEntry}
                onDeleteEntry={setDeletingEntryId}
                onDateClick={handleDateClick}
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <EmotionsPageLayout>
          {/* Feel Page */}
          {internalView === "feel" && (
            <EmotionsPageFeel
              energy={energy}
              pleasantness={pleasantness}
              selectedEmotion={selectedEmotion}
              selectedDate={checkinDate}
              onEnergyChange={setEnergy}
              onPleasantnessChange={setPleasantness}
              onEmotionSelect={handleEmotionSelect}
              onContinue={handleContinueToContext}
              onDateChange={setCheckinDate}
            />
          )}

          {/* Context Page (between Feel and Regulate) */}
          {internalView === "context" && selectedQuadrant && selectedEmotion && (
            <EmotionsPageContext
              selectedQuadrant={selectedQuadrant}
              selectedEmotion={selectedEmotion}
              note={note}
              context={context}
              sendToJournal={sendToJournal}
              saving={saving}
              onNoteChange={setNote}
              onContextChange={setContext}
              onSendToJournalChange={setSendToJournal}
              onBack={() => setInternalView("feel")}
              onSave={handleSaveCheckIn}
              onSkip={handleSkipContext}
            />
          )}

          {/* Regulate Page */}
          {internalView === "regulate" && (
            <EmotionsPageRegulate
              savedQuadrant={savedQuadrant}
              savedEmotion={savedEmotion}
              entries={entries}
              onNewCheckin={resetFlow}
              onStrategyComplete={updateEntryStrategy}
              onViewInsights={() => {
                setActiveView("insights");
                setInternalView("insights");
              }}
            />
          )}

          {/* Insights Page */}
          {internalView === "insights" && (
            <EmotionsPageInsights
              entries={entries}
              onBack={() => {
                setActiveView("feel");
                setInternalView("feel");
              }}
              onDateClick={handleDateClick}
            />
          )}
        </EmotionsPageLayout>

        {/* Recent Entries & Calendar are now rendered inside EmotionsNavigation as popovers */}

        {/* Dialog: View entries by date */}
        <Dialog open={!!viewingDate} onOpenChange={(open) => !open && setViewingDate(null)}>
          <DialogContent className="max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {viewingDate ? format(new Date(viewingDate), "EEEE, MMMM d, yyyy") : ""}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {viewingEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-2xl transition-all hover:shadow-md"
                  style={{ backgroundColor: QUADRANTS[entry.quadrant].bgColor }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: QUADRANTS[entry.quadrant].color }}
                    />
                    <span className="font-medium" style={{ color: QUADRANTS[entry.quadrant].color }}>
                      {entry.emotion}
                    </span>
                    <div className="flex items-center gap-1 ml-auto">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(entry.created_at), "h:mm a")}
                      </span>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => startEditEntry(entry)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive"
                        onClick={() => setDeletingEntryId(entry.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {entry.note && <p className="text-sm text-muted-foreground mb-2">{entry.note}</p>}
                  <div className="flex flex-wrap gap-1.5">
                    {entry.context?.who && (
                      <span className="text-xs px-2 py-0.5 bg-background/50 rounded-full">
                        With: {entry.context.who}
                      </span>
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
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl">Edit Check-in</DialogTitle>
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
                    className="flex-1 rounded-xl bg-primary hover:bg-primary/90"
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
          <AlertDialogContent className="rounded-3xl">
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
    </TooltipProvider>
  );
}
