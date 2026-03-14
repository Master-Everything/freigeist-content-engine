

## Schriftstile von freigeistkongress.com übernehmen

Aus der Analyse der Referenzseite ergeben sich folgende typografische Unterschiede zum aktuellen Stand:

### Erkannte Stile auf freigeistkongress.com

```text
Element          | Referenz-Seite              | Aktuell in App
─────────────────┼─────────────────────────────┼──────────────────
Body-Text        | ~16px, line-height 1.8      | text-sm (14px), 1.5
H2 Section       | ~24-26px, bold, #333        | text-2xl (24px) ✓
H3 Sub-Heading   | ~20px, bold                 | text-lg (18px)
H4 Sub-Heading   | ~18px, bold                 | text-base (16px)
Listen-Items     | 16px, line-height 1.8       | text-sm (14px)
Excerpt          | ~18px, helles Grau          | text-lg ✓
Guest Bio        | ~16px, justified, lh 1.7    | text-sm (14px)
Guest Name       | ~22-24px, bold              | text-xl (20px)
Summary Text     | ~16px, lh 1.7              | text-base ✓
```

### Geplante Änderungen

**`src/components/PostPreview.tsx`**:
- Body/Section-Text: `text-sm` → `text-base` (16px) mit `leading-[1.8]`
- H3 Subheadings: `text-lg` → `text-xl`
- H4 Subheadings: `text-base` → `text-lg`
- Guest Bio: `text-sm` → `text-base`
- Guest Name: `text-xl` → `text-2xl`
- Listen-Items: Inherit `text-base` + `leading-[1.8]`
- Absatz-Abstände leicht vergrößern: `[&_p]:mb-3` → `[&_p]:mb-4`

**`src/lib/export-html.ts`**:
- Inline-Styles für `<p>`, `<li>`, `<h3>`, `<h4>` anpassen:
  - `font-size:16px; line-height:1.8` für Absätze und Listen
  - `font-size:20px` für h3, `font-size:18px` für h4
  - Guest Bio: `font-size:16px; line-height:1.7`
  - Guest Name: `font-size:1.5em`

**`src/lib/markdown.ts`**:
- Keine Änderung nötig (rein strukturell, Styles kommen von Preview/Export)

