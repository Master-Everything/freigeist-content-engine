## Fix: Stat-Zähler in Modul 2 auf Summe beider Tabs umstellen

### Problem
In `src/pages/modules/Module2VorabScan.tsx` berechnet `counts` aktuell nur `activeRows` (nur den aktiven Tab). Zusätzlich zeigt der Zähler beim Interview-Tab ggf. 1 statt der tatsächlichen Anzahl, weil er nicht die kombinierten Daten nutzt.

### Änderung
Eine einzige Anpassung in `Module2VorabScan.tsx`:

- `activeRows` entfernen.
- `counts` neu berechnen aus `[...speakerRows, ...interviewRows]`:
  - `total = speakerRows.length + interviewRows.length`
  - `red/yellow/green` = Summe beider Arrays nach Verdict
- Dependency-Array auf `[speakerRows, interviewRows]` setzen.

Labels der 4 StatCards bleiben unverändert („Scans gesamt", „Rot", „Gelb", „Grün") — sie repräsentieren jetzt korrekt die Gesamtsumme über Profile und Interviews, unabhängig vom aktiven Tab.

### Nicht betroffen
- Tab-Zähler (`Speaker-Profile (n)` / `Interviews (n)`) — bleiben pro Tab.
- Filter (Suche / Verdict-Dropdown) — wirken weiterhin nur auf die sichtbare Tabelle, nicht auf die Stats.
