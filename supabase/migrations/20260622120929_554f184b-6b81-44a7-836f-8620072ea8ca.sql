ALTER TABLE public.posts DROP CONSTRAINT posts_status_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_status_check
  CHECK (status IN (
    'erfassung','vorab_scan','profil','leitfaden',
    'vorgespraech','aufzeichnung',
    'draft','in_progress','exported'
  ));