export interface ClarityScores {
  checkins: number;      // 0-1
  recovery: number;      // 0-1
  alignment: number;     // 0-1
  reflection: number;    // 0-1
  consistency: number;   // 0-1
}

export interface ClarityProgress extends ClarityScores {
  fogValue: number;      // 0-1 (computed)
  fogBucket: FogBucket;
  loading: boolean;
}

export type FogBucket = 'heavy' | 'patchy' | 'haze' | 'clear';

export interface LifeProof {
  id: string;
  module: LifeProofModule;
  short_text: string;
  created_at: string;
  source_id?: string;
}

export type LifeProofModule = 'checkin' | 'focus' | 'task' | 'reflection' | 'recovery' | 'tracker';

// Weight configuration for clarity score calculation
export const CLARITY_WEIGHTS = {
  checkins: 0.30,
  recovery: 0.25,
  alignment: 0.20,
  reflection: 0.15,
  consistency: 0.10,
} as const;

// Smoothing factor for fog transitions (lower = smoother)
export const FOG_SMOOTHING_ALPHA = 0.25;
