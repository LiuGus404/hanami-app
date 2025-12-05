
-- Ensure the bucket exists (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-images', 'ai-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload images
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ai-images');

-- Policy to allow authenticated users to select (view) images
-- Note: Since the bucket is public, this might be redundant for public access, 
-- but good for authenticated client access via SDK.
CREATE POLICY "Allow authenticated selects"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'ai-images');

-- Policy to allow users to update their own images (optional, but good practice)
CREATE POLICY "Allow users to update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'ai-images' AND owner = auth.uid());
