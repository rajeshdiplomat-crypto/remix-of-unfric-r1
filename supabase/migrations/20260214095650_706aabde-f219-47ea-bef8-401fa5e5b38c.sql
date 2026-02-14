
CREATE TABLE public.hero_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  page_key TEXT NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, page_key)
);

ALTER TABLE public.hero_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own hero media"
ON public.hero_media
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_hero_media_updated_at
BEFORE UPDATE ON public.hero_media
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
