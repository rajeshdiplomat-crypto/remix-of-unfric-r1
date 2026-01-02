-- Enable realtime for tasks table
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;

-- Enable realtime for habits table
ALTER PUBLICATION supabase_realtime ADD TABLE public.habits;

-- Enable realtime for habit_completions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.habit_completions;