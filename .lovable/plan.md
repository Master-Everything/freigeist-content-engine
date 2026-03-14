

## Summary-Box: "—" entfernen, nur +/− als Toggle

Das Problem: Vor dem Lead-Text steht aktuell immer ein "— " (Gedankenstrich), das soll weg. Nur das `+` / `−` Icon soll den Zustand anzeigen.

### Änderung in `src/components/PostPreview.tsx` (Zeile 60)

- `<>— {b.summary_lead}</>` → `{b.summary_lead}`
- `"— Zusammenfassung"` → `"Zusammenfassung"`

### Änderung in `src/lib/export-html.ts`

- Gleiche Anpassung: `— ` Prefix aus der Summary-Zeile entfernen

