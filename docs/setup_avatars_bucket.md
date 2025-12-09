# How to Create the `avatars` Bucket in Supabase

## 🚨 Troubleshooting: "Image Uploads but Won't Load"
If you uploaded an image but it shows a broken link icon after reloading, your bucket is likely **Private**.

**Fix**: Run this SQL to force it to be Public:
```sql
UPDATE storage.buckets SET public = true WHERE id = 'avatars';
```

---

## Method 1: Using SQL Editor (Recommended)

1.  Go to your **Supabase Dashboard**.
2.  Click on the **SQL Editor** icon (View details) in the left sidebar.
3.  Click **"New Query"**.
4.  Copy and paste the following SQL code:

```sql
-- Create or Update 'avatars' bucket to be PUBLIC
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

UPDATE storage.buckets SET public = true WHERE id = 'avatars';

-- Allow public access to view images
DROP POLICY IF EXISTS "Public View Access" ON storage.objects;
CREATE POLICY "Public View Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Allow logged-in users to upload images
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' );

-- Allow logged-in users to update images
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'avatars' );
```

5.  Click **"Run"**.
6.  You should see "Success" in the results.

---

## Method 2: Using the Dashboard UI

1.  **Go to Storage**: Click the **Storage** icon (Folder icon) in the left sidebar.
2.  **Find Bucket**: Look for `avatars`.
3.  **Edit Bucket**: Click the three dots `...` next to `avatars` -> **Edit Bucket**.
4.  **Make Public**: Ensure **"Public bucket"** is toggled **ON** (Green). This is critical.
5.  **Policies**: Check the "Configuration" tab and ensure there is a policy allowing `SELECT` (Read) access for `All Users`.
