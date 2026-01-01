-- Create journal_answers table to store each answer as a separate entity
CREATE TABLE public.journal_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  answer_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for faster lookups
CREATE INDEX idx_journal_answers_entry_id ON public.journal_answers(journal_entry_id);
CREATE INDEX idx_journal_answers_question_id ON public.journal_answers(question_id);

-- Enable RLS
ALTER TABLE public.journal_answers ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - users can only access answers for their own journal entries
CREATE POLICY "Users can CRUD own journal answers"
ON public.journal_answers
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.journal_entries
    WHERE journal_entries.id = journal_answers.journal_entry_id
    AND journal_entries.user_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_journal_answers_updated_at
BEFORE UPDATE ON public.journal_answers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();