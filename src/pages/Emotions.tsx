import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Check, Loader2, ArrowLeft, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { QuadrantType, EmotionEntry, QUADRANTS } from "@/components/emotions/types";
import { EmotionSliderPicker } from "@/components/emotions/EmotionSliderPicker";
import { EmotionContextFieldsEnhanced } from "@/components/emotions/EmotionContextFieldsEnhanced";
import { StrategiesPanelEnhanced } from "@/components/emotions/StrategiesPanelEnhanced";
import { PatternsDashboardEnhanced } from "@/components/emotions/PatternsDashboardEnhanced";
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 h-[calc(100vh-4rem)]">
      {/* LEFT: Check-in + Patterns (scrollable) */}
      <div className="overflow-y-auto space-y-6">
        {/* How are you feeling - Check-in section */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
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
        <PatternsDashboardEnhanced entries={entries} />
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
        
        {/* Recent check-ins dynamically below strategies */}
        {entries.length > 0 && (
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Recent Check-ins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {entries.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: QUADRANTS[entry.quadrant].color }}
                      />
                      <span className="text-sm font-medium">I am feeling {entry.emotion}</span>
                      {entry.context?.what && (
                        <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                          {entry.context.what}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(entry.created_at), 'MMM d')}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </aside>
    </div>
  );
}
