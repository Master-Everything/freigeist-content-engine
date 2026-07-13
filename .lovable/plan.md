## Modul 4 — Sicherheitsabfragen für destruktive KI-Aktionen

Ziel: Ein versehentlicher Klick auf „Neu generieren" oder „KI-Vorschlag anwenden" darf bestehende Inhalte nicht ungefragt überschreiben.

### Umsetzung

Beide Buttons in `src/components/leitfaden/LeitfadenEditor.tsx` werden in einen shadcn `AlertDialog` eingebettet (bereits im Projekt etabliert, z. B. `SourceDataEditor.tsx`, `EditPost.tsx` — keine neue Abhängigkeit).

#### 1. „Neu generieren" (Header-Button)

- Nur der Header-Button (rechts oben, sichtbar wenn bereits ein Guide existiert) bekommt die Abfrage. Der Button im leeren Zustand („Leitfaden generieren", kein Guide vorhanden) bleibt ohne Rückfrage — dort gibt's nichts zu überschreiben.
- Dialog:
  - Titel: „Leitfaden neu generieren?"
  - Beschreibung: bestehender Entwurf inkl. Fragen, Toggle-Zustände, Interviewer-Notizen und redaktioneller Hinweise wird vollständig durch einen neuen KI-Vorschlag ersetzt, nicht rückgängig zu machen.
  - Aktionen: „Abbrechen" / „Neu generieren" → ruft die bestehende `generate()`-Funktion.

#### 2. „KI-Vorschlag anwenden" (Priorisierungs-Block)

- Dialog:
  - Titel: „KI-Vorschlag anwenden?"
  - Beschreibung: KI passt Reihenfolge und Toggle-Status aller bestehenden Fragen an und kann neue Fragen ergänzen. Bestehende manuelle Sortierung und deine Übernommen-/Verworfen-Auswahl werden dabei überschrieben. Interviewer-Notizen bleiben an ihrer Frage erhalten.
  - Aktionen: „Abbrechen" / „Anwenden" → ruft die bestehende `prioritize()`-Funktion.
- Vorhandene Disable-Bedingung (`prioritizing || !(ki_instruktionen ?? "").trim()`) bleibt am Trigger-Button; leere KI-Instruktionen führen also gar nicht erst zum Dialog.
- Während der Ausführung: Trigger disabled wie bisher (`prioritizing`- bzw. `generating`-State).

#### Button-Optik der Bestätigung

Konsistent mit den bestehenden „Überschreiben"-Dialogen im Projekt (`SourceDataEditor.tsx`, `EditPost.tsx`): `AlertDialogAction` bleibt in der Standard-Variante, **kein** roter destructive-Style. Die Warnung transportiert der Dialog-Text.

### Nicht Teil der Änderung

- Keine Logik-Änderung an `generate()`, `prioritize()`, den Edge Functions oder am Datenmodell.
- „Speichern", „Als final markieren", „Zurück zu Entwurf" bleiben ohne Rückfrage — sie zerstören keine Inhalte.
- Kein Undo/History-Feature.

### Technische Details

- Import aus `@/components/ui/alert-dialog`: `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogAction`, `AlertDialogCancel`.
- `AlertDialogTrigger asChild` umschließt den bestehenden Button, damit Styles, Icon und Loader-Verhalten unverändert bleiben.
- `AlertDialogAction` erhält `onClick={generate}` bzw. `onClick={prioritize}`, ohne className-Override.
