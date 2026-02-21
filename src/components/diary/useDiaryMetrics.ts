import { useState, useEffect, useMemo } from "react";
import { format, subDays, startOfDay, endOfDay, startOfWeek, startOfMonth, isWithinInterval, parseISO, differenceInDays, isSameDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { TimeRange, MetricsSnapshot } from "./types";

interface UseDiaryMetricsResult {
  metrics: MetricsSnapshot;
  loading: boolean;
  chartData: { module: string; completion: number; label: string }[];
  smartInsight: string;
  refetch: () => void;
}

export function useDiaryMetrics(userId: string | undefined, timeRange: TimeRange): UseDiaryMetricsResult {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [manifestGoals, setManifestGoals] = useState<any[]>([]);
  const [manifestJournal, setManifestJournal] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [emotions, setEmotions] = useState<any[]>([]);
  const getDateRange = useMemo(() => {
    const now = new Date();
    switch (timeRange) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'week':
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: now };
      case 'month':
        return { start: startOfMonth(now), end: now };
    }
  }, [timeRange]);

  const fetchData = async () => {
    if (!userId) return;
    if (!navigator.onLine) { setLoading(false); return; }
    setLoading(true);

    try {
      const [tasksRes, journalRes, goalsRes, manifestJournalRes, notesRes, emotionsRes] = await Promise.all([
        supabase.from("tasks").select("*").eq("user_id", userId),
        supabase.from("journal_entries").select("*").eq("user_id", userId).order("entry_date", { ascending: false }),
        supabase.from("manifest_goals").select("*").eq("user_id", userId),
        supabase.from("manifest_journal").select("*").eq("user_id", userId),
        supabase.from("notes").select("*").eq("user_id", userId),
        supabase.from("emotions").select("*").eq("user_id", userId),
      ]);

      setTasks(tasksRes.data || []);
      setJournalEntries(journalRes.data || []);
      setManifestGoals(goalsRes.data || []);
      setManifestJournal(manifestJournalRes.data || []);
      setNotes(notesRes.data || []);
      setEmotions(emotionsRes.data || []);
    } catch (error) {
      console.error("Error fetching metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const metrics = useMemo((): MetricsSnapshot => {
    const { start, end } = getDateRange;
    const todayStr = format(new Date(), "yyyy-MM-dd");

    // Tasks metrics
    const tasksInRange = tasks.filter(t => {
      if (!t.due_date) return false;
      const dueDate = parseISO(t.due_date);
      return isWithinInterval(dueDate, { start, end });
    });
    const dueToday = tasks.filter(t => t.due_date && format(parseISO(t.due_date), "yyyy-MM-dd") === todayStr).length;
    const completedInRange = tasksInRange.filter(t => t.is_completed).length;

    // Journal metrics
    const journalInRange = journalEntries.filter(j => {
      const entryDate = parseISO(j.entry_date);
      return isWithinInterval(entryDate, { start, end });
    });
    
    // Calculate journal streak
    let streak = 0;
    let checkDate = new Date();
    while (true) {
      const dateStr = format(checkDate, "yyyy-MM-dd");
      const hasEntry = journalEntries.some(j => j.entry_date === dateStr);
      if (hasEntry) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else if (!isSameDay(checkDate, new Date())) {
        break;
      } else {
        checkDate = subDays(checkDate, 1);
      }
      if (streak > 365) break;
    }

    // Manifest metrics
    const manifestInRange = manifestJournal.filter(m => {
      const entryDate = parseISO(m.entry_date);
      return isWithinInterval(entryDate, { start, end });
    });
    const activeGoals = manifestGoals.filter(g => !g.is_completed).length;

    // Notes metrics
    const notesCreated = notes.filter(n => {
      const createdAt = parseISO(n.created_at);
      return isWithinInterval(createdAt, { start, end });
    }).length;
    const notesUpdated = notes.filter(n => {
      const updatedAt = parseISO(n.updated_at);
      return isWithinInterval(updatedAt, { start, end });
    }).length;

    // Emotions metrics
    const emotionsInRange = emotions.filter(e => {
      const createdAt = parseISO(e.created_at);
      return isWithinInterval(createdAt, { start, end });
    }).length;

    return {
      tasks: {
        dueToday,
        completed: completedInRange,
        planned: tasksInRange.length,
      },
      trackers: {
        completionPercent: 75,
        sessionsCompleted: 12,
      },
      journal: {
        entriesWritten: journalInRange.length,
        streak,
      },
      manifest: {
        checkInsDone: manifestInRange.length,
        goalsActive: activeGoals,
      },
      notes: {
        created: notesCreated,
        updated: notesUpdated,
      },
      emotions: {
        checkIns: emotionsInRange,
      },
    };
  }, [tasks, journalEntries, manifestGoals, manifestJournal, notes, emotions, getDateRange]);

  const chartData = useMemo(() => {
    const taskCompletion = metrics.tasks.planned > 0 
      ? Math.round((metrics.tasks.completed / metrics.tasks.planned) * 100) 
      : 100;
    
    return [
      { module: "Tasks", completion: taskCompletion, label: `${taskCompletion}%` },
      { module: "Trackers", completion: metrics.trackers.completionPercent, label: `${metrics.trackers.completionPercent}%` },
      { module: "Journal", completion: Math.min(100, metrics.journal.entriesWritten * 14), label: `${metrics.journal.entriesWritten} entries` },
      { module: "Manifest", completion: Math.min(100, metrics.manifest.checkInsDone * 20), label: `${metrics.manifest.checkInsDone} check-ins` },
    ];
  }, [metrics]);

  const smartInsight = useMemo(() => {
    const sorted = [...chartData].sort((a, b) => b.completion - a.completion);
    const strongest = sorted[0];
    const weakest = sorted[sorted.length - 1];
    
    if (strongest.completion === weakest.completion) {
      return "You're maintaining balanced progress across all modules. Keep it up!";
    }
    
    let advice = "";
    if (weakest.module === "Tasks") advice = "prioritize due-today items.";
    else if (weakest.module === "Trackers") advice = "check in on your tracked activities.";
    else if (weakest.module === "Journal") advice = "take a moment to write in your journal.";
    else if (weakest.module === "Focus") advice = "schedule a focus session.";
    else if (weakest.module === "Manifest") advice = "do a manifestation check-in.";
    
    return `You're strongest on ${strongest.module} (${strongest.completion}%). ${weakest.module} is lagging (${weakest.completion}%) — ${advice}`;
  }, [chartData]);

  return {
    metrics,
    loading,
    chartData,
    smartInsight,
    refetch: fetchData,
  };
}
