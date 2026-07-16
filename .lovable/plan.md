## Aufwand: gering (~0.5–1 h)

Die Infrastruktur ist bereits da: `useTimeEntries().update` mutiert beliebige Felder, RLS/Grants stehen, `toggleStatus` nutzt das schon. Es geht rein um UI in `src/pages/admin/Aufwand.tsx` – keine Migration, kein neuer Hook.

## Umsetzung

**Inline-Edit pro Zeile in der Detailliste** (pro Block-Card):

- Neuer lokaler State `editingId: string | null` in `Aufwand.tsx`.
- Stift-Icon (`Pencil` aus lucide-react) neben dem Trash-Icon in der Aktions-Spalte. Klick → `setEditingId(e.id)`.
- Ist eine Zeile im Edit-Modus, werden die Zellen durch Inputs ersetzt:
  - Datum → `<Input type="date">`
  - Aufgabe + Notiz → `<Input>` / kleines `<Textarea>` untereinander
  - Stunden → `<Input type="number" step="0.25">`
  - Netto bleibt read-only (berechnet aus Stunden × Rate)
  - Status bleibt wie gehabt per Badge-Klick
- Aktions-Spalte zeigt im Edit-Modus `Check` (Speichern) + `X` (Abbrechen) statt Stift/Trash.
- Escape = Abbrechen, Enter im Task/Stunden-Feld = Speichern.
- **Validierung vor dem `update`-Call** (identisch zum Anlegen-Dialog): `hours > 0` und `task.trim() !== ""`, sonst `toast.error` und Editor bleibt offen.
- Speichern ruft `update({ id, entry_date, task, note, hours })` und schließt den Editor bei Erfolg.
- Block-Feld absichtlich **nicht** inline editierbar (würde die Zeile aus der Gruppe reißen).

**Kein Umbau nötig an:**
- DB-Schema, Hooks, Query-Keys
- Blockübersicht (bleibt reine Anzeige)
- Anlege-Dialog

## Bekannte UX-Kleinigkeit (nicht Teil dieses Plans)

`useTimeEntries().update` invalidiert nur `onSuccess` – die Zeile kann nach Klick auf „Speichern" kurz zurück zum alten Wert flackern, bis der Refetch da ist. Falls das stört, später `onMutate` + optimistisches Cache-Update im Hook ergänzen.

## Betroffene Datei

- `src/pages/admin/Aufwand.tsx` (nur diese)
