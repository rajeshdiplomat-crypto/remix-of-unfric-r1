
ALTER TABLE public.user_settings 
  ADD COLUMN IF NOT EXISTS default_task_view text DEFAULT 'status',
  ADD COLUMN IF NOT EXISTS default_notes_view text DEFAULT 'list',
  ADD COLUMN IF NOT EXISTS default_emotions_tab text DEFAULT 'feel',
  ADD COLUMN IF NOT EXISTS journal_mode text DEFAULT 'structured',
  ADD COLUMN IF NOT EXISTS diary_show_lines boolean DEFAULT true;
