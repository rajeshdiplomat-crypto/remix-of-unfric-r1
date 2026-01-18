import { useState, useEffect, memo } from "react";
import { format } from "date-fns";
import {
  Sparkles,
  TrendingUp,
  PenLine,
  Users,
  Activity,
  Moon,
  Heart,
  Dumbbell,
  Clock,
  Target,
  Zap,
} from "lucide-react";
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
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  // Fetch emotions and tasks for the selected date
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

        // Fetch tasks for the date
        const { data: tasksData } = await supabase
          .from("tasks")
          .select("id, is_completed")
          .eq("user_id", user.id)
          .eq("due_date", dateStr);

        if (tasksData) {
          setTotalTasks(tasksData.length);
          setTasksCompleted(tasksData.filter((t: any) => t.is_completed).length);
        }
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

  const getEmotionsSentence = () => {
    if (emotions.length === 0) return "No emotional check-ins yet";
    if (emotions.length === 1) return "You checked in with yourself";
    return `${emotions.length} emotional check-ins`;
  };

  const getTasksSentence = () => {
    if (totalTasks === 0) return "No tasks scheduled today";
    if (tasksCompleted === 0) return `${totalTasks} tasks waiting for you`;
    if (tasksCompleted === totalTasks) return "All tasks completed! 🎉";
    return `${tasksCompleted} of ${totalTasks} tasks done`;
  };

  const getTimeSentence = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning! Perfect time to reflect";
    if (hour < 17) return "Afternoon thoughts are powerful";
    if (hour < 21) return "Evening is great for reflection";
    return "Night journaling brings clarity";
  };

  const getFocusSentence = () => {
    if (wordCount > 0 && emotions.length > 0) return "You're fully present today";
    if (wordCount > 0 || emotions.length > 0) return "You're making time for yourself";
    return "Take a moment to be present";
  };

  return (
    <div className="w-full h-full overflow-auto space-y-4 pb-4">
      {/* Dashboard Box - Sentences instead of numbers */}
      <div className="bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 rounded-2xl shadow-sm border border-violet-100/50 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-violet-100/30">
          <div className="p-1.5 bg-white rounded-lg shadow-sm">
            <TrendingUp className="h-4 w-4 text-violet-600" />
          </div>
          <span className="text-sm font-semibold text-violet-800">Your Progress</span>
        </div>
        <div className="p-3 space-y-2">
          {/* Writing progress */}
          <div className="flex items-start gap-3 bg-white/60 rounded-xl p-2.5 border border-white/50">
            <div className="p-1 bg-blue-100 rounded-lg mt-0.5">
              <PenLine className="h-3 w-3 text-blue-600" />
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{getWritingSentence()}</p>
          </div>

          {/* Streak */}
          <div className="flex items-start gap-3 bg-white/60 rounded-xl p-2.5 border border-white/50">
            <div className="p-1 bg-orange-100 rounded-lg mt-0.5">
              <Zap className="h-3 w-3 text-orange-600" />
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{getStreakSentence()}</p>
          </div>

          {/* Emotions summary */}
          <div className="flex items-start gap-3 bg-white/60 rounded-xl p-2.5 border border-white/50">
            <div className="p-1 bg-pink-100 rounded-lg mt-0.5">
              <Heart className="h-3 w-3 text-pink-600" />
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{getEmotionsSentence()}</p>
          </div>

          {/* Tasks */}
          <div className="flex items-start gap-3 bg-white/60 rounded-xl p-2.5 border border-white/50">
            <div className="p-1 bg-green-100 rounded-lg mt-0.5">
              <Target className="h-3 w-3 text-green-600" />
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{getTasksSentence()}</p>
          </div>

          {/* Time of day */}
          <div className="flex items-start gap-3 bg-white/60 rounded-xl p-2.5 border border-white/50">
            <div className="p-1 bg-purple-100 rounded-lg mt-0.5">
              <Clock className="h-3 w-3 text-purple-600" />
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{getTimeSentence()}</p>
          </div>

          {/* Focus/presence */}
          <div className="flex items-start gap-3 bg-white/60 rounded-xl p-2.5 border border-white/50">
            <div className="p-1 bg-indigo-100 rounded-lg mt-0.5">
              <Sparkles className="h-3 w-3 text-indigo-600" />
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{getFocusSentence()}</p>
          </div>
        </div>
      </div>

      {/* Emotions from this Date */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-50">
          <div className="p-1.5 bg-pink-100 rounded-lg">
            <Sparkles className="h-4 w-4 text-pink-600" />
          </div>
          <span className="text-sm font-semibold text-slate-800">Emotions Today</span>
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
                  {/* Emotion header */}
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className={cn("text-sm font-semibold capitalize", getEmotionTextColor(entry.emotion))}>
                        {entry.emotion}
                      </span>
                      {entry.quadrant && (
                        <p className="text-[10px] text-slate-500 capitalize">{entry.quadrant.replace("-", " & ")}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">{entry.time}</span>
                  </div>

                  {/* Note if exists */}
                  {entry.note && <p className="text-[11px] text-slate-600 italic mb-2">"{entry.note}"</p>}

                  {/* Context details */}
                  {entry.context && Object.keys(entry.context).length > 0 && (
                    <div className="space-y-1.5 mt-2 pt-2 border-t border-slate-100/50">
                      {/* Who with */}
                      {entry.context.who && (
                        <div className="flex items-start gap-2">
                          <Users className="h-3 w-3 text-slate-400 mt-0.5 flex-shrink-0" />
                          <p className="text-[11px] text-slate-600">
                            <span className="text-slate-400">With:</span> {entry.context.who}
                          </p>
                        </div>
                      )}

                      {/* Activity */}
                      {entry.context.what && (
                        <div className="flex items-start gap-2">
                          <Activity className="h-3 w-3 text-slate-400 mt-0.5 flex-shrink-0" />
                          <p className="text-[11px] text-slate-600">
                            <span className="text-slate-400">Doing:</span> {entry.context.what}
                          </p>
                        </div>
                      )}

                      {/* Body sensations */}
                      {entry.context.body && (
                        <div className="flex items-start gap-2">
                          <Heart className="h-3 w-3 text-slate-400 mt-0.5 flex-shrink-0" />
                          <p className="text-[11px] text-slate-600">
                            <span className="text-slate-400">Feeling:</span> {entry.context.body}
                          </p>
                        </div>
                      )}

                      {/* Sleep */}
                      {entry.context.sleepHours && (
                        <div className="flex items-start gap-2">
                          <Moon className="h-3 w-3 text-slate-400 mt-0.5 flex-shrink-0" />
                          <p className="text-[11px] text-slate-600">
                            <span className="text-slate-400">Sleep:</span> {entry.context.sleepHours}
                          </p>
                        </div>
                      )}

                      {/* Physical activity */}
                      {entry.context.physicalActivity && (
                        <div className="flex items-start gap-2">
                          <Dumbbell className="h-3 w-3 text-slate-400 mt-0.5 flex-shrink-0" />
                          <p className="text-[11px] text-slate-600">
                            <span className="text-slate-400">Exercise:</span> {entry.context.physicalActivity}
                          </p>
                        </div>
                      )}
                    </div>
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
