Doch – im ursprünglichen Plan war die Hub-Seite als „Voraussetzung" gelistet, aber nicht ausformuliert. Hier ist jetzt der vollständige Copy-Paste-Bauplan fürs **Hub-Projekt** (separates Lovable-Projekt), damit der Push aus der Content-Engine ankommt.

## Was im Hub-Projekt entsteht

1. **Migration** – Spalten auf `posts` für die Rück-Referenz und Storage-Bucket `interview-images` (public).
2. **Kategorie „Interview"** – Seed-Insert, falls noch nicht vorhanden (Slug: `interview`).
3. **Edge Function `ingest-interview**` – nimmt Push entgegen, prüft Shared Secret, transferiert Bilder in den Hub-Storage, legt Draft-Post an oder aktualisiert ihn.
4. **Secret `INGEST_SHARED_SECRET**` – identischer Wert wie `HUB_INGEST_SECRET` hier in der Engine.

## Ablauf beim Empfang

```text
Engine → POST /ingest-interview
         Header: X-Ingest-Secret
         Body:  { hub_post_id?, title, slug, category_slug:"interview",
                  content_html, excerpt, speaker:{...}, image_urls:[{url,role}] }
   │
   ▼
Hub prüft Secret (401 bei mismatch)
   │
   ▼
Für jede image_url: fetch → in Bucket `interview-images` speichern
   → signierte/öffentliche Hub-URL zurück
   → im content_html alle alten URLs durch neue ersetzen
   │
   ▼
INSERT (neu) oder UPDATE (per hub_post_id) in posts
   status = 'draft', category = 'interview'
   │
   ▼
Response 200 { hub_post_id, hub_slug, hub_edit_url }
```

## Technische Details

### Migration im Hub

```sql
-- Storage-Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('interview-images', 'interview-images', true)
ON CONFLICT DO NOTHING;

-- Public-Read-Policy für den Bucket
CREATE POLICY "Public read interview-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'interview-images');

-- Service-Role darf schreiben (implizit via service_role key)
```

Falls im Hub-Schema noch keine Spalte für die Herkunft existiert, ergänzen wir optional:

```sql
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS source_engine_post_id uuid,
  ADD COLUMN IF NOT EXISTS source_engine_pushed_at timestamptz;
```

(Nur wenn dein Hub eine `posts`-Tabelle hat – Struktur passen wir an dein Hub-Schema an, sobald du mir sagst wie die dortige Tabelle heißt/aussieht.)

### Edge Function `ingest-interview/index.ts`

Kernpunkte:

- `verify_jwt = false` (Auth ausschließlich per Shared Secret)
- Zod-Validation des Bodys
- `createClient` mit `SUPABASE_SERVICE_ROLE_KEY` für Storage + DB
- Bilder-Loop: `fetch(url) → arrayBuffer → storage.upload(path, blob, {upsert:true})` → `getPublicUrl` → String-Replace im `content_html`
- Dateipfad-Schema: `posts/<slug>/<originalname-or-hash>.<ext>` (idempotent bei Re-Push)
- Insert-oder-Update:
  - Wenn `hub_post_id` im Body → `update ... where id = hub_post_id`
  - Sonst → `insert ... returning id, slug`
- Antwort immer 200 mit `{ hub_post_id, hub_slug, hub_edit_url }` oder `{ error }` (Konvention aus Core-Memory)

### Secret im Hub

`INGEST_SHARED_SECRET` = derselbe Zufallswert, den du gleich hier als `HUB_INGEST_SECRET` hinterlegst.

## Offene Frage vor dem Code-Schreiben

Damit die Function exakt zu deinem Hub passt, brauche ich einmal kurz:

1. **Wie heißt im Hub die Tabelle für Beiträge?** (`posts`, `articles`, `news`, …?) – und existiert dort schon eine Kategorien-Logik (Enum? Eigene Tabelle? Slug-Feld?).
2. **Soll der Ingest im Hub bereits einen bestimmten Autor/User setzen** (z. B. Service-Account) oder Autor leer lassen bis der Redakteur ihn im Hub setzt?

Sobald das klar ist, liefert der nächste Plan die fertigen Files (Migration + Function + Secret-Setup) zum Approven und dann im Hub-Projekt einfügen.  
  
ANTWORTEN:  
  
Zu 1.   
- Tabelle für Beiträge: posts  
- Tabele für Kategorien: categories  
  
Zu 2.  
- Auto: erstmal leer lassen