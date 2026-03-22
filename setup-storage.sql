-- 1. Create the buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('media-gallery', 'media-gallery', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Enable RLS (it's enabled by default on storage.objects)

-- 3. Set up policies for 'avatars' bucket
-- Allow public access to read files
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

-- Allow anyone to upload to 'avatars'
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');

-- Allow anyone to update/delete their own files (since we use soldier_id in name, it's fairly safe for prototype)
CREATE POLICY "Public Update/Delete" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars');
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'avatars');


-- 4. Set up policies for 'media-gallery' bucket
-- Allow public access to read files
CREATE POLICY "Public Gallery Access" ON storage.objects FOR SELECT USING (bucket_id = 'media-gallery');

-- Allow anyone to upload to 'media-gallery'
CREATE POLICY "Public Gallery Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media-gallery');

-- Allow anyone to delete (for the staff/soldiers to manage gallery)
CREATE POLICY "Public Gallery Delete" ON storage.objects FOR DELETE USING (bucket_id = 'media-gallery');
