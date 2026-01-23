-- Add habit_days column to habits table to persist the number of habit days
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS habit_days integer DEFAULT 30;

-- Add start_date column to persist the start date
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS start_date date DEFAULT CURRENT_DATE;