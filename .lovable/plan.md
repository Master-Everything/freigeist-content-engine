## Problem
Der Button „Neues Bild wählen" in der Speaker-Box (Modul 7 / EditPost) ist deaktiviert, weil `SpeakerAvatarField` per `userId={(post as any)?.user_id}` gefüttert wird — die `posts`-Tabelle hat aber gar keine `user_id`-Spalte (nur `speaker_id`). Damit ist `userId` immer `undefined`, und die Komponente disabled den Upload-Button (`disabled={uploading || !userId}`).

## Fix
`SpeakerAvatarField` auf `speaker_id` umstellen statt auf `user_id`.

### Änderungen

**`src/components/SpeakerAvatarField.tsx`**
- Prop `userId` → `speakerId: string | null | undefined`.
- Ladelogik: `speakers` per `id = speakerId` holen (statt `user_id = userId`), Avatar-Path + `user_id` aus dem Ergebnis lesen.
- Upload-Pfad im Bucket weiterhin `${speaker.user_id}/avatar-<ts>.webp` (Storage-Policies bleiben unberührt).
- Button-Disabled-Bedingung auf `!speakerId` umstellen.
- Fehlt bei einem Post der `speaker_id` (Alt-Posts), Hinweis-Text anzeigen: „Kein Speaker verknüpft — Speaker in Modul 1 anlegen/zuordnen."

**`src/pages/EditPost.tsx`**
- Aufruf ändern: `speakerId={(post as any)?.speaker_id}` statt `userId=…`.

### Nicht angefasst
- Renderer, Preview, Push-to-Hub, DB-Schema, RLS, Storage-Buckets.
