## Ziel

1. Bugfix: `posts.status` nach Interview-Scan korrekt auf `scan_done` setzen.
2. Speaker kann ein gescanntes Interview beliebig oft entsperren, bearbeiten und neu scannen — alte Scans bleiben als Historie erhalten.
3. Speaker beantragt fertig gescannte Interviews bei der Redaktion.
4. Admin sieht Antrags-Queue und stößt Modul 3 (Profil Interviewgast) an.

## 1. Bugfix Status-Update

`supabase/functions/interview-scan/index.ts`: nach erfolgreichem Insert in `post_scans` fehlt/greift das `update posts.status = 'scan_done'` nicht. Prüfen und sicherstellen, dass der Status bei Erfolg auf `scan_done`, bei Fehler auf `erfassung` (mit `error_text` im Scan) zurückfällt. Kein Schema-Change nötig.

## 2. Re-Scan-Flow (Speaker)

**Neuer Button „Erneut bearbeiten"** in `MyPosts.tsx` — sichtbar bei `status ∈ {scan_done}`:
- Klick → `update posts set status = 'erfassung'` (mit Confirm-Dialog: „Alter Scan bleibt als Historie erhalten").
- Anschließend sind „Bearbeiten" und „Zum Scan freigeben" wieder aktiv.
- Alte `post_scans`-Einträge bleiben unverändert; im Detail-Sheet wird immer der neueste angezeigt, mit Hinweis auf ältere Versionen (optional Dropdown „Scan-Historie" — Basisumsetzung: nur neuester Scan sichtbar, alle bleiben in DB).

Bei `status = 'redaktion_angefragt'` ist Bearbeiten für den Speaker gesperrt (kein „Erneut bearbeiten"-Button).

## 3. Antrag an Redaktion

**Neuer Status:** `redaktion_angefragt` (nur Frontend-Map, `posts.status` bleibt `text`).

**In `MyPosts.tsx`:**
- Neuer Button **„Bei Redaktion einreichen"** — sichtbar bei `status = 'scan_done'`.
- Enabled-Bedingung: neuester Interview-Scan-Verdict `!= 'red'` UND neuester Speaker-Scan-Verdict des zugehörigen Speakers `!= 'red'`.
- Bei disabled: Tooltip „Bitte zuerst rote Findings im Profil- oder Interview-Scan beheben".
- Klick → Confirm-Dialog → `update posts set status = 'redaktion_angefragt'`.
- Danach: Status-Badge „Bei Redaktion eingereicht", keine Edit-/Re-Scan-Buttons mehr (Speaker kann nur noch ansehen).

**Datenquelle Enabled-Check:** Kleine Erweiterung des Loads in `MyPosts.tsx` — pro Post neuesten `post_scans.verdict` mitladen (Join oder separater Query), Speaker-Verdict via `speaker_scans` zu `posts.speaker_id`.

## 4. Admin: Antrags-Queue + Modul-3-Trigger

**In `Module2VorabScan.tsx` (Interview-Tab):**
- Neue Spalte „Antragsstatus" — zeigt `redaktion_angefragt` als farblich hervorgehobene Zeile.
- Optional: Filter/Sortierung nach angefragten Posts oben.

**Neue Aktion pro Zeile: „Profil & Sprechermappe anlegen"**
- Sichtbar wenn `posts.status = 'redaktion_angefragt'`.
- Klick → `update posts set status = 'in_bearbeitung'` → Navigation zu `/module/profil-interviewgast?post=<id>&speaker=<id>`.
- Modul 3 (`Module3Profil.tsx`) bleibt vorerst Placeholder, empfängt aber die Query-Params und zeigt sie an („Angefragt für Interview: <title>, Speaker: <name>"). Ausbau später.

## 5. Status-Map & Badges

`statusConfig` in `MyPosts.tsx` und Admin-Views erweitern:
- `erfassung` — blau „In Erfassung"
- `scan_pending` — amber „Scan läuft"
- `scan_done` — grün „Scan abgeschlossen"
- `redaktion_angefragt` — violett „Bei Redaktion eingereicht"
- `in_bearbeitung` — orange „Redaktion in Arbeit"
- `exported` — grün „Veröffentlicht"

## 6. Berechtigungen

Keine RLS-Änderungen nötig — bestehende Policies auf `posts` decken Update durch Speaker (eigene Posts) und Admin ab. `interview-scan`-Edge-Function nutzt weiterhin Service-Role.

## Technische Details

- Kein DB-Migration nötig (nur Frontend-Status + Bugfix in Edge Function).
- Wiederverwendung: `AmpelBadge`, `ScanDetailSheet`, bestehende Hooks (`usePostScans`, `useSpeakerScans`).
- Confirm-Dialogs via bestehendem `AlertDialog`-Pattern.
- Erweiterte Load-Query in `MyPosts.tsx`:
  ```
  posts.select("*, post_scans(verdict, created_at), speakers(id, speaker_scans(verdict, created_at))")
  ```
  Neueste Verdicts clientseitig ermitteln.

## Nicht-Ziele

- Ausbau Modul 3 (nur Trigger + Kontext-Übergabe).
- Historien-UI für alte Scans (Daten bleiben in DB, sichtbar wird nur der neueste — Ausbau bei Bedarf später).
