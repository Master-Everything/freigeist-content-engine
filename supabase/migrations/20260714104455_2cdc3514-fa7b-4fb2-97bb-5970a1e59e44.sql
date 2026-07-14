
-- 1) user_id auf speakers nullable machen (Admin darf im Auftrag anlegen)
ALTER TABLE public.speakers ALTER COLUMN user_id DROP NOT NULL;

-- 2) created_by ergänzen
ALTER TABLE public.speakers ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);
ALTER TABLE public.posts    ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- 3) Backfill: speakers direkt aus user_id; posts indirekt über speaker_id → speakers.user_id
UPDATE public.speakers SET created_by = user_id WHERE created_by IS NULL AND user_id IS NOT NULL;

UPDATE public.posts p
   SET created_by = s.user_id
  FROM public.speakers s
 WHERE p.speaker_id = s.id
   AND p.created_by IS NULL
   AND s.user_id IS NOT NULL;

-- 4) INSERT-Policy speakers: Admin-Bypass ergänzen (konsistent mit SELECT/UPDATE)
DROP POLICY IF EXISTS "Speakers insert own profile" ON public.speakers;
CREATE POLICY "Speakers insert own profile"
  ON public.speakers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
