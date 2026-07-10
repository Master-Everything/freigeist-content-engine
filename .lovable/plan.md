## Admin-Einreichung in Modul 2 ermöglichen

### Ziel
Admin soll ein Interview direkt aus Modul 2 (Tab „Interviews") „Bei Redaktion einreichen" können — analog zum Speaker-Button in Modul 1.

### Änderung nur in `src/pages/modules/Module2VorabScan.tsx`

**1. Daten erweitern**
- Query um Speaker-Verdict ergänzen: `posts(..., speakers(id, speaker_scans(verdict, created_at)))`.
- Neuestes Speaker-Scan-Verdict pro Zeile ableiten (`latest_speaker_verdict`).

**2. Neuer Button „Bei Redaktion einreichen"**
- Sichtbar wenn `post.status === "scan_done"`.
- Setzt `posts.status = 'redaktion_angefragt'` und lädt neu.
- Deaktiviert (mit Tooltip-Grund) wenn:
  - Interview-Verdict = red → „Interview-Scan rot"
  - Speaker-Verdict = red → „Profil-Scan rot"
  - Speaker-Verdict fehlt → „Profil noch nicht gescannt"
- Loading-Spinner via lokalem State.

**3. Status-Badges erweitern**
- `scan_done` → grüner Badge „Scan abgeschlossen" (damit klar ist, wann Button erscheint).
- Bestehende Badges (`redaktion_angefragt`, `in_bearbeitung`) bleiben.

### Nicht betroffen
- Speaker-Flow in `MyPosts.tsx` bleibt unverändert.
- Regeln (rot blockiert, gelb/grün ok) identisch mit Speaker-Seite.
- „Profil anlegen"-Button bleibt für `redaktion_angefragt`.
