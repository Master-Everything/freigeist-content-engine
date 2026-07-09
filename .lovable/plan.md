## Problem
Der Excerpt wird beim Push zweimal sichtbar: einmal als Hub-`subtitle` (unter Titel/Video, korrekt) und einmal als `<p class="lead">…</p>` am Anfang des HTML-Bodys (Zitat-Optik, doppelt).

## Fix
Neue Renderer-Option `omitExcerpt` — analog zu `omitMainVideo`. Beim Push aktiv, Engine-Vorschau unverändert (dort gibt's keinen separaten Subtitle-Header, der `lead`-Absatz muss sichtbar bleiben).

### Änderungen
1. `src/lib/render-post-html.ts`
   - `RenderOptions` um `omitExcerpt?: boolean` erweitern.
   - `if (b.excerpt)` → `if (b.excerpt && !opts.omitExcerpt)`.
2. `supabase/functions/push-to-hub/render-post.ts`
   - Gleiche Änderung (1:1-Sync mit Engine-Renderer).
3. `supabase/functions/push-to-hub/index.ts`
   - Aufruf: `renderPostHtml(..., { omitMainVideo: true, omitExcerpt: true })`.
   - Payload-Feld `subtitle: blocks.excerpt ?? null` bleibt wie es ist.

## Nicht angefasst
- Hub, Ingest-Function, DB-Schema.
- Engine-Vorschau (`PostPreview` nutzt Default-Options → Excerpt bleibt sichtbar).
- Sonstige Renderer-Logik (Video, Speaker-Box, CTAs).
