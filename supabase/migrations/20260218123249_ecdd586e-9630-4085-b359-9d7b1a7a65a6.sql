
-- Add manifest visualization settings to user_settings
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS manifest_viz_settings jsonb DEFAULT '{"showActions": true, "showProofs": true, "showNotes": true, "showImages": true, "soundType": "ocean"}'::jsonb;
