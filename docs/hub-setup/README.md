# Hub-Setup: Ingest-Interview

Diese Files gehören ins **Hub-Projekt** ([FREIGEIST Content-Hub](/projects/3b7054d6-c0c3-4272-9ffa-f782221a6fba)). Kopiere sie 1:1 rüber. Ich kann dort nur lesen – schreiben musst du (oder ein Agent in dem Projekt) selbst.

## Angepasst an das echte Hub-Schema

- Kategorien-Zuordnung läuft über `posts.category_slug` (TEXT → `categories.slug`)
- Content landet in `posts.content`
- Hero-Bild landet in `posts.image_url`
- „Excerpt" wird auf `posts.subtitle` gemappt
- Bilder-Bucket ist der bestehende **`post-images`** (public) – wir legen keinen neuen an
- Kategorie „Interview" wird mit `color` + `icon` geseedet (NOT NULL im Hub)

## Reihenfolge

1. **Migration** – `migration.sql` im Hub via Cloud-Migration einspielen.
2. **Edge Function** – im Hub Ordner `supabase/functions/ingest-interview/` anlegen und Inhalt aus `ingest-interview.ts` einfügen. Zusätzlich in `supabase/config.toml` des Hubs den Eintrag aus `config.toml.snippet` ergänzen (setzt `verify_jwt = false`).
3. **Secret setzen** – im Hub `INGEST_SHARED_SECRET` mit selbst gewähltem Zufallswert speichern (z. B. `openssl rand -hex 32`).
4. **Function-URL notieren** – `https://<hub-project-ref>.functions.supabase.co/ingest-interview`.
5. **Zurück in der Engine** – hier setzen wir dann:
   - `HUB_INGEST_URL` = URL aus Schritt 4
   - `HUB_INGEST_SECRET` = derselbe Wert wie `INGEST_SHARED_SECRET` im Hub

## Payload-Vertrag

```
POST /ingest-interview
Header: X-Ingest-Secret: <shared secret>
Content-Type: application/json

{
  "hub_post_id": "uuid | null",
  "engine_post_id": "uuid",
  "title": "string",
  "slug": "string",
  "subtitle": "string | null",
  "content_html": "string",
  "reading_time": 8,
  "image_urls": [
    { "url": "https://…", "role": "featured | inline" }
  ]
}
```

Antwort (immer 200):

```
{ "hub_post_id": "uuid", "hub_slug": "string", "images_transferred": 4 }
// oder
{ "error": "message" }
```
