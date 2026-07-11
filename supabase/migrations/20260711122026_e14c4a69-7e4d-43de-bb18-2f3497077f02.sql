ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_status_check CHECK (status IN (
  'erfassung','scan_pending','scan_done','redaktion_angefragt','in_bearbeitung',
  'vorab_scan','profil','profil_review','leitfaden','vorgespraech','aufzeichnung',
  'draft','in_progress','exported'
));