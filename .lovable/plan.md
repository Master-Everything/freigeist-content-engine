## Modul 2 — Vorab-Scan Interviewgast

Ziel: Ein Klick auf „Scan starten" prüft das Speaker-Profil gegen die Wissensbasis (BannedWords + Phase-B-Compliance-Regeln + FG-Kurator-Prompt), liefert eine **Ampel-Bewertung** (grün / gelb / rot) und konkrete Optimierungshinweise.

---

### 1. Datenbank — neue Tabelle `speaker_scans`

Speichert jeden Scan-Lauf historisch (damit man Verbesserungen über die Zeit sieht).

Felder (fachlich):
- `speaker_id` → FK auf `speakers`
- `triggered_by` → FK auf `auth.users` (wer den Scan ausgelöst hat)
- `status` → `pending` / `running` / `done` / `error`
- `verdict` → `green` / `yellow` / `red` (Ampel)
- `score` → 0–100 (für interne Sortierung)
- `summary` → kurze Gesamteinschätzung (Markdown, 2–4 Sätze)
- `findings` → JSONB Array: jeder Fund = `{ kind: "banned_word"|"compliance"|"hint", severity, field, excerpt, rule_code?, message, suggestion }`
- `model_used`, `prompt_key_used`, `prompt_version_used`, `tokens_in`, `tokens_out`, `duration_ms`
- `error_text`

RLS:
- Speaker sieht nur eigene Scans (`speaker_id` gehört zu eigenem Profil).
- Admin sieht alles.
- Insert: Speaker für eigenes Profil, Admin für jedes.

### 2. Edge Function `vorab-scan`

- Auth: JWT prüfen, User-ID ziehen.
- Input: `{ speaker_id }`.
- Berechtigung: User muss Owner des Speakers ODER Admin sein.
- Ablauf:
  1. `speaker_scans` Zeile mit `status=running` anlegen.
  2. Speaker-Daten laden (alle Textfelder + Hot-Topics + Affiliate-JSON).
  3. **Deterministischer Pre-Check** (kein LLM): BannedWords-Treffer per Wortgrenzen-Regex über alle relevanten Textfelder → Findings.
  4. **LLM-Scan** via Lovable AI Gateway (`google/gemini-2.5-flash`):
     - System-Prompt: `knowledge_prompts` Key `fg_kurator` (aktive Version).
     - User-Inhalt: strukturiertes JSON aus Speaker-Profil + Liste der aktiven Phase-B-Regeln (Code, Frage, Risiko-Antwort, Severity).
     - Antwort als JSON erzwingen (Structured Output / `response_format`):
       ```
       { verdict: "green"|"yellow"|"red", score: 0-100, summary: "...",
         findings: [{ rule_code, severity, field, excerpt, message, suggestion }] }
       ```
  5. Findings mergen (Banned + LLM), `verdict` final festlegen:
     - `red` wenn ≥1 Finding mit Severity `critical` ODER LLM `red`
     - `yellow` wenn ≥1 `high`/`warn` ODER LLM `yellow`
     - sonst `green`
  6. Zeile updaten auf `status=done`.
- Fehler: Zeile auf `status=error` setzen, **200 OK** mit `{ error }` zurückgeben (gemäß Projekt-Konvention).
- Rate-Limit / Cost-Guard: max 1 laufender Scan pro Speaker; 429- und 402-Antworten vom Gateway sauber in Toast-Meldung übersetzen.

### 3. UI

**a) Speaker-Sicht — auf `/module/vorab-scan/eingereicht`**
- Button „Profil jetzt prüfen lassen" (nur wenn Speaker-Profil existiert).
- Liste der bisherigen Scans (neueste oben): Ampel-Badge, Datum, Score, „Details ansehen".
- Detail-Panel (Sheet/Drawer):
  - Header: große Ampel + Summary
  - Sektion „Kritische Punkte" (rot), „Hinweise" (gelb), „Optimierungstipps" (grün/Info)
  - Pro Finding: Feldname, betroffene Textstelle (`excerpt`), Empfehlung, ggf. Regel-Code (klickbar → Detail aus `knowledge_compliance_rules`).
- Hinweis-Banner wenn `red`: „Bitte Profil überarbeiten und erneut scannen." mit Link zu Modul 1.

**b) Admin-Sicht — `/module/vorab-scan`**
- Tabelle aller Scans über alle Speaker: Name, Datum, Ampel, Score, Anzahl Findings, Aktion „Details".
- Filter: Verdict, Zeitraum, Suche nach Speaker-Name.
- Button „Manuellen Re-Scan auslösen" pro Speaker.

**c) Komponenten** (neu, klein gehalten):
- `AmpelBadge` (`green|yellow|red` → semantic colors aus `index.css`, kein hardcoded white/black)
- `ScanFindingsList`
- `ScanDetailSheet`
- `useSpeakerScans` Hook (React Query)
- `useStartVorabScan` Mutation Hook

### 4. Sidebar-Counter (optional, klein)
Admin-Sidebar-Footer um „X offene rote Scans" erweitern — nur wenn > 0.

### 5. Was bewusst NICHT in dieser Runde
- E-Mail-Versand an Speaker bei rotem Ergebnis (kommt in eigener Runde, nutzt `knowledge_email_templates`).
- Automatischer Re-Scan-Trigger bei Profil-Update.
- Diff-Vergleich zwischen zwei Scans.
- Streaming-UI (kommt einfaches Polling/Loading-State).

### Reihenfolge der Umsetzung
1. Migration `speaker_scans` + RLS + GRANTs (du bestätigst).
2. Edge Function `vorab-scan` deployen.
3. UI Speaker-Sicht (Button + Liste + Detail-Sheet).
4. UI Admin-Sicht (Tabelle + Filter).
5. End-to-End-Test mit deinem eigenen Speaker-Profil.

### Offene Frage
**LLM-Modell:** Empfehlung `google/gemini-2.5-flash` (kostenlos bis 13. Okt 2025, schnell, JSON-fähig). Alternative wäre `gemini-2.5-pro` für höhere Genauigkeit — langsamer und ab Okt 2025 teurer. Soll ich Flash nehmen und Pro nur als Fallback/Toggle bereithalten?
