import type { FogBucket, LifeProofModule } from "@/components/clarity/types";

// Fog bucket messages (displayed subtly below window)
export const FOG_MESSAGES: Record<FogBucket, string> = {
  heavy: "Life got noisy. Come back when you're ready.",
  patchy: "You wiped a patch — you named a feeling.",
  haze: "You stayed with it. The fog softened.",
  clear: "You saw more clearly today. One honest choice."
};

// Module icons for life proofs
export const MODULE_ICONS: Record<LifeProofModule, string> = {
  checkin: '💭',
  focus: '🎯',
  task: '✓',
  reflection: '📝',
  recovery: '🌱',
  tracker: '📊'
};

// Module labels
export const MODULE_LABELS: Record<LifeProofModule, string> = {
  checkin: 'Check-in',
  focus: 'Focus',
  task: 'Task',
  reflection: 'Reflection',
  recovery: 'Recovery',
  tracker: 'Tracker'
};

// ARIA labels for accessibility
export const getFogAriaLabel = (fogBucket: FogBucket, proofCount: number): string => {
  const fogDescriptions: Record<FogBucket, string> = {
    heavy: 'heavily fogged',
    patchy: 'partially fogged with patches',
    haze: 'mostly clear with thin haze',
    clear: 'clear'
  };
  
  return `Clarity window: ${fogDescriptions[fogBucket]}. ${proofCount} recent life-proofs available. Press Enter to view.`;
};

// Empty state messages
export const EMPTY_STATE = {
  noProofs: "Take a moment. Your first proof awaits.",
  loading: "Loading your journey..."
};
