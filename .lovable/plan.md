## Ziel

Drei präzise Anpassungen am Push-Flow Content-Engine → Hub. Der Hub bleibt inhaltlich unverändert; nur die Ingest-Function und der Engine-Renderer werden angefasst.

## Änderungen

### 1. Kein Featured Image mehr übergeben
- `supabase/functions/push-to-hub/index.ts`: `collectImages()` markiert nichts mehr als `role: "featured"`. Alle Bilder (Speaker, Top/Mid/End) laufen als `inline`, damit sie im Storage transferiert und im HTML ersetzt werden — aber `image_url` bleibt im Hub leer.
- `docs/hub-setup/ingest-interview.ts` + Hub-Function `ingest-interview`: `image_url: null` setzen (kein Fallback auf erstes Bild).

### 2. Featured Video übergeben (Hub-Feld `video_url`)
- Payload erhält neues Feld `video_url: string | null` (aus `blocks.main_video_url`).
- Zusätzlich: Der Haupt-Video-Embed wird aus dem `content_html` **entfernt**, damit im Hub das Video nur einmal (als Featured Video unter dem Subtitle) erscheint. Der Renderer bekommt eine Option `omitMainVideo`, der Push-Aufruf setzt sie auf `true`. Die Engine-Vorschau bleibt unverändert (Video weiter im Body).
- `docs/hub-setup/ingest-interview.ts` + Hub-Function: `video_url` im BodySchema akzeptieren und in `payload.video_url` schreiben.

### 3. Subtitle = Excerpt (nie Fallback)
- Push-Payload: `subtitle: blocks.excerpt ?? null` (statt `post.guest_name`).
- Ingest-Function: `subtitle: body.subtitle ?? null` (unverändert, kein Fallback).

### 4. CTA-Buttons mit Sternchen (Hub-Konvention)
- `src/lib/render-post-html.ts` und `supabase/functions/push-to-hub/render-post.ts`: In `ctaButton()` das Label mit `✨ Label ✨` umschließen, falls noch kein Sparkle-Zeichen (`✨ ⭐ 🌟`) enthalten ist. Genau die Hub-Regel aus `RichTextEditor.tsx` und `import-website/index.ts`.
- Das trifft alle CTAs: „Zur Website von …", „Informationen & Store" (mid + end).

## Nicht angefasst
- Hub-Frontend, Hub-DB-Schema, RLS.
- Engine-Vorschau-Layout (nur Push-HTML ändert sich beim Haupt-Video).
- Bild-Slots, Speaker-Box, Renderer-Struktur sonst.

## Deploy-Schritte (nach Approval)
1. Engine: `push-to-hub/index.ts` + beide `render-post` Dateien anpassen → Edge Function wird automatisch neu deployed.
2. Hub: `docs/hub-setup/ingest-interview.ts` aktualisieren. Du kopierst den neuen Inhalt in die Hub-Function `ingest-interview` und deployst sie dort einmal.
