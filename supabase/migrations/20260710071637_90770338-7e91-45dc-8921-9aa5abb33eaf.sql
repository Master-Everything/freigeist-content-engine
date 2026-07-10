
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_status_check CHECK (status = ANY (ARRAY[
  'erfassung'::text,
  'scan_pending'::text,
  'scan_done'::text,
  'redaktion_angefragt'::text,
  'in_bearbeitung'::text,
  'vorab_scan'::text,
  'profil'::text,
  'leitfaden'::text,
  'vorgespraech'::text,
  'aufzeichnung'::text,
  'draft'::text,
  'in_progress'::text,
  'exported'::text
]));

UPDATE public.posts p
SET status = 'scan_done'
WHERE p.status = 'erfassung'
  AND EXISTS (SELECT 1 FROM public.post_scans ps WHERE ps.post_id = p.id AND ps.status = 'done');
