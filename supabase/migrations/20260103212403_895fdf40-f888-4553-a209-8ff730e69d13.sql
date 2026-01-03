-- Add missing columns to tasks table for full quadrant functionality
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS due_time text,
ADD COLUMN IF NOT EXISTS urgency text DEFAULT 'low',
ADD COLUMN IF NOT EXISTS importance text DEFAULT 'low',
ADD COLUMN IF NOT EXISTS time_of_day text DEFAULT 'morning',
ADD COLUMN IF NOT EXISTS started_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS reminder_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS alarm_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS subtasks jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS total_focus_minutes integer DEFAULT 0;