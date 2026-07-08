# Hub-Setup: Ingest-Interview

Diese Files gehören ins **Hub-Projekt** (nicht in die Content-Engine). Kopiere sie 1:1 rüber.

## Reihenfolge

1. **Migration ausführen** – `migration.sql` im Hub via Lovable Cloud Migration einspielen.
   Fügt Spalten `source_engine_post_id`, `source_engine_pushed_at` auf `posts` hinzu
   und stellt sicher, dass Kategorie „Interview" existiert.
2. **Storage-Bucket anlegen** – im Hub den Bucket `interview-images` als **public** erstellen
   (über das Cloud-UI oder den Storage-Tool-Call). Danach `storage-policy.sql` einspielen.
3. **Edge Function anlegen** – Ordner `supabase/functions/ingest-interview/` mit `index.ts`
   im Hub-Projekt anlegen und den Inhalt aus `ingest-interview.ts` einfügen.
4. **Secret setzen** – im Hub das Secret `INGEST_SHARED_SECRET` mit einem selbst gewählten
   Zufallswert speichern (z. B. `openssl rand -hex 32`).
5. **Function-URL kopieren** – die Deploy-URL der Function notieren.
6. **Zurück in der Content-Engine** – dort werden dann zwei Secrets gesetzt:
   - `HUB_INGEST_URL` = die URL aus Schritt 5
   - `HUB_INGEST_SECRET` = derselbe Wert wie `INGEST_SHARED_SECRET` im Hub

## Payload-Vertrag

Die Engine schickt per POST an die Function:

```
Header: X-Ingest-Secret: <shared secret>
Content-Type: application/json

{
  "hub_post_id": "uuid | null",       // null = neuer Post, sonst Update
  "engine_post_id": "uuid",           // Herkunfts-ID aus der Engine
  "title": "string",
  "slug": "string",
  "excerpt": "string | null",
  "category_slug": "interview",
  "content_html": "string",           // fertiges HTML inkl. CTA + Speaker-Box
  "image_urls": [                     // alle im HTML referenzierten Bilder
    { "url": "https://…", "role": "featured | inline" }
  ]
}
```

Antwort (immer 200, auch bei Fehler – Error-Konvention):

```
{ "hub_post_id": "uuid", "hub_slug": "string", "hub_edit_url": "string" }
// oder
{ "error": "message" }
```
