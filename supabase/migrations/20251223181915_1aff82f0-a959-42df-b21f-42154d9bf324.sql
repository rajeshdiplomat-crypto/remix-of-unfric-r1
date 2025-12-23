-- Add tags column to journal_entries for tagging support
ALTER TABLE public.journal_entries 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[];