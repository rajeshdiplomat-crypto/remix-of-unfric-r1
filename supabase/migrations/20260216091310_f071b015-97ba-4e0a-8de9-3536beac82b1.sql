
-- Add default_task_tab for list/board/timeline selection
-- Remove diary_show_lines as it's no longer needed
ALTER TABLE public.user_settings 
  ADD COLUMN IF NOT EXISTS default_task_tab text DEFAULT 'board';
