
-- public read
CREATE POLICY "Public read post-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');

CREATE POLICY "Public read speaker-avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'speaker-avatars');

-- authenticated write for post-images
CREATE POLICY "Authenticated insert post-images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'post-images');

CREATE POLICY "Authenticated update post-images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'post-images');

CREATE POLICY "Authenticated delete post-images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'post-images');
