

## Summary-Box Design anpassen (wie im Screenshot)

Der Screenshot zeigt eine klare, minimalistische Box:
- **Titel "DIE ZUSAMMENFASSUNG DES INTERVIEWS"** steht als große, fette Überschrift **über** der Box
- Die Box selbst hat einen **dünnen grauen Rahmen** (border), weißen/hellen Hintergrund
- Ein **"—"** Zeichen als Collapse-Indikator links, gefolgt vom Lead-Text (z.B. "Rettung aus dem Versicherungsdilemma...")
- Innen: Absätze mit **fett gedrucktem Anfangssatz** gefolgt von normalem Text
- Kein farbiger linker Rand, kein farbiger Hintergrund

### Änderungen in `src/components/PostPreview.tsx` (Zeilen 50-65)

- Titel (`summary_box_title`) als separates `<h2>` **oberhalb** der `<details>`-Box rendern, groß und fett, uppercase
- `<details>` Box: dünner grauer Border rundherum statt `border-l-4 border-primary bg-primary/5`
- `<summary>`: "— " Prefix vor dem Lead-Text, schlichteres Styling
- Absätze: etwas größerer Text (`text-base` statt `text-sm`), mehr Zeilenabstand

### Änderungen in `src/lib/export-html.ts`

- Gleiche Struktur im HTML-Export: Titel als `<h2>` über der `<details>`-Box, Box mit schlichtem Border-Styling

