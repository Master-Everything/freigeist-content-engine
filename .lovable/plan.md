

## + / − Icon Fix für Summary-Box

Der aktuelle Code nutzt `group-open:hidden` und `group-open:inline-flex` auf Tailwind-Basis. Das funktioniert möglicherweise nicht zuverlässig mit dem nativen `<details>`-Element.

### Lösung

**`src/components/PostPreview.tsx`**: Statt CSS-only Ansatz einen React-State (`useState`) verwenden:
- `const [summaryOpen, setSummaryOpen] = useState(false)`
- `<details>` bekommt `open={summaryOpen}` und `onToggle`-Handler
- `+` wird angezeigt wenn `!summaryOpen`, `−` wenn `summaryOpen`
- Kein Verlassen auf `group-open` Tailwind-Klassen mehr

**`src/lib/export-html.ts`**: Bleibt bei statischem `+` (geschlossen als Default), keine Änderung nötig.

