-- Add per-page settings columns to journal_entries
ALTER TABLE public.journal_entries 
ADD COLUMN IF NOT EXISTS page_settings jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS text_formatting jsonb DEFAULT NULL;