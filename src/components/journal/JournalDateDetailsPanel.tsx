import { useState, useEffect, memo } from "react";
import { format } from "date-fns";
import { Sparkles, TrendingUp, PenLine, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { JournalSkin } from "./types";

interface JournalDateDetailsPanelProps {
  selectedDate: Date;
  wordCount: number;
  streak: number;
  skin?: JournalSkin;
}

interface EmotionContext {
  who?: string;
  what?: string;
  body?: string;
  sleepHours?: string;
  physicalActivity?: string;
}

interface EmotionEntry {
  id: string;
  emotion: string;
  quadrant?: string;
  context?: EmotionContext;
  note?: string;
  time: string;
}

export const JournalDateDetailsPanel = memo(function JournalDateDetailsPanel({
  selectedDate,
  wordCount,
  streak,
  skin,
}: JournalDateDetailsPanelProps) {
  const { user } = useAuth();
  const [emotions, setEmotions] = useState<EmotionEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  // Fetch emotions for the selected date
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setIsLoading(true);
      const emotionsList: EmotionEntry[] = [];

      try {
        // Fetch emotions using entry_date field (matching Emotions.tsx)
        const { data: emotionsData } = await supabase
          .from("emotions")
          .select("*")
          .eq("user_id", user.id)
          .eq("entry_date", dateStr)
          .order("created_at", { ascending: false });

        if (emotionsData) {
          emotionsData.forEach((e: any) => {
            let emotionName = "Emotion logged";
            let quadrant = "";
            let context: EmotionContext = {};
            let showInJournal = true; // Default to true for backward compatibility

            try {
              const parsed = JSON.parse(e.emotion);
              emotionName = parsed.emotion || e.emotion;
              quadrant = parsed.quadrant || "";
              context = parsed.context || {};
              // Check if showInJournal flag exists (new entries will have it)
              if (parsed.showInJournal !== undefined) {
                showInJournal = parsed.showInJournal;
              }
            } catch {
              emotionName = e.emotion || "Unknown";
            }

            // Only add emotions that should be shown in journal
            if (showInJournal) {
              emotionsList.push({
                id: e.id,
                emotion: emotionName,
                quadrant,
                context,
                note: e.notes || undefined,
                time: format(new Date(e.created_at), "h:mm a"),
              });
            }
          });
        }

        setEmotions(emotionsList);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, dateStr]);

  const getEmotionColor = (emotion: string) => {
    const lower = emotion.toLowerCase();
    if (
      ["happy", "joy", "excited", "grateful", "peaceful", "content", "energetic", "confident", "grounded"].some((e) =>
        lower.includes(e),
      )
    ) {
      return "bg-emerald-50 border-emerald-200";
    }
    if (["calm", "relaxed", "hopeful", "good"].some((e) => lower.includes(e))) {
      return "bg-blue-50 border-blue-200";
    }
    if (["anxious", "stressed", "worried", "nervous", "frustrated", "annoyed"].some((e) => lower.includes(e))) {
      return "bg-amber-50 border-amber-200";
    }
    if (["sad", "angry", "upset", "disappointed", "lonely", "tired"].some((e) => lower.includes(e))) {
      return "bg-rose-50 border-rose-200";
    }
    return "bg-violet-50 border-violet-200";
  };

  const getEmotionTextColor = (emotion: string) => {
    const lower = emotion.toLowerCase();
    if (
      ["happy", "joy", "excited", "grateful", "peaceful", "content", "energetic", "confident", "grounded"].some((e) =>
        lower.includes(e),
      )
    ) {
      return "text-emerald-700";
    }
    if (["calm", "relaxed", "hopeful", "good"].some((e) => lower.includes(e))) {
      return "text-blue-700";
    }
    if (["anxious", "stressed", "worried", "nervous", "frustrated", "annoyed"].some((e) => lower.includes(e))) {
      return "text-amber-700";
    }
    if (["sad", "angry", "upset", "disappointed", "lonely", "tired"].some((e) => lower.includes(e))) {
      return "text-rose-700";
    }
    return "text-violet-700";
  };

  // Generate friendly sentences for dashboard
  const getWritingSentence = () => {
    if (wordCount === 0) return "Ready to start writing today";
    if (wordCount < 50) return "You've started capturing your thoughts";
    if (wordCount < 150) return "Nice progress on your journal";
    if (wordCount < 300) return "You're really flowing today";
    return "Wonderful reflection session!";
  };

  const getStreakSentence = () => {
    if (streak === 0) return "Start your journaling journey";
    if (streak === 1) return "Day one of your streak!";
    if (streak < 7) return `${streak} days of consistency`;
    if (streak < 30) return `Amazing ${streak}-day streak!`;
    return `Incredible ${streak}-day journey!`;
  };

  return (
    <div className="w-full h-full overflow-auto space-y-4 pb-4">
      {/* Dashboard Box - Journal-focused nudges only */}
      <div className="bg-muted/30 rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
          <div className="p-1.5 bg-muted rounded-lg">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="text-sm font-semibold text-foreground">Your Progress</span>
        </div>
        <div className="p-3 space-y-2">
          <div className="flex items-start gap-3 bg-background rounded-xl p-2.5 border border-border">
            <div className="p-1 bg-muted rounded-lg mt-0.5">
              <PenLine className="h-3 w-3 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{getWritingSentence()}</p>
          </div>

          <div className="flex items-start gap-3 bg-background rounded-xl p-2.5 border border-border">
            <div className="p-1 bg-muted rounded-lg mt-0.5">
              <Zap className="h-3 w-3 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{getStreakSentence()}</p>
          </div>

          <div className="flex items-start gap-3 bg-background rounded-xl p-2.5 border border-border">
            <div className="p-1 bg-muted rounded-lg mt-0.5">
              <Sparkles className="h-3 w-3 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {wordCount === 0
                ? "A blank page is full of possibilities"
                : wordCount < 100
                  ? "You're building a beautiful habit"
                  : "Your words tell a story worth keeping"}
            </p>
          </div>
        </div>
      </div>

      {/* Emotions from this Date */}
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
          <div className="p-1.5 bg-muted rounded-lg">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="text-sm font-semibold text-foreground">Emotions Today</span>
        </div>
        <div className="p-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-violet-500 border-t-transparent" />
            </div>
          ) : emotions.length === 0 ? (
            <div className="text-center py-6">
              <Sparkles className="h-8 w-8 text-slate-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No emotions logged today</p>
              <p className="text-[10px] text-slate-300 mt-1">Visit the Emotions page to check in</p>
            </div>
          ) : (
            <div className="space-y-3">
              {emotions.map((entry) => (
                <div
                  key={entry.id}
                  className={cn("rounded-xl p-3 border transition-colors", getEmotionColor(entry.emotion))}
                >
                  {/* Sentence-based emotion display */}
                  <p className={cn("text-sm leading-relaxed", getEmotionTextColor(entry.emotion))}>
                    {(() => {
                      // Build a grammatically correct sentence
                      let sentence = `At ${entry.time}, you felt `;
                      sentence += `**${entry.emotion.toLowerCase()}**`;

                      // Add context with proper grammar
                      const hasWho = entry.context?.who;
                      const hasWhat = entry.context?.what;

                      if (hasWho && hasWhat) {
                        sentence += ` while you were with ${entry.context.who.toLowerCase()}, ${entry.context.what.toLowerCase()}`;
                      } else if (hasWho) {
                        sentence += ` while you were with ${entry.context.who.toLowerCase()}`;
                      } else if (hasWhat) {
                        sentence += ` while ${entry.context.what.toLowerCase()}`;
                      }

                      sentence += ".";
                      return sentence;
                    })()}
                  </p>

                  {/* Body and wellness info as a secondary sentence */}
                  {(entry.context?.body || entry.context?.sleepHours || entry.context?.physicalActivity) && (
                    <p className="text-xs text-slate-500 mt-1.5">
                      {(() => {
                        const wellnessParts: string[] = [];
                        if (entry.context?.body) {
                          wellnessParts.push(`feeling ${entry.context.body.toLowerCase()}`);
                        }
                        if (entry.context?.sleepHours) {
                          wellnessParts.push(`with ${entry.context.sleepHours} of sleep`);
                        }
                        if (entry.context?.physicalActivity && entry.context.physicalActivity !== "None") {
                          wellnessParts.push(`and ${entry.context.physicalActivity.toLowerCase()} for exercise`);
                        }

                        if (wellnessParts.length === 0) return "";
                        return `You were ${wellnessParts.join(", ")}.`;
                      })()}
                    </p>
                  )}

                  {/* Note as reflection */}
                  {entry.note && (
                    <p className="text-xs text-slate-600 mt-2 pt-2 border-t border-slate-100/50">
                      You also wrote <span className="italic">"{entry.note}"</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
