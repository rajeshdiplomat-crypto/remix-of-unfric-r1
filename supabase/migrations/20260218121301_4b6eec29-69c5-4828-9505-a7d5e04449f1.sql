
-- ============================================================
-- 1. Add UI preference columns to user_settings
-- ============================================================
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS theme_id text DEFAULT 'calm-blue',
  ADD COLUMN IF NOT EXISTS font_pair_id text DEFAULT 'elegant',
  ADD COLUMN IF NOT EXISTS custom_theme_colors jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS motion_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS focus_settings jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS clock_widget_mode text DEFAULT 'digital',
  ADD COLUMN IF NOT EXISTS journal_template jsonb DEFAULT NULL;

-- ============================================================
-- 2. Add missing columns to manifest_goals (currently in localStorage extras)
-- ============================================================
ALTER TABLE public.manifest_goals
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'personal',
  ADD COLUMN IF NOT EXISTS vision_images jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS start_date date DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS live_from_end text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS act_as_if text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS conviction integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS visualization_minutes integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS daily_affirmation text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS check_in_time text DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS committed_7_days boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_count integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS reminder_times jsonb DEFAULT '["08:00"]'::jsonb;

-- ============================================================
-- 3. Create manifest_practices table for daily practice data
-- ============================================================
CREATE TABLE public.manifest_practices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id uuid NOT NULL REFERENCES public.manifest_goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  visualizations jsonb DEFAULT '[]'::jsonb,
  acts jsonb DEFAULT '[]'::jsonb,
  proofs jsonb DEFAULT '[]'::jsonb,
  gratitudes jsonb DEFAULT '[]'::jsonb,
  alignment integer DEFAULT NULL,
  growth_note text DEFAULT NULL,
  locked boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(goal_id, entry_date)
);

ALTER TABLE public.manifest_practices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own practices"
  ON public.manifest_practices
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_manifest_practices_updated_at
  BEFORE UPDATE ON public.manifest_practices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 4. Create note_groups table
-- ============================================================
CREATE TABLE public.note_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3B82F6',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.note_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own note groups"
  ON public.note_groups
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 5. Create note_folders table
-- ============================================================
CREATE TABLE public.note_folders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  group_id uuid NOT NULL REFERENCES public.note_groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.note_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own note folders"
  ON public.note_folders
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 6. Add group_id and folder_id to notes table for organization
-- ============================================================
ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.note_groups(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.note_folders(id) ON DELETE SET NULL;
