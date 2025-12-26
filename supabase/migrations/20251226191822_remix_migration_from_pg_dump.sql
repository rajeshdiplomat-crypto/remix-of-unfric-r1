CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: emotions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.emotions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    emotion text NOT NULL,
    tags text[] DEFAULT '{}'::text[],
    notes text,
    entry_date date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: habit_completions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.habit_completions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    habit_id uuid NOT NULL,
    user_id uuid NOT NULL,
    completed_date date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: habits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.habits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    frequency text DEFAULT 'daily'::text,
    target_days integer[] DEFAULT '{1,2,3,4,5,6,7}'::integer[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT habits_frequency_check CHECK ((frequency = ANY (ARRAY['daily'::text, 'weekly'::text, 'custom'::text])))
);


--
-- Name: journal_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.journal_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    entry_date date DEFAULT CURRENT_DATE NOT NULL,
    daily_feeling text,
    daily_gratitude text,
    daily_kindness text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    scribble_data text,
    images_data jsonb DEFAULT '[]'::jsonb,
    page_settings jsonb,
    text_formatting jsonb,
    tags text[] DEFAULT '{}'::text[]
);


--
-- Name: journal_prompts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.journal_prompts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    segment text NOT NULL,
    prompt_text text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT journal_prompts_segment_check CHECK ((segment = ANY (ARRAY['feeling'::text, 'gratitude'::text, 'kindness'::text])))
);


--
-- Name: journal_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.journal_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    skin_id text DEFAULT 'classic'::text NOT NULL,
    page_size text DEFAULT 'a5'::text NOT NULL,
    zoom integer DEFAULT 100 NOT NULL,
    sections_config jsonb DEFAULT '{"feeling": {"header": "My Feelings", "prompts": ["How are you feeling today? What emotions came up?"], "headerStyle": {"bold": true, "color": "default", "italic": false, "fontSize": 11, "underline": false}, "promptStyle": {"bold": false, "color": "default", "italic": true, "fontSize": 10, "underline": false}}, "kindness": {"header": "Kindness", "prompts": ["What act of kindness did you do or receive today?"], "headerStyle": {"bold": true, "color": "default", "italic": false, "fontSize": 11, "underline": false}, "promptStyle": {"bold": false, "color": "default", "italic": true, "fontSize": 10, "underline": false}}, "gratitude": {"header": "Gratitude", "prompts": ["What are you grateful for today? List 3 things."], "headerStyle": {"bold": true, "color": "default", "italic": false, "fontSize": 11, "underline": false}, "promptStyle": {"bold": false, "color": "default", "italic": true, "fontSize": 10, "underline": false}}}'::jsonb NOT NULL,
    text_formatting jsonb DEFAULT '{"bold": false, "color": "hsl(222, 47%, 11%)", "italic": false, "fontSize": 11, "alignment": "left", "underline": false, "fontFamily": "serif"}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: manifest_goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.manifest_goals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    feeling_when_achieved text,
    affirmations text[] DEFAULT '{}'::text[],
    is_completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: manifest_journal; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.manifest_journal (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    goal_id uuid NOT NULL,
    user_id uuid NOT NULL,
    visualization text,
    gratitude text,
    entry_date date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text DEFAULT 'Untitled'::text NOT NULL,
    content text,
    category text DEFAULT 'thoughts'::text,
    tags text[] DEFAULT '{}'::text[],
    skin text DEFAULT 'default'::text,
    has_checklist boolean DEFAULT false,
    scribble_data text,
    voice_transcript text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT notes_category_check CHECK ((category = ANY (ARRAY['thoughts'::text, 'creative'::text, 'private'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    due_date timestamp with time zone,
    priority text DEFAULT 'medium'::text,
    is_completed boolean DEFAULT false,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tasks_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])))
);


--
-- Name: user_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    note_skin_preference text DEFAULT 'default'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: emotions emotions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emotions
    ADD CONSTRAINT emotions_pkey PRIMARY KEY (id);


--
-- Name: habit_completions habit_completions_habit_id_completed_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habit_completions
    ADD CONSTRAINT habit_completions_habit_id_completed_date_key UNIQUE (habit_id, completed_date);


--
-- Name: habit_completions habit_completions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habit_completions
    ADD CONSTRAINT habit_completions_pkey PRIMARY KEY (id);


--
-- Name: habits habits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habits
    ADD CONSTRAINT habits_pkey PRIMARY KEY (id);


--
-- Name: journal_entries journal_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_pkey PRIMARY KEY (id);


--
-- Name: journal_prompts journal_prompts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_prompts
    ADD CONSTRAINT journal_prompts_pkey PRIMARY KEY (id);


--
-- Name: journal_settings journal_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_settings
    ADD CONSTRAINT journal_settings_pkey PRIMARY KEY (id);


--
-- Name: journal_settings journal_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_settings
    ADD CONSTRAINT journal_settings_user_id_key UNIQUE (user_id);


--
-- Name: manifest_goals manifest_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manifest_goals
    ADD CONSTRAINT manifest_goals_pkey PRIMARY KEY (id);


--
-- Name: manifest_journal manifest_journal_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manifest_journal
    ADD CONSTRAINT manifest_journal_pkey PRIMARY KEY (id);


--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: user_settings user_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_pkey PRIMARY KEY (id);


--
-- Name: user_settings user_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_user_id_key UNIQUE (user_id);


--
-- Name: journal_entries update_journal_entries_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON public.journal_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: journal_settings update_journal_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_journal_settings_updated_at BEFORE UPDATE ON public.journal_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: manifest_goals update_manifest_goals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_manifest_goals_updated_at BEFORE UPDATE ON public.manifest_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: notes update_notes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_settings update_user_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: emotions emotions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emotions
    ADD CONSTRAINT emotions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: habit_completions habit_completions_habit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habit_completions
    ADD CONSTRAINT habit_completions_habit_id_fkey FOREIGN KEY (habit_id) REFERENCES public.habits(id) ON DELETE CASCADE;


--
-- Name: habit_completions habit_completions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habit_completions
    ADD CONSTRAINT habit_completions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: habits habits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habits
    ADD CONSTRAINT habits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: journal_entries journal_entries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: journal_prompts journal_prompts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_prompts
    ADD CONSTRAINT journal_prompts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: manifest_goals manifest_goals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manifest_goals
    ADD CONSTRAINT manifest_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: manifest_journal manifest_journal_goal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manifest_journal
    ADD CONSTRAINT manifest_journal_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.manifest_goals(id) ON DELETE CASCADE;


--
-- Name: manifest_journal manifest_journal_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manifest_journal
    ADD CONSTRAINT manifest_journal_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: notes notes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_settings user_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: habit_completions Users can CRUD own completions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own completions" ON public.habit_completions USING ((auth.uid() = user_id));


--
-- Name: emotions Users can CRUD own emotions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own emotions" ON public.emotions USING ((auth.uid() = user_id));


--
-- Name: manifest_goals Users can CRUD own goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own goals" ON public.manifest_goals USING ((auth.uid() = user_id));


--
-- Name: habits Users can CRUD own habits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own habits" ON public.habits USING ((auth.uid() = user_id));


--
-- Name: journal_entries Users can CRUD own journal entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own journal entries" ON public.journal_entries USING ((auth.uid() = user_id));


--
-- Name: journal_settings Users can CRUD own journal settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own journal settings" ON public.journal_settings USING ((auth.uid() = user_id));


--
-- Name: manifest_journal Users can CRUD own manifest journal; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own manifest journal" ON public.manifest_journal USING ((auth.uid() = user_id));


--
-- Name: notes Users can CRUD own notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own notes" ON public.notes USING ((auth.uid() = user_id));


--
-- Name: journal_prompts Users can CRUD own prompts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own prompts" ON public.journal_prompts USING ((auth.uid() = user_id));


--
-- Name: user_settings Users can CRUD own settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own settings" ON public.user_settings USING ((auth.uid() = user_id));


--
-- Name: tasks Users can CRUD own tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can CRUD own tasks" ON public.tasks USING ((auth.uid() = user_id));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: emotions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.emotions ENABLE ROW LEVEL SECURITY;

--
-- Name: habit_completions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;

--
-- Name: habits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

--
-- Name: journal_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: journal_prompts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.journal_prompts ENABLE ROW LEVEL SECURITY;

--
-- Name: journal_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.journal_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: manifest_goals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.manifest_goals ENABLE ROW LEVEL SECURITY;

--
-- Name: manifest_journal; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.manifest_journal ENABLE ROW LEVEL SECURITY;

--
-- Name: notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: user_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;