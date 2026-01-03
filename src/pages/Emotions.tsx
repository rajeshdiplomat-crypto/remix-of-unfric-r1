import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Check, Loader2, ArrowLeft, ChevronLeft, ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

import { QuadrantType, EmotionEntry, QUADRANTS } from "@/components/emotions/types";
import { EmotionSliderPicker } from "@/components/emotions/EmotionSliderPicker";
import { EmotionContextFieldsEnhanced } from "@/components/emotions/EmotionContextFieldsEnhanced";
import { StrategiesPanelEnhanced } from "@/components/emotions/StrategiesPanelEnhanced";
import { PatternsDashboardEnhanced } from "@/components/emotions/PatternsDashboardEnhanced";
import { CheckinReminders } from "@/components/emotions/CheckinReminders";
import { PageHeroMedia, HERO_TEXT } from "@/components/common/PageHeroMedia";
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
  const [step, setStep] = useState<'sliders' | 'details'>('sliders');
  
  // For viewing entries by date
  const [viewingDate, setViewingDate] = useState<string | null>(null);
  const [viewingEntries, setViewingEntries] = useState<EmotionEntry[]>([]);
  
  // For expanded check-in cards
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  
  // For editing entries
  const [editingEntry, setEditingEntry] = useState<EmotionEntry | null>(null);
  const [editNote, setEditNote] = useState("");
  const [editContext, setEditContext] = useState<EmotionEntry['context']>({});
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

        // Fallback to tags for older entries
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

  const handleSliderComplete = (quadrant: QuadrantType, emotion: string) => {
    setSelectedQuadrant(quadrant);
    setSelectedEmotion(emotion);
    setStep('details');
  };

  const handleBack = () => {
    setStep('sliders');
  };

  const resetCheckIn = () => {
    setSelectedQuadrant(null);
    setSelectedEmotion(null);
    setNote("");
    setContext({});
    setSendToJournal(false);
    setCheckInTime(new Date());
    setStep('sliders');
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

      const entryDate = format(checkInTime, 'yyyy-MM-dd');

      const { data: insertedEmotion, error } = await supabase.from('emotions').insert({
        user_id: user.id,
        emotion: emotionData,
        notes: note || null,
        tags: null,
        entry_date: entryDate,
      }).select('id').single();

      if (error) throw error;

      // Create feed event for diary
      await createEmotionFeedEvent(
        insertedEmotion.id,
        selectedQuadrant,
        selectedEmotion,
        note || undefined,
        context,
        entryDate
      );

      // Send to journal if toggled
      if (sendToJournal && note) {
        await saveToJournal(entryDate, note, selectedEmotion);
      }

      toast.success(`Logged: ${selectedEmotion}`);
      resetCheckIn();
      await fetchEntries();
    } catch (err) {
      console.error('Error saving emotion:', err);
      toast.error('Failed to save check-in');
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
    entryDate?: string
  ) => {
    if (!user) return;
    
    const contextParts: string[] = [];
    if (ctx?.who) contextParts.push(`with ${ctx.who}`);
    if (ctx?.what) contextParts.push(`while ${ctx.what}`);
    
    const summary = contextParts.length > 0 ? contextParts.join(' ') : null;
    
    try {
      await supabase.from('feed_events').insert({
        user_id: user.id,
        type: 'checkin',
        source_module: 'emotions',
        source_id: emotionId,
        title: `Feeling ${emotion}`,
        summary: summary,
        content_preview: note || null,
        media: [],
        metadata: { quadrant, emotion, context: ctx, entry_date: entryDate },
      });
    } catch (err) {
      console.error('Error creating feed event:', err);
    }
  };

  const saveToJournal = async (entryDate: string, noteText: string, emotion: string) => {
    if (!user) return;
    try {
      // Check if journal entry exists for this date
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
        // Create new journal entry
        const { data: newEntry, error: createError } = await supabase
          .from('journal_entries')
          .insert({
            user_id: user.id,
            entry_date: entryDate,
          })
          .select('id')
          .single();

        if (createError) throw createError;
        journalEntryId = newEntry.id;
      }

      // Check if first question answer already exists
      const { data: existingAnswer } = await supabase
        .from('journal_answers')
        .select('id, answer_text')
        .eq('journal_entry_id', journalEntryId)
        .eq('question_id', 'feeling')
        .maybeSingle();

      const emotionNote = `[${emotion}] ${noteText}`;

      if (existingAnswer) {
        // Append to existing answer
        const updatedText = existingAnswer.answer_text 
          ? `${existingAnswer.answer_text}\n\n${emotionNote}`
          : emotionNote;
        
        await supabase
          .from('journal_answers')
          .update({ answer_text: updatedText })
          .eq('id', existingAnswer.id);
      } else {
        // Create new answer for the first question
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

  // Get the most recent emotion for strategy recommendations
  const latestEntry = entries[0];
  const currentQuadrant = selectedQuadrant || latestEntry?.quadrant || null;
  const currentEmotion = selectedEmotion || latestEntry?.emotion || null;

  const handleDateClick = (date: string, dayEntries: EmotionEntry[]) => {
    setViewingDate(date);
    setViewingEntries(dayEntries);
  };

  const toggleExpandEntry = (entryId: string) => {
    setExpandedEntryId(prev => prev === entryId ? null : entryId);
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

    const wasViewingDate = viewingDate;

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

      // Close edit modal first
      cancelEdit();

      // Refresh all entries (calendar, patterns, recent list)
      const updated = (await fetchEntries()) ?? [];

      // If user was looking at a date-specific list, keep them there and show the updated date
      if (wasViewingDate) {
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
      
      // Update viewing entries if dialog is open
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 h-[calc(100vh-4rem)]">
      {/* LEFT: Check-in + Patterns (scrollable) */}
      <div className="overflow-y-auto space-y-6 pr-1">
        {/* Hero Media Block */}
        <PageHeroMedia
          storageKey="emotion_page_hero_media"
          typeKey="emotion_page_hero_media_type"
          badge={HERO_TEXT.emotion.badge}
          title={HERO_TEXT.emotion.title}
          subtitle={HERO_TEXT.emotion.subtitle}
        />

        {/* How are you feeling - Check-in section */}
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => navigate('/diary')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-lg">How are you feeling?</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground ml-10">Take a moment to check in with yourself</p>
          </CardHeader>
          <CardContent>
            {step === 'sliders' && (
              <EmotionSliderPicker onSelect={handleSliderComplete} />
            )}

            {step === 'details' && selectedQuadrant && selectedEmotion && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: QUADRANTS[selectedQuadrant].bgColor }}>
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
                  <Button variant="outline" onClick={handleBack} className="flex-1">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={saveCheckIn} disabled={saving} className="flex-1">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                    Save Check-in
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Patterns Dashboard - Bottom of left panel */}
        <PatternsDashboardEnhanced entries={entries} onDateClick={handleDateClick} />
      </div>

      {/* RIGHT: Strategies Panel + Recent Check-ins (always mounted, sticky, independently scrollable) */}
      <aside
        className="hidden lg:flex flex-col h-full overflow-y-auto border-l border-border/50 bg-card p-4"
        tabIndex={-1}
        aria-label="Strategies panel"
      >
        <StrategiesPanelEnhanced
          currentQuadrant={currentQuadrant}
          currentEmotion={currentEmotion}
        />
        
        {/* Check-in reminders */}
        <div className="mt-6">
          <CheckinReminders />
        </div>
        {/* Recent check-ins dynamically below strategies */}
        {entries.length > 0 && (
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Recent Check-ins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {entries.slice(0, 5).map((entry) => {
                  const isExpanded = expandedEntryId === entry.id;
                  const hasDetails = entry.note || entry.context?.who || entry.context?.what || entry.context?.sleepHours || entry.context?.physicalActivity;
                  
                  return (
                    <div key={entry.id} className="rounded-lg bg-muted/30 overflow-hidden">
                      <div className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: QUADRANTS[entry.quadrant].color }}
                          />
                          <span className="text-sm font-medium truncate">I am feeling {entry.emotion}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(entry.entry_date + 'T12:00:00'), 'MMM d')}
                          </span>
                          {(hasDetails || true) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => toggleExpandEntry(entry.id)}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="px-3 pb-3 pt-0 space-y-2 border-t border-border/30">
                          {entry.note && (
                            <p className="text-sm text-muted-foreground mt-2">{entry.note}</p>
                          )}
                          <div className="flex flex-wrap gap-1.5">
                            {entry.context?.who && (
                              <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                                With: {entry.context.who}
                              </span>
                            )}
                            {entry.context?.what && (
                              <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                                {entry.context.what}
                              </span>
                            )}
                            {entry.context?.sleepHours && (
                              <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                                Sleep: {entry.context.sleepHours}
                              </span>
                            )}
                            {entry.context?.physicalActivity && (
                              <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                                Activity: {entry.context.physicalActivity}
                              </span>
                            )}
                          </div>
                          
                          {/* Edit/Delete actions */}
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => startEditEntry(entry)}
                            >
                              <Pencil className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs text-destructive hover:text-destructive"
                              onClick={() => setDeletingEntryId(entry.id)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </aside>
      
      {/* Dialog for viewing entries by date */}
      <Dialog open={!!viewingDate} onOpenChange={(open) => !open && setViewingDate(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Check-ins for {viewingDate ? format(new Date(viewingDate), 'EEEE, MMMM d, yyyy') : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {viewingEntries.map((entry) => (
              <div 
                key={entry.id} 
                className="p-4 rounded-lg"
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
                      {format(new Date(entry.created_at), 'h:mm a')}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => startEditEntry(entry)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      onClick={() => setDeletingEntryId(entry.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                {entry.note && (
                  <p className="text-sm text-muted-foreground mb-2">{entry.note}</p>
                )}
                
                <div className="flex flex-wrap gap-1.5">
                  {entry.context?.who && (
                    <span className="text-xs px-2 py-0.5 bg-background/50 rounded-full">
                      With: {entry.context.who}
                    </span>
                  )}
                  {entry.context?.what && (
                    <span className="text-xs px-2 py-0.5 bg-background/50 rounded-full">
                      {entry.context.what}
                    </span>
                  )}
                  {entry.context?.sleepHours && (
                    <span className="text-xs px-2 py-0.5 bg-background/50 rounded-full">
                      Sleep: {entry.context.sleepHours}
                    </span>
                  )}
                  {entry.context?.physicalActivity && (
                    <span className="text-xs px-2 py-0.5 bg-background/50 rounded-full">
                      Activity: {entry.context.physicalActivity}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit Entry Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && cancelEdit()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Check-in</DialogTitle>
          </DialogHeader>
          {editingEntry && editQuadrant && editEmotion && (
            <div className="space-y-4">
              {/* Emotion Picker for editing */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Emotion</label>
                <EmotionSliderPicker 
                  onSelect={handleEditEmotionSelect} 
                  initialQuadrant={editQuadrant}
                  initialEmotion={editEmotion}
                  compact
                />
              </div>
              
              {/* Date picker */}
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
                <Button variant="outline" onClick={cancelEdit} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={saveEditedEntry} disabled={saving} className="flex-1">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingEntryId} onOpenChange={(open) => !open && setDeletingEntryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete check-in?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this emotion check-in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingEntryId && deleteEntry(deletingEntryId)}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
