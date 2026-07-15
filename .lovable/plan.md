## Ziel

Sauberer, dokumentierter `posts.status`-Fluss über M1–M7. Kein neues Feature — Aufräumen, Lücken schließen, Alt-Status entsorgen.

## Ist-Zustand (verifiziert)

Aktive Statuskette:

```text
erfassung → scan_pending → scan_done → redaktion_angefragt → in_bearbeitung
        → profil → profil_review → leitfaden → leitfaden_final
        → vorgespraech → vorgespraech_done → aufzeichnung → aufzeichnung_done
```

DB-`posts_status_check` erlaubt zusätzlich Alt-Werte: `vorab_scan`, `draft`, `in_progress`, `exported`. Bestand per `SELECT status, count(*) FROM posts GROUP BY status` bestätigt:

```text
aufzeichnung  1
erfassung     1
in_progress   2
profil        1
```

→ Nur `in_progress` (2 Rows) muss migriert werden.

Bekannte Lücken:

1. Kein Status nach M7-Push — `push-to-hub` schreibt nur `hub_*`-Felder, `posts.status` bleibt auf `aufzeichnung_done`.
2. `InterviewEdit.LOCKED_FOR_SPEAKER` kennt nur `scan_pending`, `scan_done`, `in_progress`, `exported` — späte Status fehlen.
3. Alt-Wert `exported` wird noch in `DashboardHome.tsx`/`Index.tsx` gelesen (Filter/Tab/Dropdown), aber nirgends mehr geschrieben. Nach Migration bliebe die „Exportiert"-Ansicht sonst leer.

Explizit **nicht** offen (bereits korrekt im Code): `speaker-profile-decision`, `interview-guide-decision`, `vorgespraech_done → aufzeichnung`-Auto-Transition, sowie **M6 „Aufzeichnung abschließen / Wieder öffnen"** (UI + `decide()` → `recording-decision` bereits vollständig verdrahtet).

## Umsetzung (in dieser Reihenfolge)

### 0. Migration: Constraint erweitern und Alt-Status aufräumen

Eine Migration, die:
- Datenkorrektur zuerst: `UPDATE posts SET status='erfassung' WHERE status IN ('in_progress','vorab_scan','draft','exported')` (bestätigt: 2 Rows betroffen).
- `posts_status_check` neu setzt auf die endgültige Whitelist:
  `erfassung, scan_pending, scan_done, redaktion_angefragt, in_bearbeitung, profil, profil_review, leitfaden, leitfaden_final, vorgespraech, vorgespraech_done, aufzeichnung, aufzeichnung_done, hub_pushed`.

Erst danach dürfen Frontend/Function `'hub_pushed'` schreiben.

### 1. Helper: `src/lib/post-status.ts`

- `POST_STATUS_ORDER` mit der finalen Kette (inkl. `hub_pushed`).
- `advanceStatus(current, next)` gibt `next` nur zurück, wenn es in der Kette **nach** `current` liegt, sonst `current`. Verhindert versehentliches Zurücksetzen aus Client-Code.

### 2. M7: Status nach erfolgreichem Push

In `supabase/functions/push-to-hub/index.ts` (Success-`update`, Zeile 134–138) zusätzlich `status: 'hub_pushed'` setzen. Guard: nur setzen, wenn aktueller `posts.status` nicht bereits `hub_pushed` ist. `EditPost.tsx` bleibt unverändert.

### 3. Speaker-Lock erweitern

`src/pages/modules/interview/InterviewEdit.tsx` → `LOCKED_FOR_SPEAKER` bekommt zusätzlich: `redaktion_angefragt`, `in_bearbeitung`, `profil`, `profil_review`, `leitfaden`, `leitfaden_final`, `vorgespraech`, `vorgespraech_done`, `aufzeichnung`, `aufzeichnung_done`, `hub_pushed`. Alt-Werte `in_progress`/`exported` fliegen raus.

**Umfang (bestätigt):** Sperre greift bewusst bereits ab `redaktion_angefragt`, weil ab dann die Redaktion die Interview-Stammdaten verantwortet. Sperre betrifft **ausschließlich `posts`-Felder** (Titel, Thema, Produkt, Marktdauer, bisherige Interviews, kritische Stimmen, `selected_affiliate_indices`) über `InterviewEdit.tsx`. `speakers`-Stammdaten (E-Mail, Telefon, Website, Social-Links, Bio, `top_affiliate_products` inkl. Links) bleiben in `SpeakerForm.tsx` unabhängig von `posts.status` jederzeit editierbar — dort keine Änderung.

### 4. Dashboard-Filter auf `hub_pushed` umstellen

- `src/pages/DashboardHome.tsx`: `jumpToList(8, "exported")` und alle `posts.filter(p => p.status !== "exported")` / `=== "exported"` auf `hub_pushed` umstellen.
- `src/pages/Index.tsx`: `statusConfig`-Eintrag `exported` → `hub_pushed` (Label: „An Hub gesendet"), Dropdown-Option analog. `in_progress`/`draft`-Optionen entfernen; sinnvolle aktive Status stattdessen (`erfassung`, `aufzeichnung_done`, `hub_pushed`).

### 5. Dokumentation: `docs/status-flow.md`

- Diagramm der finalen Kette.
- Tabelle „Modul → liest Status / schreibt Status / über welche Function".
- Hinweis, dass neue Client-Schreibpfade `advanceStatus()` bzw. den serverseitigen Guard benutzen müssen.

## Bewusst NICHT in diesem Plan

- Neuer PG-Enum-Typ für `posts.status` (Constraint reicht).
- Umbenennungen (`redaktion_angefragt`, `leitfaden_final`).
- Rückkanal aus dem Hub für `published`.
- Änderungen an `SpeakerForm.tsx` / `speakers`-Feldern.
- Anfassen von `speaker-profile-decision`, `interview-guide-decision`, `recording-decision`, `Module6Aufzeichnung.tsx` — bereits korrekt.
