-- ============================================================================
-- MIGRATION: Security Hardening & Performance Optimization
-- Date: 2026-03-02
-- ============================================================================

-- ============================================================================
-- 1. REVOKE OVERLY PERMISSIVE ANON GRANTS
-- Currently anon has ALL on every table, function, and sequence.
-- This is dangerous: if the anon key leaks, attackers can bypass RLS.
-- ============================================================================

-- Revoke everything from anon on existing objects
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- Re-grant proper permissions to authenticated and service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Fix default privileges for FUTURE tables/functions/sequences
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON FUNCTIONS FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON FUNCTIONS TO service_role;

-- Keep schema usage for anon (needed for auth flow to work)
GRANT USAGE ON SCHEMA public TO anon;

-- ============================================================================
-- 2. MISSING FOREIGN KEY CONSTRAINTS
-- note_folders and note_groups lack user_id FK to auth.users
-- ============================================================================

-- note_folders: add FK if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'note_folders_user_id_fkey'
      AND table_name = 'note_folders'
  ) THEN
    ALTER TABLE public.note_folders
      ADD CONSTRAINT note_folders_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- note_groups: add FK if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'note_groups_user_id_fkey'
      AND table_name = 'note_groups'
  ) THEN
    ALTER TABLE public.note_groups
      ADD CONSTRAINT note_groups_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- feed_comments: add user_id FK if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'feed_comments_user_id_fkey'
      AND table_name = 'feed_comments'
  ) THEN
    ALTER TABLE public.feed_comments
      ADD CONSTRAINT feed_comments_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- feed_reactions: add user_id FK if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'feed_reactions_user_id_fkey'
      AND table_name = 'feed_reactions'
  ) THEN
    ALTER TABLE public.feed_reactions
      ADD CONSTRAINT feed_reactions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- feed_saves: add user_id FK if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'feed_saves_user_id_fkey'
      AND table_name = 'feed_saves'
  ) THEN
    ALTER TABLE public.feed_saves
      ADD CONSTRAINT feed_saves_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- feed_events: add user_id FK if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'feed_events_user_id_fkey'
      AND table_name = 'feed_events'
  ) THEN
    ALTER TABLE public.feed_events
      ADD CONSTRAINT feed_events_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- hero_media: add user_id FK if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'hero_media_user_id_fkey'
      AND table_name = 'hero_media'
  ) THEN
    ALTER TABLE public.hero_media
      ADD CONSTRAINT hero_media_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- focus_sessions: add user_id FK if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'focus_sessions_user_id_fkey'
      AND table_name = 'focus_sessions'
  ) THEN
    ALTER TABLE public.focus_sessions
      ADD CONSTRAINT focus_sessions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- user_inquiries: add user_id FK if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_inquiries_user_id_fkey'
      AND table_name = 'user_inquiries'
  ) THEN
    ALTER TABLE public.user_inquiries
      ADD CONSTRAINT user_inquiries_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- manifest_practices: add user_id FK if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'manifest_practices_user_id_fkey'
      AND table_name = 'manifest_practices'
  ) THEN
    ALTER TABLE public.manifest_practices
      ADD CONSTRAINT manifest_practices_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- manifest_journal: add user_id FK if not exists (already exists but ensure)
-- (already has manifest_journal_user_id_fkey, skipping)

-- ============================================================================
-- 3. PERFORMANCE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_emotions_user_date
  ON public.emotions USING btree (user_id, entry_date DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_user_completed
  ON public.tasks USING btree (user_id, is_completed);

CREATE INDEX IF NOT EXISTS idx_tasks_user_due_date
  ON public.tasks USING btree (user_id, due_date);

CREATE INDEX IF NOT EXISTS idx_tasks_user_created
  ON public.tasks USING btree (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_habits_user
  ON public.habits USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_habit_completions_user_date
  ON public.habit_completions USING btree (user_id, completed_date);

CREATE INDEX IF NOT EXISTS idx_habit_completions_habit
  ON public.habit_completions USING btree (habit_id);

CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date
  ON public.journal_entries USING btree (user_id, entry_date DESC);

CREATE INDEX IF NOT EXISTS idx_notes_user_updated
  ON public.notes USING btree (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_notes_user_group
  ON public.notes USING btree (user_id, group_id);

CREATE INDEX IF NOT EXISTS idx_notes_user_folder
  ON public.notes USING btree (user_id, folder_id);

CREATE INDEX IF NOT EXISTS idx_manifest_goals_user
  ON public.manifest_goals USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_manifest_practices_user_goal_date
  ON public.manifest_practices USING btree (user_id, goal_id, entry_date);

CREATE INDEX IF NOT EXISTS idx_manifest_practices_goal
  ON public.manifest_practices USING btree (goal_id);

CREATE INDEX IF NOT EXISTS idx_manifest_journal_goal
  ON public.manifest_journal USING btree (goal_id);

CREATE INDEX IF NOT EXISTS idx_manifest_journal_user
  ON public.manifest_journal USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_note_folders_user_group
  ON public.note_folders USING btree (user_id, group_id);

CREATE INDEX IF NOT EXISTS idx_note_groups_user
  ON public.note_groups USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_hero_media_user
  ON public.hero_media USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_focus_sessions_task
  ON public.focus_sessions USING btree (task_id);

CREATE INDEX IF NOT EXISTS idx_consent_logs_user
  ON public.consent_logs USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_user
  ON public.profiles USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_journal_prompts_user
  ON public.journal_prompts USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_journal_settings_user
  ON public.journal_settings USING btree (user_id);

-- ============================================================================
-- 4. MISSING RLS POLICIES
-- ============================================================================

-- consent_logs: allow authenticated users to INSERT their own logs
CREATE POLICY "Users can insert own consent logs"
  ON public.consent_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 5. MISSING updated_at TRIGGERS
-- ============================================================================

CREATE OR REPLACE TRIGGER update_note_folders_updated_at
  BEFORE UPDATE ON public.note_folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_note_groups_updated_at
  BEFORE UPDATE ON public.note_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 6. MISSING STORAGE POLICIES
-- ============================================================================

-- Avatars: INSERT (upload)
CREATE POLICY "Users can upload own avatars" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Avatars: UPDATE
CREATE POLICY "Users can update own avatars" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Avatars: DELETE
CREATE POLICY "Users can delete own avatars" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Journal-images: UPDATE (missing — INSERT, DELETE, SELECT already exist)
CREATE POLICY "Users can update own journal images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'journal-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- ============================================================================
-- 7. ATTACH on_auth_user_created TRIGGER (if not already present)
-- ============================================================================

-- The handle_new_user() function exists but may not have a trigger attached
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 8. ADD file_size_limit TO STORAGE BUCKETS
-- ============================================================================

UPDATE storage.buckets SET file_size_limit = 5242880 WHERE id = 'avatars';        -- 5MB
UPDATE storage.buckets SET file_size_limit = 10485760 WHERE id = 'journal-images'; -- 10MB
UPDATE storage.buckets SET file_size_limit = 10485760 WHERE id = 'entry-covers';   -- 10MB

-- Set allowed MIME types
UPDATE storage.buckets
  SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  WHERE id IN ('avatars', 'journal-images', 'entry-covers');
