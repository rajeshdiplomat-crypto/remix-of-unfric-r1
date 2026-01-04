-- Add comprehensive user settings columns
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS start_of_week TEXT DEFAULT 'monday',
ADD COLUMN IF NOT EXISTS daily_reset_time TEXT DEFAULT '00:00',
ADD COLUMN IF NOT EXISTS date_format TEXT DEFAULT 'MM/DD/YYYY',
ADD COLUMN IF NOT EXISTS default_home_screen TEXT DEFAULT 'diary',
ADD COLUMN IF NOT EXISTS notification_diary_prompt BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_task_reminder BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_emotion_checkin BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS privacy_passcode_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS privacy_blur_sensitive BOOLEAN DEFAULT false;

-- Add profile fields for username and focus areas
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS focus_areas TEXT[] DEFAULT '{}';

-- Create unique index for username (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique ON public.profiles (LOWER(username)) WHERE username IS NOT NULL;