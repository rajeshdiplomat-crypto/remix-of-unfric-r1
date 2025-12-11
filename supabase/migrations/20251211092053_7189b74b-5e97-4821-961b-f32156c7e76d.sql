-- Add columns for journal settings and scribble data to journal_entries table
ALTER TABLE public.journal_entries 
ADD COLUMN IF NOT EXISTS scribble_data TEXT,
ADD COLUMN IF NOT EXISTS images_data JSONB DEFAULT '[]';

-- Create journal_settings table for persisting user preferences
CREATE TABLE IF NOT EXISTS public.journal_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  skin_id TEXT NOT NULL DEFAULT 'classic',
  page_size TEXT NOT NULL DEFAULT 'a5',
  zoom INTEGER NOT NULL DEFAULT 100,
  sections_config JSONB NOT NULL DEFAULT '{
    "feeling": {"header": "My Feelings", "prompts": ["How are you feeling today? What emotions came up?"], "headerStyle": {"fontSize": 11, "bold": true, "italic": false, "underline": false, "color": "default"}, "promptStyle": {"fontSize": 10, "bold": false, "italic": true, "underline": false, "color": "default"}},
    "gratitude": {"header": "Gratitude", "prompts": ["What are you grateful for today? List 3 things."], "headerStyle": {"fontSize": 11, "bold": true, "italic": false, "underline": false, "color": "default"}, "promptStyle": {"fontSize": 10, "bold": false, "italic": true, "underline": false, "color": "default"}},
    "kindness": {"header": "Kindness", "prompts": ["What act of kindness did you do or receive today?"], "headerStyle": {"fontSize": 11, "bold": true, "italic": false, "underline": false, "color": "default"}, "promptStyle": {"fontSize": 10, "bold": false, "italic": true, "underline": false, "color": "default"}}
  }',
  text_formatting JSONB NOT NULL DEFAULT '{"fontSize": 11, "fontFamily": "serif", "bold": false, "italic": false, "underline": false, "color": "hsl(222, 47%, 11%)", "alignment": "left"}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.journal_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can CRUD own journal settings"
ON public.journal_settings
FOR ALL
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_journal_settings_updated_at
BEFORE UPDATE ON public.journal_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();