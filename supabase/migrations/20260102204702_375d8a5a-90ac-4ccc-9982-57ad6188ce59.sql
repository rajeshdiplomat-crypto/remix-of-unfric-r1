-- Drop the old constraint
ALTER TABLE feed_events DROP CONSTRAINT IF EXISTS feed_events_source_module_check;

-- Add the new constraint with 'emotions' included
ALTER TABLE feed_events ADD CONSTRAINT feed_events_source_module_check 
CHECK (source_module = ANY (ARRAY['tasks', 'journal', 'notes', 'mindmap', 'trackers', 'manifest', 'focus', 'emotions']));