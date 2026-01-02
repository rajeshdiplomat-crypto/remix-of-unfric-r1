import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { SmilePlus, TrendingUp, Lightbulb, Check, Loader2 } from "lucide-react";

import { QuadrantType, EmotionEntry, EmotionSection, QUADRANTS } from "@/components/emotions/types";
import { EmotionQuadrantPicker } from "@/components/emotions/EmotionQuadrantPicker";
import { EmotionLabelSelector } from "@/components/emotions/EmotionLabelSelector";
import { EmotionContextFields } from "@/components/emotions/EmotionContextFields";
import { StrategiesPanel } from "@/components/emotions/StrategiesPanel";
import { PatternsDashboard } from "@/components/emotions/PatternsDashboard";

const sidebarSections: { id: EmotionSection; label: string; icon: React.ReactNode }[] = [
  { id: 'check-in', label: 'Check-In', icon: <SmilePlus className="h-5 w-5" /> },
  { id: 'patterns', label: 'Patterns', icon: <TrendingUp className="h-5 w-5" /> },
  { id: 'strategies', label: 'Strategies', icon: <Lightbulb className="h-5 w-5" /> },
];

export default function Emotions() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<EmotionSection>('check-in');
  const [entries, setEntries] = useState<EmotionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-6">
      {/* Sidebar */}
      <aside className="w-16 lg:w-48 shrink-0 flex flex-col gap-1 py-2">
        {sidebarSections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
              activeSection === section.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            {section.icon}
            <span className="hidden lg:inline text-sm font-medium">{section.label}</span>
          </button>
        ))}
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <ScrollArea className="h-full pr-4">
          {activeSection === 'check-in' && (
            <div className="max-w-lg mx-auto py-6 space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-semibold mb-1">How are you feeling?</h1>
                <p className="text-sm text-muted-foreground">Take a moment to check in with yourself</p>
              </div>

              {step === 'quadrant' && (
                <EmotionQuadrantPicker selected={selectedQuadrant} onSelect={handleQuadrantSelect} />
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
                <Card>
                  <CardContent className="p-6 space-y-6">
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
                  </CardContent>
                </Card>
              )}

              {/* Recent entries */}
              {entries.length > 0 && step === 'quadrant' && (
                <div className="pt-6 border-t">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Recent check-ins</h3>
                  <div className="space-y-2">
                    {entries.slice(0, 5).map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {entry.quadrant === 'high-pleasant' && '😊'}
                            {entry.quadrant === 'high-unpleasant' && '😰'}
                            {entry.quadrant === 'low-unpleasant' && '😔'}
                            {entry.quadrant === 'low-pleasant' && '😌'}
                          </span>
                          <span className="text-sm font-medium">{entry.emotion}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{format(new Date(entry.created_at), 'MMM d, h:mm a')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSection === 'patterns' && (
            <div className="max-w-2xl mx-auto py-6">
              <PatternsDashboard entries={entries} />
            </div>
          )}

          {activeSection === 'strategies' && (
            <div className="max-w-2xl mx-auto py-6">
              <StrategiesPanel currentQuadrant={selectedQuadrant} currentEmotion={selectedEmotion} />
            </div>
          )}
        </ScrollArea>
      </main>
    </div>
  );
}
