-- Nachdem der Bucket `interview-images` als public angelegt ist,
-- diese Policies auf storage.objects einspielen.

-- Öffentliches Lesen
CREATE POLICY "Public read interview-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'interview-images');

-- Schreiben nur via Service-Role (Edge Function nutzt Service-Role-Key,
-- daher braucht es keine zusätzliche INSERT/UPDATE-Policy für Endnutzer).
