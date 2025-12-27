-- Create feed_events table for unified timeline
CREATE TABLE public.feed_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('create', 'update', 'publish', 'complete', 'checkin', 'focus_end', 'streak_milestone')),
  source_module TEXT NOT NULL CHECK (source_module IN ('tasks', 'journal', 'notes', 'mindmap', 'trackers', 'manifest', 'focus')),
  source_id TEXT,
  title TEXT NOT NULL,
  summary TEXT,
  content_preview TEXT,
  media JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.feed_events ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own feed events
CREATE POLICY "Users can CRUD own feed events"
  ON public.feed_events
  FOR ALL
  USING (auth.uid() = user_id);

-- Create feed_reactions table for social reactions
CREATE TABLE public.feed_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  feed_event_id UUID NOT NULL REFERENCES public.feed_events(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, feed_event_id)
);

-- Enable Row Level Security
ALTER TABLE public.feed_reactions ENABLE ROW LEVEL SECURITY;

-- Create policy for reactions
CREATE POLICY "Users can CRUD own reactions"
  ON public.feed_reactions
  FOR ALL
  USING (auth.uid() = user_id);

-- Create feed_comments table for comments with threading
CREATE TABLE public.feed_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  feed_event_id UUID NOT NULL REFERENCES public.feed_events(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.feed_comments(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;

-- Create policy for comments
CREATE POLICY "Users can CRUD own comments"
  ON public.feed_comments
  FOR ALL
  USING (auth.uid() = user_id);

-- Create policy for viewing all comments on accessible feed events
CREATE POLICY "Users can view comments on accessible events"
  ON public.feed_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.feed_events 
      WHERE feed_events.id = feed_comments.feed_event_id 
      AND feed_events.user_id = auth.uid()
    )
  );

-- Create feed_saves table for saved/bookmarked posts
CREATE TABLE public.feed_saves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  feed_event_id UUID NOT NULL REFERENCES public.feed_events(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, feed_event_id)
);

-- Enable Row Level Security
ALTER TABLE public.feed_saves ENABLE ROW LEVEL SECURITY;

-- Create policy for saves
CREATE POLICY "Users can CRUD own saves"
  ON public.feed_saves
  FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_feed_events_user_created ON public.feed_events(user_id, created_at DESC);
CREATE INDEX idx_feed_events_source ON public.feed_events(user_id, source_module);
CREATE INDEX idx_feed_reactions_event ON public.feed_reactions(feed_event_id);
CREATE INDEX idx_feed_comments_event ON public.feed_comments(feed_event_id);
CREATE INDEX idx_feed_saves_user ON public.feed_saves(user_id);

-- Create trigger for updated_at on comments
CREATE TRIGGER update_feed_comments_updated_at
  BEFORE UPDATE ON public.feed_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();