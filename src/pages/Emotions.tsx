import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Check, Loader2, ArrowLeft } from "lucide-react";

import { QuadrantType, EmotionEntry, QUADRANTS } from "@/components/emotions/types";
import { EmotionSliderPicker } from "@/components/emotions/EmotionSliderPicker";
import { EmotionContextFieldsEnhanced } from "@/components/emotions/EmotionContextFieldsEnhanced";
import { StrategiesPanelEnhanced } from "@/components/emotions/StrategiesPanelEnhanced";
import { PatternsDashboardEnhanced } from "@/components/emotions/PatternsDashboardEnhanced";

export default function Emotions() {
  const { user } = useAuth();
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

  useEffect(() => {
    if (user) fetchEntries();
  }, [user]);

  const fetchEntries = async () => {
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
    } catch (err) {
      console.error('Error fetching emotions:', err);
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

      const { error } = await supabase.from('emotions').insert({
        user_id: user.id,
        emotion: emotionData,
        notes: note || null,
        tags: null,
        entry_date: entryDate,
      });

      if (error) throw error;

      // Send to journal if toggled
      if (sendToJournal && note) {
        await saveToJournal(entryDate, note, selectedEmotion);
      }

      toast.success(`Logged: ${selectedEmotion}`);
      resetCheckIn();
      fetchEntries();
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
      // Check if journal entry exists for this date
      const { data: existingEntry } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('user_id', user.id)
        .eq('entry_date', entryDate)
        .single();

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

      // Add emotion note as a journal answer
      await supabase.from('journal_answers').insert({
        journal_entry_id: journalEntryId,
        question_id: 'emotion-checkin',
        answer_text: `[${emotion}] ${noteText}`,
      });

      toast.success('Note added to journal');
    } catch (err) {
      console.error('Error saving to journal:', err);
    }
  };

  // Get the most recent emotion for strategy recommendations
  const latestEntry = entries[0];
  const currentQuadrant = selectedQuadrant || latestEntry?.quadrant || null;
  const currentEmotion = selectedEmotion || latestEntry?.emotion || null;

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] gap-4">
      {/* Top: Patterns Dashboard */}
      <div className="shrink-0">
        <PatternsDashboardEnhanced entries={entries} />
      </div>

      {/* Bottom: Left (Check-in) + Right (Strategies) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Panel: Check-in */}
        <div className="lg:col-span-8 min-h-0">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 shrink-0">
              <CardTitle className="text-lg">How are you feeling?</CardTitle>
              <p className="text-sm text-muted-foreground">Take a moment to check in with yourself</p>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-auto">
              {step === 'sliders' && (
                <div className="space-y-6">
                  <EmotionSliderPicker onSelect={handleSliderComplete} />
                  
                  {/* Recent entries table */}
                  {entries.length > 0 && (
                    <div className="pt-4 border-t">
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Recent check-ins</h3>
                      <div className="space-y-2">
                        {entries.slice(0, 5).map((entry) => (
                          <div key={entry.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: QUADRANTS[entry.quadrant].color }}
                              />
                              <span className="text-sm font-medium">{entry.emotion}</span>
                              {entry.context?.what && (
                                <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                                  {entry.context.what}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(entry.created_at), 'MMM d, h:mm a')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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
        </div>

        {/* Right Panel: Strategies */}
        <div className="lg:col-span-4 min-h-0">
          <ScrollArea className="h-full">
            <StrategiesPanelEnhanced
              currentQuadrant={currentQuadrant}
              currentEmotion={currentEmotion}
            />
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
