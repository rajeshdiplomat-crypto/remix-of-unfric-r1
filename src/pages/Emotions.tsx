import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Check, Loader2, Lightbulb, X } from "lucide-react";

import { QuadrantType, EmotionEntry, QUADRANTS } from "@/components/emotions/types";
import { EmotionQuadrantPicker } from "@/components/emotions/EmotionQuadrantPicker";
import { EmotionLabelSelector } from "@/components/emotions/EmotionLabelSelector";
import { EmotionContextFields } from "@/components/emotions/EmotionContextFields";
import { StrategiesPanel } from "@/components/emotions/StrategiesPanel";
import { PatternsDashboard } from "@/components/emotions/PatternsDashboard";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export default function Emotions() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<EmotionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [strategiesOpen, setStrategiesOpen] = useState(false);

  // Check-in state
  const [selectedQuadrant, setSelectedQuadrant] = useState<QuadrantType | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [context, setContext] = useState<{ who?: string; what?: string; body?: string }>({});
  const [step, setStep] = useState<'quadrant' | 'emotion' | 'details'>('quadrant');

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
        try {
          const parsedData = JSON.parse(row.emotion);
          if (parsedData.quadrant) quadrant = parsedData.quadrant;
          if (parsedData.emotion) emotion = parsedData.emotion;
        } catch {
          emotion = row.emotion;
        }
        return {
          id: row.id,
          quadrant,
          emotion,
          note: row.notes || undefined,
          context: row.tags ? { who: row.tags[0], what: row.tags[1], body: row.tags[2] } : undefined,
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

  const handleQuadrantSelect = (quadrant: QuadrantType) => {
    setSelectedQuadrant(quadrant);
    setSelectedEmotion(null);
    setStep('emotion');
  };

  const handleEmotionSelect = (emotion: string) => {
    setSelectedEmotion(emotion);
    setStep('details');
  };

  const handleBack = () => {
    if (step === 'details') {
      setStep('emotion');
    } else if (step === 'emotion') {
      setStep('quadrant');
      setSelectedQuadrant(null);
    }
  };

  const resetCheckIn = () => {
    setSelectedQuadrant(null);
    setSelectedEmotion(null);
    setNote("");
    setContext({});
    setStep('quadrant');
  };

  const saveCheckIn = async () => {
    if (!user || !selectedQuadrant || !selectedEmotion) return;
    setSaving(true);
    try {
      const emotionData = JSON.stringify({ quadrant: selectedQuadrant, emotion: selectedEmotion });
      const tags = [context.who || '', context.what || '', context.body || ''].filter(Boolean);

      const { error } = await supabase.from('emotions').insert({
        user_id: user.id,
        emotion: emotionData,
        notes: note || null,
        tags: tags.length > 0 ? tags : null,
        entry_date: format(new Date(), 'yyyy-MM-dd'),
      });

      if (error) throw error;
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

  const latestEntry = entries[0];

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-6">
      {/* Left Panel - Check-in (top) + Patterns (bottom) */}
      <main className="flex-1 min-w-0 flex flex-col gap-6">
        {/* Check-in Section */}
        <section className="shrink-0">
          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <h1 className="text-xl font-semibold mb-1">How are you feeling?</h1>
                <p className="text-sm text-muted-foreground">Take a moment to check in with yourself</p>
              </div>

              {step === 'quadrant' && (
                <>
                  <EmotionQuadrantPicker selected={selectedQuadrant} onSelect={handleQuadrantSelect} />
                  {/* Recent entries inline */}
                  {entries.length > 0 && (
                    <div className="pt-4 mt-4 border-t">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Recent check-ins</h3>
                      <div className="flex flex-wrap gap-2">
                        {entries.slice(0, 5).map((entry) => (
                          <div key={entry.id} className="flex items-center gap-1.5 px-2 py-1 bg-muted/30 rounded-full text-sm">
                            <span>
                              {entry.quadrant === 'high-pleasant' && '😊'}
                              {entry.quadrant === 'high-unpleasant' && '😰'}
                              {entry.quadrant === 'low-unpleasant' && '😔'}
                              {entry.quadrant === 'low-pleasant' && '😌'}
                            </span>
                            <span className="font-medium">{entry.emotion}</span>
                            <span className="text-xs text-muted-foreground">{format(new Date(entry.created_at), 'h:mm a')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {step === 'emotion' && selectedQuadrant && (
                <EmotionLabelSelector
                  quadrant={selectedQuadrant}
                  selected={selectedEmotion}
                  onSelect={handleEmotionSelect}
                  onBack={handleBack}
                />
              )}

              {step === 'details' && selectedQuadrant && selectedEmotion && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: QUADRANTS[selectedQuadrant].bgColor }}>
                    <span className="text-2xl">
                      {selectedQuadrant === 'high-pleasant' && '😊'}
                      {selectedQuadrant === 'high-unpleasant' && '😰'}
                      {selectedQuadrant === 'low-unpleasant' && '😔'}
                      {selectedQuadrant === 'low-pleasant' && '😌'}
                    </span>
                    <div>
                      <p className="font-medium" style={{ color: QUADRANTS[selectedQuadrant].color }}>{selectedEmotion}</p>
                      <p className="text-xs text-muted-foreground">{QUADRANTS[selectedQuadrant].description}</p>
                    </div>
                  </div>

                  <EmotionContextFields note={note} onNoteChange={setNote} context={context} onContextChange={setContext} />

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                    <Button onClick={saveCheckIn} disabled={saving} className="flex-1">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                      Save Check-in
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Patterns Section */}
        <section className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <PatternsDashboard entries={entries} />
          </ScrollArea>
        </section>
      </main>

      {/* Right Panel - Strategies Slider */}
      <Sheet open={strategiesOpen} onOpenChange={setStrategiesOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="lg"
            className="fixed right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-1 py-4 px-3 rounded-l-xl rounded-r-none border-r-0 shadow-lg bg-background/95 backdrop-blur"
          >
            <Lightbulb className="h-5 w-5" />
            <span className="text-xs font-medium writing-mode-vertical" style={{ writingMode: 'vertical-rl' }}>Strategies</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[420px] sm:w-[480px] p-0">
          <SheetHeader className="p-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Strategies
              </SheetTitle>
            </div>
            {latestEntry && (
              <p className="text-sm text-muted-foreground">
                Based on your mood: <span className="font-medium text-foreground">{latestEntry.emotion}</span>
              </p>
            )}
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-120px)]">
            <div className="p-6">
              <StrategiesPanel 
                currentQuadrant={latestEntry?.quadrant || selectedQuadrant} 
                currentEmotion={latestEntry?.emotion || selectedEmotion} 
              />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
