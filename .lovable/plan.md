

## Guest Screenshot & WordPress Upload Tool — integriert in den Post-Editor

### Übersicht

Ein neuer Tab "Screenshots" im EditPost-Editor ermöglicht es, die Website eines Gastes per ScreenshotOne API zu screenshotten, die Bilder per Edge Function nach WordPress hochzuladen und die URLs automatisch in die Bild-Felder (Top/Mid/End Image) des Posts einzutragen.

### Voraussetzungen

- **ScreenshotOne API-Key** wird als neues Secret benötigt (`SCREENSHOTONE_API_KEY`)
- **WP_APP_PASSWORD** existiert bereits; **WP_USERNAME** muss als neues Secret hinzugefügt werden (Wert: `AI-Contentmanagement`)

---

### Neue Dateien

**`src/components/ScreenshotTool.tsx`** — Hauptkomponente (~400 Zeilen)
- Props: `post: Post`, `blocks: PostBlocks`, `onUpdateBlock: (field, value) => void`
- Workflow in 3 Schritten:
  1. **URL eingeben** — Guest Website URL (vorausgefüllt aus Post-Daten) + "Screenshot laden" Button
  2. **Screenshot-Vorschau + Crop** — Zeigt ein großes Vorschau-Bild der Website (via ScreenshotOne Full-Page Screenshot). Darüber ein Canvas-Overlay zum Zeichnen eines Crop-Rechtecks mit 8 Resize-Handles. Live px-Dimensionen, Clear/Capture Buttons.
  3. **Ergebnis-Slots** — 3 Slots (Top/Mid/End) mit Thumbnail, WP-URL, Copy-Button, Remove/Re-upload Buttons

- Crop-Logik: Berechnet relative Koordinaten auf dem Originalbild. Sendet Crop-Daten an Edge Function.
- Max 3 Screenshots pro Session, automatische Slot-Zuweisung (1→Top, 2→Mid, 3→End)
- Upload-Status pro Slot: Uploading/Success/Failed mit Retry

**`supabase/functions/screenshot-capture/index.ts`** — Edge Function (~120 Zeilen)
- Empfängt: `{ url, crop: { x, y, width, height }, filename }`
- Ruft ScreenshotOne API auf mit Full-Page-Screenshot, dann croppt serverseitig
- Alternativ: Nutzt ScreenshotOne's eigene Crop-Parameter (viewport_width, viewport_height, scroll_to)
- Konvertiert zu WebP, max 1500px breit, iterative Qualitätsreduktion bis ≤400KB
- Gibt den WebP-Blob zurück

**`supabase/functions/wp-upload/index.ts`** — Edge Function (~100 Zeilen)
- Empfängt: WebP-Blob (base64) + Filename
- Liest `WP_USERNAME` + `WP_APP_PASSWORD` aus Secrets
- POST an `https://freigeistkongress.com/wp-json/wp/v2/media`
- Headers: Basic Auth, `Content-Disposition: attachment; filename="X.webp"`, `Content-Type: image/webp`
- Gibt die öffentliche URL zurück
- Fehlerbehandlung mit klaren Meldungen

**`supabase/functions/wp-upload-ftp/index.ts`** — FTP-Fallback Edge Function (~80 Zeilen)
- Liest `FTP_HOST`, `FTP_PORT`, `FTP_USERNAME`, `FTP_PASSWORD` aus Secrets
- Uploads via FTP zum Zielverzeichnis `/wp-content/uploads/screenshots/`
- Gibt konstruierte URL zurück

**`src/components/ScreenshotSettings.tsx`** — Settings-Dialog (~80 Zeilen)
- Toggle: REST API vs FTP Upload-Methode (gespeichert in localStorage)
- "Test Connection" Button für beide Methoden
- Hinweis-Text zu fehlenden Credentials

### Änderungen an bestehenden Dateien

**`src/pages/EditPost.tsx`**
- Neuer Tab "Screenshots" neben "Editor"/"Vorschau" (Desktop: neues Tab in einer TabsList über dem Editor-Panel; Mobile: zusätzlicher Tab)
- Importiert `ScreenshotTool` Komponente
- Übergibt `post`, `blocks`, `updateBlock` an ScreenshotTool

**`supabase/config.toml`**
- Neue Function-Einträge: `screenshot-capture`, `wp-upload`, `wp-upload-ftp` (alle `verify_jwt = false`)

### Datei-Benennung

Screenshots werden benannt als: `{GuestName}-Screen-{1|2|3}.webp` (z.B. `AlexandraKons-Screen-1.webp`)
- Leerzeichen und Sonderzeichen werden entfernt

### Ablauf

```text
User gibt URL ein
       │
       ▼
Edge Fn: screenshot-capture
  → ScreenshotOne API (Full-Page)
  → Crop + Resize + WebP
       │
       ▼
Edge Fn: wp-upload (oder wp-upload-ftp)
  → POST nach WordPress
  → Gibt öffentliche URL zurück
       │
       ▼
URL wird in blocks.top_image_url / mid_image_url / end_image_url geschrieben
```

### Sicherheit

- Keine Credentials im Frontend — alles über Edge Functions
- WP-Credentials + ScreenshotOne-Key + FTP-Credentials ausschließlich in Secrets
- Fehlende Secrets → klare Setup-Anweisung im UI

### UI-Design

- Weißes Card-Layout mit 0.5px Borders, konsistent mit bestehendem Editor
- Progress-Indicator pro Slot beim Upload
- Responsive: gestapeltes Layout auf kleinen Screens

