# Admin-Aktionen in Modul 2 spiegeln (analog Speaker Modul 1)

Ziel: In Modul 2 → Tab „Interviews" bekommt der Admin dieselben Aktions-Buttons wie der Speaker in „Meine Interviews", mit denselben Bestätigungs-Dialogen und Regeln.

## Änderungen in `src/pages/modules/Module2VorabScan.tsx`

Neue Spalte „Aktionen" pro Interview-Zeile, kontextabhängig zum `posts.status`:

- **`erfassung`** → Button **„Zum Scan freigeben"**
  - Ruft die vorhandene `interview-scan` Edge Function auf (gleicher Trigger wie in `MyPosts.tsx`).
  - Setzt Status auf `scan_pending` → nach Abschluss `scan_done`.
  - Loading-State + Toast.

- **`scan_pending`** → deaktivierter Button „Scan läuft…" (Spinner).

- **`scan_done`** → zwei Buttons nebeneinander:
  - **„Erneut bearbeiten"** (Unlock) — Bestätigungs-Dialog: setzt Status zurück auf `erfassung`, damit der Post editierbar wird.
  - **„Bei Redaktion einreichen"** — Bestätigungs-Dialog mit Zusammenfassung der Verdicts (Profil + Interview, Ampelfarben). Deaktiviert wenn Interview-Scan rot, Profil-Scan rot oder Profil-Scan fehlt (Tooltip mit Grund). Setzt Status auf `redaktion_angefragt`.

- **`redaktion_angefragt`** → Button **„Profil anlegen"** (bereits vorhanden, bleibt).

- **`in_bearbeitung`** → Badge „In Bearbeitung" + Link zu Modul 3.

## Wiederverwendung

- Bestätigungs-Dialoge als AlertDialog inline (analog `MyPosts.tsx`), keine neue Komponente nötig.
- Verdict-Ampel: `AmpelBadge` (bereits importiert).
- Handler-Logik (Unlock, Submit, Trigger-Scan) 1:1 aus `MyPosts.tsx` übernehmen — nur ohne Speaker-Ownership-Check, da Admin.

## Nicht Teil des Plans

- Keine Datenbank-Änderungen (Status-Werte existieren bereits).
- Keine Änderungen an Speaker-Ansicht, Modul 3 oder Edge Functions.
- Zähler/Stats bleiben unverändert.
