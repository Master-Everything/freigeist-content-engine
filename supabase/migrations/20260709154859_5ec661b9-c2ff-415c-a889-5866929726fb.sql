
CREATE POLICY "Admins upload any speaker avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'speaker-avatars' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update any speaker avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'speaker-avatars' AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'speaker-avatars' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete any speaker avatar"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'speaker-avatars' AND has_role(auth.uid(), 'admin'::app_role));
