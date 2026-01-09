import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  CLARITY_WEIGHTS, 
  FOG_SMOOTHING_ALPHA, 
  type ClarityProgress, 
  type ClarityScores,
  type FogBucket,
  type LifeProof
} from "@/components/clarity/types";
import { subDays, startOfDay, format } from "date-fns";

const STORAGE_KEY = "unfric-prev-fog";

// Calculate fog bucket from fog value
function getFogBucket(fogValue: number): FogBucket {
  if (fogValue > 0.75) return 'heavy';
  if (fogValue > 0.5) return 'patchy';
  if (fogValue > 0.25) return 'haze';
  return 'clear';
}

// Calculate clarity score S from subscores
function calculateClarityScore(scores: ClarityScores): number {
  return (
    CLARITY_WEIGHTS.checkins * scores.checkins +
    CLARITY_WEIGHTS.recovery * scores.recovery +
    CLARITY_WEIGHTS.alignment * scores.alignment +
    CLARITY_WEIGHTS.reflection * scores.reflection +
    CLARITY_WEIGHTS.consistency * scores.consistency
  );
}

// Clamp value between 0 and 1
function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function useClarityProgress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Get previous fog from localStorage for smoothing
  const getPrevFog = useCallback((): number => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? parseFloat(stored) : 0.5;
    } catch {
      return 0.5;
    }
  }, []);

  // Fetch raw data from all modules
  const { data: rawScores, isLoading } = useQuery({
    queryKey: ['clarity-raw-scores', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const now = new Date();
      const sevenDaysAgo = subDays(now, 7);
      const thirtyDaysAgo = subDays(now, 30);
      
      // Parallel fetch all required data
      const [emotionsRes, tasksRes, journalRes] = await Promise.all([
        // Emotions for checkins (last 7 days)
        supabase
          .from('emotions')
          .select('id, entry_date, emotion, created_at')
          .eq('user_id', user.id)
          .gte('entry_date', format(sevenDaysAgo, 'yyyy-MM-dd')),
        
        // Tasks for alignment (last 30 days)
        supabase
          .from('tasks')
          .select('id, is_completed, time_of_day, completed_at')
          .eq('user_id', user.id)
          .eq('is_completed', true)
          .gte('completed_at', thirtyDaysAgo.toISOString()),
        
        // Journal answers for reflection depth
        supabase
          .from('journal_answers')
          .select('id, answer_text, created_at')
          .gte('created_at', thirtyDaysAgo.toISOString())
      ]);
      
      return {
        emotions: emotionsRes.data || [],
        tasks: tasksRes.data || [],
        journalAnswers: journalRes.data || []
      };
    },
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
  });

  // Calculate normalized scores from raw data
  const scores = useMemo((): ClarityScores => {
    if (!rawScores) {
      return { checkins: 0, recovery: 0, alignment: 0, reflection: 0, consistency: 0 };
    }
    
    // Checkins: frequency of check-ins in last 7 days (count / 7)
    const checkinsScore = clamp(rawScores.emotions.length / 7);
    
    // Recovery: For now, use a proxy based on emotion variety (more emotions = better awareness)
    // TODO: Implement actual recovery time calculation
    const uniqueEmotions = new Set(rawScores.emotions.map(e => e.emotion)).size;
    const recoveryScore = clamp(uniqueEmotions / 5);
    
    // Alignment: ratio of tasks completed (simplified - actual would check time_of_day preference)
    const alignmentScore = rawScores.tasks.length > 0 
      ? clamp(rawScores.tasks.length / 10) // Normalize to ~10 tasks/month
      : 0;
    
    // Reflection: average character length of journal answers / 500, capped at 1
    const avgLength = rawScores.journalAnswers.length > 0
      ? rawScores.journalAnswers.reduce((sum, a) => sum + (a.answer_text?.length || 0), 0) / rawScores.journalAnswers.length
      : 0;
    const reflectionScore = clamp(avgLength / 500);
    
    // Consistency: unique days with any activity in last 30 days / 30
    const activeDays = new Set([
      ...rawScores.emotions.map(e => e.entry_date),
      ...rawScores.tasks.filter(t => t.completed_at).map(t => format(new Date(t.completed_at!), 'yyyy-MM-dd')),
      ...rawScores.journalAnswers.map(a => format(new Date(a.created_at), 'yyyy-MM-dd'))
    ]).size;
    const consistencyScore = clamp(activeDays / 30);
    
    return {
      checkins: checkinsScore,
      recovery: recoveryScore,
      alignment: alignmentScore,
      reflection: reflectionScore,
      consistency: consistencyScore
    };
  }, [rawScores]);

  // Compute fog value with smoothing
  const fogValue = useMemo(() => {
    const S = calculateClarityScore(scores);
    const F_raw = 1 - S;
    const prevFog = getPrevFog();
    const F_smoothed = FOG_SMOOTHING_ALPHA * F_raw + (1 - FOG_SMOOTHING_ALPHA) * prevFog;
    return clamp(F_smoothed);
  }, [scores, getPrevFog]);

  // Persist fog value for next session
  useEffect(() => {
    if (!isLoading && fogValue !== undefined) {
      try {
        localStorage.setItem(STORAGE_KEY, fogValue.toString());
      } catch {
        // Ignore storage errors
      }
    }
  }, [fogValue, isLoading]);

  // Save clarity state to database
  const saveClarityMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      
      await supabase
        .from('clarity_state')
        .upsert({
          user_id: user.id,
          fog_value: fogValue,
          checkins_score: scores.checkins,
          recovery_score: scores.recovery,
          alignment_score: scores.alignment,
          reflection_score: scores.reflection,
          consistency_score: scores.consistency,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
    }
  });

  // Save state when scores change
  useEffect(() => {
    if (!isLoading && user?.id) {
      saveClarityMutation.mutate();
    }
  }, [fogValue, user?.id, isLoading]);

  const progress: ClarityProgress = {
    ...scores,
    fogValue,
    fogBucket: getFogBucket(fogValue),
    loading: isLoading
  };

  return progress;
}

// Hook to fetch recent life proofs
export function useLifeProofs(limit = 3) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['life-proofs', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('life_proofs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return (data || []) as LifeProof[];
    },
    enabled: !!user?.id
  });
}

// Hook to create a life proof
export function useCreateLifeProof() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (proof: Omit<LifeProof, 'id' | 'created_at'>) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('life_proofs')
        .insert({
          user_id: user.id,
          module: proof.module,
          short_text: proof.short_text,
          source_id: proof.source_id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['life-proofs'] });
      queryClient.invalidateQueries({ queryKey: ['clarity-raw-scores'] });
    }
  });
}
