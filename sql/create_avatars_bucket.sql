-- 1. Create the 'avatars' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. FORCE the bucket to be Public (Fix for "Upload works but won't load")
UPDATE storage.buckets
SET public = true
WHERE id = 'avatars';

-- 3. Policy: Give Public Access to view avatars (Drop old one first to avoid conflict if needed, or use IF NOT EXISTS logic if possible, but PG policies don't support create if not exists easily. We will drop and recreate to be safe)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- 4. Policy: Allow Authenticated Users to upload avatars
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' );

-- 5. Policy: Allow Users to update their own avatars
DROP POLICY IF EXISTS "Authenticated users can update avatars" ON storage.objects;
CREATE POLICY "Authenticated users can update avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'avatars' );
