-- Datenkorrektur: Alt-Status auf 'erfassung' zurücksetzen
UPDATE posts SET status='erfassung' WHERE status IN ('in_progress','vorab_scan','draft','exported');

-- Constraint neu setzen auf finale Whitelist inkl. hub_pushed
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE posts ADD CONSTRAINT posts_status_check CHECK (status IN (
  'erfassung','scan_pending','scan_done','redaktion_angefragt','in_bearbeitung',
  'profil','profil_review','leitfaden','leitfaden_final',
  'vorgespraech','vorgespraech_done','aufzeichnung','aufzeichnung_done','hub_pushed'
));