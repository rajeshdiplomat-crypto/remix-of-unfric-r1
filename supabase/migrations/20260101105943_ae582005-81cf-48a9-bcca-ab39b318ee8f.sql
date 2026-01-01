-- Drop the existing check constraint and add updated one with journal_question type
ALTER TABLE public.feed_events DROP CONSTRAINT feed_events_type_check;

ALTER TABLE public.feed_events ADD CONSTRAINT feed_events_type_check 
CHECK (type = ANY (ARRAY['create'::text, 'update'::text, 'publish'::text, 'complete'::text, 'checkin'::text, 'focus_end'::text, 'streak_milestone'::text, 'journal_question'::text]));