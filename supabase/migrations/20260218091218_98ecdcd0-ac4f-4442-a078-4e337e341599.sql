
CREATE TABLE public.user_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  module TEXT NOT NULL,
  message TEXT NOT NULL,
  user_email TEXT NOT NULL,
  gdpr_consent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own inquiries"
ON public.user_inquiries
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own inquiries"
ON public.user_inquiries
FOR SELECT
USING (auth.uid() = user_id);

CREATE INDEX idx_user_inquiries_module ON public.user_inquiries (module);
CREATE INDEX idx_user_inquiries_created_at ON public.user_inquiries (created_at DESC);
