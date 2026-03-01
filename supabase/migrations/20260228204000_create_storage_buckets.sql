-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('entry-covers', 'entry-covers', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('journal-images', 'journal-images', true)
ON CONFLICT (id) DO NOTHING;

-- Update existing policies if needed (though they should already be there from the main migration)
-- But ensuring the buckets are public
UPDATE storage.buckets SET public = true WHERE id IN ('entry-covers', 'journal-images');
