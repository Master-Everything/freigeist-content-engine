## Ziel

Speaker können angelegte Interviews bearbeiten (bis zur Scan-Freigabe), sie über einen Button zum Scan freigeben, und die Ergebnisse werden — analog zu den Speaker-Profil-Scans — sowohl im Speaker- als auch im Admin-Bereich von Modul 2 dargestellt.

## 1. Datenbank

**Migration 1 — Interviews:**
- `posts.status` bekommt zwei neue erlaubte Werte: `scan_pending`, `scan_done` (frontend-seitige Status-Map, kein Enum-Change nötig, `status` ist bereits `text`).

**Migration 2 — Neue Tabelle `post_scans`** (analog `speaker_scans`):
- Felder: `post_id` (FK → posts, cascade), `triggered_by`, `status` (pending/running/done/error), `verdict` (green/yellow/red), `score`, `summary`, `findings jsonb`, `model_used`, `prompt_key_used`, `prompt_version_used`, `tokens_in/out`, `duration_ms`, `error_text`, `created_at`.
- GRANTs für authenticated + service_role, kein anon.
- RLS-Policies analog `speaker_scans`:
  - Speaker sieht Scans seiner eigenen Posts (via `posts.speaker_id → speakers.user_id`).
  - Admin sieht alles.
  - Insert/Update nur via Service-Role (Edge Function).

## 2. Interview bearbeiten (Speaker + Admin)

**Neu:** `src/pages/modules/interview/InterviewEdit.tsx`
- Re-use von `InterviewForm.tsx`-Komponenten (TextInput/TextAreaInput/Affiliate-Auswahl) — Form wird in wiederverwendbare `InterviewFieldset`-Komponente extrahiert.
- Lädt Post via `postId` aus URL, vorbefüllt Form.
- Speichert per `update` statt `insert`.
- **Editier-Gate:** Speaker darf nur bearbeiten wenn `status === "erfassung"`. Bei `scan_pending`/`scan_done`/späteren Status: Read-only-Anzeige mit Hinweis „Zur Bearbeitung freischalten lassen". Admin darf immer.

**Route:** `/module/interview/:postId/edit` (in `App.tsx` ergänzen).

**Anbindung:**
- `MyPosts.tsx` (Speaker): Klick auf Zeile → Edit statt View, solange Status = erfassung. Danach View.
- Admin-Liste analog (falls existiert; sonst Follow-up).

## 3. Scan-Freigabe aus „Meine Interviews"

`MyPosts.tsx` erweitern:
- Neuer Button pro Zeile **„Zum Scan freigeben"** — sichtbar wenn `status === "erfassung"`.
- Klick: Confirm-Dialog → setzt `status = "scan_pending"`, ruft Edge Function `interview-scan` mit `post_id`.
- Bei Erfolg: `status = "scan_done"`, Verdict-Ampel wird angezeigt (aus `post_scans`).
- Status-Badges in `statusConfig` ergänzen: `scan_pending` (amber, „Scan läuft"), `scan_done` (grün/gelb/rot je nach Verdict — via `AmpelBadge`).

## 4. Edge Function `interview-scan`

Neu: `supabase/functions/interview-scan/index.ts` — 1:1-Kopie der Logik von `vorab-scan/index.ts`, angepasst:
- Input: `{ post_id }`.
- Lädt Post + zugehörigen Speaker (für Kontext).
- Berechtigungscheck: Admin ODER `speaker.user_id === auth.uid()`.
- Sammelt Text aus Interview-Feldern: `interview_title`, `interview_topic`, `product`, `product_market_since`, `previous_interviews`, `critical_voices`, plus ausgewählte Affiliate-Produkte via `selected_affiliate_indices`.
- Verwendet **denselben Prompt `fg_kurator`** und dieselben `knowledge_banned_words` + `knowledge_compliance_rules`.
- User-Payload an LLM enthält zusätzlich Speaker-Kontext (Name, Branche) damit die Regeln fair angewendet werden.
- Schreibt Ergebnis in `post_scans`, setzt `posts.status = "scan_done"` bei Erfolg, `error` sonst.
- Blockiert parallele Scans desselben Posts.

## 5. UI — Ergebnisse anzeigen

**Speaker-Bereich** (`src/pages/modules/vorab-scan/Eingereicht.tsx`):
- Zweiter Card-Block **„Interview-Scans"** unter dem Profil-Scan-Block.
- Neuer Hook `usePostScans(userId)` — lädt alle `post_scans` zu Posts des Speakers.
- Liste analog: Datum, Interview-Titel, AmpelBadge, Score, Klick → `ScanDetailSheet` (bestehende Komponente, akzeptiert bereits generisches Scan-Objekt).

**Admin-Bereich** (`src/pages/modules/Module2VorabScan.tsx`):
- Neuer Tab-Umschalter oben: „Speaker-Profile" ↔ „Interviews".
- Für „Interviews": neue Tabelle mit Spalten Datum, Speaker, Interview-Titel, Verdict, Score, Findings, Aktionen (Detail, Re-Scan).
- Re-Scan ruft `interview-scan` mit `post_id`.
- Stats-Cards teilen sich denselben Aufbau (total/red/yellow/green).

## 6. Kleinigkeiten

- `useSpeakerScans.ts` als Vorlage für `usePostScans.ts` (fast identisch).
- `ScanDetailSheet` prüfen — falls speaker-spezifisch, generisch machen (Titel-Prop).
- `AppSidebar.tsx`: keine Änderung, „Eingereichte Interviews" zeigt jetzt beide Scan-Typen.

## Technische Details

- Kein DB-Enum für `status` — Änderung nur in Frontend-Status-Map.
- Wiederverwendung: `AmpelBadge`, `ScanFindingsList`, `ScanDetailSheet`, `WatchedCounter`.
- Trigger für `updated_at` auf `post_scans` mit bestehender `update_updated_at_column()`.
