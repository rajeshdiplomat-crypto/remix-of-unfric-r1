SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";



COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";



CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";



CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";



CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";



CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."emotions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "emotion" "text" NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "notes" "text",
    "entry_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."emotions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feed_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "feed_event_id" "uuid" NOT NULL,
    "parent_comment_id" "uuid",
    "text" "text" NOT NULL,
    "is_edited" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."feed_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feed_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "source_module" "text" NOT NULL,
    "source_id" "text",
    "title" "text" NOT NULL,
    "summary" "text",
    "content_preview" "text",
    "media" "jsonb" DEFAULT '[]'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "feed_events_source_module_check" CHECK (("source_module" = ANY (ARRAY['tasks'::"text", 'journal'::"text", 'notes'::"text", 'mindmap'::"text", 'trackers'::"text", 'manifest'::"text", 'focus'::"text", 'emotions'::"text"]))),
    CONSTRAINT "feed_events_type_check" CHECK (("type" = ANY (ARRAY['create'::"text", 'update'::"text", 'publish'::"text", 'complete'::"text", 'checkin'::"text", 'focus_end'::"text", 'streak_milestone'::"text", 'journal_question'::"text"])))
);


ALTER TABLE "public"."feed_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feed_reactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "feed_event_id" "uuid" NOT NULL,
    "emoji" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."feed_reactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feed_saves" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "feed_event_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."feed_saves" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."focus_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "task_id" "uuid",
    "duration_minutes" integer DEFAULT 0 NOT NULL,
    "task_completed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."focus_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."habit_completions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "habit_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "completed_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."habit_completions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."habits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "frequency" "text" DEFAULT 'daily'::"text",
    "target_days" integer[] DEFAULT '{1,2,3,4,5,6,7}'::integer[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "cover_image_url" "text",
    "habit_days" integer DEFAULT 30,
    "start_date" "date" DEFAULT CURRENT_DATE,
    CONSTRAINT "habits_frequency_check" CHECK (("frequency" = ANY (ARRAY['daily'::"text", 'weekly'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."habits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hero_media" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "page_key" "text" NOT NULL,
    "media_url" "text" NOT NULL,
    "media_type" "text" DEFAULT 'image'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."hero_media" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."journal_answers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "journal_entry_id" "uuid" NOT NULL,
    "question_id" "text" NOT NULL,
    "answer_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."journal_answers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."journal_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "entry_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "daily_feeling" "text",
    "daily_gratitude" "text",
    "daily_kindness" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "scribble_data" "text",
    "images_data" "jsonb" DEFAULT '[]'::"jsonb",
    "page_settings" "jsonb",
    "text_formatting" "jsonb",
    "tags" "text"[] DEFAULT '{}'::"text"[]
);


ALTER TABLE "public"."journal_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."journal_prompts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "segment" "text" NOT NULL,
    "prompt_text" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "journal_prompts_segment_check" CHECK (("segment" = ANY (ARRAY['feeling'::"text", 'gratitude'::"text", 'kindness'::"text"])))
);


ALTER TABLE "public"."journal_prompts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."journal_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "skin_id" "text" DEFAULT 'classic'::"text" NOT NULL,
    "page_size" "text" DEFAULT 'a5'::"text" NOT NULL,
    "zoom" integer DEFAULT 100 NOT NULL,
    "sections_config" "jsonb" DEFAULT '{"feeling": {"header": "My Feelings", "prompts": ["How are you feeling today? What emotions came up?"], "headerStyle": {"bold": true, "color": "default", "italic": false, "fontSize": 11, "underline": false}, "promptStyle": {"bold": false, "color": "default", "italic": true, "fontSize": 10, "underline": false}}, "kindness": {"header": "Kindness", "prompts": ["What act of kindness did you do or receive today?"], "headerStyle": {"bold": true, "color": "default", "italic": false, "fontSize": 11, "underline": false}, "promptStyle": {"bold": false, "color": "default", "italic": true, "fontSize": 10, "underline": false}}, "gratitude": {"header": "Gratitude", "prompts": ["What are you grateful for today? List 3 things."], "headerStyle": {"bold": true, "color": "default", "italic": false, "fontSize": 11, "underline": false}, "promptStyle": {"bold": false, "color": "default", "italic": true, "fontSize": 10, "underline": false}}}'::"jsonb" NOT NULL,
    "text_formatting" "jsonb" DEFAULT '{"bold": false, "color": "hsl(222, 47%, 11%)", "italic": false, "fontSize": 11, "alignment": "left", "underline": false, "fontFamily": "serif"}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."journal_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."manifest_goals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "feeling_when_achieved" "text",
    "affirmations" "text"[] DEFAULT '{}'::"text"[],
    "is_completed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "cover_image_url" "text",
    "category" "text" DEFAULT 'personal'::"text",
    "vision_images" "jsonb" DEFAULT '[]'::"jsonb",
    "start_date" "date",
    "live_from_end" "text",
    "act_as_if" "text",
    "conviction" integer DEFAULT 5,
    "visualization_minutes" integer DEFAULT 3,
    "daily_affirmation" "text",
    "check_in_time" "text" DEFAULT '08:00'::"text",
    "committed_7_days" boolean DEFAULT false,
    "is_locked" boolean DEFAULT false,
    "reminder_count" integer DEFAULT 1,
    "reminder_times" "jsonb" DEFAULT '["08:00"]'::"jsonb"
);


ALTER TABLE "public"."manifest_goals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."manifest_journal" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "goal_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "visualization" "text",
    "gratitude" "text",
    "entry_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."manifest_journal" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."manifest_practices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "goal_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "entry_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "visualizations" "jsonb" DEFAULT '[]'::"jsonb",
    "acts" "jsonb" DEFAULT '[]'::"jsonb",
    "proofs" "jsonb" DEFAULT '[]'::"jsonb",
    "gratitudes" "jsonb" DEFAULT '[]'::"jsonb",
    "alignment" integer,
    "growth_note" "text",
    "locked" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."manifest_practices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."note_folders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "group_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."note_folders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."note_groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "color" "text" DEFAULT '#3B82F6'::"text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."note_groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" DEFAULT 'Untitled'::"text" NOT NULL,
    "content" "text",
    "category" "text" DEFAULT 'thoughts'::"text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "skin" "text" DEFAULT 'default'::"text",
    "has_checklist" boolean DEFAULT false,
    "scribble_data" "text",
    "voice_transcript" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "cover_image_url" "text",
    "group_id" "uuid",
    "folder_id" "uuid",
    "is_pinned" boolean DEFAULT false,
    "is_archived" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "plain_text" "text",
    CONSTRAINT "notes_category_check" CHECK (("category" = ANY (ARRAY['thoughts'::"text", 'creative'::"text", 'private'::"text"])))
);


ALTER TABLE "public"."notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "username" "text",
    "bio" "text",
    "focus_areas" "text"[] DEFAULT '{}'::"text"[]
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "due_date" timestamp with time zone,
    "priority" "text" DEFAULT 'medium'::"text",
    "is_completed" boolean DEFAULT false,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "due_time" "text",
    "urgency" "text" DEFAULT 'low'::"text",
    "importance" "text" DEFAULT 'low'::"text",
    "time_of_day" "text" DEFAULT 'morning'::"text",
    "started_at" timestamp with time zone,
    "reminder_at" timestamp with time zone,
    "alarm_enabled" boolean DEFAULT false,
    "subtasks" "jsonb" DEFAULT '[]'::"jsonb",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "total_focus_minutes" integer DEFAULT 0,
    "end_time" "text",
    CONSTRAINT "tasks_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"])))
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_inquiries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "module" "text" NOT NULL,
    "message" "text" NOT NULL,
    "user_email" "text" NOT NULL,
    "gdpr_consent" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_inquiries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "note_skin_preference" "text" DEFAULT 'default'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "timezone" "text" DEFAULT 'UTC'::"text",
    "start_of_week" "text" DEFAULT 'monday'::"text",
    "daily_reset_time" "text" DEFAULT '00:00'::"text",
    "date_format" "text" DEFAULT 'MM/DD/YYYY'::"text",
    "default_home_screen" "text" DEFAULT 'diary'::"text",
    "notification_diary_prompt" boolean DEFAULT true,
    "notification_task_reminder" boolean DEFAULT true,
    "notification_emotion_checkin" boolean DEFAULT true,
    "privacy_passcode_enabled" boolean DEFAULT false,
    "privacy_blur_sensitive" boolean DEFAULT false,
    "default_task_view" "text" DEFAULT 'status'::"text",
    "default_notes_view" "text" DEFAULT 'list'::"text",
    "default_emotions_tab" "text" DEFAULT 'feel'::"text",
    "journal_mode" "text" DEFAULT 'structured'::"text",
    "diary_show_lines" boolean DEFAULT true,
    "default_task_tab" "text" DEFAULT 'board'::"text",
    "time_format" "text" DEFAULT '24h'::"text",
    "reminder_time_diary" "text" DEFAULT '08:00'::"text",
    "reminder_time_habits" "text" DEFAULT '08:00'::"text",
    "reminder_time_emotions" "text" DEFAULT '08:00'::"text",
    "theme_id" "text" DEFAULT 'calm-blue'::"text",
    "font_pair_id" "text" DEFAULT 'elegant'::"text",
    "custom_theme_colors" "jsonb",
    "motion_enabled" boolean DEFAULT false,
    "focus_settings" "jsonb",
    "clock_widget_mode" "text" DEFAULT 'digital'::"text",
    "journal_template" "jsonb",
    "manifest_viz_settings" "jsonb" DEFAULT '{"showNotes": true, "soundType": "ocean", "showImages": true, "showProofs": true, "showActions": true}'::"jsonb"
);


ALTER TABLE "public"."user_settings" OWNER TO "postgres";


ALTER TABLE ONLY "public"."emotions"
    ADD CONSTRAINT "emotions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feed_comments"
    ADD CONSTRAINT "feed_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feed_events"
    ADD CONSTRAINT "feed_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feed_reactions"
    ADD CONSTRAINT "feed_reactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feed_reactions"
    ADD CONSTRAINT "feed_reactions_user_id_feed_event_id_key" UNIQUE ("user_id", "feed_event_id");



ALTER TABLE ONLY "public"."feed_saves"
    ADD CONSTRAINT "feed_saves_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feed_saves"
    ADD CONSTRAINT "feed_saves_user_id_feed_event_id_key" UNIQUE ("user_id", "feed_event_id");



ALTER TABLE ONLY "public"."focus_sessions"
    ADD CONSTRAINT "focus_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."habit_completions"
    ADD CONSTRAINT "habit_completions_habit_id_completed_date_key" UNIQUE ("habit_id", "completed_date");



ALTER TABLE ONLY "public"."habit_completions"
    ADD CONSTRAINT "habit_completions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."habits"
    ADD CONSTRAINT "habits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hero_media"
    ADD CONSTRAINT "hero_media_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hero_media"
    ADD CONSTRAINT "hero_media_user_id_page_key_key" UNIQUE ("user_id", "page_key");



ALTER TABLE ONLY "public"."journal_answers"
    ADD CONSTRAINT "journal_answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."journal_entries"
    ADD CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."journal_prompts"
    ADD CONSTRAINT "journal_prompts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."journal_settings"
    ADD CONSTRAINT "journal_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."journal_settings"
    ADD CONSTRAINT "journal_settings_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."manifest_goals"
    ADD CONSTRAINT "manifest_goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."manifest_journal"
    ADD CONSTRAINT "manifest_journal_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."manifest_practices"
    ADD CONSTRAINT "manifest_practices_goal_id_entry_date_key" UNIQUE ("goal_id", "entry_date");



ALTER TABLE ONLY "public"."manifest_practices"
    ADD CONSTRAINT "manifest_practices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."note_folders"
    ADD CONSTRAINT "note_folders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."note_groups"
    ADD CONSTRAINT "note_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_inquiries"
    ADD CONSTRAINT "user_inquiries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_key" UNIQUE ("user_id");



CREATE INDEX "idx_feed_comments_event" ON "public"."feed_comments" USING "btree" ("feed_event_id");



CREATE INDEX "idx_feed_events_source" ON "public"."feed_events" USING "btree" ("user_id", "source_module");



CREATE INDEX "idx_feed_events_user_created" ON "public"."feed_events" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_feed_reactions_event" ON "public"."feed_reactions" USING "btree" ("feed_event_id");



CREATE INDEX "idx_feed_saves_user" ON "public"."feed_saves" USING "btree" ("user_id");



CREATE INDEX "idx_focus_sessions_user_created" ON "public"."focus_sessions" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_journal_answers_entry_id" ON "public"."journal_answers" USING "btree" ("journal_entry_id");



CREATE INDEX "idx_journal_answers_question_id" ON "public"."journal_answers" USING "btree" ("question_id");



CREATE INDEX "idx_user_inquiries_created_at" ON "public"."user_inquiries" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_user_inquiries_module" ON "public"."user_inquiries" USING "btree" ("module");



CREATE UNIQUE INDEX "profiles_username_unique" ON "public"."profiles" USING "btree" ("lower"("username")) WHERE ("username" IS NOT NULL);



CREATE OR REPLACE TRIGGER "update_feed_comments_updated_at" BEFORE UPDATE ON "public"."feed_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_hero_media_updated_at" BEFORE UPDATE ON "public"."hero_media" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_journal_answers_updated_at" BEFORE UPDATE ON "public"."journal_answers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_journal_entries_updated_at" BEFORE UPDATE ON "public"."journal_entries" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_journal_settings_updated_at" BEFORE UPDATE ON "public"."journal_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_manifest_goals_updated_at" BEFORE UPDATE ON "public"."manifest_goals" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_manifest_practices_updated_at" BEFORE UPDATE ON "public"."manifest_practices" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_notes_updated_at" BEFORE UPDATE ON "public"."notes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_settings_updated_at" BEFORE UPDATE ON "public"."user_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."emotions"
    ADD CONSTRAINT "emotions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feed_comments"
    ADD CONSTRAINT "feed_comments_feed_event_id_fkey" FOREIGN KEY ("feed_event_id") REFERENCES "public"."feed_events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feed_comments"
    ADD CONSTRAINT "feed_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."feed_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feed_reactions"
    ADD CONSTRAINT "feed_reactions_feed_event_id_fkey" FOREIGN KEY ("feed_event_id") REFERENCES "public"."feed_events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feed_saves"
    ADD CONSTRAINT "feed_saves_feed_event_id_fkey" FOREIGN KEY ("feed_event_id") REFERENCES "public"."feed_events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."focus_sessions"
    ADD CONSTRAINT "focus_sessions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."habit_completions"
    ADD CONSTRAINT "habit_completions_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."habit_completions"
    ADD CONSTRAINT "habit_completions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."habits"
    ADD CONSTRAINT "habits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."journal_answers"
    ADD CONSTRAINT "journal_answers_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."journal_entries"
    ADD CONSTRAINT "journal_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."journal_prompts"
    ADD CONSTRAINT "journal_prompts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."manifest_goals"
    ADD CONSTRAINT "manifest_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."manifest_journal"
    ADD CONSTRAINT "manifest_journal_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "public"."manifest_goals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."manifest_journal"
    ADD CONSTRAINT "manifest_journal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."manifest_practices"
    ADD CONSTRAINT "manifest_practices_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "public"."manifest_goals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."note_folders"
    ADD CONSTRAINT "note_folders_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."note_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "public"."note_folders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."note_groups"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Users can CRUD own comments" ON "public"."feed_comments" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can CRUD own completions" ON "public"."habit_completions" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can CRUD own emotions" ON "public"."emotions" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can CRUD own feed events" ON "public"."feed_events" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can CRUD own focus sessions" ON "public"."focus_sessions" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can CRUD own goals" ON "public"."manifest_goals" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can CRUD own habits" ON "public"."habits" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can CRUD own hero media" ON "public"."hero_media" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can CRUD own journal answers" ON "public"."journal_answers" USING ((EXISTS ( SELECT 1
   FROM "public"."journal_entries"
  WHERE (("journal_entries"."id" = "journal_answers"."journal_entry_id") AND ("journal_entries"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can CRUD own journal entries" ON "public"."journal_entries" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can CRUD own journal settings" ON "public"."journal_settings" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can CRUD own manifest journal" ON "public"."manifest_journal" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can CRUD own note folders" ON "public"."note_folders" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can CRUD own note groups" ON "public"."note_groups" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can CRUD own notes" ON "public"."notes" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can CRUD own practices" ON "public"."manifest_practices" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can CRUD own prompts" ON "public"."journal_prompts" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can CRUD own reactions" ON "public"."feed_reactions" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can CRUD own saves" ON "public"."feed_saves" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can CRUD own settings" ON "public"."user_settings" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can CRUD own tasks" ON "public"."tasks" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own inquiries" ON "public"."user_inquiries" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view comments on accessible events" ON "public"."feed_comments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."feed_events"
  WHERE (("feed_events"."id" = "feed_comments"."feed_event_id") AND ("feed_events"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own inquiries" ON "public"."user_inquiries" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."emotions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feed_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feed_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feed_reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feed_saves" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."focus_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."habit_completions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."habits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hero_media" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."journal_answers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."journal_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."journal_prompts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."journal_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."manifest_goals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."manifest_journal" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."manifest_practices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."note_folders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."note_groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_inquiries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_settings" ENABLE ROW LEVEL SECURITY;


ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."emotions" TO "anon";
GRANT ALL ON TABLE "public"."emotions" TO "authenticated";
GRANT ALL ON TABLE "public"."emotions" TO "service_role";



GRANT ALL ON TABLE "public"."feed_comments" TO "anon";
GRANT ALL ON TABLE "public"."feed_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."feed_comments" TO "service_role";



GRANT ALL ON TABLE "public"."feed_events" TO "anon";
GRANT ALL ON TABLE "public"."feed_events" TO "authenticated";
GRANT ALL ON TABLE "public"."feed_events" TO "service_role";



GRANT ALL ON TABLE "public"."feed_reactions" TO "anon";
GRANT ALL ON TABLE "public"."feed_reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."feed_reactions" TO "service_role";



GRANT ALL ON TABLE "public"."feed_saves" TO "anon";
GRANT ALL ON TABLE "public"."feed_saves" TO "authenticated";
GRANT ALL ON TABLE "public"."feed_saves" TO "service_role";



GRANT ALL ON TABLE "public"."focus_sessions" TO "anon";
GRANT ALL ON TABLE "public"."focus_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."focus_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."habit_completions" TO "anon";
GRANT ALL ON TABLE "public"."habit_completions" TO "authenticated";
GRANT ALL ON TABLE "public"."habit_completions" TO "service_role";



GRANT ALL ON TABLE "public"."habits" TO "anon";
GRANT ALL ON TABLE "public"."habits" TO "authenticated";
GRANT ALL ON TABLE "public"."habits" TO "service_role";



GRANT ALL ON TABLE "public"."hero_media" TO "anon";
GRANT ALL ON TABLE "public"."hero_media" TO "authenticated";
GRANT ALL ON TABLE "public"."hero_media" TO "service_role";



GRANT ALL ON TABLE "public"."journal_answers" TO "anon";
GRANT ALL ON TABLE "public"."journal_answers" TO "authenticated";
GRANT ALL ON TABLE "public"."journal_answers" TO "service_role";



GRANT ALL ON TABLE "public"."journal_entries" TO "anon";
GRANT ALL ON TABLE "public"."journal_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."journal_entries" TO "service_role";



GRANT ALL ON TABLE "public"."journal_prompts" TO "anon";
GRANT ALL ON TABLE "public"."journal_prompts" TO "authenticated";
GRANT ALL ON TABLE "public"."journal_prompts" TO "service_role";



GRANT ALL ON TABLE "public"."journal_settings" TO "anon";
GRANT ALL ON TABLE "public"."journal_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."journal_settings" TO "service_role";



GRANT ALL ON TABLE "public"."manifest_goals" TO "anon";
GRANT ALL ON TABLE "public"."manifest_goals" TO "authenticated";
GRANT ALL ON TABLE "public"."manifest_goals" TO "service_role";



GRANT ALL ON TABLE "public"."manifest_journal" TO "anon";
GRANT ALL ON TABLE "public"."manifest_journal" TO "authenticated";
GRANT ALL ON TABLE "public"."manifest_journal" TO "service_role";



GRANT ALL ON TABLE "public"."manifest_practices" TO "anon";
GRANT ALL ON TABLE "public"."manifest_practices" TO "authenticated";
GRANT ALL ON TABLE "public"."manifest_practices" TO "service_role";



GRANT ALL ON TABLE "public"."note_folders" TO "anon";
GRANT ALL ON TABLE "public"."note_folders" TO "authenticated";
GRANT ALL ON TABLE "public"."note_folders" TO "service_role";



GRANT ALL ON TABLE "public"."note_groups" TO "anon";
GRANT ALL ON TABLE "public"."note_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."note_groups" TO "service_role";



GRANT ALL ON TABLE "public"."notes" TO "anon";
GRANT ALL ON TABLE "public"."notes" TO "authenticated";
GRANT ALL ON TABLE "public"."notes" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



GRANT ALL ON TABLE "public"."user_inquiries" TO "anon";
GRANT ALL ON TABLE "public"."user_inquiries" TO "authenticated";
GRANT ALL ON TABLE "public"."user_inquiries" TO "service_role";



GRANT ALL ON TABLE "public"."user_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_settings" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";


--
-- Dumped schema changes for auth and storage
--

CREATE POLICY "Anyone can view entry covers" ON "storage"."objects" FOR SELECT USING (("bucket_id" = 'entry-covers'::"text"));

CREATE POLICY "Authenticated users can upload entry covers" ON "storage"."objects" FOR INSERT WITH CHECK ((("bucket_id" = 'entry-covers'::"text") AND ("auth"."role"() = 'authenticated'::"text")));

CREATE POLICY "Cover images are publicly accessible" ON "storage"."objects" FOR SELECT USING (("bucket_id" = 'entry-covers'::"text"));

CREATE POLICY "Public can view journal images" ON "storage"."objects" FOR SELECT USING (("bucket_id" = 'journal-images'::"text"));

CREATE POLICY "Users can delete own journal images" ON "storage"."objects" FOR DELETE TO "authenticated" USING ((("bucket_id" = 'journal-images'::"text") AND (("auth"."uid"())::"text" = ("storage"."foldername"("name"))[1])));

CREATE POLICY "Users can delete their own cover images" ON "storage"."objects" FOR DELETE USING ((("bucket_id" = 'entry-covers'::"text") AND (("auth"."uid"())::"text" = ("storage"."foldername"("name"))[1])));

CREATE POLICY "Users can delete their own entry covers" ON "storage"."objects" FOR DELETE USING ((("bucket_id" = 'entry-covers'::"text") AND (("auth"."uid"())::"text" = ("storage"."foldername"("name"))[1])));

CREATE POLICY "Users can update their own cover images" ON "storage"."objects" FOR UPDATE USING ((("bucket_id" = 'entry-covers'::"text") AND (("auth"."uid"())::"text" = ("storage"."foldername"("name"))[1])));

CREATE POLICY "Users can update their own entry covers" ON "storage"."objects" FOR UPDATE USING ((("bucket_id" = 'entry-covers'::"text") AND (("auth"."uid"())::"text" = ("storage"."foldername"("name"))[1])));

CREATE POLICY "Users can upload journal images" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK ((("bucket_id" = 'journal-images'::"text") AND (("auth"."uid"())::"text" = ("storage"."foldername"("name"))[1])));

CREATE POLICY "Users can upload their own cover images" ON "storage"."objects" FOR INSERT WITH CHECK ((("bucket_id" = 'entry-covers'::"text") AND (("auth"."uid"())::"text" = ("storage"."foldername"("name"))[1])));