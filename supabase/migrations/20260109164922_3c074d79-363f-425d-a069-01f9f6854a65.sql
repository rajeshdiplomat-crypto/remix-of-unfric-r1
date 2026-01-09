-- Create clarity_state table to store user's computed clarity state
CREATE TABLE public.clarity_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  fog_value DECIMAL(4,3) NOT NULL DEFAULT 0.5,
  checkins_score DECIMAL(4,3) DEFAULT 0,
  recovery_score DECIMAL(4,3) DEFAULT 0,
  alignment_score DECIMAL(4,3) DEFAULT 0,
  reflection_score DECIMAL(4,3) DEFAULT 0,
  consistency_score DECIMAL(4,3) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.clarity_state ENABLE ROW LEVEL SECURITY;

-- RLS policy for clarity_state
CREATE POLICY "Users can CRUD own clarity state"
  ON public.clarity_state FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create life_proofs table to store meaningful actions
CREATE TABLE public.life_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  module TEXT NOT NULL CHECK (module IN ('checkin', 'focus', 'task', 'reflection', 'recovery', 'tracker')),
  short_text TEXT NOT NULL,
  source_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.life_proofs ENABLE ROW LEVEL SECURITY;

-- RLS policy for life_proofs
CREATE POLICY "Users can CRUD own life proofs"
  ON public.life_proofs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast recent queries
CREATE INDEX idx_life_proofs_user_created 
  ON public.life_proofs(user_id, created_at DESC);

-- Trigger to update updated_at on clarity_state
CREATE TRIGGER update_clarity_state_updated_at
  BEFORE UPDATE ON public.clarity_state
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();