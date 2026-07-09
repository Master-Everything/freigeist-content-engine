## Problem

`InlineImageUpload` lädt Bilder noch über `wp-upload` nach WordPress → 404 → 502 im Frontend. Für das Slot „Gast-Profil" existiert außerdem schon ein Speaker-Avatar (aus Modul 1, Bucket `speaker-avatars`), das aktuell doppelt verwaltet wird.

## Lösung

Zwei Dinge in einem Zug:

1. **Speaker-Avatar zentralisieren** — ein Bild für den Speaker, aus Modul 1 gepflegt, überall genutzt (Post-Editor, Preview, Push-to-Hub).
2. **Restliche Post-Bilder** (Top, Mid, End) auf einen eigenen Supabase-Storage-Bucket umstellen, kein WordPress-Umweg mehr.

### 1. Speaker-Avatar wird die eine Quelle für „Gast-Profil"-Bild

- `speaker-avatars`-Bucket auf **public** stellen (`supabase--storage_update_bucket`), damit der Hub das Bild per öffentlicher URL abholen kann. Falls die Workspace-Policy public buckets blockt, sage ich Bescheid und wir bleiben auf privatem Bucket mit einer neuen Public-Read-Policy nur für Avatare — Fallback wird im Chat erklärt.
- **Neue Logik in `EditPost.tsx`**:
  - Beim Laden des Posts zusätzlich den zugehörigen Speaker holen (`posts.speaker_id` → `speakers.avatar_url`).
  - `blocks.guest_image_url` wird beim Rendern **immer** aus dem Speaker-Avatar abgeleitet, wenn dort ein Bild vorliegt (Speaker gewinnt).
  - Der Slot „Gast-Profil / Bild-URL" wird durch eine neue Komponente `SpeakerAvatarField` ersetzt: zeigt aktuelles Avatar an, Button „Neues Bild wählen" öffnet Datei-Dialog → WebP-Konvertierung → Upload nach `speaker-avatars/{userId}/avatar-{ts}.webp` → `speakers.avatar_url` wird per Update aktualisiert → Preview refresht.
  - Kein separates Editier-Feld mehr für diese URL, damit es keinen Drift geben kann. Hinweistext: „Wird zentral im Speaker-Profil (Modul 1) gepflegt — Änderungen wirken auch dort".
- **Renderer/Push**: `src/lib/render-post-html.ts` und `supabase/functions/push-to-hub/render-post.ts` konsumieren `blocks.guest_image_url` wie bisher — Änderung ist nur, dass diese URL jetzt aus dem Speaker-Avatar stammt.
- **Speaker-Formular (Modul 1)** bleibt Editier-Oberfläche und braucht keine Änderung — Uploads landen im gleichen Bucket wie zuvor.

### 2. Restliche Slots (Top, Mid, End) auf Supabase-Storage

- Neuer public Bucket `post-images` (`supabase--storage_create_bucket`).
- RLS auf `storage.objects`:
  - `SELECT` für `anon` (öffentliche Lesbarkeit, damit der Hub laden kann).
  - `INSERT/UPDATE/DELETE` für `authenticated`, beschränkt auf `bucket_id = 'post-images'`.
- `InlineImageUpload.tsx` umbauen:
  - `supabase.functions.invoke("wp-upload")` raus, stattdessen `supabase.storage.from("post-images").upload(...)` + `getPublicUrl`.
  - Pfad: `posts/{postId}/{slot}-{filenameIndex}.webp`.
  - `images`-Insert bleibt (Spalte `wp_url` behält die neue Public-URL — keine Migration nötig).
  - `getUploadMethod`-Aufruf entfernen.
- Wird für Top/Mid/End weiter benutzt, für „Gast-Profil" durch `SpeakerAvatarField` ersetzt.

### 3. Aufräumen

- Edge Functions `wp-upload/` und `wp-upload-ftp/` löschen.
- Zugehörige Blöcke in `supabase/config.toml` entfernen.
- `ScreenshotSettings.tsx` + `getUploadMethod` entfernen, sofern nur dafür genutzt (Sidebar/Route mit prüfen).
- Secrets `WP_USERNAME` / `WP_APP_PASSWORD` bleiben stehen — der User kann sie bei Bedarf über Settings löschen.

### 4. Verifizieren

- Speaker in Modul 1 hat Avatar → im Post-Editor erscheint es im „Gast-Profil"-Slot automatisch.
- Neues Avatar aus dem Post-Editor hochgeladen → Modul-1-Profil zeigt dasselbe Bild.
- Ein Bild in „Oberes Bild" hochladen → landet in `post-images`, Public-URL kommt zurück, Preview zeigt es.
- `push-to-hub` überträgt beide URLs; Hub-`ingest-interview` spiegelt sie in seinen `post-images`-Bucket.

## Nicht Teil dieser Runde

- Migration alter WP-Bild-URLs in bestehenden Posts.
- Änderungen am Hub oder am Push-Renderer.
- Bild-Cropping/Zuschnitt-UI im Post-Editor.
