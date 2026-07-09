## Problem

Das Feld „Speaker-Foto (Speaker-Box, aus Modul 1)" existiert im Block-Editor (Modul 7) bereits und schreibt beim Upload zentral in `speakers.avatar_url` zurück (Single Source of Truth). Für Redakteure/Admins schlägt der Upload aktuell aber still fehl, wenn sie den Post eines fremden Speakers bearbeiten.

**Ursache:** Die Storage-RLS-Policies auf `speaker-avatars` erlauben `INSERT/UPDATE/DELETE` nur, wenn der Ordnername (`{user_id}/…`) mit `auth.uid()` übereinstimmt. Ein Admin lädt aber in den Ordner des Speakers hoch und wird von RLS blockiert. Der DB-Update auf `speakers` selbst funktioniert (dort ist `has_role(..., 'admin')` in der Policy enthalten) — nur die Datei-Ablage nicht.

## Lösung

Storage-Policies auf `speaker-avatars` um Admin-Zugriff erweitern — analog zur bestehenden `speakers`-Tabellen-Policy.

### Migration
Drei zusätzliche Policies auf `storage.objects` für Bucket `speaker-avatars`:

- `Admins upload any speaker avatar` (INSERT) — `has_role(auth.uid(), 'admin')`
- `Admins update any speaker avatar` (UPDATE) — `has_role(auth.uid(), 'admin')`
- `Admins delete any speaker avatar` (DELETE) — `has_role(auth.uid(), 'admin')`

Die bestehenden User-Policies bleiben unverändert; Speaker können weiterhin ihr eigenes Bild pflegen.

### Kein UI-Change nötig
`SpeakerAvatarField` in `src/pages/EditPost.tsx` ist bereits eingebunden und lädt in den Ordner des Post-Owners (`post.user_id`) hoch. Nach der Policy-Erweiterung funktioniert der bestehende Upload-Button für Admins direkt.

### Verifikation
Als Admin einen fremden Post öffnen → neues Bild wählen → Toast „Avatar aktualisiert" → Preview + Modul 1 zeigen das neue Bild.
