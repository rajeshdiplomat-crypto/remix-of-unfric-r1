import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Pencil, Trash2, Loader2, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { QuadrantType, EmotionEntry, QUADRANTS } from "@/components/emotions/types";
import { MoodWheelPicker } from "@/components/emotions/MoodWheelPicker";
import { MoodDetailsForm } from "@/components/emotions/MoodDetailsForm";
import { TodayMoodTimeline } from "@/components/emotions/TodayMoodTimeline";
import { BreathingWidget } from "@/components/emotions/BreathingWidget";
import { EmotionStatsCard } from "@/components/emotions/EmotionStatsCard";
import { StrategiesPanelEnhanced } from "@/components/emotions/StrategiesPanelEnhanced";
import { PatternsDashboardEnhanced } from "@/components/emotions/PatternsDashboardEnhanced";
import { EmotionSliderPicker } from "@/components/emotions/EmotionSliderPicker";
import { EmotionContextFieldsEnhanced } from "@/components/emotions/EmotionContextFieldsEnhanced";
import { PageHero, PAGE_HERO_TEXT } from "@/components/common/PageHero";
import { PageLoadingScreen } from "@/components/common/PageLoadingScreen";

export default function Emotions() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<EmotionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Check-in state
  const [step, setStep] = useState<'picker' | 'details'>('picker');
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

  // View/Edit state
  const [viewingDate, setViewingDate] = useState<string | null>(null);
  const [viewingEntries, setViewingEntries] = useState<EmotionEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<EmotionEntry | null>(null);
  const [editNote, setEditNote] = useState("");
  const [editContext, setEditContext] = useState<EmotionEntry['context']>({});
  const [editQuadrant, setEditQuadrant] = useState<QuadrantType | null>(null);
  const [editEmotion, setEditEmotion] = useState<string | null>(null);
  const [editDate, setEditDate] = useState<Date>(new Date());
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Expanded recent entries
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchEntries();
  }, [user]);

  const fetchEntries = async (): Promise<EmotionEntry[] | undefined> => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('emotions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const parsed: EmotionEntry[] = (data || []).map(row => {
        let quadrant: QuadrantType = 'low-pleasant';
        let emotion = row.emotion;
        let parsedContext: EmotionEntry['context'] = undefined;

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
      console.error('Error fetching emotions:', err);
      return;
    } finally {
      setLoading(false);
    }
  };

  const handleMoodSelect = (quadrant: QuadrantType, emotion: string) => {
    setSelectedQuadrant(quadrant);
    setSelectedEmotion(emotion);
    setStep('details');
  };

  const resetCheckIn = () => {
    setSelectedQuadrant(null);
    setSelectedEmotion(null);
    setNote("");
    setContext({});
    setSendToJournal(false);
    setStep('picker');
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

      const entryDate = format(new Date(), 'yyyy-MM-dd');

      const { data: insertedEmotion, error } = await supabase.from('emotions').insert({
        user_id: user.id,
        emotion: emotionData,
        notes: note || null,
        tags: null,
        entry_date: entryDate,
      }).select('id').single();

      if (error) throw error;

      // Create feed event
      await supabase.from('feed_events').insert({
        user_id: user.id,
        type: 'checkin',
        source_module: 'emotions',
        source_id: insertedEmotion.id,
        title: `Feeling ${selectedEmotion}`,
        summary: context.who ? `with ${context.who}` : null,
        content_preview: note || null,
        media: [],
        metadata: { quadrant: selectedQuadrant, emotion: selectedEmotion, context, entry_date: entryDate },
      });

      // Save to journal if toggled
      if (sendToJournal && note) {
        await saveToJournal(entryDate, note, selectedEmotion);
      }

      toast.success(`Logged: ${selectedEmotion} ✨`);
      resetCheckIn();
      await fetchEntries();
    } catch (err) {
      console.error('Error saving emotion:', err);
      toast.error('Failed to save check-in');
    } finally {
      setSaving(false);
    }
  };

  const saveToJournal = async (entryDate: string, noteText: string, emotion: string) => {
    if (!user) return;
    try {
      const { data: existingEntry } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('user_id', user.id)
        .eq('entry_date', entryDate)
        .maybeSingle();

      let journalEntryId: string;

      if (existingEntry) {
        journalEntryId = existingEntry.id;
      } else {
        const { data: newEntry, error: createError } = await supabase
          .from('journal_entries')
          .insert({ user_id: user.id, entry_date: entryDate })
          .select('id')
          .single();

        if (createError) throw createError;
        journalEntryId = newEntry.id;
      }

      const { data: existingAnswer } = await supabase
        .from('journal_answers')
        .select('id, answer_text')
        .eq('journal_entry_id', journalEntryId)
        .eq('question_id', 'feeling')
        .maybeSingle();

      const emotionNote = `[${emotion}] ${noteText}`;

      if (existingAnswer) {
        const updatedText = existingAnswer.answer_text
          ? `${existingAnswer.answer_text}\n\n${emotionNote}`
          : emotionNote;

        await supabase
          .from('journal_answers')
          .update({ answer_text: updatedText })
          .eq('id', existingAnswer.id);
      } else {
        await supabase.from('journal_answers').insert({
          journal_entry_id: journalEntryId,
          question_id: 'feeling',
          answer_text: emotionNote,
        });
      }

      toast.success('Note added to journal');
    } catch (err) {
      console.error('Error saving to journal:', err);
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
    setEditDate(new Date(entry.entry_date + 'T12:00:00'));
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

    try {
      const emotionData = JSON.stringify({
        quadrant: editQuadrant,
        emotion: editEmotion,
        context: editContext,
      });

      const newEntryDate = format(editDate, 'yyyy-MM-dd');

      const { error } = await supabase
        .from('emotions')
        .update({
          emotion: emotionData,
          notes: editNote || null,
          entry_date: newEntryDate,
        })
        .eq('id', editingEntry.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Check-in updated');
      cancelEdit();
      const updated = (await fetchEntries()) ?? [];

      if (viewingDate) {
        setViewingDate(newEntryDate);
        setViewingEntries(updated.filter(e => e.entry_date === newEntryDate));
      }
    } catch (err) {
      console.error('Error updating emotion:', err);
      toast.error('Failed to update check-in');
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
      const { error } = await supabase
        .from('emotions')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Check-in deleted');
      setDeletingEntryId(null);
      await fetchEntries();

      if (viewingDate) {
        const updatedEntries = viewingEntries.filter(e => e.id !== entryId);
        setViewingEntries(updatedEntries);
        if (updatedEntries.length === 0) {
          setViewingDate(null);
        }
      }
    } catch (err) {
      console.error('Error deleting emotion:', err);
      toast.error('Failed to delete check-in');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <PageLoadingScreen module="emotions" />;
  }

  return (
    <div className="flex flex-col w-full flex-1 min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero */}
      <PageHero
        storageKey="emotion_hero_src"
        typeKey="emotion_hero_type"
        badge={PAGE_HERO_TEXT.emotions.badge}
        title={PAGE_HERO_TEXT.emotions.title}
        subtitle={PAGE_HERO_TEXT.emotions.subtitle}
      />

      {/* Main Content */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          {/* Left Column - Check-in + Patterns */}
          <div className="space-y-6">
            {/* Check-in Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-3xl bg-card border border-border/50 shadow-sm"
            >
              <AnimatePresence mode="wait">
                {step === 'picker' && (
                  <motion.div
                    key="picker"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <MoodWheelPicker onSelect={handleMoodSelect} />
                  </motion.div>
                )}

                {step === 'details' && selectedQuadrant && selectedEmotion && (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <MoodDetailsForm
                      quadrant={selectedQuadrant}
                      emotion={selectedEmotion}
                      note={note}
                      onNoteChange={setNote}
                      context={context}
                      onContextChange={setContext}
                      sendToJournal={sendToJournal}
                      onSendToJournalChange={setSendToJournal}
                      onBack={() => setStep('picker')}
                      onSave={saveCheckIn}
                      saving={saving}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Patterns Dashboard */}
            <PatternsDashboardEnhanced entries={entries} onDateClick={handleDateClick} />
          </div>

          {/* Right Column - Sidebar */}
          <aside className="space-y-4">
            {/* Stats Card */}
            <EmotionStatsCard entries={entries} />

            {/* Today's Timeline */}
            <TodayMoodTimeline 
              entries={entries} 
              onEntryClick={(entry) => startEditEntry(entry)}
            />

            {/* Breathing Widget */}
            <BreathingWidget />

            {/* Strategies */}
            <StrategiesPanelEnhanced
              currentQuadrant={currentQuadrant}
              currentEmotion={currentEmotion}
            />

            {/* Recent Check-ins (collapsible) */}
            {entries.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-card border border-border/50"
              >
                <p className="font-medium text-sm mb-3">Recent Check-ins</p>
                <div className="space-y-2">
                  {entries.slice(0, 5).map((entry) => {
                    const isExpanded = expandedEntryId === entry.id;
                    const info = QUADRANTS[entry.quadrant];

                    return (
                      <div key={entry.id} className="rounded-xl overflow-hidden" style={{ backgroundColor: info.bgColor }}>
                        <button
                          onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                          className="w-full flex items-center justify-between p-3 text-left"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: info.color }} />
                            <span className="text-sm font-medium">{entry.emotion}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(entry.entry_date + 'T12:00:00'), 'MMM d')}
                            </span>
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </div>
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="px-3 pb-3 space-y-2"
                            >
                              {entry.note && <p className="text-xs text-muted-foreground">{entry.note}</p>}
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => startEditEntry(entry)}>
                                  <Pencil className="h-3 w-3 mr-1" /> Edit
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 text-xs text-destructive" onClick={() => setDeletingEntryId(entry.id)}>
                                  <Trash2 className="h-3 w-3 mr-1" /> Delete
                                </Button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </aside>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={!!viewingDate} onOpenChange={(open) => !open && setViewingDate(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Check-ins for {viewingDate ? format(new Date(viewingDate), 'EEEE, MMMM d, yyyy') : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {viewingEntries.map((entry) => (
              <div key={entry.id} className="p-4 rounded-xl" style={{ backgroundColor: QUADRANTS[entry.quadrant].bgColor }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: QUADRANTS[entry.quadrant].color }} />
                  <span className="font-medium" style={{ color: QUADRANTS[entry.quadrant].color }}>{entry.emotion}</span>
                  <div className="flex items-center gap-1 ml-auto">
                    <span className="text-xs text-muted-foreground">{format(new Date(entry.created_at), 'h:mm a')}</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => startEditEntry(entry)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => setDeletingEntryId(entry.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {entry.note && <p className="text-sm text-muted-foreground mb-2">{entry.note}</p>}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && cancelEdit()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Check-in</DialogTitle>
          </DialogHeader>
          {editingEntry && editQuadrant && editEmotion && (
            <div className="space-y-4">
              <EmotionSliderPicker onSelect={handleEditEmotionSelect} initialQuadrant={editQuadrant} initialEmotion={editEmotion} compact />
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <input
                  type="date"
                  value={format(editDate, 'yyyy-MM-dd')}
                  onChange={(e) => setEditDate(new Date(e.target.value + 'T12:00:00'))}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
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
                <Button variant="outline" onClick={cancelEdit} className="flex-1">Cancel</Button>
                <Button onClick={saveEditedEntry} disabled={saving} className="flex-1">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingEntryId} onOpenChange={(open) => !open && setDeletingEntryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete check-in?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingEntryId && deleteEntry(deletingEntryId)} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
