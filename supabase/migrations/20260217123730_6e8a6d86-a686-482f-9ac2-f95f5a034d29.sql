
-- Add per-module reminder times (default to existing daily_reset_time or 08:00)
ALTER TABLE public.user_settings
  ADD COLUMN reminder_time_diary text DEFAULT '08:00',
  ADD COLUMN reminder_time_habits text DEFAULT '08:00',
  ADD COLUMN reminder_time_emotions text DEFAULT '08:00';

-- Backfill from existing daily_reset_time
UPDATE public.user_settings
SET
  reminder_time_diary = COALESCE(daily_reset_time, '08:00'),
  reminder_time_habits = COALESCE(daily_reset_time, '08:00'),
  reminder_time_emotions = COALESCE(daily_reset_time, '08:00');
