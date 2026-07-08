## Interview-Beitrag an News-Plattform senden

Ziel: Ein Redakteur klickt im Editor auf „An News-Plattform senden" — der Beitrag landet als **Draft** im Freigeist Content-Hub, inklusive aller Bilder (im Hub-Storage) und identischem HTML-Rendering wie beim WordPress-Export.

---

### 1. Architektur (Variante b — Shared Secret)

```text
Content-Engine (hier)                       Content-Hub (Ziel)
─────────────────────                       ──────────────────
[Editor] → Button                            
  ↓                                          
Edge Function `push-to-hub`                  Edge Function `ingest-interview`
  • JWT-Check (Redakteur eingeloggt)   →     • Prüft Header X-Ingest-Secret
  • Rendert HTML (generateHTML)              • Lädt Bilder in Hub-Storage
  • Sendet POST mit Payload                  • Insert/Update in posts (Draft)
                                             • Antwortet mit hub_post_id + slug
  ← speichert hub_post_id, hub_slug ←
```

**Vorteile:**

- Kein Hub-Service-Role-Key hier gespeichert
- Hub-Schema-Änderungen bleiben intern im Hub-Projekt
- Shared-Secret rotierbar ohne Migration

---

### 2. Änderungen im Content-Hub (anderes Lovable-Projekt)

Muss dort vor Aktivierung eingerichtet werden:

- **Secret `INGEST_SHARED_SECRET**` (identisch mit dem hier gespeicherten)
- **Storage-Bucket `interview-images**` (public, für Bild-Uploads)
- **Kategorie `interviews**` (falls nicht vorhanden) — Slug: `interviews`, Name: „Interview"
- **Edge Function `ingest-interview**` (verify_jwt = false, prüft eigenes Secret):
  - Nimmt Payload entgegen: `{ external_id, title, subtitle, content_html, image_urls: [{url, filename, role}], video_url, category_slug, meta }`
  - Lädt jede `image_url` per fetch → speichert in `interview-images` Bucket → mappt neue URLs
  - Ersetzt alle alten Bild-URLs im `content_html` durch neue Hub-URLs
  - Findet Post via `external_id` (unser `posts.id`) → Insert wenn neu, sonst Update
  - Antwortet: `{ hub_post_id, hub_slug }`

Diese Änderungen setzt du im Hub-Projekt in einer separaten Runde um. Ich liefere dir die genaue Edge-Function für den Hub am Ende dieser Runde als Copy-Paste-Snippet.

---

### 3. Änderungen hier im Content-Engine-Projekt

**a) Secrets**

- `HUB_INGEST_URL` — voller Edge-Function-URL des Hubs
- `HUB_INGEST_SECRET` — Shared-Secret (identisch mit Hub)

**b) Migration `posts**` — neue nullable Spalten:

- `hub_post_id` (uuid)
- `hub_slug` (text)
- `hub_pushed_at` (timestamptz)
- `hub_last_error` (text)

**c) Edge Function `push-to-hub**` (verify_jwt = true):

- Input: `{ post_id }`
- Lädt Post + Speaker aus DB
- Rendert HTML mit **derselben** `generateHTML()`-Logik wie WordPress-Export (Speaker-Box + CTA-Buttons + Sektionen identisch)
- Sammelt alle Bild-URLs aus `blocks` (guest_image_url, top/mid/end_image_url) mit Rolle
- Payload:
  ```
  {
    external_id: post.id,
    title: post.interview_title,
    subtitle: post.guest_name,
    content_html: <generateHTML output>,
    image_urls: [{url, filename, role: "guest"|"top"|"mid"|"end"}],
    video_url: post.youtube_url,
    category_slug: "interviews",
    meta: { guest_name, product, ... }
  }
  ```
- POST an `HUB_INGEST_URL` mit Header `X-Ingest-Secret: <secret>`
- Antwort speichern in `posts.hub_post_id/hub_slug/hub_pushed_at`
- Bei Fehler: 200 OK mit `{ error }` (Projekt-Konvention), `hub_last_error` befüllen

**d) UI — Button im Editor**

- `EditPost.tsx` (und `PreviewPost.tsx`): Neuer Button „An News-Plattform senden"
- Bestätigungs-Dialog: „Beitrag wird als Entwurf im Hub angelegt/aktualisiert."
- Nach Erfolg: Toast mit Link zum Hub-Draft (`hub_slug`)
- Bei bereits gepushten Beiträgen: Button-Label wechselt zu „An News-Plattform aktualisieren"
- Status-Anzeige: „Zuletzt gesendet: &nbsp;"

**e) Modul 8 Übersicht** (`Module8NewsPlattform.tsx`)

- Read-only Tabelle: alle Posts mit `hub_post_id IS NOT NULL`
- Spalten: Titel, Gast, Gepusht am, Link zum Hub-Draft
- Button „Neu pushen" pro Zeile

**f) React Query Hook** `usePushToHub` — Mutation + Invalidation

---

### 4. HTML-Rendering — einheitlich mit Modul 7

Die `generateHTML()`-Funktion (`src/lib/export-html.ts`) wird **unverändert** genutzt:

- Speaker-Box (Guest Profile) identisch
- CTA-Buttons (Guest Website, Affiliate) identisch
- Alle Sektionen, Bilder, Videos identisch

Damit ist garantiert: Der WordPress-Import in Modul 7 und der Hub-Push in Modul 8 erzeugen visuell **exakt denselben Beitrag**.

Umsetzungs-Detail: Die Edge Function importiert `generateHTML()` nicht direkt (Client-Code), sondern eine **portierte Kopie** wird im Function-Ordner abgelegt (`_shared/render-post.ts`). Änderungen am Rendering müssen an beiden Stellen erfolgen — akzeptable Verdopplung, da Deno keinen sauberen Zugriff auf `src/` hat.

---

### 5. Bild-Transfer — Ablauf

1. Content-Engine sendet Bild-URLs (WordPress oder Supabase-Storage) im Payload
2. Hub-Ingest-Function `fetch()`t jedes Bild → lädt in `interview-images` Bucket
3. Hub ersetzt alle Vorkommen der alten URLs im `content_html` durch neue Hub-URLs
4. Bei Re-Push: gleicher `external_id` → Bilder werden neu geladen und ersetzt (idempotent)

Dadurch sind alle Bilder im Hub-Storage verfügbar und nutzbar für andere Posts/Social-Media/Seiten.

---

### 6. Umsetzungs-Reihenfolge

1. Migration `posts` (hub_* Spalten)
2. Secrets `HUB_INGEST_URL` + `HUB_INGEST_SECRET` einrichten
3. Edge Function `push-to-hub` + shared `render-post.ts`
4. UI-Button in `EditPost.tsx` + `usePushToHub` Hook
5. Modul-8-Übersicht ausbauen
6. Hub-Snippet liefern (Edge Function + Bucket + Kategorie)
7. End-to-End-Test

---

### 7. Was bewusst NICHT in dieser Runde

- Kategorien-Sync (Kategorie ist fix `interviews`)
- Rückkanal Hub → Engine (Publikations-Status)
- Löschen im Hub aus der Engine heraus
- Automatischer Push bei Status-Wechsel
- Speaker-Profil-Transfer als separate Entität (Speaker-Daten leben im HTML mit)

---

### Offene Frage

**Kategorie im Hub:** Ich nehme Slug `interviews` an. Falls der Hub schon eine Kategorie mit anderem Slug hat (z. B. `interview` singular), sag Bescheid — wird sonst beim ersten Push mit „Kategorie nicht gefunden" fehlschlagen.  
  
Im Freigeist-Hub gibt es den Kategorie Slug "Interview"