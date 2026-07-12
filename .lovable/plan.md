## Plan: Kompaktes Fragen-Layout & Notiz-Icon links nachziehen

Claudes Prüfung ist korrekt: Aktuell ist nur die Notiz-Textarea auf `rows={1}` mit `min-h-0` angepasst. Der eigentliche kompakte Layout-Umbau fehlt im Code noch und sollte nachgezogen werden.

### 1. Notiz-Icon nach links verschieben
- Das `StickyNote`-Icon kommt in die linke Spalte zur Nummer und zum Übernehmen-Switch.
- Der Indikator-Punkt bleibt erhalten, wenn eine `interviewer_notiz` existiert.
- Das Icon bleibt unauffällig, aber direkt an der Frage verortet.

### 2. Frage-Textarea wirklich kompakter machen
- Die Haupt-Frage-Textarea bekommt `rows={1}` statt `rows={2}`.
- Zusätzlich bekommt sie `className="flex-1 min-h-0"`, damit die shadcn-Standardhöhe von `min-h-[80px]` überschrieben wird.
- Dadurch verschwindet der größte Teil des aktuell unnötigen vertikalen Abstands.

### 3. Karten und Abstände reduzieren
- Frage-Card von `p-2` auf kompaktere Innenabstände umstellen, z. B. `px-2 py-1.5`.
- Abstand zwischen Fragen von `space-y-2` auf `space-y-1.5` reduzieren.
- Interne Flex-Gaps leicht reduzieren, ohne die Bedienbarkeit zu verschlechtern.

### 4. Rechte Button-Spalte verschlanken
- Rechts bleiben nur Sortieren hoch/runter und Entfernen.
- Diese Buttons werden kleiner dimensioniert, z. B. über kompaktere Klassen wie `h-7 w-7`.
- Icons bleiben bei `h-4 w-4`, damit sie weiterhin gut erkennbar sind.

### 5. Notizbereich passend ausrichten
- Der aufgeklappte Notizbereich wird an das neue Layout angepasst.
- `pl-10 pr-12` wird durch eine kompaktere Ausrichtung ersetzt, z. B. `pl-12 pr-2`, damit die Notiz unter dem Fragetext sauber sitzt und nicht unnötig eingerückt wirkt.
- Die Notiz-Textarea bleibt wie entschieden bei `rows={1}` und `min-h-0`.

### Technische Details
- Änderung nur in `src/components/leitfaden/LeitfadenEditor.tsx`.
- Keine Datenmodell-, Backend- oder Speicherlogik-Änderung.
- Die bestehenden Funktionen für Speichern, KI-Priorisierung, Notiz-Erhalt und Speaker-Ausblendung bleiben unverändert.